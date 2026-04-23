---
read_when:
    - CLI-Befehle oder -Optionen hinzufügen oder ändern
    - Neue Befehlsoberflächen dokumentieren
summary: OpenClaw CLI-Referenz für `openclaw`-Befehle, Unterbefehle und Optionen
title: CLI-Referenz
x-i18n:
    generated_at: "2026-04-23T06:26:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e5d3de831331307203ac6f67a3f4b4c969c4ccc10e813ebab1e052b87f0426b
    source_path: cli/index.md
    workflow: 15
---

# CLI-Referenz

Diese Seite beschreibt das aktuelle CLI-Verhalten. Wenn sich Befehle ändern, aktualisieren Sie diese Dokumentation.

## Befehlsseiten

- [`setup`](/de/cli/setup)
- [`onboard`](/de/cli/onboard)
- [`configure`](/de/cli/configure)
- [`config`](/de/cli/config)
- [`completion`](/de/cli/completion)
- [`doctor`](/de/cli/doctor)
- [`dashboard`](/de/cli/dashboard)
- [`backup`](/de/cli/backup)
- [`reset`](/de/cli/reset)
- [`uninstall`](/de/cli/uninstall)
- [`update`](/de/cli/update)
- [`message`](/de/cli/message)
- [`agent`](/de/cli/agent)
- [`agents`](/de/cli/agents)
- [`acp`](/de/cli/acp)
- [`mcp`](/de/cli/mcp)
- [`status`](/de/cli/status)
- [`health`](/de/cli/health)
- [`sessions`](/de/cli/sessions)
- [`gateway`](/de/cli/gateway)
- [`logs`](/de/cli/logs)
- [`system`](/de/cli/system)
- [`models`](/de/cli/models)
- [`infer`](/de/cli/infer)
- [`memory`](/de/cli/memory)
- [`wiki`](/de/cli/wiki)
- [`directory`](/de/cli/directory)
- [`nodes`](/de/cli/nodes)
- [`devices`](/de/cli/devices)
- [`node`](/de/cli/node)
- [`approvals`](/de/cli/approvals)
- [`sandbox`](/de/cli/sandbox)
- [`tui`](/de/cli/tui)
- [`browser`](/de/cli/browser)
- [`cron`](/de/cli/cron)
- [`tasks`](/de/cli/tasks)
- [`flows`](/de/cli/flows)
- [`dns`](/de/cli/dns)
- [`docs`](/de/cli/docs)
- [`hooks`](/de/cli/hooks)
- [`webhooks`](/de/cli/webhooks)
- [`pairing`](/de/cli/pairing)
- [`qr`](/de/cli/qr)
- [`plugins`](/de/cli/plugins) (Plugin-Befehle)
- [`channels`](/de/cli/channels)
- [`security`](/de/cli/security)
- [`secrets`](/de/cli/secrets)
- [`skills`](/de/cli/skills)
- [`daemon`](/de/cli/daemon) (veralteter Alias für Gateway-Service-Befehle)
- [`clawbot`](/de/cli/clawbot) (veralteter Alias-Namensraum)
- [`voicecall`](/de/cli/voicecall) (Plugin; falls installiert)

## Globale Flags

- `--dev`: Status unter `~/.openclaw-dev` isolieren und Standardports verschieben.
- `--profile <name>`: Status unter `~/.openclaw-<name>` isolieren.
- `--container <name>`: Einen benannten Container für die Ausführung ansprechen.
- `--no-color`: ANSI-Farben deaktivieren.
- `--update`: Kurzform für `openclaw update` (nur Quellinstallationen).
- `-V`, `--version`, `-v`: Version ausgeben und beenden.

## Ausgabestil

- ANSI-Farben und Fortschrittsanzeigen werden nur in TTY-Sitzungen gerendert.
- OSC-8-Hyperlinks werden in unterstützten Terminals als anklickbare Links gerendert; andernfalls wird auf einfache URLs zurückgefallen.
- `--json` (und `--plain`, sofern unterstützt) deaktiviert Stile für eine saubere Ausgabe.
- `--no-color` deaktiviert ANSI-Stile; `NO_COLOR=1` wird ebenfalls berücksichtigt.
- Lang laufende Befehle zeigen eine Fortschrittsanzeige (OSC 9;4, sofern unterstützt).

## Farbpalette

OpenClaw verwendet für die CLI-Ausgabe eine Lobster-Palette.

- `accent` (#FF5A2D): Überschriften, Labels, primäre Hervorhebungen.
- `accentBright` (#FF7A3D): Befehlsnamen, Hervorhebungen.
- `accentDim` (#D14A22): Sekundärer Hervorhebungstext.
- `info` (#FF8A5B): Informative Werte.
- `success` (#2FBF71): Erfolgszustände.
- `warn` (#FFB020): Warnungen, Fallbacks, Hinweise.
- `error` (#E23D2D): Fehler, Fehlschläge.
- `muted` (#8B7F77): Dezentrierung, Metadaten.

Maßgebliche Quelle der Palette: `src/terminal/palette.ts` (die „Lobster-Palette“).

## Befehlsbaum

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
```

Hinweis: Plugins können zusätzliche Befehle der obersten Ebene hinzufügen (zum Beispiel `openclaw voicecall`).

## Sicherheit

- `openclaw security audit` — Konfiguration + lokalen Status auf häufige Sicherheitsfallen prüfen.
- `openclaw security audit --deep` — Best-Effort-Live-Gateway-Prüfung.
- `openclaw security audit --fix` — Sichere Standardwerte und Status-/Konfigurationsberechtigungen verschärfen.

## Secrets

### `secrets`

SecretRefs und zugehörige Laufzeit-/Konfigurationshygiene verwalten.

Unterbefehle:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Optionen für `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Optionen für `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Optionen für `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Optionen für `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Hinweise:

- `reload` ist ein Gateway-RPC und behält den letzten bekannten funktionierenden Laufzeit-Snapshot bei, wenn die Auflösung fehlschlägt.
- `audit --check` gibt bei Befunden einen von null verschiedenen Exit-Code zurück; ungelöste Referenzen verwenden einen Exit-Code mit höherer Priorität.
- Dry-Run-`exec`-Prüfungen werden standardmäßig übersprungen; verwenden Sie `--allow-exec`, um sie zu aktivieren.

## Plugins

Plugins und deren Konfiguration verwalten:

- `openclaw plugins list` — Plugins erkennen (für maschinenlesbare Ausgabe `--json` verwenden).
- `openclaw plugins inspect <id>` — Details zu einem Plugin anzeigen (`info` ist ein Alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — Ein Plugin installieren (oder einen Plugin-Pfad zu `plugins.load.paths` hinzufügen; verwenden Sie `--force`, um ein vorhandenes Installationsziel zu überschreiben).
- `openclaw plugins marketplace list <marketplace>` — Marketplace-Einträge vor der Installation auflisten.
- `openclaw plugins enable <id>` / `disable <id>` — `plugins.entries.<id>.enabled` umschalten.
- `openclaw plugins doctor` — Plugin-Ladefehler melden.

Die meisten Plugin-Änderungen erfordern einen Gateway-Neustart. Siehe [/plugin](/de/tools/plugin).

## Memory

Vektorsuche über `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — Indexstatistiken anzeigen; verwenden Sie `--deep` für Bereitschaftsprüfungen von Vektor + Embedding oder `--fix`, um veraltete Recall-/Promotion-Artefakte zu reparieren.
- `openclaw memory index` — Memory-Dateien neu indexieren.
- `openclaw memory search "<query>"` (oder `--query "<query>"`) — semantische Suche über Memory.
- `openclaw memory promote` — Kurzfristige Recalls priorisieren und optional Top-Einträge an `MEMORY.md` anhängen.

## Sandbox

Sandbox-Laufzeitumgebungen für isolierte Agent-Ausführung verwalten. Siehe [/cli/sandbox](/de/cli/sandbox).

Unterbefehle:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Hinweise:

- `sandbox recreate` entfernt vorhandene Laufzeitumgebungen, sodass ihre nächste Verwendung sie mit der aktuellen Konfiguration erneut initialisiert.
- Für `ssh`- und OpenShell-`remote`-Backends löscht `recreate` den kanonischen Remote-Workspace für den ausgewählten Geltungsbereich.

## Chat-Slash-Befehle

Chat-Nachrichten unterstützen `/...`-Befehle (Text und nativ). Siehe [/tools/slash-commands](/de/tools/slash-commands).

Wichtigste Punkte:

- `/status` für schnelle Diagnosen.
- `/trace` für sitzungsbezogene Plugin-Trace-/Debug-Zeilen.
- `/config` für persistente Konfigurationsänderungen.
- `/debug` für reine Laufzeit-Konfigurationsüberschreibungen (im Speicher, nicht auf Festplatte; erfordert `commands.debug: true`).

## Setup + Onboarding

### `completion`

Shell-Completion-Skripte generieren und optional in Ihrem Shell-Profil installieren.

Optionen:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Hinweise:

- Ohne `--install` oder `--write-state` gibt `completion` das Skript an stdout aus.
- `--install` schreibt einen Block `OpenClaw Completion` in Ihr Shell-Profil und verweist ihn auf das zwischengespeicherte Skript unter dem OpenClaw-Statusverzeichnis.

### `setup`

Konfiguration + Workspace initialisieren.

Optionen:

- `--workspace <dir>`: Agent-Workspace-Pfad (Standard `~/.openclaw/workspace`).
- `--wizard`: Onboarding ausführen.
- `--non-interactive`: Onboarding ohne Eingabeaufforderungen ausführen.
- `--mode <local|remote>`: Onboarding-Modus.
- `--remote-url <url>`: URL des Remote-Gateway.
- `--remote-token <token>`: Token des Remote-Gateway.

Das Onboarding wird automatisch ausgeführt, wenn beliebige Onboarding-Flags vorhanden sind (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Interaktives Onboarding für Gateway, Workspace und Skills.

Optionen:

- `--workspace <dir>`
- `--reset` (Konfiguration + Anmeldedaten + Sitzungen vor dem Onboarding zurücksetzen)
- `--reset-scope <config|config+creds+sessions|full>` (Standard `config+creds+sessions`; verwenden Sie `full`, um zusätzlich den Workspace zu entfernen)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` ist ein Alias für `advanced`)
- `--auth-choice <choice>`, wobei `<choice>` einer der folgenden Werte ist:
  `chutes`, `deepseek-api-key`, `openai-codex`, `openai-api-key`,
  `openrouter-api-key`, `kilocode-api-key`, `litellm-api-key`, `ai-gateway-api-key`,
  `cloudflare-ai-gateway-api-key`, `moonshot-api-key`, `moonshot-api-key-cn`,
  `kimi-code-api-key`, `synthetic-api-key`, `venice-api-key`, `together-api-key`,
  `huggingface-api-key`, `apiKey`, `gemini-api-key`, `google-gemini-cli`, `zai-api-key`,
  `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`, `xiaomi-api-key`,
  `minimax-global-oauth`, `minimax-global-api`, `minimax-cn-oauth`, `minimax-cn-api`,
  `opencode-zen`, `opencode-go`, `github-copilot`, `copilot-proxy`, `xai-api-key`,
  `mistral-api-key`, `volcengine-api-key`, `byteplus-api-key`, `qianfan-api-key`,
  `qwen-standard-api-key-cn`, `qwen-standard-api-key`, `qwen-api-key-cn`, `qwen-api-key`,
  `modelstudio-standard-api-key-cn`, `modelstudio-standard-api-key`,
  `modelstudio-api-key-cn`, `modelstudio-api-key`, `custom-api-key`, `skip`
- Qwen-Hinweis: `qwen-*` ist die kanonische `auth-choice`-Familie. `modelstudio-*`-
  IDs werden nur noch als veraltete Kompatibilitäts-Aliasse akzeptiert.
- `--secret-input-mode <plaintext|ref>` (Standard `plaintext`; verwenden Sie `ref`, um Standard-Umgebungsreferenzen des Providers statt Klartextschlüsseln zu speichern)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (nicht interaktiv; verwendet mit `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (nicht interaktiv; verwendet mit `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (nicht interaktiv; optional; verwendet mit `--auth-choice custom-api-key`; greift auf `CUSTOM_API_KEY` zurück, wenn weggelassen)
- `--custom-provider-id <id>` (nicht interaktiv; optionale benutzerdefinierte Provider-ID)
- `--custom-compatibility <openai|anthropic>` (nicht interaktiv; optional; Standard `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (nicht interaktiv; speichert `gateway.auth.token` als env SecretRef; erfordert, dass diese Umgebungsvariable gesetzt ist; kann nicht mit `--gateway-token` kombiniert werden)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (Alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (Node-Manager für Setup/Onboarding für Skills; pnpm empfohlen, bun ebenfalls unterstützt)
- `--json`

### `configure`

Interaktiver Konfigurationsassistent (Modelle, Kanäle, Skills, Gateway).

Optionen:

- `--section <section>` (wiederholbar; begrenzt den Assistenten auf bestimmte Abschnitte)

### `config`

Nicht interaktive Konfigurationshelfer (`get`/`set`/`unset`/`file`/`schema`/`validate`). Wenn `openclaw config` ohne
Unterbefehl ausgeführt wird, startet der Assistent.

Unterbefehle:

- `config get <path>`: Einen Konfigurationswert ausgeben (Punkt-/Klammerpfad).
- `config set`: unterstützt vier Zuweisungsmodi:
  - Wertmodus: `config set <path> <value>` (JSON5-oder-String-Parsing)
  - SecretRef-Builder-Modus: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - Provider-Builder-Modus: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - Batch-Modus: `config set --batch-json '<json>'` oder `config set --batch-file <path>`
- `config set --dry-run`: Zuweisungen validieren, ohne `openclaw.json` zu schreiben (`exec`-SecretRef-Prüfungen werden standardmäßig übersprungen).
- `config set --allow-exec --dry-run`: `exec`-SecretRef-Dry-Run-Prüfungen aktivieren (kann Provider-Befehle ausführen).
- `config set --dry-run --json`: Maschinenlesbare Dry-Run-Ausgabe ausgeben (Prüfungen + Vollständigkeitssignal, Vorgänge, geprüfte/übersprungene Referenzen, Fehler).
- `config set --strict-json`: JSON5-Parsing für Pfad-/Werteingabe erzwingen. `--json` bleibt ein veralteter Alias für striktes Parsing außerhalb des Dry-Run-Ausgabemodus.
- `config unset <path>`: Einen Wert entfernen.
- `config file`: Den Pfad der aktiven Konfigurationsdatei ausgeben.
- `config schema`: Das generierte JSON-Schema für `openclaw.json` ausgeben, einschließlich propagierter Felddokumentationsmetadaten `title` / `description` über verschachtelte Objekt-, Wildcard-, Array-Element- und Kompositionszweige hinweg sowie Best-Effort-Live-Schemametadaten für Plugins/Kanäle.
- `config validate`: Die aktuelle Konfiguration gegen das Schema validieren, ohne das Gateway zu starten.
- `config validate --json`: Maschinenlesbare JSON-Ausgabe ausgeben.

### `doctor`

Integritätsprüfungen + schnelle Fehlerbehebungen (Konfiguration + Gateway + veraltete Services).

Optionen:

- `--no-workspace-suggestions`: Workspace-Memory-Hinweise deaktivieren.
- `--yes`: Standardwerte ohne Rückfrage akzeptieren (headless).
- `--non-interactive`: Eingabeaufforderungen überspringen; nur sichere Migrationen anwenden.
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen.
- `--repair` (Alias: `--fix`): Automatische Reparaturen für erkannte Probleme versuchen.
- `--force`: Reparaturen auch dann erzwingen, wenn sie nicht zwingend erforderlich sind.
- `--generate-gateway-token`: Ein neues Gateway-Authentifizierungstoken generieren.

### `dashboard`

Die Control UI mit Ihrem aktuellen Token öffnen.

Optionen:

- `--no-open`: Die URL ausgeben, aber keinen Browser starten

Hinweise:

- Bei per SecretRef verwalteten Gateway-Token gibt `dashboard` eine nicht tokenisierte URL aus oder öffnet sie, statt das Secret in der Terminalausgabe oder in Browser-Startargumenten offenzulegen.

### `update`

Die installierte CLI aktualisieren.

Root-Optionen:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Unterbefehle:

- `update status`
- `update wizard`

Optionen für `update status`:

- `--json`
- `--timeout <seconds>`

Optionen für `update wizard`:

- `--timeout <seconds>`

Hinweise:

- `openclaw --update` wird zu `openclaw update` umgeschrieben.

### `backup`

Lokale Backup-Archive für den OpenClaw-Status erstellen und prüfen.

Unterbefehle:

- `backup create`
- `backup verify <archive>`

Optionen für `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Optionen für `backup verify <archive>`:

- `--json`

## Kanalhelfer

### `channels`

Chat-Kanal-Konten verwalten (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Microsoft Teams).

Unterbefehle:

- `channels list`: konfigurierte Kanäle und Auth-Profile anzeigen.
- `channels status`: Erreichbarkeit des Gateway und Kanalzustand prüfen (`--probe` führt Live-Prüf-/Audit-Prüfungen pro Konto aus, wenn das Gateway erreichbar ist; andernfalls wird auf rein konfigurationsbasierte Kanalzusammenfassungen zurückgefallen. Verwenden Sie `openclaw health` oder `openclaw status --deep` für umfassendere Gateway-Integritätsprüfungen).
- Tipp: `channels status` gibt Warnungen mit vorgeschlagenen Fehlerbehebungen aus, wenn häufige Fehlkonfigurationen erkannt werden können (und verweist Sie dann auf `openclaw doctor`).
- `channels logs`: aktuelle Kanallogs aus der Gateway-Logdatei anzeigen.
- `channels add`: Assistentenartige Einrichtung, wenn keine Flags übergeben werden; Flags schalten in den nicht interaktiven Modus.
  - Beim Hinzufügen eines nicht standardmäßigen Kontos zu einem Kanal, der noch eine kontoübergreifende Top-Level-Konfiguration mit einem einzelnen Konto verwendet, überführt OpenClaw kontobezogene Werte in die Kontenzuordnung des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
  - Nicht interaktives `channels add` erstellt/aktualisiert Bindings nicht automatisch; rein kanalbezogene Bindings stimmen weiterhin mit dem Standardkonto überein.
- `channels remove`: standardmäßig deaktivieren; übergeben Sie `--delete`, um Konfigurationseinträge ohne Eingabeaufforderungen zu entfernen.
- `channels login`: interaktive Kanalanmeldung (nur WhatsApp Web).
- `channels logout`: von einer Kanalsitzung abmelden (falls unterstützt).

Häufige Optionen:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: Kanal-Konto-ID (Standard `default`)
- `--name <label>`: Anzeigename für das Konto

Optionen für `channels login`:

- `--channel <channel>` (Standard `whatsapp`; unterstützt `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Optionen für `channels logout`:

- `--channel <channel>` (Standard `whatsapp`)
- `--account <id>`

Optionen für `channels list`:

- `--no-usage`: Nutzungs-/Kontingent-Snapshots von Modell-Providern überspringen (nur OAuth-/API-gestützt).
- `--json`: JSON ausgeben (einschließlich Nutzung, sofern `--no-usage` nicht gesetzt ist).

Optionen für `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Optionen für `channels capabilities`:

- `--channel <name>`
- `--account <id>` (nur mit `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Optionen für `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Optionen für `channels logs`:

- `--channel <name|all>` (Standard `all`)
- `--lines <n>` (Standard `200`)
- `--json`

Hinweise:

- `channels login` unterstützt `--verbose`.
- `channels capabilities --account` gilt nur, wenn `--channel` gesetzt ist.
- `channels status --probe` kann je nach Kanalunterstützung den Transportstatus plus Prüf-/Audit-Ergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` anzeigen.

Mehr Details: [/concepts/oauth](/de/concepts/oauth)

Beispiele:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Self-, Peer- und Gruppen-IDs für Kanäle nachschlagen, die eine Verzeichnisoberfläche bereitstellen. Siehe [`openclaw directory`](/de/cli/directory).

Häufige Optionen:

- `--channel <name>`
- `--account <id>`
- `--json`

Unterbefehle:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Verfügbare Skills sowie Bereitschaftsinformationen auflisten und prüfen.

Unterbefehle:

- `skills search [query...]`: ClawHub-Skills durchsuchen.
- `skills search --limit <n> --json`: Suchergebnisse begrenzen oder maschinenlesbare Ausgabe erzeugen.
- `skills install <slug>`: Einen Skill aus ClawHub im aktiven Workspace installieren.
- `skills install <slug> --version <version>`: Eine bestimmte ClawHub-Version installieren.
- `skills install <slug> --force`: Einen vorhandenen Workspace-Skill-Ordner überschreiben.
- `skills update <slug|--all>`: Verfolgte ClawHub-Skills aktualisieren.
- `skills list`: Skills auflisten (Standard, wenn kein Unterbefehl angegeben ist).
- `skills list --json`: Maschinenlesbares Skill-Inventar auf stdout ausgeben.
- `skills list --verbose`: Fehlende Anforderungen in die Tabelle aufnehmen.
- `skills info <name>`: Details zu einem Skill anzeigen.
- `skills info <name> --json`: Maschinenlesbare Details auf stdout ausgeben.
- `skills check`: Zusammenfassung von bereiten gegenüber fehlenden Anforderungen.
- `skills check --json`: Maschinenlesbare Bereitschaftsausgabe auf stdout ausgeben.

Optionen:

- `--eligible`: Nur bereite Skills anzeigen.
- `--json`: JSON ausgeben (ohne Styling).
- `-v`, `--verbose`: Details zu fehlenden Anforderungen einschließen.

Tipp: Verwenden Sie `openclaw skills search`, `openclaw skills install` und `openclaw skills update` für ClawHub-gestützte Skills.

### `pairing`

DM-Pairing-Anfragen kanalübergreifend genehmigen.

Unterbefehle:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Hinweise:

- Wenn genau ein pairing-fähiger Kanal konfiguriert ist, ist auch `pairing approve <code>` zulässig.
- Sowohl `list` als auch `approve` unterstützen `--account <id>` für Kanäle mit mehreren Konten.

### `devices`

Gateway-Geräte-Pairing-Einträge und gerätespezifische Tokens pro Rolle verwalten.

Unterbefehle:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Hinweise:

- `devices list` und `devices approve` können bei local loopback auf lokale Pairing-Dateien zurückfallen, wenn der direkte Pairing-Bereich nicht verfügbar ist.
- `devices approve` erfordert vor dem Ausstellen von Tokens eine explizite Request-ID; wenn `requestId` weggelassen oder `--latest` übergeben wird, wird nur die neueste ausstehende Anfrage in der Vorschau angezeigt.
- Wiederverbindungen mit gespeicherten Tokens verwenden die im Cache hinterlegten genehmigten Bereiche des Tokens erneut; ein explizites
  `devices rotate --scope ...` aktualisiert diese gespeicherte Bereichsmenge für zukünftige
  Wiederverbindungen mit gecachten Tokens.
- `devices rotate` und `devices revoke` geben JSON-Payloads zurück.

### `qr`

Einen mobilen Pairing-QR-Code und Setup-Code aus der aktuellen Gateway-Konfiguration generieren. Siehe [`openclaw qr`](/de/cli/qr).

Optionen:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Hinweise:

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Setup-Code enthält ein kurzlebiges Bootstrap-Token, nicht das gemeinsame Gateway-Token/-Passwort.
- Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`.
- Jedes übergebene Operator-Bootstrap-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt.
- Bootstrap-Bereichsprüfungen sind rollenvorangestellt, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen, die keine Operatoren sind, benötigen weiterhin Bereiche unter ihrem eigenen Rollenpräfix.
- `--remote` kann `gateway.remote.url` oder die aktive Tailscale-Serve-/Funnel-URL verwenden.
- Nach dem Scannen genehmigen Sie die Anfrage mit `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Veralteter Alias-Namensraum. Unterstützt derzeit `openclaw clawbot qr`, das auf [`openclaw qr`](/de/cli/qr) abgebildet wird.

### `hooks`

Interne Agent-Hooks verwalten.

Unterbefehle:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (veralteter Alias für `openclaw plugins install`)
- `hooks update [id]` (veralteter Alias für `openclaw plugins update`)

Häufige Optionen:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Hinweise:

- Von Plugins verwaltete Hooks können nicht über `openclaw hooks` aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das besitzende Plugin.
- `hooks install` und `hooks update` funktionieren weiterhin als Kompatibilitäts-Aliasse, geben jedoch Warnungen zur Veraltung aus und leiten an die Plugin-Befehle weiter.

### `webhooks`

Webhook-Helfer. Die aktuell integrierte Oberfläche ist Gmail-Pub/Sub-Setup + Runner:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Gmail-Pub/Sub-Hook-Setup + Runner. Siehe [Gmail Pub/Sub](/de/automation/cron-jobs#gmail-pubsub-integration).

Unterbefehle:

- `webhooks gmail setup` (erfordert `--account <email>`; unterstützt `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (Laufzeitüberschreibungen für dieselben Flags)

Hinweise:

- `setup` konfiguriert den Gmail-Watch sowie den OpenClaw-seitigen Push-Pfad.
- `run` startet den lokalen Gmail-Watcher/Erneuerungs-Loop mit optionalen Laufzeitüberschreibungen.

### `dns`

DNS-Helfer für Weitbereichserkennung (CoreDNS + Tailscale). Aktuell integrierte Oberfläche:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

DNS-Helfer für Weitbereichserkennung (CoreDNS + Tailscale). Siehe [/gateway/discovery](/de/gateway/discovery).

Optionen:

- `--domain <domain>`
- `--apply`: CoreDNS-Konfiguration installieren/aktualisieren (erfordert sudo; nur macOS).

Hinweise:

- Ohne `--apply` ist dies ein Planungshilfsmittel, das die empfohlene OpenClaw- + Tailscale-DNS-Konfiguration ausgibt.
- `--apply` unterstützt derzeit nur macOS mit CoreDNS über Homebrew.

## Messaging + Agent

### `message`

Einheitliches ausgehendes Messaging + Kanalaktionen.

Siehe: [/cli/message](/de/cli/message)

Unterbefehle:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Beispiele:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Einen Agent-Durchlauf über das Gateway ausführen (oder eingebettet mit `--local`).

Übergeben Sie mindestens einen Sitzungsselektor: `--to`, `--session-id` oder `--agent`.

Erforderlich:

- `-m, --message <text>`

Optionen:

- `-t, --to <dest>` (für Sitzungsschlüssel und optionale Zustellung)
- `--session-id <id>`
- `--agent <id>` (Agent-ID; überschreibt Routing-Bindings)
- `--thinking <level>` (wird gegen das Provider-Profil des ausgewählten Modells validiert)
- `--verbose <on|off>`
- `--channel <channel>` (Zustellkanal; weglassen, um den Kanal der Hauptsitzung zu verwenden)
- `--reply-to <target>` (Zustellziel-Override, getrennt vom Sitzungsrouting)
- `--reply-channel <channel>` (Zustellkanal-Override)
- `--reply-account <id>` (Override für Zustellkonto-ID)
- `--local` (eingebetteter Lauf; Plugin-Register wird trotzdem zuerst vorgeladen)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Hinweise:

- Der Gateway-Modus fällt auf den eingebetteten Agent zurück, wenn die Gateway-Anfrage fehlschlägt.
- `--local` lädt das Plugin-Register weiterhin vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle auch bei eingebetteten Läufen verfügbar bleiben.
- `--channel`, `--reply-channel` und `--reply-account` beeinflussen die Antwortzustellung, nicht das Routing.

### `agents`

Isolierte Agents verwalten (Workspaces + Auth + Routing).

`openclaw agents` ohne Unterbefehl auszuführen entspricht `openclaw agents list`.

#### `agents list`

Konfigurierte Agents auflisten.

Optionen:

- `--json`
- `--bindings`

#### `agents add [name]`

Einen neuen isolierten Agent hinzufügen. Führt den geführten Assistenten aus, sofern keine Flags (oder `--non-interactive`) übergeben werden; `--workspace` ist im nicht interaktiven Modus erforderlich.

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Binding-Spezifikationen verwenden `channel[:accountId]`. Wenn `accountId` weggelassen wird, kann OpenClaw den Kontobereich über Kanalstandards/Plugin-Hooks auflösen; andernfalls ist es ein Kanal-Binding ohne expliziten Kontobereich.
Das Übergeben expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad. `main` ist reserviert und kann nicht als neue Agent-ID verwendet werden.

#### `agents bindings`

Routing-Bindings auflisten.

Optionen:

- `--agent <id>`
- `--json`

#### `agents bind`

Routing-Bindings für einen Agent hinzufügen.

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

#### `agents unbind`

Routing-Bindings für einen Agent entfernen.

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--all`
- `--json`

Verwenden Sie entweder `--all` oder `--bind`, nicht beides.

#### `agents delete <id>`

Einen Agent löschen und seinen Workspace + Status bereinigen.

Optionen:

- `--force`
- `--json`

Hinweise:

- `main` kann nicht gelöscht werden.
- Ohne `--force` ist eine interaktive Bestätigung erforderlich.

#### `agents set-identity`

Eine Agent-Identität aktualisieren (Name/Theme/Emoji/Avatar).

Optionen:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Hinweise:

- `--agent` oder `--workspace` kann verwendet werden, um den Ziel-Agent auszuwählen.
- Wenn keine expliziten Identitätsfelder angegeben werden, liest der Befehl `IDENTITY.md`.

### `acp`

Die ACP-Bridge ausführen, die IDEs mit dem Gateway verbindet.

Root-Optionen:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

Interaktiver ACP-Client zum Debuggen der Bridge.

Optionen:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Siehe [`acp`](/de/cli/acp) für vollständiges Verhalten, Sicherheitshinweise und Beispiele.

### `mcp`

Gespeicherte MCP-Serverdefinitionen verwalten und OpenClaw-Kanäle über MCP stdio bereitstellen.

#### `mcp serve`

Geroutete OpenClaw-Kanalunterhaltungen über MCP stdio bereitstellen.

Optionen:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Gespeicherte MCP-Serverdefinitionen auflisten.

Optionen:

- `--json`

#### `mcp show [name]`

Eine gespeicherte MCP-Serverdefinition oder das vollständige gespeicherte MCP-Serverobjekt anzeigen.

Optionen:

- `--json`

#### `mcp set <name> <value>`

Eine MCP-Serverdefinition aus einem JSON-Objekt speichern.

#### `mcp unset <name>`

Eine gespeicherte MCP-Serverdefinition entfernen.

### `approvals`

`exec`-Genehmigungen verwalten. Alias: `exec-approvals`.

#### `approvals get`

Den Snapshot der `exec`-Genehmigungen und die wirksame Richtlinie abrufen.

Optionen:

- `--node <node>`
- `--gateway`
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

#### `approvals set`

`exec`-Genehmigungen durch JSON aus einer Datei oder stdin ersetzen.

Optionen:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

#### `approvals allowlist add|remove`

Die agent-spezifische `exec`-Allowlist bearbeiten.

Optionen:

- `--node <node>`
- `--gateway`
- `--agent <id>` (Standard `*`)
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

### `status`

Verknüpfte Sitzungsintegrität und aktuelle Empfänger anzeigen.

Optionen:

- `--json`
- `--all` (vollständige Diagnose; schreibgeschützt, zum Einfügen geeignet)
- `--deep` (das Gateway um eine Live-Integritätsprüfung bitten, einschließlich Kanalprüfungen, sofern unterstützt)
- `--usage` (Nutzung/Kontingent von Modell-Providern anzeigen)
- `--timeout <ms>`
- `--verbose`
- `--debug` (Alias für `--verbose`)

Hinweise:

- Die Übersicht umfasst, falls verfügbar, den Status des Gateway + Node-Host-Service.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.

### Nutzungsverfolgung

OpenClaw kann Provider-Nutzung/-Kontingent anzeigen, wenn OAuth-/API-Anmeldedaten verfügbar sind.

Oberflächen:

- `/status` (fügt, wenn verfügbar, eine kurze Zeile zur Provider-Nutzung hinzu)
- `openclaw status --usage` (gibt die vollständige Provider-Aufschlüsselung aus)
- macOS-Menüleiste (Abschnitt „Usage“ unter „Context“)

Hinweise:

- Die Daten stammen direkt von den Nutzungsendpunkten der Provider (keine Schätzungen).
- Menschenlesbare Ausgaben werden providerübergreifend zu `X% left` normalisiert.
- Provider mit aktuellen Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Rohwerte `usage_percent` / `usagePercent` bedeuten verbleibendes Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben weiterhin Vorrang, wenn vorhanden. Antworten von `model_remains` bevorzugen den Eintrag des Chat-Modells, leiten bei Bedarf das Fensterlabel aus Zeitstempeln ab und schließen den Modellnamen in das Plan-Label ein.
- Die Nutzungs-Authentifizierung stammt, sofern verfügbar, aus providerspezifischen Hooks; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück. Wenn nichts aufgelöst werden kann, wird die Nutzung ausgeblendet.
- Details: siehe [Usage tracking](/de/concepts/usage-tracking).

### `health`

Integritätsstatus vom laufenden Gateway abrufen.

Optionen:

- `--json`
- `--timeout <ms>`
- `--verbose` (eine Live-Prüfung erzwingen und Details zur Gateway-Verbindung ausgeben)
- `--debug` (Alias für `--verbose`)

Hinweise:

- Standard-`health` kann einen aktuellen gecachten Gateway-Snapshot zurückgeben.
- `health --verbose` erzwingt eine Live-Prüfung und erweitert die menschenlesbare Ausgabe über alle konfigurierten Konten und Agents.

### `sessions`

Gespeicherte Unterhaltungssitzungen auflisten.

Optionen:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (Sitzungen nach Agent filtern)
- `--all-agents` (Sitzungen über alle Agents hinweg anzeigen)

Unterbefehle:

- `sessions cleanup` — abgelaufene oder verwaiste Sitzungen entfernen

Hinweise:

- `sessions cleanup` unterstützt auch `--fix-missing`, um Einträge zu bereinigen, deren Transkriptdateien fehlen.

## Zurücksetzen / Deinstallieren

### `reset`

Lokale Konfiguration/Status zurücksetzen (die CLI bleibt installiert).

Optionen:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Hinweise:

- `--non-interactive` erfordert `--scope` und `--yes`.

### `uninstall`

Den Gateway-Service + lokale Daten deinstallieren (die CLI bleibt erhalten).

Optionen:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Hinweise:

- `--non-interactive` erfordert `--yes` und explizite Bereiche (oder `--all`).
- `--all` entfernt Service, Status, Workspace und App zusammen.

### `tasks`

[Hintergrundaufgaben](/de/automation/tasks)-Läufe über Agents hinweg auflisten und verwalten.

- `tasks list` — aktive und aktuelle Aufgabenläufe anzeigen
- `tasks show <id>` — Details zu einem bestimmten Aufgabenlauf anzeigen
- `tasks notify <id>` — Benachrichtigungsrichtlinie für einen Aufgabenlauf ändern
- `tasks cancel <id>` — eine laufende Aufgabe abbrechen
- `tasks audit` — auf betriebliche Probleme aufmerksam machen (veraltet, verloren, Zustellfehler)
- `tasks maintenance [--apply] [--json]` — Vorschau oder Anwendung von Aufgaben- und TaskFlow-Bereinigung/Abgleich (ACP-/Subagent-Untergeordnetensitzungen, aktive Cron-Jobs, laufende CLI-Läufe)
- `tasks flow list` — aktive und aktuelle Task Flow-Flows auflisten
- `tasks flow show <lookup>` — einen Flow nach ID oder Lookup-Schlüssel prüfen
- `tasks flow cancel <lookup>` — einen laufenden Flow und seine aktiven Aufgaben abbrechen

### `flows`

Veraltete Doku-Verknüpfung. Flow-Befehle liegen unter `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Das WebSocket-Gateway ausführen.

Optionen:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (Dev-Konfiguration + Anmeldedaten + Sitzungen + Workspace zurücksetzen)
- `--force` (vorhandenen Listener auf dem Port beenden)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (Alias für `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Den Gateway-Service verwalten (launchd/systemd/schtasks).

Unterbefehle:

- `gateway status` (prüft standardmäßig das Gateway-RPC)
- `gateway install` (Service-Installation)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Hinweise:

- `gateway status` prüft standardmäßig das Gateway-RPC mithilfe des aufgelösten Ports/der aufgelösten Konfiguration des Service (überschreiben mit `--url/--token/--password`).
- `gateway status` unterstützt `--no-probe`, `--deep`, `--require-rpc` und `--json` für Skripting.
- `gateway status` zeigt außerdem veraltete oder zusätzliche Gateway-Services an, wenn sie erkannt werden können (`--deep` fügt systemweite Prüfungen hinzu). Profilbenannte OpenClaw-Services werden als vollwertig behandelt und nicht als „zusätzlich“ markiert.
- `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- `gateway status` gibt den aufgelösten Dateilog-Pfad, den Snapshot der CLI-gegen-Service-Konfigurationspfade/-Gültigkeit und die aufgelöste URL des Prüfziels aus.
- Wenn Gateway-Auth-SecretRefs im aktuellen Befehlspfad nicht aufgelöst sind, meldet `gateway status --json` `rpc.authWarning` nur dann, wenn Prüfverbindung/-auth fehlschlägt (Warnungen werden unterdrückt, wenn die Prüfung erfolgreich ist).
- Bei Linux-systemd-Installationen umfassen Prüfungen auf Status-Token-Drift sowohl Unit-Quellen `Environment=` als auch `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` unterstützen `--json` für Skripting (die Standardausgabe bleibt menschenfreundlich).
- `gateway install` verwendet standardmäßig die Node-Laufzeitumgebung; bun wird **nicht empfohlen** (WhatsApp-/Telegram-Bugs).
- Optionen für `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Veralteter Alias für die Serviceverwaltungsbefehle des Gateway. Siehe [/cli/daemon](/de/cli/daemon).

Unterbefehle:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Häufige Optionen:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Gateway-Dateilogs per RPC verfolgen.

Optionen:

- `--limit <n>`: Maximale Anzahl der zurückzugebenden Logzeilen
- `--max-bytes <n>`: Maximale Bytes, die aus der Logdatei gelesen werden
- `--follow`: Der Logdatei folgen (`tail -f`-Stil)
- `--interval <ms>`: Polling-Intervall in ms beim Folgen
- `--local-time`: Zeitstempel in lokaler Zeit anzeigen
- `--json`: Zeilengetrenntes JSON ausgeben
- `--plain`: Strukturierte Formatierung deaktivieren
- `--no-color`: ANSI-Farben deaktivieren
- `--url <url>`: Explizite Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Gateway-RPC-Timeout
- `--expect-final`: Bei Bedarf auf eine endgültige Antwort warten

Beispiele:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Hinweise:

- Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungs-Anmeldedaten nicht automatisch an.
- Pairing-Fehler bei local loopback fallen auf die konfigurierte lokale Logdatei zurück; explizite `--url`-Ziele tun das nicht.

### `gateway <subcommand>`

Gateway-CLI-Helfer (verwenden Sie `--url`, `--token`, `--password`, `--timeout`, `--expect-final` für RPC-Unterbefehle).
Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungs-Anmeldedaten nicht automatisch an.
Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.

Unterbefehle:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Hinweise:

- `gateway status --deep` fügt eine systemweite Service-Prüfung hinzu. Verwenden Sie `gateway probe`,
  `health --verbose` oder das Top-Level-`status --deep` für detailliertere Laufzeit-Prüfdetails.

Häufige RPCs:

- `config.schema.lookup` (einen Konfigurationsunterbaum mit einem flachen Schemanknoten, abgeglichenen Hint-Metadaten und Zusammenfassungen unmittelbarer untergeordneter Elemente prüfen)
- `config.get` (aktuellen Konfigurations-Snapshot + Hash lesen)
- `config.set` (vollständige Konfiguration validieren + schreiben; verwenden Sie `baseHash` für optimistische Nebenläufigkeit)
- `config.apply` (Konfiguration validieren + schreiben + neu starten + wecken)
- `config.patch` (ein partielles Update zusammenführen + neu starten + wecken)
- `update.run` (Update ausführen + neu starten + wecken)

Tipp: Wenn Sie `config.set`/`config.apply`/`config.patch` direkt aufrufen, übergeben Sie `baseHash` aus
`config.get`, wenn bereits eine Konfiguration existiert.
Tipp: Für partielle Änderungen prüfen Sie zuerst mit `config.schema.lookup` und bevorzugen `config.patch`.
Tipp: Diese RPCs zum Schreiben von Konfigurationen führen vorab eine Auflösungsprüfung aktiver SecretRefs für Referenzen in der übermittelten Konfigurations-Payload durch und lehnen Schreibvorgänge ab, wenn eine effektiv aktive übermittelte Referenz nicht aufgelöst ist.
Tipp: Das nur für Eigentümer verfügbare Laufzeit-Tool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` oder `tools.exec.security`; veraltete `tools.bash.*`-Aliasse werden auf dieselben geschützten `exec`-Pfade normalisiert.

## Modelle

Siehe [/concepts/models](/de/concepts/models) für Fallback-Verhalten und Scan-Strategie.

Anthropic-Hinweis: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung im Stil der OpenClaw-Claude-CLI
wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude-CLI und die Nutzung von `claude -p`
für diese Integration erneut als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Für
Produktion sollten Sie einen Anthropic-API-Key oder einen anderen unterstützten
abonnementartigen Provider wie OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan oder Z.AI / GLM Coding Plan bevorzugen.

Anthropic `setup-token` bleibt als unterstützter tokenbasierter Auth-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude-CLI und `claude -p`, wenn verfügbar.

### `models` (Root)

`openclaw models` ist ein Alias für `models status`.

Root-Optionen:

- `--status-json` (Alias für `models status --json`)
- `--status-plain` (Alias für `models status --plain`)

### `models list`

Optionen:

- `--all`
- `--local`
- `--provider <id>`
- `--json`
- `--plain`

`--all` schließt statische Katalogzeilen ein, die gebündelten Provider gehören, bevor die Authentifizierung
konfiguriert ist. Zeilen bleiben nicht verfügbar, bis passende Provider-Anmeldedaten vorhanden sind.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierter Auth-Profile)
- `--probe-provider <name>`
- `--probe-profile <id>` (wiederholbar oder kommagetrennt)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Enthält immer die Auth-Übersicht und den OAuth-Ablaufstatus für Profile im Auth-Store.
`--probe` führt Live-Anfragen aus (kann Tokens verbrauchen und Rate-Limits auslösen).
Prüfzeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
Zu erwartende Prüfstatus sind `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` und `no_model`.
Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung
`excluded_by_auth_order`, statt dieses Profil stillschweigend zu versuchen.

### `models set <model>`

`agents.defaults.model.primary` setzen.

### `models set-image <model>`

`agents.defaults.imageModel.primary` setzen.

### `models aliases list|add|remove`

Optionen:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Optionen:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Optionen:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Optionen:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

Optionen:

- `add`: interaktiver Auth-Helfer (Provider-Auth-Flow oder Token einfügen)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: GitHub-Copilot-OAuth-Login-Flow (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Hinweise:

- `setup-token` und `paste-token` sind generische Token-Befehle für Provider, die tokenbasierte Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die tokenbasierte Auth-Methode des Providers aus.
- `paste-token` fordert zur Eingabe des Token-Werts auf und verwendet standardmäßig die Auth-Profil-ID `<provider>:manual`, wenn `--profile-id` weggelassen wird.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude-CLI und `claude -p`, wenn verfügbar.

### `models auth order get|set|clear`

Optionen:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Ein Systemereignis in die Warteschlange stellen und optional einen Heartbeat auslösen (Gateway-RPC).

Erforderlich:

- `--text <text>`

Optionen:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Heartbeat-Steuerung (Gateway-RPC).

Optionen:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

System-Presence-Einträge auflisten (Gateway-RPC).

Optionen:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Geplante Jobs verwalten (Gateway-RPC). Siehe [/automation/cron-jobs](/de/automation/cron-jobs).

Unterbefehle:

- `cron status [--json]`
- `cron list [--all] [--json]` (standardmäßig Tabellenausgabe; für Rohdaten `--json` verwenden)
- `cron add` (Alias: `create`; erfordert `--name` und genau eines von `--at` | `--every` | `--cron` sowie genau eine Payload aus `--system-event` | `--message`)
- `cron edit <id>` (Felder patchen)
- `cron rm <id>` (Aliasse: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Alle `cron`-Befehle akzeptieren `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` verwendet dieses ausgewählte zugelassene Modell für den Job. Wenn
das Modell nicht zugelassen ist, warnt Cron und greift stattdessen auf die Modellwahl des Agent/Standardmodells
des Jobs zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches
Modell-Override ohne explizite Fallback-Liste pro Job hängt das primäre Modell des
Agent nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

## Node-Host

### `node`

`node` führt einen **headless Node-Host** aus oder verwaltet ihn als Hintergrunddienst. Siehe
[`openclaw node`](/de/cli/node).

Unterbefehle:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Auth-Hinweise:

- `node` löst Gateway-Authentifizierung aus Umgebung/Konfiguration auf (keine Flags `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, dann `gateway.auth.*`. Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.*`; bei `gateway.mode=remote` beteiligt sich `gateway.remote.*` gemäß den Vorrangregeln für Remote.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur Umgebungsvariablen `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` spricht mit dem Gateway und adressiert gepaarte Nodes. Siehe [/nodes](/de/nodes).

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--json`

Unterbefehle:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (nur Mac)

Kamera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + Bildschirm:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Standort:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

Browser-Steuerungs-CLI (dediziertes Chrome/Brave/Edge/Chromium). Siehe [`openclaw browser`](/de/cli/browser) und das [Browser-Tool](/de/tools/browser).

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Verwalten:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

Prüfen:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Aktionen:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Sprachanruf

### `voicecall`

Vom Plugin bereitgestellte Hilfsprogramme für Sprachanrufe. Erscheint nur, wenn das Plugin für Sprachanrufe installiert und aktiviert ist. Siehe [`openclaw voicecall`](/de/cli/voicecall).

Häufige Befehle:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Doku-Suche

### `docs`

Den Live-Dokuindex von OpenClaw durchsuchen.

### `docs [query...]`

Den Live-Dokuindex durchsuchen.

## TUI

### `tui`

Die Terminal-UI öffnen, die mit dem Gateway verbunden ist.

Optionen:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (Standard ist `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
