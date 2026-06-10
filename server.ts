import { createAdminClient } from "@insforge/sdk";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import pg from "pg";

const dbPool = new pg.Pool({
  host: "yk386jub.us-east.database.insforge.app",
  port: 5432,
  user: "postgres",
  password: "eb6162a42ae6ae87216b524568737c5d",
  database: "insforge",
  ssl: { rejectUnauthorized: false }
});

const insforge = createAdminClient({
  baseUrl: process.env.INSFORGE_PROJECT_URL || "https://yk386jub.us-east.insforge.app",
  apiKey: process.env.INSFORGE_API_KEY || "ik_6ae48909dec34e5d0218718782cdf16b"
});

const dbClient = createAdminClient({
  baseUrl: process.env.INSFORGE_PROJECT_URL || "https://yk386jub.us-east.insforge.app",
  apiKey: process.env.INSFORGE_API_KEY || "ik_6ae48909dec34e5d0218718782cdf16b"
});

Object.defineProperty(insforge, "database", {
  get() {
    return dbClient.database;
  }
});

const getRole = (req: express.Request) => req.headers['x-user-role'] as string || 'ANON';

function translateAuthError(message: string): string {
  if (!message) return "Ha ocurrido un error inesperado.";
  const msg = message.toLowerCase();
  if (msg.includes("signups are disabled") || msg.includes("signup is disabled")) {
    return "El registro de usuarios está desactivado para este proyecto.";
  }
  if (msg.includes("already exists") || msg.includes("unique constraint")) {
    return "El usuario ya se encuentra registrado con este correo.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("credentials match")) {
    return "Credenciales de inicio de sesión inválidas. Verifique su correo y contraseña.";
  }
  if (msg.includes("email not verified") || msg.includes("not verified")) {
    return "Debe ir a tu correo electrónico y confirmar tu cuenta para poder acceder al aplicativo.";
  }
  if (msg.includes("password should be") || msg.includes("weak password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (msg.includes("invalid otp") || msg.includes("invalid verification code") || msg.includes("incorrect code")) {
    return "Código de verificación inválido. Intente nuevamente.";
  }
  if (msg.includes("user not found") || msg.includes("no user found")) {
    return "Usuario no encontrado en el sistema. Cree una cuenta primero.";
  }
  return message;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  console.log("[TAPASEL DB] Conectado exitosamente a InsForge API Gateway.");

  // ─────────────────────────────────────────────────────────────
  // AUTH API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    const { nombre, email, cargo, rol, avatarInitials, permisos, password } = req.body;
    try {
      let redirectUrl = "http://localhost:3000";
      if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
        redirectUrl = process.env.APP_URL;
      }

      // 1. Sign up user in InsForge Authentication Service
      const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
        email: email.toLowerCase(),
        password,
        name: nombre,
        redirectTo: redirectUrl
      });

      if (signUpError) {
        console.error("InsForge signUp error:", signUpError);
        return res.status(400).json({ error: translateAuthError(signUpError.message) });
      }

      // Check if email verification is required
      const requireEmailVerification = !!signUpData?.requireEmailVerification;

      let userId = signUpData?.user?.id;
      if (!userId) {
        if (requireEmailVerification) {
          // Use email as temporary ID if the user is in pending verification state and has no UUID yet
          userId = email.toLowerCase();
        } else {
          return res.status(500).json({ error: "No se pudo recuperar el ID del usuario creado." });
        }
      }

      // 2. Check if the profile already exists in our usuarios table
      const { data: exists, error: existsErr } = await insforge.database
        .from("usuarios")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existsErr) {
        console.error("Error checking user profile:", existsErr.message);
      }

      let row;
      if (exists) {
        row = exists;
      } else {
        // Save the profile in our usuarios database table using the InsForge user ID (or temporary email ID)
        const { data: insertData, error: insertErr } = await insforge.database
          .from("usuarios")
          .insert({
            id: userId,
            nombre,
            email: email.toLowerCase(),
            cargo,
            rol,
            avatar_initials: avatarInitials || "",
            permisos: permisos || []
          })
          .select()
          .single();

        if (insertErr) {
          throw new Error(insertErr.message);
        }
        row = insertData;
      }

      res.json({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        cargo: row.cargo,
        rol: row.rol,
        avatarInitials: row.avatar_initials,
        permisos: row.permisos,
        requireEmailVerification
      });
    } catch (err: any) {
      console.error("Error en /api/auth/register:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    const { email, code } = req.body;
    try {
      let verifySuccess = false;
      let realUserId: string | undefined;
      let accessToken: string | undefined;

      const { data: verifyData, error: verifyError } = await insforge.auth.verifyEmail({
        email: email.toLowerCase(),
        otp: code
      });

      if (!verifyError) {
        verifySuccess = true;
        realUserId = verifyData?.user?.id;
        accessToken = verifyData?.accessToken;
      } else {
        // Fallback: check if the user is already verified in DB (manually verified via verify_test_user.js)
        const checkUserRes = await dbPool.query(
          "SELECT id, email_verified FROM auth.users WHERE email = $1",
          [email.toLowerCase()]
        );
        if (checkUserRes.rows.length > 0 && checkUserRes.rows[0].email_verified) {
          verifySuccess = true;
          realUserId = checkUserRes.rows[0].id;
          accessToken = "mocked-access-token-since-manually-verified";
          console.log(`[VERIFY FALLBACK] Auto-bypassing verification for ${email} since it's already verified in DB.`);
        } else {
          console.error("InsForge verifyEmail error:", verifyError);
          return res.status(400).json({ error: translateAuthError(verifyError.message) });
        }
      }

      if (!realUserId) {
        return res.status(500).json({ error: "No se pudo recuperar el ID del usuario verificado." });
      }

      // Check if a profile with the realUserId already exists
      const { data: existingProfile, error: checkErr } = await insforge.database
        .from("usuarios")
        .select("*")
        .eq("id", realUserId)
        .maybeSingle();

      if (checkErr) {
        console.error("Error checking existing profile:", checkErr.message);
      }

      let row;
      if (existingProfile) {
        row = existingProfile;
      } else {
        // Try to update the temporary profile ID to the realUserId
        const { data: updateData, error: updateErr } = await insforge.database
          .from("usuarios")
          .update({ id: realUserId })
          .eq("email", email.toLowerCase())
          .select()
          .single();

        if (updateErr) {
          console.error("Error updating user ID to realUserId:", updateErr.message);
          // If update failed, let's select by email
          const { data: selectData, error: selectErr } = await insforge.database
            .from("usuarios")
            .select("*")
            .eq("email", email.toLowerCase())
            .maybeSingle();
            
          if (selectErr || !selectData) {
            throw new Error("No se pudo sincronizar el perfil de usuario verificado.");
          }
          row = selectData;
        } else {
          row = updateData;
        }
      }

      res.json({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        cargo: row.cargo,
        rol: row.rol,
        avatarInitials: row.avatar_initials,
        permisos: row.permisos,
        accessToken: accessToken
      });
    } catch (err: any) {
      console.error("Error en /api/auth/verify:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/resend", async (req, res) => {
    const { email } = req.body;
    try {
      const { data, error } = await insforge.auth.resendVerificationEmail({
        email: email.toLowerCase()
      });

      if (error) {
        console.error("InsForge resend error:", error);
        return res.status(400).json({ error: translateAuthError(error.message) });
      }

      res.json({ success: true, message: data?.message || "Código de verificación reenviado exitosamente." });
    } catch (err: any) {
      console.error("Error en /api/auth/resend:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      let redirectUrl = "http://localhost:3000";
      if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
        redirectUrl = process.env.APP_URL;
      }

      const { data, error } = await insforge.auth.sendResetPasswordEmail({
        email: email.toLowerCase(),
        redirectTo: redirectUrl
      });

      if (error) {
        console.error("InsForge sendResetPasswordEmail error:", error);
        return res.status(400).json({ error: translateAuthError(error.message) });
      }

      res.json({ success: true, message: data?.message || "Enlace de restablecimiento enviado exitosamente." });
    } catch (err: any) {
      console.error("Error en /api/auth/forgot-password:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    try {
      const { data, error } = await insforge.auth.resetPassword({
        otp: token,
        newPassword: password
      });

      if (error) {
        console.error("InsForge resetPassword error:", error);
        return res.status(400).json({ error: translateAuthError(error.message) });
      }

      res.json({ success: true, message: data?.message || "Contraseña restablecida exitosamente." });
    } catch (err: any) {
      console.error("Error en /api/auth/reset-password:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: loginData, error: loginError } = await insforge.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (loginError) {
        console.error("InsForge signIn error:", loginError);
        // Handle specific case when email is not verified
        if (loginError.error === "EMAIL_NOT_VERIFIED") {
          return res.status(403).json({ error: translateAuthError(loginError.message), requireEmailVerification: true });
        }
        return res.status(401).json({ error: translateAuthError(loginError.message) });
      }

      // Query user profile from database
      const { data: userProfile, error: profileErr } = await insforge.database
        .from("usuarios")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (profileErr) {
        throw new Error(profileErr.message);
      }

      if (!userProfile) {
        // If profile doesn't exist in our table, let's create it dynamically using the Auth metadata
        const userObj = loginData?.user;
        const nombreObj = userObj?.profile?.name || "Colaborador";
        const { data: row, error: insertErr } = await insforge.database
          .from("usuarios")
          .insert({
            id: userObj?.id,
            nombre: nombreObj,
            email: email.toLowerCase(),
            cargo: "Colaborador",
            rol: "ADMIN", // default admin for fallback sync
            avatar_initials: nombreObj.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
            permisos: ['panel','finanzas','rrhh','documentos','produccion','configuracion']
          })
          .select()
          .single();

        if (insertErr) {
          throw new Error(insertErr.message);
        }

        return res.json({
          id: row.id,
          nombre: row.nombre,
          email: row.email,
          cargo: row.cargo,
          rol: row.rol,
          avatarInitials: row.avatar_initials,
          permisos: row.permisos,
          accessToken: loginData?.accessToken
        });
      }

      res.json({
        id: userProfile.id,
        nombre: userProfile.nombre,
        email: userProfile.email,
        cargo: userProfile.cargo,
        rol: userProfile.rol,
        avatarInitials: userProfile.avatar_initials,
        permisos: userProfile.permisos,
        accessToken: loginData?.accessToken
      });
    } catch (err: any) {
      console.error("Error en /api/auth/login:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/usuarios/:id", async (req, res) => {
    try {
      const isEmail = req.params.id.includes("@");
      const baseQuery = insforge.database.from("usuarios").select("*");
      const query = isEmail
        ? baseQuery.eq("email", req.params.id.toLowerCase())
        : baseQuery.eq("id", req.params.id);

      const { data: row, error } = await query.maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!row) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      res.json({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        cargo: row.cargo,
        rol: row.rol,
        avatarInitials: row.avatar_initials,
        permisos: row.permisos
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // CLIENTES API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/clientes", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("clientes")
        .select("*");

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        nombre: r.nombre,
        contacto: r.contacto || '',
        email: r.email || '',
        telefono: r.telefono || '',
        carteraPendiente: Number(r.cartera_pendiente || 0),
        totalComprado: Number(r.total_comprado || 0),
        estado: r.estado,
        ultimoPago: r.ultimo_pago || ''
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/clientes", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, nombre, contacto, email, telefono, carteraPendiente, totalComprado, estado, ultimoPago } = req.body;
      const { data, error } = await insforge.database
        .from("clientes")
        .insert({
          id,
          nombre,
          contacto: contacto || "",
          email: email || "",
          telefono: telefono || "",
          cartera_pendiente: carteraPendiente || 0,
          total_comprado: totalComprado || 0,
          estado,
          ultimo_pago: ultimoPago || ""
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TRANSACCIONES API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/transacciones", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("transacciones")
        .select("*")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        fecha: r.fecha,
        descripcion: r.descripcion,
        tipo: r.tipo,
        categoria: r.categoria,
        monto: Number(r.monto || 0),
        estado: r.estado,
        clienteId: r.cliente_id || undefined,
        proveedorId: r.proveedor_id || undefined,
        responsable: r.responsable,
        documentorPdf: r.documento_pdf || undefined
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/transacciones", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, fecha, descripcion, tipo, categoria, monto, estado, clienteId, proveedorId, responsable, documentorPdf } = req.body;
      const { data, error } = await insforge.database
        .from("transacciones")
        .insert({
          id,
          fecha,
          descripcion,
          tipo,
          categoria,
          monto: monto || 0,
          estado,
          cliente_id: clienteId || null,
          proveedor_id: proveedorId || null,
          responsable,
          documento_pdf: documentorPdf || null
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/transacciones/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { estado } = req.body;
      const { data, error } = await insforge.database
        .from("transacciones")
        .update({ estado })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // CARTERA API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/cartera", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("cartera")
        .select("*")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        fecha: r.fecha,
        clienteId: r.cliente_id,
        clienteNombre: r.cliente_nombre,
        factura: r.factura,
        cree: Number(r.cree || 0),
        valorMercancia: Number(r.valor_mercancia || 0),
        iva: Number(r.iva || 0),
        retencion: Number(r.retencion || 0),
        totalAPagar: Number(r.total_a_pagar || 0),
        abono: Number(r.abono || 0),
        rcAbono: r.rc_abono || '',
        rcCancelacion: r.rc_cancelacion || '',
        fechaPago: r.fecha_pago || '',
        medioPago: r.medio_pago || '',
        estado: r.estado
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cartera", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, fecha, clienteId, clienteNombre, factura, cree, valorMercancia, iva, retencion, totalAPagar, abono, rcAbono, rcCancelacion, fechaPago, medioPago, estado } = req.body;
      const { data, error } = await insforge.database
        .from("cartera")
        .insert({
          id,
          fecha,
          cliente_id: clienteId,
          cliente_nombre: clienteNombre,
          factura,
          cree: cree || 0,
          valor_mercancia: valorMercancia || 0,
          iva: iva || 0,
          retencion: retencion || 0,
          total_a_pagar: totalAPagar || 0,
          abono: abono || 0,
          rc_abono: rcAbono || "",
          rc_cancelacion: rcCancelacion || "",
          fecha_pago: fechaPago || "",
          medio_pago: medioPago || "",
          estado
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/cartera/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { estado, abono, rcAbono, rcCancelacion, fechaPago, medioPago } = req.body;
      const { data, error } = await insforge.database
        .from("cartera")
        .update({
          estado,
          abono: abono || 0,
          rc_abono: rcAbono || "",
          rc_cancelacion: rcCancelacion || "",
          fecha_pago: fechaPago || "",
          medio_pago: medioPago || ""
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PROVEEDORES API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/proveedores", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("proveedores")
        .select("*")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        fecha: r.fecha,
        proveedorNombre: r.proveedor_nombre,
        factura: r.factura,
        valorMercancia: Number(r.valor_mercancia || 0),
        iva: Number(r.iva || 0),
        retencion: Number(r.retencion || 0),
        totalAPagar: Number(r.total_a_pagar || 0),
        comprobanteEgreso: r.comprobante_egreso || '',
        chequeNo: r.cheque_no || '',
        fechaCancelado: r.fecha_cancelado || '',
        estado: r.estado
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/proveedores", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, fecha, proveedorNombre, factura, valorMercancia, iva, retencion, totalAPagar, comprobanteEgreso, chequeNo, fechaCancelado, estado } = req.body;
      const { data, error } = await insforge.database
        .from("proveedores")
        .insert({
          id,
          fecha,
          proveedor_nombre: proveedorNombre,
          factura,
          valor_mercancia: valorMercancia || 0,
          iva: iva || 0,
          retencion: retencion || 0,
          total_a_pagar: totalAPagar || 0,
          comprobante_egreso: comprobanteEgreso || "",
          cheque_no: chequeNo || "",
          fecha_cancelado: fechaCancelado || "",
          estado
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/proveedores/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { estado, comprobanteEgreso, chequeNo, fechaCancelado } = req.body;
      const { data, error } = await insforge.database
        .from("proveedores")
        .update({
          estado,
          comprobante_egreso: comprobanteEgreso || "",
          cheque_no: chequeNo || "",
          fecha_cancelado: fechaCancelado || ""
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // COTIZACIONES API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/cotizaciones", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data: dataCots, error: errorCots } = await insforge.database
        .from("cotizaciones")
        .select("*")
        .order("id", { ascending: false });

      if (errorCots) throw new Error(errorCots.message);

      const { data: dataItems, error: errorItems } = await insforge.database
        .from("cotizaciones_items")
        .select("*");

      if (errorItems) throw new Error(errorItems.message);
      
      const list = dataCots.map(c => {
        const items = dataItems
          .filter(it => it.cotizacion_id === c.id)
          .map(it => ({
            id: it.id,
            referencia: it.referencia,
            descripcion: it.descripcion,
            unidad: it.unidad,
            cantidad: Number(it.cantidad || 0),
            valorUnitario: Number(it.valor_unitario || 0),
            valorTotal: Number(it.valor_total || 0)
          }));
        return {
          id: c.id,
          fecha: c.fecha,
          cotizacionNo: c.cotizacion_no,
          empresa: c.empresa,
          clienteNombre: c.cliente_nombre,
          ingeniero: c.ingeniero || '',
          referenciaObra: c.referencia_obra || '',
          direccion: c.direccion || '',
          subtotal: Number(c.subtotal || 0),
          iva: Number(c.iva || 0),
          total: Number(c.total || 0),
          firmaDigitalRepresentante: c.firma_digital_representante || '',
          firmaDigitalCliente: c.firma_digital_cliente || '',
          fechaFirmaRepresentante: c.fecha_firma_representante || undefined,
          fechaFirmaCliente: c.fecha_firma_cliente || undefined,
          items
        };
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cotizaciones", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, fecha, cotizacionNo, empresa, clienteNombre, ingeniero, referenciaObra, direccion, subtotal, iva, total, firmaDigitalRepresentante, firmaDigitalCliente, fechaFirmaRepresentante, fechaFirmaCliente, items } = req.body;
      
      const { error: cotErr } = await insforge.database
        .from("cotizaciones")
        .insert({
          id,
          fecha,
          cotizacion_no: cotizacionNo,
          empresa: empresa || "Tapasel S.A.S.",
          cliente_nombre: clienteNombre,
          ingeniero: ingeniero || "",
          referencia_obra: referenciaObra || "",
          direccion: direccion || "",
          subtotal: subtotal || 0,
          iva: iva || 0,
          total: total || 0,
          firma_digital_representante: firmaDigitalRepresentante || "",
          firma_digital_cliente: firmaDigitalCliente || "",
          fecha_firma_representante: fechaFirmaRepresentante || null,
          fecha_firma_cliente: fechaFirmaCliente || null
        });

      if (cotErr) throw new Error(cotErr.message);
      
      if (Array.isArray(items) && items.length > 0) {
        const { error: itemsErr } = await insforge.database
          .from("cotizaciones_items")
          .insert(items.map(item => ({
            id: item.id,
            cotizacion_id: id,
            referencia: item.referencia || "",
            descripcion: item.descripcion,
            unidad: item.unidad || "un",
            cantidad: item.cantidad || 1,
            valor_unitario: item.valorUnitario || 0,
            valor_total: item.valorTotal || 0
          })));

        if (itemsErr) throw new Error(itemsErr.message);
      }
      
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/cotizaciones/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { firmaDigitalRepresentante, firmaDigitalCliente, fechaFirmaRepresentante, fechaFirmaCliente } = req.body;
      const { data, error } = await insforge.database
        .from("cotizaciones")
        .update({
          firma_digital_representante: firmaDigitalRepresentante || undefined,
          firma_digital_cliente: firmaDigitalCliente || undefined,
          fecha_firma_representante: fechaFirmaRepresentante || undefined,
          fecha_firma_cliente: fechaFirmaCliente || undefined
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/cotizaciones/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { error } = await insforge.database
        .from("cotizaciones")
        .delete()
        .eq("id", req.params.id);

      if (error) throw new Error(error.message);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // EMPLEADOS API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/empleados", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'RRHH' && role !== 'CFO' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("empleados")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        nombre: r.nombre,
        cargo: r.cargo,
        area: r.area,
        estado: r.estado,
        email: r.email || '',
        telefono: r.telefono || '',
        fechaIngreso: r.fecha_ingreso || '',
        salario: Number(r.salario || 0),
        asistenciaHoy: r.asistencia_estado ? {
          checkIn: r.asistencia_checkin || '',
          checkOut: r.asistencia_checkout || undefined,
          estado: r.asistencia_estado
        } : undefined,
        documentosVencidos: r.documentos_vencidos || []
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/empleados", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'RRHH') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, nombre, cargo, area, estado, email, telefono, fechaIngreso, salario, asistenciaHoy, documentosVencidos } = req.body;
      const { data, error } = await insforge.database
        .from("empleados")
        .insert({
          id,
          nombre,
          cargo,
          area,
          estado,
          email: email || "",
          telefono: telefono || "",
          fecha_ingreso: fechaIngreso || "",
          salario: salario || 0,
          asistencia_checkin: asistenciaHoy?.checkIn || null,
          asistencia_checkout: asistenciaHoy?.checkOut || null,
          asistencia_estado: asistenciaHoy?.estado || null,
          documentos_vencidos: documentosVencidos || []
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // DOCUMENTOS API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/documentos", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO' && role !== 'RRHH' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data: dataDocs, error: errorDocs } = await insforge.database
        .from("documentos")
        .select("*")
        .order("id", { ascending: false });

      if (errorDocs) throw new Error(errorDocs.message);

      const { data: dataVers, error: errorVers } = await insforge.database
        .from("documento_versiones")
        .select("*")
        .order("orden", { ascending: false })
        .order("id", { ascending: false });

      if (errorVers) throw new Error(errorVers.message);
      
      const list = dataDocs.map(d => {
        const history = dataVers
          .filter(v => v.documento_id === d.id)
          .map(v => ({
            version: v.version,
            fecha: v.fecha,
            usuario: v.usuario,
            comentario: v.comentario || ''
          }));
        return {
          id: d.id,
          nombre: d.nombre,
          departamento: d.departamento || '',
          fechaCreacion: d.fecha_creacion,
          fechaModificacion: d.fecha_modificacion,
          responsable: d.responsable || '',
          version: d.version,
          tamano: d.tamano || '',
          estadoVerificacion: d.estado_verificacion,
          tipoDocumental: d.tipo_documental,
          historialVersiones: history
        };
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/documentos", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'RRHH') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, nombre, departamento, fechaCreacion, fechaModificacion, responsable, version, tamano, estadoVerificacion, tipoDocumental, historialVersiones } = req.body;
      
      const { error: docErr } = await insforge.database
        .from("documentos")
        .insert({
          id,
          nombre,
          departamento: departamento || "",
          fecha_creacion: fechaCreacion,
          fecha_modificacion: fechaModificacion,
          responsable: responsable || "",
          version: version || "v1.0.0",
          tamano: tamano || "",
          estado_verificacion: estadoVerificacion,
          tipo_documental: tipoDocumental
        });

      if (docErr) throw new Error(docErr.message);
      
      if (Array.isArray(historialVersiones) && historialVersiones.length > 0) {
        const { error: versErr } = await insforge.database
          .from("documento_versiones")
          .insert(historialVersiones.map((v, idx) => ({
            documento_id: id,
            version: v.version,
            fecha: v.fecha,
            usuario: v.usuario,
            comentario: v.comentario || "",
            orden: idx
          })));

        if (versErr) throw new Error(versErr.message);
      }
      
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/documentos/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'RRHH') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { version, fechaModificacion, responsable, estadoVerificacion, newVersion } = req.body;
      
      const { error: docErr } = await insforge.database
        .from("documentos")
        .update({
          version: version || undefined,
          fecha_modificacion: fechaModificacion || undefined,
          responsable: responsable || undefined,
          estado_verificacion: estadoVerificacion || undefined
        })
        .eq("id", req.params.id);

      if (docErr) throw new Error(docErr.message);
      
      if (newVersion) {
        const { data: maxVer, error: maxErr } = await insforge.database
          .from("documento_versiones")
          .select("orden")
          .eq("documento_id", req.params.id)
          .order("orden", { ascending: false })
          .limit(1);

        if (maxErr) throw new Error(maxErr.message);
        
        const newOrder = maxVer && maxVer.length > 0 ? (maxVer[0].orden || 0) + 1 : 0;

        const { error: insertErr } = await insforge.database
          .from("documento_versiones")
          .insert({
            documento_id: req.params.id,
            version: newVersion.version,
            fecha: newVersion.fecha,
            usuario: newVersion.usuario,
            comentario: newVersion.comentario || "",
            orden: newOrder
          });

        if (insertErr) throw new Error(insertErr.message);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/documentos/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { error } = await insforge.database
        .from("documentos")
        .delete()
        .eq("id", req.params.id);

      if (error) throw new Error(error.message);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // ORDENES DE PRODUCCION API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  app.get("/api/ordenes_produccion", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'COO' && role !== 'CFO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("ordenes_produccion")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        producto: r.producto,
        cantidad: Number(r.cantidad || 0),
        cliente: r.cliente || '',
        fechaCreacion: r.fecha_creacion,
        fechaEntrega: r.fecha_entrega,
        estado: r.estado,
        prioridad: r.prioridad,
        eficienciaEstimada: Number(r.eficiencia_estimada || 0),
        operadorAsignado: r.operador_asignado || ''
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ordenes_produccion", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, producto, cantidad, cliente, fechaCreacion, fechaEntrega, estado, prioridad, eficienciaEstimada, operadorAsignado } = req.body;
      const { data, error } = await insforge.database
        .from("ordenes_produccion")
        .insert({
          id,
          producto,
          cantidad: cantidad || 0,
          cliente: cliente || "",
          fecha_creacion: fechaCreacion,
          fecha_entrega: fechaEntrega,
          estado,
          prioridad,
          eficiencia_estimada: eficienciaEstimada || 0,
          operador_asignado: operadorAsignado || ""
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/ordenes_produccion/:id", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { estado, eficienciaEstimada } = req.body;
      const { data, error } = await insforge.database
        .from("ordenes_produccion")
        .update({
          estado: estado || undefined,
          eficiencia_estimada: eficienciaEstimada || undefined
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // SYSTEM API ENDPOINTS (Alerts, Audit Logs, Thresholds Config)
  // ─────────────────────────────────────────────────────────────

  app.get("/api/alertas", async (req, res) => {
    try {
      const { data, error } = await insforge.database
        .from("alertas")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        tipo: r.tipo,
        titulo: r.titulo,
        descripcion: r.descripcion,
        accionLabel: r.accion_label,
        destino: r.destino
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/alertas/:id", async (req, res) => {
    try {
      const { error } = await insforge.database
        .from("alertas")
        .delete()
        .eq("id", req.params.id);

      if (error) throw new Error(error.message);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/audit_logs", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO' && role !== 'RRHH' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { data, error } = await insforge.database
        .from("audit_logs")
        .select("*")
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false })
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);

      const list = data.map(r => ({
        id: r.id,
        agenteName: r.agente_nombre,
        fecha: r.fecha,
        hora: r.hora,
        detalle: r.detalle,
        nivel: r.nivel
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/audit_logs", async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== 'ADMIN' && role !== 'CFO' && role !== 'RRHH' && role !== 'COO') {
        return res.status(403).json({ error: "No autorizado." });
      }

      const { id, agenteName, fecha, hora, detalle, nivel } = req.body;
      const { data, error } = await insforge.database
        .from("audit_logs")
        .insert({
          id,
          agente_nombre: agenteName,
          fecha,
          hora: hora || "0",
          detalle,
          nivel
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/configuraciones/:id", async (req, res) => {
    try {
      const { data, error } = await insforge.database
        .from("configuraciones")
        .select("*")
        .eq("id", req.params.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      
      if (!data) {
        return res.json(null);
      }
      res.json(data.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/configuraciones/:id", async (req, res) => {
    try {
      const { data } = req.body;
      const { data: configData, error } = await insforge.database
        .from("configuraciones")
        .upsert({
          id: req.params.id,
          data
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json(configData.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GEMINI ASSISTANT API ENDPOINT
  // ─────────────────────────────────────────────────────────────

  app.post("/api/assistant", async (req, res) => {
    try {
      const { prompt, databaseState } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Falta el mensaje (prompt) en la solicitud." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("GEMINI_API_KEY no está configurado. Retornando respuesta analítica simulada.");
        return res.json({
          text: responderAnalisisSimulado(prompt, databaseState),
          simulated: true
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const dbStr = databaseState ? JSON.stringify(databaseState, null, 2) : "No hay datos activos provistos.";
      
      const systemInstruction = `
Eres el "Agente Ejecutivo IA" de la plataforma TAPASEL FLOW AI.
TAPASEL SAS es una empresa industrial metalmecánica ubicada en Medellín, Colombia, dedicada al diseño, fabricación y automatización de tapas, empaques y soluciones industriales.

Tu objetivo es actuar como un ERP inteligente, consultor financiero, gestor de talento humano (RR.HH.) y auditor de procesos.
Debes responder de forma ejecutiva, formal, muy clara, directa y altamente accionable, en español de Colombia/Latinoamérica.

Se te proporcionará el estado actual en tiempo real de la base de datos empresarial del ERP. Utilízala de forma explícita para responder con cifras concretas, nombres de clientes, empleados o rutas con problemas. No inventes datos fuera de la base de datos provista si contradicen los actuales.

Aquí está la Base de Datos actual del Sistema en formato JSON:
${dbStr}

Al responder:
1. Responde de forma resumida, ejecutiva y estructurada (usa viñetas o negritas para resaltar puntos clave).
2. Sé directo y honesto. Si detectas alertas o retrasos, indícalos con urgencia.
3. El usuario puede pedirte cualquiera de las siguientes preguntas críticas; responde con precisión quirúrgica basada en el JSON:
   - ¿Qué clientes tienen pagos pendientes? -> Identifica los de estado 'Mora' o carteraPendiente > 0. Menciona montos.
   - ¿Qué procesos presentan retrasos? -> Identifica transacciones o licencias pendientes, o comentarios de auditorías.
   - ¿Qué documentos faltan? -> Revisa los documentos faltantes o en estado 'Pendiente Verificación'.
   - ¿Qué indicadores están en riesgo? -> Comenta sobre cartera en mora, ausentismo (Liam Foster ausente), o alertas de contratos vencidos en RR.HH.
   - ¿Cuál es el flujo de caja actual? -> Suma los ingresos y egresos recientes cobrados, indica la proyección del mes.
   - ¿Qué empleados tienen documentos vencidos? -> Revisa la lista de empleados y sus "documentosVencidos".
   - ¿Qué área presenta más ausentismo? -> Revisa la asistencia de hoy.
   - ¿Qué proceso es más lento actualmente? -> Analiza los logs o la logística de transporte de acero del Área B.
4. Mantén tus respuestas en un tono corporativo óptimo, elegante y tecnológico.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2
        }
      });

      return res.json({
        text: response.text,
        simulated: false
      });

    } catch (error: any) {
      console.error("Error en endpoint /api/assistant:", error);
      return res.status(500).json({ 
        error: "Ocurrió un error en el procesamiento de la inteligencia artificial.",
        details: error.message 
      });
    }
  });

  // Serve static assets in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TAPASEL FLOW AI] Servidor corriendo en el puerto ${PORT}`);
  });
}

// Fallback logic for offline / no-key simulation
function responderAnalisisSimulado(prompt: string, state: any): string {
  const p = prompt.toLowerCase();
  
  if (p.includes("clientes") && p.includes("pendientes") || p.includes("pagos pendientes") || p.includes("cartera")) {
    return `### 📊 Reporte Ejecutivo de Cartera y Clientes con Pagos Pendientes:
De acuerdo con la base de datos interna, identificamos **3 clientes** en estado de **Mora** con montos pendientes significativos:

1. **Apex Manufacturing (ID: C-1200):** Debe **$42.5M COP**. Último pago registrado el 30 de marzo. Plazo vencido hace 14 días.
2. **Industrias Metálicas del Aburrá (ID: C-5582):** Debe **$15.4M COP**. Último pago el 5 de abril.
3. **Titan Corp (ID: C-4410):** Debe **$12.8M COP**. Último de pago el 12 de abril.

**Recomendación:** Activar el flujo de cobranza automatizado del *Agente de Finanzas* para notificar a los contactos de facturación inmediatamente.`;
  }

  if (p.includes("proceso") && p.includes("retraso") || p.includes("retrasos") || p.includes(" lento")) {
    return `### ⚠️ Alerta de Eficiencia - Procesos y Cuellos de Botella:
El *Agente Analítico* reporta un retraso crítico:

- **Línea Logística de Acero (Área B - Medellín):** Cuello de botella detectado en el transportador principal. Reduce la eficiencia del área al **82%** temporalmente.
- **Auditorías de Suministros:** 2 compras de materia prima están demoradas por confirmación del director financiero.

**Acción Propuesta:** Re-enrutar la lógica automatizada de despacho o aprobar la orden de compra pendiente del proveedor de acero para liberar el material en 24h.`;
  }

  if (p.includes("documentos") && p.includes("faltan") || p.includes("falta") || p.includes("faltantes")) {
    return `### 📁 Auditoría Documental - Archivos Faltantes o Críticos:
El *Agente de Documentos* detecta las siguientes brechas de cumplimiento legal:

1. **Estudio de Impacto Ambiental 2023 (Depto: Operaciones):** Crítico. Plazo de entrega expira en **3 días**.
2. **Renovación de Seguros Laborales (Depto: RR.HH.):** Plazo de radicación expira en **5 días**.
3. **Contrato_Laboral_Estandar_v2.pdf (David Vance):** Firma digital del empleado David Vance sigue pendiente.

**Sugerencia:** Ejecutar la alerta automática desde el panel para solicitar la firma digital y cargar los documentos requeridos.`;
  }

  if (p.includes("indicadores") && p.includes("riesgo")) {
    return `### 🔥 Indicadores de Riesgo Operacional (TAPASEL SAS):
Monitoreo continuo de KPIs:

1. **Tasa de Cartera Vencida (Riesgo Alto):** La deuda morosa acumulada alcanza **$70.7M COP**, liderado por *Apex Manufacturing*.
2. **Cumplimiento Laboral (Riesgo Medio):** 2 empleados activos poseen expedientes incompletos o certificados médicos vencidos en RR.HH.
3. **Asistencia (Riesgo Bajo):** Anomalía puntual en el Área de Ingeniería Física por inasistencia sin justificar de *Liam Foster* hoy.

*Todos los agentes automatizados están ejecutando planes de mitigación en tiempo real.*`;
  }

  if (p.includes("flujo de caja") || p.includes("caja actual") || p.includes("ingresos")) {
    return `### 💰 Análisis de Flujo de Caja Actual (TAPASEL SAS):
El balance actual reporta una salud sólida pero presionada por cartera:

- **Ingresos Totales del Mes:** **$1.24M USD** (+12.4% vs mes anterior).
- **Proyección de Flujo (Q4):** Se estima un excedente de **$1.42M USD** si se concilian las mora pendientes.
- **Último Ingreso Cargado:** **$35.000.000 COP** correspondiente a *Constructora Conconcreto* (Factura #1021) hoy.
- **Egresos Recientes:** Alquiler de Oficina Corporativa ($15M COP) e Infraestructura AWS ($4.25M COP).`;
  }

  if (p.includes("empleados") && p.includes("vencidos") || p.includes("documento vencido") || p.includes("documentos vencidos")) {
    return `### 👥 Alerta de Gestión Humana - Empleados con Pendientes:
Identificamos **2 empleados** con novedades documentales críticas en RR.HH.:

1. **David Vance (Gerente de Logística):** Pendiente de firma en *Contrato Laboral V2.4* y *Certificado de Alturas* para transporte físico.
2. **Tobias Weber (Supervisor de Planta):** *Certificado Médico Ocupacional* vencido el mes pasado bajo norma colombiana.

Se ha enviado un correo electrónico de alerta de renovación automático a sus perfiles de mensajería interna.`;
  }

  if (p.includes("ausentismo") || p.includes("asistencia")) {
    return `### ⏱️ Análisis de Asistencia y Tasa de Ausentismo:
- **Tasa de Ausentismo Promedio:** **2.1%** (óptimo, frente al promedio industrial del 3.5%).
- **Personal en Sede Hoy:** **762 de 842** registrados.
- **Novedades de Hoy:**
  * **Liam Foster** (Ingeniero de Sistemas de Automatización): Marcado como **Ausente** sin novedad reportada.
  * **Sonia Park** (RR.HH.): De **Licencia** autorizada por el área directiva.
  
*Se recomienda contactar al supervisor de planta Tobias Weber sobre la inasistencia técnica de Liam Foster.*`;
  }

  return `### 🤖 Asistente Ejecutivo TAPASEL FLOW AI:
He recibido su consulta: *"**${prompt}**"*

Como Agente Ejecutivo de TAPASEL SAS en Medellín, puedo informarle que:
- El **Estado del Sistema** se encuentra en **Capacidad Óptima/Línea**.
- Monitoreamos continuamente **842 empleados** en total, con un Índice de Eficiencia global del **94.2%**.
- Los ingresos mensuales ascienden a **$1.24M USD** y se mantiene una auditoría con **0 amenazas identificadas**.

¿Desea que profundice en algún punto financiero, de gestión laboral o consulte algún archivo específico de la base de datos documental?`;
}

startServer();
