---
read_when:
    - Você usa `openclaw browser` e quer exemplos para tarefas comuns
    - Você quer controlar um navegador em execução em outra máquina por meio de um host Node
    - Você quer se conectar ao seu Chrome local com sessão iniciada via Chrome MCP
summary: Referência da CLI para `openclaw browser` (ciclo de vida, perfis, abas, ações, estado e depuração)
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:24:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gerencie a superfície de controle do navegador do OpenClaw e execute ações do navegador (ciclo de vida, perfis, abas, snapshots, capturas de tela, navegação, entrada, emulação de estado e depuração).

Relacionado:

- Ferramenta Browser + API: [ferramenta Browser](/pt-BR/tools/browser)

## Flags comuns

- `--url <gatewayWsUrl>`: URL do WebSocket do Gateway (usa a configuração por padrão).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: tempo limite da solicitação (ms).
- `--expect-final`: aguarda uma resposta final do Gateway.
- `--browser-profile <name>`: escolhe um perfil de navegador (padrão da configuração).
- `--json`: saída legível por máquina (onde houver suporte).

## Início rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Os agentes podem executar a mesma verificação de prontidão com `browser({ action: "doctor" })`.

## Solução rápida de problemas

Se `start` falhar com `not reachable after start`, primeiro solucione a prontidão do CDP. Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falhar, o plano de controle do navegador está íntegro e a falha geralmente é a política de SSRF de navegação.

Sequência mínima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientação detalhada: [solução de problemas do Browser](/pt-BR/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Observações:

- `doctor --deep` adiciona uma sondagem de snapshot ao vivo. Isso é útil quando a prontidão básica do CDP está verde, mas você quer uma prova de que a aba atual pode ser inspecionada.
- Para perfis `attachOnly` e CDP remotos, `openclaw browser stop` fecha a sessão de controle ativa e limpa substituições temporárias de emulação, mesmo quando o OpenClaw não iniciou o processo do navegador por conta própria.
- Para perfis locais gerenciados, `openclaw browser stop` interrompe o processo do navegador iniciado.
- `openclaw browser start --headless` se aplica apenas a essa solicitação de início e apenas quando o OpenClaw inicia um navegador local gerenciado. Isso não reescreve `browser.headless` nem a configuração do perfil, e não faz nada para um navegador que já esteja em execução.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis locais gerenciados são executados em modo headless automaticamente, a menos que `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` ou `browser.profiles.<name>.headless=false` solicitem explicitamente um navegador visível.

## Se o comando estiver ausente

Se `openclaw browser` for um comando desconhecido, verifique `plugins.allow` em `~/.openclaw/openclaw.json`.

Quando `plugins.allow` está presente, o Plugin Browser incluído no pacote precisa ser listado explicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` não restaura o subcomando da CLI quando a allowlist de plugins exclui `browser`.

Relacionado: [ferramenta Browser](/pt-BR/tools/browser#missing-browser-command-or-tool)

## Perfis

Perfis são configurações nomeadas de roteamento do navegador. Na prática:

- `openclaw`: inicia ou se conecta a uma instância dedicada do Chrome gerenciada pelo OpenClaw (diretório de dados do usuário isolado).
- `user`: controla sua sessão existente do Chrome com login via Chrome MCP.
- perfis CDP personalizados: apontam para um endpoint CDP local ou remoto.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Use um perfil específico:

```bash
openclaw browser --browser-profile work tabs
```

## Abas

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` retorna primeiro `suggestedTargetId`, depois o `tabId` estável, como `t1`, o rótulo opcional e o `targetId` bruto. Os agentes devem passar `suggestedTargetId` de volta para `focus`, `close`, snapshots e ações. Você pode atribuir um rótulo com `open --label`, `tab new --label` ou `tab label`; rótulos, IDs de aba, IDs de destino brutos e prefixos exclusivos de target-id são todos aceitos. Quando o Chromium substitui o destino bruto subjacente durante uma navegação ou envio de formulário, o OpenClaw mantém o `tabId`/rótulo estável anexado à aba de substituição quando consegue comprovar a correspondência. IDs de destino brutos continuam voláteis; prefira `suggestedTargetId`.

## Snapshot / captura de tela / ações

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Captura de tela:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Observações:

- `--full-page` é para capturas da página inteira; não pode ser combinado com `--ref` ou `--element`.
- Perfis `existing-session` / `user` oferecem suporte a capturas de página e capturas com `--ref` a partir da saída de snapshot, mas não a capturas CSS com `--element`.
- `--labels` sobrepõe refs do snapshot atual à captura de tela.
- `snapshot --urls` adiciona destinos de links descobertos aos snapshots de IA para que os agentes possam escolher alvos de navegação diretos em vez de adivinhar apenas pelo texto do link.

Navigate/click/type (automação de UI baseada em ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

As respostas das ações retornam o `targetId` bruto atual após substituição de página acionada por ação, quando o OpenClaw consegue comprovar a aba de substituição. Scripts ainda devem armazenar e passar `suggestedTargetId`/rótulos para fluxos de trabalho de longa duração.

Auxiliares de arquivo + diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Perfis gerenciados do Chrome salvam downloads comuns acionados por clique no diretório de downloads do OpenClaw (`/tmp/openclaw/downloads` por padrão, ou a raiz temporária configurada). Use `waitfordownload` ou `download` quando o agente precisar aguardar um arquivo específico e retornar seu caminho; esses aguardadores explícitos assumem o próximo download.

## Estado e armazenamento

Viewport + emulação:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + armazenamento:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Depuração

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existente via MCP

Use o perfil `user` integrado ou crie seu próprio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Esse caminho é apenas para host. Para Docker, servidores headless, Browserless ou outras configurações remotas, use um perfil CDP.

Limitações atuais de existing-session:

- ações orientadas por snapshot usam refs, não seletores CSS
- `browser.actionTimeoutMs` define por padrão requisições `act` compatíveis para 60000 ms quando os chamadores omitem `timeoutMs`; `timeoutMs` por chamada ainda tem prioridade
- `click` é apenas clique esquerdo
- `type` não oferece suporte a `slowly=true`
- `press` não oferece suporte a `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` e `evaluate` rejeitam substituições de timeout por chamada
- `select` oferece suporte a apenas um valor
- `wait --load networkidle` não é compatível
- uploads de arquivo exigem `--ref` / `--input-ref`, não oferecem suporte a CSS `--element` e atualmente oferecem suporte a um arquivo por vez
- hooks de diálogo não oferecem suporte a `--timeout`
- capturas de tela oferecem suporte a capturas de página e `--ref`, mas não a CSS `--element`
- `responsebody`, interceptação de download, exportação para PDF e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto

## Controle remoto do navegador (proxy de host Node)

Se o Gateway estiver em execução em uma máquina diferente da do navegador, execute um **host Node** na máquina que tem Chrome/Brave/Edge/Chromium. O Gateway encaminhará as ações do navegador para esse Node (nenhum servidor separado de controle do navegador é necessário).

Use `gateway.nodes.browser.mode` para controlar o roteamento automático e `gateway.nodes.browser.node` para fixar um Node específico se houver vários conectados.

Segurança + configuração remota: [ferramenta Browser](/pt-BR/tools/browser), [acesso remoto](/pt-BR/gateway/remote), [Tailscale](/pt-BR/gateway/tailscale), [Segurança](/pt-BR/gateway/security)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Browser](/pt-BR/tools/browser)
