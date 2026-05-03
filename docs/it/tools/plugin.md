---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Lavorare con i bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:45:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, skills, sintesi vocale, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, fetch web, ricerca web
e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni**. La maggior parte dei plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm resta supportato per installazioni dirette e per un
insieme temporaneo di pacchetti plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi da copiare e incollare di installazione, elenco, disinstallazione, aggiornamento
e pubblicazione, vedi [Gestire i plugin](/it/plugins/manage-plugins).

<Steps>
  <Step title="Vedere cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installare un plugin">
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

  <Step title="Riavviare il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa via chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati al proprietario,
    attivano il ricaricatore della configurazione del Gateway. Il Gateway ricarica le superfici
    runtime dei plugin nel processo, e i nuovi turni degli agenti ricostruiscono il proprio elenco
    di strumenti dal registro aggiornato. `/plugins install` modifica il codice sorgente del plugin,
    quindi il Gateway richiede un riavvio invece di fingere che il processo corrente possa
    ricaricare in sicurezza moduli già importati.

  </Step>

  <Step title="Verificare il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi gateway,
    hook o comandi CLI di proprietà del plugin. Il semplice `inspect` è un controllo a freddo
    di manifest/registro ed evita intenzionalmente di importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso risolutore della CLI: percorso/archivio locale, esplicito
`clawhub:<pkg>`, esplicito `npm:<pkg>`, esplicito `git:<repo>`, oppure specifica di pacchetto semplice
tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è uno stretto percorso di reinstallazione
dei plugin inclusi per i plugin che scelgono di aderire a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida.
Esegui `openclaw doctor --fix` per mettere in quarantena la configurazione errata del plugin
disabilitando quella voce plugin e rimuovendo il relativo payload di configurazione non valido; il normale
backup della configurazione conserva i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più individuabile ma lo
stesso id plugin obsoleto resta nella configurazione plugin o nei record di installazione, l'avvio del Gateway
registra avvisi e salta quel canale invece di bloccare tutti gli altri canali.
Esegui `openclaw doctor --fix` per rimuovere le voci canale/plugin obsolete; le chiavi di canale sconosciute
senza evidenza di plugin obsoleto falliscono comunque la validazione, così gli errori di battitura restano
visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti sono trattati come inerti:
l'avvio del Gateway salta il lavoro di scoperta/caricamento dei plugin e `openclaw doctor` conserva
la configurazione plugin disabilitata invece di rimuoverla automaticamente. Riabilita i plugin prima
di eseguire la pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti di installazione/aggiornamento
o riparazione con doctor. L'avvio del Gateway, la ricarica della configurazione e l'ispezione runtime non
eseguono package manager né riparano alberi di dipendenze. I plugin locali devono avere già
le proprie dipendenze installate, mentre i plugin npm, git e ClawHub sono
installati nelle root plugin gestite di OpenClaw. Le dipendenze npm possono essere spostate
nella root npm gestita di OpenClaw; install/update scandisce quella root gestita prima della fiducia
e uninstall rimuove i pacchetti gestiti da npm tramite npm. I plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere lo `dependencyStatus` statico per ogni
plugin visibile senza importare codice runtime o riparare dipendenze.
Vedi [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per il
ciclo di vita in fase di installazione.

Per le installazioni npm, selettori mutabili come `latest` o un dist-tag vengono risolti
prima dell'installazione e poi fissati alla versione verificata esatta nella root npm
gestita di OpenClaw. Al termine di npm, OpenClaw verifica che la voce
`package-lock.json` installata corrisponda ancora alla versione risolta e all'integrità. Se
npm scrive metadati di pacchetto diversi, l'installazione fallisce e il pacchetto gestito
viene ripristinato invece di accettare un artefatto plugin diverso.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui plugin inclusi,
esegui `pnpm install`; OpenClaw caricherà quindi i plugin inclusi da
`extensions/<id>` così le modifiche e le dipendenze locali del pacchetto vengono usate direttamente.
Le installazioni npm root semplici sono per OpenClaw pacchettizzato, non per lo sviluppo
da checkout sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                      | Esempi                                                |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nel processo       | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare plugin](/it/plugins/building-plugins)
e dalla [Panoramica dell'SDK dei plugin](/it/plugins/sdk-overview).

## Entrypoint dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare dentro la directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
dedotto, per esempio da `src/index.ts` a `dist/index.js`.
Le installazioni pacchettizzate devono includere quell'output runtime JavaScript. Il fallback
al sorgente TypeScript è per checkout sorgente e percorsi di sviluppo locali, non per
pacchetti npm installati nella root plugin gestita di OpenClaw.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano negli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Elenchi non corrispondenti fanno fallire
l'installazione e la scoperta del plugin invece di ripiegare silenziosamente sui percorsi sorgente. Se pubblichi anche
`openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il suo peer
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

ClawHub è il percorso di distribuzione primario per la maggior parte dei plugin. Le release
OpenClaw pacchettizzate correnti includono già molti plugin ufficiali, quindi quelli non richiedono
installazioni npm separate nelle configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw distribuirà ancora alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni vecchie/personalizzate e workflow npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da una vecchia linea di pacchetti esterna. Usa il plugin incluso da
OpenClaw corrente o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

| Plugin          | Pacchetto                  | Documentazione                            |
| --------------- | -------------------------- | ----------------------------------------- |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/it/channels/bluebubbles)      |
| Discord         | `@openclaw/discord`        | [Discord](/it/channels/discord)              |
| Feishu          | `@openclaw/feishu`         | [Feishu](/it/channels/feishu)                |
| Matrix          | `@openclaw/matrix`         | [Matrix](/it/channels/matrix)                |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/it/channels/mattermost)        |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/it/channels/msteams)      |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/it/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/it/channels/nostr)                  |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/it/channels/synology-chat)  |
| Tlon            | `@openclaw/tlon`           | [Tlon](/it/channels/tlon)                    |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/it/channels/whatsapp)            |
| Zalo            | `@openclaw/zalo`           | [Zalo](/it/channels/zalo)                    |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/it/plugins/zalouser)        |

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
    - `memory-lancedb` — memoria a lungo termine basata su LanceDB con richiamo/acquisizione automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per configurazione di embedding compatibile con OpenAI,
    esempi Ollama, limiti di richiamo e risoluzione dei problemi.

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

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)             |
| `allow`          | allowlist dei plugin (opzionale)                          |
| `deny`           | denylist dei plugin (opzionale; deny ha precedenza)       |
| `load.paths`     | File/directory di plugin aggiuntivi                       |
| `slots`          | Selettori di slot esclusivi (es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruttori + configurazione per plugin                  |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i plugin elencati possono essere caricati
o esporre strumenti, anche se `tools.allow` contiene `"*"` o un nome di strumento
posseduto da un plugin specifico. Se una allowlist di strumenti fa riferimento a strumenti di plugin, aggiungi gli ID dei plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa di questa
forma.

Le modifiche di configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei plugin del Gateway. I nuovi turni degli agenti ricostruiscono il loro elenco di strumenti dal
registro dei plugin aggiornato. Le operazioni che modificano il codice sorgente, come installazione,
aggiornamento e disinstallazione, riavviano ancora il processo Gateway perché i moduli
plugin già importati non possono essere sostituiti in modo sicuro sul posto.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un plugin
`enabled` in quel punto significa che il registro persistente e la configurazione corrente consentono al
plugin di partecipare. Non prova che un Gateway remoto già in esecuzione
sia stato ricaricato o riavviato con lo stesso codice plugin. Nelle configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano il ricaricamento al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` sul
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un ID plugin che la discovery non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il suo payload di configurazione.

</Accordion>

## Discovery e precedenza

OpenClaw cerca i plugin in questo ordine (la prima corrispondenza vince):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che puntano
    di nuovo alle directory dei plugin in bundle pacchettizzate proprie di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere quegli alias obsoleti.
  </Step>

  <Step title="Plugin dell'area di lavoro">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin in bundle">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono l'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i plugin in bundle dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin in bundle viene
montata tramite bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente in bundle e la scopre prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop container dei maintainer
senza riportare ogni plugin in bundle al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di discovery/caricamento dei plugin
- `plugins.deny` ha sempre precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dall'area di lavoro sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin in bundle seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin in bundle opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un riferimento a modello provider, una configurazione di canale o un runtime
  harness
- La configurazione obsoleta dei plugin viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli ID obsoleti
- Le route Codex della famiglia OpenAI mantengono confini plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex
  in bundle viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin compare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico di chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL,
  profilo, percorso di configurazione e processo del Gateway attivo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche di installazione/configurazione/codice del plugin. Nei container wrapper,
  il PID 1 potrebbe essere solo un supervisore; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare le registrazioni degli hook e
  la diagnostica. Gli hook di conversazione non in bundle come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione del modello
  per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per la prova del modello di sessione effettivo, usa `openclaw sessions` o le
  superfici session/status del Gateway e, durante il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti plugin

Se i turni agente sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging di traccia e
controlla le righe di timing delle factory degli strumenti plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale della factory e le factory di strumenti plugin più lente,
inclusi ID plugin, nomi degli strumenti dichiarati, forma del risultato e se lo strumento è
opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory di strumenti plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory di strumenti plugin per risoluzioni ripetute
con lo stesso contesto di richiesta effettivo. La chiave cache include la configurazione runtime
effettiva, l'area di lavoro, gli ID agente/sessione, la policy sandbox, le impostazioni del browser,
il contesto di consegna, l'identità del richiedente e lo stato di proprietà, quindi le factory che
dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un plugin domina il timing, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel plugin. Gli autori di plugin dovrebbero spostare
il caricamento costoso delle dipendenze dietro il percorso di esecuzione dello strumento invece di farlo
dentro la factory dello strumento.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa più comune è un plugin di canale esterno
installato accanto a un plugin in bundle che ora fornisce lo stesso ID canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche di installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso ID canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'ID plugin a priorità inferiore. Consulta [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita una delle due parti con
  `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw conserva quella richiesta e
  segnala il conflitto. Scegli un proprietario per il canale o rinomina gli strumenti posseduti dal plugin
  in modo che la superficie runtime sia non ambigua.

## Slot plugin (categorie esclusive)

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

| Slot            | Cosa controlla                 | Predefinito          |
| --------------- | ------------------------------ | -------------------- |
| `memory`        | Plugin di memoria attiva       | `memory-core`        |
| `contextEngine` | Motore di contesto attivo      | `legacy` (integrato) |

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

openclaw plugins install <package>         # install from npm by default
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

I plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso). Altri plugin inclusi richiedono ancora `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o un hook pack esistente. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiarlo sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta, così l'installazione esplicita è immediatamente caricabile dopo il riavvio.

OpenClaw mantiene un registro locale persistente dei plugin come modello di lettura a freddo per l'inventario dei plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato dei plugin. Lo stesso file `plugins/installs.json` conserva i metadati durevoli di installazione in `installRecords` di primo livello e i metadati di manifest ricostruibili in `plugins`. Se il registro manca, è obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la vista manifest dai record di installazione, dalla policy di configurazione e dai metadati di manifest/pacchetto senza caricare i moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto tornando al record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri. Passare il nome del pacchetto senza versione sposta un'installazione fissata a una versione esatta di nuovo sulla linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record dei plugin npm e ClawHub sulla linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste una release beta del plugin. Le versioni esatte e i tag espliciti restano fissati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni dal marketplace persistono i metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi positivi dello scanner integrato di codice pericoloso. Consente alle installazioni e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti `critical` integrati, ma non aggira comunque i blocchi di policy `before_install` dei plugin né il blocco per errori di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati; gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skills supportate dal Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle skill da ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di scansionare di nuovo il plugin né rende pubblica una release bloccata.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin. Il supporto runtime attuale include Skills nei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers` dichiarate nel manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità bundle rilevate più le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. Per i marketplace remoti, le voci dei plugin devono restare all'interno del repository marketplace clonato e usare solo sorgenti con percorsi relativi.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API dei Plugin

I plugin nativi esportano un oggetto entry che espone `register(api)`. I plugin più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi plugin dovrebbero usare `register`.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin. Il loader continua a ripiegare su `activate(api)` per i plugin più vecchi, ma i plugin inclusi e i nuovi plugin esterni dovrebbero considerare `register` il contratto pubblico.

`api.registrationMode` indica a un plugin perché il suo entry viene caricato:

| Modalità        | Significato                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                           |
| `discovery`     | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice entry del plugin attendibile può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite un entry di setup leggero.                                            |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche l'entry runtime.                                                     |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                        |

Gli entry dei plugin che aprono socket, database, worker in background o client a lunga durata dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery vengono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery non attiva, ma non è priva di import: OpenClaw può valutare l'entry del plugin attendibile o il modulo del plugin di canale per costruire lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi full-runtime.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                   |
| --------------------------------------- | ------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)       |
| `registerChannel`                       | Canale chat                     |
| `registerTool`                          | Strumento agente                |
| `registerHook` / `on(...)`              | Hook del ciclo di vita          |
| `registerSpeechProvider`                | Text-to-speech / STT            |
| `registerRealtimeTranscriptionProvider` | STT in streaming                |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex            |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio       |
| `registerImageGenerationProvider`       | Generazione di immagini         |
| `registerMusicGenerationProvider`       | Generazione di musica           |
| `registerVideoGenerationProvider`       | Generazione di video            |
| `registerWebFetchProvider`              | Provider di web fetch / scrape  |
| `registerWebSearchProvider`             | Ricerca web                     |
| `registerHttpRoute`                     | Endpoint HTTP                   |
| `registerCommand` / `registerCli`       | Comandi CLI                     |
| `registerContextEngine`                 | Motore di contesto              |
| `registerService`                       | Servizio in background          |

Comportamento di guardia degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella un annullamento precedente.

L'app-server Codex nativo collega gli eventi degli strumenti nativi Codex a questa superficie di hook. I plugin possono bloccare gli strumenti nativi Codex tramite `before_tool_call`, osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex. Il confine esatto del supporto runtime Codex si trova nel [contratto di supporto harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, vedi la [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Interni dei plugin](/it/plugins/architecture) — modello delle capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
