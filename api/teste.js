module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = req.query.url || 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=35260905741430000269651200000378191381243199|2|1|2|6edf6b1d6893b42c0121f07670bb86c049bd41b8';

  try {
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    const html = await resposta.text();
    // Retorna o HTML completo para análise
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(html);

  } catch(err) {
    res.status(500).json({ erro: err.message });
  }
};
