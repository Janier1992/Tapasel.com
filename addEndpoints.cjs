const fs = require('fs');
const path = require('path');

function addEndpoints(serverPath) {
  let content = fs.readFileSync(serverPath, 'utf8');

  // Add PUT and DELETE endpoints to server.ts
  if (!content.includes("app.put('/api/db/:table/:id'")) {
    const putDeleteCode = `
app.put('/api/db/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from(table)
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(\`Error in PUT /api/db/\${table}/\${id}:\`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/db/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error(\`Error in DELETE /api/db/\${table}/\${id}:\`, error);
    res.status(500).json({ error: error.message });
  }
});
`;

    // Inject before the default error handler or app.listen
    content = content.replace(/app\.listen\(/, putDeleteCode + '\napp.listen(');
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('Endpoints added to server.ts');
  }
}

addEndpoints('server.ts');
