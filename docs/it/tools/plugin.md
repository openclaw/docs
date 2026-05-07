---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere il rilevamento dei Plugin e le regole di caricamento
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, skills, sintesi vocale, trascrizione realtime,
voce realtime, comprensione dei media, generazione di immagini, generazione di
video, fetch web, ricerca web e altro. Alcuni plugin sono **core** (distribuiti
con OpenClaw), altri sono **esterni**. La maggior parte dei plugin esterni viene
pubblicata e scoperta tramite [ClawHub](/it/tools/clawhub). Npm resta supportato
per le installazioni dirette e per un insieme temporaneo di pacchetti plugin
di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi pronti da copiare e incollare per installazione, elenco,
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
    # Cerca plugin ClawHub
    openclaw plugins search "calendar"

    # Da ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # Da npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # Da git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # Da una directory o un archivio locale
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Riavviare il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Poi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa via chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati
    al proprietario, attivano il ricaricatore della configurazione del Gateway.
    Il Gateway ricarica le superfici runtime dei plugin nel processo, e i nuovi
    turni degli agenti ricostruiscono il loro elenco di strumenti dal registro
    aggiornato. `/plugins install` modifica il codice sorgente del plugin, quindi
    il Gateway richiede un riavvio invece di fingere che il processo corrente
    possa ricaricare in modo sicuro moduli già importati.

  </Step>

  <Step title="Verificare il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # Se il plugin ha registrato una radice CLI, esegui un comando da quella radice.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi
    del gateway, hook o comandi CLI di proprietà del plugin. `inspect` semplice
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
`npm-pack:<path.tgz>` esplicito, `git:<repo>` esplicito, oppure specifica di
pacchetto semplice tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo
chiuso e ti indirizza a `openclaw doctor --fix`. L'unica eccezione di ripristino
è un percorso ristretto di reinstallazione per plugin in bundle che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, la configurazione plugin non valida fallisce in modo
chiuso come qualsiasi altra configurazione non valida. Esegui
`openclaw doctor --fix` per mettere in quarantena la configurazione errata del
plugin disabilitando quella voce del plugin e rimuovendo il relativo payload di
configurazione non valido; il normale backup della configurazione conserva i
valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più
individuabile ma lo stesso id plugin obsoleto resta nella configurazione plugin
o nei record di installazione, l'avvio del Gateway registra avvisi e salta quel
canale invece di bloccare tutti gli altri canali. Esegui
`openclaw doctor --fix` per rimuovere le voci di canale/plugin obsolete; le
chiavi di canale sconosciute senza prove di plugin obsoleti continuano a
fallire la validazione, così gli errori di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti vengono
trattati come inerti: l'avvio del Gateway salta il lavoro di discovery/caricamento
dei plugin e `openclaw doctor` conserva la configurazione plugin disabilitata
invece di rimuoverla automaticamente. Riabilita i plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti
di installazione/aggiornamento o riparazione doctor. L'avvio del Gateway, la
ricarica della configurazione e l'ispezione runtime non eseguono package manager
né riparano alberi di dipendenze. I plugin locali devono già avere le proprie
dipendenze installate, mentre i plugin npm, git e ClawHub vengono installati
nelle radici plugin gestite da OpenClaw. Le dipendenze npm possono essere
innalzate nella radice npm gestita da OpenClaw; installazione/aggiornamento
scansiona quella radice gestita prima del trust e la disinstallazione rimuove i
pacchetti gestiti da npm tramite npm. I plugin esterni e i percorsi di caricamento
personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere il `dependencyStatus` statico per
ogni plugin visibile senza importare codice runtime o riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution)
per il ciclo di vita al momento dell'installazione.

### Proprietà dei percorsi plugin bloccati

Se la diagnostica dei plugin segnala
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la validazione della configurazione continua con `plugin present but blocked`,
OpenClaw ha trovato file plugin posseduti da un utente Unix diverso dal processo
che li sta caricando. Mantieni la configurazione del plugin al suo posto; correggi
la proprietà del filesystem o esegui OpenClaw come lo stesso utente proprietario
della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid
`1000`), quindi le directory di configurazione e workspace di OpenClaw montate in
bind dall'host dovrebbero normalmente essere possedute dall'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la root del plugin gestito
con proprietario root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, esegui di nuovo `openclaw doctor --fix` o
`openclaw plugins registry --refresh` in modo che il registro dei plugin persistito corrisponda
ai file riparati.

Per le installazioni npm, i selettori mutabili come `latest` o una dist-tag vengono risolti
prima dell'installazione e poi fissati alla versione esatta verificata nella root npm
gestita da OpenClaw. Al termine di npm, OpenClaw verifica che la voce
`package-lock.json` installata corrisponda ancora alla versione risolta e all'integrità. Se
npm scrive metadati del pacchetto diversi, l'installazione fallisce e il pacchetto gestito
viene ripristinato invece di accettare un artefatto plugin diverso.
Le root npm gestite ereditano anche gli `overrides` npm a livello di pacchetto di OpenClaw, quindi
i pin di sicurezza che proteggono l'host pacchettizzato si applicano anche alle dipendenze
plugin esterne hoistate.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per modificare i plugin
inclusi, esegui `pnpm install`; OpenClaw caricherà quindi i plugin inclusi da
`extensions/<id>` così le modifiche e le dipendenze locali del pacchetto verranno usate direttamente.
Le installazioni root npm semplici sono per OpenClaw pacchettizzato, non per lo sviluppo
da checkout sorgente.

## Tipi di Plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nello stesso processo | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi appaiono in `openclaw plugins list`. Vedi [Bundle di Plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare Plugin](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entrypoint dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare all'interno della directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
dedotto, come da `src/index.ts` a `dist/index.js`.
Le installazioni pacchettizzate devono includere quell'output runtime JavaScript. Il fallback
al sorgente TypeScript è per i checkout sorgente e i percorsi di sviluppo locali, non per
i pacchetti npm installati nella root plugin gestita da OpenClaw.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
di cui OpenClaw ha bisogno a runtime. È un problema di pacchettizzazione del plugin, non un problema
di configurazione locale. Aggiorna o reinstalla il plugin dopo che il publisher ha ripubblicato
JavaScript compilato, oppure disabilita/disinstalla quel plugin finché non sarà disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano negli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Liste non corrispondenti fanno fallire l'installazione e
il rilevamento del plugin invece di ripiegare silenziosamente sui percorsi sorgente. Se pubblichi anche
`openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il relativo peer
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

ClawHub è il percorso di distribuzione principale per la maggior parte dei plugin. Le release
OpenClaw pacchettizzate attuali includono già molti plugin ufficiali, quindi questi non richiedono
installazioni npm separate nelle configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw continua a distribuire alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni meno recenti/personalizzate e workflow npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da un treno di pacchetti esterno più vecchio. Usa il plugin incluso in
OpenClaw attuale o un checkout locale finché non verrà pubblicato un pacchetto npm più recente.

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

### Core (distribuito con OpenClaw)

<AccordionGroup>
  <Accordion title="Provider di modelli (abilitati per impostazione predefinita)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin di memoria">
    - `memory-core` - ricerca in memoria inclusa (predefinito tramite `plugins.slots.memory`)
    - `memory-lancedb` - memoria a lungo termine basata su LanceDB con richiamo/acquisizione automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione di
    embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` - Plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo Gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi Plugin di terze parti? Vedi [Plugin della community](/it/plugins/community).

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
| `allow`            | allowlist dei Plugin (opzionale)                          |
| `bundledDiscovery` | Modalità di rilevamento dei Plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | denylist dei Plugin (opzionale; deny ha la precedenza)    |
| `load.paths`       | File/directory Plugin aggiuntivi                          |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Attivazioni per Plugin + configurazione                   |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i Plugin elencati possono essere caricati
o esporre strumenti, anche se `tools.allow` contiene `"*"` o un nome di strumento specifico
posseduto da un Plugin. Se una allowlist di strumenti fa riferimento a strumenti Plugin, aggiungi gli ID dei Plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa su questa
forma.

`plugins.bundledDiscovery` usa come predefinito `"allowlist"` per le nuove configurazioni, quindi un
inventario `plugins.allow` restrittivo blocca anche i Plugin provider inclusi
omessi, incluso il rilevamento runtime dei provider di ricerca web. Doctor marca le vecchie
configurazioni restrittive con allowlist con `"compat"` durante la migrazione, così gli upgrade mantengono
il comportamento legacy dei provider inclusi finché l'operatore non sceglie la modalità più rigorosa.
Un `plugins.allow` vuoto è ancora trattato come non impostato/aperto.

Le modifiche di configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei Plugin del Gateway. I nuovi turni degli agenti ricostruiscono l'elenco degli strumenti dal
registro Plugin aggiornato. Le operazioni che modificano il sorgente, come installazione,
aggiornamento e disinstallazione, riavviano ancora il processo Gateway perché i moduli Plugin
già importati non possono essere sostituiti in modo sicuro sul posto.

`openclaw plugins list` è uno snapshot locale di registro/configurazione Plugin. Un Plugin
`enabled` lì significa che il registro persistente e la configurazione corrente consentono al
Plugin di partecipare. Non dimostra che un Gateway remoto già in esecuzione
sia stato ricaricato o riavviato con lo stesso codice Plugin. Su configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano il ricaricamento al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` sul
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il Plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione è preservata.
  - **Mancante**: la configurazione fa riferimento a un ID Plugin che il rilevamento non ha trovato.
  - **Non valido**: il Plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel Plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il relativo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i Plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei Plugin inclusi nel pacchetto di OpenClaw vengono ignorati;
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
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i Plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un Plugin incluso viene
montata bind sul percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente incluso e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop container dei maintainer
senza riportare ogni Plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i Plugin e salta il lavoro di rilevamento/caricamento dei Plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel Plugin
- I Plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin inclusi seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del Plugin selezionato per quello slot
- Alcuni Plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta da un Plugin, come un riferimento modello provider, una configurazione canale o un runtime
  harness
- La configurazione Plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i Plugin prima di eseguire la pulizia con doctor se vuoi rimuovere gli ID obsoleti
- Le route Codex della famiglia OpenAI mantengono confini Plugin separati:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin app-server Codex
  incluso viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un Plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico live chat, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL
  Gateway attivo, profilo, percorso di configurazione e processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche di installazione/configurazione/codice dei Plugin. Nei container
  wrapper, PID 1 potrebbe essere solo un supervisor; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni hook e
  diagnostica. Gli hook di conversazione non inclusi, come `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output assistant.
- Per la prova del modello di sessione effettivo, usa `openclaw sessions` o le
  superfici sessione/stato del Gateway e, quando esegui il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti Plugin

Se i turni agente sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging trace e
controlla le righe di temporizzazione delle factory degli strumenti Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory di strumenti Plugin più lente,
inclusi ID Plugin, nomi degli strumenti dichiarati, forma del risultato e se lo strumento è
opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory di strumenti Plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory di strumenti Plugin per risoluzioni ripetute
con lo stesso contesto di richiesta effettivo. La chiave della cache include la configurazione runtime
effettiva, workspace, ID agente/sessione, policy sandbox, impostazioni browser,
contesto di consegna, identità del richiedente e stato di proprietà, quindi le factory che
dipendono da quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un Plugin domina la temporizzazione, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel Plugin. Gli autori di Plugin dovrebbero spostare
il caricamento costoso delle dipendenze dietro il percorso di esecuzione dello strumento invece di farlo
dentro la factory dello strumento.

### Proprietà duplicata di canali o strumenti

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi messaggi indicano che più di un Plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa più comune è un Plugin canale esterno
installato accanto a un Plugin incluso che ora fornisce lo stesso ID canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni Plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni Plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti Plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche di installazione, registro o configurazione.

Opzioni di correzione:

- Se un Plugin sostituisce intenzionalmente un altro per lo stesso ID canale, il
  Plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'ID Plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita una delle parti con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione Plugin
  obsoleta.
- Se hai abilitato esplicitamente entrambi i Plugin, OpenClaw mantiene quella richiesta e
  segnala il conflitto. Scegli un proprietario per il canale o rinomina gli strumenti posseduti dai Plugin
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

| Slot            | Che cosa controlla   | Predefinito         |
| --------------- | -------------------- | ------------------- |
| `memory`        | Plugin di memoria attivo | `memory-core`       |
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

I plugin integrati vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio i provider di modelli integrati, i provider vocali integrati e il plugin browser integrato). Altri plugin integrati richiedono ancora `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato esistente o un pacchetto di hook. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare su una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin installato a quell'allowlist prima di abilitarlo. Se lo stesso id del plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta così che l'installazione esplicita sia caricabile subito dopo il riavvio.

OpenClaw mantiene un registro locale dei plugin persistente come modello di lettura a freddo per l'inventario dei plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato dei plugin. Lo stesso file `plugins/installs.json` mantiene metadati di installazione durevoli in `installRecords` di livello superiore e metadati di manifest ricostruibili in `plugins`. Se il registro è mancante, obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la sua vista dei manifest dai record di installazione, dai criteri di configurazione e dai metadati di manifest/pacchetto senza caricare i moduli runtime dei plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei plugin sono disabilitati. Gestisci invece la selezione dei pacchetti plugin e la configurazione tramite la sorgente Nix per l'installazione; per nix-openclaw, inizia dalla [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto riconducendolo al record del plugin tracciato e registra la nuova specifica per gli aggiornamenti futuri. Passare il nome del pacchetto senza una versione riporta un'installazione bloccata esatta alla linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record dei plugin npm e ClawHub della linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcun rilascio beta del plugin. Le versioni esatte e i tag espliciti restano bloccati.

OpenClaw non espone ancora canali plugin LTS o di supporto mensile. Il lavoro pianificato sulla linea di supporto mensile richiederà che i tag npm e ClawHub dei plugin seguano la stessa linea di supporto del pacchetto core invece di usare silenziosamente `latest`.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è una deroga di emergenza per falsi positivi dello scanner integrato di codice pericoloso. Consente alle installazioni e agli aggiornamenti dei plugin di proseguire oltre i risultati `critical` integrati, ma non aggira comunque i blocchi dei criteri `before_install` dei plugin o il blocco per errore di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati; gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skills supportate da Gateway usano invece la deroga di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione delle skill da ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard di ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di rieseguire la scansione del plugin né rende pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin. Il supporto runtime attuale include skill del bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers` dichiarate dal manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità del bundle rilevate più le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso `marketplace.json`, una forma breve GitHub come `owner/repo`, un URL di repository GitHub o un URL git. Per i marketplace remoti, le voci plugin devono restare all'interno del repository marketplace clonato e usare solo sorgenti con percorso relativo.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API Plugin

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin. Il loader ripiega ancora su `activate(api)` per i plugin più vecchi, ma i plugin integrati e i nuovi plugin esterni dovrebbero considerare `register` il contratto pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                               |
| `discovery`     | Discovery delle capacità in sola lettura. Registra provider e metadati; il codice entry del plugin attendibile può caricarsi, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                                      |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                        |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                            |

Le entry dei plugin che aprono socket, database, worker in background o client di lunga durata dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery sono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery non attiva, ma non è priva di import: OpenClaw può valutare la entry del plugin attendibile o il modulo del plugin canale per creare lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio dei servizi dietro percorsi full-runtime.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                     |
| --------------------------------------- | --------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)         |
| `registerChannel`                       | Canale chat                       |
| `registerTool`                          | Strumento agente                  |
| `registerHook` / `on(...)`              | Hook del ciclo di vita            |
| `registerSpeechProvider`                | Text-to-speech / STT              |
| `registerRealtimeTranscriptionProvider` | STT in streaming                  |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex              |
| `registerMediaUnderstandingProvider`    | Analisi immagini/audio            |
| `registerImageGenerationProvider`       | Generazione di immagini           |
| `registerMusicGenerationProvider`       | Generazione di musica             |
| `registerVideoGenerationProvider`       | Generazione di video              |
| `registerWebFetchProvider`              | Provider web fetch / scraping     |
| `registerWebSearchProvider`             | Ricerca web                       |
| `registerHttpRoute`                     | Endpoint HTTP                     |
| `registerCommand` / `registerCli`       | Comandi CLI                       |
| `registerContextEngine`                 | Motore di contesto                |
| `registerService`                       | Servizio in background            |

Comportamento di guardia degli hook per gli hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Le esecuzioni del server app nativo di Codex collegano di nuovo gli eventi degli strumenti nativi di Codex a questa superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`, osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni `PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti nativi di Codex. Il confine esatto del supporto del runtime Codex è definito nel [contratto di supporto dell'harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo e tipizzato degli hook, consulta la [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) - crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) - schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti agente in un Plugin
- [Interni del Plugin](/it/plugins/architecture) - modello di capability e pipeline di caricamento
- [Plugin della community](/it/plugins/community) - elenchi di terze parti
