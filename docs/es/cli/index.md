---
read_when:
    - Encontrar el subcomando `openclaw` adecuado
    - Buscando indicadores globales o reglas de estilo de salida
summary: 'Índice de la CLI de OpenClaw: lista de comandos, flags globales y enlaces a páginas por comando'
title: Referencia de CLI
x-i18n:
    generated_at: "2026-06-30T22:06:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5102afd4cfe8be5ec45b352cf714f0ecc965bbe03f6a1c3c1b22aa409cde7b9
    source_path: cli/index.md
    workflow: 16
---

`openclaw` es el punto de entrada principal de la CLI. Cada comando principal tiene una
página de referencia dedicada o está documentado con el comando del que es alias; este
índice enumera los comandos, las marcas globales y las reglas de estilo de salida que
se aplican en toda la CLI.

Usa los comandos de configuración según la intención:

- `openclaw setup` y `openclaw onboard` ejecutan la ruta guiada completa de primer uso para Gateway, autenticación de modelos, espacio de trabajo, canales, Skills y salud.
- `openclaw setup --baseline` crea la configuración base y el espacio de trabajo sin recorrer el flujo de incorporación guiado.
- `openclaw configure` cambia partes específicas de una configuración existente, como autenticación de modelos, Gateway, canales, plugins o Skills.
- `openclaw channels add` configura cuentas de canal después de que exista la base; ejecútalo sin marcas para la configuración guiada de canales o con marcas específicas del canal para scripts.

## Páginas de comandos

| Área                 | Comandos                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración e incorporación | [`crestodian`](/es/cli/crestodian) · [`setup`](/es/cli/setup) · [`onboard`](/es/cli/onboard) · [`configure`](/es/cli/configure) · [`config`](/es/cli/config) · [`completion`](/es/cli/completion) · [`doctor`](/es/cli/doctor) · [`dashboard`](/es/cli/dashboard) |
| Restablecimiento y desinstalación  | [`backup`](/es/cli/backup) · [`reset`](/es/cli/reset) · [`uninstall`](/es/cli/uninstall) · [`update`](/es/cli/update)                                                                                                                                 |
| Mensajería y agentes | [`message`](/es/cli/message) · [`agent`](/es/cli/agent) · [`agents`](/es/cli/agents) · [`acp`](/es/cli/acp) · [`mcp`](/es/cli/mcp)                                                                                                                       |
| Salud y sesiones  | [`status`](/es/cli/status) · [`health`](/es/cli/health) · [`sessions`](/es/cli/sessions)                                                                                                                                                           |
| Gateway y registros     | [`gateway`](/es/cli/gateway) · [`logs`](/es/cli/logs) · [`system`](/es/cli/system)                                                                                                                                                                 |
| Modelos e inferencia | [`models`](/es/cli/models) · [`infer`](/es/cli/infer) · `capability` (alias de [`infer`](/es/cli/infer)) · [`memory`](/es/cli/memory) · [`commitments`](/es/cli/commitments) · [`wiki`](/es/cli/wiki)                                                      |
| Red y nodos    | [`directory`](/es/cli/directory) · [`nodes`](/es/cli/nodes) · [`devices`](/es/cli/devices) · [`node`](/es/cli/node)                                                                                                                                   |
| Runtime y sandbox  | [`approvals`](/es/cli/approvals) · `exec-policy` (consulta [`approvals`](/es/cli/approvals)) · [`sandbox`](/es/cli/sandbox) · [`tui`](/es/cli/tui) · `chat`/`terminal` (aliases de [`tui --local`](/es/cli/tui)) · [`browser`](/es/cli/browser)                 |
| Automatización           | [`cron`](/es/cli/cron) · [`tasks`](/es/cli/tasks) · [`hooks`](/es/cli/hooks) · [`webhooks`](/es/cli/webhooks) · [`transcripts`](/es/cli/transcripts)                                                                                                     |
| Descubrimiento y documentación   | [`dns`](/es/cli/dns) · [`docs`](/es/cli/docs)                                                                                                                                                                                                   |
| Emparejamiento y canales | [`pairing`](/es/cli/pairing) · [`qr`](/es/cli/qr) · [`channels`](/es/cli/channels)                                                                                                                                                                 |
| Seguridad y plugins | [`security`](/es/cli/security) · [`secrets`](/es/cli/secrets) · [`skills`](/es/cli/skills) · [`plugins`](/es/cli/plugins) · [`proxy`](/es/cli/proxy)                                                                                                     |
| Aliases heredados       | [`daemon`](/es/cli/daemon) (servicio Gateway) · [`clawbot`](/es/cli/clawbot) (espacio de nombres)                                                                                                                                                         |
| Plugins (opcional)   | [`path`](/es/cli/path) · [`policy`](/es/cli/policy) · [`voicecall`](/es/cli/voicecall) · [`workboard`](/es/cli/workboard) (si está instalado)                                                                                                              |

## Marcas globales

| Marca                    | Propósito                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Aísla el estado bajo `~/.openclaw-dev` y desplaza los puertos predeterminados         |
| `--profile <name>`      | Aísla el estado bajo `~/.openclaw-<name>`                              |
| `--container <name>`    | Apunta a un contenedor con nombre para la ejecución                                |
| `--no-color`            | Desactiva los colores ANSI (`NO_COLOR=1` también se respeta)                  |
| `--update`              | Atajo para [`openclaw update`](/es/cli/update) (solo instalaciones desde código fuente) |
| `-V`, `--version`, `-v` | Imprime la versión y sale                                                |

## Modos de salida

- Los colores ANSI y los indicadores de progreso solo se muestran en sesiones TTY.
- Los hipervínculos OSC-8 se muestran como enlaces clicables cuando hay soporte; de lo contrario, la
  CLI recurre a URLs sin formato.
- `--json` (y `--plain` donde tenga soporte) desactiva el estilo para una salida limpia.
- Los comandos de larga duración muestran un indicador de progreso (OSC 9;4 cuando tiene soporte).

Fuente de verdad de la paleta: `src/terminal/palette.ts`.

## Árbol de comandos

<Accordion title="Árbol de comandos completo">

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

Los plugins pueden agregar comandos adicionales de nivel superior, como
[`openclaw workboard`](/es/cli/workboard) o `openclaw voicecall`.

</Accordion>

## Comandos slash de chat

Los mensajes de chat admiten comandos `/...`. Consulta [comandos slash](/es/tools/slash-commands).

Aspectos destacados:

- `/status` — diagnóstico rápido.
- `/trace` — líneas de traza/depuración de plugins con alcance de sesión.
- `/config` — cambios de configuración persistidos.
- `/debug` — anulaciones de configuración solo de runtime (memoria, no disco; requiere `commands.debug: true`).

## Seguimiento de uso

`openclaw status --usage` y la Control UI muestran uso/cuota del proveedor cuando
hay credenciales OAuth/API disponibles. Los datos provienen directamente de los
endpoints de uso del proveedor y se normalizan a `X% left`. Proveedores con ventanas
de uso actuales: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi y z.ai.

Consulta [Seguimiento de uso](/es/concepts/usage-tracking) para más detalles.

## Relacionado

- [Comandos slash](/es/tools/slash-commands)
- [Configuración](/es/gateway/configuration)
- [Entorno](/es/help/environment)
