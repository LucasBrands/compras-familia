// api/importar-nota.js
// Vercel Serverless Function
// Recebe a URL da nota fiscal (QR code), busca o HTML da Sefaz-SP,
// extrai itens e preços, devolve pro frontend para confirmação antes de gravar.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnethyhywncvbosonmqp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // chave service_role (mais segura no servidor)

// Catálogo local para tentar mapear produto da nota → item do sistema
const CATALOG_MAP = {
  'arroz': 'arroz',
  'feijao': 'feijao', 'feijão': 'feijao',
  'macarrao': 'macarrao', 'macarrão': 'macarrao', 'massa': 'macarrao',
  'farinha': 'farinha',
  'acucar': 'acucar', 'açúcar': 'acucar', 'açucar': 'acucar',
  'sal ': 'sal',
  'oleo': 'oleo', 'óleo': 'oleo',
  'azeite': 'azeite',
  'vinagre': 'vinagre',
  'molho': 'molho', 'extrato': 'molho',
  'milho': 'enlatados', 'ervilha': 'enlatados', 'atum': 'enlatados', 'sardinha': 'enlatados',
  'cafe': 'cafe', 'café': 'cafe',
  'aveia': 'aveia',
  'carne': 'carne', 'patinho': 'carne', 'acem': 'carne', 'alcatra': 'carne',
  'frango': 'frango', 'peito': 'frango', 'coxa': 'frango',
  'ovo': 'ovos', 'ovos': 'ovos',
  'linguica': 'linguica', 'linguiça': 'linguica',
  'leite': 'leite',
  'queijo': 'queijo', 'mussarela': 'queijo', 'muçarela': 'queijo',
  'manteiga': 'margarina', 'margarina': 'margarina',
  'iogurte': 'iogurte',
  'creme de leite': 'creme_leite', 'leite condensado': 'creme_leite',
  'pao de forma': 'pao_forma', 'pão de forma': 'pao_forma',
  'biscoito': 'biscoitos', 'bolacha': 'biscoitos',
  'cereal': 'cereal',
  'geleia': 'geleia', 'amendoim': 'geleia',
  'banana': 'fruta_perecivel', 'mamao': 'fruta_perecivel', 'uva': 'fruta_perecivel',
  'maca': 'fruta_duravel', 'maçã': 'fruta_duravel', 'laranja': 'fruta_duravel', 'limao': 'fruta_duravel',
  'alface': 'folhas', 'couve': 'folhas', 'rucula': 'folhas',
  'cenoura': 'legumes', 'batata': 'legumes', 'cebola': 'alho_cebola', 'alho': 'alho_cebola',
  'agua ': 'agua',
  'suco': 'sucos', 'refrigerante': 'sucos',
  'detergente': 'detergente',
  'sabao em po': 'sabao_po', 'sabão em pó': 'sabao_po',
  'amaciante': 'amaciante',
  'agua sanitaria': 'agua_sanitaria', 'água sanitária': 'agua_sanitaria',
  'desinfetante': 'desinfetante',
  'multiuso': 'multiuso',
  'saco de lixo': 'sacos_lixo', 'saco lixo': 'sacos_lixo',
  'esponja': 'esponjas', 'pano': 'esponjas',
  'tira manchas': 'tira_manchas', 'alvejante': 'tira_manchas',
  'papel higienico': 'papel_higienico', 'papel higiênico': 'papel_higienico',
  'sabonete': 'sabonete',
  'shampoo': 'shampoo', 'condicionador': 'shampoo',
  'creme dental': 'creme_dental', 'pasta de dente': 'creme_dental',
  'desodorante': 'desodorante',
  'absorvente': 'absorventes',
  'papel toalha': 'papel_toalha',
  'papel aluminio': 'papel_aluminio', 'papel alumínio': 'papel_aluminio', 'filme plastico': 'papel_aluminio',
  'saco freezer': 'sacos_freezer',
  'pilha': 'pilhas', 'lampada': 'pilhas', 'lâmpada': 'pilhas',
};

function mapearItem(nomeProduto) {
  const lower = nomeProduto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, val] of Object.entries(CATALOG_MAP)) {
    const keyNorm = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(keyNorm)) return val;
  }
  return null; // não mapeado — volta pro usuário confirmar manualmente
}

function extrairMercado(html, urlNota) {
  // Tenta extrair nome do emitente do HTML da SEFAZ
  const matchEmit = html.match(/class="txtTit"[^>]*>([^<]+)<\/span>/i);
  if (matchEmit) return matchEmit[1].trim();
  return 'Não identificado';
}

function extrairItens(html) {
  const itens = [];

  // Parser para o HTML padrão da NFC-e SP
  // Tabela com id="tabResult" ou linhas com classe "item"
  const regexLinha = /<span[^>]*class="[^"]*txtTit[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*Valor[^"]*"[^>]*>([^<]+)<\/span>/gi;

  let match;
  while ((match = regexLinha.exec(html)) !== null) {
    const nome = match[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    const valorStr = match[2].replace(/[^\d,]/g, '').replace(',', '.');
    const valor = parseFloat(valorStr);
    if (nome && valor > 0) {
      itens.push({ nome, valor, itemId: mapearItem(nome) });
    }
  }

  // Fallback: tenta extrair via estrutura de tabela alternativa
  if (itens.length === 0) {
    const regexAlt = /class="[^"]*item[^"]*"[\s\S]*?<[^>]+>([^<]{5,60})<\/[^>]+>[\s\S]*?R\$\s*([\d.,]+)/gi;
    while ((match = regexAlt.exec(html)) !== null) {
      const nome = match[1].replace(/&amp;/g, '&').trim();
      const valorStr = match[2].replace(/[^\d,]/g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      if (nome && valor > 0) {
        itens.push({ nome, valor, itemId: mapearItem(nome) });
      }
    }
  }

  return itens;
}

module.exports = async function handler(req, res) {
  // CORS para o site no Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { url, mercado, acao, itens: itensConfirmados } = req.body || {};

  // --- AÇÃO: gravar no Supabase após confirmação do usuário ---
  if (acao === 'gravar' && Array.isArray(itensConfirmados)) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const hoje = new Date().toISOString().slice(0, 10);
      const registros = itensConfirmados
        .filter(it => it.itemId && it.valor > 0 && it.tamanho > 0)
        .map(it => ({
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          item_id: it.itemId,
          mercado: mercado || 'Não identificado',
          preco: it.valor,
          tamanho: it.tamanho,
          unidade: it.unidade || 'un',
          data: hoje
        }));

      if (registros.length === 0) {
        return res.status(400).json({ erro: 'Nenhum item válido para gravar.' });
      }

      const { error } = await supabase.from('precos').insert(registros);
      if (error) throw error;

      return res.status(200).json({ ok: true, gravados: registros.length });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao gravar no banco.', detalhe: err.message });
    }
  }

  // --- AÇÃO: buscar e parsear a nota fiscal ---
  if (!url) return res.status(400).json({ erro: 'URL da nota fiscal é obrigatória.' });

  // Valida domínio (aceita apenas domínios oficiais SEFAZ)
  const dominiosPermitidos = [
    'nfce.fazenda.sp.gov.br',
    'nfe.fazenda.pr.gov.br',
    'www.nfce.fazenda.sp.gov.br',
    'nfce.sefaz.ba.gov.br',
    'nfce.sefaz.rs.gov.br',
    'www.sefaz.rs.gov.br',
  ];
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return res.status(400).json({ erro: 'URL inválida.' });
  }
  const dominioOk = dominiosPermitidos.some(d => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d));
  if (!dominioOk) {
    return res.status(400).json({ erro: 'Domínio não permitido. Use a URL oficial da nota fiscal (SEFAZ-SP).' });
  }

  try {
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ComprasFamilia/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resposta.ok) {
      return res.status(502).json({ erro: 'Não foi possível acessar a nota fiscal. A URL pode ter expirado.' });
    }

    const html = await resposta.text();
    const itens = extrairItens(html);
    const nomeMercado = extrairMercado(html, url);

    if (itens.length === 0) {
      return res.status(422).json({
        erro: 'Não foi possível extrair itens desta nota. O formato pode ser diferente do esperado.',
        sugestao: 'Tente registrar os preços manualmente na aba Preços.'
      });
    }

    return res.status(200).json({
      ok: true,
      mercado: nomeMercado,
      itens: itens,
      total: itens.length,
      mapeados: itens.filter(it => it.itemId).length
    });

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ erro: 'Tempo limite ao buscar a nota fiscal. Tente novamente.' });
    }
    return res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
};
