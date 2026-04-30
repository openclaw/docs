---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Utilizzare i bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-30T09:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, parlato, trascrizione in tempo reale,
voce in tempo reale, comprensione dei media, generazione di immagini,
generazione di video, recupero web, ricerca web e altro ancora. Alcuni plugin
sono **core** (distribuiti con OpenClaw), altri sono **esterni**. La maggior
parte dei plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm rimane supportato per le installazioni dirette e
per un set temporaneo di pacchetti plugin di proprietà di OpenClaw mentre la
migrazione viene completata.

## Avvio rapido

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Se preferisci il controllo nativo della chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio
locale, `clawhub:<pkg>` esplicito, `npm:<pkg>` esplicito o specifica di
pacchetto semplice (prima ClawHub, poi fallback su npm).

Se la configurazione non è valida, l'installazione di norma fallisce in modo
chiuso e ti indirizza a `openclaw doctor --fix`. L'unica eccezione di recupero è
uno stretto percorso di reinstallazione dei plugin inclusi per i plugin che
aderiscono a `openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, la configurazione non valida di un plugin viene
isolata a quel plugin: l'avvio registra il problema
`plugins.entries.<id>.config`, salta quel plugin durante il caricamento e
mantiene online gli altri plugin e canali. Esegui `openclaw doctor --fix` per
mettere in quarantena la configurazione errata del plugin disabilitando quella
voce del plugin e rimuovendo il relativo payload di configurazione non valido;
il normale backup della configurazione conserva i valori precedenti.
Quando la configurazione di un canale fa riferimento a un plugin che non è più
rilevabile, ma lo stesso id plugin obsoleto rimane nella configurazione dei
plugin o nei record di installazione, l'avvio del Gateway registra avvisi e
salta quel canale invece di bloccare tutti gli altri canali. Esegui
`openclaw doctor --fix` per rimuovere le voci canale/plugin obsolete; le chiavi
canale sconosciute senza evidenza di plugin obsoleto continuano a fallire la
validazione, così gli errori di battitura restano visibili.
Se è impostato `plugins.enabled: false`, i riferimenti a plugin obsoleti vengono
trattati come inerti: l'avvio del Gateway salta il lavoro di scoperta/caricamento
dei plugin e `openclaw doctor` conserva la configurazione dei plugin disabilitata
invece di rimuoverla automaticamente. Riabilita i plugin prima di eseguire la
pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

Le installazioni pacchettizzate di OpenClaw non installano anticipatamente
l'intero albero delle dipendenze di runtime di ogni plugin incluso. Quando un
plugin di proprietà di OpenClaw incluso è attivo dalla configurazione dei plugin,
dalla configurazione canale legacy o da un manifesto abilitato per impostazione
predefinita, l'avvio ripara solo le dipendenze di runtime dichiarate da quel
plugin prima di importarlo. Lo stato di autenticazione persistito del canale da
solo non attiva un canale incluso per la riparazione delle dipendenze di runtime
all'avvio del Gateway.
La disabilitazione esplicita continua a prevalere: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impediscono la riparazione automatica delle dipendenze di runtime incluse per
quel plugin/canale. Anche un `plugins.allow` non vuoto limita la riparazione
delle dipendenze di runtime incluse abilitate per impostazione predefinita;
l'abilitazione esplicita di un canale incluso (`channels.<id>.enabled: true`)
può comunque riparare le dipendenze del plugin di quel canale.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque
essere installati tramite `openclaw plugins install`.

## Tipi di Plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo di runtime; esegue in-process     | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato a funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Plugin Bundle](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare Plugin](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare dentro la directory del pacchetto e risolversi in un file
di runtime leggibile, oppure in un file sorgente TypeScript con un peer
JavaScript compilato inferito, come da `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` quando i file di runtime pubblicati non si
trovano negli stessi percorsi delle voci sorgente. Quando presente,
`runtimeExtensions` deve contenere esattamente una voce per ogni voce
`extensions`. Liste non corrispondenti fanno fallire installazione e scoperta
dei plugin invece di ricadere silenziosamente sui percorsi sorgente.

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
plugin. Le release pacchettizzate attuali di OpenClaw includono già molti plugin
ufficiali, quindi nelle configurazioni normali non richiedono installazioni npm
separate. Finché ogni plugin di proprietà di OpenClaw non sarà migrato a
ClawHub, OpenClaw continuerà a distribuire alcuni pacchetti plugin `@openclaw/*`
su npm per installazioni più vecchie/personalizzate e workflow npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione
del pacchetto proviene da una vecchia linea di pacchetti esterni. Usa il plugin
incluso in OpenClaw corrente o un checkout locale finché non viene pubblicato un
pacchetto npm più recente.

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
    - `memory-core` — ricerca di memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installabile on-demand con richiamo/acquisizione automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Vedi [Memory LanceDB](/it/plugins/memory-lancedb) per configurazione degli
    embedding compatibile con OpenAI, esempi Ollama, limiti di richiamo e
    risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider di parlato (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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
| `allow`          | Allowlist dei plugin (facoltativa)                        |
| `deny`           | Denylist dei plugin (facoltativa; deny prevale)           |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (per es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + configurazione per plugin                        |

Le modifiche di configurazione **richiedono il riavvio del gateway**. Se il
Gateway è in esecuzione con osservazione della configurazione + riavvio
in-process abilitati (il percorso predefinito `openclaw gateway`), quel riavvio
di solito viene eseguito automaticamente poco dopo la scrittura della
configurazione. Non esiste un percorso di hot-reload supportato per il codice di
runtime dei plugin nativi o gli hook del ciclo di vita; riavvia il processo
Gateway che serve il canale live prima di aspettarti che il codice
`register(api)`, gli hook `api.on(...)`, gli strumenti, i servizi o gli hook
provider/runtime aggiornati vengano eseguiti.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei
plugin. Un plugin `enabled` lì significa che il registro persistito e la
configurazione corrente permettono al plugin di partecipare. Non dimostra che un
figlio Gateway remoto già in esecuzione sia stato riavviato nello stesso codice
plugin. In configurazioni VPS/container con processi wrapper, invia i riavvii al
processo effettivo `openclaw gateway run`, oppure usa `openclaw gateway restart`
contro il Gateway in esecuzione.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene conservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che la scoperta non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il relativo payload di configurazione.

</Accordion>

## Scoperta e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che
    puntano di nuovo alle directory dei plugin inclusi pacchettizzati di
    OpenClaw vengono ignorati; esegui `openclaw doctor --fix` per rimuovere
    quegli alias obsoleti.
  </Step>

  <Step title="Plugin del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin in bundle">
    Forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker di norma risolvono i plugin in bundle dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin in bundle viene
montata in bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente in bundle e la scopre prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop dei container
dei maintainer senza riportare ogni plugin in bundle al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di discovery/caricamento dei plugin
- `plugins.deny` ha sempre precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin con origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin in bundle seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin in bundle opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un riferimento a un modello provider, una configurazione di canale o un runtime
  harness
- La configurazione obsoleta dei plugin viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini di plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex
  in bundle viene selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook di runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico di chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL del
  Gateway attivo, il profilo, il percorso della configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei container wrapper,
  PID 1 potrebbe essere solo un supervisor; riavvia o segnala il processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` per confermare registrazioni degli hook e
  diagnostica. Gli hook di conversazione non in bundle come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per provare il modello effettivo della sessione, usa `openclaw sessions` o le
  superfici session/status del Gateway e, quando esegui il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa più comune è un plugin canale esterno
installato accanto a un plugin in bundle che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, così i metadati persistiti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registry o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito deve dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id del plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene quella richiesta e
  segnala il conflitto. Scegli un solo proprietario per il canale o rinomina gli strumenti
  posseduti dal plugin in modo che la superficie di runtime sia non ambigua.

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

| Slot            | Che cosa controlla           | Predefinito          |
| --------------- | ---------------------------- | -------------------- |
| `memory`        | Plugin Active memory         | `memory-core`        |
| `contextEngine` | Motore di contesto attivo    | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin in bundle vengono forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
i provider di modelli in bundle, i provider vocali in bundle e il plugin browser in bundle).
Altri plugin in bundle richiedono ancora `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato esistente o un pacchetto di hook. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riusa il percorso sorgente invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id
del plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin
è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta in modo che
l'installazione esplicita sia caricabile immediatamente dopo il riavvio.

OpenClaw mantiene un registry locale persistito dei plugin come modello di lettura a freddo per
inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registry dopo aver cambiato lo stato dei plugin.
Lo stesso file `plugins/installs.json` mantiene metadati di installazione durevoli in
`installRecords` di primo livello e metadati manifest ricostruibili in `plugins`. Se
il registry manca, è obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la sua vista manifest da record di installazione, policy di configurazione e
metadati manifest/package senza caricare moduli di runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
al record del plugin tracciato e registra la nuova spec per aggiornamenti futuri.
Passare il nome del pacchetto senza una versione sposta un'installazione pinned esatta di nuovo alla
linea di rilascio predefinita del registry. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono metadati della sorgente marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi
positivi dallo scanner integrato per codice pericoloso. Permette a installazioni di plugin
e aggiornamenti di plugin di proseguire oltre i risultati `critical` integrati, ma continua
a non bypassare i blocchi policy `before_install` dei plugin o il blocco per fallimento della scansione.
Le scansioni di installazione ignorano file e directory di test comuni come `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati;
gli entrypoint runtime dichiarati del plugin vengono comunque scansionati anche se usano uno di
quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skills
supportate dal Gateway usano invece l'override di richiesta `dangerouslyForceUnsafeInstall`
corrispondente, mentre `openclaw skills install` resta il flusso separato di download/installazione
skill di ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la
dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo
di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua
macchina; non chiede a ClawHub di riesaminare il plugin o rendere pubblica una release bloccata.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei plugin. Il supporto runtime corrente include Skills in bundle, command-skills Claude,
impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` e `lspServers`
dichiarati dal manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità bundle rilevate più
le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto Claude da
`~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso
`marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL repo GitHub
o un URL git. Per marketplace remoti, le voci plugin devono restare all'interno del
repo marketplace clonato e usare solo sorgenti con percorso relativo.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica API dei plugin

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
Il loader ricade ancora su `activate(api)` per i plugin più vecchi,
ma i plugin in bundle e i nuovi plugin esterni dovrebbero trattare `register` come
contratto pubblico.

`api.registrationMode` dice a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali attivi.                           |
| `discovery`     | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice di ingresso di Plugin attendibili può essere caricato, ma salta gli effetti collaterali attivi. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite un punto di ingresso di configurazione leggero.                         |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche il punto di ingresso runtime.                                          |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                          |

Le entry dei Plugin che aprono socket, database, worker in background o client di lunga durata
dovrebbero proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di rilevamento vengono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono
il registro Gateway in esecuzione. Il rilevamento è non attivante, non privo di import:
OpenClaw può valutare la entry del Plugin attendibile o il modulo del Plugin di canale per costruire
lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta
client di rete, sottoprocessi, listener, letture delle credenziali e avvio dei servizi
dietro percorsi di runtime completo.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)   |
| `registerChannel`                       | Canale di chat              |
| `registerTool`                          | Strumento dell'agente       |
| `registerHook` / `on(...)`              | Hook del ciclo di vita      |
| `registerSpeechProvider`                | Sintesi vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT in streaming            |
| `registerRealtimeVoiceProvider`         | Voce in tempo reale duplex  |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio   |
| `registerImageGenerationProvider`       | Generazione di immagini     |
| `registerMusicGenerationProvider`       | Generazione musicale        |
| `registerVideoGenerationProvider`       | Generazione video           |
| `registerWebFetchProvider`              | Provider di fetch / scraping web |
| `registerWebSearchProvider`             | Ricerca web                 |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandi CLI                 |
| `registerContextEngine`                 | Motore di contesto          |
| `registerService`                       | Servizio in background      |

Comportamento delle protezioni degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è una non operazione e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è una non operazione e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è una non operazione e non annulla un annullamento precedente.

L'app-server Codex nativo esegue il bridge degli eventi degli strumenti nativi di Codex verso questa
superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti
nativi di Codex. Il confine esatto del supporto runtime di Codex si trova nel
[contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, vedi [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti dell'agente in un Plugin
- [Interni dei Plugin](/it/plugins/architecture) — modello delle capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
