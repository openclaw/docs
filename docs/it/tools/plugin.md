---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di rilevamento e caricamento dei Plugin
    - Lavorare con i bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, sintesi vocale, trascrizione realtime,
voce realtime, comprensione dei media, generazione di immagini, generazione di
video, recupero web, ricerca web e altro. Alcuni plugin sono **core**
(distribuiti con OpenClaw), altri sono **esterni**. La maggior parte dei plugin
esterni viene pubblicata e scoperta tramite [ClawHub](/it/tools/clawhub). Npm rimane
supportato per le installazioni dirette e per un insieme temporaneo di pacchetti
plugin di proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi da copiare e incollare per installare, elencare, disinstallare,
aggiornare e pubblicare, consulta [Gestire i plugin](/it/plugins/manage-plugins).

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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

  <Step title="Gestione nativa nella chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati
    al proprietario, attivano il ricaricatore della configurazione del Gateway. Il
    Gateway ricarica in-process le superfici di runtime dei plugin e i nuovi turni
    degli agenti ricostruiscono l'elenco degli strumenti dal registro aggiornato.
    `/plugins install` modifica il codice sorgente dei plugin, quindi il Gateway
    richiede un riavvio invece di fingere che il processo corrente possa ricaricare
    in sicurezza moduli già importati.

  </Step>

  <Step title="Verifica il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi
    Gateway, hook o comandi CLI di proprietà del plugin. Il semplice `inspect` è
    un controllo a freddo di manifest/registro ed evita intenzionalmente di
    importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo nella chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio
locale, `clawhub:<pkg>` esplicito, `npm:<pkg>` esplicito,
`npm-pack:<path.tgz>` esplicito, `git:<repo>` esplicito o specifica di pacchetto
semplice tramite npm.

Se la configurazione non è valida, l'installazione di norma fallisce in modo
chiuso e ti indirizza a `openclaw doctor --fix`. L'unica eccezione di ripristino
è un percorso ristretto di reinstallazione dei plugin inclusi per i plugin che
abilitano `openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione plugin non valida fallisce in
modo chiuso come qualsiasi altra configurazione non valida. Esegui
`openclaw doctor --fix` per mettere in quarantena la configurazione errata del
plugin disabilitando quella voce plugin e rimuovendo il relativo payload di
configurazione non valido; il normale backup della configurazione conserva i
valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più
rilevabile ma lo stesso id plugin obsoleto rimane nella configurazione plugin o
nei record di installazione, l'avvio del Gateway registra avvisi e salta quel
canale invece di bloccare tutti gli altri canali. Esegui
`openclaw doctor --fix` per rimuovere le voci di canale/plugin obsolete; le chiavi
di canale sconosciute senza evidenza di plugin obsoleto continuano a non superare
la convalida, così gli errori di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti vengono
trattati come inerti: l'avvio del Gateway salta il lavoro di discovery/caricamento
dei plugin e `openclaw doctor` conserva la configurazione plugin disabilitata
invece di rimuoverla automaticamente. Riabilita i plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti
di installazione/aggiornamento o riparazione con doctor. Avvio del Gateway,
ricaricamento della configurazione e ispezione runtime non eseguono package
manager né riparano alberi di dipendenze. I plugin locali devono avere già le
dipendenze installate, mentre i plugin npm, git e ClawHub vengono installati nelle
root plugin gestite da OpenClaw. Le dipendenze npm possono essere hoistate nella
root npm gestita da OpenClaw; installazione/aggiornamento scansiona quella root
gestita prima dell'attendibilità e la disinstallazione rimuove tramite npm i
pacchetti gestiti da npm. I plugin esterni e i percorsi di caricamento
personalizzati devono comunque essere installati tramite `openclaw plugins install`.
Usa `openclaw plugins list --json` per vedere lo stato statico `dependencyStatus`
di ogni plugin visibile senza importare codice runtime o riparare dipendenze.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution)
per il ciclo di vita al momento dell'installazione.

### Proprietà dei percorsi plugin bloccati

Se la diagnostica del plugin dice
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la convalida della configurazione prosegue con `plugin present but blocked`,
OpenClaw ha trovato file del plugin posseduti da un utente Unix diverso dal
processo che li sta caricando. Mantieni la configurazione del plugin; correggi la
proprietà del filesystem oppure esegui OpenClaw come lo stesso utente che possiede
la directory di stato.

Per installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid
`1000`), quindi le directory di configurazione e workspace di OpenClaw montate dal
host dovrebbero normalmente essere possedute da uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la root plugin gestita
affinché sia di proprietà di root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, esegui di nuovo `openclaw doctor --fix` o
`openclaw plugins registry --refresh` così il registro plugin persistito
corrisponde ai file riparati.

Per installazioni npm, selettori mutabili come `latest` o un dist-tag vengono
risolti prima dell'installazione e poi fissati alla versione esatta verificata
nella root npm gestita da OpenClaw. Al termine di npm, OpenClaw verifica che la
voce `package-lock.json` installata corrisponda ancora alla versione risolta e
all'integrità. Se npm scrive metadati di pacchetto diversi, l'installazione
fallisce e il pacchetto gestito viene ripristinato invece di accettare un artefatto
plugin diverso.
Le root npm gestite ereditano anche gli `overrides` npm a livello di pacchetto di
OpenClaw, quindi i pin di sicurezza che proteggono l'host pacchettizzato si
applicano anche alle dipendenze hoistate dei plugin esterni.

I checkout del sorgente sono workspace pnpm. Se cloni OpenClaw per modificare i
plugin inclusi, esegui `pnpm install`; OpenClaw carica quindi i plugin inclusi da
`extensions/<id>` così modifiche e dipendenze locali del pacchetto vengono usate
direttamente. Le installazioni root semplici con npm sono per OpenClaw
pacchettizzato, non per lo sviluppo da checkout sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue in-process        | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare plugin](/it/plugins/building-plugins)
e la [Panoramica dell'SDK dei plugin](/it/plugins/sdk-overview).

## Entrypoint dei pacchetti

I pacchetti npm dei plugin nativi devono dichiarare `openclaw.extensions` in
`package.json`. Ogni voce deve rimanere all'interno della directory del pacchetto
e risolversi in un file runtime leggibile, oppure in un file sorgente TypeScript
con un peer JavaScript compilato dedotto, ad esempio da `src/index.ts` a
`dist/index.js`.
Le installazioni pacchettizzate devono includere quell'output runtime JavaScript.
Il fallback al sorgente TypeScript è per checkout sorgente e percorsi di sviluppo
locali, non per pacchetti npm installati nella root plugin gestita da OpenClaw.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript di
cui OpenClaw ha bisogno a runtime. Questo è un problema di pacchettizzazione del
plugin, non un problema di configurazione locale. Aggiorna o reinstalla il plugin
dopo che il publisher ripubblica JavaScript compilato, oppure disabilita/disinstalla
quel plugin finché non è disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano
negli stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions`
deve contenere esattamente una voce per ogni voce `extensions`. Liste non
corrispondenti fanno fallire installazione e discovery dei plugin invece di
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

ClawHub è il percorso di distribuzione principale per la maggior parte dei plugin.
Le release pacchettizzate correnti di OpenClaw includono già molti plugin
ufficiali, quindi questi non richiedono installazioni npm separate nelle
configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw continuerà a distribuire alcuni pacchetti plugin
`@openclaw/*` su npm per installazioni più vecchie/personalizzate e flussi di
lavoro npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione
del pacchetto proviene da una serie di pacchetti esterni precedente. Usa il plugin
incluso in OpenClaw corrente o un checkout locale finché non viene pubblicato un
pacchetto npm più recente.

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

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione
    degli embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

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
| `allow`            | Elenco consentiti dei Plugin (opzionale)                  |
| `bundledDiscovery` | Modalità di rilevamento dei Plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | Elenco negati dei Plugin (opzionale; deny ha la precedenza) |
| `load.paths`       | File/directory Plugin aggiuntivi                          |
| `slots`            | Selettori di slot esclusivi (es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Interruttori + configurazione per Plugin                  |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i Plugin elencati possono essere caricati
o esporre strumenti, anche se `tools.allow` contiene `"*"` o uno specifico nome di
strumento appartenente a un Plugin. Se un elenco consentiti di strumenti fa riferimento a strumenti Plugin, aggiungi gli id dei Plugin proprietari
a `plugins.allow` oppure rimuovi `plugins.allow`; `openclaw doctor` avvisa di questa
forma.

`plugins.bundledDiscovery` usa `"allowlist"` come valore predefinito per le nuove configurazioni, quindi un
inventario restrittivo `plugins.allow` blocca anche i provider
Plugin inclusi omessi, incluso il rilevamento dei provider di ricerca web runtime. Doctor contrassegna le configurazioni
restrittive di allowlist più vecchie con `"compat"` durante la migrazione, così gli aggiornamenti mantengono
il comportamento legacy dei provider inclusi finché l'operatore non sceglie la modalità più rigorosa.
Un `plugins.allow` vuoto viene comunque trattato come non impostato/aperto.

Le modifiche di configurazione effettuate tramite `/plugins enable` o `/plugins disable` attivano un
ricaricamento in-process dei Plugin del Gateway. I nuovi turni degli agenti ricostruiscono il loro elenco di strumenti dal
registro Plugin aggiornato. Le operazioni che modificano i sorgenti, come installazione,
aggiornamento e disinstallazione, riavviano ancora il processo Gateway perché i moduli
Plugin già importati non possono essere sostituiti in modo sicuro sul posto.

`openclaw plugins list` è uno snapshot locale di registro/configurazione Plugin. Un Plugin
`enabled` lì significa che il registro persistito e la configurazione corrente consentono al
Plugin di partecipare. Non prova che un Gateway remoto già in esecuzione
sia stato ricaricato o riavviato con lo stesso codice Plugin. In configurazioni VPS/container
con processi wrapper, invia riavvii o scritture che attivano ricaricamenti all'effettivo
processo `openclaw gateway run`, oppure usa `openclaw gateway restart` sul
Gateway in esecuzione quando il ricaricamento segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il Plugin esiste, ma le regole di abilitazione lo hanno spento. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id Plugin che il rilevamento non ha trovato.
  - **Non valido**: il Plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel Plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il suo payload di configurazione.

</Accordion>

## Rilevamento e precedenza

OpenClaw cerca i Plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei Plugin inclusi pacchettizzati di OpenClaw vengono ignorati;
    esegui `openclaw doctor --fix` per rimuovere questi alias obsoleti.
  </Step>

  <Step title="Plugin del workspace">
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

Le installazioni pacchettizzate e le immagini Docker risolvono normalmente i Plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un Plugin incluso viene
montata in bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come un overlay sorgente incluso e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop container dei maintainer
senza riportare ogni Plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i Plugin e salta il lavoro di rilevamento/caricamento dei Plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel Plugin
- I Plugin originati dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin inclusi seguono il set integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del Plugin selezionato per quello slot
- Alcuni Plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie appartenente a un Plugin, come un riferimento a modello provider, una configurazione di canale o un runtime
  harness
- La configurazione Plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i Plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini Plugin separati:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin
  app-server Codex incluso viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti a modelli legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un Plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL
  Gateway attivo, profilo, percorso di configurazione e processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice dei Plugin. Nei container
  wrapper, il PID 1 può essere solo un supervisore; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni hook e
  diagnostica. Gli hook di conversazione non inclusi come `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni degli agenti; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per la prova del modello di sessione effettivo, usa `openclaw sessions` o le
  superfici sessione/stato del Gateway e, quando esegui il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti Plugin

Se i turni degli agenti sembrano bloccarsi durante la preparazione degli strumenti, abilita il logging trace e
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
inclusi id Plugin, nomi degli strumenti dichiarati, forma del risultato e se lo strumento è
opzionale. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1s o la preparazione totale delle factory degli strumenti Plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli strumenti Plugin per risoluzioni ripetute
con lo stesso contesto di richiesta effettivo. La chiave cache include la configurazione runtime
effettiva, workspace, id agente/sessione, policy sandbox, impostazioni browser,
contesto di consegna, identità del richiedente e stato di proprietà, quindi le factory che
dipendono da questi campi attendibili vengono rieseguite quando il contesto cambia.

Se un Plugin domina la temporizzazione, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel Plugin. Gli autori di Plugin dovrebbero spostare
il caricamento costoso delle dipendenze dietro il percorso di esecuzione dello strumento invece di farlo
dentro la factory dello strumento.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un Plugin abilitato sta cercando di possedere lo stesso canale,
flusso di configurazione o nome di strumento. La causa più comune è un Plugin di canale esterno
installato accanto a un Plugin incluso che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni Plugin abilitato
  e origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ciascun Plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti Plugin, così i metadati persistiti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche di installazione, registro o configurazione.

Opzioni di correzione:

- Se un Plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  Plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id del Plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione Plugin
  obsoleta.
- Se hai abilitato esplicitamente entrambi i Plugin, OpenClaw mantiene quella richiesta e
  segnala il conflitto. Scegli un proprietario per il canale o rinomina gli strumenti appartenenti ai Plugin
  affinché la superficie runtime sia non ambigua.

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

| Slot            | Che cosa controlla      | Predefinito          |
| --------------- | ----------------------- | -------------------- |
| `memory`        | Plugin di memoria attivo | `memory-core`        |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo Plugin abilitati
openclaw plugins list --verbose            # righe di dettaglio per Plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins search <query>            # cerca nel catalogo Plugin di ClawHub
openclaw plugins inspect <id>              # dettagli statici
openclaw plugins inspect <id> --runtime    # hook/strumenti/CLI/metodi Gateway registrati
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella dell'intero parco
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica
openclaw plugins registry                  # ispeziona lo stato del registro persistente
openclaw plugins registry --refresh        # ricostruisci il registro persistente
openclaw doctor --fix                      # ripara lo stato del registro Plugin

openclaw plugins install <package>         # installa da npm per impostazione predefinita
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install npm:<pkg>         # installa solo da npm
openclaw plugins install git:<repo>        # installa da git
openclaw plugins install git:<repo>@<ref>  # installa da git ref
openclaw plugins install <spec> --force    # sovrascrivi un'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per lo sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la spec npm risolta esatta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutto
openclaw plugins uninstall <id>          # rimuovi la configurazione e i record dell'indice Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verifica le registrazioni runtime dopo l'installazione.
openclaw plugins inspect <id> --runtime --json

# Esegui i comandi CLI proprietari del Plugin direttamente dalla CLI root di OpenClaw.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I Plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il Plugin browser incluso). Altri Plugin inclusi richiedono ancora `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un Plugin installato esistente o un pacchetto di hook. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei Plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del Plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id Plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta, così l'installazione esplicita è caricabile immediatamente dopo il riavvio.

OpenClaw mantiene un registro Plugin locale persistente come modello di lettura a freddo per inventario Plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato dei Plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione durevoli in `installRecords` di livello superiore e metadati manifest ricostruibili in `plugins`. Se il registro è mancante, obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la vista manifest dai record di installazione, dalla policy di configurazione e dai metadati manifest/package senza caricare moduli runtime dei Plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Gestisci invece la selezione dei package Plugin e la configurazione tramite il sorgente Nix per l'installazione; per nix-openclaw, inizia dalla [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una spec package npm con un dist-tag o una versione esatta risolve il nome package tornando al record Plugin tracciato e registra la nuova spec per gli aggiornamenti futuri. Passare il nome package senza versione sposta un'installazione con pin esatto di nuovo sulla linea di rilascio predefinita del registro. Se il Plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcun rilascio beta del Plugin. Le versioni esatte e i tag espliciti restano fissati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono metadati sorgente del marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi positivi dallo scanner di codice pericoloso integrato. Consente alle installazioni e agli aggiornamenti Plugin di proseguire oltre i finding `critical` integrati, ma non bypassa comunque i blocchi di policy Plugin `before_install` o il blocco per errore di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test impacchettati; gli entrypoint runtime Plugin dichiarati vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le installazioni delle dipendenze delle skill supportate da Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle skill da ClawHub.

Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di riesaminare il Plugin né di rendere pubblico un rilascio bloccato.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei Plugin. Il supporto runtime attuale include bundle Skills, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers` dichiarate nel manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più le voci server MCP e LSP supportate o non supportate per i Plugin basati su bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL repo GitHub o un URL git. Per i marketplace remoti, le voci Plugin devono rimanere all'interno del repo marketplace clonato e usare solo sorgenti con percorsi relativi.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API Plugin

I Plugin nativi esportano un oggetto entry che espone `register(api)`. I Plugin meno recenti possono ancora usare `activate(api)` come alias legacy, ma i nuovi Plugin dovrebbero usare `register`.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del Plugin. Il loader ripiega ancora su `activate(api)` per i Plugin meno recenti, ma i Plugin inclusi e i nuovi Plugin esterni dovrebbero considerare `register` come contratto pubblico.

`api.registrationMode` indica a un Plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                          |
| `discovery`     | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice entry Plugin attendibile può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                                |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                   |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                        |

Le entry Plugin che aprono socket, database, worker in background o client di lunga durata dovrebbero proteggere quegli effetti collaterali con `api.registrationMode === "full"`. I caricamenti di discovery sono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery è non attivante, non priva di import: OpenClaw può valutare la entry Plugin attendibile o il modulo Plugin del canale per costruire lo snapshot. Mantieni i livelli top-level dei moduli leggeri e privi di effetti collaterali, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi runtime completi.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)    |
| `registerChannel`                       | Canale chat                  |
| `registerTool`                          | Strumento agente             |
| `registerHook` / `on(...)`              | Hook del ciclo di vita       |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT in streaming             |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex         |
| `registerMediaUnderstandingProvider`    | Analisi immagini/audio       |
| `registerImageGenerationProvider`       | Generazione immagini         |
| `registerMusicGenerationProvider`       | Generazione musica           |
| `registerVideoGenerationProvider`       | Generazione video            |
| `registerWebFetchProvider`              | Provider web fetch / scrape  |
| `registerWebSearchProvider`             | Ricerca web                  |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandi CLI                  |
| `registerContextEngine`                 | Motore di contesto           |
| `registerService`                       | Servizio in background       |

Comportamento delle guardie hook per hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Le esecuzioni native dell'app-server Codex collegano gli eventi degli strumenti nativi di Codex a questa
superficie di hook. I plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti nativi di Codex. Il limite esatto del supporto runtime di Codex si trova nel
[contratto di supporto dell'harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta la [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) - crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifest dei plugin](/it/plugins/manifest) - schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti agente in un plugin
- [Internals dei plugin](/it/plugins/architecture) - modello delle capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) - elenchi di terze parti
