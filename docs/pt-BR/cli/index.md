---
read_when:
    - Encontrando o subcomando `openclaw` correto
    - Consultando opções globais ou regras de estilo da saída
summary: 'Índice da CLI do OpenClaw: lista de comandos, opções globais e links para páginas específicas de cada comando'
title: Referência da CLI
x-i18n:
    generated_at: "2026-07-11T23:50:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` é o principal ponto de entrada da CLI. Cada comando principal tem uma página de
referência dedicada ou está documentado com o comando do qual é um alias; este índice lista
os comandos, as flags globais e as regras de estilo de saída que se aplicam a toda a CLI.

Comandos de configuração por finalidade:

- `openclaw setup` e `openclaw onboard` verificam primeiro a inferência e depois iniciam o Crestodian para configurar o Gateway, o espaço de trabalho, os canais, as Skills e a integridade.
- `openclaw setup --baseline` cria a configuração de referência e o espaço de trabalho sem percorrer o fluxo guiado de integração.
- `openclaw configure` altera partes específicas de uma configuração existente: autenticação do modelo, Gateway, canais, Plugins ou Skills.
- `openclaw channels add` configura contas de canais depois que a configuração de referência existe; execute sem flags para a configuração guiada ou com flags específicas do canal para scripts.

## Páginas de comandos

| Área                         | Comandos                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração e integração    | [`crestodian`](/pt-BR/cli/crestodian) · [`setup`](/pt-BR/cli/setup) · [`onboard`](/pt-BR/cli/onboard) · [`configure`](/pt-BR/cli/configure) · [`config`](/pt-BR/cli/config) · [`completion`](/pt-BR/cli/completion) · [`doctor`](/pt-BR/cli/doctor) · [`dashboard`](/pt-BR/cli/dashboard) |
| Redefinição, backup e migração | [`backup`](/pt-BR/cli/backup) · [`migrate`](/pt-BR/cli/migrate) · [`reset`](/pt-BR/cli/reset) · [`uninstall`](/pt-BR/cli/uninstall) · [`update`](/pt-BR/cli/update)                                                                                                     |
| Mensagens e agentes          | [`message`](/pt-BR/cli/message) · [`agent`](/pt-BR/cli/agent) · [`agents`](/pt-BR/cli/agents) · [`attach`](/pt-BR/cli/attach) · [`acp`](/pt-BR/cli/acp) · [`mcp`](/pt-BR/cli/mcp)                                                                                             |
| Integridade e sessões        | [`status`](/pt-BR/cli/status) · [`health`](/pt-BR/cli/health) · [`sessions`](/pt-BR/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway e logs               | [`gateway`](/pt-BR/cli/gateway) · [`logs`](/pt-BR/cli/logs) · [`system`](/pt-BR/cli/system)                                                                                                                                                                 |
| Modelos e inferência         | [`models`](/pt-BR/cli/models) · [`promos`](/pt-BR/cli/promos) · [`infer`](/pt-BR/cli/infer) · `capability` (alias de [`infer`](/pt-BR/cli/infer)) · [`memory`](/pt-BR/cli/memory) · [`commitments`](/pt-BR/cli/commitments) · [`wiki`](/pt-BR/cli/wiki)                            |
| Rede e Nodes                 | [`directory`](/pt-BR/cli/directory) · [`nodes`](/pt-BR/cli/nodes) · [`devices`](/pt-BR/cli/devices) · [`node`](/pt-BR/cli/node)                                                                                                                                   |
| Ambiente de execução e sandbox | [`approvals`](/pt-BR/cli/approvals) · `exec-policy` (consulte [`approvals`](/pt-BR/cli/approvals)) · [`sandbox`](/pt-BR/cli/sandbox) · [`tui`](/pt-BR/cli/tui) · `chat`/`terminal` (aliases de [`tui --local`](/pt-BR/cli/tui)) · [`browser`](/pt-BR/cli/browser)                 |
| Automação                    | [`cron`](/pt-BR/cli/cron) · [`tasks`](/pt-BR/cli/tasks) · [`hooks`](/pt-BR/cli/hooks) · [`webhooks`](/pt-BR/cli/webhooks) · [`transcripts`](/pt-BR/cli/transcripts)                                                                                                     |
| Descoberta e documentação    | [`dns`](/pt-BR/cli/dns) · [`docs`](/pt-BR/cli/docs)                                                                                                                                                                                                   |
| Pareamento e canais          | [`pairing`](/pt-BR/cli/pairing) · [`qr`](/pt-BR/cli/qr) · [`channels`](/pt-BR/cli/channels)                                                                                                                                                                 |
| Segurança e Plugins          | [`security`](/pt-BR/cli/security) · [`secrets`](/pt-BR/cli/secrets) · [`skills`](/pt-BR/cli/skills) · [`plugins`](/pt-BR/cli/plugins) · [`proxy`](/pt-BR/cli/proxy)                                                                                                     |
| Aliases legados              | [`daemon`](/pt-BR/cli/daemon) (serviço do Gateway) · [`clawbot`](/pt-BR/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugins (opcionais)          | [`path`](/pt-BR/cli/path) · [`policy`](/pt-BR/cli/policy) · [`voicecall`](/pt-BR/cli/voicecall) · [`workboard`](/pt-BR/cli/workboard) (se instalado)                                                                                                              |

## Flags globais

| Flag                    | Finalidade                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Isola o estado em `~/.openclaw-dev`, usa a porta 19001 como padrão do Gateway e desloca as portas derivadas              |
| `--profile <name>`      | Isola o estado em `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Executa a CLI dentro de um contêiner Podman/Docker em execução chamado `<name>` (padrão: variável de ambiente `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Substitui o nível global de log para a saída em arquivo e no console                                                 |
| `--no-color`            | Desativa as cores ANSI (`NO_COLOR=1` também é respeitado)                                                    |
| `--update`              | Forma abreviada de [`openclaw update`](/pt-BR/cli/update); funciona tanto para checkouts do código-fonte quanto para instalações de pacotes    |
| `-V`, `--version`, `-v` | Exibe a versão e encerra                                                                                  |

## Modos de saída

- As cores ANSI e os indicadores de progresso são renderizados somente em sessões TTY.
- Os hiperlinks OSC-8 são renderizados como links clicáveis quando há suporte; caso contrário, a
  CLI usa URLs em texto simples.
- `--json` (e `--plain`, quando compatível) desativa a estilização para gerar uma saída limpa.
- Comandos de longa duração exibem um indicador de progresso (OSC 9;4 quando compatível).

## Paleta de cores

O OpenClaw usa uma paleta inspirada em lagosta para a saída da CLI:

| Token          | Hex       | Usado para                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Títulos, rótulos, destaques principais |
| `accentBright` | `#FF7A3D` | Nomes de comandos, ênfase              |
| `accentDim`    | `#D14A22` | Texto de destaque secundário             |
| `info`         | `#FF8A5B` | Valores informativos                 |
| `success`      | `#2FBF71` | Estados de sucesso                       |
| `warn`         | `#FFB020` | Avisos, flags de opções, alternativas    |
| `error`        | `#E23D2D` | Erros, falhas                     |
| `muted`        | `#8B7F77` | Redução de ênfase, metadados                |

Fonte oficial da paleta: `packages/terminal-core/src/palette.ts`.

## Árvore de comandos

<Accordion title="Árvore de comandos completa">

Este mapa abrange os comandos principais e seus subcomandos primários. Os subcomandos
adicionados por Plugins (por exemplo, em `skills`, `plugins` e `wiki`) evoluem
de forma independente; execute `<command> --help` para obter a lista atual e oficial.

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
  migrate
    list
    plan <provider>
    apply <provider>
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
    repair
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
    verify
    workshop list|inspect|propose-create|propose-update|revise|apply|reject|quarantine
    list
    info
    check
  plugins
    list
    search
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    build
    validate
    init
    registry
    marketplace list|entries|refresh
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
    compile
    lint
    ingest
    okf import
    search
    get
    apply synthesis|metadata
    bridge import
    unsafe-local import
    chatgpt import|rollback
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
  attach
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
  audit
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
    stability
    diagnostics export
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
    auth list|add|login|setup-token|paste-token|paste-api-key|login-github-copilot
    auth order get|set|clear
  promos
    list
    claim <slug>
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|personas|providers|status|enable|disable|set-provider|set-persona
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
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

## Comandos de barra no chat

As mensagens de chat são compatíveis com comandos `/...`. Consulte [comandos de barra](/pt-BR/tools/slash-commands).

Destaques:

- `/status` — diagnóstico rápido.
- `/trace` — linhas de rastreamento/depuração do Plugin, limitadas à sessão.
- `/config` — alterações persistentes na configuração.
- `/debug` — substituições de configuração somente em tempo de execução (na memória, não no disco; requer `commands.debug: true`).

## Monitoramento de uso

`openclaw status --usage` e a interface de controle exibem o uso e a cota do provedor quando
há credenciais OAuth/API disponíveis. Os dados vêm diretamente dos endpoints de uso
dos provedores e são normalizados como `X% restante`. Provedores com janelas de uso
atuais: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi e z.ai.

Consulte [Monitoramento de uso](/pt-BR/concepts/usage-tracking) para obter detalhes.

## Conteúdo relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Configuração](/pt-BR/gateway/configuration)
- [Ambiente](/pt-BR/help/environment)
