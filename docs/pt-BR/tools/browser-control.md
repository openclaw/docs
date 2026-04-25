---
read_when:
    - Criando scripts ou depurando o navegador do agente via a API de controle local
    - Procurando a referência da CLI `openclaw browser`
    - Adicionando automação personalizada do navegador com snapshots e refs
summary: API de controle do navegador do OpenClaw, referência da CLI e ações de script
title: API de controle do navegador
x-i18n:
    generated_at: "2026-04-25T13:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Para configuração, ajuste e solução de problemas, consulte [Navegador](/pt-BR/tools/browser).
Esta página é a referência para a API HTTP de controle local, a CLI `openclaw browser`
e padrões de script (snapshots, refs, esperas, fluxos de depuração).

## API de controle (opcional)

Somente para integrações locais, o Gateway expõe uma pequena API HTTP de loopback:

- Status/iniciar/parar: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/captura de tela: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos os endpoints aceitam `?profile=<name>`. `POST /start?headless=true` solicita
uma inicialização headless pontual para perfis locais gerenciados sem alterar a
configuração persistida do navegador; perfis apenas de anexação, CDP remoto e sessão existente rejeitam
essa substituição porque o OpenClaw não inicia esses processos de navegador.

Se a autenticação do gateway com segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API independente de navegador em loopback **não** consome cabeçalhos de
  trusted-proxy nem de identidade do Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, estas rotas de navegador em loopback
  não herdam esses modos com identidade; mantenha-as somente em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para falhas de validação em nível de rota e
de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação não compatível.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado por configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote entra em conflito com o alvo da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas em tempo de execução ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/AI snapshot/role snapshot, capturas de tela de elemento,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornarão
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Capturas de tela da página para o navegador `openclaw` gerenciado quando um WebSocket
  CDP por aba está disponível
- Capturas de tela da página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em ref de `existing-session` (`--ref`) a partir da saída de snapshot

O que ainda exige Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Capturas de tela de elementos com seletor CSS (`--element`)
- Exportação completa de PDF do navegador

Capturas de tela de elementos também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, repare as
dependências de runtime do plugin de navegador empacotado para que `playwright-core` seja instalado
e depois reinicie o gateway. Para instalações empacotadas, execute `openclaw doctor --fix`.
Para Docker, instale também os binários do navegador Chromium conforme mostrado abaixo.

#### Instalação do Playwright no Docker

Se o seu Gateway for executado no Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI empacotada:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads do navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido por meio de
`OPENCLAW_HOME_VOLUME` ou de um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (interno)

Um pequeno servidor de controle em loopback aceita solicitações HTTP e se conecta a navegadores baseados em Chromium via CDP. Ações avançadas (click/type/snapshot/PDF) passam pelo Playwright sobre o CDP; quando o Playwright está ausente, apenas operações que não dependem de Playwright ficam disponíveis. O agente vê uma interface estável enquanto navegadores e perfis locais/remotos podem ser trocados livremente por baixo.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar um perfil específico e `--json` para saída legível por máquina.

<AccordionGroup>

<Accordion title="Básico: status, abas, abrir/focar/fechar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # inicialização headless local gerenciada de uso único
openclaw browser stop            # também limpa a emulação em CDP remoto/apenas anexação
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

<Accordion title="Inspeção: captura de tela, snapshot, console, erros, requests">

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

<Accordion title="Ações: navegar, clicar, digitar, arrastar, esperar, avaliar">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # ou e12 para refs de role
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

<Accordion title="Estado: cookies, armazenamento, offline, headers, geo, dispositivo">

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

- `upload` e `dialog` são chamadas de **preparação**; execute-as antes do click/press que aciona o seletor de arquivo/diálogo.
- `click`/`type`/etc exigem uma `ref` de `snapshot` (numérica `12`, ref de role `e12` ou ref ARIA acionável `ax12`). Seletores CSS não são intencionalmente compatíveis com ações. Use `click-coords` quando a posição visível na viewport for o único alvo confiável.
- Caminhos de download, trace e upload são restritos às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` também pode definir diretamente inputs de arquivo via `--input-ref` ou `--element`.

Sinalizadores de snapshot em resumo:

- `--format ai` (padrão com Playwright): AI snapshot com refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade com refs `axN`. Quando o Playwright está disponível, o OpenClaw vincula refs com IDs DOM de backend à página em tempo real para que ações subsequentes possam usá-las; caso contrário, trate a saída apenas como inspeção.
- `--efficient` (ou `--mode efficient`): predefinição compacta de role snapshot. Defina `browser.snapshotDefaults.mode: "efficient"` para tornar isso o padrão (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um role snapshot com refs `ref=e12`. `--frame "<iframe>"` limita role snapshots a um iframe.
- `--labels` adiciona uma captura de tela apenas da viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `--urls` anexa destinos de links descobertos aos AI snapshots.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **AI snapshot (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot em texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida por meio de `aria-ref` do Playwright.

- **Role snapshot (refs de role como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em role com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida via `getByRole(...)` (mais `nth()` para duplicados).
  - Adicione `--labels` para incluir uma captura de tela da viewport com rótulos `e12` sobrepostos.
  - Adicione `--urls` quando o texto do link for ambíguo e o agente precisar de
    alvos concretos de navegação.

- **ARIA snapshot (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Saída: a árvore de acessibilidade como nós estruturados.
  - Ações: `openclaw browser click ax12` funciona quando o caminho do snapshot consegue vincular
    a ref via Playwright e IDs DOM de backend do Chrome.
  - Se o Playwright não estiver disponível, snapshots ARIA ainda podem ser úteis para
    inspeção, mas as refs podem não ser acionáveis. Gere um novo snapshot com `--format ai`
    ou `--interactive` quando você precisar de refs para ações.

Comportamento das refs:

- As refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma ref nova.
- Se o role snapshot foi obtido com `--frame`, as refs de role ficam limitadas a esse iframe até o próximo role snapshot.
- Refs `axN` desconhecidas ou obsoletas falham rapidamente em vez de recorrerem ao
  seletor `aria-ref` do Playwright. Execute um novo snapshot na mesma aba quando
  isso acontecer.

## Recursos extras de espera

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs compatíveis com Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar que um seletor fique visível:
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

Quando uma ação falha (por exemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de role no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração aprofundada: grave um trace:
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

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive), para que as ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos do tipo “fazer o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Armazenamento: `storage local|session get|set|clear`
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
- Para logins e observações sobre anti-bot (X/Twitter etc.), consulte [Login no navegador + publicação no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/node privado (somente loopback ou tailnet).
- Endpoints remotos de CDP são poderosos; use túnel e proteção.

Exemplo de modo estrito (bloquear destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exato opcional
    },
  },
}
```

## Relacionado

- [Navegador](/pt-BR/tools/browser) — visão geral, configuração, perfis, segurança
- [Login no navegador](/pt-BR/tools/browser-login) — fazendo login em sites
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
