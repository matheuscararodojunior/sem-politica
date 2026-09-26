# 🚫 Sem Política

Extensão de navegador que esconde conteúdo sobre política brasileira no **YouTube**, **Google** e **Instagram**. Funciona no Chrome, Chromium, Brave, Edge e Firefox.

Chega de acordar com notícia de STF, Banco Master, eleição ou briga de candidato. Você escolhe o que quer ver — ou melhor, o que **não** quer ver.

## ✨ O que ela faz

| Site | O que esconde |
|---|---|
| **YouTube** | Vídeos, Shorts, playlists e posts da comunidade. Vídeo político aberto fica coberto e pausado (título e comentários somem). No Shorts a tela vira um aviso e a rolagem continua funcionando. |
| **Google** | Resultados de pesquisa, "Principais notícias", "As pessoas também perguntam", sugestões do campo de busca e os cards do Google Notícias. |
| **Instagram** | Posts do feed, miniaturas do Explorar e dos perfis, e Reels (cobertos e pausados). Lê a legenda inteira — inclusive a parte escondida atrás do "... mais". |

## 🎯 Como decide

Lê o texto de cada item (título, canal, legenda, texto das imagens) e compara com uma lista de **~310 termos** sem acento e sem diferenciar maiúsculas: nomes (Bolsonaro, Lula, Moraes/Xandão, Vorcaro, Tarcísio…), instituições (STF, TSE, Congresso…), partidos, eleições, escândalos (Banco Master, INSS) e canais de política (Jovem Pan News, Brasil Paralelo, ICL…).

Também evita falsos positivos conhecidos: *"lula frita"*, *"Vinicius de Moraes"*, *"PT-BR"*, *"moro em SP"*, *"política de privacidade"*.

## 🛠 Instalar

### Chrome / Chromium / Brave / Edge
1. Abre `chrome://extensions`.
2. Liga o **Modo do desenvolvedor**.
3. Clica em **Carregar sem compactação** e escolhe esta pasta.

### Firefox
1. Abre `about:debugging#/runtime/this-firefox`.
2. Clica em **Carregar extensão temporária** e escolhe o `manifest.json`.

> No Firefox a extensão some quando o navegador fecha (carregamento temporário). Pra ficar permanente, precisa assinar no [Firefox Add-ons](https://addons.mozilla.org).

## ⚙️ Opções (ícone da extensão)

- Liga/desliga tudo, ou só um site.
- **Sumir** ou **Borrar** (borrar é bom pra achar falso positivo — clique mostra o item e a palavra que ativou).
- Contador de itens escondidos na aba atual.
- Campo pra adicionar termos seus e campo de exceções.
- As mudanças valem na hora, sem recarregar.

## 🧱 Como funciona por dentro

- `src/filter.js` — lista de termos e o matcher (compartilhado entre o content script e as opções).
- `src/content.js` — acha os "cards" de cada site via `MutationObserver` e esconde os que casam. As regras de seletores ficam em `RULES` no topo.
- `src/content.css` — estilos de esconder/borrar/cobrir.
- `options.{html,js,css}` — o popup/opções (salva em `chrome.storage.sync`).

## 👷 Contribuindo

- **Um site parou de esconder?** O HTML do Instagram e do Google muda com frequência. Ajuste os seletores em `RULES` no topo de `src/content.js`.
- **Falso positivo?** Adicione em `ALLOW` (trechos) ou tire o termo de `WORDS` em `src/filter.js`.
- **Termo faltando?** Adicione em `WORDS` (limite de palavra), `SUBSTRINGS` (pedaço de palavra, hashtags) ou `ACRONYMS` (siglas sensíveis a maiúsculas).

Abra um PR ou issue. Sem frescura: lista de termos, seletores e comportamento é tudo que muda.

## 📄 Licença

[MIT](LICENSE)
