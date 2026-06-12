const fs = require('fs');

function processFinanzas() {
  let code = fs.readFileSync('src/components/FinanzasTab.tsx', 'utf8');

  // 1. Add imports at the top
  if (!code.includes('GenericViewModal')) {
    code = code.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import { $1, Eye, Pencil, Trash, FileDown } from 'lucide-react';\nimport { GenericViewModal, GenericEditModal } from './GenericModals';\nimport { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';\nimport { apiDelete } from '../services/backendClient';\n"
    );
  }

  // 2. Add state exactly at the top of the FinanzasTab component!
  // It starts with `export default function FinanzasTab({`
  // We look for `const [activeProcessTab, setActiveProcessTab] = useState`
  if (!code.includes('genericViewRecord, setGenericViewRecord')) {
    code = code.replace(
      /const \[activeProcessTab, setActiveProcessTab\] = useState/,
      `const [genericViewRecord, setGenericViewRecord] = useState<any>(null);\n  const [genericEditConfig, setGenericEditConfig] = useState<{record: any, table: string} | null>(null);\n\n  const handleGenericDelete = async (id: string, table: string, stateSetter: Function | null, currentState: any[] | null) => {\n    if(confirm('¿Estás seguro de eliminar este registro?')) {\n      try {\n        await apiDelete(table, id);\n        if (currentState && stateSetter) {\n          stateSetter(currentState.filter((item: any) => item.id !== id));\n        } else {\n          window.location.reload();\n        }\n        toast.success('Registro eliminado');\n      } catch (err: any) {\n        toast.error('Error al eliminar: ' + err.message);\n      }\n    }\n  };\n\n  const [activeProcessTab, setActiveProcessTab] = useState`
    );
  }

  // 3. Render Modals at the bottom
  // The bottom of FinanzasTab has:
  //         </main>
  //       </div>
  //     </div>
  //   );
  // }
  if (!code.includes('<GenericViewModal record={genericViewRecord}')) {
    code = code.replace(
      /<\/main>\s*<\/div>\s*<\/div>\s*\);\s*\}/,
      `</main>\n      </div>\n      <GenericViewModal record={genericViewRecord} onClose={() => setGenericViewRecord(null)} />\n      {genericEditConfig && (\n        <GenericEditModal\n          record={genericEditConfig.record}\n          tableName={genericEditConfig.table}\n          onClose={() => setGenericEditConfig(null)}\n          onSaved={(updated) => {\n            setGenericEditConfig(null);\n            window.location.reload();\n          }}\n        />\n      )}\n    </div>\n  );\n}`
    );
  }

  fs.writeFileSync('src/components/FinanzasTab.tsx', code, 'utf8');
  console.log('FinanzasTab base setup complete.');
}

processFinanzas();
