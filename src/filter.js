/* Sem Política — lista de termos + matcher. Compartilhado entre content script e popup. */
(() => {
  'use strict';

  // Comparação sem acento e sem diferenciar maiúsculas; respeita limite de palavra.
  const WORDS = [
    // política em geral
    'politica', 'politicas', 'politico', 'politicos', 'politicagem',
    'eleicao', 'eleicoes', 'eleitoral', 'eleitorais', 'eleitor', 'eleitores', 'eleitorado',
    'urna eletronica', 'urnas eletronicas', 'voto impresso', 'horario eleitoral', 'propaganda eleitoral',
    'pesquisa eleitoral', 'pesquisa de intencao de voto', 'intencao de voto', 'primeiro turno', 'segundo turno',
    'candidato', 'candidata', 'candidatos', 'candidatas', 'candidatura', 'pre-candidato', 'pre-candidata',
    'presidenciavel', 'presidenciaveis', 'corrida presidencial', 'eleicao presidencial', 'debate presidencial',
    'debate eleitoral', 'datafolha', 'quaest', 'atlasintel', 'atlas intel', 'ipec', 'parana pesquisas',
    'deputado', 'deputada', 'deputados', 'deputadas', 'senador', 'senadora', 'senadores', 'senado', 'senado federal',
    'camara dos deputados', 'camara municipal', 'vereador', 'vereadora', 'vereadores', 'prefeito', 'prefeita',
    'governador', 'governadora', 'governadores', 'presidente da republica', 'presidencia da republica',
    'ex-presidente', 'planalto', 'palacio do planalto', 'palacio da alvorada', 'congresso nacional', 'esplanada dos ministerios',
    'ministro', 'ministra', 'ministros', 'governo federal', 'governo lula', 'governo bolsonaro', 'governo tarcisio',
    'parlamentar', 'parlamentares', 'bancada', 'bancada evangelica', 'bancada ruralista', 'centrao', 'base aliada',
    'emenda parlamentar', 'emendas parlamentares', 'emendas pix', 'orcamento secreto', 'fundo eleitoral', 'fundao eleitoral',
    'reforma tributaria', 'reforma administrativa', 'arcabouco fiscal', 'medida provisoria',
    'anistia', '8 de janeiro', '8/1', 'atos golpistas', 'golpe de estado', 'tentativa de golpe', 'trama golpista',
    'plano golpista', 'minuta do golpe', 'punhal verde e amarelo', 'tornozeleira eletronica', 'inelegivel', 'inelegibilidade',
    'delacao premiada', 'lava jato', 'lava-jato', 'mensalao', 'petrolao', 'rachadinha', 'rachadinhas',
    'tarifaco', 'lei magnitsky', 'magnitsky',
    'extrema direita', 'extrema-direita', 'extrema esquerda', 'extrema-esquerda', 'esquerdista', 'esquerdistas',
    'esquerdopata', 'direitista', 'direitistas', 'comunista', 'comunistas', 'comunismo', 'fascista', 'fascistas',
    'fascismo', 'ditadura', 'patriota', 'patriotas', 'militancia', 'faz o l', 'fora lula', 'fora bolsonaro', 'lula livre',
    'lulinha', 'petismo', 'antipetismo', 'antipetista',
    // partidos
    'partido dos trabalhadores', 'partido liberal', 'partido politico', 'partidos politicos', 'psol', 'psdb', 'pcdob',
    'republicanos', 'uniao brasil',
    // judiciário / órgãos
    'supremo tribunal federal', 'no supremo', 'pelo supremo', 'ministro do supremo', 'ministros do supremo',
    'ministra do supremo', 'tribunal superior eleitoral', 'ministro do stf', 'ministra do stf',
    'procuradoria-geral da republica', 'procuradoria geral da republica', 'procurador-geral da republica',
    'policia federal', 'inquerito das fake news', 'ativismo judicial', 'ditadura do judiciario',
    // STF
    'alexandre de moraes', 'moraes', 'gilmar mendes', 'luis roberto barroso', 'ministro barroso', 'edson fachin', 'fachin',
    'dias toffoli', 'toffoli', 'luiz fux', 'fux', 'carmen lucia', 'cristiano zanin', 'zanin', 'flavio dino',
    'andre mendonca', 'nunes marques', 'kassio', 'paulo gonet', 'gonet', 'augusto aras',
    // governo / esquerda
    'lula', 'luiz inacio', 'janja', 'haddad', 'alckmin', 'simone tebet', 'tebet', 'marina silva', 'gleisi',
    'rui costa', 'alexandre padilha', 'camilo santana', 'sidonio palmeira', 'boulos', 'erika hilton', 'tabata amaral',
    'janones', 'lindbergh', 'dilma', 'michel temer', 'fhc', 'jose dirceu', 'dirceu',
    // oposição / direita
    'tarcisio', 'nikolas ferreira', 'zambelli', 'gustavo gayer', 'van hattem', 'bia kicis', 'damares', 'sergio moro',
    'dallagnol', 'deltan', 'hamilton mourao', 'general mourao', 'braga netto', 'general heleno', 'augusto heleno',
    'mauro cid', 'anderson torres', 'ramagem', 'valdemar costa neto', 'malafaia', 'allan dos santos', 'paulo figueiredo',
    'olavo de carvalho', 'pablo marcal', 'ronaldo caiado', 'caiado', 'romeu zema', 'zema', 'ratinho junior', 'ratinho jr',
    'eduardo leite', 'ricardo nunes', 'ciro gomes', 'helder barbalho',
    // candidatos / pré-candidatos à Presidência 2026 e entorno
    'renan santos', 'kim kataguiri', 'kataguiri', 'arthur do val', 'mamaefalei', 'mbl', 'movimento brasil livre',
    'partido missao', 'aldo rebelo', 'tarcisio de freitas', 'jair', 'marcal', 'leo pericles',
    'candidato a presidente', 'candidata a presidente', 'candidato a presidencia', 'presidente do brasil',
    'proximo presidente', 'governo',
    // corrupção / discurso político
    'corrupcao', 'corrupto', 'corruptos', 'corrupta', 'impunidade', 'propina', 'dinheiro publico',
    'escandalo de corrupcao', 'a missao continua', 'mudar o brasil', 'salvar o brasil',
    // escândalos STF / Banco Master / Vorcaro
    'mensagens de vorcaro', 'delacao de vorcaro', 'aviao de vorcaro', 'compliance zero', 'operacao compliance zero',
    'banco central', 'galipolo', 'fundo garantidor', 'fundo garantidor de creditos', 'liquidacao extrajudicial',
    'cdb do master', 'cdbs do master', 'will bank', 'banco reag', 'reag investimentos', 'ibaneis', 'ibaneis rocha',
    'paulo henrique costa', 'viviane barci', 'barci de moraes', 'esposa de moraes', 'mulher de moraes',
    'resort tayaya', 'tayaya', 'jatinho de toffoli', 'ministro toffoli', 'ministro moraes', 'ministro gilmar',
    'ministro fachin', 'ministro dino', 'ministro zanin', 'ministro mendonca', 'ministro fux',
    'ministerio publico federal', 'conselho nacional de justica', 'inquerito', 'julgamento no stf',
    'escandalo do stf', 'escandalo do master', 'escandalo', 'supremo', 'toga', 'togados', 'magistrado', 'magistrados',
    // Congresso
    'arthur lira', 'hugo motta', 'alcolumbre', 'rodrigo pacheco', 'renan calheiros', 'aecio', 'sarney', 'collor',
    // Banco Master / Vorcaro / INSS
    'banco master', 'caso master', 'daniel vorcaro', 'banco de brasilia', 'careca do inss', 'fraude do inss',
    'farra do inss', 'descontos do inss',
    // canais / veículos quase 100% política
    'jovem pan news', 'os pingos nos is', 'pingos nos is', 'brasil paralelo', 'revista oeste', 'poder360', 'brasil 247',
    'tv 247', 'icl noticias', 'o antagonista', 'diario do centro do mundo', 'mynews', 'globonews', 'cnn brasil',
    'revista forum', 'the intercept brasil', 'metropoles',
    // Flow Podcast e derivados
    'flow podcast', 'cortes do flow', 'flow cortes', 'flow news', 'flow sport club', 'igor 3k', 'igor coelho', 'monark', 'monark talks', 'estudio flow',
  ];

  // Casa em qualquer lugar (pega hashtags tipo #forabolsonaro, "bolsonarista", etc).
  const SUBSTRINGS = [
    'bolsonar', 'bolsominion', 'lulist', 'lulopetis', 'petist', 'petralha', 'vorcaro', 'xandao', 'golpist',
    'impeachment', 'forabolsonaro', 'foralula', 'lulalivre', 'lulaladrao', 'lula2026', 'fazol', 'missaobrasil',
    'kataguiri', 'renansantos', 'flowpodcast', 'flownews', 'igor3k', 'monarktalks',
  ];

  // Siglas: sensível a maiúsculas (regex interna). "PT 2" / "PT-BR" não contam.
  const ACRONYMS = [
    'PT(?![\\s.:/-]*(?:\\d|BR\\b|br\\b))', 'STF', 'TSE', 'STJ', 'PGR', 'CPI', 'CPMI', 'PEC', 'AGU', 'TCU',
    'PSOL', 'MDB', 'PSDB', 'PSB', 'PDT', 'PCdoB', 'MPF', 'CNJ', 'BRB', 'FGC', 'MBL', 'Flow\\s*#\\s*\\d+', 'FLOW\\s*#\\s*\\d+',
  ];

  // Trechos removidos antes de checar (falsos positivos conhecidos).
  const ALLOW = [
    'politica de privacidade', 'politica de cookies', 'politicas de privacidade', 'politica de reembolso',
    'politica de troca', 'politica de uso', 'politica de conteudo',
    'lula frita', 'lulas fritas', 'anel de lula', 'aneis de lula', 'lula a dore', 'lula molusco', 'lula-molusco',
    'lula gigante', 'lula colossal', 'tinta de lula', 'lula recheada', 'risoto de lula',
    'vinicius de moraes', 'tarcisio meira', 'supremo tribunal de justica desportiva', 'tribunal desportivo',
    'patriota fc', 'ditadura da beleza',
  ];

  const DEFAULT_SETTINGS = {
    enabled: true,
    mode: 'blur', // 'blur' = borra, clique pra ver | 'hide' = some
    sites: { youtube: true, google: true, instagram: true },
    useDefaults: true,
    extraTerms: [],
    allowTerms: [],
  };

  const strip = (s) => s.normalize('NFD').replace(/\p{M}+/gu, '');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phrase = (t) => esc(strip(t).toLowerCase().trim()).replace(/\s+/g, '\\s+');
  const clean = (list) => [...new Set(list.map((t) => t.trim()).filter(Boolean))];
  const B = '(?<![\\p{L}\\p{N}])';
  const E = '(?![\\p{L}\\p{N}])';
  const re = (body, flags = 'u') => (body ? new RegExp(body, flags) : null);

  function buildMatcher(s) {
    const d = s.useDefaults;
    const words = clean([...(d ? WORDS : []), ...(s.extraTerms || [])]).map(phrase);
    const allow = clean([...(d ? ALLOW : []), ...(s.allowTerms || [])]).map(phrase);
    const wordsRe = re(words.length && `${B}(?:${words.join('|')})${E}`);
    const subsRe = re(d && SUBSTRINGS.map(phrase).join('|'));
    const acrRe = re(d && `${B}(?:${ACRONYMS.join('|')})${E}`);
    const allowRe = re(allow.length && `${B}(?:${allow.join('|')})${E}`, 'giu');

    // Retorna o termo que casou, ou null.
    return function test(text) {
      if (!text) return null;
      let t = strip(text);
      if (allowRe) t = t.replace(allowRe, ' ');
      const m = acrRe?.exec(t) || ((t = t.toLowerCase()), wordsRe?.exec(t) || subsRe?.exec(t));
      return m ? m[0] : null;
    };
  }

  globalThis.SemPolitica = {
    DEFAULT_SETTINGS,
    DEFAULT_TERMS: { WORDS, SUBSTRINGS, ACRONYMS, ALLOW },
    buildMatcher,
  };
})();
