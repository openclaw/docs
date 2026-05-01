---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere il rilevamento dei Plugin e le regole di caricamento
    - Lavorare con pacchetti di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-01T08:34:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2df8aca086aafbd8f268820f1ccc2425079c69f1a673a4c2ea163aba1358ff51
    source_path: tools/plugin.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, skills, sintesi vocale, trascrizione realtime,
voce realtime, comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca web
e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni**. La maggior parte dei plugin esterni viene pubblicata e scoperta tramite
[ClawHub](/it/tools/clawhub). Npm rimane supportato per le installazioni dirette e per un
insieme temporaneo di pacchetti plugin di proprietà di OpenClaw finché la migrazione non sarà completata.

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

    Poi configura sotto `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci il controllo nativo nella chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, esplicito
`clawhub:<pkg>`, esplicito `npm:<pkg>`, o specifica di pacchetto semplice (prima ClawHub, poi
fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di reinstallazione dei plugin in bundle
per i plugin che optano per
`openclaw.install.allowInvalidConfigRecovery`.
Durante l'avvio del Gateway, una configurazione non valida per un plugin viene isolata a quel plugin:
l'avvio registra il problema `plugins.entries.<id>.config`, salta quel plugin durante
il caricamento e mantiene online gli altri plugin e canali. Esegui `openclaw doctor --fix`
per mettere in quarantena la configurazione del plugin non valida disabilitando quella voce del plugin e rimuovendo
il suo payload di configurazione non valido; il normale backup della configurazione mantiene i valori precedenti.
Quando una configurazione di canale fa riferimento a un plugin che non è più individuabile ma lo
stesso id plugin obsoleto rimane nella configurazione dei plugin o nei record di installazione, l'avvio del Gateway
registra avvisi e salta quel canale invece di bloccare ogni altro canale.
Esegui `openclaw doctor --fix` per rimuovere le voci obsolete di canale/plugin; le chiavi
di canale sconosciute senza evidenza di plugin obsoleto continuano a fallire la validazione così i refusi restano
visibili.
Se `plugins.enabled: false` è impostato, i riferimenti a plugin obsoleti vengono trattati come inerti:
l'avvio del Gateway salta il lavoro di scoperta/caricamento dei plugin e `openclaw doctor` preserva
la configurazione dei plugin disabilitati invece di rimuoverla automaticamente. Riabilita i plugin prima
di eseguire la pulizia con doctor se vuoi rimuovere gli id plugin obsoleti.

Le installazioni pacchettizzate di OpenClaw non installano preventivamente l'intero albero di dipendenze
runtime di ogni plugin in bundle. Quando un plugin in bundle di proprietà di OpenClaw è attivo dalla
configurazione dei plugin, dalla configurazione legacy dei canali o da un manifest abilitato per impostazione predefinita, l'avvio
ripara solo le dipendenze runtime dichiarate di quel plugin prima di importarlo.
Lo stato di autenticazione del canale persistito da solo non attiva un canale in bundle per la
riparazione delle dipendenze runtime all'avvio del Gateway.
La disabilitazione esplicita prevale comunque: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impediscono la riparazione automatica delle dipendenze runtime in bundle per quel plugin/canale.
Anche un `plugins.allow` non vuoto limita la riparazione delle dipendenze runtime
in bundle abilitate per impostazione predefinita; l'abilitazione esplicita del canale in bundle (`channels.<id>.enabled: true`) può
comunque riparare le dipendenze del plugin di quel canale.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.
Consulta [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) per l'intero
ciclo di vita di pianificazione e staging.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                     | Esempi                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue in-process        | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono sotto `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare plugin](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point dei pacchetti

I pacchetti npm di plugin nativi devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve restare all'interno della directory del pacchetto e risolversi in un file
runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
inferito, come da `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` quando i file runtime pubblicati non si trovano negli
stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce `extensions`. Liste non corrispondenti fanno fallire installazione e
scoperta dei plugin invece di ricadere silenziosamente sui percorsi sorgente.

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
attuali di OpenClaw includono già molti plugin ufficiali, quindi questi non richiedono
installazioni npm separate nelle configurazioni normali. Finché ogni plugin di proprietà di OpenClaw non sarà
migrato a ClawHub, OpenClaw distribuisce ancora alcuni pacchetti plugin `@openclaw/*` su
npm per installazioni più vecchie/personalizzate e workflow npm diretti.

Se npm segnala un pacchetto plugin `@openclaw/*` come deprecato, quella versione del pacchetto
proviene da un treno di pacchetti esterni più vecchio. Usa il plugin in bundle da
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
    - `memory-core` — ricerca di memoria in bundle (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine install-on-demand con richiamo/cattura automatici (imposta `plugins.slots.memory = "memory-lancedb"`)

    Consulta [Memory LanceDB](/it/plugins/memory-lancedb) per la configurazione degli embedding compatibili con OpenAI,
    esempi Ollama, limiti di richiamo e risoluzione dei problemi.

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser in bundle per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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

| Campo            | Descrizione                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)             |
| `allow`          | Allowlist dei plugin (opzionale)                          |
| `deny`           | Denylist dei plugin (opzionale; deny prevale)             |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + configurazione per plugin                        |

`plugins.allow` è esclusivo. Quando non è vuoto, solo i plugin elencati possono essere caricati
o esporre strumenti, anche se `tools.allow` contiene `"*"` o il nome specifico
di uno strumento appartenente a un plugin. Se un allowlist di strumenti fa riferimento a strumenti plugin, aggiungi gli id dei plugin proprietari
a `plugins.allow` o rimuovi `plugins.allow`; `openclaw doctor` avvisa di questa
forma.

Le modifiche di configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con il watch della configurazione
+ riavvio in-process abilitato (il percorso predefinito `openclaw gateway`), quel
riavvio viene di solito eseguito automaticamente poco dopo la scrittura della configurazione.
Non esiste un percorso di hot-reload supportato per il codice runtime dei plugin nativi o per gli hook del ciclo di vita;
riavvia il processo Gateway che serve il canale live prima di
aspettarti l'esecuzione di codice `register(api)` aggiornato, hook `api.on(...)`, strumenti, servizi o
hook provider/runtime.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un plugin
`enabled` lì significa che il registro persistito e la configurazione corrente consentono al
plugin di partecipare. Non prova che un processo figlio Gateway remoto già in esecuzione
sia stato riavviato con lo stesso codice plugin. In configurazioni VPS/container con
processi wrapper, invia i riavvii al processo `openclaw gateway run` effettivo,
oppure usa `openclaw gateway restart` contro il Gateway in esecuzione.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che la scoperta non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato. L'avvio del Gateway salta solo quel plugin; `openclaw doctor --fix` può mettere in quarantena la voce non valida disabilitandola e rimuovendo il suo payload di configurazione.

</Accordion>

## Scoperta e precedenza

OpenClaw cerca plugin in questo ordine (la prima corrispondenza vince):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che puntano
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
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, sintesi vocale).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

Le installazioni pacchettizzate e le immagini Docker risolvono normalmente i plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin incluso viene
montata con bind sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come overlay sorgente incluso e la rileva prima del bundle pacchettizzato
`/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i cicli dei container dei manutentori
senza riportare ogni plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti mount di overlay sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin e salta il lavoro di rilevamento/caricamento dei plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme integrato abilitato per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie di proprietà del plugin, come un riferimento a modello provider, una configurazione di canale o un runtime
  harness
- La configurazione obsoleta dei plugin viene preservata mentre `plugins.enabled: false` è attivo;
  riabilita i plugin prima di eseguire la pulizia con doctor se vuoi rimuovere gli id obsoleti
- Le route Codex della famiglia OpenAI mantengono confini di plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex
  incluso è selezionato da `agentRuntime.id: "codex"` o dai riferimenti modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico di chat live, controlla prima questi aspetti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL del
  Gateway attivo, il profilo, il percorso di configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei container wrapper,
  PID 1 può essere solo un supervisore; riavvia o invia un segnale al processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --runtime --json` per confermare registrazioni degli hook e
  diagnostica. Gli hook di conversazione non inclusi come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni agente; `llm_output` viene eseguito solo dopo che un tentativo del modello
  produce output assistant.
- Come prova del modello sessione effettivo, usa `openclaw sessions` o le superfici
  sessione/stato del Gateway e, durante il debug dei payload provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questi indicano che più di un plugin abilitato sta tentando di possedere lo stesso canale,
flusso di configurazione o nome strumento. La causa più comune è un plugin di canale esterno
installato accanto a un plugin incluso che ora fornisce lo stesso id canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --runtime --json` per ciascun plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, così i metadati persistenti riflettono l'installazione corrente.
- Riavvia il Gateway dopo modifiche di installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id canale, il
  plugin preferito dovrebbe dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id del plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita un lato con
  `plugins.entries.<plugin-id>.enabled: false` o rimuovi l'installazione obsoleta del plugin.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw conserva quella richiesta e
  segnala il conflitto. Scegli un solo proprietario per il canale o rinomina gli strumenti di proprietà del plugin
  in modo che la superficie runtime sia inequivocabile.

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

| Slot            | Cosa controlla        | Predefinito         |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin memoria attiva | `memory-core`       |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/diagnostics
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

I plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
i provider di modelli inclusi, i provider di sintesi vocale inclusi e il plugin browser incluso).
Altri plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o un pacchetto hook esistente. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del
plugin installato a quell'allowlist prima di abilitarlo. Se lo stesso id plugin
è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta così che
l'installazione esplicita sia caricabile subito dopo il riavvio.

OpenClaw mantiene un registro plugin locale persistente come modello di lettura a freddo per
inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo
stato dei plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione duraturi in
`installRecords` di primo livello e metadati manifest ricostruibili in `plugins`. Se
il registro è mancante, obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la sua vista manifest dai record di installazione, dalla policy di configurazione e dai
metadati manifest/package senza caricare moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
di nuovo al record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri.
Passare il nome del pacchetto senza versione riporta un'installazione esatta bloccata alla
linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni marketplace persistono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override d'emergenza per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni e agli
aggiornamenti dei plugin di proseguire oltre i rilevamenti `critical` integrati, ma comunque
non bypassa i blocchi di policy `before_install` dei plugin né il blocco per errore di scansione.
Le scansioni di installazione ignorano file e directory di test comuni come `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*` per evitare di bloccare mock di test pacchettizzati;
gli entrypoint runtime dichiarati dei plugin vengono comunque scansionati anche se usano uno di
quei nomi.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento plugin. Le installazioni di dipendenze Skills
basate su Gateway usano invece l'override di richiesta `dangerouslyForceUnsafeInstall`
corrispondente, mentre `openclaw skills install` resta il flusso separato di download/installazione Skills
da ClawHub.

Se un plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione, apri la
dashboard ClawHub o esegui `clawhub package rescan <name>` per chiedere a ClawHub di controllarlo
di nuovo. `--dangerously-force-unsafe-install` influisce solo sulle installazioni sulla tua
macchina; non chiede a ClawHub di rieseguire la scansione del plugin né di rendere pubblica
una release bloccata.

I bundle compatibili partecipano allo stesso flusso plugin list/inspect/enable/disable.
Il supporto runtime attuale include Skills dei bundle, command-skills Claude,
impostazioni predefinite `settings.json` di Claude, impostazioni predefinite `lspServers`
di Claude `.lsp.json` e dichiarate dal manifest, command-skills Cursor e directory hook Codex
compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità bundle rilevate, più
voci server MCP e LSP supportate o non supportate per plugin basati su bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una radice marketplace locale o un percorso
`marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL repo GitHub
o un URL git. Per i marketplace remoti, le voci plugin devono restare dentro il
repo marketplace clonato e usare solo sorgenti con percorsi relativi.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell'API Plugin

I Plugin nativi esportano un oggetto di ingresso che espone `register(api)`. I Plugin più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi Plugin dovrebbero usare `register`.

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

OpenClaw carica l'oggetto di ingresso e chiama `register(api)` durante
l'attivazione del Plugin. Il loader ricorre ancora a `activate(api)` per i Plugin più vecchi,
ma i Plugin inclusi e i nuovi Plugin esterni dovrebbero trattare `register` come
contratto pubblico.

`api.registrationMode` indica a un Plugin perché la sua voce viene caricata:

| Modalità       | Significato                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                           |
| `discovery`    | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice di ingresso del Plugin attendibile può caricarsi, ma salta gli effetti collaterali live. |
| `setup-only`   | Caricamento dei metadati di configurazione del canale tramite una voce di configurazione leggera.                                  |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la voce runtime.                                                     |
| `cli-metadata` | Solo raccolta dei metadati dei comandi CLI.                                                                                         |

Le voci dei Plugin che aprono socket, database, worker in background o client
a lunga durata dovrebbero proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di discovery vengono memorizzati nella cache separatamente dai caricamenti di attivazione e non sostituiscono
il registro del Gateway in esecuzione. La discovery non è attivante, ma non è priva di import:
OpenClaw può valutare la voce del Plugin attendibile o il modulo del Plugin di canale per creare
lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi
dietro percorsi runtime completi.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                         |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)             |
| `registerChannel`                       | Canale chat                           |
| `registerTool`                          | Strumento dell'agente                 |
| `registerHook` / `on(...)`              | Hook del ciclo di vita                |
| `registerSpeechProvider`                | Text-to-speech / STT                  |
| `registerRealtimeTranscriptionProvider` | STT in streaming                      |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex                  |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio             |
| `registerImageGenerationProvider`       | Generazione di immagini               |
| `registerMusicGenerationProvider`       | Generazione musicale                  |
| `registerVideoGenerationProvider`       | Generazione video                     |
| `registerWebFetchProvider`              | Provider di recupero / scraping web   |
| `registerWebSearchProvider`             | Ricerca web                           |
| `registerHttpRoute`                     | Endpoint HTTP                         |
| `registerCommand` / `registerCli`       | Comandi CLI                           |
| `registerContextEngine`                 | Motore di contesto                    |
| `registerService`                       | Servizio in background                |

Comportamento delle protezioni degli hook per gli hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; i gestori con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

Il server app nativo di Codex instrada gli eventi degli strumenti nativi di Codex verso questa
superficie di hook. I Plugin possono bloccare gli strumenti nativi di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni Codex
`PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi di Codex.
Il confine esatto del supporto runtime di Codex si trova nel
[contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, consulta [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) — crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti per agenti in un Plugin
- [Elementi interni dei Plugin](/it/plugins/architecture) — modello delle capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
