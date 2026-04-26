---
read_when:
    - Criar scripts ou depurar o navegador do agente via a API de controle local
    - Procurando a referência da CLI `openclaw browser`
    - Adicionando automação personalizada do navegador com snapshots e refs
summary: API de controle do navegador do OpenClaw, referência da CLI e ações de script
title: API de controle do navegador
x-i18n:
    generated_at: "2026-04-26T11:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Para configuração, ajustes e solução de problemas, consulte [Browser](/pt-BR/tools/browser).
Esta página é a referência da API HTTP de controle local, da CLI `openclaw browser`
e dos padrões de script (snapshots, refs, waits, fluxos de depuração).

## API de controle (opcional)

Somente para integrações locais, o Gateway expõe uma pequena API HTTP loopback:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos os endpoints aceitam `?profile=<name>`. `POST /start?headless=true` solicita uma
inicialização headless pontual para perfis locais gerenciados sem alterar a configuração
persistida do navegador; perfis somente de anexação, CDP remoto e sessão existente rejeitam
essa substituição porque o OpenClaw não inicia esses processos de navegador.

Se a autenticação do gateway por segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API de navegador loopback independente **não** consome cabeçalhos de identidade de proxy confiável nem do Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas loopback do navegador
  não herdam esses modos com identidade; mantenha-as somente em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para falhas de validação no nível da rota e de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação sem suporte.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado por configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` no nível superior ou em lote entra em conflito com o alvo da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas em tempo de execução ainda podem retornar `{ "error": "<message>" }` sem um campo
`code`.

### Requisito do Playwright

Alguns recursos (`navigate`/`act`/snapshot AI/role snapshot, screenshots de elementos,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornarão
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Snapshots de acessibilidade em estilo role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando um WebSocket CDP por aba está disponível. Este é
  um fallback para inspeção e descoberta de refs; o Playwright continua sendo o mecanismo principal de ações.
- Screenshots de página para o navegador `openclaw` gerenciado quando um WebSocket CDP
  por aba está disponível
- Screenshots de página para perfis `existing-session` / Chrome MCP
- Screenshots por ref (`--ref`) de `existing-session` a partir da saída de snapshot

O que ainda precisa de Playwright:

- `navigate`
- `act`
- Snapshots AI que dependem do formato nativo de AI snapshot do Playwright
- Screenshots de elemento com seletor CSS (`--element`)
- Exportação completa de PDF do navegador

Screenshots de elementos também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, repare as dependências de runtime empacotadas do Plugin de navegador para que `playwright-core` seja instalado,
depois reinicie o gateway. Para instalações empacotadas, execute `openclaw doctor --fix`.
Para Docker, instale também os binários do navegador Chromium conforme mostrado abaixo.

#### Instalação do Playwright no Docker

Se o Gateway estiver sendo executado em Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI empacotada:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads do navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Um pequeno servidor de controle loopback aceita solicitações HTTP e se conecta a navegadores baseados em Chromium via CDP. Ações avançadas (click/type/snapshot/PDF) passam pelo Playwright sobre o CDP; quando o Playwright está ausente, apenas operações sem Playwright ficam disponíveis. O agente vê uma interface estável enquanto navegadores e perfis locais/remotos podem ser trocados livremente por baixo.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar a um perfil específico, e `--json` para saída legível por máquina.

<AccordionGroup>

<Accordion title="Básico: status, abas, abrir/focar/fechar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # inicialização headless pontual gerenciada localmente
openclaw browser stop            # também limpa emulação em CDP remoto/somente anexação
openclaw browser tabs
openclaw browser tab             # atalho para a aba atual
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspeção: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # ou --ref e12
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

<Accordion title="Ações: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # ou e12 para role refs
openclaw browser click-coords 120 340        # coordenadas da viewport
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Estado: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear para remover
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Observações:

- `upload` e `dialog` são chamadas de **preparação**; execute-as antes do click/press que aciona o seletor/diálogo.
- `click`/`type`/etc exigem uma `ref` de `snapshot` (numérica `12`, role ref `e12` ou ref ARIA acionável `ax12`). Seletores CSS intencionalmente não são compatíveis com ações. Use `click-coords` quando a posição visível na viewport for o único alvo confiável.
- Caminhos de download, trace e upload são restritos às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` também pode definir entradas de arquivo diretamente via `--input-ref` ou `--element`.

IDs de aba estáveis e rótulos sobrevivem à substituição de raw target do Chromium quando o OpenClaw
consegue provar a aba substituta, como mesma URL ou uma única aba antiga se tornando uma
única aba nova após o envio de formulário. IDs de raw target ainda são voláteis; em scripts, prefira
`suggestedTargetId` de `tabs`.

Visão geral dos flags de snapshot:

- `--format ai` (padrão com Playwright): AI snapshot com refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade com refs `axN`. Quando o Playwright está disponível, o OpenClaw vincula refs com IDs DOM backend à página ativa para que ações posteriores possam usá-las; caso contrário, trate a saída apenas como inspeção.
- `--efficient` (ou `--mode efficient`): preset compacto de role snapshot. Defina `browser.snapshotDefaults.mode: "efficient"` para torná-lo o padrão (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um role snapshot com refs `ref=e12`. `--frame "<iframe>"` limita role snapshots a um iframe.
- `--labels` adiciona um screenshot somente da viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `--urls` adiciona destinos de links descobertos aos AI snapshots.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **AI snapshot (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot em texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida via `aria-ref` do Playwright.

- **Role snapshot (role refs como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em role com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir um screenshot da viewport com rótulos `e12` sobrepostos.
  - Adicione `--urls` quando o texto do link for ambíguo e o agente precisar de
    alvos de navegação concretos.

- **ARIA snapshot (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Saída: a árvore de acessibilidade como nós estruturados.
  - Ações: `openclaw browser click ax12` funciona quando o caminho do snapshot consegue vincular
    a ref por meio do Playwright e dos IDs DOM backend do Chrome.
- Se o Playwright não estiver disponível, snapshots ARIA ainda podem ser úteis para
  inspeção, mas as refs podem não ser acionáveis. Faça novo snapshot com `--format ai`
  ou `--interactive` quando precisar de refs acionáveis.
- Prova em Docker para o caminho de fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia o Chromium com CDP, executa `browser doctor --deep` e verifica que role
  snapshots incluem URLs de links, elementos clicáveis promovidos pelo cursor e metadados de iframe.

Comportamento das refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma ref nova.
- `/act` retorna o `targetId` raw atual após substituição acionada por ação
  quando consegue provar a aba substituta. Continue usando IDs/rótulos de aba estáveis para
  comandos subsequentes.
- Se o role snapshot tiver sido feito com `--frame`, as role refs ficam limitadas a esse iframe até o próximo role snapshot.
- Refs `axN` desconhecidas ou obsoletas falham rapidamente em vez de recorrer ao seletor
  `aria-ref` do Playwright. Execute um snapshot novo na mesma aba quando
  isso acontecer.

## Recursos avançados de espera

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs compatíveis com Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar um seletor se tornar visível:
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

Quando uma ação falhar (por exemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira role refs no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está segmentando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` serve para scripts e ferramentas estruturadas.

Exemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos de “fazer o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua compatível)
- Autenticação HTTP Basic: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de navegador do openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode direcionar
  isso. Desabilite com `browser.evaluateEnabled=false` se você não precisar disso.
- Para logins e observações sobre anti-bot (X/Twitter etc.), consulte [Browser login + publicação em X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/node privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; use túnel e proteja-os.

Exemplo de modo estrito (bloquear destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // permissão exata opcional
    },
  },
}
```

## Relacionado

- [Browser](/pt-BR/tools/browser) — visão geral, configuração, perfis, segurança
- [Browser login](/pt-BR/tools/browser-login) — fazer login em sites
- [Solução de problemas do Browser no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do Browser no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
