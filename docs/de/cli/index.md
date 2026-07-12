---
read_when:
    - Den richtigen `openclaw`-Unterbefehl finden
    - Globale Flags oder Regeln für die Ausgabegestaltung nachschlagen
summary: 'OpenClaw-CLI-Übersicht: Befehlsliste, globale Optionen und Links zu Seiten für einzelne Befehle'
title: CLI-Referenz
x-i18n:
    generated_at: "2026-07-12T01:31:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` ist der zentrale CLI-Einstiegspunkt. Jeder Kernbefehl verfügt über eine eigene
Referenzseite oder ist zusammen mit dem Befehl dokumentiert, dessen Alias er ist. Dieser Index führt
die Befehle, globalen Optionen und Regeln für die Ausgabeformatierung auf, die in der gesamten CLI gelten.

Einrichtungsbefehle nach Zweck:

- `openclaw setup` und `openclaw onboard` überprüfen zuerst die Inferenz und starten dann Crestodian zur Einrichtung von Gateway, Arbeitsbereich, Kanälen, Skills und Systemzustand.
- `openclaw setup --baseline` erstellt die Basiskonfiguration und den Arbeitsbereich, ohne den geführten Onboarding-Ablauf zu durchlaufen.
- `openclaw configure` ändert gezielt Teile einer vorhandenen Einrichtung: Modellauthentifizierung, Gateway, Kanäle, Plugins oder Skills.
- `openclaw channels add` konfiguriert Kanalkonten, nachdem die Basiskonfiguration vorhanden ist. Führen Sie den Befehl für eine geführte Einrichtung ohne Optionen oder für Skripte mit kanalspezifischen Optionen aus.

## Befehlsseiten

| Bereich                         | Befehle                                                                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einrichtung und Onboarding      | [`crestodian`](/de/cli/crestodian) · [`setup`](/de/cli/setup) · [`onboard`](/de/cli/onboard) · [`configure`](/de/cli/configure) · [`config`](/de/cli/config) · [`completion`](/de/cli/completion) · [`doctor`](/de/cli/doctor) · [`dashboard`](/de/cli/dashboard) |
| Zurücksetzen, Sicherung und Migration | [`backup`](/de/cli/backup) · [`migrate`](/de/cli/migrate) · [`reset`](/de/cli/reset) · [`uninstall`](/de/cli/uninstall) · [`update`](/de/cli/update)                                                                                               |
| Nachrichten und Agenten         | [`message`](/de/cli/message) · [`agent`](/de/cli/agent) · [`agents`](/de/cli/agents) · [`attach`](/de/cli/attach) · [`acp`](/de/cli/acp) · [`mcp`](/de/cli/mcp)                                                                                             |
| Systemzustand und Sitzungen     | [`status`](/de/cli/status) · [`health`](/de/cli/health) · [`sessions`](/de/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway und Protokolle          | [`gateway`](/de/cli/gateway) · [`logs`](/de/cli/logs) · [`system`](/de/cli/system)                                                                                                                                                                 |
| Modelle und Inferenz            | [`models`](/de/cli/models) · [`promos`](/de/cli/promos) · [`infer`](/de/cli/infer) · `capability` (Alias für [`infer`](/de/cli/infer)) · [`memory`](/de/cli/memory) · [`commitments`](/de/cli/commitments) · [`wiki`](/de/cli/wiki)                            |
| Netzwerk und Nodes              | [`directory`](/de/cli/directory) · [`nodes`](/de/cli/nodes) · [`devices`](/de/cli/devices) · [`node`](/de/cli/node)                                                                                                                                   |
| Laufzeit und Sandbox            | [`approvals`](/de/cli/approvals) · `exec-policy` (siehe [`approvals`](/de/cli/approvals)) · [`sandbox`](/de/cli/sandbox) · [`tui`](/de/cli/tui) · `chat`/`terminal` (Aliasse für [`tui --local`](/de/cli/tui)) · [`browser`](/de/cli/browser)                 |
| Automatisierung                 | [`cron`](/de/cli/cron) · [`tasks`](/de/cli/tasks) · [`hooks`](/de/cli/hooks) · [`webhooks`](/de/cli/webhooks) · [`transcripts`](/de/cli/transcripts)                                                                                                     |
| Erkennung und Dokumentation     | [`dns`](/de/cli/dns) · [`docs`](/de/cli/docs)                                                                                                                                                                                                   |
| Kopplung und Kanäle             | [`pairing`](/de/cli/pairing) · [`qr`](/de/cli/qr) · [`channels`](/de/cli/channels)                                                                                                                                                                 |
| Sicherheit und Plugins          | [`security`](/de/cli/security) · [`secrets`](/de/cli/secrets) · [`skills`](/de/cli/skills) · [`plugins`](/de/cli/plugins) · [`proxy`](/de/cli/proxy)                                                                                                     |
| Veraltete Aliasse               | [`daemon`](/de/cli/daemon) (Gateway-Dienst) · [`clawbot`](/de/cli/clawbot) (Namensraum)                                                                                                                                                         |
| Plugins (optional)              | [`path`](/de/cli/path) · [`policy`](/de/cli/policy) · [`voicecall`](/de/cli/voicecall) · [`workboard`](/de/cli/workboard) (falls installiert)                                                                                                         |

## Globale Optionen

| Option                  | Zweck                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Isoliert den Zustand unter `~/.openclaw-dev`, verwendet standardmäßig Gateway-Port 19001 und verschiebt abgeleitete Ports |
| `--profile <name>`      | Isoliert den Zustand unter `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)              |
| `--container <name>`    | Führt die CLI in einem laufenden Podman-/Docker-Container namens `<name>` aus (Standard: Umgebungsvariable `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Überschreibt die globale Protokollierungsstufe für Datei- und Konsolenausgabe                              |
| `--no-color`            | Deaktiviert ANSI-Farben (`NO_COLOR=1` wird ebenfalls berücksichtigt)                                       |
| `--update`              | Kurzform für [`openclaw update`](/de/cli/update); funktioniert sowohl für Quellcode-Checkouts als auch für Paketinstallationen |
| `-V`, `--version`, `-v` | Gibt die Version aus und beendet das Programm                                                              |

## Ausgabemodi

- ANSI-Farben und Fortschrittsanzeigen werden nur in TTY-Sitzungen dargestellt.
- OSC-8-Hyperlinks werden, sofern unterstützt, als anklickbare Links dargestellt; andernfalls
  verwendet die CLI einfache URLs.
- `--json` (und, sofern unterstützt, `--plain`) deaktiviert die Formatierung für eine bereinigte Ausgabe.
- Lang laufende Befehle zeigen eine Fortschrittsanzeige an (OSC 9;4, sofern unterstützt).

## Farbpalette

OpenClaw verwendet für die CLI-Ausgabe eine Hummer-Farbpalette:

| Token          | Hex       | Verwendet für                               |
| -------------- | --------- | -------------------------------------------- |
| `accent`       | `#FF5A2D` | Überschriften, Beschriftungen, primäre Hervorhebungen |
| `accentBright` | `#FF7A3D` | Befehlsnamen, Betonungen                     |
| `accentDim`    | `#D14A22` | Sekundär hervorgehobener Text                |
| `info`         | `#FF8A5B` | Informationswerte                            |
| `success`      | `#2FBF71` | Erfolgszustände                              |
| `warn`         | `#FFB020` | Warnungen, Befehlsoptionen, Ausweichlösungen |
| `error`        | `#E23D2D` | Fehler, Fehlschläge                          |
| `muted`        | `#8B7F77` | Zurückgenommene Darstellung, Metadaten       |

Maßgebliche Quelle für die Farbpalette: `packages/terminal-core/src/palette.ts`.

## Befehlsbaum

<Accordion title="Vollständiger Befehlsbaum">

Diese Übersicht umfasst die Kernbefehle und ihre wichtigsten Unterbefehle. Durch Plugins hinzugefügte
Unterbefehle (beispielsweise unter `skills`, `plugins` und `wiki`) werden
unabhängig weiterentwickelt. Führen Sie `<command> --help` aus, um die maßgebliche aktuelle Liste anzuzeigen.

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

Plugins können zusätzliche Befehle auf oberster Ebene hinzufügen, beispielsweise
[`openclaw workboard`](/de/cli/workboard) oder `openclaw voicecall`.

</Accordion>

## Slash-Befehle im Chat

Chatnachrichten unterstützen `/...`-Befehle. Siehe [Slash-Befehle](/de/tools/slash-commands).

Highlights:

- `/status` – Schnelldiagnose.
- `/trace` – sitzungsbezogene Trace-/Debug-Zeilen des Plugins.
- `/config` – dauerhafte Konfigurationsänderungen.
- `/debug` – ausschließlich zur Laufzeit wirksame Konfigurationsüberschreibungen (im Arbeitsspeicher, nicht auf dem Datenträger; erfordert `commands.debug: true`).

## Nutzungserfassung

`openclaw status --usage` und die Kontrolloberfläche zeigen die Nutzung und das Kontingent des Providers an, wenn
OAuth-/API-Anmeldedaten verfügbar sind. Die Daten stammen direkt aus den Nutzungsendpunkten
der Provider und werden in das Format `X% left` normalisiert. Provider mit aktuellen
Nutzungszeiträumen: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi und z.ai.

Weitere Informationen finden Sie unter [Nutzungserfassung](/de/concepts/usage-tracking).

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [Konfiguration](/de/gateway/configuration)
- [Umgebung](/de/help/environment)
