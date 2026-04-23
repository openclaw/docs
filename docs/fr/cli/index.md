---
read_when:
    - Ajouter ou modifier des commandes ou options CLI
    - Documenter de nouvelles surfaces de commande
summary: Référence de la CLI OpenClaw pour les commandes, sous-commandes et options `openclaw`
title: Référence de la CLI
x-i18n:
    generated_at: "2026-04-23T07:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e5d3de831331307203ac6f67a3f4b4c969c4ccc10e813ebab1e052b87f0426b
    source_path: cli/index.md
    workflow: 15
---

# Référence de la CLI

Cette page décrit le comportement actuel de la CLI. Si les commandes changent, mettez à jour cette documentation.

## Pages de commande

- [`setup`](/fr/cli/setup)
- [`onboard`](/fr/cli/onboard)
- [`configure`](/fr/cli/configure)
- [`config`](/fr/cli/config)
- [`completion`](/fr/cli/completion)
- [`doctor`](/fr/cli/doctor)
- [`dashboard`](/fr/cli/dashboard)
- [`backup`](/fr/cli/backup)
- [`reset`](/fr/cli/reset)
- [`uninstall`](/fr/cli/uninstall)
- [`update`](/fr/cli/update)
- [`message`](/fr/cli/message)
- [`agent`](/fr/cli/agent)
- [`agents`](/fr/cli/agents)
- [`acp`](/fr/cli/acp)
- [`mcp`](/fr/cli/mcp)
- [`status`](/fr/cli/status)
- [`health`](/fr/cli/health)
- [`sessions`](/fr/cli/sessions)
- [`gateway`](/fr/cli/gateway)
- [`logs`](/fr/cli/logs)
- [`system`](/fr/cli/system)
- [`models`](/fr/cli/models)
- [`infer`](/fr/cli/infer)
- [`memory`](/fr/cli/memory)
- [`wiki`](/fr/cli/wiki)
- [`directory`](/fr/cli/directory)
- [`nodes`](/fr/cli/nodes)
- [`devices`](/fr/cli/devices)
- [`node`](/fr/cli/node)
- [`approvals`](/fr/cli/approvals)
- [`sandbox`](/fr/cli/sandbox)
- [`tui`](/fr/cli/tui)
- [`browser`](/fr/cli/browser)
- [`cron`](/fr/cli/cron)
- [`tasks`](/fr/cli/tasks)
- [`flows`](/fr/cli/flows)
- [`dns`](/fr/cli/dns)
- [`docs`](/fr/cli/docs)
- [`hooks`](/fr/cli/hooks)
- [`webhooks`](/fr/cli/webhooks)
- [`pairing`](/fr/cli/pairing)
- [`qr`](/fr/cli/qr)
- [`plugins`](/fr/cli/plugins) (commandes de Plugin)
- [`channels`](/fr/cli/channels)
- [`security`](/fr/cli/security)
- [`secrets`](/fr/cli/secrets)
- [`skills`](/fr/cli/skills)
- [`daemon`](/fr/cli/daemon) (alias hérité pour les commandes du service gateway)
- [`clawbot`](/fr/cli/clawbot) (espace de noms d’alias hérité)
- [`voicecall`](/fr/cli/voicecall) (Plugin ; si installé)

## Indicateurs globaux

- `--dev` : isole l’état sous `~/.openclaw-dev` et décale les ports par défaut.
- `--profile <name>` : isole l’état sous `~/.openclaw-<name>`.
- `--container <name>` : cible un conteneur nommé pour l’exécution.
- `--no-color` : désactive les couleurs ANSI.
- `--update` : raccourci pour `openclaw update` (installations depuis les sources uniquement).
- `-V`, `--version`, `-v` : affiche la version puis quitte.

## Style de sortie

- Les couleurs ANSI et les indicateurs de progression ne s’affichent que dans les sessions TTY.
- Les hyperliens OSC-8 s’affichent comme liens cliquables dans les terminaux pris en charge ; sinon nous revenons à des URL en clair.
- `--json` (et `--plain` lorsque pris en charge) désactive le style pour une sortie propre.
- `--no-color` désactive le style ANSI ; `NO_COLOR=1` est également pris en compte.
- Les commandes de longue durée affichent un indicateur de progression (OSC 9;4 lorsque pris en charge).

## Palette de couleurs

OpenClaw utilise une palette « homard » pour la sortie CLI.

- `accent` (#FF5A2D) : titres, libellés, mises en évidence principales.
- `accentBright` (#FF7A3D) : noms de commandes, emphase.
- `accentDim` (#D14A22) : texte secondaire mis en évidence.
- `info` (#FF8A5B) : valeurs informatives.
- `success` (#2FBF71) : états de réussite.
- `warn` (#FFB020) : avertissements, replis, éléments demandant de l’attention.
- `error` (#E23D2D) : erreurs, échecs.
- `muted` (#8B7F77) : atténuation, métadonnées.

Source de vérité de la palette : `src/terminal/palette.ts` (la « palette homard »).

## Arborescence des commandes

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
  infer (alias : capability)
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

Remarque : les plugins peuvent ajouter des commandes de premier niveau supplémentaires (par exemple `openclaw voicecall`).

## Sécurité

- `openclaw security audit` — auditer la configuration + l’état local à la recherche de pièges de sécurité courants.
- `openclaw security audit --deep` — sonde live de la Gateway en mode best-effort.
- `openclaw security audit --fix` — renforce les valeurs par défaut sûres et les permissions d’état/configuration.

## Secrets

### `secrets`

Gérez les SecretRefs et l’hygiène d’exécution/configuration associée.

Sous-commandes :

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Options de `secrets reload` :

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Options de `secrets audit` :

- `--check`
- `--allow-exec`
- `--json`

Options de `secrets configure` :

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Options de `secrets apply --from <path>` :

- `--dry-run`
- `--allow-exec`
- `--json`

Remarques :

- `reload` est une RPC Gateway et conserve le dernier instantané d’exécution valide connu lorsque la résolution échoue.
- `audit --check` renvoie une valeur non nulle en cas de constatations ; les références non résolues utilisent un code de sortie non nul de priorité plus élevée.
- Les vérifications d’exécution en dry-run sont ignorées par défaut ; utilisez `--allow-exec` pour les activer.

## Plugins

Gérez les plugins et leur configuration :

- `openclaw plugins list` — découvre les plugins (utilisez `--json` pour une sortie exploitable par machine).
- `openclaw plugins inspect <id>` — affiche les détails d’un Plugin (`info` est un alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — installe un Plugin (ou ajoute un chemin de Plugin à `plugins.load.paths` ; utilisez `--force` pour écraser une cible d’installation existante).
- `openclaw plugins marketplace list <marketplace>` — liste les entrées du marketplace avant installation.
- `openclaw plugins enable <id>` / `disable <id>` — bascule `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — signale les erreurs de chargement des plugins.

La plupart des changements de Plugin nécessitent un redémarrage de la gateway. Voir [/plugin](/fr/tools/plugin).

## Memory

Recherche vectorielle sur `MEMORY.md` + `memory/*.md` :

- `openclaw memory status` — affiche les statistiques d’index ; utilisez `--deep` pour les vérifications de préparation des vecteurs + embeddings ou `--fix` pour réparer les artefacts obsolètes de rappel/promotion.
- `openclaw memory index` — réindexe les fichiers de mémoire.
- `openclaw memory search "<query>"` (ou `--query "<query>"`) — recherche sémantique dans la mémoire.
- `openclaw memory promote` — classe les rappels à court terme et peut éventuellement ajouter les meilleures entrées dans `MEMORY.md`.

## Sandbox

Gérez les environnements sandbox pour l’exécution isolée des agents. Voir [/cli/sandbox](/fr/cli/sandbox).

Sous-commandes :

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Remarques :

- `sandbox recreate` supprime les environnements existants afin que leur prochaine utilisation les réamorce avec la configuration actuelle.
- Pour les backends `ssh` et `remote` OpenShell, recreate supprime l’espace de travail distant canonique pour la portée sélectionnée.

## Commandes slash de chat

Les messages de chat prennent en charge les commandes `/...` (texte et natives). Voir [/tools/slash-commands](/fr/tools/slash-commands).

Points importants :

- `/status` pour des diagnostics rapides.
- `/trace` pour les lignes de trace/debug de Plugin limitées à la session.
- `/config` pour les changements de configuration persistés.
- `/debug` pour les remplacements de configuration uniquement à l’exécution (en mémoire, pas sur disque ; nécessite `commands.debug: true`).

## Configuration initiale + onboarding

### `completion`

Générez des scripts de complétion shell et installez-les éventuellement dans votre profil shell.

Options :

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Remarques :

- Sans `--install` ni `--write-state`, `completion` affiche le script sur stdout.
- `--install` écrit un bloc `OpenClaw Completion` dans votre profil shell et le fait pointer vers le script en cache sous le répertoire d’état OpenClaw.

### `setup`

Initialise la configuration + l’espace de travail.

Options :

- `--workspace <dir>` : chemin de l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).
- `--wizard` : exécute l’onboarding.
- `--non-interactive` : exécute l’onboarding sans invites.
- `--mode <local|remote>` : mode d’onboarding.
- `--remote-url <url>` : URL Gateway distante.
- `--remote-token <token>` : jeton Gateway distant.

L’onboarding s’exécute automatiquement dès qu’un indicateur d’onboarding est présent (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interactif pour la gateway, l’espace de travail et les Skills.

Options :

- `--workspace <dir>`
- `--reset` (réinitialiser config + identifiants + sessions avant l’onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (par défaut `config+creds+sessions` ; utilisez `full` pour supprimer aussi l’espace de travail)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` est un alias de `advanced`)
- `--auth-choice <choice>` où `<choice>` est l’un des suivants :
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
- Remarque Qwen : `qwen-*` est la famille `auth-choice` canonique. Les ID `modelstudio-*`
  restent acceptés uniquement comme alias hérités de compatibilité.
- `--secret-input-mode <plaintext|ref>` (par défaut `plaintext` ; utilisez `ref` pour stocker les références d’environnement par défaut du fournisseur au lieu de clés en clair)
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
- `--custom-base-url <url>` (non interactif ; utilisé avec `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (non interactif ; utilisé avec `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (non interactif ; facultatif ; utilisé avec `--auth-choice custom-api-key` ; revient à `CUSTOM_API_KEY` par défaut s’il est omis)
- `--custom-provider-id <id>` (non interactif ; ID de fournisseur personnalisé facultatif)
- `--custom-compatibility <openai|anthropic>` (non interactif ; facultatif ; `openai` par défaut)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (non interactif ; stocke `gateway.auth.token` comme SecretRef d’environnement ; nécessite que cette variable d’environnement soit définie ; ne peut pas être combiné avec `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias : `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (gestionnaire Node pour setup/onboarding des Skills ; pnpm recommandé, bun également pris en charge)
- `--json`

### `configure`

Assistant de configuration interactif (modèles, canaux, Skills, Gateway).

Options :

- `--section <section>` (répétable ; limite l’assistant à des sections spécifiques)

### `config`

Assistants de configuration non interactifs (get/set/unset/file/schema/validate). Exécuter `openclaw config` sans
sous-commande lance l’assistant.

Sous-commandes :

- `config get <path>` : affiche une valeur de configuration (chemin dot/bracket).
- `config set` : prend en charge quatre modes d’affectation :
  - mode valeur : `config set <path> <value>` (analyse JSON5-ou-chaîne)
  - mode constructeur SecretRef : `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - mode constructeur de fournisseur : `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - mode lot : `config set --batch-json '<json>'` ou `config set --batch-file <path>`
- `config set --dry-run` : valide les affectations sans écrire `openclaw.json` (les vérifications SecretRef `exec` sont ignorées par défaut).
- `config set --allow-exec --dry-run` : active explicitement les vérifications dry-run de SecretRef `exec` (peut exécuter des commandes de fournisseur).
- `config set --dry-run --json` : émet une sortie dry-run lisible par machine (vérifications + signal de complétude, opérations, références vérifiées/ignorées, erreurs).
- `config set --strict-json` : exige une analyse JSON5 pour l’entrée chemin/valeur. `--json` reste un alias hérité pour l’analyse stricte hors mode de sortie dry-run.
- `config unset <path>` : supprime une valeur.
- `config file` : affiche le chemin du fichier de configuration actif.
- `config schema` : affiche le schéma JSON généré pour `openclaw.json`, y compris les métadonnées de documentation `title` / `description` propagées à travers les branches d’objet imbriqué, joker, élément de tableau et composition, ainsi que les métadonnées best-effort live de schéma de Plugin/canal.
- `config validate` : valide la configuration actuelle par rapport au schéma sans démarrer la Gateway.
- `config validate --json` : émet une sortie JSON lisible par machine.

### `doctor`

Vérifications d’état + correctifs rapides (configuration + Gateway + services hérités).

Options :

- `--no-workspace-suggestions` : désactive les conseils de mémoire d’espace de travail.
- `--yes` : accepte les valeurs par défaut sans invite (mode headless).
- `--non-interactive` : ignore les invites ; applique uniquement les migrations sûres.
- `--deep` : analyse les services système à la recherche d’installations Gateway supplémentaires.
- `--repair` (alias : `--fix`) : tente des réparations automatiques pour les problèmes détectés.
- `--force` : force les réparations même lorsqu’elles ne sont pas strictement nécessaires.
- `--generate-gateway-token` : génère un nouveau jeton d’authentification Gateway.

### `dashboard`

Ouvre l’interface de contrôle avec votre jeton actuel.

Options :

- `--no-open` : affiche l’URL sans lancer de navigateur

Remarques :

- Pour les jetons Gateway gérés par SecretRef, `dashboard` affiche ou ouvre une URL non tokenisée au lieu d’exposer le secret dans la sortie du terminal ou dans les arguments de lancement du navigateur.

### `update`

Met à jour la CLI installée.

Options racine :

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Sous-commandes :

- `update status`
- `update wizard`

Options de `update status` :

- `--json`
- `--timeout <seconds>`

Options de `update wizard` :

- `--timeout <seconds>`

Remarques :

- `openclaw --update` est réécrit en `openclaw update`.

### `backup`

Crée et vérifie des archives de sauvegarde locales pour l’état OpenClaw.

Sous-commandes :

- `backup create`
- `backup verify <archive>`

Options de `backup create` :

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Options de `backup verify <archive>` :

- `--json`

## Assistants de canal

### `channels`

Gérez les comptes de canaux de chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Microsoft Teams).

Sous-commandes :

- `channels list` : affiche les canaux configurés et les profils d’authentification.
- `channels status` : vérifie l’accessibilité de la gateway et l’état des canaux (`--probe` exécute des vérifications live de sonde/audit par compte lorsque la gateway est accessible ; sinon, la commande revient à des résumés de canaux basés uniquement sur la configuration. Utilisez `openclaw health` ou `openclaw status --deep` pour des sondes d’état plus larges de la gateway).
- Astuce : `channels status` affiche des avertissements avec des correctifs suggérés lorsqu’il peut détecter des erreurs de configuration courantes (puis vous renvoie vers `openclaw doctor`).
- `channels logs` : affiche les journaux récents des canaux depuis le fichier journal de la gateway.
- `channels add` : configuration de type assistant lorsqu’aucun indicateur n’est passé ; les indicateurs basculent en mode non interactif.
  - Lors de l’ajout d’un compte non par défaut à un canal utilisant encore une configuration de premier niveau à compte unique, OpenClaw promeut les valeurs à portée de compte dans la map de comptes du canal avant d’écrire le nouveau compte. La plupart des canaux utilisent `accounts.default` ; Matrix peut à la place conserver une cible nommée/par défaut existante correspondante.
  - Le mode non interactif de `channels add` ne crée/ne met pas à niveau pas automatiquement les liaisons ; les liaisons uniquement canal continuent de correspondre au compte par défaut.
- `channels remove` : désactive par défaut ; passez `--delete` pour supprimer les entrées de configuration sans invites.
- `channels login` : connexion interactive au canal (WhatsApp Web uniquement).
- `channels logout` : déconnecte une session de canal (si pris en charge).

Options communes :

- `--channel <name>` : `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>` : ID du compte de canal (par défaut `default`)
- `--name <label>` : nom d’affichage du compte

Options de `channels login` :

- `--channel <channel>` (par défaut `whatsapp` ; prend en charge `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Options de `channels logout` :

- `--channel <channel>` (par défaut `whatsapp`)
- `--account <id>`

Options de `channels list` :

- `--no-usage` : ignore les instantanés d’usage/quota du fournisseur de modèle (OAuth/sauvegardés par API uniquement).
- `--json` : sortie JSON (inclut l’usage sauf si `--no-usage` est défini).

Options de `channels status` :

- `--probe`
- `--timeout <ms>`
- `--json`

Options de `channels capabilities` :

- `--channel <name>`
- `--account <id>` (uniquement avec `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Options de `channels resolve` :

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Options de `channels logs` :

- `--channel <name|all>` (par défaut `all`)
- `--lines <n>` (par défaut `200`)
- `--json`

Remarques :

- `channels login` prend en charge `--verbose`.
- `channels capabilities --account` ne s’applique que lorsque `--channel` est défini.
- `channels status --probe` peut afficher l’état du transport ainsi que des résultats de sonde/audit tels que `works`, `probe failed`, `audit ok` ou `audit failed`, selon la prise en charge du canal.

Plus de détails : [/concepts/oauth](/fr/concepts/oauth)

Exemples :

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Recherchez vos propres ID, les ID de pairs et les ID de groupes pour les canaux qui exposent une surface d’annuaire. Voir [`openclaw directory`](/fr/cli/directory).

Options communes :

- `--channel <name>`
- `--account <id>`
- `--json`

Sous-commandes :

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Listez et inspectez les Skills disponibles ainsi que les informations d’état de préparation.

Sous-commandes :

- `skills search [query...]` : recherche des Skills ClawHub.
- `skills search --limit <n> --json` : limite les résultats de recherche ou émet une sortie lisible par machine.
- `skills install <slug>` : installe une Skill depuis ClawHub dans l’espace de travail actif.
- `skills install <slug> --version <version>` : installe une version ClawHub spécifique.
- `skills install <slug> --force` : écrase un dossier de Skill existant dans l’espace de travail.
- `skills update <slug|--all>` : met à jour les Skills ClawHub suivies.
- `skills list` : liste les Skills (par défaut lorsqu’aucune sous-commande n’est fournie).
- `skills list --json` : émet l’inventaire des Skills lisible par machine sur stdout.
- `skills list --verbose` : inclut dans le tableau les exigences manquantes.
- `skills info <name>` : affiche les détails d’une Skill.
- `skills info <name> --json` : émet les détails lisibles par machine sur stdout.
- `skills check` : résumé des exigences prêtes vs manquantes.
- `skills check --json` : émet la sortie d’état de préparation lisible par machine sur stdout.

Options :

- `--eligible` : n’affiche que les Skills prêtes.
- `--json` : sortie JSON (sans style).
- `-v`, `--verbose` : inclut le détail des exigences manquantes.

Astuce : utilisez `openclaw skills search`, `openclaw skills install` et `openclaw skills update` pour les Skills adossées à ClawHub.

### `pairing`

Approuvez les demandes d’appairage DM sur l’ensemble des canaux.

Sous-commandes :

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Remarques :

- Si exactement un seul canal compatible avec l’appairage est configuré, `pairing approve <code>` est également autorisé.
- `list` et `approve` prennent tous deux en charge `--account <id>` pour les canaux multi-comptes.

### `devices`

Gérez les entrées d’appairage des appareils gateway et les jetons d’appareil par rôle.

Sous-commandes :

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Remarques :

- `devices list` et `devices approve` peuvent revenir à des fichiers d’appairage locaux sur local loopback lorsque la portée d’appairage direct n’est pas disponible.
- `devices approve` exige un ID de demande explicite avant l’émission des jetons ; omettre `requestId` ou passer `--latest` n’affiche qu’un aperçu de la demande en attente la plus récente.
- Les reconnexions par jeton stocké réutilisent les portées approuvées mises en cache du jeton ; un `devices rotate --scope ...` explicite met à jour cet ensemble de portées stocké pour les futures reconnexions par jeton mis en cache.
- `devices rotate` et `devices revoke` renvoient des charges utiles JSON.

### `qr`

Générez un QR d’appairage mobile et un code de configuration à partir de la configuration Gateway actuelle. Voir [`openclaw qr`](/fr/cli/qr).

Options :

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Remarques :

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration transporte un jeton bootstrap de courte durée, et non le jeton/mot de passe Gateway partagé.
- Le transfert bootstrap intégré conserve le jeton du nœud principal à `scopes: []`.
- Tout jeton bootstrap opérateur transmis reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`.
- Les vérifications de portée bootstrap sont préfixées par rôle, de sorte que cette liste d’autorisation opérateur ne satisfait que les demandes opérateur ; les rôles non opérateur ont toujours besoin de portées sous leur propre préfixe de rôle.
- `--remote` peut utiliser `gateway.remote.url` ou l’URL active Tailscale Serve/Funnel.
- Après le scan, approuvez la demande avec `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Espace de noms d’alias hérité. Prend actuellement en charge `openclaw clawbot qr`, qui correspond à [`openclaw qr`](/fr/cli/qr).

### `hooks`

Gérez les hooks d’agent internes.

Sous-commandes :

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (alias déprécié de `openclaw plugins install`)
- `hooks update [id]` (alias déprécié de `openclaw plugins update`)

Options communes :

- `--json`
- `--eligible`
- `-v`, `--verbose`

Remarques :

- Les hooks gérés par Plugin ne peuvent pas être activés ni désactivés via `openclaw hooks` ; activez ou désactivez plutôt le Plugin propriétaire.
- `hooks install` et `hooks update` fonctionnent toujours comme alias de compatibilité, mais affichent des avertissements de dépréciation et redirigent vers les commandes de Plugin.

### `webhooks`

Assistants webhook. La surface intégrée actuelle est la configuration + exécution Gmail Pub/Sub :

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Configuration + exécution des hooks Gmail Pub/Sub. Voir [Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration).

Sous-commandes :

- `webhooks gmail setup` (nécessite `--account <email>` ; prend en charge `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (remplacements d’exécution pour les mêmes indicateurs)

Remarques :

- `setup` configure la surveillance Gmail ainsi que le chemin push côté OpenClaw.
- `run` démarre la boucle locale de surveillance/renouvellement Gmail avec des remplacements d’exécution facultatifs.

### `dns`

Assistants DNS de découverte à grande échelle (CoreDNS + Tailscale). Surface intégrée actuelle :

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Assistant DNS de découverte à grande échelle (CoreDNS + Tailscale). Voir [/gateway/discovery](/fr/gateway/discovery).

Options :

- `--domain <domain>`
- `--apply` : installe/met à jour la configuration CoreDNS (nécessite sudo ; macOS uniquement).

Remarques :

- Sans `--apply`, il s’agit d’un assistant de planification qui affiche la configuration DNS recommandée pour OpenClaw + Tailscale.
- `--apply` prend actuellement en charge uniquement macOS avec CoreDNS installé via Homebrew.

## Messagerie + agent

### `message`

Messagerie sortante unifiée + actions de canal.

Voir : [/cli/message](/fr/cli/message)

Sous-commandes :

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Exemples :

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Exécute un tour d’agent via la Gateway (ou intégré avec `--local`).

Passez au moins un sélecteur de session : `--to`, `--session-id` ou `--agent`.

Requis :

- `-m, --message <text>`

Options :

- `-t, --to <dest>` (pour la clé de session et une livraison facultative)
- `--session-id <id>`
- `--agent <id>` (ID de l’agent ; remplace les liaisons de routage)
- `--thinking <level>` (validé par rapport au profil fournisseur du modèle sélectionné)
- `--verbose <on|off>`
- `--channel <channel>` (canal de livraison ; omettez pour utiliser le canal de session principale)
- `--reply-to <target>` (remplacement de cible de réponse, distinct du routage de session)
- `--reply-channel <channel>` (remplacement du canal de livraison)
- `--reply-account <id>` (remplacement de l’ID du compte de livraison)
- `--local` (exécution intégrée ; le registre de plugins est quand même préchargé d’abord)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Remarques :

- Le mode Gateway revient à l’agent intégré lorsque la requête Gateway échoue.
- `--local` précharge quand même le registre de plugins, de sorte que les fournisseurs, outils et canaux fournis par Plugin restent disponibles pendant les exécutions intégrées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage.

### `agents`

Gérez des agents isolés (espaces de travail + authentification + routage).

Exécuter `openclaw agents` sans sous-commande équivaut à `openclaw agents list`.

#### `agents list`

Liste les agents configurés.

Options :

- `--json`
- `--bindings`

#### `agents add [name]`

Ajoute un nouvel agent isolé. Exécute l’assistant guidé sauf si des indicateurs (ou `--non-interactive`) sont passés ; `--workspace` est requis en mode non interactif.

Options :

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (répétable)
- `--non-interactive`
- `--json`

Les spécifications de liaison utilisent `channel[:accountId]`. Lorsque `accountId` est omis, OpenClaw peut résoudre la portée du compte via les valeurs par défaut du canal/les hooks de Plugin ; sinon il s’agit d’une liaison de canal sans portée de compte explicite.
Passer n’importe quel indicateur explicite d’ajout fait basculer la commande vers le chemin non interactif. `main` est réservé et ne peut pas être utilisé comme nouvel ID d’agent.

#### `agents bindings`

Liste les liaisons de routage.

Options :

- `--agent <id>`
- `--json`

#### `agents bind`

Ajoute des liaisons de routage pour un agent.

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--json`

#### `agents unbind`

Supprime des liaisons de routage pour un agent.

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--all`
- `--json`

Utilisez soit `--all`, soit `--bind`, pas les deux.

#### `agents delete <id>`

Supprime un agent et émonde son espace de travail + état.

Options :

- `--force`
- `--json`

Remarques :

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise.

#### `agents set-identity`

Met à jour l’identité d’un agent (nom/thème/emoji/avatar).

Options :

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Remarques :

- `--agent` ou `--workspace` peut être utilisé pour sélectionner l’agent cible.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit `IDENTITY.md`.

### `acp`

Exécute le pont ACP qui connecte les IDE à la Gateway.

Options racine :

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

Client ACP interactif pour le débogage du pont.

Options :

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Voir [`acp`](/fr/cli/acp) pour le comportement complet, les remarques de sécurité et les exemples.

### `mcp`

Gérez les définitions enregistrées de serveur MCP et exposez les canaux OpenClaw sur MCP stdio.

#### `mcp serve`

Expose les conversations de canaux OpenClaw routées sur MCP stdio.

Options :

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Liste les définitions enregistrées de serveur MCP.

Options :

- `--json`

#### `mcp show [name]`

Affiche une définition enregistrée de serveur MCP ou l’objet complet enregistré du serveur MCP.

Options :

- `--json`

#### `mcp set <name> <value>`

Enregistre une définition de serveur MCP à partir d’un objet JSON.

#### `mcp unset <name>`

Supprime une définition enregistrée de serveur MCP.

### `approvals`

Gérez les approbations d’exécution. Alias : `exec-approvals`.

#### `approvals get`

Récupère l’instantané des approbations d’exécution et la politique effective.

Options :

- `--node <node>`
- `--gateway`
- `--json`
- options RPC de nœud depuis `openclaw nodes`

#### `approvals set`

Remplace les approbations d’exécution par du JSON issu d’un fichier ou de stdin.

Options :

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- options RPC de nœud depuis `openclaw nodes`

#### `approvals allowlist add|remove`

Modifie la liste d’autorisation d’exécution par agent.

Options :

- `--node <node>`
- `--gateway`
- `--agent <id>` (par défaut `*`)
- `--json`
- options RPC de nœud depuis `openclaw nodes`

### `status`

Affiche l’état de santé de la session liée et les destinataires récents.

Options :

- `--json`
- `--all` (diagnostic complet ; lecture seule, prêt à coller)
- `--deep` (demande à la gateway une sonde d’état live, y compris des sondes de canaux lorsque prises en charge)
- `--usage` (affiche l’usage/le quota du fournisseur de modèle)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias de `--verbose`)

Remarques :

- La vue d’ensemble inclut l’état du service hôte Gateway + nœud lorsque disponible.
- `--usage` affiche les fenêtres d’usage normalisées du fournisseur sous la forme `X% left`.

### Suivi d’usage

OpenClaw peut exposer l’usage/le quota du fournisseur lorsque des identifiants OAuth/API sont disponibles.

Surfaces :

- `/status` (ajoute une courte ligne d’usage du fournisseur lorsque disponible)
- `openclaw status --usage` (affiche la ventilation complète par fournisseur)
- barre de menus macOS (section Usage sous Context)

Remarques :

- Les données proviennent directement des points de terminaison d’usage du fournisseur (aucune estimation).
- La sortie lisible par humain est normalisée en `X% left` pour tous les fournisseurs.
- Fournisseurs avec fenêtres d’usage actuelles : Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Remarque MiniMax : `usage_percent` / `usagePercent` brut signifie quota restant, donc OpenClaw l’inverse avant affichage ; les champs basés sur le comptage gardent la priorité lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages si nécessaire, et incluent le nom du modèle dans le libellé du forfait.
- L’authentification d’usage provient de hooks spécifiques au fournisseur lorsque disponibles ; sinon OpenClaw revient à des identifiants OAuth/clé API correspondants depuis les profils d’authentification, l’environnement ou la configuration. Si rien n’est résolu, l’usage est masqué.
- Détails : voir [Suivi d’usage](/fr/concepts/usage-tracking).

### `health`

Récupère l’état de santé depuis la Gateway en cours d’exécution.

Options :

- `--json`
- `--timeout <ms>`
- `--verbose` (force une sonde live et affiche les détails de connexion à la gateway)
- `--debug` (alias de `--verbose`)

Remarques :

- La commande `health` par défaut peut renvoyer un instantané gateway récemment mis en cache.
- `health --verbose` force une sonde live et développe la sortie lisible par humain sur tous les comptes et agents configurés.

### `sessions`

Liste les sessions de conversation stockées.

Options :

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtre les sessions par agent)
- `--all-agents` (affiche les sessions sur tous les agents)

Sous-commandes :

- `sessions cleanup` — supprime les sessions expirées ou orphelines

Remarques :

- `sessions cleanup` prend également en charge `--fix-missing` pour émonder les entrées dont les fichiers de transcription ont disparu.

## Réinitialisation / Désinstallation

### `reset`

Réinitialise la configuration/l’état local (conserve la CLI installée).

Options :

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Remarques :

- `--non-interactive` nécessite `--scope` et `--yes`.

### `uninstall`

Désinstalle le service gateway + les données locales (la CLI reste installée).

Options :

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Remarques :

- `--non-interactive` nécessite `--yes` et des portées explicites (ou `--all`).
- `--all` supprime ensemble le service, l’état, l’espace de travail et l’application.

### `tasks`

Liste et gère les exécutions de [tâches en arrière-plan](/fr/automation/tasks) sur l’ensemble des agents.

- `tasks list` — affiche les exécutions de tâches actives et récentes
- `tasks show <id>` — affiche les détails d’une exécution de tâche spécifique
- `tasks notify <id>` — modifie la politique de notification pour une exécution de tâche
- `tasks cancel <id>` — annule une tâche en cours d’exécution
- `tasks audit` — fait remonter les problèmes opérationnels (obsolètes, perdues, échecs de livraison)
- `tasks maintenance [--apply] [--json]` — prévisualise ou applique le nettoyage/la réconciliation des tâches et de TaskFlow (sessions enfant ACP/sous-agent, tâches Cron actives, exécutions CLI live)
- `tasks flow list` — liste les flux TaskFlow actifs et récents
- `tasks flow show <lookup>` — inspecte un flux par ID ou clé de recherche
- `tasks flow cancel <lookup>` — annule un flux en cours d’exécution et ses tâches actives

### `flows`

Raccourci de documentation hérité. Les commandes de flux se trouvent sous `openclaw tasks flow` :

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Exécute la Gateway WebSocket.

Options :

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
- `--reset` (réinitialise la configuration de développement + les identifiants + les sessions + l’espace de travail)
- `--force` (tue l’écouteur existant sur le port)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (alias de `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gère le service Gateway (launchd/systemd/schtasks).

Sous-commandes :

- `gateway status` (sonde la RPC Gateway par défaut)
- `gateway install` (installation du service)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Remarques :

- `gateway status` sonde la RPC Gateway par défaut en utilisant le port/la configuration résolus du service (remplacez avec `--url/--token/--password`).
- `gateway status` prend en charge `--no-probe`, `--deep`, `--require-rpc` et `--json` pour les scripts.
- `gateway status` fait également remonter les services gateway hérités ou supplémentaires lorsqu’il peut les détecter (`--deep` ajoute des analyses au niveau système). Les services OpenClaw nommés par profil sont traités comme de première classe et ne sont pas signalés comme « supplémentaires ».
- `gateway status` reste disponible pour le diagnostic même lorsque la configuration CLI locale est absente ou invalide.
- `gateway status` affiche le chemin de journal fichier résolu, l’instantané des chemins/validité de configuration CLI vs service, et l’URL cible de sonde résolue.
- Si les SecretRefs d’authentification gateway ne sont pas résolus dans le chemin de commande actuel, `gateway status --json` ne signale `rpc.authWarning` que lorsque la connectivité/l’authentification de la sonde échoue (les avertissements sont supprimés lorsque la sonde réussit).
- Sur les installations Linux systemd, les vérifications de dérive de jeton de statut incluent à la fois les sources d’unité `Environment=` et `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` prennent en charge `--json` pour les scripts (la sortie par défaut reste conviviale pour les humains).
- `gateway install` utilise par défaut le runtime Node ; bun est **déconseillé** (bogues WhatsApp/Telegram).
- Options de `gateway install` : `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Alias hérité pour les commandes de gestion du service Gateway. Voir [/cli/daemon](/fr/cli/daemon).

Sous-commandes :

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Options communes :

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart` : `--json`

### `logs`

Suit les journaux de fichiers Gateway via RPC.

Options :

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer
- `--max-bytes <n>` : nombre maximal d’octets à lire depuis le fichier journal
- `--follow` : suit le fichier journal (style `tail -f`)
- `--interval <ms>` : intervalle de sondage en ms lors du suivi
- `--local-time` : affiche les horodatages en heure locale
- `--json` : émet du JSON délimité par lignes
- `--plain` : désactive le formatage structuré
- `--no-color` : désactive les couleurs ANSI
- `--url <url>` : URL WebSocket Gateway explicite
- `--token <token>` : jeton Gateway
- `--timeout <ms>` : délai d’expiration RPC Gateway
- `--expect-final` : attend une réponse finale si nécessaire

Exemples :

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Remarques :

- Si vous passez `--url`, la CLI n’applique pas automatiquement les identifiants issus de la configuration ou de l’environnement.
- Les échecs d’appairage local loopback reviennent au fichier journal local configuré ; les cibles `--url` explicites non.

### `gateway <subcommand>`

Assistants CLI Gateway (utilisez `--url`, `--token`, `--password`, `--timeout`, `--expect-final` pour les sous-commandes RPC).
Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement.
Incluez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.

Sous-commandes :

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Remarques :

- `gateway status --deep` ajoute une analyse des services au niveau système. Utilisez `gateway probe`,
  `health --verbose` ou le `status --deep` de premier niveau pour des détails de sonde d’exécution plus approfondis.

RPC courantes :

- `config.schema.lookup` (inspecte un sous-arbre de configuration avec un nœud de schéma superficiel, des métadonnées d’indice correspondantes et des résumés immédiats des enfants)
- `config.get` (lit l’instantané de configuration actuel + son hash)
- `config.set` (valide + écrit la configuration complète ; utilisez `baseHash` pour la concurrence optimiste)
- `config.apply` (valide + écrit la configuration + redémarre + réveille)
- `config.patch` (fusionne une mise à jour partielle + redémarre + réveille)
- `update.run` (exécute la mise à jour + redémarre + réveille)

Astuce : lorsque vous appelez directement `config.set`/`config.apply`/`config.patch`, passez `baseHash` issu de
`config.get` si une configuration existe déjà.
Astuce : pour les modifications partielles, inspectez d’abord avec `config.schema.lookup` et privilégiez `config.patch`.
Astuce : ces RPC d’écriture de configuration effectuent un contrôle préalable de la résolution active de SecretRef pour les références du chargement de configuration soumis et rejettent les écritures lorsqu’une référence soumise effectivement active n’est pas résolue.
Astuce : l’outil d’exécution `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` ou `tools.exec.security` ; les alias hérités `tools.bash.*` sont normalisés vers les mêmes chemins d’exécution protégés.

## Modèles

Voir [/concepts/models](/fr/concepts/models) pour le comportement de repli et la stratégie d’analyse.

Remarque Anthropic : le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est
à nouveau autorisé, donc OpenClaw traite la réutilisation de Claude CLI et l’usage de `claude -p` comme
approuvés pour cette intégration, sauf si Anthropic publie une nouvelle politique. Pour la
production, privilégiez une clé API Anthropic ou un autre fournisseur pris en charge de type
abonnement, comme OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan, ou Z.AI / GLM Coding Plan.

Anthropic setup-token reste disponible comme chemin d’authentification par jeton pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

### `models` (racine)

`openclaw models` est un alias de `models status`.

Options racine :

- `--status-json` (alias de `models status --json`)
- `--status-plain` (alias de `models status --plain`)

### `models list`

Options :

- `--all`
- `--local`
- `--provider <id>`
- `--json`
- `--plain`

`--all` inclut les lignes statiques du catalogue intégré appartenant aux fournisseurs avant la
configuration de l’authentification. Les lignes restent indisponibles tant que les identifiants du fournisseur correspondant n’existent pas.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (sortie 1 = expiré/manquant, 2 = bientôt expiré)
- `--probe` (sonde live des profils d’authentification configurés)
- `--probe-provider <name>`
- `--probe-profile <id>` (répétable ou séparé par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Inclut toujours la vue d’ensemble de l’authentification et l’état d’expiration OAuth des profils dans le magasin d’authentification.
`--probe` exécute des requêtes live (peut consommer des jetons et déclencher des limites de débit).
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.
Attendez-vous à des statuts de sonde comme `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` et `no_model`.
Lorsqu’un `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
`excluded_by_auth_order` au lieu d’essayer silencieusement ce profil.

### `models set <model>`

Définit `agents.defaults.model.primary`.

### `models set-image <model>`

Définit `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Options :

- `list` : `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Options :

- `list` : `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Options :

- `list` : `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Options :

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

Options :

- `add` : assistant d’authentification interactif (flux d’authentification fournisseur ou collage de jeton)
- `login` : `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot` : flux de connexion OAuth GitHub Copilot (`--yes`)
- `setup-token` : `--provider <name>`, `--yes`
- `paste-token` : `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Remarques :

- `setup-token` et `paste-token` sont des commandes de jeton génériques pour les fournisseurs qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur.
- `paste-token` demande la valeur du jeton et utilise par défaut l’ID de profil d’authentification `<provider>:manual` lorsque `--profile-id` est omis.
- Les commandes Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’elles sont disponibles.

### `models auth order get|set|clear`

Options :

- `get` : `--provider <name>`, `--agent <id>`, `--json`
- `set` : `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear` : `--provider <name>`, `--agent <id>`

## Système

### `system event`

Met en file d’attente un événement système et peut éventuellement déclencher un Heartbeat (RPC Gateway).

Requis :

- `--text <text>`

Options :

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Contrôles de Heartbeat (RPC Gateway).

Options :

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Liste les entrées de présence système (RPC Gateway).

Options :

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gérez les tâches planifiées (RPC Gateway). Voir [/automation/cron-jobs](/fr/automation/cron-jobs).

Sous-commandes :

- `cron status [--json]`
- `cron list [--all] [--json]` (sortie tableau par défaut ; utilisez `--json` pour la sortie brute)
- `cron add` (alias : `create` ; nécessite `--name` et exactement un seul de `--at` | `--every` | `--cron`, et exactement une seule charge utile parmi `--system-event` | `--message`)
- `cron edit <id>` (corrige des champs)
- `cron rm <id>` (alias : `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Toutes les commandes `cron` acceptent `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche. Si
le modèle n’est pas autorisé, Cron avertit et revient à la sélection du
modèle par défaut/de l’agent de la tâche. Les chaînes de repli configurées continuent de s’appliquer, mais un simple
remplacement de modèle sans liste explicite de replis par tâche n’ajoute plus le
modèle principal de l’agent comme cible de nouvelle tentative supplémentaire cachée.

## Hôte Node

### `node`

`node` exécute un **hôte Node headless** ou le gère comme un service d’arrière-plan. Voir
[`openclaw node`](/fr/cli/node).

Sous-commandes :

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Remarques sur l’authentification :

- `node` résout l’authentification gateway depuis l’environnement/la configuration (pas d’indicateurs `--token`/`--password`) : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, puis `gateway.auth.*`. En mode local, l’hôte Node ignore intentionnellement `gateway.remote.*` ; dans `gateway.mode=remote`, `gateway.remote.*` participe selon les règles de priorité distantes.
- La résolution d’authentification de l’hôte Node ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` parle à la Gateway et cible les nœuds appairés. Voir [/nodes](/fr/nodes).

Options communes :

- `--url`, `--token`, `--timeout`, `--json`

Sous-commandes :

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (mac uniquement)

Caméra :

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + écran :

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Localisation :

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Navigateur

CLI de contrôle du navigateur (Chrome/Brave/Edge/Chromium dédiés). Voir [`openclaw browser`](/fr/cli/browser) et l’[outil Browser](/fr/tools/browser).

Options communes :

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Gestion :

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

Inspection :

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Actions :

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

## Appel vocal

### `voicecall`

Utilitaires d’appel vocal fournis par Plugin. N’apparaît que lorsque le Plugin d’appel vocal est installé et activé. Voir [`openclaw voicecall`](/fr/cli/voicecall).

Commandes courantes :

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Recherche dans la documentation

### `docs`

Recherche dans l’index live de la documentation OpenClaw.

### `docs [query...]`

Recherche dans l’index live de la documentation.

## TUI

### `tui`

Ouvre l’interface terminal connectée à la Gateway.

Options :

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (par défaut `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
