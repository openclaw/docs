---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Lavorare con bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T21:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, Skills, parlato, trascrizione in tempo reale,
voce in tempo reale, comprensione dei media, generazione di immagini, generazione
di video, recupero web, ricerca web e altro. Alcuni Plugin sono **core**
(distribuiti con OpenClaw), altri sono **esterni**. La maggior parte dei Plugin
esterni viene pubblicata e scoperta tramite [ClawHub](/it/tools/clawhub). Npm rimane
supportato per le installazioni dirette e per un insieme temporaneo di pacchetti
Plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi da copiare e incollare per installare, elencare, disinstallare,
aggiornare e pubblicare, consulta [Gestire i Plugin](/it/plugins/manage-plugins).

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un Plugin">
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

    Poi configura sotto `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa della chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati
    al proprietario, attivano il ricaricatore della configurazione del Gateway.
    Il Gateway ricarica le superfici runtime dei Plugin nel processo, e i nuovi
    turni degli agenti ricostruiscono il loro elenco di strumenti dal registro
    aggiornato. `/plugins install` modifica il codice sorgente del Plugin, quindi
    il Gateway richiede un riavvio invece di fingere che il processo corrente
    possa ricaricare in modo sicuro moduli già importati.

  </Step>

  <Step title="Verifica il Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti, servizi, metodi del gateway,
    hook o comandi CLI di proprietà del Plugin registrati. Il semplice `inspect`
    è un controllo a freddo di manifest/registro ed evita intenzionalmente di
    importare il runtime del Plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo della chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio
locale, `clawhub:<pkg>` esplicito, `npm:<pkg>` esplicito, `git:<repo>` esplicito,
o specifica di pacchetto non qualificata tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo
sicuro e ti indirizza a `openclaw doctor --fix`. L'unica eccezione di ripristino
è un percorso ristretto di reinstallazione dei Plugin distribuiti con OpenClaw
per i Plugin che scelgono di aderire a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, la configurazione non valida di un Plugin viene
isolata a quel Plugin: l'avvio registra il problema di `plugins.entries.<id>.config`,
salta quel Plugin durante il caricamento e mantiene online gli altri Plugin e
canali. Esegui `openclaw doctor --fix` per mettere in quarantena la configurazione
errata del Plugin disabilitando quella voce del Plugin e rimuovendo il payload di
configurazione non valido; il normale backup della configurazione conserva i
valori precedenti.
Quando una configurazione di canale fa riferimento a un Plugin che non è più
rilevabile, ma lo stesso id obsoleto del Plugin rimane nella configurazione dei
Plugin o nei record di installazione, l'avvio del Gateway registra avvisi e salta
quel canale invece di bloccare tutti gli altri canali. Esegui `openclaw doctor --fix`
per rimuovere le voci obsolete di canale/Plugin; le chiavi di canale sconosciute
senza prova di Plugin obsoleto continuano a non superare la validazione, così gli
errori di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a Plugin obsoleti vengono
trattati come inerti: l'avvio del Gateway salta il lavoro di scoperta/caricamento
dei Plugin e `openclaw doctor` conserva la configurazione dei Plugin disabilitati
invece di rimuoverla automaticamente. Riabilita i Plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli id di Plugin obsoleti.

L'installazione delle dipendenze dei Plugin avviene solo durante flussi espliciti
di installazione/aggiornamento o riparazione con doctor. L'avvio del Gateway, la
ricarica della configurazione e l'ispezione runtime non eseguono package manager
né riparano alberi di dipendenze. I Plugin locali devono già avere le loro
dipendenze installate, mentre i Plugin npm, git e ClawHub vengono installati sotto
le radici Plugin gestite da OpenClaw. Le dipendenze npm possono essere issate
all'interno della radice npm gestita da OpenClaw; installazione/aggiornamento
scansiona quella radice gestita prima di considerarla affidabile e la
disinstallazione rimuove i pacchetti gestiti da npm tramite npm. I Plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati
tramite `openclaw plugins install`. Usa `openclaw plugins list --json` per vedere
lo `dependencyStatus` statico di ogni Plugin visibile senza importare codice
runtime o riparare dipendenze. Consulta [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution)
per il ciclo di vita al momento dell'installazione.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui
Plugin distribuiti con OpenClaw, esegui `pnpm install`; OpenClaw carica quindi i
Plugin distribuiti da `extensions/<id>` così le modifiche e le dipendenze locali
del pacchetto vengono usate direttamente. Le installazioni della radice npm
semplici sono per OpenClaw pacchettizzato, non per lo sviluppo da checkout sorgente.

## Tipi di Plugin

OpenClaw riconosce due formati di Plugin:

| Formato    | Come funziona                                                     | Esempi                                                 |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nel processo      | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono sotto `openclaw plugins list`. Consulta [Bundle dei Plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un Plugin nativo, inizia da [Creare Plugin](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di Plugin nativi devono dichiarare `openclaw.extensions` in
`package.json`. Ogni voce deve rimanere all'interno della directory del pacchetto
e risolversi in un file runtime leggibile, oppure in un file sorgente TypeScript
con un peer JavaScript compilato inferito, come da `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano
negli stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions`
deve contenere esattamente una voce per ogni voce di `extensions`. Elenchi non
corrispondenti fanno fallire l'installazione e la scoperta dei Plugin invece di
ripiegare silenziosamente sui percorsi sorgente. Se pubblichi anche
`openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il suo peer JavaScript
compilato; quel file è obbligatorio quando dichiarato.

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

ClawHub è il percorso di distribuzione principale per la maggior parte dei Plugin.
Le versioni pacchettizzate correnti di OpenClaw includono già molti Plugin
ufficiali, quindi questi non richiedono installazioni npm separate nelle
configurazioni normali. Finché ogni Plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw continuerà a distribuire alcuni pacchetti Plugin
`@openclaw/*` su npm per installazioni precedenti/personalizzate e flussi di lavoro
npm diretti.

Se npm segnala un pacchetto Plugin `@openclaw/*` come deprecato, quella versione
del pacchetto proviene da un vecchio treno di pacchetti esterni. Usa il Plugin
distribuito con OpenClaw corrente o un checkout locale finché non viene pubblicato
un pacchetto npm più recente.

| Plugin          | Pacchetto                  | Documentazione                            |
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
    - `memory-core` — ricerca nella memoria distribuita con OpenClaw (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine basata su LanceDB con richiamo/cattura automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione degli
    embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e risoluzione
    dei problemi.

  </Accordion>

  <Accordion title="Provider di parlato (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — Plugin browser distribuito con OpenClaw per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi Plugin di terze parti? Consulta [Plugin della community](/it/plugins/community).

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
| `allow`          | allowlist dei Plugin (opzionale)                          |
| `deny`           | denylist dei Plugin (opzionale; deny ha la precedenza)    |
| `load.paths`     | File/directory di Plugin aggiuntivi                       |
| `slots`          | Selettori di slot esclusivi (es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazioni per Plugin + configurazione                   |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i Plugin elencati possono
caricare o esporre strumenti, anche se `tools.allow` contiene `"*"` o un nome di
strumento specifico di proprietà di un Plugin. Se una allowlist di strumenti fa
riferimento a strumenti di Plugin, aggiungi gli id dei Plugin proprietari a
`plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa di questa
forma.

Le modifiche alla configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano una ricarica in-process dei Plugin del Gateway. I nuovi turni degli agenti ricostruiscono il proprio elenco di strumenti dal registro dei plugin aggiornato. Le operazioni che modificano il sorgente, come installazione, aggiornamento e disinstallazione, riavviano comunque il processo Gateway perché i moduli plugin già importati non possono essere sostituiti in sicurezza sul posto.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un plugin `enabled` in quel punto significa che il registro persistente e la configurazione corrente consentono al plugin di partecipare. Non dimostra che un Gateway remoto già in esecuzione sia stato ricaricato o riavviato con lo stesso codice plugin. In configurazioni VPS/container con processi wrapper, invia i riavvii o le scritture che attivano la ricarica al processo effettivo `openclaw gateway run`, oppure usa `openclaw gateway restart` sul Gateway in esecuzione quando la ricarica segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il relativo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei plugin bundled pacchettizzati di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere quegli alias obsoleti.
  </Step>

  <Step title="Plugin dell'area di lavoro">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bundled">
    Inclusi con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono l'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i plugin bundled dall'albero compilato `dist/extensions`. Se una directory sorgente di un plugin bundled viene montata tramite bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio `/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata come overlay del sorgente bundled e la rileva prima del bundle pacchettizzato `/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop container dei manutentori senza riportare ogni plugin bundled al sorgente TypeScript. Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin bundled seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin bundled opt-in vengono abilitati automaticamente quando la configurazione nomina una superficie di proprietà del plugin, come un riferimento a modello provider, una configurazione di canale o un runtime harness
- La configurazione plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex bundled viene selezionato da `agentRuntime.id: "codex"` o da riferimenti modello legacy `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)` non vengono eseguiti nel traffico chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL Gateway attivo, profilo, percorso di configurazione e processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei container wrapper, PID 1 potrebbe essere solo un supervisore; riavvia o invia un segnale al processo figlio `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni degli hook e diagnostica. Gli hook di conversazione non bundled come `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end` richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione del modello per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo di modello produce output dell'assistente.
- Per verificare il modello di sessione effettivo, usa `openclaw sessions` o le superfici sessione/status del Gateway e, durante il debug dei payload provider, avvia il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti plugin

Se i turni degli agenti sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging di traccia e controlla le righe di timing delle factory degli strumenti plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti plugin più lente, inclusi id plugin, nomi degli strumenti dichiarati, forma del risultato e se lo strumento è opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory richiede almeno 1s o la preparazione totale delle factory degli strumenti plugin richiede almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli strumenti plugin per risoluzioni ripetute con lo stesso contesto di richiesta effettivo. La chiave cache include la configurazione runtime effettiva, workspace, id agente/sessione, policy sandbox, impostazioni del browser, contesto di consegna, identità del richiedente e stato di proprietà, quindi le factory che dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un plugin domina il timing, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel plugin. Gli autori di plugin dovrebbero spostare il caricamento costoso delle dipendenze dietro il percorso di esecuzione dello strumento invece di farlo dentro la factory dello strumento.

### Proprietà duplicata di canali o strumenti

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Significano che più di un plugin abilitato sta tentando di possedere lo stesso canale, flusso di configurazione o nome strumento. La causa più comune è un plugin di canale esterno installato accanto a un plugin bundled che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso pacchetti plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con l'id del plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita una parte con `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene quella richiesta e segnala il conflitto. Scegli un solo proprietario per il canale oppure rinomina gli strumenti di proprietà del plugin in modo che la superficie runtime sia non ambigua.

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

| Slot            | Cosa controlla           | Predefinito          |
| --------------- | ------------------------ | -------------------- |
| `memory`        | Plugin di memoria attiva | `memory-core`        |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

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

I plugin bundled vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio provider di modelli bundled, provider vocali bundled e il plugin browser bundled). Altri plugin bundled richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o un hook pack esistente. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta in modo che l'installazione esplicita sia caricabile immediatamente dopo il riavvio.

OpenClaw mantiene un registro Plugin locale persistente come modello di lettura a freddo per
l'inventario dei Plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo
stato del Plugin. Lo stesso file `plugins/installs.json` conserva i metadati di installazione durevoli in
`installRecords` di primo livello e i metadati del manifest ricostruibili in `plugins`. Se
il registro è mancante, obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la vista del manifest dai record di installazione, dalla policy di configurazione e dai
metadati di manifest/pacchetto senza caricare i moduli runtime dei Plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
riconducendolo al record del Plugin tracciato e registra la nuova specifica per gli aggiornamenti futuri.
Passare il nome del pacchetto senza una versione riporta un'installazione bloccata su una versione esatta
alla linea di rilascio predefinita del registro. Se il Plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record Plugin npm e ClawHub
sulla linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcun rilascio
beta del Plugin. Le versioni esatte e i tag espliciti restano bloccati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace conservano i metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi dello scanner di codice pericoloso integrato. Consente alle installazioni di Plugin
e agli aggiornamenti di Plugin di proseguire oltre i risultati `critical` integrati, ma continua
a non aggirare i blocchi della policy `before_install` dei Plugin o i blocchi per errore di scansione.
Le scansioni di installazione ignorano file e directory di test comuni come `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati;
gli entrypoint runtime dichiarati dei Plugin vengono comunque scansionati anche se usano uno di
quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le installazioni
di dipendenze delle skill supportate dal Gateway usano invece l'override di richiesta
`dangerouslyForceUnsafeInstall` corrispondente, mentre `openclaw skills install` rimane il flusso separato
di download/installazione delle skill da ClawHub.

Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la
dashboard di ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo
di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua
macchina; non chiede a ClawHub di riesaminare il Plugin né rende pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei Plugin. Il supporto runtime attuale include skill bundle, command-skill Claude,
impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e
`lspServers` dichiarate dal manifest, command-skill Cursor e directory hook
Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più
le voci server MCP e LSP supportate o non supportate per i Plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto Claude da
`~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso
`marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub
o un URL git. Per i marketplace remoti, le voci Plugin devono rimanere all'interno del
repository marketplace clonato e usare solo sorgenti con percorsi relativi.

Consulta il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell'API Plugin

I Plugin nativi esportano un oggetto entry che espone `register(api)`. I Plugin
più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi Plugin dovrebbero
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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del Plugin.
Il loader ripiega ancora su `activate(api)` per i Plugin più vecchi,
ma i Plugin in bundle e i nuovi Plugin esterni dovrebbero considerare `register` il
contratto pubblico.

`api.registrationMode` indica a un Plugin perché il suo entry viene caricato:

| Modalità        | Significato                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                           |
| `discovery`     | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice entry del Plugin attendibile può caricarsi, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite un entry di configurazione leggero.                                  |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche l'entry runtime.                                                     |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                        |

Gli entry Plugin che aprono socket, database, worker in background o client a lunga durata
dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di discovery sono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono
il registro Gateway in esecuzione. Discovery non attiva, ma non è priva di import:
OpenClaw può valutare l'entry Plugin attendibile o il modulo Plugin del canale per costruire
lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi
dietro percorsi runtime completi.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                 |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Provider di modello (LLM)     |
| `registerChannel`                       | Canale chat                   |
| `registerTool`                          | Strumento agent               |
| `registerHook` / `on(...)`              | Hook del ciclo di vita        |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT in streaming              |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex          |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio     |
| `registerImageGenerationProvider`       | Generazione di immagini       |
| `registerMusicGenerationProvider`       | Generazione di musica         |
| `registerVideoGenerationProvider`       | Generazione di video          |
| `registerWebFetchProvider`              | Provider di fetch / scraping web |
| `registerWebSearchProvider`             | Ricerca web                   |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Comandi CLI                   |
| `registerContextEngine`                 | Motore di contesto            |
| `registerService`                       | Servizio in background        |

Comportamento delle guardie hook per gli hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non elimina una cancellazione precedente.

Il server app Codex nativo inoltra gli eventi degli strumenti nativi Codex a questa
superficie hook. I Plugin possono bloccare gli strumenti Codex nativi tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex.
Il confine esatto del supporto runtime Codex si trova nel
[contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta la [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — crea il tuo Plugin
- [Bundle Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest Plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione di strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agent in un Plugin
- [Interni dei Plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
