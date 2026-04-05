---
read_when:
    - Aggiunta o modifica di comandi o opzioni CLI
    - Documentazione di nuove superfici di comando
summary: Riferimento CLI di OpenClaw per comandi, sottocomandi e opzioni di `openclaw`
title: Riferimento CLI
x-i18n:
    generated_at: "2026-04-05T13:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# Riferimento CLI

Questa pagina descrive il comportamento attuale della CLI. Se i comandi cambiano, aggiorna questo documento.

## Pagine dei comandi

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`mcp`](/cli/mcp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`tasks`](/cli/index#tasks)
- [`flows`](/cli/flows)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (comandi dei plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (alias legacy per i comandi del servizio gateway)
- [`clawbot`](/cli/clawbot) (namespace alias legacy)
- [`voicecall`](/cli/voicecall) (plugin; se installato)

## Flag globali

- `--dev`: isola lo stato in `~/.openclaw-dev` e sposta le porte predefinite.
- `--profile <name>`: isola lo stato in `~/.openclaw-<name>`.
- `--container <name>`: usa un container con nome come destinazione per l'esecuzione.
- `--no-color`: disabilita i colori ANSI.
- `--update`: abbreviazione di `openclaw update` (solo installazioni da sorgente).
- `-V`, `--version`, `-v`: stampa la versione ed esce.

## Stile dell'output

- I colori ANSI e gli indicatori di avanzamento vengono renderizzati solo nelle sessioni TTY.
- I collegamenti ipertestuali OSC-8 vengono renderizzati come link cliccabili nei terminali supportati; altrimenti viene usato il fallback agli URL in chiaro.
- `--json` (e `--plain` dove supportato) disabilita lo stile per un output pulito.
- `--no-color` disabilita lo stile ANSI; viene rispettato anche `NO_COLOR=1`.
- I comandi di lunga durata mostrano un indicatore di avanzamento (OSC 9;4 quando supportato).

## Tavolozza dei colori

OpenClaw usa una tavolozza lobster per l'output della CLI.

- `accent` (#FF5A2D): intestazioni, etichette, evidenziazioni principali.
- `accentBright` (#FF7A3D): nomi dei comandi, enfasi.
- `accentDim` (#D14A22): testo evidenziato secondario.
- `info` (#FF8A5B): valori informativi.
- `success` (#2FBF71): stati di successo.
- `warn` (#FFB020): avvisi, fallback, elementi che richiedono attenzione.
- `error` (#E23D2D): errori, fallimenti.
- `muted` (#8B7F77): de-enfatizzazione, metadati.

Fonte di verità della tavolozza: `src/terminal/palette.ts` (la “lobster palette”).

## Albero dei comandi

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

Nota: i plugin possono aggiungere ulteriori comandi di primo livello (ad esempio `openclaw voicecall`).

## Sicurezza

- `openclaw security audit` — controlla config + stato locale per errori di configurazione di sicurezza comuni.
- `openclaw security audit --deep` — probe live del Gateway con approccio best effort.
- `openclaw security audit --fix` — rafforza i valori predefiniti sicuri e i permessi di stato/config.

## Segreti

### `secrets`

Gestisce SecretRef e la relativa igiene di runtime/config.

Sottocomandi:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Opzioni di `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Opzioni di `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Opzioni di `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Opzioni di `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Note:

- `reload` è un RPC Gateway e mantiene l'ultima istantanea di runtime valida conosciuta quando la risoluzione fallisce.
- `audit --check` restituisce un codice diverso da zero in presenza di segnalazioni; i ref non risolti usano un codice di uscita non zero con priorità più alta.
- I controlli exec in dry run vengono saltati per impostazione predefinita; usa `--allow-exec` per abilitarli esplicitamente.

## Plugin

Gestisci le estensioni e la loro configurazione:

- `openclaw plugins list` — rileva i plugin (usa `--json` per output leggibile da macchina).
- `openclaw plugins inspect <id>` — mostra i dettagli di un plugin (`info` è un alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — installa un plugin (o aggiunge un percorso plugin a `plugins.load.paths`; usa `--force` per sovrascrivere una destinazione di installazione esistente).
- `openclaw plugins marketplace list <marketplace>` — elenca le voci del marketplace prima dell'installazione.
- `openclaw plugins enable <id>` / `disable <id>` — attiva o disattiva `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — segnala gli errori di caricamento dei plugin.

La maggior parte delle modifiche ai plugin richiede un riavvio del gateway. Vedi [/plugin](/tools/plugin).

## Memory

Ricerca vettoriale su `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — mostra le statistiche dell'indice; usa `--deep` per controlli di disponibilità di vettori + embedding oppure `--fix` per riparare artefatti obsoleti di richiamo/promozione.
- `openclaw memory index` — reindicizza i file di memoria.
- `openclaw memory search "<query>"` (oppure `--query "<query>"`) — ricerca semantica nella memoria.
- `openclaw memory promote` — classifica i richiami a breve termine e facoltativamente aggiunge le voci migliori in `MEMORY.md`.

## Sandbox

Gestisci runtime sandbox per l'esecuzione isolata degli agenti. Vedi [/cli/sandbox](/cli/sandbox).

Sottocomandi:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Note:

- `sandbox recreate` rimuove i runtime esistenti in modo che l'uso successivo li reinizializzi con la config corrente.
- Per i backend `ssh` e OpenShell `remote`, recreate elimina lo spazio di lavoro remoto canonico per l'ambito selezionato.

## Comandi slash della chat

I messaggi di chat supportano comandi `/...` (testuali e nativi). Vedi [/tools/slash-commands](/tools/slash-commands).

In evidenza:

- `/status` per una diagnostica rapida.
- `/config` per modifiche persistenti alla config.
- `/debug` per override di config solo runtime (memoria, non disco; richiede `commands.debug: true`).

## Configurazione iniziale + onboarding

### `completion`

Genera script di completamento per la shell e facoltativamente li installa nel profilo della shell.

Opzioni:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Note:

- Senza `--install` o `--write-state`, `completion` stampa lo script su stdout.
- `--install` scrive un blocco `OpenClaw Completion` nel profilo della shell e lo punta allo script in cache nella directory di stato di OpenClaw.

### `setup`

Inizializza config + workspace.

Opzioni:

- `--workspace <dir>`: percorso del workspace dell'agente (predefinito `~/.openclaw/workspace`).
- `--wizard`: esegue l'onboarding.
- `--non-interactive`: esegue l'onboarding senza prompt.
- `--mode <local|remote>`: modalità di onboarding.
- `--remote-url <url>`: URL del Gateway remoto.
- `--remote-token <token>`: token del Gateway remoto.

L'onboarding viene eseguito automaticamente quando è presente uno qualsiasi dei flag di onboarding (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interattivo per gateway, workspace e Skills.

Opzioni:

- `--workspace <dir>`
- `--reset` (reimposta config + credenziali + sessioni prima dell'onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (predefinito `config+creds+sessions`; usa `full` per rimuovere anche il workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual è un alias di advanced)
- `--auth-choice <choice>` dove `<choice>` è uno tra:
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
- Nota su Qwen: `qwen-*` è la famiglia canonica di auth-choice. Gli ID `modelstudio-*`
  restano accettati solo come alias legacy di compatibilità.
- `--secret-input-mode <plaintext|ref>` (predefinito `plaintext`; usa `ref` per memorizzare ref env predefiniti del provider invece di chiavi in chiaro)
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
- `--custom-base-url <url>` (non interattivo; usato con `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (non interattivo; usato con `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (non interattivo; facoltativo; usato con `--auth-choice custom-api-key`; usa `CUSTOM_API_KEY` come fallback se omesso)
- `--custom-provider-id <id>` (non interattivo; ID provider personalizzato facoltativo)
- `--custom-compatibility <openai|anthropic>` (non interattivo; facoltativo; predefinito `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (non interattivo; memorizza `gateway.auth.token` come SecretRef env; richiede che la variabile env sia impostata; non può essere combinato con `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (gestore Node per setup/onboarding delle Skills; si consiglia pnpm, è supportato anche bun)
- `--json`

### `configure`

Procedura guidata di configurazione interattiva (modelli, canali, Skills, gateway).

Opzioni:

- `--section <section>` (ripetibile; limita la procedura guidata a sezioni specifiche)

### `config`

Helper di configurazione non interattivi (get/set/unset/file/schema/validate). Eseguire `openclaw config` senza
sottocomando avvia la procedura guidata.

Sottocomandi:

- `config get <path>`: stampa un valore della config (percorso dot/bracket).
- `config set`: supporta quattro modalità di assegnazione:
  - modalità valore: `config set <path> <value>` (parsing JSON5 o stringa)
  - modalità builder SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - modalità builder provider: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - modalità batch: `config set --batch-json '<json>'` o `config set --batch-file <path>`
- `config set --dry-run`: valida le assegnazioni senza scrivere `openclaw.json` (i controlli exec SecretRef vengono saltati per impostazione predefinita).
- `config set --allow-exec --dry-run`: abilita esplicitamente i controlli in dry run per exec SecretRef (può eseguire comandi del provider).
- `config set --dry-run --json`: emette output dry run leggibile da macchina (controlli + segnale di completezza, operazioni, ref controllati/saltati, errori).
- `config set --strict-json`: richiede parsing JSON5 per input path/value. `--json` resta un alias legacy per parsing rigoroso fuori dalla modalità di output dry run.
- `config unset <path>`: rimuove un valore.
- `config file`: stampa il percorso del file di config attivo.
- `config schema`: stampa lo schema JSON generato per `openclaw.json`, inclusa la propagazione dei metadati documentali dei campi `title` / `description` nei rami annidati di oggetti, wildcard, elementi array e composizione, oltre a metadati best effort di schema plugin/canale live.
- `config validate`: valida la config corrente rispetto allo schema senza avviare il gateway.
- `config validate --json`: emette output JSON leggibile da macchina.

### `doctor`

Controlli di salute + correzioni rapide (config + gateway + servizi legacy).

Opzioni:

- `--no-workspace-suggestions`: disabilita i suggerimenti per la memoria del workspace.
- `--yes`: accetta i valori predefiniti senza chiedere conferma (headless).
- `--non-interactive`: salta i prompt; applica solo migrazioni sicure.
- `--deep`: esegue una scansione dei servizi di sistema per installazioni gateway aggiuntive.
- `--repair` (alias: `--fix`): tenta riparazioni automatiche per i problemi rilevati.
- `--force`: forza le riparazioni anche quando non strettamente necessarie.
- `--generate-gateway-token`: genera un nuovo token di autenticazione gateway.

### `dashboard`

Apre l'interfaccia di controllo con il token corrente.

Opzioni:

- `--no-open`: stampa l'URL ma non avvia un browser

Note:

- Per i token gateway gestiti da SecretRef, `dashboard` stampa o apre un URL senza token invece di esporre il segreto nell'output del terminale o negli argomenti di avvio del browser.

### `update`

Aggiorna la CLI installata.

Opzioni root:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Sottocomandi:

- `update status`
- `update wizard`

Opzioni di `update status`:

- `--json`
- `--timeout <seconds>`

Opzioni di `update wizard`:

- `--timeout <seconds>`

Note:

- `openclaw --update` viene riscritto come `openclaw update`.

### `backup`

Crea e verifica archivi di backup locali per lo stato di OpenClaw.

Sottocomandi:

- `backup create`
- `backup verify <archive>`

Opzioni di `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Opzioni di `backup verify <archive>`:

- `--json`

## Helper dei canali

### `channels`

Gestisci gli account dei canali di chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Sottocomandi:

- `channels list`: mostra i canali configurati e i profili di autenticazione.
- `channels status`: controlla la raggiungibilità del gateway e lo stato dei canali (`--probe` esegue controlli live per-account di probe/audit quando il gateway è raggiungibile; in caso contrario torna a riepiloghi dei canali basati solo sulla config. Usa `openclaw health` o `openclaw status --deep` per probe più ampie sullo stato del gateway).
- Suggerimento: `channels status` stampa avvisi con correzioni suggerite quando riesce a rilevare errori di configurazione comuni (quindi ti indirizza a `openclaw doctor`).
- `channels logs`: mostra i log recenti dei canali dal file di log del gateway.
- `channels add`: configurazione guidata in stile wizard quando non vengono passati flag; i flag attivano la modalità non interattiva.
  - Quando si aggiunge un account non predefinito a un canale che usa ancora una config di primo livello a singolo account, OpenClaw promuove i valori con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare una destinazione named/default esistente corrispondente.
  - `channels add` in modalità non interattiva non crea né aggiorna automaticamente i binding; i binding solo-canale continuano a corrispondere all'account predefinito.
- `channels remove`: per impostazione predefinita disabilita; passa `--delete` per rimuovere le voci di config senza prompt.
- `channels login`: login interattivo del canale (solo WhatsApp Web).
- `channels logout`: esegue il logout da una sessione di canale (se supportato).

Opzioni comuni:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: ID account del canale (predefinito `default`)
- `--name <label>`: nome visualizzato dell'account

Opzioni di `channels login`:

- `--channel <channel>` (predefinito `whatsapp`; supporta `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opzioni di `channels logout`:

- `--channel <channel>` (predefinito `whatsapp`)
- `--account <id>`

Opzioni di `channels list`:

- `--no-usage`: salta le istantanee di utilizzo/quota del provider modello (solo con OAuth/API).
- `--json`: output JSON (include l'utilizzo a meno che non sia impostato `--no-usage`).

Opzioni di `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Opzioni di `channels capabilities`:

- `--channel <name>`
- `--account <id>` (solo con `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Opzioni di `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Opzioni di `channels logs`:

- `--channel <name|all>` (predefinito `all`)
- `--lines <n>` (predefinito `200`)
- `--json`

Note:

- `channels login` supporta `--verbose`.
- `channels capabilities --account` si applica solo quando è impostato `--channel`.
- `channels status --probe` può mostrare lo stato del trasporto più risultati di probe/audit come `works`, `probe failed`, `audit ok` o `audit failed`, a seconda del supporto del canale.

Maggiori dettagli: [/concepts/oauth](/concepts/oauth)

Esempi:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Cerca ID di sé, peer e gruppi per i canali che espongono una superficie directory. Vedi [`openclaw directory`](/cli/directory).

Opzioni comuni:

- `--channel <name>`
- `--account <id>`
- `--json`

Sottocomandi:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Elenca e ispeziona le Skills disponibili insieme alle informazioni di disponibilità.

Sottocomandi:

- `skills search [query...]`: cerca Skills su ClawHub.
- `skills search --limit <n> --json`: limita i risultati della ricerca o emette output leggibile da macchina.
- `skills install <slug>`: installa una Skill da ClawHub nel workspace attivo.
- `skills install <slug> --version <version>`: installa una versione specifica di ClawHub.
- `skills install <slug> --force`: sovrascrive una cartella Skill esistente nel workspace.
- `skills update <slug|--all>`: aggiorna le Skills di ClawHub tracciate.
- `skills list`: elenca le Skills (impostazione predefinita se non viene passato alcun sottocomando).
- `skills list --json`: emette su stdout un inventario delle Skills leggibile da macchina.
- `skills list --verbose`: include nella tabella i requisiti mancanti.
- `skills info <name>`: mostra i dettagli di una Skill.
- `skills info <name> --json`: emette su stdout dettagli leggibili da macchina.
- `skills check`: riepilogo di requisiti pronti vs mancanti.
- `skills check --json`: emette su stdout output di disponibilità leggibile da macchina.

Opzioni:

- `--eligible`: mostra solo le Skills pronte.
- `--json`: output JSON (senza stile).
- `-v`, `--verbose`: include il dettaglio dei requisiti mancanti.

Suggerimento: usa `openclaw skills search`, `openclaw skills install` e `openclaw skills update` per le Skills supportate da ClawHub.

### `pairing`

Approva le richieste di associazione DM tra canali.

Sottocomandi:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Note:

- Se è configurato esattamente un canale con capacità di pairing, è consentito anche `pairing approve <code>`.
- Sia `list` sia `approve` supportano `--account <id>` per i canali multi-account.

### `devices`

Gestisci le voci di pairing dei dispositivi gateway e i token dispositivo per ruolo.

Sottocomandi:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Note:

- `devices list` e `devices approve` possono ricorrere ai file di pairing locali su local loopback quando l'ambito di pairing diretto non è disponibile.
- `devices approve` seleziona automaticamente la richiesta in sospeso più recente quando non viene passato alcun `requestId` o quando è impostato `--latest`.
- Le riconnessioni con token memorizzato riutilizzano gli scope approvati memorizzati nella cache del token; `devices rotate --scope ...` aggiornano esplicitamente questo insieme di scope memorizzato per le future riconnessioni con token in cache.
- `devices rotate` e `devices revoke` restituiscono payload JSON.

### `qr`

Genera un QR di pairing mobile e un codice di configurazione dalla config Gateway corrente. Vedi [`openclaw qr`](/cli/qr).

Opzioni:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Note:

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione contiene un token bootstrap a breve durata, non il token/password gateway condiviso.
- Il passaggio bootstrap integrato mantiene il token del nodo primario con `scopes: []`.
- Qualsiasi token bootstrap operatore passato di mano resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`.
- I controlli degli scope bootstrap hanno prefisso di ruolo, quindi questa allowlist operatore soddisfa solo richieste operatore; i ruoli non operatore richiedono comunque scope con il proprio prefisso di ruolo.
- `--remote` può usare `gateway.remote.url` o l'URL Tailscale Serve/Funnel attivo.
- Dopo la scansione, approva la richiesta con `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Namespace alias legacy. Attualmente supporta `openclaw clawbot qr`, che corrisponde a [`openclaw qr`](/cli/qr).

### `hooks`

Gestisci gli hook interni dell'agente.

Sottocomandi:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (alias deprecato per `openclaw plugins install`)
- `hooks update [id]` (alias deprecato per `openclaw plugins update`)

Opzioni comuni:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Note:

- Gli hook gestiti dai plugin non possono essere abilitati o disabilitati tramite `openclaw hooks`; abilita o disabilita invece il plugin proprietario.
- `hooks install` e `hooks update` funzionano ancora come alias di compatibilità, ma stampano avvisi di deprecazione e inoltrano ai comandi dei plugin.

### `webhooks`

Helper per webhook. La superficie integrata attuale è la configurazione + runner Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Configurazione + runner dell'hook Gmail Pub/Sub. Vedi [Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration).

Sottocomandi:

- `webhooks gmail setup` (richiede `--account <email>`; supporta `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (override runtime per gli stessi flag)

Note:

- `setup` configura il watch Gmail più il percorso push verso OpenClaw.
- `run` avvia il watcher/loop di rinnovo Gmail locale con override runtime facoltativi.

### `dns`

Helper DNS per il rilevamento su rete ampia (CoreDNS + Tailscale). Superficie integrata attuale:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Helper DNS per il rilevamento su rete ampia (CoreDNS + Tailscale). Vedi [/gateway/discovery](/gateway/discovery).

Opzioni:

- `--domain <domain>`
- `--apply`: installa/aggiorna la config CoreDNS (richiede sudo; solo macOS).

Note:

- Senza `--apply`, questo è un helper di pianificazione che stampa la configurazione DNS raccomandata per OpenClaw + Tailscale.
- `--apply` attualmente supporta solo macOS con Homebrew CoreDNS.

## Messaggistica + agente

### `message`

Messaggistica in uscita unificata + azioni di canale.

Vedi: [/cli/message](/cli/message)

Sottocomandi:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Esempi:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Esegue un turno di agente tramite il Gateway (oppure incorporato con `--local`).

Passa almeno un selettore di sessione: `--to`, `--session-id` oppure `--agent`.

Richiesto:

- `-m, --message <text>`

Opzioni:

- `-t, --to <dest>` (per chiave di sessione e consegna facoltativa)
- `--session-id <id>`
- `--agent <id>` (ID agente; sovrascrive i binding di instradamento)
- `--thinking <off|minimal|low|medium|high|xhigh>` (il supporto del provider varia; non è limitato a livello CLI in base al modello)
- `--verbose <on|off>`
- `--channel <channel>` (canale di consegna; ometti per usare il canale principale della sessione)
- `--reply-to <target>` (override del target di risposta, separato dall'instradamento della sessione)
- `--reply-channel <channel>` (override del canale di risposta)
- `--reply-account <id>` (override dell'ID account di risposta)
- `--local` (esecuzione incorporata; il registro plugin viene comunque precaricato per primo)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Note:

- La modalità Gateway usa l'agente incorporato come fallback quando la richiesta al Gateway fallisce.
- `--local` precarica comunque il registro plugin, quindi provider, strumenti e canali forniti dai plugin restano disponibili durante le esecuzioni incorporate.
- `--channel`, `--reply-channel` e `--reply-account` influiscono sulla consegna della risposta, non sull'instradamento.

### `agents`

Gestisci agenti isolati (workspace + auth + routing).

Eseguire `openclaw agents` senza sottocomando equivale a `openclaw agents list`.

#### `agents list`

Elenca gli agenti configurati.

Opzioni:

- `--json`
- `--bindings`

#### `agents add [name]`

Aggiunge un nuovo agente isolato. Esegue la procedura guidata a meno che non vengano passati flag (o `--non-interactive`); `--workspace` è richiesto in modalità non interattiva.

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Le specifiche di binding usano `channel[:accountId]`. Quando `accountId` viene omesso, OpenClaw può risolvere l'ambito account tramite valori predefiniti del canale/hook plugin; altrimenti il binding resta di canale senza ambito account esplicito.
Passare qualsiasi flag esplicito di aggiunta fa passare il comando al percorso non interattivo. `main` è riservato e non può essere usato come nuovo ID agente.

#### `agents bindings`

Elenca i binding di instradamento.

Opzioni:

- `--agent <id>`
- `--json`

#### `agents bind`

Aggiunge binding di instradamento per un agente.

Opzioni:

- `--agent <id>` (per impostazione predefinita usa l'agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--json`

#### `agents unbind`

Rimuove binding di instradamento da un agente.

Opzioni:

- `--agent <id>` (per impostazione predefinita usa l'agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--all`
- `--json`

Usa `--all` oppure `--bind`, non entrambi.

#### `agents delete <id>`

Elimina un agente e rimuove il suo workspace + stato.

Opzioni:

- `--force`
- `--json`

Note:

- `main` non può essere eliminato.
- Senza `--force`, è richiesta una conferma interattiva.

#### `agents set-identity`

Aggiorna l'identità di un agente (nome/tema/emoji/avatar).

Opzioni:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Note:

- `--agent` oppure `--workspace` possono essere usati per selezionare l'agente di destinazione.
- Quando non vengono forniti campi di identità espliciti, il comando legge `IDENTITY.md`.

### `acp`

Esegue il bridge ACP che collega gli IDE al Gateway.

Opzioni root:

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

Client ACP interattivo per il debug del bridge.

Opzioni:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Vedi [`acp`](/cli/acp) per comportamento completo, note di sicurezza ed esempi.

### `mcp`

Gestisce le definizioni di server MCP salvate ed espone i canali OpenClaw su MCP stdio.

#### `mcp serve`

Espone su MCP stdio le conversazioni dei canali OpenClaw instradati.

Opzioni:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Elenca le definizioni salvate dei server MCP.

Opzioni:

- `--json`

#### `mcp show [name]`

Mostra una definizione salvata di server MCP oppure l'intero oggetto del server MCP salvato.

Opzioni:

- `--json`

#### `mcp set <name> <value>`

Salva una definizione di server MCP da un oggetto JSON.

#### `mcp unset <name>`

Rimuove una definizione di server MCP salvata.

### `approvals`

Gestisce le approvazioni exec. Alias: `exec-approvals`.

#### `approvals get`

Recupera l'istantanea delle approvazioni exec e il criterio effettivo.

Opzioni:

- `--node <node>`
- `--gateway`
- `--json`
- opzioni RPC nodo da `openclaw nodes`

#### `approvals set`

Sostituisce le approvazioni exec con JSON da file o stdin.

Opzioni:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- opzioni RPC nodo da `openclaw nodes`

#### `approvals allowlist add|remove`

Modifica l'allowlist exec per agente.

Opzioni:

- `--node <node>`
- `--gateway`
- `--agent <id>` (predefinito `*`)
- `--json`
- opzioni RPC nodo da `openclaw nodes`

### `status`

Mostra lo stato delle sessioni collegate e i destinatari recenti.

Opzioni:

- `--json`
- `--all` (diagnostica completa; sola lettura, incollabile)
- `--deep` (chiede al gateway un probe di salute live, inclusi probe dei canali quando supportati)
- `--usage` (mostra utilizzo/quota del provider modello)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias di `--verbose`)

Note:

- La panoramica include lo stato del servizio host di Gateway + nodo quando disponibile.
- `--usage` stampa finestre di utilizzo normalizzate del provider come `X% left`.

### Tracciamento dell'utilizzo

OpenClaw può mostrare utilizzo/quota del provider quando sono disponibili credenziali OAuth/API.

Superfici:

- `/status` (aggiunge una breve riga di utilizzo provider quando disponibile)
- `openclaw status --usage` (stampa il dettaglio completo per provider)
- barra dei menu macOS (sezione Usage in Context)

Note:

- I dati provengono direttamente dagli endpoint di utilizzo del provider (nessuna stima).
- L'output leggibile è normalizzato come `X% left` per tutti i provider.
- Provider con finestre di utilizzo correnti: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Nota su MiniMax: i campi grezzi `usage_percent` / `usagePercent` indicano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno comunque priorità quando presenti. Le risposte `model_remains` privilegiano la voce del modello di chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- L'autenticazione per l'utilizzo proviene da hook specifici del provider quando disponibili; altrimenti OpenClaw usa come fallback credenziali OAuth/API-key corrispondenti da profili auth, env o config. Se non viene risolto nulla, l'utilizzo resta nascosto.
- Dettagli: vedi [Tracciamento dell'utilizzo](/concepts/usage-tracking).

### `health`

Recupera lo stato di salute dal Gateway in esecuzione.

Opzioni:

- `--json`
- `--timeout <ms>`
- `--verbose` (forza un probe live e stampa i dettagli di connessione del gateway)
- `--debug` (alias di `--verbose`)

Note:

- Il comando `health` predefinito può restituire un'istantanea gateway fresca dalla cache.
- `health --verbose` forza un probe live ed espande l'output leggibile a tutti gli account e agenti configurati.

### `sessions`

Elenca le sessioni di conversazione memorizzate.

Opzioni:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtra le sessioni per agente)
- `--all-agents` (mostra le sessioni di tutti gli agenti)

Sottocomandi:

- `sessions cleanup` — rimuove le sessioni scadute o orfane

Note:

- `sessions cleanup` supporta anche `--fix-missing` per eliminare le voci i cui file di trascrizione non esistono più.

## Reset / Disinstallazione

### `reset`

Reimposta config/stato locale (la CLI resta installata).

Opzioni:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Note:

- `--non-interactive` richiede `--scope` e `--yes`.

### `uninstall`

Disinstalla il servizio gateway + i dati locali (la CLI resta installata).

Opzioni:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Note:

- `--non-interactive` richiede `--yes` e scope espliciti (oppure `--all`).
- `--all` rimuove insieme servizio, stato, workspace e app.

### `tasks`

Elenca e gestisce le esecuzioni di [attività in background](/it/automation/tasks) tra gli agenti.

- `tasks list` — mostra le esecuzioni di attività attive e recenti
- `tasks show <id>` — mostra i dettagli di una specifica esecuzione di attività
- `tasks notify <id>` — modifica il criterio di notifica per un'esecuzione di attività
- `tasks cancel <id>` — annulla un'attività in esecuzione
- `tasks audit` — evidenzia problemi operativi (obsoleti, persi, errori di consegna)
- `tasks maintenance [--apply] [--json]` — anteprima o applicazione della pulizia/riconciliazione di attività e TaskFlow (sessioni figlie ACP/subagent, lavori cron attivi, esecuzioni CLI live)
- `tasks flow list` — elenca i flussi Task Flow attivi e recenti
- `tasks flow show <lookup>` — ispeziona un flusso per ID o chiave di lookup
- `tasks flow cancel <lookup>` — annulla un flusso in esecuzione e le sue attività attive

### `flows`

Scorciatoia legacy della documentazione. I comandi flow si trovano sotto `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Esegue il Gateway WebSocket.

Opzioni:

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
- `--reset` (reimposta config dev + credenziali + sessioni + workspace)
- `--force` (termina l'ascoltatore esistente sulla porta)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (alias deprecato)
- `--ws-log <auto|full|compact>`
- `--compact` (alias di `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gestisce il servizio Gateway (launchd/systemd/schtasks).

Sottocomandi:

- `gateway status` (per impostazione predefinita esegue probe dell'RPC Gateway)
- `gateway install` (installazione servizio)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Note:

- `gateway status` esegue per impostazione predefinita il probe dell'RPC Gateway usando la porta/config risolta del servizio (override con `--url/--token/--password`).
- `gateway status` supporta `--no-probe`, `--deep`, `--require-rpc` e `--json` per scripting.
- `gateway status` mostra anche servizi gateway legacy o aggiuntivi quando riesce a rilevarli (`--deep` aggiunge scansioni a livello di sistema). I servizi OpenClaw con profilo nominato sono trattati come cittadini di prima classe e non vengono segnalati come "extra".
- `gateway status` resta disponibile per la diagnostica anche quando la config CLI locale manca o non è valida.
- `gateway status` stampa il percorso risolto del log file, l'istantanea dei percorsi/validità della config CLI rispetto al servizio e l'URL target del probe risolto.
- Se gli auth SecretRef del gateway non sono risolti nel percorso di comando corrente, `gateway status --json` segnala `rpc.authWarning` solo quando connettività/auth del probe falliscono (gli avvisi vengono soppressi se il probe ha successo).
- Nelle installazioni Linux systemd, i controlli status sulla deriva del token includono sia le origini `Environment=` sia `EnvironmentFile=` dell'unità.
- `gateway install|uninstall|start|stop|restart` supportano `--json` per scripting (l'output predefinito resta leggibile per esseri umani).
- `gateway install` usa Node runtime per impostazione predefinita; bun **non è consigliato** (bug con WhatsApp/Telegram).
- Opzioni di `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Alias legacy per i comandi di gestione del servizio Gateway. Vedi [/cli/daemon](/cli/daemon).

Sottocomandi:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Opzioni comuni:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Segue i log file del Gateway tramite RPC.

Opzioni:

- `--limit <n>`: numero massimo di righe di log da restituire
- `--max-bytes <n>`: byte massimi da leggere dal file di log
- `--follow`: segue il file di log (stile tail -f)
- `--interval <ms>`: intervallo di polling in ms durante il follow
- `--local-time`: visualizza i timestamp in ora locale
- `--json`: emette JSON delimitato da righe
- `--plain`: disabilita la formattazione strutturata
- `--no-color`: disabilita i colori ANSI
- `--url <url>`: URL WebSocket Gateway esplicito
- `--token <token>`: token Gateway
- `--timeout <ms>`: timeout RPC Gateway
- `--expect-final`: attende una risposta finale quando necessario

Esempi:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Note:

- Se passi `--url`, la CLI non applica automaticamente credenziali da config o environment.
- Gli errori di pairing local loopback ricorrono al file di log locale configurato; i target espliciti `--url` non lo fanno.

### `gateway <subcommand>`

Helper CLI del gateway (usa `--url`, `--token`, `--password`, `--timeout`, `--expect-final` per i sottocomandi RPC).
Quando passi `--url`, la CLI non applica automaticamente credenziali da config o environment.
Includi `--token` o `--password` esplicitamente. L'assenza di credenziali esplicite è un errore.

Sottocomandi:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Note:

- `gateway status --deep` aggiunge una scansione del servizio a livello di sistema. Usa `gateway probe`,
  `health --verbose` oppure il comando di primo livello `status --deep` per dettagli più approfonditi sui probe runtime.

RPC comuni:

- `config.schema.lookup` (ispeziona un sottoalbero di config con un nodo schema superficiale, metadati di suggerimento corrispondenti e riepiloghi immediati dei figli)
- `config.get` (legge l'istantanea di config corrente + hash)
- `config.set` (valida + scrive la config completa; usa `baseHash` per concorrenza ottimistica)
- `config.apply` (valida + scrive config + riavvia + riattiva)
- `config.patch` (unisce un aggiornamento parziale + riavvia + riattiva)
- `update.run` (esegue update + riavvia + riattiva)

Suggerimento: quando chiami direttamente `config.set`/`config.apply`/`config.patch`, passa `baseHash` da
`config.get` se una config esiste già.
Suggerimento: per modifiche parziali, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`.
Suggerimento: questi RPC di scrittura config eseguono un preflight della risoluzione SecretRef attiva per i ref nel payload di config inviato e rifiutano le scritture quando un ref inviato effettivamente attivo non è risolto.
Suggerimento: lo strumento runtime `gateway` riservato al proprietario continua a rifiutare la riscrittura di `tools.exec.ask` o `tools.exec.security`; gli alias legacy `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

## Modelli

Vedi [/concepts/models](/concepts/models) per comportamento di fallback e strategia di scansione.

Nota sulla fatturazione: riteniamo che il fallback Claude Code CLI sia probabilmente consentito per automazione locale gestita dall'utente in base alla documentazione pubblica della CLI di Anthropic. Detto questo, il criterio di Anthropic sugli harness di terze parti crea abbastanza ambiguità riguardo all'uso supportato da abbonamento in prodotti esterni, per cui non lo consigliamo in produzione. Anthropic ha inoltre notificato agli utenti OpenClaw il **4 aprile 2026 alle 12:00 PM PT / 8:00 PM BST** che il percorso di login Claude di **OpenClaw** conta come utilizzo di harness di terze parti e richiede **Extra Usage** fatturato separatamente dall'abbonamento. Per la produzione, preferisci una chiave API Anthropic o un altro provider supportato in stile abbonamento, come OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan o Z.AI / GLM Coding Plan.

Migrazione Anthropic Claude CLI:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Scorciatoia onboarding: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token è di nuovo disponibile anche come percorso auth legacy/manuale.
Usalo solo aspettandoti che Anthropic abbia informato gli utenti OpenClaw che il
percorso di login Claude di OpenClaw richiede **Extra Usage**.

Nota alias legacy: `claude-cli` è l'alias deprecato per onboarding auth-choice.
Usa `anthropic-cli` per l'onboarding, oppure usa direttamente `models auth login`.

### `models` (root)

`openclaw models` è un alias di `models status`.

Opzioni root:

- `--status-json` (alias di `models status --json`)
- `--status-plain` (alias di `models status --plain`)

### `models list`

Opzioni:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (uscita 1=mancante/scaduto, 2=in scadenza)
- `--probe` (probe live dei profili auth configurati)
- `--probe-provider <name>`
- `--probe-profile <id>` (ripeti o separa con virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Include sempre la panoramica auth e lo stato di scadenza OAuth per i profili nell'archivio auth.
`--probe` esegue richieste live (può consumare token e attivare limiti di frequenza).
Le righe di probe possono provenire da profili auth, credenziali env o `models.json`.
Aspettati stati probe come `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` e `no_model`.
Quando un `auth.order.<provider>` esplicito omette un profilo memorizzato, il report probe
mostra `excluded_by_auth_order` invece di provare silenziosamente quel profilo.

### `models set <model>`

Imposta `agents.defaults.model.primary`.

### `models set-image <model>`

Imposta `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opzioni:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opzioni:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opzioni:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Opzioni:

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

Opzioni:

- `add`: helper auth interattivo (flusso auth del provider o incolla token)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: flusso di login OAuth GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Note:

- `setup-token` e `paste-token` sono comandi token generici per i provider che espongono metodi di autenticazione basati su token.
- `setup-token` richiede una TTY interattiva ed esegue il metodo di autenticazione via token del provider.
- `paste-token` richiede il valore del token e usa come predefinito l'ID profilo auth `<provider>:manual` quando `--profile-id` viene omesso.
- Anthropic `setup-token` / `paste-token` sono di nuovo disponibili come percorso OpenClaw legacy/manuale. Anthropic ha informato gli utenti OpenClaw che questo percorso richiede **Extra Usage** sull'account Claude.

### `models auth order get|set|clear`

Opzioni:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## Sistema

### `system event`

Accoda un evento di sistema e facoltativamente attiva un heartbeat (RPC Gateway).

Richiesto:

- `--text <text>`

Opzioni:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Controlli heartbeat (RPC Gateway).

Opzioni:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Elenca le voci di presenza del sistema (RPC Gateway).

Opzioni:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gestisce i lavori pianificati (RPC Gateway). Vedi [/automation/cron-jobs](/it/automation/cron-jobs).

Sottocomandi:

- `cron status [--json]`
- `cron list [--all] [--json]` (output tabellare per impostazione predefinita; usa `--json` per il formato grezzo)
- `cron add` (alias: `create`; richiede `--name` ed esattamente uno tra `--at` | `--every` | `--cron`, oltre a esattamente un payload tra `--system-event` | `--message`)
- `cron edit <id>` (aggiorna campi)
- `cron rm <id>` (alias: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Tutti i comandi `cron` accettano `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` usa il modello consentito selezionato per quel lavoro. Se
il modello non è consentito, cron avvisa e usa invece il fallback sulla selezione
del modello predefinito dell'agente/del lavoro. Le catene di fallback configurate
continuano comunque ad applicarsi, ma un semplice override del modello senza un elenco
esplicito di fallback per lavoro non aggiunge più la primary dell'agente come
destinazione di nuovo tentativo nascosta.

## Host nodo

### `node`

`node` esegue un **host nodo headless** oppure lo gestisce come servizio in background. Vedi
[`openclaw node`](/cli/node).

Sottocomandi:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Note sull'autenticazione:

- `node` risolve l'autenticazione gateway da env/config (nessun flag `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, poi `gateway.auth.*`. In modalità locale, l'host nodo ignora intenzionalmente `gateway.remote.*`; in `gateway.mode=remote`, `gateway.remote.*` partecipa secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host nodo considera solo le variabili env `OPENCLAW_GATEWAY_*`.

## Nodi

`nodes` comunica con il Gateway e si rivolge ai nodi associati. Vedi [/nodes](/nodes).

Opzioni comuni:

- `--url`, `--token`, `--timeout`, `--json`

Sottocomandi:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (solo Mac)

Fotocamera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + schermo:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Posizione:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI di controllo browser (Chrome/Brave/Edge/Chromium dedicato). Vedi [`openclaw browser`](/cli/browser) e lo [strumento Browser](/tools/browser).

Opzioni comuni:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Gestione:

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

Ispezione:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Azioni:

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

## Voice call

### `voicecall`

Utility per chiamate vocali fornite da plugin. Compare solo quando il plugin voice-call è installato e abilitato. Vedi [`openclaw voicecall`](/cli/voicecall).

Comandi comuni:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Ricerca nella documentazione

### `docs`

Cerca nell'indice live della documentazione di OpenClaw.

### `docs [query...]`

Cerca nell'indice live della documentazione.

## TUI

### `tui`

Apre l'interfaccia terminale collegata al Gateway.

Opzioni:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (predefinito `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
