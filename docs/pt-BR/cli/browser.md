---
read_when:
    - Você usa o `openclaw browser` e quer exemplos para tarefas comuns
    - Você quer controlar um navegador em execução em outra máquina por meio de um host Node
    - Você quer se conectar ao seu Chrome local já autenticado via Chrome MCP
summary: Referência de CLI para `openclaw browser` (ciclo de vida, perfis, abas, ações, estado e depuração)
title: Navegador
x-i18n:
    generated_at: "2026-04-25T13:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gerencie a superfície de controle de navegador do OpenClaw e execute ações no navegador (ciclo de vida, perfis, abas, snapshots, capturas de tela, navegação, entrada, emulação de estado e depuração).

Relacionado:

- Ferramenta de navegador + API: [Browser tool](/pt-BR/tools/browser)

## Flags comuns

- `--url <gatewayWsUrl>`: URL WebSocket do Gateway (usa a configuração por padrão).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: timeout da solicitação (ms).
- `--expect-final`: aguarda uma resposta final do Gateway.
- `--browser-profile <name>`: escolhe um perfil de navegador (padrão da configuração).
- `--json`: saída legível por máquina (quando compatível).

## Início rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agentes podem executar a mesma verificação de prontidão com `browser({ action: "doctor" })`.

## Solução rápida de problemas

Se `start` falhar com `not reachable after start`, primeiro solucione a prontidão do CDP. Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falharem, o plano de controle do navegador está íntegro e a falha normalmente é a política SSRF de navegação.

Sequência mínima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientação detalhada: [Solução de problemas do navegador](/pt-BR/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Observações:

- Para perfis `attachOnly` e CDP remotos, `openclaw browser stop` fecha a
  sessão de controle ativa e limpa substituições temporárias de emulação, mesmo
  quando o OpenClaw não iniciou o processo do navegador por conta própria.
- Para perfis locais gerenciados, `openclaw browser stop` interrompe o processo
  do navegador iniciado.
- `openclaw browser start --headless` se aplica apenas a essa solicitação de
  inicialização e somente quando o OpenClaw inicia um navegador local gerenciado. Ele não reescreve
  `browser.headless` nem a configuração do perfil, e não tem efeito para um navegador já em execução.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis locais gerenciados
  são executados em modo headless automaticamente, a menos que `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` ou `browser.profiles.<name>.headless=false`
  solicitem explicitamente um navegador visível.

## Se o comando estiver ausente

Se `openclaw browser` for um comando desconhecido, verifique `plugins.allow` em
`~/.openclaw/openclaw.json`.

Quando `plugins.allow` estiver presente, o Plugin incluído de navegador deve ser listado
explicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` não restaura o subcomando de CLI quando a lista de permissões
de plugins exclui `browser`.

Relacionado: [Browser tool](/pt-BR/tools/browser#missing-browser-command-or-tool)

## Perfis

Perfis são configurações nomeadas de roteamento do navegador. Na prática:

- `openclaw`: inicia ou se conecta a uma instância dedicada do Chrome gerenciada pelo OpenClaw (diretório de dados do usuário isolado).
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
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` retorna primeiro `suggestedTargetId`, depois o `tabId` estável, como `t1`,
o rótulo opcional e o `targetId` bruto. Os agentes devem passar
`suggestedTargetId` de volta para `focus`, `close`, snapshots e ações. Você pode
atribuir um rótulo com `open --label`, `tab new --label` ou `tab label`; rótulos,
ids de aba, ids de target brutos e prefixos únicos de target-id são todos aceitos.

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

- `--full-page` é para capturas da página inteira; não pode ser combinado com `--ref`
  ou `--element`.
- Perfis `existing-session` / `user` oferecem suporte a capturas de tela da página e capturas com `--ref`
  a partir da saída do snapshot, mas não a capturas de tela CSS com `--element`.
- `--labels` sobrepõe refs do snapshot atual na captura de tela.
- `snapshot --urls` acrescenta destinos de links descobertos aos snapshots de IA para que
  os agentes possam escolher alvos diretos de navegação em vez de adivinhar apenas pelo
  texto do link.

Navegar/clicar/digitar (automação de UI baseada em ref):

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

Auxiliares de arquivo + diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Perfis gerenciados do Chrome salvam downloads comuns acionados por clique no diretório
de downloads do OpenClaw (`/tmp/openclaw/downloads` por padrão, ou a raiz temporária configurada).
Use `waitfordownload` ou `download` quando o agente precisar aguardar um
arquivo específico e retornar seu caminho; esses esperadores explícitos controlam o próximo download.

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

Use o perfil `user` incluído ou crie seu próprio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Esse caminho é somente para host. Para Docker, servidores headless, Browserless ou outras configurações remotas, use um perfil CDP.

Limites atuais de existing-session:

- ações orientadas por snapshot usam refs, não seletores CSS
- `browser.actionTimeoutMs` define `act` compatíveis por padrão como 60000 ms quando
  os chamadores omitem `timeoutMs`; `timeoutMs` por chamada ainda tem precedência.
- `click` é apenas clique esquerdo
- `type` não oferece suporte a `slowly=true`
- `press` não oferece suporte a `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` e `evaluate` rejeitam
  substituições de timeout por chamada
- `select` aceita apenas um valor
- `wait --load networkidle` não é compatível
- uploads de arquivos exigem `--ref` / `--input-ref`, não oferecem suporte a CSS
  `--element` e atualmente aceitam um arquivo por vez
- hooks de diálogo não oferecem suporte a `--timeout`
- capturas de tela oferecem suporte a capturas da página e `--ref`, mas não a CSS `--element`
- `responsebody`, interceptação de download, exportação em PDF e ações em lote ainda
  exigem um navegador gerenciado ou perfil CDP bruto

## Controle remoto de navegador (proxy de host Node)

Se o Gateway for executado em uma máquina diferente da do navegador, execute um **host Node** na máquina que tem Chrome/Brave/Edge/Chromium. O Gateway encaminhará ações do navegador para esse nó (não é necessário um servidor separado de controle de navegador).

Use `gateway.nodes.browser.mode` para controlar o roteamento automático e `gateway.nodes.browser.node` para fixar um nó específico se houver vários conectados.

Segurança + configuração remota: [Browser tool](/pt-BR/tools/browser), [Acesso remoto](/pt-BR/gateway/remote), [Tailscale](/pt-BR/gateway/tailscale), [Segurança](/pt-BR/gateway/security)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Browser](/pt-BR/tools/browser)
