---
read_when:
    - Automação por script ou depuração do navegador do agente por meio da API de controle local
    - Procurando a referência da CLI `openclaw browser`
    - Adicionando automação personalizada de navegador com snapshots e refs
summary: API de controle do navegador do OpenClaw, referência da CLI e ações de scripting
title: API de controle do navegador
x-i18n:
    generated_at: "2026-06-27T18:13:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Para instalação, configuração e solução de problemas, consulte [Navegador](/pt-BR/tools/browser).
Esta página é a referência para a API HTTP de controle local, a CLI `openclaw browser`
e padrões de script (snapshots, refs, esperas, fluxos de depuração).

## API de Controle (opcional)

Somente para integrações locais, o Gateway expõe uma pequena API HTTP de local loopback.
Este servidor independente é opcional — defina a variável de ambiente
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` no ambiente do serviço do gateway
e reinicie o gateway antes que os endpoints HTTP fiquem disponíveis. Sem
essa variável, o runtime de controle do navegador ainda funciona pela CLI e
pelas ferramentas de agente, mas nada escuta na porta de controle de loopback.

- Status/iniciar/parar: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/captura de tela: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Permissões: `POST /permissions/grant`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos os endpoints aceitam `?profile=<name>`. `POST /start?headless=true` solicita uma
inicialização headless única para perfis gerenciados localmente sem alterar a
configuração persistida do navegador; perfis attach-only, CDP remoto e de
sessão existente rejeitam essa substituição porque o OpenClaw não inicia esses
processos de navegador.

Para endpoints de abas, `targetId` é o nome do campo de compatibilidade. Prefira passar
`suggestedTargetId` de `GET /tabs` ou `POST /tabs/open`; rótulos e identificadores
`tabId`, como `t1`, também são aceitos. IDs de alvo CDP brutos e prefixos
únicos de target-id bruto ainda funcionam, mas são identificadores de diagnóstico voláteis.

Se a autenticação do gateway por segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigem autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API independente de navegador em loopback **não** consome cabeçalhos de identidade
  trusted-proxy ou Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de navegador
  em loopback não herdam esses modos com identidade; mantenha-as somente em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para validação no nível da rota e
falhas de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não foi reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação incompatível.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desativado pela configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote conflita com o alvo da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/snapshot de IA/snapshot de função, capturas de tela de elemento,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Snapshots de acessibilidade em estilo de função (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando um WebSocket CDP por aba está disponível. Isso é
  um fallback para inspeção e descoberta de refs; o Playwright continua sendo o mecanismo
  principal de ação.
- Capturas de tela de página para o navegador `openclaw` gerenciado quando um WebSocket
  CDP por aba está disponível
- Capturas de tela de página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em refs de `existing-session` (`--ref`) a partir da saída de snapshot

O que ainda precisa do Playwright:

- `navigate`
- `act`
- Snapshots de IA que dependem do formato de snapshot de IA nativo do Playwright
- Capturas de tela de elemento por seletor CSS (`--element`)
- exportação completa de PDF do navegador

Capturas de tela de elemento também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, o Gateway empacotado
não tem a dependência principal do runtime de navegador. Reinstale ou atualize
o OpenClaw e reinicie o gateway. Para Docker, instale também os binários do navegador
Chromium como mostrado abaixo.

#### Instalação do Playwright no Docker

Se o seu Gateway roda no Docker, evite `npx playwright` (conflitos de substituição do npm).
Para imagens personalizadas, inclua o Chromium na imagem:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para uma imagem existente, instale pela CLI incluída:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads de navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. O OpenClaw detecta automaticamente o Chromium
persistido no Linux. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (interno)

Um pequeno servidor de controle em loopback aceita solicitações HTTP e se conecta a navegadores baseados em Chromium via CDP. Ações avançadas (click/type/snapshot/PDF) passam pelo Playwright sobre CDP; quando o Playwright está ausente, apenas operações que não dependem do Playwright ficam disponíveis. O agente vê uma interface estável enquanto navegadores e perfis locais/remotos são trocados livremente por baixo.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar um perfil específico, e `--json` para saída legível por máquina.

<AccordionGroup>

<Accordion title="Básico: status, abas, abrir/focar/fechar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspeção: captura de tela, snapshot, console, erros, solicitações">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Ações: navegar, clicar, digitar, arrastar, esperar, avaliar">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Estado: cookies, armazenamento, offline, cabeçalhos, geolocalização, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Observações:

- `upload` e `dialog` são chamadas de **preparação**; execute-as antes do click/press que aciona o seletor/diálogo. Se uma ação abrir um modal, a resposta da ação inclui `blockedByDialog` e `browserState.dialogs.pending`; passe esse `dialogId` para responder diretamente. Diálogos tratados fora do OpenClaw aparecem em `browserState.dialogs.recent`.
- `click`/`type`/etc exigem uma `ref` de `snapshot` (numérica `12`, ref de função `e12` ou ref ARIA acionável `ax12`). Seletores CSS intencionalmente não são aceitos para ações. Use `click-coords` quando a posição visível no viewport for o único alvo confiável.
- Caminhos de download e trace são restritos às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` aceita arquivos da raiz temporária de uploads do OpenClaw e
  mídia de entrada gerenciada pelo OpenClaw. Mídia de entrada gerenciada pode ser referenciada como
  `media://inbound/<id>`, `media/inbound/<id>` relativo ao sandbox, ou um caminho resolvido
  dentro do diretório de mídia de entrada gerenciada. Refs de mídia aninhadas,
  traversal, symlinks, hardlinks e caminhos locais arbitrários ainda são rejeitados.
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.

IDs e rótulos estáveis de abas sobrevivem à substituição de raw-target do Chromium quando o OpenClaw
consegue provar a aba substituta, como a mesma URL ou uma única aba antiga se tornando uma
única aba nova após o envio de formulário. IDs de alvo brutos ainda são voláteis; prefira
`suggestedTargetId` de `tabs` em scripts.

Resumo dos flags de snapshot:

- `--format ai` (padrão com Playwright): instantâneo de IA com refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade com refs `axN`. Quando Playwright está disponível, o OpenClaw vincula refs com IDs DOM de backend à página ativa para que ações posteriores possam usá-las; caso contrário, trate a saída apenas como inspeção.
- `--efficient` (ou `--mode efficient`): predefinição compacta de instantâneo de funções. Defina `browser.snapshotDefaults.mode: "efficient"` para tornar isso o padrão (consulte [configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um instantâneo de funções com refs `ref=e12`. `--frame "<iframe>"` limita instantâneos de funções a um iframe.
- Com Playwright, `--labels` adiciona uma captura de tela com rótulos de ref sobrepostos
  (imprime `MEDIA:<path>`) mais um array `annotations` com a caixa delimitadora
  de cada ref. Em `screenshot`, rótulos baseados em Playwright funcionam com `--full-page`,
  `--ref` e `--element`; em `snapshot`, a captura de tela acompanhante permanece
  apenas da viewport. Perfis existing-session/chrome-mcp renderizam rótulos sobrepostos em
  capturas de tela da página, mas não retornam `annotations` nem usam o auxiliar de
  projeção full-page/ref/element do Playwright. Sem Playwright ou chrome-mcp,
  capturas de tela rotuladas não ficam disponíveis.
- `--urls` acrescenta destinos de links descobertos aos instantâneos de IA.

## Instantâneos e refs

O OpenClaw oferece suporte a dois estilos de "instantâneo":

- **Instantâneo de IA (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um instantâneo de texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida por meio de `aria-ref` do Playwright.

- **Instantâneo de funções (refs de função como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em funções com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida por meio de `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela com rótulos `e12` sobrepostos. Em
    perfis baseados em Playwright, isso também retorna metadados de caixa delimitadora por ref
    (`annotations[]`).
  - Adicione `--urls` quando o texto do link for ambíguo e o agente precisar de
    destinos de navegação concretos.

- **Instantâneo ARIA (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Saída: a árvore de acessibilidade como nós estruturados.
  - Ações: `openclaw browser click ax12` funciona quando o caminho do instantâneo consegue vincular
    a ref por meio do Playwright e IDs DOM de backend do Chrome.
- Se o Playwright não estiver disponível, instantâneos ARIA ainda podem ser úteis para
  inspeção, mas as refs podem não ser acionáveis. Gere um novo instantâneo com `--format ai`
  ou `--interactive` quando precisar de refs de ação.
- Prova Docker para o caminho de fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia o Chromium com CDP, executa `browser doctor --deep` e verifica se instantâneos de funções
  incluem URLs de links, clicáveis promovidos por cursor e metadados de iframe.

Comportamento das refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma ref nova.
- `/act` retorna o `targetId` bruto atual após substituição acionada por ação
  quando consegue provar a aba substituta. Continue usando IDs/rótulos de aba estáveis para
  comandos posteriores.
- Se o instantâneo de funções foi obtido com `--frame`, as refs de função ficam limitadas àquele iframe até o próximo instantâneo de funções.
- Refs `axN` desconhecidas ou antigas falham rapidamente em vez de cair no seletor
  `aria-ref` do Playwright. Execute um novo instantâneo na mesma aba quando
  isso acontecer.

## Recursos avançados de espera

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs com suporte do Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar pelo estado de carregamento:
  - `openclaw browser wait --load networkidle`
  - Compatível com perfis gerenciados `openclaw` e perfis CDP raw/remotos. Os perfis `user` e `existing-session` rejeitam `networkidle`; use esperas por `--url`, `--text`, um seletor ou `--fn` nesses casos.
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar um seletor ficar visível:
  - `openclaw browser wait "#main"`

Eles podem ser combinados:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Fluxos de depuração

Quando uma ação falhar (por exemplo, "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de função no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` é para scripts e ferramentas estruturadas.

Exemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Instantâneos de funções em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade da carga útil.

## Estado e ajustes de ambiente

Eles são úteis para fluxos de trabalho do tipo "fazer o site se comportar como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Armazenamento: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Cabeçalhos: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` legado continua compatível)
- Autenticação básica HTTP: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (predefinições de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de navegador do openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Prompt injection pode direcionar
  isso. Desative com `browser.evaluateEnabled=false` se você não precisar disso.
- `openclaw browser evaluate --fn` aceita uma fonte de função, uma expressão ou
  um corpo de declaração. Corpos de declaração são encapsulados como funções assíncronas, então use
  `return` para o valor que você quer receber de volta. Use `--timeout-ms <ms>` quando a
  função no lado da página puder precisar de mais tempo do que o timeout padrão de avaliação.
- Para logins e observações anti-bot (X/Twitter etc.), consulte [Login no navegador + publicação no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/nó privado (loopback ou somente tailnet).
- Endpoints CDP remotos são poderosos; crie túneis e proteja-os.

Exemplo de modo estrito (bloquear destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Relacionados

- [Navegador](/pt-BR/tools/browser) - visão geral, configuração, perfis, segurança
- [Login no navegador](/pt-BR/tools/browser-login) - entrar em sites
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
