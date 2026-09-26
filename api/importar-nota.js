const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnethyhywncvbosonmqp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const CATALOG_MAP = [
  // Carnes e proteínas
  { keys: ['file tilapia','tilapia','peixe','pescada','merluza','salmao'], id: 'frango' },
  { keys: ['frango','peito de frango','coxa','sobrecoxa','coxinha de asa'], id: 'frango' },
  { keys: ['carne moi','patinho','acem','alcatra','contra file','carne bovi','maminha','picanha','paleta'], id: 'carne' },
  { keys: ['ovo','ovos'], id: 'ovos' },
  { keys: ['linguica','salsicha','mortadela'], id: 'linguica' },
  // Laticínios
  { keys: ['leite condensado','creme de leite'], id: 'creme_leite' },
  { keys: ['leite'], id: 'leite' },
  { keys: ['queijo','mussarela','mucarela','mozzarela','prato fatiado'], id: 'queijo' },
  { keys: ['manteiga','margarina'], id: 'margarina' },
  { keys: ['iogurte','iog '], id: 'iogurte' },
  // Alimentação básica
  { keys: ['arroz'], id: 'arroz' },
  { keys: ['feijao','feijão'], id: 'feijao' },
  { keys: ['macarrao','macarrão','massa','espaguete','fusilli','penne'], id: 'macarrao' },
  { keys: ['farinha de trig'], id: 'farinha' },
  { keys: ['acucar','açucar','açúcar'], id: 'acucar' },
  { keys: ['sal ','sal iod'], id: 'sal' },
  { keys: ['oleo de soja','oleo soja','óleo'], id: 'oleo' },
  { keys: ['azeite'], id: 'azeite' },
  { keys: ['vinagre'], id: 'vinagre' },
  { keys: ['molho de tomate','extrato de tomate','molho tomate','extrato tomate'], id: 'molho' },
  { keys: ['milho verde','ervilha','atum','sardinha'], id: 'enlatados' },
  { keys: ['cafe ','café','nescafe','pelé cafe'], id: 'cafe' },
  { keys: ['aveia'], id: 'aveia' },
  // Café da manhã
  { keys: ['pao de forma','pão de forma'], id: 'pao_forma' },
  { keys: ['biscoito','bolacha','cookie','wafer'], id: 'biscoitos' },
  { keys: ['cereal','granola','corn flakes','sucrilhos'], id: 'cereal' },
  { keys: ['geleia','pasta de amendoim','doce de leite'], id: 'geleia' },
  // Frutas
  { keys: ['banana','mamao','mamão','uva','manga','morango','nectarina','kiwi'], id: 'fruta_perecivel' },
  { keys: ['maca','maçã','pera','laranja','limao','limão','mexerica','tangerina'], id: 'fruta_duravel' },
  // Verduras e legumes
  { keys: ['alface','rucula','rúcula','espinafre','couve manteiga'], id: 'folhas' },
  { keys: ['cenoura','batata','abobrinha','brocolis','brócolis','couve flor','repolho','chuchu','abobora','tomate'], id: 'legumes' },
  { keys: ['cebola'], id: 'alho_cebola' },
  { keys: ['alho'], id: 'alho_cebola' },
  // Bebidas
  { keys: ['agua min','água min'], id: 'agua' },
  { keys: ['suco','refrigerante','coca','guarana','guaraná','pepsi'], id: 'sucos' },
  // Limpeza
  { keys: ['detergente'], id: 'detergente' },
  { keys: ['sabao em po','sabão em pó','sabao po','omo ','ariel '], id: 'sabao_po' },
  { keys: ['amaciante','downy','comfort','fofo '], id: 'amaciante' },
  { keys: ['agua sanitaria','água sanitária','hipoclorito'], id: 'agua_sanitaria' },
  { keys: ['desinfetante','pinho sol','lysoform'], id: 'desinfetante' },
  { keys: ['multiuso','veja ','mr.músculo','mr musculo'], id: 'multiuso' },
  { keys: ['saco de lixo','saco lixo','sacolinhas'], id: 'sacos_lixo' },
  { keys: ['esponja','pano de prato'], id: 'esponjas' },
  { keys: ['tira mancha','alvejante','vanish'], id: 'tira_manchas' },
  // Higiene
  { keys: ['papel hig','papel higienico'], id: 'papel_higienico' },
  { keys: ['sabonete'], id: 'sabonete' },
  { keys: ['shampoo','xampu','condicionador'], id: 'shampoo' },
  { keys: ['creme dental','pasta dente','colgate','oral b','sorriso '], id: 'creme_dental' },
  { keys: ['desodorante','rexona','dove ','nivea '], id: 'desodorante' },
  { keys: ['absorvente','sempre livre'], id: 'absorventes' },
  // Doméstico
  { keys: ['papel toalha'], id: 'papel_toalha' },
  { keys: ['papel aluminio','papel alumínio','filme pvc','filme plastico'], id: 'papel_aluminio' },
  { keys: ['saco freezer','saco zip'], id: 'sacos_freezer' },
  { keys: ['pilha','lâmpada','lampada'], id: 'pilhas' },
];

function mapearItem(nome) {
  const lower = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of CATALOG_MAP) {
    for (const key of entry.keys) {
      const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(keyNorm)) return entry.id;
    }
  }
  return null;
}

const MERCADO_MAP = [
  { keys: ['superbom','super bom','superbom de assis'], nome: 'Super Bom' },
  { keys: ['amigao','amigão','supermercado amigao'], nome: 'Amigão' },
  { keys: ['max atacadista','max atac','muffato'], nome: 'Max Atacadista' },
  { keys: ['avenida','sup avenida','supermercado avenida'], nome: 'Avenida' },
];

function normalizarMercado(nomeRaw) {
  const lower = nomeRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of MERCADO_MAP) {
    for (const key of entry.keys) {
      const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(keyNorm)) return entry.nome;
    }
  }
  return nomeRaw; // retorna o nome original se não reconheceu
}

function extrairMercado(html) {
  const m = html.match(/<div[^>]*id="u20"[^>]*class="txtTopo"[^>]*>([^<]+)<\/div>/i)
    || html.match(/<div[^>]*class="txtTopo"[^>]*>([^<]+)<\/div>/i);
  if (m) return normalizarMercado(m[1].trim());
  return 'Não identificado';
}

function extrairItens(html) {
  const itens = [];
  // Regex que captura cada <tr id="Item + N">...</tr>
  const trRegex = /<tr[^>]*id="Item[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const bloco = trMatch[1];
    // Nome: <span class="txtTit">NOME</span>
    const nomeMatch = bloco.match(/<span[^>]*class="txtTit"[^>]*>([^<]+)<\/span>/i);
    // Quantidade: <span class="Rqtd"><strong>Qtde.:</strong>0,62</span>
    const qtdMatch = bloco.match(/<span[^>]*class="Rqtd"[^>]*>[\s\S]*?<\/strong>([\d.,]+)<\/span>/i);
    // Unidade: <span class="RUN"><strong>UN: </strong>KG</span>
    const unMatch = bloco.match(/<span[^>]*class="RUN"[^>]*>[\s\S]*?<\/strong>\s*([A-Z]+)\s*<\/span>/i);
    // Valor unitário: <span class="RvlUnit"><strong>Vl. Unit.:</strong> 6,39</span>
    const vlUnitMatch = bloco.match(/<span[^>]*class="RvlUnit"[^>]*>[\s\S]*?<\/strong>\s*([\d.,]+)\s*<\/span>/i);
    // Valor total: <span class="valor">3,96</span>
    const vlTotalMatch = bloco.match(/<span[^>]*class="valor"[^>]*>([\d.,]+)<\/span>/i);

    if (!nomeMatch) continue;

    const nome = nomeMatch[1].trim();
    const qtd = qtdMatch ? parseFloat(qtdMatch[1].replace(',', '.')) : 1;
    const unidade = unMatch ? unMatch[1].trim().toLowerCase() : 'un';
    const vlUnit = vlUnitMatch ? parseFloat(vlUnitMatch[1].replace(',', '.')) : 0;
    const vlTotal = vlTotalMatch ? parseFloat(vlTotalMatch[1].replace(',', '.')) : 0;

    if (!nome || vlUnit <= 0) continue;

    itens.push({
      nome,
      qtd,
      unidade: unidade === 'kg' ? 'kg' : (unidade === 'l' ? 'l' : 'un'),
      vlUnit,   // preço por kg/un
      vlTotal,  // valor total pago
      itemId: mapearItem(nome)
    });
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

  // GRAVAR no Supabase
  if (acao === 'gravar' && Array.isArray(itensConfirmados)) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const hoje = new Date().toISOString().slice(0, 10);
      const registros = itensConfirmados
        .filter(it => it.itemId && it.vlUnit > 0 && it.tamanho > 0)
        .map(it => ({
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
          item_id: it.itemId,
          mercado: mercado || 'Não identificado',
          preco: it.vlUnit * it.tamanho,
          tamanho: it.tamanho,
          unidade: it.unidade || 'un',
          data: hoje,
        }));
      if (registros.length === 0) return res.status(400).json({ erro: 'Nenhum item válido para gravar.' });
      const { error } = await supabase.from('precos').insert(registros);
      if (error) throw error;

      // Atualiza o estoque automaticamente com a quantidade comprada
      const incrementos = {};
      registros.forEach(function(r){
        incrementos[r.item_id] = (incrementos[r.item_id] || 0) + Number(r.tamanho);
      });

      let itensEstoqueAtualizados = 0;
      for (const [itemId, qtdComprada] of Object.entries(incrementos)) {
        try {
          const existente = await supabase.from('estoque').select('id, quantidade').eq('item_id', itemId).single();
          if (existente.data) {
            await supabase.from('estoque')
              .update({ quantidade: Number(existente.data.quantidade) + qtdComprada, atualizado_em: new Date().toISOString() })
              .eq('id', existente.data.id);
          } else {
            await supabase.from('estoque')
              .insert({ id: 'e_' + itemId + '_' + Date.now(), item_id: itemId, quantidade: qtdComprada });
          }
          itensEstoqueAtualizados++;
        } catch (e) { /* segue mesmo se um item falhar */ }
      }

      return res.status(200).json({ ok: true, gravados: registros.length, estoqueAtualizado: itensEstoqueAtualizados });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao gravar no banco.', detalhe: err.message });
    }
  }

  // BUSCAR e PARSEAR
  if (!url) return res.status(400).json({ erro: 'URL obrigatória.' });
  let urlObj;
  try { urlObj = new URL(url); } catch { return res.status(400).json({ erro: 'URL inválida.' }); }
  const dominiosPermitidos = ['nfce.fazenda.sp.gov.br', 'www.nfce.fazenda.sp.gov.br'];
  if (!dominiosPermitidos.some(d => urlObj.hostname === d)) {
    return res.status(403).json({ erro: 'Domínio não permitido.' });
  }

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

    if (!resposta.ok) {
      return res.status(502).json({ erro: `SEFAZ retornou ${resposta.status}. URL pode ter expirado.` });
    }

    const html = await resposta.text();
    const itens = extrairItens(html);
    const nomeMercado = extrairMercado(html);

    if (itens.length === 0) {
      return res.status(422).json({ erro: 'Nota acessada mas nenhum item encontrado. Tente com outra nota.' });
    }

    return res.status(200).json({
      ok: true,
      mercado: nomeMercado,
      itens,
      total: itens.length,
      mapeados: itens.filter(it => it.itemId).length,
    });

  } catch (err) {
    if (err.name === 'TimeoutError') return res.status(504).json({ erro: 'Tempo limite. Tente novamente.' });
    return res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
};
