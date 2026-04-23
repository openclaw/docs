---
read_when:
    - Você usa `openclaw browser` e quer exemplos para tarefas comuns
    - Você quer controlar um browser em execução em outra máquina por meio de um host Node
    - Você quer se conectar ao Chrome local já autenticado via Chrome MCP
summary: Referência da CLI para `openclaw browser` (ciclo de vida, perfis, abas, ações, estado e depuração)
title: browser
x-i18n:
    generated_at: "2026-04-23T14:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gerencie a superfície de controle de browser do OpenClaw e execute ações de browser (ciclo de vida, perfis, abas, snapshots, capturas de tela, navegação, entrada, emulação de estado e depuração).

Relacionado:

- Ferramenta e API de browser: [Ferramenta de browser](/pt-BR/tools/browser)

## Sinalizadores comuns

- `--url <gatewayWsUrl>`: URL do WebSocket do Gateway (usa a configuração por padrão).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: tempo limite da solicitação (ms).
- `--expect-final`: aguarda uma resposta final do Gateway.
- `--browser-profile <name>`: escolhe um perfil de browser (padrão vindo da configuração).
- `--json`: saída legível por máquina (onde houver suporte).

## Início rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Solução rápida de problemas

Se `start` falhar com `not reachable after start`, primeiro faça a solução de problemas da prontidão do CDP. Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falharem, o plano de controle do browser está saudável e a falha geralmente é a política SSRF de navegação.

Sequência mínima:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientação detalhada: [Solução de problemas de browser](/pt-BR/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Observações:

- Para perfis `attachOnly` e perfis remotos de CDP, `openclaw browser stop` fecha a
  sessão de controle ativa e limpa substituições temporárias de emulação mesmo quando
  o OpenClaw não iniciou o processo do browser por conta própria.
- Para perfis locais gerenciados, `openclaw browser stop` interrompe o processo
  do browser iniciado.

## Se o comando estiver ausente

Se `openclaw browser` for um comando desconhecido, verifique `plugins.allow` em
`~/.openclaw/openclaw.json`.

Quando `plugins.allow` estiver presente, o Plugin de browser empacotado precisa ser listado
explicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` não restaura o subcomando da CLI quando a lista de permissões de Plugin
exclui `browser`.

Relacionado: [Ferramenta de browser](/pt-BR/tools/browser#missing-browser-command-or-tool)

## Perfis

Perfis são configurações nomeadas de roteamento de browser. Na prática:

- `openclaw`: inicia ou se conecta a uma instância dedicada do Chrome gerenciada pelo OpenClaw (diretório isolado de dados do usuário).
- `user`: controla sua sessão existente do Chrome já autenticada via Chrome DevTools MCP.
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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / captura de tela / ações

Snapshot:

```bash
openclaw browser snapshot
```

Captura de tela:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Observações:

- `--full-page` é somente para capturas da página inteira; não pode ser combinado com `--ref`
  nem `--element`.
- Perfis `existing-session` / `user` oferecem suporte a capturas de tela da página e capturas com `--ref`
  a partir da saída de snapshot, mas não a capturas com CSS `--element`.

Navegar/clicar/digitar (automação de interface baseada em ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Helpers de arquivo e diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

Esse caminho é somente para host. Para Docker, servidores headless, Browserless ou outras configurações remotas, use um perfil CDP.

Limites atuais de `existing-session`:

- ações guiadas por snapshot usam refs, não seletores CSS
- `click` é somente clique com o botão esquerdo
- `type` não oferece suporte a `slowly=true`
- `press` não oferece suporte a `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` e `evaluate` rejeitam
  substituições de tempo limite por chamada
- `select` oferece suporte a apenas um valor
- `wait --load networkidle` não é compatível
- uploads de arquivo exigem `--ref` / `--input-ref`, não oferecem suporte a CSS
  `--element` e no momento oferecem suporte a um arquivo por vez
- hooks de diálogo não oferecem suporte a `--timeout`
- capturas de tela oferecem suporte a capturas de página e `--ref`, mas não a CSS `--element`
- `responsebody`, interceptação de download, exportação de PDF e ações em lote ainda
  exigem um browser gerenciado ou perfil CDP bruto

## Controle remoto de browser (proxy de host Node)

Se o Gateway for executado em uma máquina diferente da máquina do browser, execute um **host Node** na máquina que tem Chrome/Brave/Edge/Chromium. O Gateway fará proxy das ações do browser para esse Node (nenhum servidor separado de controle de browser é necessário).

Use `gateway.nodes.browser.mode` para controlar o roteamento automático e `gateway.nodes.browser.node` para fixar um Node específico se vários estiverem conectados.

Segurança + configuração remota: [Ferramenta de browser](/pt-BR/tools/browser), [Acesso remoto](/pt-BR/gateway/remote), [Tailscale](/pt-BR/gateway/tailscale), [Segurança](/pt-BR/gateway/security)
