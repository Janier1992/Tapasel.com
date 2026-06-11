import { insforge } from './src/services/backendClient.ts';

async function test() {
  const newCli = {
    id: "TEST-999",
    nombre: "Test Client",
    contacto: "Test",
    email: "test@test.com",
    telefono: "123",
    carteraPendiente: 0,
    totalComprado: 0,
    estado: 'Al día',
    ultimoPago: '2026-06-11'
  };
  console.log("Inserting...");
  const res = await insforge.database.from('clientes').insert([newCli]);
  console.log(res);
}

test();
