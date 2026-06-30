---
read_when:
    - Encontrando o subcomando `openclaw`
    - Consultando flags globais ou regras de estilo de saída
summary: 'Índice da CLI do OpenClaw: lista de comandos, flags globais e links para páginas por comando'
title: Referência da CLI
x-i18n:
    generated_at: "2026-06-30T22:10:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5102afd4cfe8be5ec45b352cf714f0ecc965bbe03f6a1c3c1b22aa409cde7b9
    source_path: cli/index.md
    workflow: 16
---

`openclaw` é o principal ponto de entrada da CLI. Cada comando central tem uma
página de referência dedicada ou é documentado com o comando do qual é alias; este
índice lista os comandos, as flags globais e as regras de estilo de saída que se
aplicam em toda a CLI.

Use os comandos de configuração por intenção:

- `openclaw setup` e `openclaw onboard` executam o caminho completo e guiado de primeira execução para Gateway, autenticação de modelo, workspace, canais, Skills e integridade.
- `openclaw setup --baseline` cria a configuração de baseline e o workspace sem percorrer o fluxo de onboarding guiado.
- `openclaw configure` altera partes específicas de uma configuração existente, como autenticação de modelo, Gateway, canais, plugins ou Skills.
- `openclaw channels add` configura contas de canal depois que o baseline existe; execute sem flags para configuração guiada de canal ou com flags específicas do canal para scripts.

## Páginas de comandos

| Área                 | Comandos                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração e onboarding | [`crestodian`](/pt-BR/cli/crestodian) · [`setup`](/pt-BR/cli/setup) · [`onboard`](/pt-BR/cli/onboard) · [`configure`](/pt-BR/cli/configure) · [`config`](/pt-BR/cli/config) · [`completion`](/pt-BR/cli/completion) · [`doctor`](/pt-BR/cli/doctor) · [`dashboard`](/pt-BR/cli/dashboard) |
| Redefinição e desinstalação  | [`backup`](/pt-BR/cli/backup) · [`reset`](/pt-BR/cli/reset) · [`uninstall`](/pt-BR/cli/uninstall) · [`update`](/pt-BR/cli/update)                                                                                                                                 |
| Mensagens e agentes | [`message`](/pt-BR/cli/message) · [`agent`](/pt-BR/cli/agent) · [`agents`](/pt-BR/cli/agents) · [`acp`](/pt-BR/cli/acp) · [`mcp`](/pt-BR/cli/mcp)                                                                                                                       |
| Integridade e sessões  | [`status`](/pt-BR/cli/status) · [`health`](/pt-BR/cli/health) · [`sessions`](/pt-BR/cli/sessions)                                                                                                                                                           |
| Gateway e logs     | [`gateway`](/pt-BR/cli/gateway) · [`logs`](/pt-BR/cli/logs) · [`system`](/pt-BR/cli/system)                                                                                                                                                                 |
| Modelos e inferência | [`models`](/pt-BR/cli/models) · [`infer`](/pt-BR/cli/infer) · `capability` (alias para [`infer`](/pt-BR/cli/infer)) · [`memory`](/pt-BR/cli/memory) · [`commitments`](/pt-BR/cli/commitments) · [`wiki`](/pt-BR/cli/wiki)                                                      |
| Rede e nós    | [`directory`](/pt-BR/cli/directory) · [`nodes`](/pt-BR/cli/nodes) · [`devices`](/pt-BR/cli/devices) · [`node`](/pt-BR/cli/node)                                                                                                                                   |
| Runtime e sandbox  | [`approvals`](/pt-BR/cli/approvals) · `exec-policy` (consulte [`approvals`](/pt-BR/cli/approvals)) · [`sandbox`](/pt-BR/cli/sandbox) · [`tui`](/pt-BR/cli/tui) · `chat`/`terminal` (aliases para [`tui --local`](/pt-BR/cli/tui)) · [`browser`](/pt-BR/cli/browser)                 |
| Automação           | [`cron`](/pt-BR/cli/cron) · [`tasks`](/pt-BR/cli/tasks) · [`hooks`](/pt-BR/cli/hooks) · [`webhooks`](/pt-BR/cli/webhooks) · [`transcripts`](/pt-BR/cli/transcripts)                                                                                                     |
| Descoberta e documentação   | [`dns`](/pt-BR/cli/dns) · [`docs`](/pt-BR/cli/docs)                                                                                                                                                                                                   |
| Pareamento e canais | [`pairing`](/pt-BR/cli/pairing) · [`qr`](/pt-BR/cli/qr) · [`channels`](/pt-BR/cli/channels)                                                                                                                                                                 |
| Segurança e plugins | [`security`](/pt-BR/cli/security) · [`secrets`](/pt-BR/cli/secrets) · [`skills`](/pt-BR/cli/skills) · [`plugins`](/pt-BR/cli/plugins) · [`proxy`](/pt-BR/cli/proxy)                                                                                                     |
| Aliases legados       | [`daemon`](/pt-BR/cli/daemon) (serviço do Gateway) · [`clawbot`](/pt-BR/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugins (opcional)   | [`path`](/pt-BR/cli/path) · [`policy`](/pt-BR/cli/policy) · [`voicecall`](/pt-BR/cli/voicecall) · [`workboard`](/pt-BR/cli/workboard) (se instalado)                                                                                                              |

## Flags globais

| Flag                    | Finalidade                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Isola o estado em `~/.openclaw-dev` e desloca as portas padrão         |
| `--profile <name>`      | Isola o estado em `~/.openclaw-<name>`                              |
| `--container <name>`    | Direciona um container nomeado para execução                                |
| `--no-color`            | Desativa cores ANSI (`NO_COLOR=1` também é respeitado)                  |
| `--update`              | Atalho para [`openclaw update`](/pt-BR/cli/update) (somente instalações a partir do código-fonte) |
| `-V`, `--version`, `-v` | Imprime a versão e sai                                                |

## Modos de saída

- Cores ANSI e indicadores de progresso são renderizados somente em sessões TTY.
- Hiperlinks OSC-8 são renderizados como links clicáveis quando houver suporte; caso contrário, a
  CLI recorre a URLs simples.
- `--json` (e `--plain` quando houver suporte) desativa a estilização para saída limpa.
- Comandos de longa duração exibem um indicador de progresso (OSC 9;4 quando houver suporte).

Fonte da verdade da paleta: `src/terminal/palette.ts`.

## Árvore de comandos

<Accordion title="Árvore de comandos completa">

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
  workboard
    list
    create
    show
    dispatch
  memory
    status
    index
    search
  transcripts
    list
    show
    path
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
    get
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

Plugins podem adicionar outros comandos de nível superior, como
[`openclaw workboard`](/pt-BR/cli/workboard) ou `openclaw voicecall`.

</Accordion>

## Comandos de barra do chat

Mensagens de chat aceitam comandos `/...`. Consulte [comandos de barra](/pt-BR/tools/slash-commands).

Destaques:

- `/status` — diagnósticos rápidos.
- `/trace` — linhas de rastreamento/debug de plugin com escopo de sessão.
- `/config` — alterações persistidas de configuração.
- `/debug` — sobrescritas de configuração somente em runtime (memória, não disco; requer `commands.debug: true`).

## Rastreamento de uso

`openclaw status --usage` e a Control UI exibem uso/cota do provedor quando
credenciais OAuth/API estão disponíveis. Os dados vêm diretamente dos endpoints
de uso dos provedores e são normalizados para `X% left`. Provedores com janelas
de uso atuais: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi e z.ai.

Consulte [Rastreamento de uso](/pt-BR/concepts/usage-tracking) para detalhes.

## Relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Configuração](/pt-BR/gateway/configuration)
- [Ambiente](/pt-BR/help/environment)
