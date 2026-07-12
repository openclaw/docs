---
read_when:
    - Trouver la bonne sous-commande `openclaw`
    - Recherche des options globales ou des règles de mise en forme de la sortie
summary: 'Index de la CLI OpenClaw : liste des commandes, options globales et liens vers les pages de chaque commande'
title: Référence de la CLI
x-i18n:
    generated_at: "2026-07-12T02:30:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` est le point d’entrée principal de la CLI. Chaque commande principale dispose d’une
page de référence dédiée ou est documentée avec la commande dont elle est l’alias ; cet index répertorie
les commandes, les options globales et les règles de mise en forme de la sortie qui s’appliquent à l’ensemble de la CLI.

Commandes de configuration selon l’objectif :

- `openclaw setup` et `openclaw onboard` vérifient d’abord l’inférence, puis démarrent Crestodian pour configurer le Gateway, l’espace de travail, les canaux, les Skills et l’état de santé.
- `openclaw setup --baseline` crée la configuration de référence et l’espace de travail sans suivre le processus guidé d’intégration.
- `openclaw configure` modifie des parties ciblées d’une configuration existante : authentification du modèle, Gateway, canaux, plugins ou Skills.
- `openclaw channels add` configure les comptes de canaux une fois la configuration de référence créée ; exécutez cette commande sans option pour une configuration guidée, ou avec des options propres au canal pour les scripts.

## Pages des commandes

| Domaine                         | Commandes                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration et intégration         | [`crestodian`](/fr/cli/crestodian) · [`setup`](/fr/cli/setup) · [`onboard`](/fr/cli/onboard) · [`configure`](/fr/cli/configure) · [`config`](/fr/cli/config) · [`completion`](/fr/cli/completion) · [`doctor`](/fr/cli/doctor) · [`dashboard`](/fr/cli/dashboard) |
| Réinitialisation, sauvegarde et migration | [`backup`](/fr/cli/backup) · [`migrate`](/fr/cli/migrate) · [`reset`](/fr/cli/reset) · [`uninstall`](/fr/cli/uninstall) · [`update`](/fr/cli/update)                                                                                                     |
| Messagerie et agents         | [`message`](/fr/cli/message) · [`agent`](/fr/cli/agent) · [`agents`](/fr/cli/agents) · [`attach`](/fr/cli/attach) · [`acp`](/fr/cli/acp) · [`mcp`](/fr/cli/mcp)                                                                                             |
| État de santé et sessions          | [`status`](/fr/cli/status) · [`health`](/fr/cli/health) · [`sessions`](/fr/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway et journaux             | [`gateway`](/fr/cli/gateway) · [`logs`](/fr/cli/logs) · [`system`](/fr/cli/system)                                                                                                                                                                 |
| Modèles et inférence         | [`models`](/fr/cli/models) · [`promos`](/fr/cli/promos) · [`infer`](/fr/cli/infer) · `capability` (alias de [`infer`](/fr/cli/infer)) · [`memory`](/fr/cli/memory) · [`commitments`](/fr/cli/commitments) · [`wiki`](/fr/cli/wiki)                            |
| Réseau et nœuds            | [`directory`](/fr/cli/directory) · [`nodes`](/fr/cli/nodes) · [`devices`](/fr/cli/devices) · [`node`](/fr/cli/node)                                                                                                                                   |
| Exécution et bac à sable          | [`approvals`](/fr/cli/approvals) · `exec-policy` (voir [`approvals`](/fr/cli/approvals)) · [`sandbox`](/fr/cli/sandbox) · [`tui`](/fr/cli/tui) · `chat`/`terminal` (alias de [`tui --local`](/fr/cli/tui)) · [`browser`](/fr/cli/browser)                 |
| Automatisation                   | [`cron`](/fr/cli/cron) · [`tasks`](/fr/cli/tasks) · [`hooks`](/fr/cli/hooks) · [`webhooks`](/fr/cli/webhooks) · [`transcripts`](/fr/cli/transcripts)                                                                                                     |
| Découverte et documentation           | [`dns`](/fr/cli/dns) · [`docs`](/fr/cli/docs)                                                                                                                                                                                                   |
| Appairage et canaux         | [`pairing`](/fr/cli/pairing) · [`qr`](/fr/cli/qr) · [`channels`](/fr/cli/channels)                                                                                                                                                                 |
| Sécurité et plugins         | [`security`](/fr/cli/security) · [`secrets`](/fr/cli/secrets) · [`skills`](/fr/cli/skills) · [`plugins`](/fr/cli/plugins) · [`proxy`](/fr/cli/proxy)                                                                                                     |
| Alias hérités               | [`daemon`](/fr/cli/daemon) (service Gateway) · [`clawbot`](/fr/cli/clawbot) (espace de noms)                                                                                                                                                         |
| Plugins (facultatifs)           | [`path`](/fr/cli/path) · [`policy`](/fr/cli/policy) · [`voicecall`](/fr/cli/voicecall) · [`workboard`](/fr/cli/workboard) (si installé)                                                                                                              |

## Options globales

| Option                    | Objectif                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Isole l’état sous `~/.openclaw-dev`, utilise par défaut le port 19001 pour le Gateway et décale les ports dérivés              |
| `--profile <name>`      | Isole l’état sous `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Exécute la CLI dans un conteneur Podman/Docker en cours d’exécution nommé `<name>` (valeur par défaut : variable d’environnement `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Remplace le niveau global de journalisation pour la sortie dans les fichiers et la console                                                 |
| `--no-color`            | Désactive les couleurs ANSI (`NO_COLOR=1` est également pris en compte)                                                    |
| `--update`              | Raccourci pour [`openclaw update`](/fr/cli/update) ; fonctionne aussi bien pour les extractions du code source que pour les installations de paquets    |
| `-V`, `--version`, `-v` | Affiche la version et quitte                                                                                  |

## Modes de sortie

- Les couleurs ANSI et les indicateurs de progression s’affichent uniquement dans les sessions TTY.
- Les hyperliens OSC-8 s’affichent sous forme de liens cliquables lorsque cela est pris en charge ; sinon, la
  CLI utilise des URL en texte brut.
- `--json` (et `--plain` lorsqu’il est pris en charge) désactive la mise en forme pour produire une sortie épurée.
- Les commandes de longue durée affichent un indicateur de progression (OSC 9;4 lorsque cela est pris en charge).

## Palette de couleurs

OpenClaw utilise une palette inspirée du homard pour la sortie de la CLI :

| Jeton          | Hexadécimal       | Utilisation                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Titres, libellés, mises en évidence principales |
| `accentBright` | `#FF7A3D` | Noms de commandes, emphase              |
| `accentDim`    | `#D14A22` | Texte de mise en évidence secondaire             |
| `info`         | `#FF8A5B` | Valeurs informatives                 |
| `success`      | `#2FBF71` | États de réussite                       |
| `warn`         | `#FFB020` | Avertissements, options, solutions de repli    |
| `error`        | `#E23D2D` | Erreurs, échecs                     |
| `muted`        | `#8B7F77` | Atténuation, métadonnées                |

Source de référence de la palette : `packages/terminal-core/src/palette.ts`.

## Arborescence des commandes

<Accordion title="Arborescence complète des commandes">

Cette carte couvre les commandes principales et leurs principales sous-commandes. Les sous-commandes ajoutées par les plugins
(par exemple sous `skills`, `plugins` et `wiki`) évoluent
indépendamment ; exécutez `<command> --help` pour obtenir la liste actuelle faisant autorité.

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

Les Plugins peuvent ajouter des commandes principales supplémentaires, telles que
[`openclaw workboard`](/fr/cli/workboard) ou `openclaw voicecall`.

</Accordion>

## Commandes obliques de chat

Les messages de chat prennent en charge les commandes `/...`. Consultez [Commandes obliques](/fr/tools/slash-commands).

Points clés :

- `/status` - diagnostics rapides.
- `/trace` - lignes de traçage et de débogage du Plugin limitées à la session.
- `/config` - modifications persistantes de la configuration.
- `/debug` - substitutions de configuration limitées à l’exécution (en mémoire, pas sur disque ; nécessite `commands.debug: true`).

## Suivi de l’utilisation

`openclaw status --usage` et l’interface de contrôle affichent l’utilisation et le quota du fournisseur lorsque
des identifiants OAuth/API sont disponibles. Les données proviennent directement des points de terminaison
d’utilisation des fournisseurs et sont normalisées sous la forme `X% left`. Fournisseurs disposant actuellement
de fenêtres d’utilisation : Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi et z.ai.

Consultez [Suivi de l’utilisation](/fr/concepts/usage-tracking) pour plus de détails.

## Voir aussi

- [Commandes obliques](/fr/tools/slash-commands)
- [Configuration](/fr/gateway/configuration)
- [Environnement](/fr/help/environment)
