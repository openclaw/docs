---
read_when:
    - Criação de scripts ou depuração do navegador do agente por meio da API de controle local
    - Procurando a referência da CLI `openclaw browser`
    - Adicionando automação personalizada do navegador com instantâneos e referências
summary: API de controle do navegador do OpenClaw, referência da CLI e ações de scripting
title: API de controle do navegador
x-i18n:
    generated_at: "2026-04-30T10:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

Para instalação, configuração e solução de problemas, consulte [Browser](/pt-BR/tools/browser).
Esta página é a referência para a API HTTP de controle local, a CLI `openclaw browser`
e padrões de script (snapshots, refs, esperas, fluxos de depuração).

## API de controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP de loopback:

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
inicialização headless local gerenciada de uso único sem alterar a configuração
persistida do navegador; perfis attach-only, CDP remoto e existing-session rejeitam
essa substituição porque o OpenClaw não inicia esses processos de navegador.

Se a autenticação do gateway por segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Notas:

- Esta API independente de navegador por loopback **não** consome cabeçalhos de identidade de trusted-proxy ou
  Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de navegador por loopback
  não herdarão esses modos que carregam identidade; mantenha-as apenas em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para validação em nível de rota e
falhas de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação sem suporte.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado pela configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote entra em conflito com o destino da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não tem suporte para perfis existing-session.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/snapshot de IA/snapshot de função, capturas de tela de elementos,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Snapshots de acessibilidade em estilo de função (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando um WebSocket CDP por aba está disponível. Isso é
  um fallback para inspeção e descoberta de refs; o Playwright continua sendo o mecanismo
  de ação principal.
- Capturas de tela de página para o navegador `openclaw` gerenciado quando um WebSocket CDP
  por aba está disponível
- Capturas de tela de página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em ref (`--ref`) de `existing-session` a partir da saída do snapshot

O que ainda precisa do Playwright:

- `navigate`
- `act`
- Snapshots de IA que dependem do formato nativo de snapshot de IA do Playwright
- Capturas de tela de elementos por seletor CSS (`--element`)
- exportação completa de PDF do navegador

Capturas de tela de elementos também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, repare as
dependências de runtime do plugin de navegador incluído para que `playwright-core` seja instalado,
depois reinicie o gateway. Para instalações empacotadas, execute `openclaw doctor --fix`.
Para Docker, instale também os binários do navegador Chromium conforme mostrado abaixo.

#### Instalação do Playwright no Docker

Se o seu Gateway roda no Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI incluída em vez disso:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads do navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido por meio de
`OPENCLAW_HOME_VOLUME` ou um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (interno)

Um pequeno servidor de controle por loopback aceita solicitações HTTP e se conecta a navegadores baseados em Chromium via CDP. Ações avançadas (click/type/snapshot/PDF) passam pelo Playwright sobre CDP; quando o Playwright está ausente, apenas operações que não dependem do Playwright ficam disponíveis. O agente vê uma interface estável enquanto navegadores e perfis locais/remotos são trocados livremente por baixo.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar a um perfil específico e `--json` para saída legível por máquina.

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

<Accordion title="Estado: cookies, armazenamento, offline, cabeçalhos, geo, dispositivo">

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

Notas:

- `upload` e `dialog` são chamadas de **preparo**; execute-as antes do click/press que aciona o seletor/diálogo.
- `click`/`type`/etc exigem uma `ref` de `snapshot` (numérica `12`, ref de função `e12` ou ref ARIA acionável `ax12`). Seletores CSS intencionalmente não têm suporte para ações. Use `click-coords` quando a posição visível no viewport for o único alvo confiável.
- Caminhos de download, trace e upload são restritos às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.

IDs e rótulos estáveis de abas sobrevivem à substituição de raw-target do Chromium quando o OpenClaw
consegue provar a aba substituta, como a mesma URL ou uma única aba antiga se tornando uma
única nova aba após o envio de formulário. IDs de raw target ainda são voláteis; prefira
`suggestedTargetId` de `tabs` em scripts.

Visão geral dos flags de snapshot:

- `--format ai` (padrão com Playwright): snapshot de IA com refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade com refs `axN`. Quando o Playwright está disponível, o OpenClaw vincula refs com IDs DOM de backend à página ativa para que ações seguintes possam usá-las; caso contrário, trate a saída apenas como inspeção.
- `--efficient` (ou `--mode efficient`): predefinição compacta de snapshot de função. Defina `browser.snapshotDefaults.mode: "efficient"` para tornar isso o padrão (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um snapshot de função com refs `ref=e12`. `--frame "<iframe>"` limita snapshots de função a um iframe.
- `--labels` adiciona uma captura de tela apenas do viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `--urls` acrescenta destinos de links descobertos aos snapshots de IA.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **Snapshot de IA (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida via `aria-ref` do Playwright.

- **Snapshot de função (refs de função como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em função com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela do viewport com rótulos `e12` sobrepostos.
  - Adicione `--urls` quando o texto do link for ambíguo e o agente precisar de alvos de
    navegação concretos.

- **Snapshot ARIA (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Saída: a árvore de acessibilidade como nós estruturados.
  - Ações: `openclaw browser click ax12` funciona quando o caminho de snapshot consegue vincular
    a ref pelo Playwright e IDs DOM de backend do Chrome.
- Se o Playwright não estiver disponível, snapshots ARIA ainda podem ser úteis para
  inspeção, mas as refs podem não ser acionáveis. Gere novamente o snapshot com `--format ai`
  ou `--interactive` quando precisar de refs de ação.
- Prova Docker para o caminho de fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia o Chromium com CDP, executa `browser doctor --deep` e verifica se snapshots de função
  incluem URLs de links, clicáveis promovidos por cursor e metadados de iframe.

Comportamento de refs:

- As referências **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma referência nova.
- `/act` retorna o `targetId` bruto atual após a substituição acionada pela ação
  quando consegue comprovar a aba substituta. Continue usando ids/rótulos de aba estáveis para
  comandos de acompanhamento.
- Se o snapshot de função foi obtido com `--frame`, as referências de função ficam escopadas a esse iframe até o próximo snapshot de função.
- Referências `axN` desconhecidas ou obsoletas falham rapidamente em vez de passar para
  o seletor `aria-ref` do Playwright. Execute um snapshot novo na mesma aba quando
  isso acontecer.

## Aprimoramentos de espera

Você pode aguardar mais do que apenas tempo/texto:

- Aguardar URL (globs compatíveis com Playwright):
  - `openclaw browser wait --url "**/dash"`
- Aguardar estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Aguardar um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Aguardar um seletor ficar visível:
  - `openclaw browser wait "#main"`

Eles podem ser combinados:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Fluxos de trabalho de depuração

Quando uma ação falha (por exemplo, “não visível”, “violação de modo estrito”, “coberto”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira referências de função no modo interativo)
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

Snapshots de função em JSON incluem `refs` mais um pequeno bloco `stats` (linhas/caracteres/referências/interativo) para que ferramentas consigam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos de trabalho do tipo “fazer o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Armazenamento: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Cabeçalhos: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua compatível)
- Autenticação básica HTTP: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (predefinições de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil do navegador openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode direcionar
  isso. Desative com `browser.evaluateEnabled=false` se não precisar.
- Para logins e observações anti-bot (X/Twitter etc.), consulte [Login no navegador + publicação no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/Node privado (loopback ou somente tailnet).
- Endpoints CDP remotos são poderosos; use túnel e proteja-os.

Exemplo de modo estrito (bloqueia destinos privados/internos por padrão):

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

## Relacionado

- [Navegador](/pt-BR/tools/browser) — visão geral, configuração, perfis, segurança
- [Login no navegador](/pt-BR/tools/browser-login) — entrar em sites
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
