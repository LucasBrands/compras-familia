module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    mensagem: 'Function rodando corretamente',
    metodo: req.method,
    query: req.query,
    env_supabase: !!process.env.SUPABASE_SERVICE_KEY,
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
};
