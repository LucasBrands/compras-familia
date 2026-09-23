// api/importar-nota.js
// 1. Chama o proxy interno para buscar o HTML da SEFAZ como se fosse um navegador Android
// 2. Faz o parse dos itens e preços
// 3. Grava no Supabase após confirmação do usuário

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnethyhywncvbosonmqp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
  'carne': 'carne', 'patinho': 'carne', 'acem': 'carne', 'alcatra': 'carne', 'contra file': 'carne',
  'frango': 'frango', 'peito': 'frango', 'coxa': 'frango', 'sobrecoxa': 'frango',
  'ovo': 'ovos', 'ovos': 'ovos',
  'linguica': 'linguica', 'linguiça': 'linguica', 'salsicha': 'linguica',
  'leite': 'leite',
  'queijo': 'queijo', 'mussarela': 'queijo', 'muçarela': 'queijo', 'mozzarela': 'queijo',
  'manteiga': 'margarina', 'margarina': 'margarina',
  'iogurte': 'iogurte',
  'creme de leite': 'creme_leite', 'leite condensado': 'creme_leite',
  'pao de forma': 'pao_forma', 'pão de forma': 'pao_forma',
  'biscoito': 'biscoitos', 'bolacha': 'biscoitos', 'cookie': 'biscoitos',
  'cereal': 'cereal', 'granola': 'cereal',
  'geleia': 'geleia', 'amendoim': 'geleia', 'pasta amendoim': 'geleia',
  'banana': 'fruta_perecivel', 'mamao': 'fruta_perecivel', 'uva': 'fruta_perecivel', 'manga': 'fruta_perecivel', 'morango': 'fruta_perecivel',
  'maca': 'fruta_duravel', 'maçã': 'fruta_duravel', 'laranja': 'fruta_duravel', 'limao': 'fruta_duravel', 'pera': 'fruta_duravel',
  'alface': 'folhas', 'couve': 'folhas', 'rucula': 'folhas', 'espinafre': 'folhas',
  'cenoura': 'legumes', 'batata': 'legumes', 'abobrinha': 'legumes', 'brocolis': 'legumes',
  'cebola': 'alho_cebola', 'alho': 'alho_cebola',
  'agua ': 'agua', 'agua min': 'agua',
  'suco': 'sucos', 'refrigerante': 'sucos', 'coca': 'sucos', 'guarana': 'sucos',
  'detergente': 'detergente',
  'sabao em po': 'sabao_po', 'sabão em pó': 'sabao_po', 'omo': 'sabao_po', 'ariel': 'sabao_po',
  'amaciante': 'amaciante', 'downy': 'amaciante', 'comfort': 'amaciante',
  'agua sanitaria': 'agua_sanitaria', 'água sanitária': 'agua_sanitaria',
  'desinfetante': 'desinfetante', 'pinho': 'desinfetante',
  'multiuso': 'multiuso', 'veja': 'multiuso',
  'saco de lixo': 'sacos_lixo', 'saco lixo': 'sacos_lixo',
  'esponja': 'esponjas', 'pano': 'esponjas',
  'tira manchas': 'tira_manchas', 'alvejante': 'tira_manchas', 'vanish': 'tira_manchas',
  'papel higienico': 'papel_higienico', 'papel higiênico': 'papel_higienico',
  'sabonete': 'sabonete',
  'shampoo': 'shampoo', 'condicionador': 'shampoo',
  'creme dental': 'creme_dental', 'pasta de dente': 'creme_dental', 'colgate': 'creme_dental', 'oral b': 'creme_dental',
  'desodorante': 'desodorante', 'rexona': 'desodorante', 'dove': 'desodorante',
  'absorvente': 'absorventes', 'sempre livre': 'absorventes',
  'papel toalha': 'papel_toalha',
  'papel aluminio': 'papel_aluminio', 'papel alumínio': 'papel_aluminio', 'filme plastico': 'papel_aluminio',
  'saco freezer': 'sacos_freezer', 'saco zip': 'sacos_freezer',
  'pilha': 'pilhas', 'lampada': 'pilhas', 'lâmpada': 'pilhas',
};

function norm(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mapearItem(nomeProduto) {
  const lower = norm(nomeProduto);
  for (const [key, val] of Object.entries(CATALOG_MAP)) {
    if (lower.includes(norm(key))) return val;
  }
  return null;
}

function extrairMercado(html) {
  // Estrutura padrão NFC-e SP: <div class="txtTit">Nome do emitente</div> ou <span class="txtTit">
  const patterns = [
    /<div[^>]*class="[^"]*nomeEmitente[^"]*"[^>]*>([^<]+)</i,
    /<span[^>]*class="[^"]*nomeEmitente[^"]*"[^>]*>([^<]+)</i,
    /<h4[^>]*>([^<]{5,60})<\/h4>/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].replace(/&amp;/g, '&').trim();
  }
  return null;
}

function extrairItens(html) {
  const itens = [];
  const seen = new Set();

  // Padrão 1: estrutura clássica NFC-e SP com span.txtTit e span.Valor
  // <span class="txtTit">PRODUTO</span> ... <span class="Valor">R$ 12,50</span>
  const r1 = /<span[^>]*class="[^"]*txtTit[^"]*"[^>]*>\s*([^<]{3,80}?)\s*<\/span>[\s\S]{0,400}?<span[^>]*class="[^"]*Valor[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/gi;
  let m;
  while ((m = r1.exec(html)) !== null) {
    const nome = m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    const valorStr = m[2].replace(/[^\d,]/g, '').replace(',', '.');
    const valor = parseFloat(valorStr);
    const key = nome.toLowerCase();
    if (nome.length > 2 && valor > 0 && !seen.has(key)) {
      seen.add(key);
      itens.push({ nome, valor, itemId: mapearItem(nome) });
    }
  }

  // Padrão 2: tabela com linhas de produto — <td class="...">PRODUTO</td><td>qtd</td><td>un</td><td>vl unit</td><td>vl total</td>
  if (itens.length === 0) {
    const r2 = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*(\d+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([A-Z][^<]{2,50}?)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.,]+)\s*<\/td>[\s\S]*?<\/tr>/gi;
    while ((m = r2.exec(html)) !== null) {
      const nome = m[2].replace(/&amp;/g, '&').trim();
      const valorStr = m[3].replace(/[^\d,]/g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      const key = nome.toLowerCase();
      if (nome.length > 2 && valor > 0 && !seen.has(key)) {
        seen.add(key);
        itens.push({ nome, valor, itemId: mapearItem(nome) });
      }
    }
  }

  // Padrão 3: procura qualquer linha com nome de produto seguido de valor monetário
  if (itens.length === 0) {
    const r3 = />\s*([A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ][^<\d]{3,50}?)\s*<[\s\S]{0,200}?R\$\s*([\d.,]+)/gi;
    while ((m = r3.exec(html)) !== null) {
      const nome = m[1].replace(/&amp;/g, '&').trim();
      const valorStr = m[2].replace(/[^\d,]/g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      const key = nome.toLowerCase();
      if (nome.length > 3 && valor > 0 && valor < 5000 && !seen.has(key)) {
        seen.add(key);
        itens.push({ nome, valor, itemId: mapearItem(nome) });
      }
    }
  }

  return itens;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { url, mercado, acao, itens: itensConfirmados } = req.body || {};

  // --- GRAVAR no Supabase após confirmação ---
  if (acao === 'gravar' && Array.isArray(itensConfirmados)) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const hoje = new Date().toISOString().slice(0, 10);
      const registros = itensConfirmados
        .filter(it => it.itemId && it.valor > 0 && it.tamanho > 0)
        .map(it => ({
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
          item_id: it.itemId,
          mercado: mercado || 'Não identificado',
          preco: it.valor,
          tamanho: it.tamanho,
          unidade: it.unidade || 'un',
          data: hoje,
        }));
      if (registros.length === 0) return res.status(400).json({ erro: 'Nenhum item válido para gravar.' });
      const { error } = await supabase.from('precos').insert(registros);
      if (error) throw error;
      return res.status(200).json({ ok: true, gravados: registros.length });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao gravar no banco.', detalhe: err.message });
    }
  }

  // --- BUSCAR e PARSEAR a nota via proxy interno ---
  if (!url) return res.status(400).json({ erro: 'URL da nota é obrigatória.' });

  let urlObj;
  try { urlObj = new URL(url); } catch { return res.status(400).json({ erro: 'URL inválida.' }); }
  const dominiosPermitidos = ['nfce.fazenda.sp.gov.br', 'www.nfce.fazenda.sp.gov.br'];
  if (!dominiosPermitidos.some(d => urlObj.hostname === d)) {
    return res.status(403).json({ erro: 'Domínio não permitido. Use a URL oficial da SEFAZ-SP.' });
  }

  try {
    // Chama o proxy interno com User-Agent de navegador Android real
    const proxyUrl = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/proxy-nota?url=${encodeURIComponent(url)}`;
    
    const resposta = await fetch(proxyUrl, {
      headers: { 'Accept': 'text/html' },
      signal: AbortSignal.timeout(15000),
    });

    if (!resposta.ok) {
      const errData = await resposta.json().catch(() => ({}));
      return res.status(502).json({ erro: errData.erro || 'Não foi possível acessar a nota. A URL pode ter expirado.' });
    }

    const html = await resposta.text();

    // Verifica se o HTML tem conteúdo de nota fiscal
    if (!html.includes('NFC') && !html.includes('nfce') && !html.includes('Valor') && !html.includes('produto')) {
      return res.status(422).json({
        erro: 'O site da SEFAZ bloqueou o acesso automático.',
        sugestao: 'Use o modo manual: escaneie o QR code pelo celular, veja os itens na tela e registre na aba Preços.',
        html_debug: html.slice(0, 300),
      });
    }

    const itens = extrairItens(html);
    const nomeMercado = extrairMercado(html) || 'Não identificado';

    if (itens.length === 0) {
      return res.status(422).json({
        erro: 'Nota acessada mas itens não foram extraídos. O formato pode ser diferente do esperado.',
        sugestao: 'Registre manualmente na aba Preços.',
      });
    }

    return res.status(200).json({
      ok: true,
      mercado: nomeMercado,
      itens,
      total: itens.length,
      mapeados: itens.filter(it => it.itemId).length,
    });

  } catch (err) {
    if (err.name === 'TimeoutError') return res.status(504).json({ erro: 'Tempo limite ao buscar a nota. Tente novamente.' });
    return res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
};
