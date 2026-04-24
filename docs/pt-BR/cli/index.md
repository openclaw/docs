---
read_when:
    - Encontrando o subcomando certo de `openclaw`
    - Consultando flags globais ou regras de estilo de saída
summary: 'Índice da CLI do OpenClaw: lista de comandos, flags globais e links para páginas por comando'
title: Referência da CLI
x-i18n:
    generated_at: "2026-04-24T05:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw` é o ponto de entrada principal da CLI. Cada comando principal tem uma
página de referência dedicada ou é documentado com o comando ao qual serve de alias; este
índice lista os comandos, as flags globais e as regras de estilo de saída que
se aplicam em toda a CLI.

## Páginas de comando

| Área                 | Comandos                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração e onboarding | [`setup`](/pt-BR/cli/setup) · [`onboard`](/pt-BR/cli/onboard) · [`configure`](/pt-BR/cli/configure) · [`config`](/pt-BR/cli/config) · [`completion`](/pt-BR/cli/completion) · [`doctor`](/pt-BR/cli/doctor) · [`dashboard`](/pt-BR/cli/dashboard)                   |
| Redefinição e desinstalação  | [`backup`](/pt-BR/cli/backup) · [`reset`](/pt-BR/cli/reset) · [`uninstall`](/pt-BR/cli/uninstall) · [`update`](/pt-BR/cli/update)                                                                                                                 |
| Mensagens e agentes | [`message`](/pt-BR/cli/message) · [`agent`](/pt-BR/cli/agent) · [`agents`](/pt-BR/cli/agents) · [`acp`](/pt-BR/cli/acp) · [`mcp`](/pt-BR/cli/mcp)                                                                                                       |
| Saúde e sessões  | [`status`](/pt-BR/cli/status) · [`health`](/pt-BR/cli/health) · [`sessions`](/pt-BR/cli/sessions)                                                                                                                                           |
| Gateway e logs     | [`gateway`](/pt-BR/cli/gateway) · [`logs`](/pt-BR/cli/logs) · [`system`](/pt-BR/cli/system)                                                                                                                                                 |
| Modelos e inferência | [`models`](/pt-BR/cli/models) · [`infer`](/pt-BR/cli/infer) · `capability` (alias de [`infer`](/pt-BR/cli/infer)) · [`memory`](/pt-BR/cli/memory) · [`wiki`](/pt-BR/cli/wiki)                                                                          |
| Rede e nodes    | [`directory`](/pt-BR/cli/directory) · [`nodes`](/pt-BR/cli/nodes) · [`devices`](/pt-BR/cli/devices) · [`node`](/pt-BR/cli/node)                                                                                                                   |
| Runtime e sandbox  | [`approvals`](/pt-BR/cli/approvals) · `exec-policy` (consulte [`approvals`](/pt-BR/cli/approvals)) · [`sandbox`](/pt-BR/cli/sandbox) · [`tui`](/pt-BR/cli/tui) · `chat`/`terminal` (aliases de [`tui --local`](/pt-BR/cli/tui)) · [`browser`](/pt-BR/cli/browser) |
| Automação           | [`cron`](/pt-BR/cli/cron) · [`tasks`](/pt-BR/cli/tasks) · [`hooks`](/pt-BR/cli/hooks) · [`webhooks`](/pt-BR/cli/webhooks)                                                                                                                         |
| Descoberta e documentação   | [`dns`](/pt-BR/cli/dns) · [`docs`](/pt-BR/cli/docs)                                                                                                                                                                                   |
| Pareamento e canais | [`pairing`](/pt-BR/cli/pairing) · [`qr`](/pt-BR/cli/qr) · [`channels`](/pt-BR/cli/channels)                                                                                                                                                 |
| Segurança e plugins | [`security`](/pt-BR/cli/security) · [`secrets`](/pt-BR/cli/secrets) · [`skills`](/pt-BR/cli/skills) · [`plugins`](/pt-BR/cli/plugins) · [`proxy`](/pt-BR/cli/proxy)                                                                                     |
| Aliases legados       | [`daemon`](/pt-BR/cli/daemon) (serviço do gateway) · [`clawbot`](/pt-BR/cli/clawbot) (namespace)                                                                                                                                         |
| Plugins (opcional)   | [`voicecall`](/pt-BR/cli/voicecall) (se instalado)                                                                                                                                                                              |

## Flags globais

| Flag                    | Finalidade                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Isola o estado em `~/.openclaw-dev` e muda as portas padrão         |
| `--profile <name>`      | Isola o estado em `~/.openclaw-<name>`                              |
| `--container <name>`    | Direciona a execução para um contêiner nomeado                                |
| `--no-color`            | Desabilita cores ANSI (`NO_COLOR=1` também é respeitado)                  |
| `--update`              | Forma abreviada de [`openclaw update`](/pt-BR/cli/update) (somente instalações por fonte) |
| `-V`, `--version`, `-v` | Exibe a versão e sai                                                |

## Modos de saída

- Cores ANSI e indicadores de progresso são renderizados apenas em sessões TTY.
- Hiperlinks OSC-8 são renderizados como links clicáveis onde houver suporte; caso contrário, a
  CLI usa fallback para URLs simples.
- `--json` (e `--plain`, quando compatível) desabilita o estilo para uma saída limpa.
- Comandos de longa duração mostram um indicador de progresso (OSC 9;4 quando compatível).

Fonte da verdade da paleta: `src/terminal/palette.ts`.

## Árvore de comandos

<Accordion title="Árvore completa de comandos">

```
openclaw [--dev] [--profile <name>] <command>
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

Plugins podem adicionar comandos adicionais de nível superior (por exemplo `openclaw voicecall`).

</Accordion>

## Comandos slash do chat

Mensagens de chat oferecem suporte a comandos `/...`. Consulte [slash commands](/pt-BR/tools/slash-commands).

Destaques:

- `/status` — diagnósticos rápidos.
- `/trace` — linhas de rastreamento/depuração de plugin no escopo da sessão.
- `/config` — alterações persistidas de configuração.
- `/debug` — sobrescritas de configuração apenas de runtime (memória, não disco; requer `commands.debug: true`).

## Rastreamento de uso

`openclaw status --usage` e a interface Control exibem uso/cota do provedor quando
credenciais OAuth/API estão disponíveis. Os dados vêm diretamente dos endpoints de uso
do provedor e são normalizados para `X% left`. Provedores com janelas atuais
de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi e z.ai.

Consulte [Usage tracking](/pt-BR/concepts/usage-tracking) para detalhes.

## Relacionados

- [Slash commands](/pt-BR/tools/slash-commands)
- [Configuration](/pt-BR/gateway/configuration)
- [Environment](/pt-BR/help/environment)
