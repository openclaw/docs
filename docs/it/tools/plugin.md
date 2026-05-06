---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere l'individuazione dei Plugin e le regole di caricamento
    - Lavorare con i bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, Skills, sintesi vocale, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca web
e altro. Alcuni Plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni**. La maggior parte dei Plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm rimane supportato per le installazioni dirette e per un
insieme temporaneo di pacchetti Plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi pronti da copiare e incollare di installazione, elenco, disinstallazione, aggiornamento e pubblicazione, consulta
[Gestire i Plugin](/it/plugins/manage-plugins).

<Steps>
  <Step title="Vedere cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installare un Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

    Quindi configura sotto `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa in chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati al proprietario,
    attivano il ricaricatore della configurazione del Gateway. Il Gateway ricarica le superfici runtime
    dei Plugin nel processo e i nuovi turni dell'agente ricostruiscono il loro elenco di strumenti dal
    registro aggiornato. `/plugins install` modifica il codice sorgente del Plugin, quindi il
    Gateway richiede un riavvio invece di fingere che il processo corrente possa
    ricaricare in sicurezza moduli già importati.

  </Step>

  <Step title="Verificare il Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi del gateway,
    hook o comandi CLI di proprietà del Plugin. Il semplice `inspect` è un controllo a freddo
    del manifesto/registro ed evita intenzionalmente di importare il runtime del Plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, esplicito
`clawhub:<pkg>`, esplicito `npm:<pkg>`, esplicito `npm-pack:<path.tgz>`,
esplicito `git:<repo>` o specifica di pacchetto semplice tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di reinstallazione dei Plugin distribuiti
per i Plugin che scelgono di aderire a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida.
Esegui `openclaw doctor --fix` per mettere in quarantena la configurazione errata del Plugin
disabilitando quella voce Plugin e rimuovendo il suo payload di configurazione non valido; il normale
backup della configurazione conserva i valori precedenti.
Quando una configurazione di canale fa riferimento a un Plugin che non è più individuabile ma lo
stesso ID Plugin obsoleto rimane nella configurazione Plugin o nei record di installazione, l'avvio del Gateway
registra avvisi e salta quel canale invece di bloccare tutti gli altri canali.
Esegui `openclaw doctor --fix` per rimuovere le voci canale/Plugin obsolete; le chiavi
di canale sconosciute senza prove di Plugin obsoleto continuano a non superare la convalida, così gli errori di digitazione restano
visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a Plugin obsoleti vengono trattati come inerti:
l'avvio del Gateway salta il lavoro di individuazione/caricamento dei Plugin e `openclaw doctor` conserva
la configurazione Plugin disabilitata invece di rimuoverla automaticamente. Riabilita i Plugin prima di
eseguire la pulizia con doctor se vuoi rimuovere gli ID Plugin obsoleti.

L'installazione delle dipendenze dei Plugin avviene solo durante flussi espliciti di installazione/aggiornamento o
riparazione con doctor. L'avvio del Gateway, la ricarica della configurazione e l'ispezione runtime non
eseguono gestori di pacchetti né riparano alberi di dipendenze. I Plugin locali devono già
avere le loro dipendenze installate, mentre i Plugin npm, git e ClawHub vengono
installati nelle radici Plugin gestite da OpenClaw. Le dipendenze npm possono essere hoistate
all'interno della radice npm gestita da OpenClaw; installazione/aggiornamento esamina quella radice gestita prima della
fiducia e la disinstallazione rimuove i pacchetti gestiti da npm tramite npm. I Plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere il `dependencyStatus` statico di ciascun
Plugin visibile senza importare codice runtime né riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution) per il
ciclo di vita in fase di installazione.

### Proprietà dei percorsi Plugin bloccati

Se la diagnostica dei Plugin indica
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la convalida della configurazione segue con `plugin present but blocked`, OpenClaw ha trovato
file Plugin di proprietà di un utente Unix diverso dal processo che li sta caricando.
Mantieni la configurazione del Plugin al suo posto; correggi la proprietà del filesystem oppure esegui
OpenClaw come lo stesso utente proprietario della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid `1000`), quindi le
directory di configurazione e workspace OpenClaw montate dal host dovrebbero normalmente essere
di proprietà dell'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la radice Plugin gestita con
proprietà root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, esegui di nuovo `openclaw doctor --fix` o
`openclaw plugins registry --refresh` affinché il registro Plugin persistito corrisponda
ai file riparati.

Per le installazioni npm, i selettori mutabili come `latest` o un dist-tag vengono risolti
prima dell'installazione e poi fissati alla versione esatta verificata nella radice npm
gestita da OpenClaw. Dopo il completamento di npm, OpenClaw verifica che la voce
`package-lock.json` installata corrisponda ancora alla versione e all'integrità risolte. Se
npm scrive metadati di pacchetto diversi, l'installazione fallisce e il pacchetto gestito
viene ripristinato invece di accettare un artefatto Plugin diverso.
Le radici npm gestite ereditano anche gli `overrides` npm a livello di pacchetto di OpenClaw, quindi
i pin di sicurezza che proteggono l'host impacchettato si applicano anche alle dipendenze Plugin
esterne hoistate.

I checkout del sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui Plugin distribuiti,
esegui `pnpm install`; OpenClaw quindi carica i Plugin distribuiti da
`extensions/<id>` così le modifiche e le dipendenze locali al pacchetto vengono usate direttamente.
Le installazioni semplici nella radice npm sono per OpenClaw impacchettato, non per lo sviluppo
da checkout del sorgente.

## Tipi di Plugin

OpenClaw riconosce due formati di Plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nel processo      | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono sotto `openclaw plugins list`. Consulta [Bundle di Plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un Plugin nativo, inizia con [Creare Plugin](/it/plugins/building-plugins)
e la [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

## Entrypoint dei pacchetti

I pacchetti npm di Plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve rimanere all'interno della directory del pacchetto e risolversi in un file runtime
leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato inferito
come da `src/index.ts` a `dist/index.js`.
Le installazioni impacchettate devono includere quell'output runtime JavaScript. Il fallback al sorgente
TypeScript è per i checkout del sorgente e i percorsi di sviluppo locale, non per
i pacchetti npm installati nella radice Plugin gestita da OpenClaw.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
necessari a OpenClaw in runtime. Si tratta di un problema di impacchettamento del Plugin, non di un problema di configurazione
locale. Aggiorna o reinstalla il Plugin dopo che l'editore ha ripubblicato JavaScript
compilato, oppure disabilita/disinstalla quel Plugin finché non è disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano agli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Elenchi non corrispondenti fanno fallire l'installazione e
l'individuazione dei Plugin invece di ripiegare silenziosamente sui percorsi sorgente. Se pubblichi anche
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

ClawHub è il percorso di distribuzione principale per la maggior parte dei Plugin. Le release impacchettate
attuali di OpenClaw includono già molti Plugin ufficiali, quindi questi non richiedono
installazioni npm separate nelle configurazioni normali. Finché tutti i Plugin di proprietà di OpenClaw non saranno
migrati a ClawHub, OpenClaw continuerà a distribuire alcuni pacchetti Plugin `@openclaw/*` su
npm per installazioni precedenti/personalizzate e flussi di lavoro npm diretti.

Se npm segnala un pacchetto Plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da una vecchia serie di pacchetti esterni. Usa il Plugin distribuito con
OpenClaw attuale o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

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
    - `memory-core` - ricerca in memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` - memoria a lungo termine basata su LanceDB con richiamo/acquisizione automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memoria LanceDB](/it/plugins/memory-lancedb) per la configurazione di
    embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` - plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo Gateway `browser.request`, il runtime browser e il servizio predefinito di controllo del browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

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
| `allow`            | Elenco di plugin consentiti (facoltativo)                 |
| `bundledDiscovery` | Modalità di rilevamento dei plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | Elenco di plugin bloccati (facoltativo; il blocco prevale) |
| `load.paths`       | File/directory di plugin aggiuntivi                       |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Abilitazioni/disabilitazioni per plugin + configurazione  |

`plugins.allow` è esclusivo. Quando non è vuoto, possono caricarsi o esporre
strumenti solo i plugin elencati, anche se `tools.allow` contiene `"*"` o il nome
specifico di uno strumento posseduto da un plugin. Se un elenco di strumenti consentiti fa riferimento a strumenti di plugin, aggiungi gli id dei plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` segnala questa
forma.

`plugins.bundledDiscovery` usa per impostazione predefinita `"allowlist"` per le nuove configurazioni, quindi un inventario
restrittivo `plugins.allow` blocca anche i plugin provider inclusi omessi,
compreso il rilevamento dei provider di ricerca web di runtime. Doctor contrassegna le configurazioni di elenchi consentiti restrittivi più vecchie con
`"compat"` durante la migrazione, così gli aggiornamenti mantengono il comportamento
legacy dei provider inclusi finché l'operatore non sceglie la modalità più rigida.
Un `plugins.allow` vuoto viene ancora trattato come non impostato/aperto.

Le modifiche di configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei plugin del Gateway. I nuovi turni agente ricostruiscono l'elenco degli strumenti dal
registro dei plugin aggiornato. Le operazioni che modificano il sorgente, come installazione,
aggiornamento e disinstallazione, riavviano ancora il processo Gateway perché i moduli plugin
già importati non possono essere sostituiti in modo sicuro sul posto.

`openclaw plugins list` è un'istantanea locale del registro/configurazione dei plugin. Un plugin
`enabled` lì significa che il registro persistente e la configurazione corrente consentono al
plugin di partecipare. Non prova che un Gateway remoto già in esecuzione
sia stato ricaricato o riavviato nello stesso codice plugin. In configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano il ricaricamento al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` contro il
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato, mancante e non valido">
  - **Disabilitato**: il plugin esiste, ma le regole di abilitazione lo hanno spento. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il suo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei plugin inclusi pacchettizzati di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere questi alias obsoleti.
  </Step>

  <Step title="Plugin dell'area di lavoro">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin inclusi">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin incluso viene
montata in bind sul percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente incluso e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i cicli container dei maintainer
senza riportare ogni plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dall'area di lavoro sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme integrato attivo per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi con attivazione esplicita vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un riferimento a modello provider, una configurazione di canale o un runtime
  harness
- La configurazione di plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex
  incluso viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook di runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di
`register(api)` non vengono eseguiti nel traffico di chat in tempo reale, controlla prima questi aspetti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL
  Gateway attivo, il profilo, il percorso di configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche di installazione/configurazione/codice del plugin. Nei container wrapper,
  PID 1 potrebbe essere solo un supervisor; riavvia o invia un segnale al processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare le registrazioni degli hook e
  la diagnostica. Gli hook di conversazione non inclusi, come `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per la prova del modello effettivo della sessione, usa `openclaw sessions` oppure le
  superfici di sessione/stato del Gateway e, quando esegui il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti dei plugin

Se i turni agente sembrano bloccarsi durante la preparazione degli strumenti, abilita la registrazione di trace e
controlla le righe di temporizzazione delle factory degli strumenti dei plugin:

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
facoltativo. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory di strumenti plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory di strumenti plugin per risoluzioni ripetute
con lo stesso contesto effettivo di richiesta. La chiave della cache include la configurazione
di runtime effettiva, area di lavoro, id agente/sessione, policy sandbox, impostazioni browser,
contesto di consegna, identità del richiedente e stato di proprietà, quindi le factory che
dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un plugin domina le tempistiche, ispeziona le sue registrazioni di runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel plugin. Gli autori di plugin dovrebbero rimandare
il caricamento costoso delle dipendenze al percorso di esecuzione dello strumento, invece di farlo
dentro la factory dello strumento.

### Proprietà duplicata di canali o strumenti

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi significano che più di un plugin abilitato sta cercando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa più comune è un plugin di canale esterno
installato accanto a un plugin incluso che ora fornisce lo stesso id canale.

Passaggi di diagnostica:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche di installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id del plugin con priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione obsoleta del
  plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene quella richiesta e
  segnala il conflitto. Scegli un proprietario per il canale oppure rinomina gli strumenti
  posseduti dal plugin, così la superficie di runtime sia non ambigua.

## Slot dei Plugin (categorie esclusive)

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

| Slot            | Cosa controlla       | Predefinito         |
| --------------- | -------------------- | ------------------- |
| `memory`        | Plugin di memoria attiva | `memory-core`       |
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

I Plugin in bundle vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio i provider di modelli in bundle, i provider vocali in bundle e il Plugin browser in bundle). Altri Plugin in bundle richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un Plugin installato esistente o un hook pack esistente. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei Plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del Plugin installato a tale allowlist prima di abilitarlo. Se lo stesso id Plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta in modo che l'installazione esplicita sia caricabile subito dopo il riavvio.

OpenClaw mantiene un registro Plugin locale persistente come modello di lettura a freddo per l'inventario dei Plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano tale registro dopo aver modificato lo stato dei Plugin. Lo stesso file `plugins/installs.json` conserva i metadati di installazione durevoli in `installRecords` di primo livello e i metadati manifest ricostruibili in `plugins`. Se il registro è mancante, obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la sua vista manifest dai record di installazione, dalla policy di configurazione e dai metadati manifest/package senza caricare i moduli runtime dei Plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Gestisci invece la selezione dei package Plugin e la configurazione tramite il sorgente Nix per l'installazione; per nix-openclaw, inizia dalla [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una spec di package npm con un dist-tag o una versione esatta risolve il nome del package tornando al record Plugin tracciato e registra la nuova spec per gli aggiornamenti futuri. Passare il nome del package senza una versione riporta un'installazione con pin esatto alla linea di rilascio predefinita del registro. Se il Plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record Plugin npm e ClawHub sulla linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcun rilascio beta del Plugin. Versioni esatte e tag espliciti restano vincolati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi positivi dallo scanner di codice pericoloso integrato. Consente alle installazioni e agli aggiornamenti dei Plugin di continuare oltre i finding `critical` integrati, ma non aggira comunque i blocchi di policy `before_install` dei Plugin né i blocchi dovuti a errori di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati; gli entrypoint runtime dichiarati dei Plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze Skills supportate dal Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione delle Skills da ClawHub.

Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard di ClawHub oppure esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di rieseguire la scansione del Plugin né di rendere pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei Plugin. Il supporto runtime attuale include Skills dei bundle, command-skills Claude, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e `lspServers` dichiarati dal manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità bundle rilevate, oltre alle voci server MCP e LSP supportate o non supportate per i Plugin basati su bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. Per marketplace remoti, le voci Plugin devono restare all'interno del repository marketplace clonato e usare solo sorgenti con percorsi relativi.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell'API Plugin

I Plugin nativi esportano un oggetto entry che espone `register(api)`. I Plugin più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi Plugin dovrebbero usare `register`.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del Plugin. Il loader continua a ripiegare su `activate(api)` per i Plugin più vecchi, ma i Plugin in bundle e i nuovi Plugin esterni dovrebbero considerare `register` il contratto pubblico.

`api.registrationMode` indica a un Plugin perché il suo entry viene caricato:

| Modalità        | Significato                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                                   |
| `discovery`     | Rilevamento di capacità in sola lettura. Registra provider e metadati; il codice entry del Plugin attendibile può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite un entry di setup leggero.                                                    |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche l'entry runtime.                                                             |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                                 |

Gli entry Plugin che aprono socket, database, worker in background o client di lunga durata dovrebbero proteggere tali effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery vengono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery è non attivante, non priva di import: OpenClaw può valutare l'entry Plugin attendibile o il modulo Plugin del canale per creare lo snapshot. Mantieni leggeri e privi di effetti collaterali i livelli superiori dei moduli e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi runtime completi.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                       |
| --------------------------------------- | ----------------------------------- |
| `registerProvider`                      | Provider di modello (LLM)           |
| `registerChannel`                       | Canale chat                         |
| `registerTool`                          | Strumento agente                    |
| `registerHook` / `on(...)`              | Hook del ciclo di vita              |
| `registerSpeechProvider`                | Text-to-speech / STT                |
| `registerRealtimeTranscriptionProvider` | STT in streaming                    |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex                |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio           |
| `registerImageGenerationProvider`       | Generazione di immagini             |
| `registerMusicGenerationProvider`       | Generazione musicale                |
| `registerVideoGenerationProvider`       | Generazione video                   |
| `registerWebFetchProvider`              | Provider web fetch / scrape         |
| `registerWebSearchProvider`             | Ricerca web                         |
| `registerHttpRoute`                     | Endpoint HTTP                       |
| `registerCommand` / `registerCli`       | Comandi CLI                         |
| `registerContextEngine`                 | Motore di contesto                  |
| `registerService`                       | Servizio in background              |

Comportamento di guardia degli hook per hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Le esecuzioni app-server native di Codex riconducono gli eventi degli strumenti nativi di Codex a questa superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`, osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi di Codex. Il limite esatto del supporto del runtime Codex si trova nel [contratto di supporto del harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzato, consulta la [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) - crea il tuo Plugin
- [Bundle Plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifest Plugin](/it/plugins/manifest) - schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti dell'agente in un Plugin
- [Interni dei Plugin](/it/plugins/architecture) - modello delle capacità e pipeline di caricamento
- [Plugin della comunità](/it/plugins/community) - elenchi di terze parti
