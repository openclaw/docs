---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Lavorare con bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, parlato, trascrizione realtime, voce
realtime, comprensione dei media, generazione di immagini, generazione di video,
recupero web, ricerca web e altro. Alcuni plugin sono **core** (distribuiti con
OpenClaw), altri sono **esterni**. La maggior parte dei plugin esterni viene
pubblicata e scoperta tramite [ClawHub](/it/clawhub). Npm rimane supportato per le
installazioni dirette e per un insieme temporaneo di pacchetti plugin di
proprietà di OpenClaw mentre la migrazione viene completata.

## Avvio rapido

Per esempi da copiare e incollare per installazione, elenco, disinstallazione,
aggiornamento e pubblicazione, consulta
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

  <Step title="Gestione nativa della chat">
    In un Gateway in esecuzione, `/plugins enable` e `/plugins disable`, riservati
    solo al proprietario, attivano il ricaricatore della configurazione del
    Gateway. Il Gateway ricarica le superfici runtime dei plugin nel processo, e
    i nuovi turni degli agenti ricostruiscono il loro elenco di strumenti dal
    registro aggiornato. `/plugins install` modifica il codice sorgente dei plugin,
    quindi il Gateway richiede un riavvio invece di fingere che il processo
    corrente possa ricaricare in modo sicuro moduli già importati.

  </Step>

  <Step title="Verifica il plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Usa `--runtime` quando devi dimostrare strumenti registrati, servizi, metodi
    del gateway, hook o comandi CLI di proprietà del plugin. Il semplice `inspect`
    è un controllo a freddo del manifesto/registro ed evita intenzionalmente di
    importare il runtime del plugin.

  </Step>
</Steps>

Se preferisci il controllo nativo della chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio
locale, `clawhub:<pkg>` esplicito, `npm:<pkg>` esplicito, `npm-pack:<path.tgz>`
esplicito, `git:<repo>` esplicito, oppure specifica di pacchetto semplice tramite npm.

Se la configurazione non è valida, l'installazione normalmente fallisce chiusa e
ti indirizza a `openclaw doctor --fix`. L'unica eccezione di recupero è un
percorso ristretto di reinstallazione per plugin inclusi che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione plugin non valida fallisce chiusa
come qualsiasi altra configurazione non valida. Esegui `openclaw doctor --fix` per
mettere in quarantena la configurazione non valida del plugin disabilitando quella
voce plugin e rimuovendo il relativo payload di configurazione non valido; il
normale backup della configurazione mantiene i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più
rilevabile ma lo stesso ID plugin obsoleto rimane nella configurazione plugin o nei
record di installazione, l'avvio del Gateway registra avvisi e salta quel canale
invece di bloccare tutti gli altri canali. Esegui `openclaw doctor --fix` per
rimuovere le voci canale/plugin obsolete; le chiavi canale sconosciute senza
evidenza di plugin obsoleto continuano a fallire la validazione, così gli errori
di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti sono
trattati come inerti: l'avvio del Gateway salta il lavoro di scoperta/caricamento
dei plugin e `openclaw doctor` conserva la configurazione plugin disabilitata
invece di rimuoverla automaticamente. Riabilita i plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli ID plugin obsoleti.

L'installazione delle dipendenze dei plugin avviene solo durante flussi espliciti
di installazione/aggiornamento o riparazione doctor. L'avvio del Gateway, il
ricaricamento della configurazione e l'ispezione runtime non eseguono gestori di
pacchetti né riparano alberi delle dipendenze. I plugin locali devono avere già le
loro dipendenze installate, mentre i plugin npm, git e ClawHub vengono installati
sotto le radici plugin gestite da OpenClaw. Le dipendenze npm possono essere
hoistate all'interno della radice npm gestita da OpenClaw; installazione/aggiornamento
scansiona quella radice gestita prima della fiducia e la disinstallazione rimuove
i pacchetti gestiti da npm tramite npm. I plugin esterni e i percorsi di
caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`. Usa `openclaw plugins list --json` per vedere lo
stato statico `dependencyStatus` per ogni plugin visibile senza importare codice
runtime o riparare dipendenze. Consulta
[Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per il
ciclo di vita in fase di installazione.

### Proprietà del percorso plugin bloccato

Se la diagnostica dei plugin dice
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la validazione della configurazione segue con `plugin present but blocked`,
OpenClaw ha trovato file plugin di proprietà di un utente Unix diverso da quello
del processo che li sta caricando. Mantieni la configurazione del plugin al suo
posto; correggi la proprietà del filesystem o esegui OpenClaw come lo stesso
utente che possiede la directory di stato.

Per installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid
`1000`), quindi le directory di configurazione e workspace OpenClaw montate come
bind dall'host dovrebbero normalmente essere di proprietà dell'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la radice plugin
gestita assegnandola a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, riesegui `openclaw doctor --fix` o
`openclaw plugins registry --refresh` così il registro plugin persistito
corrisponde ai file riparati.

Per installazioni npm, selettori mutabili come `latest` o un dist-tag vengono
risolti prima dell'installazione e poi fissati alla versione esatta verificata
nella radice npm gestita da OpenClaw. Dopo che npm ha terminato, OpenClaw verifica
che la voce `package-lock.json` installata corrisponda ancora alla versione e
all'integrità risolte. Se npm scrive metadati di pacchetto diversi,
l'installazione fallisce e il pacchetto gestito viene ripristinato invece di
accettare un artefatto plugin diverso.
Le radici npm gestite ereditano anche gli `overrides` npm a livello di pacchetto
di OpenClaw, quindi i pin di sicurezza che proteggono l'host pacchettizzato si
applicano anche alle dipendenze dei plugin esterni hoistate.

I checkout sorgente sono workspace pnpm. Se cloni OpenClaw per lavorare sui
plugin inclusi, esegui `pnpm install`; OpenClaw carica quindi i plugin inclusi da
`extensions/<id>` così modifiche e dipendenze locali del pacchetto vengono usate
direttamente. Le installazioni radice npm semplici sono per OpenClaw
pacchettizzato, non per lo sviluppo da checkout sorgente.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue nel processo      | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono sotto `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in
`package.json`. Ogni voce deve restare all'interno della directory del pacchetto e
risolversi in un file runtime leggibile, oppure in un file sorgente TypeScript con
un peer JavaScript compilato inferito, ad esempio da `src/index.ts` a
`dist/index.js`.
Le installazioni pacchettizzate devono includere quell'output runtime JavaScript.
Il fallback al sorgente TypeScript è per checkout sorgente e percorsi di sviluppo
locale, non per pacchetti npm installati nella radice plugin gestita da OpenClaw.

Le directory non tracciate inserite nella radice globale delle estensioni sono
trattate come checkout sorgente locali e possono caricare direttamente entry
TypeScript. Le directory ancora nominate da un record di installazione, incluso
`installPath` o `sourcePath`, restano gestite e mantengono il requisito di output
compilato anche quando la scansione globale le vede. Se intendi convertire
un'installazione gestita in un checkout locale non tracciato, rimuovi prima il
record di installazione obsoleto con la disinstallazione o la pulizia doctor.

Se un avviso di pacchetto gestito dice che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript di
cui OpenClaw ha bisogno in runtime. Questo è un problema di pacchettizzazione del
plugin, non un problema di configurazione locale. Aggiorna o reinstalla il plugin
dopo che il publisher ripubblica JavaScript compilato, oppure disabilita/disinstalla
quel plugin finché non è disponibile un pacchetto corretto.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano
negli stessi percorsi delle entry sorgente. Quando presente, `runtimeExtensions`
deve contenere esattamente una voce per ogni voce `extensions`. Liste non
corrispondenti fanno fallire installazione e scoperta dei plugin invece di
ripiegare silenziosamente sui percorsi sorgente. Se pubblichi anche
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

ClawHub è il percorso di distribuzione principale per la maggior parte dei
plugin. Le versioni OpenClaw pacchettizzate correnti includono già molti plugin
ufficiali, quindi quelli non richiedono installazioni npm separate nelle
configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw continuerà a distribuire alcuni pacchetti plugin
`@openclaw/*` su npm per installazioni meno recenti/personalizzate e flussi di
lavoro npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione
del pacchetto proviene da una linea di pacchetti esterna più vecchia. Usa il
plugin incluso nell'OpenClaw corrente o un checkout locale finché non viene
pubblicato un pacchetto npm più recente.

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

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione degli
    embedding compatibili con OpenAI, esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` - Plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)

  </Accordion>
</AccordionGroup>

Cerchi Plugin di terze parti? Vedi [ClawHub](/it/clawhub).

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
| `bundledDiscovery` | Modalità di discovery dei Plugin inclusi (`allowlist` per impostazione predefinita) |
| `deny`             | Elenco negati dei Plugin (opzionale; deny ha la precedenza) |
| `load.paths`       | File/directory Plugin aggiuntivi                          |
| `slots`            | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Interruttori + configurazione per singolo Plugin          |

`plugins.allow` è esclusivo. Quando non è vuoto, possono essere caricati o
esporre strumenti solo i Plugin elencati, anche se `tools.allow` contiene `"*"`
o il nome specifico di uno strumento posseduto da un Plugin. Se un elenco
consentiti degli strumenti fa riferimento a strumenti Plugin, aggiungi gli id
dei Plugin proprietari a `plugins.allow` oppure rimuovi `plugins.allow`;
`openclaw doctor` avvisa di questa configurazione.

`plugins.bundledDiscovery` usa come valore predefinito `"allowlist"` per le
nuove configurazioni, quindi un inventario restrittivo `plugins.allow` blocca
anche i Plugin provider inclusi omessi, inclusa la discovery dei provider di
ricerca web runtime. Durante la migrazione, doctor marca le configurazioni
restrittive più vecchie dell'elenco consentiti con `"compat"` così gli upgrade
mantengono il comportamento legacy dei provider inclusi finché l'operatore non
sceglie la modalità più rigorosa. Un `plugins.allow` vuoto viene comunque
trattato come non impostato/aperto.

Le modifiche di configurazione eseguite tramite `/plugins enable` o
`/plugins disable` attivano una ricarica in-process dei Plugin del Gateway. I
nuovi turni dell'agente ricostruiscono il proprio elenco di strumenti dal
registro Plugin aggiornato. Le operazioni che modificano il sorgente, come
installazione, aggiornamento e disinstallazione, riavviano comunque il processo
Gateway perché i moduli Plugin già importati non possono essere sostituiti in
sicurezza sul posto.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei
Plugin. Un Plugin `enabled` lì significa che il registro persistito e la
configurazione corrente consentono al Plugin di partecipare. Non dimostra che
un Gateway remoto già in esecuzione abbia ricaricato o riavviato lo stesso
codice Plugin. Nelle configurazioni VPS/container con processi wrapper, invia i
riavvii o le scritture che attivano la ricarica al processo effettivo
`openclaw gateway run`, oppure usa `openclaw gateway restart` sul Gateway in
esecuzione quando la ricarica segnala un errore.

<Accordion title="Stati dei Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il Plugin esiste, ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id Plugin che la discovery non ha trovato.
  - **Non valido**: il Plugin esiste, ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel Plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il payload di configurazione.

</Accordion>

## Discovery e precedenza

OpenClaw cerca i Plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` - percorsi espliciti di file o directory. I percorsi che puntano
    alle directory dei Plugin inclusi pacchettizzati di OpenClaw vengono ignorati;
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

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i
Plugin inclusi dall'albero compilato `dist/extensions`. Se una directory
sorgente di un Plugin incluso viene montata tramite bind sopra il percorso
sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente
montata come overlay sorgente incluso e la scopre prima del bundle
pacchettizzato `/app/dist/extensions/synology-chat`. Questo mantiene funzionanti
i cicli container dei maintainer senza riportare ogni Plugin incluso al sorgente
TypeScript. Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i
bundle dist pacchettizzati anche quando sono presenti mount overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i Plugin e salta il lavoro di discovery/caricamento dei Plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel Plugin
- I Plugin originati dall'area di lavoro sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin inclusi seguono l'insieme integrato abilitato per impostazione predefinita salvo override
- Gli slot esclusivi possono forzare l'abilitazione del Plugin selezionato per quello slot
- Alcuni Plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta da un Plugin, come un riferimento modello provider, configurazione di canale o runtime harness
- La configurazione Plugin obsoleta viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i Plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini Plugin separati:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin app-server
  Codex incluso viene selezionato da riferimenti agente canonici `openai/*`, da
  `agentRuntime.id: "codex"` esplicito provider/model o dai riferimenti modello
  legacy `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un Plugin appare in `plugins list` ma gli effetti collaterali o gli hook di
`register(api)` non vengono eseguiti nel traffico chat live, controlla prima
questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL,
  profilo, percorso di configurazione e processo del Gateway attivo siano quelli
  che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice
  dei Plugin. Nei container wrapper, PID 1 potrebbe essere solo un supervisor;
  riavvia o invia un segnale al processo figlio `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni degli hook e
  diagnostica. Gli hook di conversazione non inclusi come `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito
  prima della risoluzione del modello per i turni agente; `llm_output` viene
  eseguito solo dopo che un tentativo di modello produce output dell'assistente.
- Come prova del modello effettivo della sessione, usa `openclaw sessions` o le
  superfici session/status del Gateway e, durante il debug dei payload provider,
  avvia il Gateway con `--raw-stream --raw-stream-path <path>`.

### Configurazione lenta degli strumenti Plugin

Se i turni dell'agente sembrano bloccarsi durante la preparazione degli
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

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti
Plugin più lente, inclusi id Plugin, nomi degli strumenti dichiarati, forma del
risultato e se lo strumento è opzionale. Le righe lente vengono promosse ad
avvisi quando una singola factory impiega almeno 1 s oppure la preparazione
totale delle factory degli strumenti Plugin impiega almeno 5 s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli
strumenti Plugin per risoluzioni ripetute con lo stesso contesto effettivo della
richiesta. La chiave cache include configurazione runtime effettiva, area di
lavoro, id agente/sessione, criterio sandbox, impostazioni browser, contesto di
delivery, identità del richiedente e stato di proprietà, quindi le factory che
dipendono da questi campi attendibili vengono rieseguite quando il contesto
cambia.

Se un Plugin domina i tempi, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel Plugin. Gli autori di Plugin
dovrebbero spostare il caricamento di dipendenze costose dietro il percorso di
esecuzione dello strumento invece di farlo dentro la factory dello strumento.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un Plugin abilitato sta cercando di possedere lo
stesso canale, flusso di configurazione o nome strumento. La causa più comune è
un Plugin di canale esterno installato accanto a un Plugin incluso che ora
fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni Plugin
  abilitato e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ogni Plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti Plugin, così i metadati persistiti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un Plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  Plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver`
  con l'id Plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione
  obsoleta del Plugin.
- Se hai abilitato esplicitamente entrambi i Plugin, OpenClaw mantiene quella
  richiesta e segnala il conflitto. Scegli un solo proprietario per il canale o
  rinomina gli strumenti posseduti dai Plugin in modo che la superficie runtime
  sia univoca.

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

| Slot            | Cosa controlla         | Predefinito         |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin di memoria attiva | `memory-core`     |
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

I Plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il Plugin browser incluso). Altri Plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un Plugin installato o un hook pack esistente. Usa `openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei Plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece di copiarlo sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del Plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id Plugin è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta, così l'installazione esplicita è caricabile subito dopo il riavvio.

OpenClaw mantiene un registro locale persistente dei Plugin come modello di lettura a freddo per l'inventario dei Plugin, la proprietà dei contributi e la pianificazione dell'avvio. I flussi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato dei Plugin. Lo stesso file `plugins/installs.json` mantiene metadati di installazione durevoli in `installRecords` di primo livello e metadati di manifesto ricostruibili in `plugins`. Se il registro è mancante, obsoleto o non valido, `openclaw plugins registry --refresh` ricostruisce la sua vista del manifesto dai record di installazione, dai criteri di configurazione e dai metadati di manifesto/pacchetto senza caricare moduli runtime dei Plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i modificatori del ciclo di vita dei Plugin sono disabilitati. Gestisci invece la selezione dei pacchetti Plugin e la configurazione tramite il sorgente Nix dell'installazione; per nix-openclaw, inizia dalla [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) orientata prima all'agente.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto riportandolo al record del Plugin tracciato e registra la nuova specifica per aggiornamenti futuri. Passare il nome del pacchetto senza una versione riporta un'installazione bloccata a una versione esatta alla linea di rilascio predefinita del registro. Se il Plugin npm installato corrisponde già alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento senza scaricare, reinstallare o riscrivere la configurazione.
Quando `openclaw update` viene eseguito sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta` e ripiegano su default/latest quando non esiste alcuna release beta del Plugin. Le versioni esatte e i tag espliciti restano bloccati.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è una deroga di emergenza per falsi positivi dello scanner integrato di codice pericoloso. Consente alle installazioni e agli aggiornamenti dei Plugin di proseguire oltre i rilevamenti `critical` integrati, ma non aggira comunque i blocchi dei criteri `before_install` dei Plugin né il blocco per errori di scansione. Le scansioni di installazione ignorano file e directory di test comuni come `tests/`, `__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati; gli entrypoint runtime dichiarati dei Plugin vengono comunque scansionati anche se usano uno di quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze delle Skills supportate dal Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione delle Skills ClawHub.

Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua macchina; non chiede a ClawHub di rieseguire la scansione del Plugin né rende pubblica una release bloccata.

I bundle compatibili partecipano allo stesso flusso list/inspect/enable/disable dei Plugin. Il supporto runtime attuale include Skills dei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers` dichiarate dal manifesto, command-skills Cursor e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le funzionalità bundle rilevate più le voci server MCP e LSP supportate o non supportate per i Plugin supportati da bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto Claude da `~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. Per i marketplace remoti, le voci Plugin devono restare all'interno del repository marketplace clonato e usare solo sorgenti con percorsi relativi.

Consulta il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del Plugin. Il loader ripiega ancora su `activate(api)` per i Plugin meno recenti, ma i Plugin inclusi e i nuovi Plugin esterni dovrebbero considerare `register` il contratto pubblico.

`api.registrationMode` indica a un Plugin perché la sua entry viene caricata:

| Modalità       | Significato                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri side effect live.                                          |
| `discovery`    | Rilevamento di funzionalità in sola lettura. Registra provider e metadati; il codice entry del Plugin attendibile può caricarsi, ma salta i side effect live. |
| `setup-only`   | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                                        |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                          |
| `cli-metadata` | Solo raccolta dei metadati dei comandi CLI.                                                                                               |

Le entry dei Plugin che aprono socket, database, worker in background o client di lunga durata dovrebbero proteggere quei side effect con `api.registrationMode === "full"`. I caricamenti di discovery sono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono il registro Gateway in esecuzione. La discovery è non attivante, non priva di import: OpenClaw può valutare la entry del Plugin attendibile o il modulo Plugin del canale per costruire lo snapshot. Mantieni i top level dei moduli leggeri e privi di side effect, e sposta client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi dietro percorsi full-runtime.

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
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio         |
| `registerImageGenerationProvider`       | Generazione di immagini           |
| `registerMusicGenerationProvider`       | Generazione musicale              |
| `registerVideoGenerationProvider`       | Generazione video                 |
| `registerWebFetchProvider`              | Provider web fetch / scrape       |
| `registerWebSearchProvider`             | Ricerca web                       |
| `registerHttpRoute`                     | Endpoint HTTP                     |
| `registerCommand` / `registerCli`       | Comandi CLI                       |
| `registerContextEngine`                 | Motore di contesto                |
| `registerService`                       | Servizio in background            |

Comportamento di guardia degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella un annullamento precedente.

Il server app nativo di Codex esegue il bridge degli eventi degli strumenti nativi di Codex verso questa superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`, osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi di Codex. Il confine esatto del supporto del runtime Codex si trova nel
[contratto di supporto Codex harness v1](/it/plugins/codex-harness-runtime#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta la [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) - crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) - compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) - schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) - aggiungi strumenti agente in un Plugin
- [Internals dei Plugin](/it/plugins/architecture) - modello di capability e pipeline di caricamento
- [ClawHub](/it/clawhub) - scoperta di Plugin di terze parti
