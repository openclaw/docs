---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Lavorare con bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-11T20:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, skills, parlato, trascrizione in tempo reale,
voce in tempo reale, comprensione dei media, generazione di immagini, generazione
di video, recupero web, ricerca web e altro ancora. Alcuni plugin sono **core**
(distribuiti con OpenClaw), altri sono **esterni**. La maggior parte dei plugin
esterni viene pubblicata e scoperta tramite [ClawHub](/it/clawhub). Npm rimane
supportato per installazioni dirette e per un insieme temporaneo di pacchetti
plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi pronti da copiare e incollare su installazione, elenco,
disinstallazione, aggiornamento e pubblicazione, consulta
[Gestire i plugin](/it/plugins/manage-plugins).

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

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa via chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable` riservati
    al proprietario attivano il ricaricatore della configurazione del Gateway.
    Il Gateway ricarica in-process le superfici runtime dei plugin e i nuovi turni
    agente ricostruiscono il proprio elenco di strumenti dal registro aggiornato.
    `/plugins install` modifica il codice sorgente del plugin, quindi il Gateway
    richiede un riavvio invece di fingere che il processo corrente possa ricaricare
    in sicurezza moduli già importati.

  </Step>

  <Step title="Verificare il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti, servizi, metodi gateway,
    hook o comandi CLI di proprietà del plugin registrati. Un semplice `inspect`
    è un controllo a freddo di manifesto/registro ed evita intenzionalmente di
    importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio
locale, `clawhub:<pkg>` esplicito, `npm:<pkg>` esplicito,
`npm-pack:<path.tgz>` esplicito, `git:<repo>` esplicito o specifica di pacchetto
semplice tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo
chiuso e ti indirizza a `openclaw doctor --fix`. L'unica eccezione di recupero è
un percorso ristretto di reinstallazione dei plugin inclusi per i plugin che
aderiscono a `openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione plugin non valida fallisce in
modo chiuso come qualsiasi altra configurazione non valida. Esegui
`openclaw doctor --fix` per mettere in quarantena la configurazione errata del
plugin disabilitando quella voce plugin e rimuovendo il suo payload di
configurazione non valido; il normale backup della configurazione conserva i
valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più
individuabile ma lo stesso id plugin obsoleto resta nella configurazione plugin
o nei record di installazione, l'avvio del Gateway registra avvisi e salta quel
canale invece di bloccare tutti gli altri canali. Esegui
`openclaw doctor --fix` per rimuovere le voci canale/plugin obsolete; le chiavi
di canale sconosciute senza evidenza di plugin obsoleto continuano a fallire la
validazione, così gli errori di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti sono
trattati come inerti: l'avvio del Gateway salta il lavoro di discovery/caricamento
dei plugin e `openclaw doctor` conserva la configurazione plugin disabilitata
invece di rimuoverla automaticamente. Riabilita i plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti
di installazione/aggiornamento o riparazione doctor. L'avvio del Gateway, il
reload della configurazione e l'ispezione runtime non eseguono package manager
né riparano alberi di dipendenze. I plugin locali devono già avere le proprie
dipendenze installate, mentre i plugin npm, git e ClawHub vengono installati
nelle root plugin gestite di OpenClaw. Le dipendenze npm possono essere hoistate
all'interno della root npm gestita di OpenClaw; install/update scandisce quella
root gestita prima del trust e uninstall rimuove tramite npm i pacchetti gestiti
da npm. I plugin esterni e i percorsi di caricamento personalizzati devono
comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere il `dependencyStatus` statico per
ogni plugin visibile senza importare codice runtime né riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution)
per il ciclo di vita in fase di installazione.

### Proprietà del percorso plugin bloccato

Se la diagnostica plugin indica
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la validazione della configurazione segue con `plugin present but blocked`,
OpenClaw ha trovato file plugin di proprietà di un utente Unix diverso dal
processo che li sta caricando. Mantieni la configurazione del plugin; correggi
la proprietà del filesystem o esegui OpenClaw come lo stesso utente proprietario
della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node`
(uid `1000`), quindi le directory di configurazione e workspace di OpenClaw
montate con bind dall'host dovrebbero normalmente essere di proprietà dell'uid
`1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la root plugin
gestita assegnandola a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, riesegui `openclaw doctor --fix` o
`openclaw plugins registry --refresh` affinché il registro plugin persistito
corrisponda ai file riparati.

Per le installazioni npm, selettori mutabili come `latest` o un dist-tag vengono
risolti prima dell'installazione e poi fissati alla versione esatta verificata
nella root npm gestita di OpenClaw. Al termine di npm, OpenClaw verifica che la
voce `package-lock.json` installata corrisponda ancora alla versione risolta e
all'integrità. Se npm scrive metadati di pacchetto diversi, l'installazione
fallisce e il pacchetto gestito viene ripristinato invece di accettare un
artefatto plugin diverso.
Le root npm gestite ereditano anche gli `overrides` npm a livello di pacchetto
di OpenClaw, quindi i pin di sicurezza che proteggono l'host pacchettizzato si
applicano anche alle dipendenze plugin esterne hoistate.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per modificare i
plugin inclusi, esegui `pnpm install`; OpenClaw carica quindi i plugin inclusi
da `extensions/<id>` così le modifiche e le dipendenze locali al pacchetto
vengono usate direttamente. Le installazioni root npm semplici sono per OpenClaw
pacchettizzato, non per lo sviluppo da checkout sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; viene eseguito in-process | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entrypoint dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in
`package.json`. Ogni voce deve restare all'interno della directory del pacchetto
e risolversi in un file runtime leggibile, oppure in un file sorgente TypeScript
con un peer JavaScript compilato inferito come da `src/index.ts` a
`dist/index.js`.
Le installazioni pacchettizzate devono distribuire quell'output runtime
JavaScript. Il fallback al sorgente TypeScript è per checkout sorgente e percorsi
di sviluppo locali, non per pacchetti npm installati nella root plugin gestita
di OpenClaw.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
necessari a OpenClaw in runtime. È un problema di packaging del plugin, non un
problema di configurazione locale. Aggiorna o reinstalla il plugin dopo che il
publisher avrà ripubblicato JavaScript compilato, oppure disabilita/disinstalla
quel plugin finché non sarà disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano
negli stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions`
deve contenere esattamente una voce per ogni voce `extensions`. Elenchi non
corrispondenti fanno fallire l'installazione e la discovery dei plugin invece di
ricadere silenziosamente sui percorsi sorgente. Se pubblichi anche
`openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il suo peer
JavaScript compilato; quel file è richiesto quando dichiarato.

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

ClawHub è il percorso di distribuzione principale per la maggior parte dei
plugin. Le release pacchettizzate correnti di OpenClaw includono già molti
plugin ufficiali, quindi nelle configurazioni normali non richiedono installazioni
npm separate. Finché tutti i plugin di proprietà di OpenClaw non saranno migrati
a ClawHub, OpenClaw distribuisce ancora alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni più vecchie/personalizzate e workflow npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione
del pacchetto proviene da un vecchio treno di pacchetti esterni. Usa il plugin
incluso nell'OpenClaw corrente o un checkout locale finché non viene pubblicato
un pacchetto npm più recente.

| Plugin          | Pacchetto                  | Documentazione                            |
| --------------- | -------------------------- | ----------------------------------------- |
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
    - `memory-core` - ricerca di memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` - memoria a lungo termine basata su LanceDB con richiamo/acquisizione automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memoria LanceDB](/it/plugins/memory-lancedb) per la configurazione degli
    embedding compatibili con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` - plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo Gateway `browser.request`, il runtime browser e il servizio predefinito di controllo del browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi plugin di terze parti? Consulta [ClawHub](/it/clawhub).

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
| `allow`            | Lista consentita dei plugin (opzionale)                   |
| `bundledDiscovery` | Modalità di rilevamento dei plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | Lista negata dei plugin (opzionale; deny prevale)         |
| `load.paths`       | File/directory plugin aggiuntivi                          |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Opzioni di attivazione + configurazione per plugin        |

`plugins.allow` è esclusivo. Quando non è vuoto, possono essere caricati
o esporre strumenti solo i plugin elencati, anche se `tools.allow` contiene `"*"` o un nome
di strumento specifico posseduto da un plugin. Se una allowlist degli strumenti fa riferimento a strumenti di plugin, aggiungi gli id dei plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa di questa
configurazione.

`plugins.bundledDiscovery` usa per impostazione predefinita `"allowlist"` per le nuove configurazioni, quindi un
inventario restrittivo `plugins.allow` blocca anche i plugin provider inclusi
omessi, incluso il rilevamento dei provider di ricerca web in runtime. Doctor contrassegna le configurazioni allowlist
restrittive più vecchie con `"compat"` durante la migrazione, in modo che gli aggiornamenti mantengano
il comportamento legacy dei provider inclusi finché l'operatore non sceglie la modalità più restrittiva.
Un `plugins.allow` vuoto è ancora trattato come non impostato/aperto.

Le modifiche di configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei plugin del Gateway. I nuovi turni agente ricostruiscono la loro lista di strumenti dal
registro dei plugin aggiornato. Le operazioni che modificano il sorgente, come installazione,
aggiornamento e disinstallazione, riavviano comunque il processo Gateway perché i moduli plugin
già importati non possono essere sostituiti in sicurezza sul posto.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un plugin
`enabled` lì significa che il registro persistito e la configurazione corrente consentono al
plugin di partecipare. Non prova che un Gateway remoto già in esecuzione
sia stato ricaricato o riavviato con lo stesso codice plugin. In configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano il ricaricamento al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` sul
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei plugin: disabilitato, mancante, non valido">
  - **Disabilitato**: il plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il suo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei plugin inclusi confezionati di OpenClaw vengono ignorati;
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
    Altri richiedono l'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni confezionate e le immagini Docker normalmente risolvono i plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin incluso viene
montata con bind sopra il percorso sorgente confezionato corrispondente, ad esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente incluso e la rileva prima del bundle confezionato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop container dei maintainer
senza riportare ogni plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist confezionati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dall'area di lavoro sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme integrato abilitato per impostazione predefinita salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta da un plugin, come un riferimento modello provider, una configurazione di canale o un runtime
  harness
- La configurazione plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex
  incluso è selezionato dai riferimenti agente canonici `openai/*`, da
  `agentRuntime.id: "codex"` provider/modello espliciti o dai riferimenti modello legacy `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico di chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL
  Gateway attivo, il profilo, il percorso di configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice dei plugin. Nei container
  wrapper, PID 1 potrebbe essere solo un supervisore; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni hook e
  diagnostica. Gli hook di conversazione non inclusi come `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per la prova del modello di sessione effettivo, usa `openclaw sessions` o le
  superfici sessione/stato del Gateway e, durante il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti plugin

Se i turni agente sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging trace e
controlla le righe dei tempi delle factory degli strumenti plugin:

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
almeno 1 s o la preparazione totale delle factory di strumenti plugin impiega almeno 5 s.

OpenClaw memorizza nella cache i risultati riusciti delle factory di strumenti plugin per risoluzioni ripetute
con lo stesso contesto di richiesta effettivo. La chiave della cache include la configurazione runtime
effettiva, l'area di lavoro, gli id agente/sessione, la policy sandbox, le impostazioni browser,
il contesto di consegna, l'identità del richiedente e lo stato di proprietà, quindi le factory che
dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un plugin domina i tempi, ispeziona le sue registrazioni runtime:

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

Questi indicano che più di un plugin abilitato sta cercando di possedere lo stesso canale,
flusso di configurazione o nome di strumento. La causa più comune è un plugin canale esterno
installato accanto a un plugin incluso che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, in modo che i metadati persistiti riflettano l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id plugin a priorità più bassa. Consulta [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene quella richiesta e
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

| Slot            | Cosa controlla             | Predefinito          |
| --------------- | -------------------------- | -------------------- |
| `memory`        | Plugin di memoria attivo   | `memory-core`        |
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

I Plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il Plugin browser incluso). Altri Plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un Plugin installato esistente o un hook pack. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei Plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare su una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del Plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id Plugin è presente in `plugins.deny`, l'installazione rimuove quella voce di deny obsoleta, così l'installazione esplicita è caricabile subito dopo il riavvio.

OpenClaw mantiene un registro locale persistente dei Plugin come modello di lettura a freddo per inventario dei Plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato dei Plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione durevoli in `installRecords` di primo livello e metadati di manifest ricostruibili in `plugins`. Se il registro manca, è obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la sua vista dei manifest da record di installazione, policy di configurazione e metadati di manifest/package senza caricare moduli runtime dei Plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutator del ciclo di vita dei Plugin sono disabilitati. Gestisci invece la selezione dei package Plugin e la configurazione tramite il sorgente Nix dell'installazione; per nix-openclaw, inizia dalla [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una spec di package npm con un dist-tag o una versione esatta risolve il nome del package tornando al record del Plugin tracciato e registra la nuova spec per gli aggiornamenti futuri. Passare il nome del package senza una versione riporta un'installazione esatta fissata alla linea di rilascio predefinita del registro. Se il Plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record Plugin npm e ClawHub sulla linea predefinita provano prima `@beta` e tornano a default/latest quando non esiste alcun rilascio beta del Plugin. Le versioni esatte e i tag espliciti restano fissati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi positivi dello scanner integrato di codice pericoloso. Consente a installazioni e aggiornamenti dei Plugin di proseguire oltre i risultati `critical` integrati, ma non aggira comunque i blocchi di policy `before_install` dei Plugin o i blocchi per errore di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test confezionati; gli entrypoint runtime dichiarati dei Plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze Skills basate su Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione delle Skills da ClawHub.

Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard ClawHub oppure esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di rieseguire la scansione del Plugin né di rendere pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei Plugin. Il supporto runtime attuale include Skills dei bundle, Skills di comando Claude, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e `lspServers` dichiarati dal manifest, Skills di comando Cursor e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più le voci server MCP e LSP supportate o non supportate per Plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto Claude da `~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub oppure un URL git. Per i marketplace remoti, le voci Plugin devono rimanere all'interno del repository marketplace clonato e usare solo sorgenti con percorsi relativi.

Consulta il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del Plugin. Il loader ripiega ancora su `activate(api)` per i Plugin più vecchi, ma i Plugin inclusi e i nuovi Plugin esterni dovrebbero considerare `register` il contratto pubblico.

`api.registrationMode` indica a un Plugin perché il suo entry viene caricato:

| Modalità        | Significato                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                                  |
| `discovery`     | Discovery delle capacità in sola lettura. Registra provider e metadati; il codice entry del Plugin attendibile può caricarsi, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di setup del canale tramite un entry di setup leggero.                                                           |
| `setup-runtime` | Caricamento del setup del canale che richiede anche l'entry runtime.                                                                      |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                              |

Gli entry Plugin che aprono socket, database, worker in background o client a lunga vita dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery sono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery è non attivante, non priva di import: OpenClaw può valutare l'entry Plugin attendibile o il modulo Plugin del canale per costruire lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi full-runtime.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                         |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)             |
| `registerChannel`                       | Canale chat                           |
| `registerTool`                          | Strumento agente                      |
| `registerHook` / `on(...)`              | Hook del ciclo di vita                |
| `registerSpeechProvider`                | Text-to-speech / STT                  |
| `registerRealtimeTranscriptionProvider` | STT in streaming                      |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex                  |
| `registerMediaUnderstandingProvider`    | Analisi immagini/audio                |
| `registerImageGenerationProvider`       | Generazione immagini                  |
| `registerMusicGenerationProvider`       | Generazione musica                    |
| `registerVideoGenerationProvider`       | Generazione video                     |
| `registerWebFetchProvider`              | Provider di web fetch / scraping      |
| `registerWebSearchProvider`             | Ricerca web                           |
| `registerHttpRoute`                     | Endpoint HTTP                         |
| `registerCommand` / `registerCli`       | Comandi CLI                           |
| `registerContextEngine`                 | Motore di contesto                    |
| `registerService`                       | Servizio in background                |

Comportamento delle guardie hook per hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non elimina un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non elimina un annullamento precedente.

L'app-server Codex nativo esegue il bridge degli eventi degli strumenti nativi di Codex verso questa
superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti
nativi di Codex. Il confine esatto del supporto del runtime Codex si trova nel
[contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

Per il comportamento completo dei hook tipizzati, consulta la [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) - crea il tuo Plugin
- [Bundle Plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifesto del Plugin](/it/plugins/manifest) - schema del manifesto
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti agente in un Plugin
- [Interni dei Plugin](/it/plugins/architecture) - modello di capability e pipeline di caricamento
- [ClawHub](/it/clawhub) - discovery di Plugin di terze parti
