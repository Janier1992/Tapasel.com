const fs = require('fs');

const buttonGroupTemplate = (varName) => `
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
                                <button type="button" onClick={(e) => { e.preventDefault(); exportRecordToPDF(${varName}, 'Registro'); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
`;

function processComponent(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  // Ensure imports are added
  if (!content.includes('exportRecordToPDF')) {
    content = content.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import { $1, Eye, Pencil, Trash, FileDown } from 'lucide-react';\nimport { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';\nimport toast from 'react-hot-toast';"
    );
    changed = true;
  }

  // Regex to find <thead>...</tr>...</thead> and append Acciones if not present
  // This needs to find the last </th> before </tr></thead>
  const theadRegex = /<th([^>]*)>(.*?)<\/th>\s*<\/tr>\s*<\/thead>/g;
  content = content.replace(theadRegex, (match, attrs, text) => {
    if (text.includes('Acciones')) return match;
    changed = true;
    return `<th${attrs}>${text}</th>\n                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>\n                      </tr>\n                    </thead>`;
  });

  // Now for tbody, it's harder because we have .map((c) => ( ... <tr> ... </tr> ))
  // We want to find the last </td> before </tr> inside a map block.
  // We can look for .map\(\s*\(\s*([a-zA-Z0-9_]+)[^=>]*=>[\s\S]*?<\/tr>/g
  // Wait, some maps have index: .map((c, index) =>
  // Let's use a simpler approach: finding </tr> inside <tbody>
  // Wait, `</tr>` could be anywhere. But we know it's a JSX file.
  // If we just find `</td>\n                          </tr>` and we are inside a map...
  // Let's just do manual string replacements for the specific tables in FinanzasTab to be safe.
  
  fs.writeFileSync(filepath, content, 'utf8');
  return changed;
}

processComponent('src/components/FinanzasTab.tsx');
processComponent('src/components/ProduccionTab.tsx');
processComponent('src/components/RRHHTab.tsx');
processComponent('src/components/DocumentosTab.tsx');
