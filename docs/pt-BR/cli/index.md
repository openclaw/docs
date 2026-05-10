---
read_when:
    - Encontrando o subcomando `openclaw` correto
    - Consultando sinalizadores globais ou regras de estilo da saída
summary: 'Índice da CLI do OpenClaw: lista de comandos, flags globais e links para páginas de cada comando'
title: Referência da CLI
x-i18n:
    generated_at: "2026-05-10T19:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34d37fea072d4f05098567456db832ecb93f40884892d8bc4b063319500933f5
    source_path: cli/index.md
    workflow: 16
---

`openclaw` é o principal ponto de entrada da CLI. Cada comando central tem uma
página de referência dedicada ou é documentado com o comando do qual é alias; este
índice lista os comandos, as flags globais e as regras de estilo da saída que se
aplicam em toda a CLI.

Use os comandos de configuração conforme a intenção:

- `openclaw setup` cria a configuração e a área de trabalho de base sem percorrer todo o fluxo guiado de onboarding.
- `openclaw onboard` é o caminho completo guiado da primeira execução para Gateway, autenticação de modelo, área de trabalho, canais, Skills e integridade.
- `openclaw configure` altera partes específicas de uma configuração existente, como autenticação de modelo, Gateway, canais, plugins ou Skills.
- `openclaw channels add` configura contas de canal depois que a base existe; execute sem flags para configuração guiada de canais ou com flags específicas de canal para scripts.

## Páginas de comando

| Área                 | Comandos                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração e onboarding | [`crestodian`](/pt-BR/cli/crestodian) · [`setup`](/pt-BR/cli/setup) · [`onboard`](/pt-BR/cli/onboard) · [`configure`](/pt-BR/cli/configure) · [`config`](/pt-BR/cli/config) · [`completion`](/pt-BR/cli/completion) · [`doctor`](/pt-BR/cli/doctor) · [`dashboard`](/pt-BR/cli/dashboard) |
| Redefinição e desinstalação  | [`backup`](/pt-BR/cli/backup) · [`reset`](/pt-BR/cli/reset) · [`uninstall`](/pt-BR/cli/uninstall) · [`update`](/pt-BR/cli/update)                                                                                                                                 |
| Mensagens e agentes | [`message`](/pt-BR/cli/message) · [`agent`](/pt-BR/cli/agent) · [`agents`](/pt-BR/cli/agents) · [`acp`](/pt-BR/cli/acp) · [`mcp`](/pt-BR/cli/mcp)                                                                                                                       |
| Integridade e sessões  | [`status`](/pt-BR/cli/status) · [`health`](/pt-BR/cli/health) · [`sessions`](/pt-BR/cli/sessions)                                                                                                                                                           |
| Gateway e logs     | [`gateway`](/pt-BR/cli/gateway) · [`logs`](/pt-BR/cli/logs) · [`system`](/pt-BR/cli/system)                                                                                                                                                                 |
| Modelos e inferência | [`models`](/pt-BR/cli/models) · [`infer`](/pt-BR/cli/infer) · `capability` (alias de [`infer`](/pt-BR/cli/infer)) · [`memory`](/pt-BR/cli/memory) · [`commitments`](/pt-BR/cli/commitments) · [`wiki`](/pt-BR/cli/wiki)                                                      |
| Rede e nós    | [`directory`](/pt-BR/cli/directory) · [`nodes`](/pt-BR/cli/nodes) · [`devices`](/pt-BR/cli/devices) · [`node`](/pt-BR/cli/node)                                                                                                                                   |
| Runtime e sandbox  | [`approvals`](/pt-BR/cli/approvals) · `exec-policy` (consulte [`approvals`](/pt-BR/cli/approvals)) · [`sandbox`](/pt-BR/cli/sandbox) · [`tui`](/pt-BR/cli/tui) · `chat`/`terminal` (aliases de [`tui --local`](/pt-BR/cli/tui)) · [`browser`](/pt-BR/cli/browser)                 |
| Automação           | [`cron`](/pt-BR/cli/cron) · [`tasks`](/pt-BR/cli/tasks) · [`hooks`](/pt-BR/cli/hooks) · [`webhooks`](/pt-BR/cli/webhooks)                                                                                                                                         |
| Descoberta e documentação   | [`dns`](/pt-BR/cli/dns) · [`docs`](/pt-BR/cli/docs)                                                                                                                                                                                                   |
| Pareamento e canais | [`pairing`](/pt-BR/cli/pairing) · [`qr`](/pt-BR/cli/qr) · [`channels`](/pt-BR/cli/channels)                                                                                                                                                                 |
| Segurança e plugins | [`security`](/pt-BR/cli/security) · [`secrets`](/pt-BR/cli/secrets) · [`skills`](/pt-BR/cli/skills) · [`plugins`](/pt-BR/cli/plugins) · [`proxy`](/pt-BR/cli/proxy)                                                                                                     |
| Aliases legados       | [`daemon`](/pt-BR/cli/daemon) (serviço de Gateway) · [`clawbot`](/pt-BR/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugins (opcional)   | [`path`](/pt-BR/cli/path) · [`voicecall`](/pt-BR/cli/voicecall) (se instalado)                                                                                                                                                                        |

## Flags globais

| Flag                    | Finalidade                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Isola o estado em `~/.openclaw-dev` e desloca as portas padrão         |
| `--profile <name>`      | Isola o estado em `~/.openclaw-<name>`                              |
| `--container <name>`    | Direciona a execução para um contêiner nomeado                                |
| `--no-color`            | Desativa cores ANSI (`NO_COLOR=1` também é respeitado)                  |
| `--update`              | Atalho para [`openclaw update`](/pt-BR/cli/update) (somente instalações a partir do código-fonte) |
| `-V`, `--version`, `-v` | Imprime a versão e sai                                                |

## Modos de saída

- Cores ANSI e indicadores de progresso são renderizados somente em sessões TTY.
- Hiperlinks OSC-8 são renderizados como links clicáveis onde houver suporte; caso contrário, a
  CLI usa URLs simples como fallback.
- `--json` (e `--plain` onde houver suporte) desativa o estilo para uma saída limpa.
- Comandos de longa duração mostram um indicador de progresso (OSC 9;4 quando houver suporte).

Fonte de verdade da paleta: `src/terminal/palette.ts`.

## Árvore de comandos

<Accordion title="Full command tree">

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugins podem adicionar comandos adicionais de nível superior (por exemplo, `openclaw voicecall`).

</Accordion>

## Comandos de barra do chat

Mensagens de chat aceitam comandos `/...`. Consulte [comandos de barra](/pt-BR/tools/slash-commands).

Destaques:

- `/status` — diagnósticos rápidos.
- `/trace` — linhas de rastreamento/debug de plugin no escopo da sessão.
- `/config` — alterações persistidas de configuração.
- `/debug` — substituições de configuração somente em runtime (memória, não disco; requer `commands.debug: true`).

## Rastreamento de uso

`openclaw status --usage` e a UI de Controle exibem uso/cota do provedor quando
credenciais OAuth/API estão disponíveis. Os dados vêm diretamente dos endpoints
de uso do provedor e são normalizados para `X% left`. Provedores com janelas de
uso atuais: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi e z.ai.

Consulte [Rastreamento de uso](/pt-BR/concepts/usage-tracking) para detalhes.

## Relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Configuração](/pt-BR/gateway/configuration)
- [Ambiente](/pt-BR/help/environment)
