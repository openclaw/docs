---
read_when:
    - Den richtigen Unterbefehl ``openclaw`` finden
    - Globale Flags oder Regeln für die Ausgabeformatierung nachschlagen
summary: 'OpenClaw-CLI-Index: Befehlsliste, globale Flags und Links zu den Seiten der einzelnen Befehle'
title: CLI-Referenz
x-i18n:
    generated_at: "2026-04-25T13:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8a61396b8ec7f57d15988d40b09f90458745bbb29e90bd387134aa032214853
    source_path: cli/index.md
    workflow: 15
---

`openclaw` ist der Haupteinstiegspunkt der CLI. Jeder Core-Befehl hat entweder eine dedizierte Referenzseite oder ist zusammen mit dem Befehl dokumentiert, für den er ein Alias ist; dieser Index listet die Befehle, die globalen Flags und die Regeln zur Ausgabeformatierung auf, die in der gesamten CLI gelten.

## Befehlsseiten

| Bereich              | Befehle                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einrichtung und Onboarding | [`crestodian`](/de/cli/crestodian) · [`setup`](/de/cli/setup) · [`onboard`](/de/cli/onboard) · [`configure`](/de/cli/configure) · [`config`](/de/cli/config) · [`completion`](/de/cli/completion) · [`doctor`](/de/cli/doctor) · [`dashboard`](/de/cli/dashboard) |
| Zurücksetzen und Deinstallation | [`backup`](/de/cli/backup) · [`reset`](/de/cli/reset) · [`uninstall`](/de/cli/uninstall) · [`update`](/de/cli/update)                                                                                                                                 |
| Nachrichten und Agenten | [`message`](/de/cli/message) · [`agent`](/de/cli/agent) · [`agents`](/de/cli/agents) · [`acp`](/de/cli/acp) · [`mcp`](/de/cli/mcp)                                                                                                                       |
| Gesundheit und Sitzungen | [`status`](/de/cli/status) · [`health`](/de/cli/health) · [`sessions`](/de/cli/sessions)                                                                                                                                                           |
| Gateway und Logs     | [`gateway`](/de/cli/gateway) · [`logs`](/de/cli/logs) · [`system`](/de/cli/system)                                                                                                                                                                   |
| Modelle und Inferenz | [`models`](/de/cli/models) · [`infer`](/de/cli/infer) · `capability` (Alias für [`infer`](/de/cli/infer)) · [`memory`](/de/cli/memory) · [`wiki`](/de/cli/wiki)                                                                                          |
| Netzwerk und Nodes   | [`directory`](/de/cli/directory) · [`nodes`](/de/cli/nodes) · [`devices`](/de/cli/devices) · [`node`](/de/cli/node)                                                                                                                                    |
| Laufzeit und Sandbox | [`approvals`](/de/cli/approvals) · `exec-policy` (siehe [`approvals`](/de/cli/approvals)) · [`sandbox`](/de/cli/sandbox) · [`tui`](/de/cli/tui) · `chat`/`terminal` (Aliasse für [`tui --local`](/de/cli/tui)) · [`browser`](/de/cli/browser)             |
| Automatisierung      | [`cron`](/de/cli/cron) · [`tasks`](/de/cli/tasks) · [`hooks`](/de/cli/hooks) · [`webhooks`](/de/cli/webhooks)                                                                                                                                          |
| Erkennung und Docs   | [`dns`](/de/cli/dns) · [`docs`](/de/cli/docs)                                                                                                                                                                                                     |
| Pairing und Kanäle   | [`pairing`](/de/cli/pairing) · [`qr`](/de/cli/qr) · [`channels`](/de/cli/channels)                                                                                                                                                                   |
| Sicherheit und Plugins | [`security`](/de/cli/security) · [`secrets`](/de/cli/secrets) · [`skills`](/de/cli/skills) · [`plugins`](/de/cli/plugins) · [`proxy`](/de/cli/proxy)                                                                                                   |
| Legacy-Aliasse       | [`daemon`](/de/cli/daemon) (Gateway-Dienst) · [`clawbot`](/de/cli/clawbot) (Namespace)                                                                                                                                                            |
| Plugins (optional)   | [`voicecall`](/de/cli/voicecall) (falls installiert)                                                                                                                                                                                            |

## Globale Flags

| Flag                    | Zweck                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | State unter `~/.openclaw-dev` isolieren und Standardports verschieben |
| `--profile <name>`      | State unter `~/.openclaw-<name>` isolieren                            |
| `--container <name>`    | Einen benannten Container für die Ausführung ansprechen               |
| `--no-color`            | ANSI-Farben deaktivieren (`NO_COLOR=1` wird ebenfalls berücksichtigt) |
| `--update`              | Kurzform für [`openclaw update`](/de/cli/update) (nur Source-Installationen) |
| `-V`, `--version`, `-v` | Version ausgeben und beenden                                          |

## Ausgabemodi

- ANSI-Farben und Fortschrittsanzeigen werden nur in TTY-Sitzungen gerendert.
- OSC-8-Hyperlinks werden, sofern unterstützt, als anklickbare Links gerendert; andernfalls greift die CLI auf einfache URLs zurück.
- `--json` (und `--plain`, sofern unterstützt) deaktiviert Styling für eine saubere Ausgabe.
- Lang laufende Befehle zeigen eine Fortschrittsanzeige an (OSC 9;4, sofern unterstützt).

Quelle der Wahrheit für die Palette: `src/terminal/palette.ts`.

## Befehlsbaum

<Accordion title="Vollständiger Befehlsbaum">

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

Plugins können zusätzliche Top-Level-Befehle hinzufügen (zum Beispiel `openclaw voicecall`).

</Accordion>

## Chat-Slash-Befehle

Chat-Nachrichten unterstützen `/...`-Befehle. Siehe [Slash commands](/de/tools/slash-commands).

Highlights:

- `/status` — schnelle Diagnose.
- `/trace` — sitzungsbezogene Plugin-Trace-/Debug-Zeilen.
- `/config` — persistierte Konfigurationsänderungen.
- `/debug` — nur Laufzeit-Konfigurationsüberschreibungen (Speicher, nicht Datenträger; erfordert `commands.debug: true`).

## Nutzungsverfolgung

`openclaw status --usage` und die Control UI zeigen Provider-Nutzung/Kontingente an, wenn OAuth-/API-Zugangsdaten verfügbar sind. Die Daten kommen direkt von den Nutzungsendpunkten der Provider und werden zu `X% left` normalisiert. Provider mit aktuellen Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi und z.ai.

Siehe [Nutzungsverfolgung](/de/concepts/usage-tracking) für Details.

## Verwandt

- [Slash commands](/de/tools/slash-commands)
- [Konfiguration](/de/gateway/configuration)
- [Umgebung](/de/help/environment)
