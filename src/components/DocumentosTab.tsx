import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  FolderOpen, 
  Search, 
  FilePlus, 
  History, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  TrendingDown,
  Activity,
  User,
  ShieldCheck,
  ChevronRight,
  BrainCircuit,
  Calendar,
  Pencil
} from 'lucide-react';
import { Documento, Usuario } from '../types';
import { insforge } from '../services/backendClient';

interface DocumentosTabProps {
  documentos: Documento[];
  onOpenNewDocument: () => void;
  onPostAiAssistantQuery: (prompt: string) => void;
  onSancionarVersion: (docId: string, version: string, comentario: string) => void;
  onAddDocument?: (doc: Documento) => void;
  onDeleteDocument?: (id: string) => void;
  onUpdateDocument?: (doc: Documento) => void;
  activeTab?: string;
  currentUser?: Usuario;
}

export default function DocumentosTab({
  documentos,
  onOpenNewDocument,
  onPostAiAssistantQuery,
  onSancionarVersion,
  onAddDocument,
  onDeleteDocument,
  onUpdateDocument,
  activeTab,
  currentUser
}: DocumentosTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<'All' | 'Finanzas' | 'RRHH' | 'Operaciones' | 'Legal'>('All');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [newVersionComment, setNewVersionComment] = useState('');
  
  // Edit Form state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocNombre, setEditDocNombre] = useState('');
  const [editDocDept, setEditDocDept] = useState<'Finanzas' | 'RRHH' | 'Operaciones' | 'Legal'>('Finanzas');
  const [editDocResp, setEditDocResp] = useState('');

  // New Collapsible Document upload form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docNombre, setDocNombre] = useState('');
  const [docDept, setDocDept] = useState<'Finanzas' | 'RRHH' | 'Operaciones' | 'Legal'>('Finanzas');
  const [docResp, setDocResp] = useState('');
  const [docExplicacion, setDocExplicacion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNombre || !docResp) return;

    setIsUploading(true);
    let documentUrl = '';
    let storagePath = '';

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      storagePath = `doc_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await insforge.storage.from('documentos').upload(storagePath, selectedFile);
      if (uploadError) {
        console.warn("Error uploading file:", uploadError);
      } else {
        documentUrl = insforge.storage.from('documentos').getPublicUrl(storagePath).data.publicUrl;
      }
    }

    const finalName = selectedFile ? `${docNombre}.${selectedFile.name.split('.').pop()}` : docNombre;

    if (onAddDocument) {
      onAddDocument({
        id: `DOC-${Math.floor(Math.random() * 90000) + 10000}`,
        nombre: finalName,
        departamento: docDept,
        version: "v1.0.0",
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
        responsable: docResp,
        tamano: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${(Math.random() * 15 + 1).toFixed(1)} MB`,
        estadoVerificacion: "Chequeo Neural",
        tipoDocumental: "Legal",
        archivo_url: documentUrl,
        storage_path: storagePath,
        historialVersiones: [
          {
            version: "v1.0.0",
            fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
            usuario: docResp,
            comentario: documentUrl ? `Documento físico subido: ${documentUrl}` : docExplicacion || "Radicación inicial y escaneo OCR del archivo físico."
          }
        ]
      });
      // reset
      setDocNombre('');
      setDocExplicacion('');
      setDocResp('');
      setSelectedFile(null);
      setShowDocForm(false);
      setIsUploading(false);
      toast.success(`¡Documento ${finalName} radicado satisfactoriamente! Se ha encolado para escaneo neural OCR.`);
    }
  };

  const selectedDoc = selectedDocId ? (documentos.find(d => d.id === selectedDocId) || null) : null;

  const isArchivedTab = activeTab === 'documentos-archivados';

  // Filters documents
  const filteredDocs = documentos.filter(doc => {
    const matchesSearch = doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.responsable.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize selectedDept because "RRHH" in category folder maps to "RRHH" in type but "RR.HH." in other places
    const matchesDept = selectedDept === 'All' || 
                        (selectedDept === 'RRHH' && doc.departamento === 'RRHH') ||
                        (selectedDept === 'Finanzas' && doc.departamento === 'Finanzas') ||
                        (selectedDept === 'Operaciones' && doc.departamento === 'Operaciones') ||
                        (selectedDept === 'Legal' && doc.departamento === 'Legal');

    const matchesTab = isArchivedTab 
      ? doc.estadoVerificacion === 'Verificado'
      : doc.estadoVerificacion !== 'Verificado';

    // RLS restriction for Director Ejecutivo (CFO): only see Finanzas documents
    if (currentUser?.rol === 'CFO' && doc.departamento !== 'Finanzas') {
      return false;
    }

    return matchesSearch && matchesDept && matchesTab;
  });

  const folders = [
    { name: "Finanzas y Libros", size: "1.2 GB", files: "84 archivos", pending: "12 pend", dept: "Finanzas" as const, color: "text-brand-primary border-brand-primary/25" },
    { name: "Recursos Humanos", size: "450 MB", files: "216 archivos", pending: "5 expi", dept: "RRHH" as const, color: "text-brand-secondary border-brand-secondary/25" },
    { name: "Operaciones A1", size: "3.4 GB", files: "1.2k arch", pending: "En sincronía", dept: "Operaciones" as const, color: "text-brand-tertiary border-brand-tertiary/25" },
    { name: "Legal y Contratos", size: "820 MB", files: "42 contratos", pending: "3 alertas", dept: "Legal" as const, color: "text-brand-error border-brand-error/25" }
  ];

  const visibleFolders = folders.filter(folder => {
    if (currentUser?.rol === 'CFO') {
      return folder.dept === 'Finanzas';
    }
    return true;
  });

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !newVersionComment.trim()) return;

    // Calculate incremental version (e.g. v4.0.0 -> v4.1.0)
    const verParts = selectedDoc.version.replace('v', '').split('.');
    if (verParts.length >= 2) {
      const minor = parseInt(verParts[1]) + 1;
      const nextVer = `v${verParts[0]}.${minor}.0`;
      onSancionarVersion(selectedDoc.id, nextVer, newVersionComment);
      setNewVersionComment('');
      toast.success(`Sanción exitosa: Documento ${selectedDoc.nombre} actualizado a la versión ${nextVer} con log de seguridad.`);
    } else {
      onSancionarVersion(selectedDoc.id, "v1.1.0", newVersionComment);
      setNewVersionComment('');
    }
  };

  const handleEditDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocId || !onUpdateDocument) return;
    const docToUpdate = documentos.find(d => d.id === editingDocId);
    if (docToUpdate) {
      onUpdateDocument({
        ...docToUpdate,
        nombre: editDocNombre,
        departamento: editDocDept,
        responsable: editDocResp
      });
      toast.success(`Documento ${editDocNombre} actualizado correctamente.`);
      setEditingDocId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="font-display font-bold text-3xl text-slate-900">Centro de Inteligencia Documental</h2>
          <p className="text-sm text-slate-500 mt-1">Trazabilidad de contratos, logs de auditoría forense e indexación neuronal OCR.</p>
        </div>
        <button 
          onClick={onOpenNewDocument}
          className="px-5 py-3 bg-brand-primary text-white font-semibold hover:opacity-95 rounded-lg text-xs tracking-wide uppercase transition-all flex items-center gap-2 self-start border-none cursor-pointer"
        >
          <FilePlus className="w-4 h-4" />
          <span>Ingresar Documento (Escanear OCR)</span>
        </button>
      </div>

      {/* Collapsible Form for Document Intake */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div 
          onClick={() => setShowDocForm(!showDocForm)}
          className="p-5 flex justify-between items-center bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-brand-primary" />
              Radicación Rápida de Archivo (Ingreso OCR / Escaneo Virtual)
            </h3>
            <p className="text-xs text-slate-500">Digitaliza nuevos reglamentos, contratos, políticas y manuales operativos en el ERP.</p>
          </div>
          <button className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border-none cursor-pointer">
            {showDocForm ? 'Ocultar Formulario' : 'Desplegar Formulario'}
          </button>
        </div>

        {showDocForm && (
          <form onSubmit={handleAddDocumentSubmit} className="p-6 bg-slate-50/50 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">Nombre del Documento</label>
              <input 
                type="text"
                value={docNombre}
                onChange={(e) => setDocNombre(e.target.value)}
                placeholder="Ej. Reglamento de Higiene Industrial v1"
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:border-brand-primary outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">Departamento Asociado</label>
              <select 
                value={docDept} 
                onChange={(e: any) => setDocDept(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:border-brand-primary outline-none"
              >
                {currentUser?.rol === 'CFO' ? (
                  <option value="Finanzas">Finanzas y Presupuesto</option>
                ) : (
                  <>
                    <option value="Finanzas">Finanzas y Presupuesto</option>
                    <option value="RRHH">Novedades y RRHH</option>
                    <option value="Operaciones">Operaciones y Cadena de Suministros</option>
                    <option value="Legal">Legal y Contratos</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">Responsable / Auditor Autorizado</label>
              <input 
                type="text"
                value={docResp}
                onChange={(e) => setDocResp(e.target.value)}
                placeholder="Ej. Sonia Park"
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:border-brand-primary outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">Extracto / Explicación del Archivo</label>
              <input 
                type="text"
                value={docExplicacion}
                onChange={(e) => setDocExplicacion(e.target.value)}
                placeholder="Ej. Copia digitalizada del boletín técnico de SMT"
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:border-brand-primary outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-500">Subir Archivo Documento</label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-primary p-4 rounded text-center bg-white transition-colors">
                <input 
                  type="file" 
                  accept=".pdf,.xlsx,.docx"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FolderOpen className="w-5 h-5 text-brand-primary mx-auto mb-1" />
                <span className="text-xs text-slate-600 font-semibold block">
                  {selectedFile ? selectedFile.name : "Arrastre el archivo aquí o haga clic para seleccionar"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">Formatos: PDF, XLSX, DOCX</span>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <button 
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-brand-primary hover:opacity-90 text-white font-bold text-xs rounded transition-all uppercase tracking-wider border-none cursor-pointer disabled:opacity-50"
              >
                {isUploading ? "Cargando archivo..." : "Cargar e Indexar en Repositorio General"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Folders Explorer (Grid layout) */}
      {isArchivedTab && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleFolders.map((folder, index) => (
            <div 
              key={index}
              onClick={() => setSelectedDept(selectedDept === folder.dept ? 'All' : folder.dept)}
              className={`p-5 bg-brand-surface border rounded-xl hover:border-brand-primary/40 cursor-pointer transition-all flex justify-between items-start group ${
                selectedDept === folder.dept ? 'ring-2 ring-brand-primary border-brand-primary/30 bg-brand-primary/10' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <Folder className={`w-8 h-8 ${folder.color.split(' ')[0]} group-hover:scale-110 transition-transform`} />
                <div>
                  <h4 className="text-sm font-semibold text-slate-850">{folder.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{folder.files} • {folder.size}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono text-brand-primary uppercase tracking-widest leading-none">
                {folder.pending}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Main interactive directory table & version control sidebar (8/12 vs 4/12) */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Files Directory Left column */}
        <div className={`col-span-12 ${selectedDocId ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          <div className="bg-brand-surface rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            
            {/* Header / Search Controls */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="font-display font-semibold text-xs text-slate-800">
                {isArchivedTab ? 'Expedientes e Historiales Archivados' : 'Bandeja de Pendientes (Falta Sello OCR / Verificación)'}
              </span>
              
              <div className="flex gap-2 w-full md:w-auto items-center">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded py-1.5 pl-8 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary outline-none transition-all"
                    placeholder="Filtrar por archivo..."
                  />
                </div>
                {isArchivedTab && selectedDept !== 'All' && (
                  <button 
                    onClick={() => setSelectedDept('All')}
                    className="p-1.5 px-3 bg-slate-100 border border-slate-255 hover:text-brand-primary rounded text-[10px] uppercase font-mono tracking-wider font-bold text-brand-primary shrink-0 transition-colors cursor-pointer border-none"
                  >
                    Ver Todo
                  </button>
                )}
              </div>
            </div>

            {/* Document list table */}
            <div className="overflow-x-auto text-xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                  <tr>
                    <th className="p-4 pl-6 font-bold">Nombre de Archivo</th>
                    <th className="p-4 font-bold">Creador / Fecha</th>
                    <th className="p-4 font-bold">Versión</th>
                    <th className="p-4 font-bold">Peso</th>
                    {!isArchivedTab && <th className="p-4 font-bold">Validación Neural</th>}
                    <th className="p-4 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-855">
                  {filteredDocs.map((doc) => (
                    <tr 
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`hover:bg-slate-50/50 cursor-pointer group transition-colors ${
                        selectedDocId === doc.id ? 'bg-brand-primary/10 border-l-2 border-brand-primary font-medium' : ''
                      }`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-brand-primary" />
                          <div>
                            <span className="font-semibold block truncate group-hover:text-brand-primary transition-colors pr-2">
                              {doc.nombre}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{doc.departamento} • {doc.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-650">
                        <div className="flex flex-col">
                          <span>{doc.responsable}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.fechaModificacion}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-brand-secondary font-bold">
                        {doc.version}
                      </td>
                      <td className="p-4 text-slate-450 font-mono">
                        {doc.tamano}
                      </td>
                      {!isArchivedTab && (
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold ${
                            doc.estadoVerificacion === 'Verificado'
                              ? 'bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/15'
                              : doc.estadoVerificacion === 'Chequeo Neural'
                              ? 'bg-brand-tertiary/15 text-brand-tertiary border border-brand-tertiary/15'
                              : 'bg-brand-error/15 text-brand-error border border-brand-error/15'
                          }`}>
                            {doc.estadoVerificacion}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDocId(doc.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Ver Historial y Versiones"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Ver Detalle</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingDocId(doc.id);
                              setEditDocNombre(doc.nombre);
                              setEditDocDept(doc.departamento as any);
                              setEditDocResp(doc.responsable);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Editar Documento"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          {!isArchivedTab && (
                            <button
                              onClick={() => {
                                if (onUpdateDocument) {
                                  onUpdateDocument({
                                    ...doc,
                                    estadoVerificacion: 'Verificado',
                                    fechaModificacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
                                  });
                                  toast.success(`Documento "${doc.nombre}" verificado e indexado exitosamente en el archivo general.`);
                                  if (selectedDocId === doc.id) {
                                    setSelectedDocId(null);
                                  }
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Aprobar / Verificar Documento"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Aprobar</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`¿Está seguro de que desea eliminar el documento ${doc.nombre}?`)) {
                                if (onDeleteDocument) {
                                  onDeleteDocument(doc.id);
                                  toast.success(`Documento ${doc.nombre} eliminado con éxito.`);
                                  if (selectedDocId === doc.id) {
                                    setSelectedDocId(null);
                                  }
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Eliminar Documento"
                          >
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={isArchivedTab ? 5 : 6} className="text-center py-6 text-slate-500 text-xs italic bg-white">
                        No se encontraron documentos en esta bandeja.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Compliance gaps */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Gaps card - full-width */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-brand-error">
                <AlertCircle className="w-4.5 h-4.5" />
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Documentos Faltantes de Cumplimiento</h4>
              </div>
              <ul className="space-y-3 font-mono text-[11px] text-slate-600">
                <li className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span>Estudio de Impacto Ambiental 2023 (Operaciones)</span>
                  <span className="bg-brand-error/10 text-brand-error px-2 py-0.5 rounded text-[9px] font-bold">Plazo: 3d</span>
                </li>
                <li className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200 opacity-80">
                  <span>Renovación de Seguros Laborales (RR.HH.)</span>
                  <span className="bg-brand-tertiary/10 text-brand-tertiary px-2 py-0.5 rounded text-[9px] font-bold">Plazo: 5d</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Selected Document Details & Version Control right column */}
        {selectedDocId && (
          <div className="col-span-12 lg:col-span-4">
            {selectedDoc ? (
              <div className="bg-brand-surface border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                      VERSIÓN Y CONTROL
                    </span>
                    <h3 className="font-display font-semibold text-slate-800 text-sm truncate">{selectedDoc.nombre}</h3>
                    <span className="inline-block mt-1 font-mono text-[9px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded uppercase">
                      {selectedDoc.id} • {selectedDoc.departamento}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedDocId(null)}
                    className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-655 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Simplified Document Info Details instead of audit logs */}
                <div className="p-4 space-y-3 border-b border-slate-200 text-xs font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creador:</span>
                    <span className="font-bold text-slate-800">{selectedDoc.responsable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Versión Activa:</span>
                    <span className="font-bold text-brand-secondary">{selectedDoc.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tamaño del archivo:</span>
                    <span className="text-slate-800">{selectedDoc.tamano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modificado:</span>
                    <span className="text-slate-800">{selectedDoc.fechaModificacion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado OCR:</span>
                    <span className="text-emerald-600 font-bold">{selectedDoc.estadoVerificacion}</span>
                  </div>
                </div>

                {/* Sancionar nueva version Form block */}
                <div className="p-4 bg-slate-50">
                  <form onSubmit={handleCreateNewVersion} className="space-y-3">
                    <span className="text-[10px] font-mono text-brand-primary uppercase tracking-wider font-bold block">
                      Sancionar Nueva Versión
                    </span>
                    
                    <textarea 
                      value={newVersionComment}
                      onChange={(e) => setNewVersionComment(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 placeholder-slate-455 outline-none focus:border-brand-primary resize-none"
                      placeholder="Escriba el comentario de revisión..."
                      required
                    />

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Incremento Menor Integrado</span>
                      <button 
                        type="submit"
                        className="px-3 py-1.5 bg-brand-primary text-white font-bold rounded uppercase tracking-wider hover:opacity-95 text-[10px] border-none cursor-pointer"
                      >
                        Aprobar Parche
                      </button>
                    </div>
                  </form>
                </div>

                {/* Prompt search helper buttons */}
                <div className="p-4 bg-slate-100/60 border-t border-slate-200 text-center">
                  <button 
                    onClick={() => onPostAiAssistantQuery(`¿Falta algún documento o firma laboral por parte de los responsables del archivo ${selectedDoc.nombre}?`)}
                    className="text-brand-primary hover:underline font-mono text-[10px] font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                  >
                    Consultar Agente sobre este archivo
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-brand-surface border border-dashed border-slate-250 h-64 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-6 bg-slate-50/50">
                <FolderOpen className="w-10 h-10 mb-2 opacity-55 text-slate-450" />
                <p className="text-xs font-semibold">Seleccione un documento del directorio contable para examinar el control de versiones.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Document Modal */}
      {editingDocId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditDocumentSubmit} className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in text-slate-800 text-xs text-left">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-amber-500" />
                Editar Documento
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingDocId(null)}
                className="text-xs bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Nombre del Documento</label>
                <input 
                  type="text" 
                  required
                  value={editDocNombre}
                  onChange={(e) => setEditDocNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-bold outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Departamento Asociado</label>
                <select 
                  value={editDocDept} 
                  onChange={(e: any) => setEditDocDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 focus:border-brand-primary outline-none"
                >
                  <option value="Finanzas">Finanzas y Presupuesto</option>
                  <option value="RRHH">Novedades y RRHH</option>
                  <option value="Operaciones">Operaciones y Cadena de Suministros</option>
                  <option value="Legal">Legal y Contratos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Responsable / Auditor Autorizado</label>
                <input 
                  type="text" 
                  required
                  value={editDocResp}
                  onChange={(e) => setEditDocResp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
              <button 
                type="button"
                onClick={() => setEditingDocId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer border-none"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer border-none"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
