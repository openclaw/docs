---
read_when:
    - Você usa `openclaw browser` e quer exemplos para tarefas comuns
    - Você quer controlar um navegador em execução em outra máquina por meio de um host Node
    - Você quer se conectar ao seu Chrome local autenticado via Chrome MCP
summary: Referência da CLI para `openclaw browser` (ciclo de vida, perfis, abas, ações, estado e depuração)
title: Browser
x-i18n:
    generated_at: "2026-04-24T05:44:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gerencie a superfície de controle de navegador do OpenClaw e execute ações de navegador (ciclo de vida, perfis, abas, snapshots, capturas de tela, navegação, entrada, emulação de estado e depuração).

Relacionado:

- Ferramenta de Browser + API: [Ferramenta de Browser](/pt-BR/tools/browser)

## Flags comuns

- `--url <gatewayWsUrl>`: URL do WebSocket do Gateway (usa a configuração por padrão).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: timeout da solicitação (ms).
- `--expect-final`: aguarda uma resposta final do Gateway.
- `--browser-profile <name>`: escolhe um perfil de navegador (padrão vindo da configuração).
- `--json`: saída legível por máquina (onde houver suporte).

## Início rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Solução rápida de problemas

Se `start` falhar com `not reachable after start`, primeiro investigue a prontidão do CDP. Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falharem, o plano de controle do navegador está íntegro e a falha normalmente é a política SSRF de navegação.

Sequência mínima:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientação detalhada: [Solução de problemas do Browser](/pt-BR/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Observações:

- Para perfis `attachOnly` e CDP remotos, `openclaw browser stop` fecha a
  sessão de controle ativa e limpa substituições temporárias de emulação mesmo
  quando o OpenClaw não iniciou o processo do navegador por conta própria.
- Para perfis locais gerenciados, `openclaw browser stop` interrompe o processo
  de navegador iniciado.

## Se o comando estiver ausente

Se `openclaw browser` for um comando desconhecido, verifique `plugins.allow` em
`~/.openclaw/openclaw.json`.

Quando `plugins.allow` estiver presente, o Plugin incluído de browser precisa ser listado
explicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` não restaura o subcomando da CLI quando a
allowlist de Plugin exclui `browser`.

Relacionado: [Ferramenta de Browser](/pt-BR/tools/browser#missing-browser-command-or-tool)

## Perfis

Perfis são configurações nomeadas de roteamento do navegador. Na prática:

- `openclaw`: inicia ou se conecta a uma instância dedicada do Chrome gerenciada pelo OpenClaw (diretório isolado de dados do usuário).
- `user`: controla sua sessão existente e autenticada do Chrome via Chrome DevTools MCP.
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

- `--full-page` é apenas para capturas da página; não pode ser combinado com `--ref`
  ou `--element`.
- Perfis `existing-session` / `user` oferecem suporte a capturas da página e capturas
  com `--ref` a partir da saída de snapshot, mas não a capturas CSS com `--element`.

Navigate/click/type (automação de UI baseada em ref):

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

Auxiliares de arquivo + caixa de diálogo:

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

Use o perfil integrado `user` ou crie seu próprio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Esse caminho é apenas para host. Para Docker, servidores headless, Browserless ou outras configurações remotas, use um perfil CDP.

Limites atuais de existing-session:

- ações orientadas por snapshot usam refs, não seletores CSS
- `click` é apenas clique esquerdo
- `type` não oferece suporte a `slowly=true`
- `press` não oferece suporte a `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` e `evaluate` rejeitam
  substituições de timeout por chamada
- `select` oferece suporte a apenas um valor
- `wait --load networkidle` não é compatível
- uploads de arquivo exigem `--ref` / `--input-ref`, não oferecem suporte a CSS
  `--element` e atualmente oferecem suporte a um arquivo por vez
- hooks de caixa de diálogo não oferecem suporte a `--timeout`
- capturas de tela oferecem suporte a capturas da página e `--ref`, mas não a CSS `--element`
- `responsebody`, interceptação de download, exportação para PDF e ações em lote ainda
  exigem um navegador gerenciado ou perfil CDP bruto

## Controle remoto de navegador (proxy de host Node)

Se o Gateway estiver em execução em uma máquina diferente da do navegador, execute um **host Node** na máquina que possui Chrome/Brave/Edge/Chromium. O Gateway fará proxy das ações do navegador para esse node (não é necessário um servidor separado de controle do navegador).

Use `gateway.nodes.browser.mode` para controlar o roteamento automático e `gateway.nodes.browser.node` para fixar um node específico se vários estiverem conectados.

Segurança + configuração remota: [Ferramenta de Browser](/pt-BR/tools/browser), [Acesso remoto](/pt-BR/gateway/remote), [Tailscale](/pt-BR/gateway/tailscale), [Segurança](/pt-BR/gateway/security)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Browser](/pt-BR/tools/browser)
