const fs = require('fs');

let content = fs.readFileSync('src/components/FinanzasTab.tsx', 'utf8');

const replacements = [
  { var: 'c', table: 'clientes' },
  { var: 'item', table: 'cartera' },
  { var: 'item', table: 'transacciones' },
  { var: 'item', table: 'transacciones' },
  { var: 'prov', table: 'proveedores' },
  { var: 'cot', table: 'cotizaciones' }
];

let currentIndex = 0;

content = content.replace(/<div className="flex items-center justify-center gap-1\.5">([\s\S]*?)<\/div>/g, (m, inner) => {
  if (inner.includes('toast.success(\'Vista detallada cargada\')')) {
    const { var: rowVar, table: tableName } = replacements[currentIndex++];
    let arrayVar = tableName;
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
  return m;
});

fs.writeFileSync('src/components/FinanzasTab.tsx', content, 'utf8');
console.log('Fixed exactly', currentIndex, 'occurrences in FinanzasTab');
