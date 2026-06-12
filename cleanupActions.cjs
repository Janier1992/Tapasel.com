const fs = require('fs');

const tableMapping = {
  'clientes': 'clientes',
  'proveedores': 'proveedores',
  'transacciones': 'transacciones',
  'paginatedTxs': 'transacciones',
  'cartera': 'cartera',
  'cotizaciones': 'cotizaciones',
  'tempCotItems': 'cotizaciones',
  'selectedCotizacion.items': 'cotizaciones'
};

function fixFinanzas() {
  let filepath = 'src/components/FinanzasTab.tsx';
  let code = fs.readFileSync(filepath, 'utf8');

  // 1. Remove grey action td from empty states (after colSpan)
  const emptyStateRegex = /(<td colSpan=\{[^\}]+\}[^>]*>[\s\S]*?<\/td>\s*)<td className="border border-slate-200 px-3 py-1\.5 text-center">\s*<div className="flex items-center justify-center gap-1\.5">[\s\S]*?<Eye className="w-3\.5 h-3\.5" \/>[\s\S]*?<Pencil className="w-3\.5 h-3\.5" \/>[\s\S]*?<Trash className="w-3\.5 h-3\.5" \/>[\s\S]*?<FileDown className="w-3\.5 h-3\.5" \/>[\s\S]*?<\/button>\s*<\/div>\s*<\/td>\s*/g;
  code = code.replace(emptyStateRegex, '$1');

  // 2. Replace dummy buttons with real ones
  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/g;
  code = code.replace(tbodyRegex, (match, tbodyContent) => {
    if (!tbodyContent.includes('gap-1.5')) return match;

    // Look for map. e.g. clientes.map(c =>  or  paginatedTxs.map((item) =>
    const mapMatch = tbodyContent.match(/([a-zA-Z0-9_.]+)\s*(?:\.filter[^.]*)?\.map\(\s*\(?\s*([a-zA-Z0-9_]+)/);
    
    let arrayVar = 'unknownArray';
    let rowVar = 'null';
    if (mapMatch) {
      arrayVar = mapMatch[1];
      rowVar = mapMatch[2];
    } else {
      return match;
    }

    const tableName = tableMapping[arrayVar] || arrayVar;

    let updatedTbody = tbodyContent.replace(/<div className="flex items-center justify-center gap-1\.5">([\s\S]*?)<\/div>/g, (m, innerContent) => {
      if (innerContent.includes('setGenericViewRecord')) return m;
      
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
      return m;
    });
    return match.replace(tbodyContent, updatedTbody);
  });

  fs.writeFileSync(filepath, code, 'utf8');
}

function removeGreyIcons(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const regex = /<td className="border border-slate-200 px-3 py-1\.5 text-center">\s*<div className="flex items-center justify-center gap-1\.5">[\s\S]*?<Eye className="w-3\.5 h-3\.5" \/>[\s\S]*?<Pencil className="w-3\.5 h-3\.5" \/>[\s\S]*?<Trash className="w-3\.5 h-3\.5" \/>[\s\S]*?<FileDown className="w-3\.5 h-3\.5" \/>[\s\S]*?<\/button>\s*<\/div>\s*<\/td>\s*/g;
  content = content.replace(regex, '');
  fs.writeFileSync(filepath, content, 'utf8');
}

// Finanzas is the only one that KEEPS them (but fixed)
fixFinanzas();

// Documentos, Produccion, RRHH will just strip them out because they have existing colored buttons!
removeGreyIcons('src/components/DocumentosTab.tsx');
removeGreyIcons('src/components/ProduccionTab.tsx');
removeGreyIcons('src/components/RRHHTab.tsx');

console.log('Cleanup complete');
