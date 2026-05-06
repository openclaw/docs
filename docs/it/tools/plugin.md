---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di rilevamento e caricamento dei Plugin
    - Uso dei bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, fornitori di modelli,
harness per agenti, strumenti, skills, parlato, trascrizione realtime, voce
realtime, comprensione dei media, generazione di immagini, generazione di video,
recupero web, ricerca web e altro. Alcuni plugin sono **core** (forniti con
OpenClaw), altri sono **esterni**. La maggior parte dei plugin esterni viene
pubblicata e scoperta tramite [ClawHub](/it/tools/clawhub). Npm rimane supportato
per installazioni dirette e per un insieme temporaneo di pacchetti plugin
di proprietà di OpenClaw finché la migrazione non sarà completata.

## Avvio rapido

Per esempi copiabili di installazione, elenco, disinstallazione, aggiornamento e pubblicazione, consulta
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

    Poi configura sotto `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>

  <Step title="Gestione nativa via chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati al proprietario,
    attivano il ricaricatore della configurazione del Gateway. Il Gateway ricarica in processo
    le superfici runtime dei plugin, e i nuovi turni agente ricostruiscono il loro elenco di strumenti dal
    registro aggiornato. `/plugins install` modifica il codice sorgente del plugin, quindi il
    Gateway richiede un riavvio invece di fingere che il processo corrente possa
    ricaricare in sicurezza moduli già importati.

  </Step>

  <Step title="Verificare il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi del gateway,
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

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>`
esplicito, `npm:<pkg>` esplicito, `npm-pack:<path.tgz>` esplicito,
`git:<repo>` esplicito o specifica di pacchetto senza prefisso tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è uno stretto percorso di reinstallazione
per plugin inclusi che scelgono di usare
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra
configurazione non valida. Esegui `openclaw doctor --fix` per mettere in quarantena la configurazione errata del plugin
disabilitando quella voce plugin e rimuovendo il suo payload di configurazione non valido; il normale
backup della configurazione conserva i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più individuabile ma lo
stesso id plugin obsoleto rimane nella configurazione plugin o nei record di installazione, l'avvio del Gateway
registra avvisi e salta quel canale invece di bloccare tutti gli altri canali.
Esegui `openclaw doctor --fix` per rimuovere le voci canale/plugin obsolete; le chiavi
di canale sconosciute senza evidenza di plugin obsoleto continuano a fallire la validazione, così gli errori di battitura restano
visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti vengono trattati come inerti:
l'avvio del Gateway salta il lavoro di scoperta/caricamento dei plugin e `openclaw doctor` conserva
la configurazione plugin disabilitata invece di rimuoverla automaticamente. Riabilita i plugin prima di
eseguire la pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti di installazione/aggiornamento o
riparazione con doctor. L'avvio del Gateway, il ricaricamento della configurazione e l'ispezione runtime
non eseguono package manager né riparano alberi di dipendenze. I plugin locali devono già
avere le loro dipendenze installate, mentre i plugin npm, git e ClawHub vengono
installati nelle radici plugin gestite da OpenClaw. Le dipendenze npm possono essere elevate
all'interno della radice npm gestita da OpenClaw; installazione/aggiornamento analizza quella radice gestita prima
di considerarla affidabile e la disinstallazione rimuove i pacchetti gestiti da npm tramite npm. I plugin esterni
e i percorsi di caricamento personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere il `dependencyStatus` statico per ogni
plugin visibile senza importare codice runtime né riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per il
ciclo di vita al momento dell'installazione.

### Proprietà dei percorsi plugin bloccati

Se la diagnostica del plugin dice
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la validazione della configurazione prosegue con `plugin present but blocked`, OpenClaw ha trovato
file plugin posseduti da un utente Unix diverso dal processo che li sta caricando.
Mantieni la configurazione del plugin; correggi la proprietà del filesystem oppure esegui
OpenClaw come lo stesso utente proprietario della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid `1000`), quindi le
directory di configurazione e workspace OpenClaw montate dal host dovrebbero normalmente essere
possedute dall'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la radice plugin gestita
assegnandola a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, riesegui `openclaw doctor --fix` o
`openclaw plugins registry --refresh` affinché il registro plugin persistito corrisponda
ai file riparati.

Per le installazioni npm, selettori mutabili come `latest` o un dist-tag vengono risolti
prima dell'installazione e poi fissati alla versione verificata esatta nella radice npm
gestita da OpenClaw. Dopo il completamento di npm, OpenClaw verifica che la voce installata in
`package-lock.json` corrisponda ancora alla versione e all'integrità risolte. Se
npm scrive metadati di pacchetto diversi, l'installazione fallisce e il pacchetto gestito
viene ripristinato invece di accettare un artefatto plugin diverso.

I checkout del sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui plugin inclusi,
esegui `pnpm install`; OpenClaw carica poi i plugin inclusi da
`extensions/<id>` così modifiche e dipendenze locali del pacchetto vengono usate direttamente.
Le installazioni npm semplici nella root sono per OpenClaw pacchettizzato, non per lo sviluppo
da checkout del sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; viene eseguito in-process | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm dei plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare all'interno della directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato inferito,
ad esempio da `src/index.ts` a `dist/index.js`.
Le installazioni pacchettizzate devono includere quell'output runtime JavaScript. Il fallback al sorgente
TypeScript è per checkout del sorgente e percorsi di sviluppo locali, non per
pacchetti npm installati nella radice plugin gestita da OpenClaw.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
di cui OpenClaw ha bisogno a runtime. È un problema di packaging del plugin, non un problema
di configurazione locale. Aggiorna o reinstalla il plugin dopo che l'autore avrà ripubblicato JavaScript
compilato, oppure disabilita/disinstalla quel plugin finché non sarà disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano
negli stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Elenchi non corrispondenti fanno fallire installazione e
scoperta del plugin invece di ricadere silenziosamente sui percorsi sorgente. Se pubblichi anche
`openclaw.setupEntry`, usa `openclaw.runtimeSetupEntry` per il suo peer JavaScript
compilato; quel file è richiesto quando dichiarato.

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
npm per installazioni più vecchie/personalizzate e flussi npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da una linea di pacchetti esterni più vecchia. Usa il plugin incluso in
OpenClaw attuale o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

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

### Core (forniti con OpenClaw)

<AccordionGroup>
  <Accordion title="Fornitori di modelli (abilitati per impostazione predefinita)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin di memoria">
    - `memory-core` - ricerca memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` - memoria a lungo termine basata su LanceDB con richiamo/cattura automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione degli
    embedding compatibili con OpenAI, esempi Ollama, limiti di recall e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - Plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo Gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

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

| Campo              | Descrizione                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Interruttore principale (predefinito: `true`)             |
| `allow`            | allowlist dei Plugin (facoltativa)                        |
| `bundledDiscovery` | Modalità di rilevamento dei Plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | denylist dei Plugin (facoltativa; deny ha la precedenza)  |
| `load.paths`       | File/directory di Plugin aggiuntivi                       |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Interruttori + configurazione per singolo Plugin          |

`plugins.allow` è esclusivo. Quando non è vuoto, possono essere caricati o
esporre strumenti solo i Plugin elencati, anche se `tools.allow` contiene `"*"` o
il nome di uno strumento specifico posseduto da un Plugin. Se una allowlist degli
strumenti fa riferimento a strumenti di Plugin, aggiungi gli id dei Plugin
proprietari a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor`
segnala questa forma.

`plugins.bundledDiscovery` usa come valore predefinito `"allowlist"` per le nuove
configurazioni, quindi un inventario restrittivo `plugins.allow` blocca anche i
Plugin provider inclusi omessi, incluso il rilevamento dei provider di ricerca
web a runtime. Doctor contrassegna le vecchie configurazioni restrittive con
allowlist con `"compat"` durante la migrazione, così gli aggiornamenti mantengono
il comportamento legacy dei provider inclusi finché l'operatore non sceglie la
modalità più rigorosa. Un `plugins.allow` vuoto è comunque trattato come non
impostato/aperto.

Le modifiche di configurazione effettuate tramite `/plugins enable` o
`/plugins disable` attivano un ricaricamento dei Plugin del Gateway nel processo.
I nuovi turni degli agenti ricostruiscono il proprio elenco di strumenti dal
registro Plugin aggiornato. Le operazioni che modificano le sorgenti, come
installazione, aggiornamento e disinstallazione, riavviano comunque il processo
Gateway perché i moduli Plugin già importati non possono essere sostituiti in
sicurezza sul posto.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei
Plugin. Un Plugin `enabled` lì significa che il registro persistente e la
configurazione corrente consentono al Plugin di partecipare. Non prova che un
Gateway remoto già in esecuzione sia stato ricaricato o riavviato con lo stesso
codice Plugin. In configurazioni VPS/container con processi wrapper, invia i
riavvii o le scritture che attivano il ricaricamento al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` sul Gateway in
esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Disabilitato**: il Plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id Plugin che il rilevamento non ha trovato.
  - **Non valido**: il Plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel Plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i Plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei Plugin inclusi pacchettizzati di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere quegli alias obsoleti.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono l'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i
Plugin inclusi dall'albero compilato `dist/extensions`. Se una directory sorgente
di un Plugin incluso viene montata in bind sopra il percorso sorgente
pacchettizzato corrispondente, per esempio `/app/extensions/synology-chat`,
OpenClaw tratta quella directory sorgente montata come overlay sorgente incluso e
la rileva prima del bundle pacchettizzato `/app/dist/extensions/synology-chat`.
Questo mantiene funzionanti i loop container dei maintainer senza riportare ogni
Plugin incluso al sorgente TypeScript. Imposta
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist
pacchettizzati anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i Plugin e salta il lavoro di rilevamento/caricamento dei Plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel Plugin
- I Plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin inclusi seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del Plugin selezionato per quello slot
- Alcuni Plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una superficie posseduta da un Plugin, come un riferimento a modello provider, configurazione canale o runtime harness
- La configurazione Plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo; riabilita i Plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini Plugin separati:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin app-server Codex incluso viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un Plugin appare in `plugins list` ma gli effetti collaterali o gli hook di
`register(api)` non vengono eseguiti nel traffico di chat live, controlla prima
questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL del Gateway attivo, profilo, percorso di configurazione e processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice dei Plugin. Nei container wrapper, il PID 1 potrebbe essere solo un supervisor; riavvia o invia un segnale al processo figlio `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni degli hook e diagnostica. Gli hook di conversazione non inclusi, come `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`, richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione del modello per i turni degli agenti; `llm_output` viene eseguito solo dopo che un tentativo di modello produce output dell'assistente.
- Per provare il modello di sessione effettivo, usa `openclaw sessions` o le superfici sessione/stato del Gateway e, quando esegui il debug dei payload provider, avvia il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti Plugin

Se i turni degli agenti sembrano bloccarsi durante la preparazione degli
strumenti, abilita il logging trace e controlla le righe sui tempi delle factory
degli strumenti Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory di strumenti
Plugin più lente, inclusi id Plugin, nomi degli strumenti dichiarati, forma del
risultato e se lo strumento è facoltativo. Le righe lente vengono promosse ad
avvisi quando una singola factory impiega almeno 1 s o la preparazione totale
delle factory di strumenti Plugin impiega almeno 5 s.

OpenClaw memorizza nella cache i risultati riusciti delle factory di strumenti
Plugin per risoluzioni ripetute con lo stesso contesto effettivo della richiesta.
La chiave della cache include configurazione runtime effettiva, workspace, id di
agente/sessione, policy sandbox, impostazioni browser, contesto di consegna,
identità del richiedente e stato di ownership, quindi le factory che dipendono da
quei campi attendibili vengono rieseguite quando il contesto cambia.

Se un Plugin domina i tempi, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel Plugin. Gli autori dei Plugin
dovrebbero spostare il caricamento costoso delle dipendenze dietro il percorso di
esecuzione dello strumento invece di farlo dentro la factory dello strumento.

### Ownership duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Significano che più di un Plugin abilitato sta cercando di possedere lo stesso
canale, flusso di configurazione o nome strumento. La causa più comune è un
Plugin canale esterno installato accanto a un Plugin incluso che ora fornisce lo
stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni Plugin abilitato e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni Plugin sospetto e confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso pacchetti Plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un Plugin sostituisce intenzionalmente un altro per lo stesso id canale, il Plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con l'id Plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione obsoleta del Plugin.
- Se hai abilitato esplicitamente entrambi i Plugin, OpenClaw mantiene quella richiesta e segnala il conflitto. Scegli un proprietario per il canale oppure rinomina gli strumenti posseduti dai Plugin in modo che la superficie runtime sia non ambigua.

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

| Slot            | Cosa controlla         | Predefinito         |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active Memory  | `memory-core`       |
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

I plugin integrati vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio i provider di modelli integrati, i provider vocali integrati e il plugin browser integrato). Altri plugin integrati richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato esistente o un pacchetto di hook. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin installato a quell'allowlist prima di abilitarlo. Se lo stesso id plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta così che l'installazione esplicita sia caricabile subito dopo il riavvio.

OpenClaw mantiene un registro locale persistente dei plugin come modello di lettura a freddo per inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver cambiato lo stato dei plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione durevoli in `installRecords` di primo livello e metadati manifest ricostruibili in `plugins`. Se il registro manca, è obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la sua vista dei manifest da record di installazione, policy di configurazione e metadati di manifest/package senza caricare moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto verso il record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri. Passare il nome del pacchetto senza versione riporta un'installazione esatta fissata alla linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record plugin npm e ClawHub della linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcun rilascio beta del plugin. Versioni esatte e tag espliciti restano fissati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi positivi dello scanner di codice pericoloso integrato. Consente alle installazioni e agli aggiornamenti dei plugin di proseguire oltre i risultati `critical` integrati, ma non aggira comunque i blocchi di policy `before_install` dei plugin né il blocco per errore di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati; gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle skill basate su Gateway usano invece il corrispondente override di richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle skill ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di rieseguire la scansione del plugin né rende pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin. Il supporto runtime attuale include skill bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers` dichiarate dal manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto Claude da `~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL repo GitHub o un URL git. Per marketplace remoti, le voci plugin devono restare dentro il repo marketplace clonato e usare solo sorgenti con percorso relativo.

Consulta il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin. Il loader ripiega ancora su `activate(api)` per plugin più vecchi, ma i plugin integrati e i nuovi plugin esterni dovrebbero trattare `register` come contratto pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                                        |
| `discovery`     | Rilevamento capacità in sola lettura. Registra provider e metadati; il codice entry di plugin attendibili può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione canale tramite una entry di configurazione leggera.                                                  |
| `setup-runtime` | Caricamento della configurazione canale che richiede anche la entry runtime.                                                                    |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                                     |

Le entry plugin che aprono socket, database, worker in background o client longevi dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery vengono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery non attiva, ma non è priva di import: OpenClaw può valutare la entry del plugin attendibile o il modulo del plugin canale per creare lo snapshot. Mantieni i top level dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi runtime completi.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                       |
| --------------------------------------- | ----------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)           |
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
| `registerWebFetchProvider`              | Provider di web fetch / scrape      |
| `registerWebSearchProvider`             | Ricerca web                         |
| `registerHttpRoute`                     | Endpoint HTTP                       |
| `registerCommand` / `registerCli`       | Comandi CLI                         |
| `registerContextEngine`                 | Motore di contesto                  |
| `registerService`                       | Servizio in background              |

Comportamento di guardia degli hook per hook di ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una cancellazione precedente.

Il server app nativo Codex esegue il bridge degli eventi degli strumenti nativi Codex verso questa superficie di hook. I plugin possono bloccare strumenti nativi Codex tramite `before_tool_call`, osservare risultati tramite `after_tool_call` e partecipare alle approvazioni Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex. Il confine esatto del supporto runtime Codex si trova nel [contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta la [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) - crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) - schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti agente in un Plugin
- [Interni del Plugin](/it/plugins/architecture) - modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) - elenchi di terze parti
