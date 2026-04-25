---
read_when:
    - Trouver la bonne sous-commande `openclaw`
    - Rechercher des options globales ou des règles de style de sortie
summary: 'Index de la CLI OpenClaw : liste des commandes, options globales et liens vers les pages de chaque commande'
title: Référence CLI
x-i18n:
    generated_at: "2026-04-25T13:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8a61396b8ec7f57d15988d40b09f90458745bbb29e90bd387134aa032214853
    source_path: cli/index.md
    workflow: 15
---

`openclaw` est le point d’entrée principal de la CLI. Chaque commande principale possède soit une
page de référence dédiée, soit une documentation avec la commande dont elle est un alias ; cet
index répertorie les commandes, les options globales et les règles de style de sortie qui
s’appliquent à l’ensemble de la CLI.

## Pages de commande

| Domaine              | Commandes                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Configuration et onboarding | [`crestodian`](/fr/cli/crestodian) · [`setup`](/fr/cli/setup) · [`onboard`](/fr/cli/onboard) · [`configure`](/fr/cli/configure) · [`config`](/fr/cli/config) · [`completion`](/fr/cli/completion) · [`doctor`](/fr/cli/doctor) · [`dashboard`](/fr/cli/dashboard) |
| Réinitialisation et désinstallation | [`backup`](/fr/cli/backup) · [`reset`](/fr/cli/reset) · [`uninstall`](/fr/cli/uninstall) · [`update`](/fr/cli/update)                                                                                                                                 |
| Messagerie et agents | [`message`](/fr/cli/message) · [`agent`](/fr/cli/agent) · [`agents`](/fr/cli/agents) · [`acp`](/fr/cli/acp) · [`mcp`](/fr/cli/mcp)                                                                                                                       |
| Santé et sessions    | [`status`](/fr/cli/status) · [`health`](/fr/cli/health) · [`sessions`](/fr/cli/sessions)                                                                                                                                                           |
| Gateway et journaux  | [`gateway`](/fr/cli/gateway) · [`logs`](/fr/cli/logs) · [`system`](/fr/cli/system)                                                                                                                                                                 |
| Modèles et inférence | [`models`](/fr/cli/models) · [`infer`](/fr/cli/infer) · `capability` (alias de [`infer`](/fr/cli/infer)) · [`memory`](/fr/cli/memory) · [`wiki`](/fr/cli/wiki)                                                                                          |
| Réseau et nodes      | [`directory`](/fr/cli/directory) · [`nodes`](/fr/cli/nodes) · [`devices`](/fr/cli/devices) · [`node`](/fr/cli/node)                                                                                                                                   |
| Runtime et sandbox   | [`approvals`](/fr/cli/approvals) · `exec-policy` (voir [`approvals`](/fr/cli/approvals)) · [`sandbox`](/fr/cli/sandbox) · [`tui`](/fr/cli/tui) · `chat`/`terminal` (alias de [`tui --local`](/fr/cli/tui)) · [`browser`](/fr/cli/browser)                 |
| Automatisation       | [`cron`](/fr/cli/cron) · [`tasks`](/fr/cli/tasks) · [`hooks`](/fr/cli/hooks) · [`webhooks`](/fr/cli/webhooks)                                                                                                                                         |
| Découverte et docs   | [`dns`](/fr/cli/dns) · [`docs`](/fr/cli/docs)                                                                                                                                                                                                    |
| Appairage et canaux  | [`pairing`](/fr/cli/pairing) · [`qr`](/fr/cli/qr) · [`channels`](/fr/cli/channels)                                                                                                                                                                 |
| Sécurité et plugins  | [`security`](/fr/cli/security) · [`secrets`](/fr/cli/secrets) · [`skills`](/fr/cli/skills) · [`plugins`](/fr/cli/plugins) · [`proxy`](/fr/cli/proxy)                                                                                                     |
| Alias hérités        | [`daemon`](/fr/cli/daemon) (service gateway) · [`clawbot`](/fr/cli/clawbot) (espace de noms)                                                                                                                                                    |
| Plugins (facultatif) | [`voicecall`](/fr/cli/voicecall) (si installé)                                                                                                                                                                                                |

## Options globales

| Option                  | Objectif                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Isoler l’état sous `~/.openclaw-dev` et décaler les ports par défaut  |
| `--profile <name>`      | Isoler l’état sous `~/.openclaw-<name>`                               |
| `--container <name>`    | Cibler un conteneur nommé pour l’exécution                            |
| `--no-color`            | Désactiver les couleurs ANSI (`NO_COLOR=1` est également respecté)    |
| `--update`              | Raccourci pour [`openclaw update`](/fr/cli/update) (installations source uniquement) |
| `-V`, `--version`, `-v` | Afficher la version et quitter                                        |

## Modes de sortie

- Les couleurs ANSI et les indicateurs de progression ne s’affichent que dans les sessions TTY.
- Les hyperliens OSC-8 s’affichent comme liens cliquables lorsque pris en charge ; sinon, la
  CLI revient à des URL en clair.
- `--json` (et `--plain` lorsque pris en charge) désactive le style pour une sortie propre.
- Les commandes longues affichent un indicateur de progression (OSC 9;4 lorsque pris en charge).

Source de vérité de la palette : `src/terminal/palette.ts`.

## Arborescence des commandes

<Accordion title="Arborescence complète des commandes">

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

Les plugins peuvent ajouter des commandes supplémentaires de premier niveau (par exemple `openclaw voicecall`).

</Accordion>

## Commandes slash du chat

Les messages de chat prennent en charge les commandes `/...`. Voir [commandes slash](/fr/tools/slash-commands).

Points clés :

- `/status` — diagnostics rapides.
- `/trace` — lignes de trace/débogage de Plugin limitées à la session.
- `/config` — modifications de configuration persistées.
- `/debug` — remplacements de configuration à l’exécution uniquement (en mémoire, pas sur disque ; nécessite `commands.debug: true`).

## Suivi d’utilisation

`openclaw status --usage` et l’UI de contrôle affichent l’utilisation/le quota des fournisseurs lorsque
des identifiants OAuth/API sont disponibles. Les données proviennent directement des endpoints
d’utilisation des fournisseurs et sont normalisées en `X% left`. Fournisseurs avec fenêtres
d’utilisation actuelles : Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi et z.ai.

Voir [Suivi d’utilisation](/fr/concepts/usage-tracking) pour plus de détails.

## Connexes

- [Commandes slash](/fr/tools/slash-commands)
- [Configuration](/fr/gateway/configuration)
- [Environnement](/fr/help/environment)
