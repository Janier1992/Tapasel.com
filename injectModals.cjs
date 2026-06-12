const fs = require('fs');

const tableMapping = {
  'clientes': 'clientes',
  'proveedores': 'proveedores',
  'transacciones': 'transacciones',
  'cartera': 'cartera',
  'cotizaciones': 'cotizaciones',
  'inventario': 'inventario',
  'ordenes': 'ordenes_produccion',
  'empleados': 'empleados',
  'nominas': 'nominas',
  'documentos': 'documentos'
};

function processFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // 1. Add imports at the top
  if (!code.includes('GenericViewModal')) {
    code = code.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import { $1, Eye, Pencil, Trash, FileDown } from 'lucide-react';\nimport { GenericViewModal, GenericEditModal } from './GenericModals';\nimport { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';\nimport { apiDelete } from '../services/backendClient';\n"
    );
  }

  // 2. Add state inside the component definition.
  // FinanzasTab: export default function FinanzasTab({ ... }) { const [activeProcessTab
  // ProduccionTab: export default function ProduccionTab({ ... }) { const [activeTab
  // RRHHTab: export default function RRHHTab({ ... }) { const [activeSubTab
  // DocumentosTab: export default function DocumentosTab({ ... }) { const [docSearchTerm
  
  if (!code.includes('genericViewRecord, setGenericViewRecord')) {
    code = code.replace(
      /(export default function \w+\([^)]*\)\s*\{\s*)(const \[\w+,\s*set\w+\]\s*=\s*useState)/,
      `$1const [genericViewRecord, setGenericViewRecord] = useState<any>(null);\n  const [genericEditConfig, setGenericEditConfig] = useState<{record: any, table: string} | null>(null);\n\n  const handleGenericDelete = async (id: string, table: string, stateSetter: Function | null, currentState: any[] | null) => {\n    if(confirm('¿Estás seguro de eliminar este registro?')) {\n      try {\n        await apiDelete(table, id);\n        if (currentState && stateSetter) {\n          stateSetter(currentState.filter((item: any) => item.id !== id));\n        } else {\n          window.location.reload();\n        }\n        toast.success('Registro eliminado');\n      } catch (err: any) {\n        toast.error('Error al eliminar: ' + err.message);\n      }\n    }\n  };\n\n  $2`
    );
  }

  // 3. Render Modals at the bottom
  if (!code.includes('<GenericViewModal record={genericViewRecord}')) {
    code = code.replace(
      /(<\/div>\s*<\/div>\s*\);\s*\})/,
      `      <GenericViewModal record={genericViewRecord} onClose={() => setGenericViewRecord(null)} />\n      {genericEditConfig && (\n        <GenericEditModal\n          record={genericEditConfig.record}\n          tableName={genericEditConfig.table}\n          onClose={() => setGenericEditConfig(null)}\n          onSaved={(updated) => {\n            setGenericEditConfig(null);\n            window.location.reload();\n          }}\n        />\n      )}\n$1`
    );
  }

  // 4. Replace action buttons inside loops.
  // We will find all `<tbody>...</tbody>` that contain `.map(`.
  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/g;
  code = code.replace(tbodyRegex, (match, tbodyContent) => {
    // Only target those with map and gap-1.5 buttons
    if (!tbodyContent.includes('.map') || !tbodyContent.includes('gap-1.5')) {
      return match;
    }

    const mapMatch = tbodyContent.match(/([a-zA-Z0-9_]+)\s*(?:\.filter[^.]*)?\.map\(\s*\(\s*([a-zA-Z0-9_]+)/);
    
    let arrayVar = 'unknownArray';
    let rowVar = 'null';
    if (mapMatch) {
      arrayVar = mapMatch[1];
      rowVar = mapMatch[2];
    } else {
      return match;
    }

    const tableName = tableMapping[arrayVar] || arrayVar;

    // Replace ONLY the buttons inside <div className="flex items-center justify-center gap-1.5">
    let updatedTbody = tbodyContent.replace(/<div className="flex items-center justify-center gap-1\.5">([\s\S]*?)<\/div>/g, (m, innerContent) => {
      // Don't replace if it's already updated
      if (innerContent.includes('setGenericViewRecord')) return m;
      
      // If it has toast.success('Vista detallada cargada') we replace it
      if (innerContent.includes('Vista detallada cargada') || innerContent.includes('Modo edición activado')) {
        return `<div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); setGenericViewRecord(${rowVar}); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); setGenericEditConfig({ record: ${rowVar}, table: '${tableName}' }); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); handleGenericDelete(${rowVar}?.id, '${tableName}', typeof set${arrayVar.charAt(0).toUpperCase() + arrayVar.slice(1)} !== 'undefined' ? set${arrayVar.charAt(0).toUpperCase() + arrayVar.slice(1)} : null, typeof ${arrayVar} !== 'undefined' ? ${arrayVar} : null); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); exportRecordToPDF(${rowVar}, 'Registro_${tableName}'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>`;
      }
      return m; // unchanged if it doesn't have the toast placeholder
    });
    return match.replace(tbodyContent, updatedTbody);
  });

  fs.writeFileSync(filepath, code, 'utf8');
  console.log('Updated ' + filepath);
}

['src/components/FinanzasTab.tsx', 'src/components/ProduccionTab.tsx', 'src/components/RRHHTab.tsx', 'src/components/DocumentosTab.tsx'].forEach(processFile);
