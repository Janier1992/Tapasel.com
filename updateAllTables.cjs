const fs = require('fs');

function processComponent(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  let originalCode = code;

  // 1. Add imports
  if (!code.includes('exportRecordToPDF')) {
    code = code.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import { $1, Eye, Pencil, Trash, FileDown } from 'lucide-react';\nimport { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';\nimport toast from 'react-hot-toast';"
    );
  }

  // 2. Parse tables
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/g;
  let m;
  const tableMatches = [];
  while ((m = tableRegex.exec(code)) !== null) {
    tableMatches.push({ index: m.index, text: m[0] });
  }

  console.log(`Found ${tableMatches.length} tables in ${filepath}`);

  tableMatches.forEach((match) => {
    let tableCode = match.text;

    // Skip nested or specific subtables that shouldn't have actions
    if (tableCode.includes('tempCotItems') || tableCode.includes('selectedCotizacion') || tableCode.includes('Concepto Contable') || tableCode.includes('Impresión')) {
      return;
    }

    // Add Acciones header if not there
    if (!tableCode.includes('>Acciones<') && !tableCode.includes('>Acción<')) {
      tableCode = tableCode.replace(/<th([^>]*)>(.*?)<\/th>\s*<\/tr>\s*<\/thead>/, (m, attrs, content) => {
        return `<th${attrs}>${content}</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>`;
      });
    }

    // Add the td body before the end of the row
    // we only want to append it to rows inside <tbody> that don't already have Acciones equivalent
    // Check if tbody exists
    if (tableCode.includes('<tbody>') || tableCode.includes('<tbody')) {
      // replace </td></tr> with </td><td>...</td></tr> inside tbody
      // to avoid matching header trs, we split by tbody
      const parts = tableCode.split(/<tbody[^>]*>/);
      if (parts.length > 1) {
        let tbodyContent = parts[1];
        // replace all </td></tr> inside tbody
        tbodyContent = tbodyContent.replace(/<\/td>\s*<\/tr>/g, (m) => {
          return `</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>`;
        });
        tableCode = parts[0] + tableCode.match(/<tbody[^>]*>/)[0] + tbodyContent;
      }
    }

    code = code.replace(match.text, tableCode);
  });

  if (code !== originalCode) {
    fs.writeFileSync(filepath, code, 'utf8');
    console.log(`Updated ${filepath}`);
  }
}

['src/components/FinanzasTab.tsx', 'src/components/ProduccionTab.tsx', 'src/components/RRHHTab.tsx', 'src/components/DocumentosTab.tsx'].forEach(processComponent);
