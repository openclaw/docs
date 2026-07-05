---
read_when:
    - Encontrar el subcomando `openclaw` adecuado
    - Consultando las opciones globales o las reglas de estilo de salida
summary: 'Índice de la CLI de OpenClaw: lista de comandos, flags globales y enlaces a páginas por comando'
title: Referencia de CLI
x-i18n:
    generated_at: "2026-07-05T11:07:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a002cd337c3a7611e0607f2b074681c09aa830e0c4f6e529d2d6397e951775f8
    source_path: cli/index.md
    workflow: 16
---

`openclaw` es el punto de entrada principal de la CLI. Cada comando principal tiene una
página de referencia dedicada o está documentado con el comando para el que es un alias; este índice enumera
los comandos, las flags globales y las reglas de estilo de salida que se aplican en toda la CLI.

Comandos de configuración por intención:

- `openclaw setup` y `openclaw onboard` ejecutan la ruta guiada completa de primera ejecución para Gateway, autenticación de modelo, espacio de trabajo, canales, Skills y estado.
- `openclaw setup --baseline` crea la configuración base y el espacio de trabajo sin recorrer el flujo guiado de incorporación.
- `openclaw configure` cambia partes específicas de una configuración existente: autenticación de modelo, Gateway, canales, plugins o Skills.
- `openclaw channels add` configura cuentas de canal después de que exista la base; ejecútalo sin flags para una configuración guiada, o con flags específicas del canal para scripts.

## Páginas de comandos

| Área                         | Comandos                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración e incorporación         | [`crestodian`](/es/cli/crestodian) · [`setup`](/es/cli/setup) · [`onboard`](/es/cli/onboard) · [`configure`](/es/cli/configure) · [`config`](/es/cli/config) · [`completion`](/es/cli/completion) · [`doctor`](/es/cli/doctor) · [`dashboard`](/es/cli/dashboard) |
| Restablecimiento, copia de seguridad y migración | [`backup`](/es/cli/backup) · [`migrate`](/es/cli/migrate) · [`reset`](/es/cli/reset) · [`uninstall`](/es/cli/uninstall) · [`update`](/es/cli/update)                                                                                                     |
| Mensajería y agentes         | [`message`](/es/cli/message) · [`agent`](/es/cli/agent) · [`agents`](/es/cli/agents) · [`attach`](/es/cli/attach) · [`acp`](/es/cli/acp) · [`mcp`](/es/cli/mcp)                                                                                             |
| Estado y sesiones          | [`status`](/es/cli/status) · [`health`](/es/cli/health) · [`sessions`](/es/cli/sessions)                                                                                                                                                           |
| Gateway y registros             | [`gateway`](/es/cli/gateway) · [`logs`](/es/cli/logs) · [`system`](/es/cli/system)                                                                                                                                                                 |
| Modelos e inferencia         | [`models`](/es/cli/models) · [`infer`](/es/cli/infer) · `capability` (alias de [`infer`](/es/cli/infer)) · [`memory`](/es/cli/memory) · [`commitments`](/es/cli/commitments) · [`wiki`](/es/cli/wiki)                                                      |
| Red y nodos            | [`directory`](/es/cli/directory) · [`nodes`](/es/cli/nodes) · [`devices`](/es/cli/devices) · [`node`](/es/cli/node)                                                                                                                                   |
| Runtime y sandbox          | [`approvals`](/es/cli/approvals) · `exec-policy` (consulta [`approvals`](/es/cli/approvals)) · [`sandbox`](/es/cli/sandbox) · [`tui`](/es/cli/tui) · `chat`/`terminal` (aliases de [`tui --local`](/es/cli/tui)) · [`browser`](/es/cli/browser)                 |
| Automatización                   | [`cron`](/es/cli/cron) · [`tasks`](/es/cli/tasks) · [`hooks`](/es/cli/hooks) · [`webhooks`](/es/cli/webhooks) · [`transcripts`](/es/cli/transcripts)                                                                                                     |
| Descubrimiento y documentación           | [`dns`](/es/cli/dns) · [`docs`](/es/cli/docs)                                                                                                                                                                                                   |
| Emparejamiento y canales         | [`pairing`](/es/cli/pairing) · [`qr`](/es/cli/qr) · [`channels`](/es/cli/channels)                                                                                                                                                                 |
| Seguridad y plugins         | [`security`](/es/cli/security) · [`secrets`](/es/cli/secrets) · [`skills`](/es/cli/skills) · [`plugins`](/es/cli/plugins) · [`proxy`](/es/cli/proxy)                                                                                                     |
| Aliases heredados               | [`daemon`](/es/cli/daemon) (servicio de Gateway) · [`clawbot`](/es/cli/clawbot) (espacio de nombres)                                                                                                                                                         |
| Plugins (opcionales)           | [`path`](/es/cli/path) · [`policy`](/es/cli/policy) · [`voicecall`](/es/cli/voicecall) · [`workboard`](/es/cli/workboard) (si está instalado)                                                                                                              |

## Flags globales

| Flag                    | Propósito                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Aísla el estado bajo `~/.openclaw-dev`, usa el puerto Gateway predeterminado 19001 y desplaza los puertos derivados              |
| `--profile <name>`      | Aísla el estado bajo `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Ejecuta la CLI dentro de un contenedor Podman/Docker en ejecución llamado `<name>` (predeterminado: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Sobrescribe el nivel de registro global para la salida de archivo y consola                                                 |
| `--no-color`            | Desactiva los colores ANSI (`NO_COLOR=1` también se respeta)                                                    |
| `--update`              | Abreviatura de [`openclaw update`](/es/cli/update); funciona tanto para checkouts de código fuente como para instalaciones de paquetes    |
| `-V`, `--version`, `-v` | Imprime la versión y sale                                                                                  |

## Modos de salida

- Los colores ANSI y los indicadores de progreso se renderizan solo en sesiones TTY.
- Los hipervínculos OSC-8 se renderizan como enlaces clicables donde son compatibles; de lo contrario, la
  CLI recurre a URL simples.
- `--json` (y `--plain` donde sea compatible) desactiva el estilo para una salida limpia.
- Los comandos de larga duración muestran un indicador de progreso (OSC 9;4 cuando es compatible).

## Paleta de colores

OpenClaw usa una paleta de langosta para la salida de la CLI:

| Token          | Hex       | Usado para                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Encabezados, etiquetas, resaltados principales |
| `accentBright` | `#FF7A3D` | Nombres de comandos, énfasis              |
| `accentDim`    | `#D14A22` | Texto de resaltado secundario             |
| `info`         | `#FF8A5B` | Valores informativos                 |
| `success`      | `#2FBF71` | Estados de éxito                       |
| `warn`         | `#FFB020` | Advertencias, flags de opción, fallbacks    |
| `error`        | `#E23D2D` | Errores, fallos                     |
| `muted`        | `#8B7F77` | Atenuación, metadatos                |

Fuente de verdad de la paleta: `packages/terminal-core/src/palette.ts`.

## Árbol de comandos

<Accordion title="Full command tree">

Este mapa cubre los comandos principales y sus subcomandos principales. Los subcomandos añadidos por plugins
(por ejemplo bajo `skills`, `plugins` y `wiki`) evolucionan
independientemente; ejecuta `<command> --help` para obtener la lista autorizada y actual.

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

Los Plugins pueden agregar comandos adicionales de nivel superior, como
[`openclaw workboard`](/es/cli/workboard) u `openclaw voicecall`.

</Accordion>

## Comandos slash de chat

Los mensajes de chat admiten comandos `/...`. Consulta [comandos slash](/es/tools/slash-commands).

Aspectos destacados:

- `/status` - diagnóstico rápido.
- `/trace` - líneas de traza/depuración de plugins con alcance de sesión.
- `/config` - cambios de configuración persistentes.
- `/debug` - anulaciones de configuración solo en tiempo de ejecución (memoria, no disco; requiere `commands.debug: true`).

## Seguimiento de uso

`openclaw status --usage` y la interfaz de control muestran el uso/cuota del proveedor cuando
hay credenciales OAuth/API disponibles. Los datos provienen directamente de los endpoints de uso
del proveedor y se normalizan como `X% left`. Proveedores con ventanas de uso actuales:
Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi y z.ai.

Consulta [Seguimiento de uso](/es/concepts/usage-tracking) para obtener más detalles.

## Relacionado

- [Comandos slash](/es/tools/slash-commands)
- [Configuración](/es/gateway/configuration)
- [Entorno](/es/help/environment)
