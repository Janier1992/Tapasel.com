const fs = require('fs');

const tableMapping = {
  'clientes': 'clientes',
  'proveedores': 'proveedores',
  'txs': 'transacciones',
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

  // 1. Add imports
  if (!code.includes('GenericViewModal')) {
    code = code.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import { $1, Eye, Pencil, Trash, FileDown } from 'lucide-react';\nimport { GenericViewModal, GenericEditModal } from './GenericModals';\nimport { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';\nimport { apiDelete } from '../services/backendClient';\n"
    );
  }

  // 2. Add state
  if (!code.includes('const [genericViewRecord')) {
    code = code.replace(
      /const \[([^\]]+)\] = useState\([^)]*\);/,
      (m) => `const [genericViewRecord, setGenericViewRecord] = useState<any>(null);\n  const [genericEditConfig, setGenericEditConfig] = useState<{record: any, table: string} | null>(null);\n\n  const handleGenericDelete = async (id: string, table: string, stateSetter: Function, currentState: any[]) => {\n    if(confirm('¿Estás seguro de eliminar este registro?')) {\n      try {\n        await apiDelete(table, id);\n        // Si tenemos estado, lo limpiamos, si no, recargamos\n        if (currentState && stateSetter) {\n          stateSetter(currentState.filter((item: any) => item.id !== id));\n        } else {\n          window.location.reload();\n        }\n        toast.success('Registro eliminado');\n      } catch (err: any) {\n        toast.error('Error al eliminar: ' + err.message);\n      }\n    }\n  };\n\n  ${m}`
    );
  }

  // 3. Render Modals at the bottom
  if (!code.includes('<GenericViewModal')) {
    const lastDivIndex = code.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      code = code.slice(0, lastDivIndex) + `
      <GenericViewModal record={genericViewRecord} onClose={() => setGenericViewRecord(null)} />
      {genericEditConfig && (
        <GenericEditModal
          record={genericEditConfig.record}
          tableName={genericEditConfig.table}
          onClose={() => setGenericEditConfig(null)}
          onSaved={(updated) => {
            setGenericEditConfig(null);
            window.location.reload();
          }}
        />
      )}
      ` + code.slice(lastDivIndex);
    }
  }

  // 4. Find all map blocks
  // Since we want to find the array variable, we can look for `([a-zA-Z0-9_]+)\.(?:filter\([^)]+\)\.)?map\(\s*\(\s*([a-zA-Z0-9_]+)[^)]*\)\s*=>`
  // Actually, let's just find `([a-zA-Z0-9_]+)\.(?:filter|map|sort)[^{]+?\.map\(\s*\(\s*([a-zA-Z0-9_]+)` or similar.
  // Wait, let's just find `([a-zA-Z0-9_]+)\.map\(\s*\(\s*([a-zA-Z0-9_]+)`
  // Sometimes there's filter: `clientes.filter(c => ...).map((c, index) =>`
  // Let's replace within tbody blocks.

  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/g;
  code = code.replace(tbodyRegex, (match, tbodyContent) => {
    
    // Attempt to extract the array variable and the row variable
    // lookback isn't easy in regex but we know the map is usually just before the tbody or inside it.
    // Actually, in React, the map is inside tbody: <tbody> { arrayName.filter(...).map((rowVar) => ... ) } </tbody>
    const mapMatch = tbodyContent.match(/([a-zA-Z0-9_]+)\s*(?:\.filter[^.]*)?\.map\(\s*\(\s*([a-zA-Z0-9_]+)/);
    
    let arrayVar = 'unknownArray';
    let rowVar = 'null';
    if (mapMatch) {
      arrayVar = mapMatch[1];
      rowVar = mapMatch[2];
    } else {
      // maybe it's just array.map
    }

    const tableName = tableMapping[arrayVar] || arrayVar;

    // Now replace the buttons
    let updatedTbody = tbodyContent.replace(/<div className="flex items-center justify-center gap-1\.5">([\s\S]*?)<\/div>/g, (m) => {
      // In this specific div, we have the buttons. We overwrite them entirely.
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
    });
    return match.replace(tbodyContent, updatedTbody);
  });

  fs.writeFileSync(filepath, code, 'utf8');
  console.log('Updated ' + filepath);
}

['src/components/FinanzasTab.tsx', 'src/components/ProduccionTab.tsx', 'src/components/RRHHTab.tsx', 'src/components/DocumentosTab.tsx'].forEach(processFile);
