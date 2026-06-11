const fs = require('fs');

const appendCode = `
export const apiUpdate = async (table: string, id: string | number, data: any) => {
  try {
    const res = await fetch(\`/api/db/\${table}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Unknown error updating data');
    }
    
    return await res.json();
  } catch (err) {
    console.error('apiUpdate error:', err);
    throw err;
  }
};

export const apiDelete = async (table: string, id: string | number) => {
  try {
    const res = await fetch(\`/api/db/\${table}/\${id}\`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Unknown error deleting data');
    }
    
    return await res.json();
  } catch (err) {
    console.error('apiDelete error:', err);
    throw err;
  }
};
`;

let content = fs.readFileSync('src/services/backendClient.ts', 'utf8');
if (!content.includes('export const apiUpdate')) {
  fs.writeFileSync('src/services/backendClient.ts', content + appendCode, 'utf8');
}
