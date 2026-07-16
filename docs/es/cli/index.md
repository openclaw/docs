---
read_when:
    - Encontrar el subcomando `openclaw` adecuado
    - Consulta de opciones globales o reglas de estilo de salida
summary: 'Índice de la CLI de OpenClaw: lista de comandos, opciones globales y enlaces a las páginas de cada comando'
title: Referencia de la CLI
x-i18n:
    generated_at: "2026-07-16T11:33:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` es el punto de entrada principal de la CLI. Cada comando principal tiene una página de
referencia específica o está documentado junto con el comando del que es alias; este índice enumera
los comandos, las opciones globales y las reglas de estilo de salida que se aplican en toda la CLI.

Comandos de configuración según la finalidad:

- `openclaw setup` y `openclaw onboard` verifican primero la inferencia y, a continuación, inician OpenClaw para configurar el Gateway, el espacio de trabajo, los canales, las Skills y el estado.
- `openclaw setup --baseline` crea la configuración y el espacio de trabajo básicos sin recorrer el flujo guiado de incorporación.
- `openclaw configure` modifica partes específicas de una configuración existente: autenticación del modelo, Gateway, canales, plugins o Skills.
- `openclaw channels add` configura las cuentas de los canales una vez que existe la configuración básica; se ejecuta sin opciones para la configuración guiada o con opciones específicas de cada canal para scripts.

## Páginas de comandos

| Área                         | Comandos                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración e incorporación         | [`openclaw`](/es/cli/openclaw) · [`setup`](/es/cli/setup) · [`onboard`](/es/cli/onboard) · [`configure`](/es/cli/configure) · [`config`](/es/cli/config) · [`completion`](/es/cli/completion) · [`doctor`](/es/cli/doctor) · [`dashboard`](/es/cli/dashboard) |
| Restablecimiento, copia de seguridad y migración | [`backup`](/es/cli/backup) · [`migrate`](/es/cli/migrate) · [`reset`](/es/cli/reset) · [`uninstall`](/es/cli/uninstall) · [`update`](/es/cli/update)                                                                                                 |
| Mensajería y agentes         | [`message`](/es/cli/message) · [`agent`](/es/cli/agent) · [`agents`](/es/cli/agents) · [`attach`](/es/cli/attach) · [`acp`](/es/cli/acp) · [`mcp`](/es/cli/mcp)                                                                                         |
| Estado y sesiones          | [`status`](/es/cli/status) · [`health`](/es/cli/health) · [`sessions`](/es/cli/sessions) · [`audit`](/es/cli/audit)                                                                                                                               |
| Gateway y registros             | [`gateway`](/es/cli/gateway) · [`logs`](/es/cli/logs) · [`system`](/es/cli/system)                                                                                                                                                             |
| Modelos e inferencia         | [`models`](/es/cli/models) · [`promos`](/es/cli/promos) · [`infer`](/es/cli/infer) · `capability` (alias de [`infer`](/es/cli/infer)) · [`memory`](/es/cli/memory) · [`commitments`](/es/cli/commitments) · [`wiki`](/es/cli/wiki)                        |
| Red y nodos            | [`directory`](/es/cli/directory) · [`nodes`](/es/cli/nodes) · [`devices`](/es/cli/devices) · [`node`](/es/cli/node) · [`worker`](/es/cli/worker)                                                                                                     |
| Entorno de ejecución y entorno aislado          | [`approvals`](/es/cli/approvals) · `exec-policy` (véase [`approvals`](/es/cli/approvals)) · [`sandbox`](/es/cli/sandbox) · [`tui`](/es/cli/tui) · `chat`/`terminal` (alias de [`tui --local`](/es/cli/tui)) · [`browser`](/es/cli/browser)             |
| Automatización                   | [`cron`](/es/cli/cron) · [`tasks`](/es/cli/tasks) · [`hooks`](/es/cli/hooks) · [`webhooks`](/es/cli/webhooks) · [`transcripts`](/es/cli/transcripts)                                                                                                 |
| Detección y documentación           | [`dns`](/es/cli/dns) · [`docs`](/es/cli/docs)                                                                                                                                                                                               |
| Vinculación y canales         | [`pairing`](/es/cli/pairing) · [`qr`](/es/cli/qr) · [`channels`](/es/cli/channels)                                                                                                                                                             |
| Seguridad y plugins         | [`security`](/es/cli/security) · [`secrets`](/es/cli/secrets) · [`skills`](/es/cli/skills) · [`plugins`](/es/cli/plugins) · [`proxy`](/es/cli/proxy)                                                                                                 |
| Alias heredados               | [`daemon`](/es/cli/daemon) (servicio de Gateway) · [`clawbot`](/es/cli/clawbot) (espacio de nombres)                                                                                                                                                     |
| Plugins (opcionales)           | [`path`](/es/cli/path) · [`policy`](/es/cli/policy) · [`voicecall`](/es/cli/voicecall) · [`workboard`](/es/cli/workboard) (si está instalado)                                                                                                          |

## Opciones globales

| Opción                    | Finalidad                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Aísla el estado en `~/.openclaw-dev`, establece 19001 como puerto predeterminado del Gateway y desplaza los puertos derivados              |
| `--profile <name>`      | Aísla el estado en `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Ejecuta la CLI dentro de un contenedor Podman/Docker en ejecución denominado `<name>` (valor predeterminado: variable de entorno `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Sustituye el nivel de registro global para la salida en archivo y consola                                                 |
| `--no-color`            | Desactiva los colores ANSI (también se respeta `NO_COLOR=1`)                                                    |
| `--update`              | Forma abreviada de [`openclaw update`](/es/cli/update); funciona tanto para repositorios de código fuente como para instalaciones de paquetes    |
| `-V`, `--version`, `-v` | Muestra la versión y finaliza                                                                                  |

## Modos de salida

- Los colores ANSI y los indicadores de progreso solo se muestran en sesiones TTY.
- Los hipervínculos OSC-8 se muestran como enlaces seleccionables cuando son compatibles; de lo contrario, la
  CLI recurre a URL de texto sin formato.
- `--json` (y `--plain` cuando es compatible) desactiva los estilos para obtener una salida limpia.
- Los comandos de larga duración muestran un indicador de progreso (OSC 9;4 cuando es compatible).

## Paleta de colores

OpenClaw utiliza una paleta inspirada en la langosta para la salida de la CLI:

| Token          | Hexadecimal       | Uso                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Encabezados, etiquetas y elementos destacados principales |
| `accentBright` | `#FF7A3D` | Nombres de comandos y énfasis              |
| `accentDim`    | `#D14A22` | Texto destacado secundario             |
| `info`         | `#FF8A5B` | Valores informativos                 |
| `success`      | `#2FBF71` | Estados de éxito                       |
| `warn`         | `#FFB020` | Advertencias, opciones y alternativas    |
| `error`        | `#E23D2D` | Errores y fallos                     |
| `muted`        | `#8B7F77` | Atenuación y metadatos                |

Fuente de referencia de la paleta: `packages/terminal-core/src/palette.ts`.

## Árbol de comandos

<Accordion title="Árbol de comandos completo">

Este mapa abarca los comandos principales y sus subcomandos principales. Los subcomandos añadidos por plugins
(por ejemplo, en `skills`, `plugins` y `wiki`) evolucionan
de forma independiente; ejecute `<command> --help` para obtener la lista actual y oficial.

```
openclaw [--dev] [--profile <name>] <command>
  openclaw
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
  worker
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

Los Plugins pueden añadir comandos adicionales de nivel superior, como
[`openclaw workboard`](/es/cli/workboard) o `openclaw voicecall`.

</Accordion>

## Comandos de barra diagonal del chat

Los mensajes de chat admiten comandos `/...`. Consulte [comandos de barra diagonal](/es/tools/slash-commands).

Aspectos destacados:

- `/status` - diagnóstico rápido.
- `/trace` - líneas de seguimiento y depuración del Plugin limitadas a la sesión.
- `/config` - cambios de configuración persistentes.
- `/debug` - anulaciones de configuración solo en tiempo de ejecución (en memoria, no en disco; requiere `commands.debug: true`).

## Seguimiento del uso

`openclaw status --usage` y la interfaz de Control UI muestran el uso y la cuota del proveedor cuando
hay credenciales de OAuth/API disponibles. Los datos proceden directamente de los endpoints de uso
de los proveedores y se normalizan a `X% left`. Proveedores con ventanas de uso actuales:
Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi y z.ai.

Consulte [Seguimiento del uso](/es/concepts/usage-tracking) para obtener más información.

## Contenido relacionado

- [Comandos de barra diagonal](/es/tools/slash-commands)
- [Configuración](/es/gateway/configuration)
- [Entorno](/es/help/environment)
