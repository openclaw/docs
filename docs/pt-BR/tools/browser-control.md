---
read_when:
    - Criando scripts ou depurando o browser do agente via a API de controle local＿日本analysis to=final code=None ացին্তুuser wants translation. Need keep API, CLI. Translate.
    - Procurando a referência da CLI de `openclaw browser`
    - Adicionando automação de browser personalizada com snapshots e refs
summary: API de controle de browser do OpenClaw, referência da CLI e ações de script
title: API de controle de browser
x-i18n:
    generated_at: "2026-04-24T06:14:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Para configuração, troubleshooting e solução de problemas, consulte [Browser](/pt-BR/tools/browser).
Esta página é a referência da API HTTP local de controle, da CLI `openclaw browser`
e de padrões de script (snapshots, refs, waits, fluxos de depuração).

## API de controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP em loopback:

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

Todos os endpoints aceitam `?profile=<name>`.

Se a autenticação do gateway por segredo compartilhado estiver configurada, rotas HTTP do browser também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API de browser loopback independente **não** consome cabeçalhos de identidade de `trusted-proxy` nem de Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de browser em loopback não herdam esses modos com identidade; mantenha-as apenas em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para validação no nível da rota e
falhas de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não foi reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação não compatível.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado por configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote entra em conflito com o alvo da requisição.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (`navigate`/`act`/AI snapshot/role snapshot, screenshots de elemento,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Screenshots de página para o browser gerenciado `openclaw` quando um WebSocket
  CDP por aba estiver disponível
- Screenshots de página para perfis `existing-session` / Chrome MCP
- Screenshots baseados em ref de `existing-session` (`--ref`) a partir da saída do snapshot

O que ainda exige Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Screenshots de elemento com seletor CSS (`--element`)
- Exportação PDF completa do browser

Screenshots de elemento também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, repare as dependências de runtime do plugin de browser integrado para que `playwright-core` seja instalado,
depois reinicie o gateway. Para instalações empacotadas, execute `openclaw doctor --fix`.
Para Docker, instale também os binários do browser Chromium, como mostrado abaixo.

#### Instalação do Playwright em Docker

Se seu Gateway roda em Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI integrada em vez disso:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads do browser, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Um pequeno servidor de controle em loopback aceita requisições HTTP e se conecta a browsers baseados em Chromium via CDP. Ações avançadas (click/type/snapshot/PDF) passam pelo Playwright sobre o CDP; quando o Playwright não está disponível, apenas operações sem Playwright ficam disponíveis. O agente vê uma interface estável enquanto browsers e perfis locais/remotos são trocados livremente por baixo.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para mirar em um perfil específico, e `--json` para saída legível por máquina.

<AccordionGroup>

<Accordion title="Básico: status, abas, abrir/focar/fechar">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # também limpa emulação em attach-only/remote CDP
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
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
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
openclaw browser click 12 --double           # ou e12 para refs de role
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

- `upload` e `dialog` são chamadas de **arming**; execute-as antes do click/press que dispara o seletor/dialog.
- `click`/`type`/etc exigem uma `ref` de `snapshot` (numérica `12` ou ref de role `e12`). Seletores CSS intencionalmente não são compatíveis com ações.
- Caminhos de download, trace e upload são limitados às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` também pode definir diretamente entradas de arquivo via `--input-ref` ou `--element`.

Flags de snapshot em resumo:

- `--format ai` (padrão com Playwright): AI snapshot com refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade, sem refs; apenas inspeção.
- `--efficient` (ou `--mode efficient`): preset de role snapshot compacto. Defina `browser.snapshotDefaults.mode: "efficient"` para torná-lo o padrão (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um role snapshot com refs `ref=e12`. `--frame "<iframe>"` limita role snapshots a um iframe.
- `--labels` adiciona uma screenshot apenas da viewport com labels de ref sobrepostas (imprime `MEDIA:<path>`).

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **AI snapshot (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida via `aria-ref` do Playwright.

- **Role snapshot (refs de role como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em roles com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma screenshot da viewport com labels `e12` sobrepostas.

Comportamento de refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma ref nova.
- Se o role snapshot foi obtido com `--frame`, refs de role ficam limitadas a esse iframe até o próximo role snapshot.

## Power-ups de wait

Você pode esperar por mais coisas além de tempo/texto:

- Esperar por URL (globs compatíveis pelo Playwright):
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

Quando uma ação falhar (por exemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de role no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` é para scripts e tooling estruturado.

Exemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive), para que tools possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Estes são úteis para workflows de “fazer o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua compatível)
- Autenticação HTTP Basic: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Timezone / localidade: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (presets de device do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de browser `openclaw` pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Prompt injection pode
  direcionar isso. Desabilite com `browser.evaluateEnabled=false` se não precisar.
- Para logins e observações anti-bot (X/Twitter etc.), consulte [Login de browser + postagem em X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/node privado (apenas loopback ou tailnet).
- Endpoints CDP remotos são poderosos; faça tunnel e proteja-os.

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
- [Login de browser](/pt-BR/tools/browser-login) — autenticação em sites
- [Solução de problemas do Browser no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do Browser no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
