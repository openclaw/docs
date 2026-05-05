---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Utilizzare i pacchetti di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, parlato, trascrizione realtime, voce
realtime, comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca web
e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni**. La maggior parte dei plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm resta supportato per installazioni dirette e per un
insieme temporaneo di pacchetti plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi da copiare e incollare di installazione, elenco, disinstallazione, aggiornamento e pubblicazione, consulta
[Gestire i plugin](/it/plugins/manage-plugins).

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

    Poi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa in chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable` riservati al proprietario
    attivano il ricaricatore della configurazione del Gateway. Il Gateway ricarica le superfici runtime
    dei plugin nel processo, e i nuovi turni degli agenti ricostruiscono il proprio elenco di strumenti dal
    registro aggiornato. `/plugins install` modifica il codice sorgente del plugin, quindi il
    Gateway richiede un riavvio invece di fingere che il processo corrente possa
    ricaricare in sicurezza moduli già importati.

  </Step>

  <Step title="Verifica il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti, servizi, metodi gateway,
    hook o comandi CLI di proprietà del plugin registrati. `inspect` semplice è un controllo a freddo
    di manifest/registro ed evita intenzionalmente di importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, esplicito
`clawhub:<pkg>`, esplicito `npm:<pkg>`, esplicito `git:<repo>` oppure specifica di pacchetto
semplice tramite npm.

Se la configurazione non è valida, l’installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L’unica eccezione di ripristino è un percorso ristretto di
reinstallazione di plugin in bundle per i plugin che scelgono
`openclaw.install.allowInvalidConfigRecovery`.
Durante l’avvio del Gateway, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione
non valida. Esegui `openclaw doctor --fix` per mettere in quarantena la configurazione errata del plugin
disabilitando quella voce del plugin e rimuovendo il relativo payload di configurazione non valido; il normale
backup della configurazione conserva i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più rilevabile ma lo
stesso ID plugin obsoleto rimane nella configurazione del plugin o nei record di installazione, l’avvio del Gateway
registra avvisi e salta quel canale invece di bloccare ogni altro canale.
Esegui `openclaw doctor --fix` per rimuovere le voci obsolete di canale/plugin; le chiavi di
canale sconosciute senza evidenza di plugin obsoleto continuano a non superare la validazione, così gli errori di battitura restano
visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti sono trattati come inerti:
l’avvio del Gateway salta il lavoro di rilevamento/caricamento dei plugin e `openclaw doctor` conserva
la configurazione plugin disabilitata invece di rimuoverla automaticamente. Riabilita i plugin prima di
eseguire la pulizia con doctor se vuoi rimuovere gli ID plugin obsoleti.

L’installazione delle dipendenze dei plugin avviene solo durante flussi espliciti di installazione/aggiornamento o
riparazione con doctor. Avvio del Gateway, ricaricamento della configurazione e ispezione runtime non
eseguono gestori di pacchetti né riparano alberi di dipendenze. I plugin locali devono già
avere le proprie dipendenze installate, mentre i plugin npm, git e ClawHub vengono
installati sotto le root di plugin gestite da OpenClaw. Le dipendenze npm possono essere elevate
all’interno della root npm gestita da OpenClaw; installazione/aggiornamento esegue una scansione di quella root gestita prima
della fiducia e la disinstallazione rimuove i pacchetti gestiti da npm tramite npm. I plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere il `dependencyStatus` statico per ogni
plugin visibile senza importare codice runtime o riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per il
ciclo di vita al momento dell’installazione.

Per le installazioni npm, selettori mutabili come `latest` o un dist-tag vengono risolti
prima dell’installazione e poi fissati alla versione esatta verificata nella root npm
gestita da OpenClaw. Al termine di npm, OpenClaw verifica che la voce installata di
`package-lock.json` corrisponda ancora alla versione risolta e all’integrità. Se
npm scrive metadati di pacchetto diversi, l’installazione fallisce e il pacchetto gestito
viene ripristinato invece di accettare un artefatto plugin diverso.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per modificare plugin in bundle,
esegui `pnpm install`; OpenClaw poi carica i plugin in bundle da
`extensions/<id>` così modifiche e dipendenze locali del pacchetto vengono usate direttamente.
Le installazioni npm nella root semplice sono per OpenClaw pacchettizzato, non per lo sviluppo
da checkout sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                      | Esempi                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue in-process         | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare plugin](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare all’interno della directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
inferito, come da `src/index.ts` a `dist/index.js`.
Le installazioni pacchettizzate devono distribuire quell’output runtime JavaScript. Il fallback al sorgente
TypeScript è per checkout sorgente e percorsi di sviluppo locali, non per
pacchetti npm installati nella root di plugin gestita da OpenClaw.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano negli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce di `extensions`. Elenchi non corrispondenti fanno fallire installazione e
rilevamento del plugin invece di ricadere silenziosamente sui percorsi sorgente. Se pubblichi anche
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

ClawHub è il percorso di distribuzione principale per la maggior parte dei plugin. Le release pacchettizzate
correnti di OpenClaw includono già molti plugin ufficiali, quindi questi non richiedono
installazioni npm separate nelle configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw distribuisce ancora alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni più vecchie/personalizzate e flussi di lavoro npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da una linea di pacchetti esterni più vecchia. Usa il plugin in bundle di
OpenClaw corrente o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

| Plugin          | Pacchetto                  | Documentazione                             |
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
    - `memory-core` — ricerca memoria in bundle (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine basata su LanceDB con richiamo/cattura automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/it/plugins/memory-lancedb) per configurazione di embedding compatibile con OpenAI,
    esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider di parlato (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser in bundle per lo strumento browser, CLI `openclaw browser`, metodo gateway `browser.request`, runtime browser e servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi plugin di terze parti? Consulta [Plugin della community](/it/plugins/community).

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

| Campo              | Descrizione                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Interruttore principale (predefinito: `true`)             |
| `allow`            | Lista consentita di Plugin (opzionale)                    |
| `bundledDiscovery` | Modalita di rilevamento dei Plugin in bundle (`allowlist` per impostazione predefinita) |
| `deny`             | Lista negata di Plugin (opzionale; il blocco prevale)     |
| `load.paths`       | File/directory di plugin aggiuntivi                       |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Toggle + configurazione per singolo Plugin                |

`plugins.allow` e esclusivo. Quando non e vuoto, solo i plugin elencati possono essere caricati
o esporre strumenti, anche se `tools.allow` contiene `"*"` o il nome di uno strumento
specifico di proprieta di un plugin. Se una allowlist di strumenti fa riferimento a strumenti di plugin, aggiungi gli id dei plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` segnala questa
forma.

`plugins.bundledDiscovery` assume il valore predefinito `"allowlist"` per le nuove configurazioni, quindi un
inventario `plugins.allow` restrittivo blocca anche i plugin provider in bundle omessi,
incluso il rilevamento del provider di ricerca web a runtime. Durante la migrazione, Doctor contrassegna
le configurazioni allowlist restrittive piu vecchie con `"compat"`, cosi gli upgrade mantengono
il comportamento legacy dei provider in bundle finche l'operatore non sceglie la modalita piu rigorosa.
Un `plugins.allow` vuoto viene comunque trattato come non impostato/aperto.

Le modifiche alla configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei Plugin del Gateway. I nuovi turni dell'agente ricostruiscono il loro elenco di strumenti dal
registro plugin aggiornato. Le operazioni che modificano le sorgenti, come install,
update e uninstall, riavviano comunque il processo Gateway perche i moduli plugin gia importati
non possono essere sostituiti in modo sicuro sul posto.

`openclaw plugins list` e uno snapshot locale del registro/configurazione dei plugin. Un plugin
`enabled` li significa che il registro persistito e la configurazione corrente consentono al
plugin di partecipare. Non prova che un Gateway remoto gia in esecuzione
sia stato ricaricato o riavviato con lo stesso codice plugin. Nelle configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano il ricaricamento al processo
`openclaw gateway run` effettivo, oppure usa `openclaw gateway restart` sul
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` puo mettere in quarantena la voce non valida disabilitandola e rimuovendo il payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che puntano
    di nuovo alle directory dei Plugin in bundle pacchettizzati di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere questi alias obsoleti.
  </Step>

  <Step title="Plugin del workspace">
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

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i Plugin in bundle dall'albero
compilato `dist/extensions`. Se una directory sorgente di un Plugin in bundle viene
montata in bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente in bundle e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i cicli container dei maintainer
senza riportare ogni Plugin in bundle alle sorgenti TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgenti.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin in bundle seguono l'insieme integrato attivo per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni Plugin in bundle opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie di proprieta del plugin, come un riferimento a modello provider, una configurazione canale o un runtime
  harness
- La configurazione plugin obsoleta viene preservata mentre `plugins.enabled: false` e attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini di plugin separati:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin app-server Codex
  in bundle viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL, profilo, percorso di configurazione e processo del Gateway attivo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice dei plugin. Nei container wrapper,
  il PID 1 potrebbe essere solo un supervisore; riavvia o invia un segnale al processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni hook e
  diagnostica. Gli hook di conversazione non in bundle come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output assistente.
- Per la prova del modello effettivo della sessione, usa `openclaw sessions` o le
  superfici sessione/stato del Gateway e, durante il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti plugin

Se i turni agente sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging trace e
controlla le righe di temporizzazione delle factory degli strumenti plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti plugin piu lente,
inclusi id plugin, nomi strumenti dichiarati, forma del risultato e se lo strumento e
opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory degli strumenti plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli strumenti plugin per risoluzioni ripetute
con lo stesso contesto di richiesta effettivo. La chiave di cache include la configurazione
runtime effettiva, workspace, id agente/sessione, policy sandbox, impostazioni browser,
contesto di consegna, identita del richiedente e stato di proprieta, quindi le factory che
dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un plugin domina le temporizzazioni, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel plugin. Gli autori di Plugin dovrebbero spostare
il caricamento costoso delle dipendenze dietro il percorso di esecuzione dello strumento invece di farlo
dentro la factory dello strumento.

### Proprieta duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Significa che piu di un plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa piu comune e un plugin canale esterno
installato accanto a un Plugin in bundle che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, cosi i metadati persistiti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id plugin a priorita inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato e accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione plugin
  obsoleta.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene quella richiesta e
  segnala il conflitto. Scegli un proprietario per il canale o rinomina gli strumenti di proprieta del plugin
  in modo che la superficie runtime sia non ambigua.

## Slot Plugin (categorie esclusive)

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
| `memory`        | Plugin Active Memory       | `memory-core`       |
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

I plugin in bundle vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio i provider di modelli in bundle, i provider vocali in bundle e il plugin browser in bundle). Altri plugin in bundle richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato esistente o un pacchetto di hook. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riusa il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta, così l'installazione esplicita è caricabile subito dopo il riavvio.

OpenClaw conserva un registry locale persistente dei plugin come modello di lettura a freddo per l'inventario dei plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registry dopo aver modificato lo stato dei plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione durevoli in `installRecords` di primo livello e metadati di manifest ricostruibili in `plugins`. Se il registry manca, è obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la sua vista dei manifest da record di installazione, policy di configurazione e metadati di manifest/package senza caricare i moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una specifica di package npm con un dist-tag o una versione esatta risolve il nome del package tornando al record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri. Passare il nome del package senza versione riporta un'installazione esatta con pin alla linea di rilascio predefinita del registry. Se il plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record dei plugin npm e ClawHub sulla linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcuna release beta del plugin. Versioni esatte e tag espliciti restano con pin.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi positivi dello scanner integrato di codice pericoloso. Consente alle installazioni e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti `critical` integrati, ma non bypassa comunque i blocchi di policy `before_install` dei plugin o il blocco per errore di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test inclusi nei package; gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skills supportate dal Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle Skills da ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard di ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di riesaminare il plugin o di rendere pubblica una release bloccata.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin. Il supporto runtime attuale include Skills di bundle, command-skill Claude, impostazioni predefinite `settings.json` di Claude, impostazioni predefinite `.lsp.json` di Claude e `lspServers` dichiarate nel manifest, command-skill Cursor e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più le voci server MCP e LSP supportate o non supportate per i plugin supportati da bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repo GitHub o un URL git. Per i marketplace remoti, le voci dei plugin devono restare all'interno del repo marketplace clonato e usare solo sorgenti con percorso relativo.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin. Il loader ripiega ancora su `activate(api)` per i plugin più vecchi, ma i plugin in bundle e i nuovi plugin esterni dovrebbero trattare `register` come contratto pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità       | Significato                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                                  |
| `discovery`    | Rilevamento capacità in sola lettura. Registra provider e metadati; il codice entry attendibile del plugin può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`   | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                                        |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                          |
| `cli-metadata` | Solo raccolta dei metadati dei comandi CLI.                                                                                               |

Le entry dei plugin che aprono socket, database, worker in background o client longevi dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery vengono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono il registry Gateway in esecuzione. La discovery non è attivante, non priva di import: OpenClaw può valutare la entry attendibile del plugin o il modulo plugin del canale per creare lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi full-runtime.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                    |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)        |
| `registerChannel`                       | Canale chat                      |
| `registerTool`                          | Strumento agente                 |
| `registerHook` / `on(...)`              | Hook del ciclo di vita           |
| `registerSpeechProvider`                | Text-to-speech / STT             |
| `registerRealtimeTranscriptionProvider` | STT in streaming                 |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex             |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio        |
| `registerImageGenerationProvider`       | Generazione di immagini          |
| `registerMusicGenerationProvider`       | Generazione musicale             |
| `registerVideoGenerationProvider`       | Generazione video                |
| `registerWebFetchProvider`              | Provider web fetch / scrape      |
| `registerWebSearchProvider`             | Ricerca web                      |
| `registerHttpRoute`                     | Endpoint HTTP                    |
| `registerCommand` / `registerCli`       | Comandi CLI                      |
| `registerContextEngine`                 | Motore di contesto               |
| `registerService`                       | Servizio in background           |

Comportamento di guardia degli hook per hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è una no-op e non annulla una cancellazione precedente.

L'app-server nativo Codex fa da bridge dagli eventi strumento nativi Codex verso questa superficie di hook. I plugin possono bloccare gli strumenti nativi Codex tramite `before_tool_call`, osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex. Il confine esatto del supporto runtime Codex vive nel [contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, vedi la [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) — crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un Plugin
- [Internals dei Plugin](/it/plugins/architecture) — modello delle capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
