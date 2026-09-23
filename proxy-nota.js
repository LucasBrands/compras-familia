// api/proxy-nota.js
// Proxy leve: repassa o HTML da SEFAZ-SP para o cliente
// Envia headers de navegador real para evitar bloqueio

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ erro: 'URL obrigatória.' });

  // Valida domínio — só aceita SEFAZ-SP
  let urlObj;
  try { urlObj = new URL(url); } catch { return res.status(400).json({ erro: 'URL inválida.' }); }
  const dominiosPermitidos = ['nfce.fazenda.sp.gov.br', 'www.nfce.fazenda.sp.gov.br'];
  const ok = dominiosPermitidos.some(d => urlObj.hostname === d);
  if (!ok) return res.status(403).json({ erro: 'Domínio não permitido.' });

  try {
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    if (!resposta.ok) {
      return res.status(502).json({ erro: `SEFAZ retornou status ${resposta.status}. A URL pode ter expirado.` });
    }

    const html = await resposta.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (err) {
    if (err.name === 'TimeoutError') return res.status(504).json({ erro: 'Tempo limite. Tente novamente.' });
    return res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
};
