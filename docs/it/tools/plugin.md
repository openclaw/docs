---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere il rilevamento dei Plugin e le regole di caricamento
    - Lavorare con bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T08:36:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, Skills, sintesi vocale, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca web
e altro. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni**. La maggior parte dei plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm resta supportato per le installazioni dirette e per un
insieme temporaneo di pacchetti plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Verifica il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi gateway,
    hook o comandi CLI di proprietà del plugin. Il semplice `inspect` è un controllo a freddo
    di manifesto/registro ed evita intenzionalmente di importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso risolutore della CLI: percorso/archivio locale, esplicito
`clawhub:<pkg>`, esplicito `npm:<pkg>`, esplicito `git:<repo>` o specifica di pacchetto
semplice (prima ClawHub, poi fallback npm).

Se la configurazione non è valida, l’installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L’unica eccezione di ripristino è un percorso ristretto di
reinstallazione dei plugin inclusi per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l’avvio del Gateway, la configurazione non valida per un plugin viene isolata a quel plugin:
l’avvio registra il problema `plugins.entries.<id>.config`, salta quel plugin durante il
caricamento e mantiene online gli altri plugin e canali. Esegui `openclaw doctor --fix`
per mettere in quarantena la configurazione errata del plugin disabilitando quella voce del plugin e rimuovendo
il payload di configurazione non valido; il normale backup della configurazione conserva i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più individuabile ma lo stesso
id plugin obsoleto rimane nella configurazione del plugin o nei record di installazione, l’avvio del Gateway
registra avvisi e salta quel canale invece di bloccare ogni altro canale.
Esegui `openclaw doctor --fix` per rimuovere le voci di canale/plugin obsolete; le chiavi di
canale sconosciute senza evidenza di plugin obsoleto continuano a fallire la validazione, così gli errori di battitura restano
visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti sono trattati come inerti:
l’avvio del Gateway salta il lavoro di scoperta/caricamento dei plugin e `openclaw doctor` preserva
la configurazione del plugin disabilitato invece di rimuoverla automaticamente. Riabilita i plugin prima di
eseguire la pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L’installazione delle dipendenze dei plugin avviene solo durante flussi espliciti di installazione/aggiornamento o
riparazione con doctor. Avvio del Gateway, ricaricamento della configurazione e ispezione runtime non
eseguono package manager né riparano alberi di dipendenze. I plugin locali devono già
avere le loro dipendenze installate, mentre i plugin npm, git e ClawHub vengono
installati nelle root plugin gestite da OpenClaw. Le dipendenze npm possono essere spostate
all’interno della root npm gestita da OpenClaw; installazione/aggiornamento scansiona quella root gestita prima
della fiducia e la disinstallazione rimuove i pacchetti gestiti da npm tramite npm. I plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Vedi [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per il
ciclo di vita al momento dell’installazione.

I checkout del sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui plugin inclusi,
esegui `pnpm install`; OpenClaw carica quindi i plugin inclusi da
`extensions/<id>`, così le modifiche e le dipendenze locali del pacchetto vengono usate direttamente.
Le installazioni root npm semplici sono per OpenClaw pacchettizzato, non per lo sviluppo
da checkout del sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                    | Esempi                                                |
| ---------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nello stesso processo | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi appaiono in `openclaw plugins list`. Vedi [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare all’interno della directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
dedotto, come da `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano negli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Elenchi non corrispondenti fanno fallire l’installazione e
la scoperta del plugin invece di ricadere silenziosamente sui percorsi sorgente. Se
pubblichi anche `openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il suo peer
JavaScript compilato; quel file è obbligatorio quando dichiarato.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin ufficiali

### Pacchetti npm di proprietà di OpenClaw durante la migrazione

ClawHub è il percorso di distribuzione principale per la maggior parte dei plugin. Le release
OpenClaw pacchettizzate attuali includono già molti plugin ufficiali, quindi non richiedono
installazioni npm separate nelle configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non
sarà migrato a ClawHub, OpenClaw distribuisce ancora alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni più vecchie/personalizzate e flussi di lavoro npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da una serie di pacchetti esterni più vecchia. Usa il plugin incluso in
OpenClaw attuale o un checkout locale finché non viene pubblicato un pacchetto npm più nuovo.

| Plugin          | Pacchetto                  | Documentazione                              |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/it/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/it/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/it/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/it/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/it/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/it/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/it/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/it/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/it/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/it/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/it/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/it/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/it/plugins/zalouser)         |

### Core (distribuiti con OpenClaw)

<AccordionGroup>
  <Accordion title="Provider di modelli (abilitati per impostazione predefinita)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin di memoria">
    - `memory-core` — ricerca in memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine basata su LanceDB con richiamo/cattura automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione
    degli embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi plugin di terze parti? Vedi [Plugin della community](/it/plugins/community).

## Configurazione

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descrizione                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)             |
| `allow`          | Allowlist dei plugin (opzionale)                          |
| `deny`           | Denylist dei plugin (opzionale; deny ha la precedenza)    |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazioni + configurazione per plugin                   |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i plugin elencati possono caricarsi
o esporre strumenti, anche se `tools.allow` contiene `"*"` o uno specifico nome di
strumento di proprietà del plugin. Se un’allowlist degli strumenti fa riferimento a strumenti del plugin, aggiungi gli id plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa su questa
forma.

Le modifiche di configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con controllo
della configurazione + riavvio nello stesso processo abilitato (il percorso predefinito `openclaw gateway`), quel
riavvio viene in genere eseguito automaticamente poco dopo la scrittura della configurazione.
Non esiste un percorso di hot-reload supportato per il codice runtime dei plugin nativi o per gli
hook di ciclo di vita; riavvia il processo Gateway che serve il canale live prima
di aspettarti che il codice aggiornato `register(api)`, gli hook `api.on(...)`, strumenti, servizi o
hook di provider/runtime vengano eseguiti.

`openclaw plugins list` è un'istantanea locale del registro/configurazione dei plugin. Un plugin
`enabled` lì significa che il registro persistente e la configurazione corrente permettono al
plugin di partecipare. Non prova che un processo figlio Gateway remoto già in esecuzione
sia stato riavviato nello stesso codice del plugin. Nelle configurazioni VPS/container con
processi wrapper, invia i riavvii al processo `openclaw gateway run` effettivo,
oppure usa `openclaw gateway restart` sul Gateway in esecuzione.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il relativo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei plugin bundled pacchettizzati proprie di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere quegli alias obsoleti.
  </Step>

  <Step title="Plugin del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bundled">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i plugin bundled dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin bundled viene
montata tramite bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente bundled e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i cicli dei container dei maintainer
senza riportare ogni plugin bundled al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgenti.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin bundled seguono l'insieme predefinito integrato abilitato, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin bundled opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie di proprietà del plugin, come un riferimento a un modello provider, una configurazione di canale o un runtime
  harness
- La configurazione obsoleta dei plugin viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia con doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini di plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex bundled
  viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL
  Gateway attivo, il profilo, il percorso di configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei container
  wrapper, il PID 1 potrebbe essere solo un supervisore; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni degli hook e
  diagnostica. Gli hook di conversazione non bundled come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione del modello
  per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Come prova del modello effettivo della sessione, usa `openclaw sessions` o le superfici
  sessione/stato del Gateway e, quando esegui il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti del plugin

Se i turni dell'agente sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging trace e
controlla le righe di temporizzazione delle factory degli strumenti del plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory di strumenti plugin più lente,
inclusi id plugin, nomi degli strumenti dichiarati, forma del risultato e se lo strumento è
opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory degli strumenti plugin impiega almeno 5s.

Se un plugin domina la temporizzazione, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Quindi aggiorna, reinstalla o disabilita quel plugin. Gli autori di plugin dovrebbero spostare
il caricamento di dipendenze costose dietro il percorso di esecuzione dello strumento invece di farlo
all'interno della factory dello strumento.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome di strumento. La causa più comune è un plugin di canale esterno
installato accanto a un plugin bundled che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita uno dei due lati con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw conserva quella richiesta e
  segnala il conflitto. Scegli un solo proprietario per il canale oppure rinomina gli strumenti
  di proprietà del plugin, così la superficie runtime è non ambigua.

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Cosa controlla             | Predefinito         |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin di Active Memory    | `memory-core`       |
| `contextEngine` | Motore di contesto attivo  | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin bundled vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
provider di modelli bundled, provider vocali bundled e il plugin browser bundled).
Altri plugin bundled richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o hook pack esistente. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti di routine dei plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare sopra un target di installazione gestito.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del
plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin
è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta così che
l'installazione esplicita sia caricabile immediatamente dopo il riavvio.

OpenClaw mantiene un registro locale persistente dei plugin come modello di lettura cold per
inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver cambiato lo
stato dei plugin. Lo stesso file `plugins/installs.json` mantiene metadati durevoli di installazione in
`installRecords` di primo livello e metadati manifest ricostruibili in `plugins`. Se
il registro è mancante, obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la sua vista manifest dai record di installazione, dalla policy di configurazione e dai
metadati manifest/package senza caricare i moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
verso il record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri.
Passare il nome del pacchetto senza versione riporta un'installazione esatta pinned alla
linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace mantengono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi dello scanner integrato per codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti integrati `critical`, ma continua
a non aggirare i blocchi delle policy `before_install` dei plugin o i blocchi per errori di scansione.
Le scansioni di installazione ignorano file e directory di test comuni come `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare i mock di test inclusi nei pacchetti;
gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di
quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni
delle dipendenze delle skill supportate dal Gateway usano invece l'override di richiesta corrispondente
`dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione
delle skill da ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la
dashboard di ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo
di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina;
non chiede a ClawHub di scansionare nuovamente il plugin né rende pubblica una release bloccata.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei plugin. Il supporto runtime attuale include skill del bundle, command-skills di Claude,
valori predefiniti di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills di Cursor e directory hook
Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le funzionalità del bundle rilevate più
le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti del marketplace possono essere un nome known-marketplace di Claude da
`~/.claude/plugins/known_marketplaces.json`, una radice locale del marketplace o un percorso
`marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repo GitHub
o un URL git. Per i marketplace remoti, le voci dei plugin devono rimanere all'interno del
repo del marketplace clonato e usare solo sorgenti con percorsi relativi.

Consulta il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell'API Plugin

I plugin nativi esportano un oggetto entry che espone `register(api)`. I plugin più vecchi
possono ancora usare `activate(api)` come alias legacy, ma i nuovi plugin dovrebbero
usare `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin.
Il loader usa ancora `activate(api)` come fallback per i plugin più vecchi,
ma i plugin inclusi nel bundle e i nuovi plugin esterni dovrebbero considerare `register` come
contratto pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                        |
| `discovery`     | Rilevamento delle funzionalità in sola lettura. Registra provider e metadati; il codice entry del plugin attendibile può caricarsi, ma evita effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                              |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                 |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                     |

Le entry dei plugin che aprono socket, database, worker in background o client a lunga durata
dovrebbero proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di discovery vengono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono
il registro del Gateway in esecuzione. La discovery non attiva il plugin, ma non è priva di import:
OpenClaw può valutare la entry attendibile del plugin o il modulo del plugin del canale per costruire
lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio dei servizi
dietro percorsi full-runtime.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Provider di modello (LLM)    |
| `registerChannel`                       | Canale chat                  |
| `registerTool`                          | Strumento dell'agente        |
| `registerHook` / `on(...)`              | Hook del ciclo di vita       |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT in streaming             |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex         |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio    |
| `registerImageGenerationProvider`       | Generazione di immagini      |
| `registerMusicGenerationProvider`       | Generazione di musica        |
| `registerVideoGenerationProvider`       | Generazione di video         |
| `registerWebFetchProvider`              | Provider web fetch / scrape  |
| `registerWebSearchProvider`             | Ricerca web                  |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandi CLI                  |
| `registerContextEngine`                 | Motore di contesto           |
| `registerService`                       | Servizio in background       |

Comportamento di guardia degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una cancellazione precedente.

Il server app nativo Codex inoltra gli eventi degli strumenti nativi di Codex a questa
superficie di hook. I plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti nativi
di Codex. Il confine esatto del supporto runtime Codex si trova nel
[contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta la [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Interni dei plugin](/it/plugins/architecture) — modello delle funzionalità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
