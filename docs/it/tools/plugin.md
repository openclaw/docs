---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere il rilevamento dei plugin e le regole di caricamento
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-26T11:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness degli agenti, strumenti, Skills, voce, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, recupero dal web, ricerca sul web
e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **external** (pubblicati su npm dalla community).

## Avvio rapido

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un plugin">
    ```bash
    # Da npm
    openclaw plugins install @openclaw/voice-call

    # Da una directory locale o da un archivio
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci un controllo nativo tramite chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>`
esplicito oppure specifica di pacchetto semplice (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, normalmente l'installazione fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di
reinstallazione di plugin inclusi per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo anticipato l'intero
albero delle dipendenze di runtime di ogni plugin incluso.
Quando un plugin incluso di proprietà di OpenClaw è attivo dalla configurazione dei plugin,
dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita,
l'avvio ripara solo le dipendenze di runtime dichiarate di quel plugin prima di importarlo.
Il solo stato di autenticazione del canale persistito non attiva un canale incluso per la riparazione
delle dipendenze di runtime all'avvio del Gateway.
La disabilitazione esplicita continua ad avere la precedenza: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impediscono la riparazione automatica delle dipendenze di runtime incluse per quel plugin/canale.
Anche un `plugins.allow` non vuoto limita la riparazione delle dipendenze di runtime incluse
abilitate per impostazione predefinita; l'abilitazione esplicita di un canale incluso (`channels.<id>.enabled: true`) può
comunque riparare le dipendenze del plugin di quel canale.
I plugin external e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                   | Esempi                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; viene eseguito in-process | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin native, inizia con [Creazione di plugin](/it/plugins/building-plugins)
e con la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry point del pacchetto

I pacchetti npm di plugin native devono dichiarare `openclaw.extensions` in `package.json`.
Ogni voce deve rimanere all'interno della directory del pacchetto e risolversi in un file
di runtime leggibile, oppure in un file sorgente TypeScript con un peer JavaScript compilato
dedotto, come da `src/index.ts` a `dist/index.js`.

Usa `openclaw.runtimeExtensions` quando i file di runtime pubblicati non si trovano
negli stessi percorsi delle voci sorgente. Quando presente, `runtimeExtensions` deve contenere
esattamente una voce per ogni voce in `extensions`. Elenchi non corrispondenti fanno fallire
l'installazione e il rilevamento dei plugin invece di eseguire silenziosamente il fallback ai percorsi sorgente.

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

### Installabili (npm)

| Plugin          | Pacchetto              | Documentazione                       |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/it/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/it/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/it/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/it/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/it/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/it/plugins/zalouser)   |

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
    - `memory-lancedb` — memoria a lungo termine installata su richiesta con auto-recall/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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

| Campo           | Descrizione                                              |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)            |
| `allow`          | Allowlist dei plugin (facoltativa)                       |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza) |
| `load.paths`     | File/directory di plugin aggiuntivi                      |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruttori + configurazione per plugin                 |

Le modifiche alla configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con il controllo
della configurazione + il riavvio in-process abilitati (il percorso predefinito `openclaw gateway`),
di solito quel riavvio viene eseguito automaticamente poco dopo che la scrittura della configurazione viene applicata.
Non esiste un percorso di hot-reload supportato per il codice runtime dei plugin native o per gli hook
del ciclo di vita; riavvia il processo Gateway che serve il canale live prima di
aspettarti che il codice `register(api)` aggiornato, gli hook `api.on(...)`, gli strumenti, i servizi o
gli hook del provider/runtime vengano eseguiti.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un
plugin `enabled` lì significa che il registro persistito e la configurazione corrente consentono al
plugin di partecipare. Non prova che un child remoto del Gateway già in esecuzione
sia stato riavviato con lo stesso codice del plugin. In configurazioni VPS/container con
processi wrapper, invia i riavvii al processo effettivo `openclaw gateway run`
oppure usa `openclaw gateway restart` sul Gateway in esecuzione.

<Accordion title="Stati del plugin: disabled vs missing vs invalid">
  - **Disabled**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Missing**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Invalid**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.

</Accordion>

## Rilevamento e precedenza

OpenClaw analizza i plugin in questo ordine (la prima corrispondenza ha la precedenza):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory. I percorsi che
    rimandano alle directory dei plugin inclusi pacchettizzati di OpenClaw vengono ignorati;
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

Le installazioni pacchettizzate e le immagini Docker normalmente risolvono i plugin inclusi dall'albero
compilato `dist/extensions`. Se una directory sorgente di un plugin incluso viene
montata in bind sopra il corrispondente percorso sorgente pacchettizzato, per esempio
`/app/extensions/synology-chat`, OpenClaw tratta quella directory sorgente montata
come un overlay sorgente incluso e la rileva prima del bundle
pacchettizzato `/app/dist/extensions/synology-chat`. Questo mantiene funzionanti i loop
dei maintainer nei container senza riportare ogni plugin incluso al sorgente TypeScript.
Imposta `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` per forzare i bundle dist pacchettizzati
anche quando sono presenti montaggi overlay del sorgente.

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin con origine nel workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme predefinito attivo integrato, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi opt-in vengono abilitati automaticamente quando la configurazione assegna un nome a una
  superficie posseduta dal plugin, come un riferimento a un modello provider, una configurazione di canale o un runtime
  harness
- Le route Codex della famiglia OpenAI mantengono confini dei plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin
  app-server Codex incluso è selezionato da `agentRuntime.id: "codex"` o dai riferimenti legacy
  ai modelli `codex/*`

## Risoluzione dei problemi degli hook di runtime

Se un plugin compare in `plugins list` ma gli effetti collaterali di `register(api)` o gli hook
non vengono eseguiti nel traffico della chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL del
  Gateway attivo, il profilo, il percorso di configurazione e il processo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche all'installazione/configurazione/codice del plugin. Nei container
  wrapper, PID 1 potrebbe essere solo un supervisore; riavvia o invia un segnale al processo child
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` per confermare le registrazioni degli hook e
  la diagnostica. Gli hook di conversazione non inclusi, come `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end`, richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della
  risoluzione del modello per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo
  del modello produce l'output dell'assistente.
- Per avere prova del modello di sessione effettivo, usa `openclaw sessions` o le
  superfici di sessione/stato del Gateway e, quando esegui il debug dei payload del provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

### Proprietà duplicata di canale o strumento

Sintomi:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Questo significa che più di un plugin abilitato sta cercando di possedere lo stesso canale,
flusso di configurazione o nome di strumento. La causa più comune è un plugin di canale external
installato accanto a un plugin incluso che ora fornisce lo stesso id di canale.

Passaggi di debug:

- Esegui `openclaw plugins list --enabled --verbose` per vedere ogni plugin abilitato
  e la sua origine.
- Esegui `openclaw plugins inspect <id> --json` per ogni plugin sospetto e
  confronta `channels`, `channelConfigs`, `tools` e la diagnostica.
- Esegui `openclaw plugins registry --refresh` dopo aver installato o rimosso
  pacchetti plugin, in modo che i metadati persistiti riflettano l'installazione corrente.
- Riavvia il Gateway dopo modifiche a installazione, registro o configurazione.

Opzioni di correzione:

- Se un plugin sostituisce intenzionalmente un altro per lo stesso id di canale, il
  plugin preferito deve dichiarare `channelConfigs.<channel-id>.preferOver` con
  l'id del plugin a priorità inferiore. Vedi [/plugins/manifest#replacing-another-channel-plugin](/it/plugins/manifest#replacing-another-channel-plugin).
- Se il duplicato è accidentale, disabilita uno dei due lati con
  `plugins.entries.<plugin-id>.enabled: false` oppure rimuovi l'installazione
  del plugin obsoleto.
- Se hai abilitato esplicitamente entrambi i plugin, OpenClaw mantiene tale richiesta e
  segnala il conflitto. Scegli un solo proprietario per il canale oppure rinomina gli
  strumenti posseduti dal plugin in modo che la superficie di runtime sia non ambigua.

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oppure "none" per disabilitare
      contextEngine: "legacy", // oppure un id plugin
    },
  },
}
```

| Slot            | Cosa controlla            | Predefinito        |
| --------------- | ------------------------- | ------------------ |
| `memory`        | Plugin di memoria attivo  | `memory-core`      |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin abilitati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella dell'intera flotta
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica
openclaw plugins registry                  # ispeziona lo stato persistito del registro
openclaw plugins registry --refresh        # ricostruisce il registro persistito
openclaw doctor --fix                      # ripara lo stato del registro dei plugin

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive un'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra l'esatta spec npm risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove configurazione e record di indice del plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin inclusi sono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
i provider di modelli inclusi, i provider vocali inclusi e il plugin browser
incluso). Altri plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive in-place un plugin o un pacchetto di hook già installato. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del
plugin installato a quella allowlist prima di abilitarlo. Se lo stesso id plugin
è presente in `plugins.deny`, l'installazione rimuove quella voce deny obsoleta in modo che
l'installazione esplicita sia immediatamente caricabile dopo il riavvio.

OpenClaw mantiene un registro locale persistito dei plugin come modello di lettura a freddo per
inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo avere modificato lo stato
del plugin. Lo stesso file `plugins/installs.json` conserva metadati di installazione durevoli nel livello superiore
`installRecords` e metadati del manifest ricostruibili in `plugins`. Se
il registro è mancante, obsoleto o non valido, `openclaw plugins registry
--refresh` ricostruisce la sua vista del manifest da record di installazione, policy di configurazione e
metadati del manifest/pacchetto senza caricare moduli runtime dei plugin.
`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Il passaggio
di una spec di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
riconducendolo al record del plugin tracciato e registra la nuova spec per aggiornamenti futuri.
Il passaggio del nome del pacchetto senza una versione riporta un'installazione esatta fissata
alla linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono metadati della sorgente del marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un override break-glass per i falsi
positivi dello scanner integrato di codice pericoloso. Consente a installazioni e aggiornamenti di plugin
di proseguire oltre i rilevamenti integrati `critical`, ma
non aggira comunque i blocchi di policy `before_install` del plugin o il blocco per errore di scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze
delle Skills supportate dal Gateway usano invece l'override di richiesta corrispondente
`dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione
delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di list/inspect/enable/disable dei plugin.
Il supporto runtime corrente include bundle Skills, command-skills Claude,
valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills Cursor e
directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità del bundle rilevate oltre
alle voci di server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un
percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub
oppure un URL git. Per i marketplace remoti, le voci dei plugin devono rimanere all'interno del
repository marketplace clonato e usare solo sorgenti di percorso relative.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API dei plugin

I plugin native esportano un oggetto entry che espone `register(api)`. I plugin più vecchi
possono ancora usare `activate(api)` come alias legacy, ma i nuovi plugin devono
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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione
del plugin. Il loader continua a usare `activate(api)` come fallback per i plugin più vecchi,
ma i plugin inclusi e i nuovi plugin external devono considerare `register` come contratto
pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                            |
| `discovery`     | Rilevamento delle capacità in sola lettura. Registra provider e metadati; il codice entry di plugin fidati può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                                   |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche l'entry runtime.                                                      |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                           |

Le entry dei plugin che aprono socket, database, worker in background o client
di lunga durata devono proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di rilevamento sono memorizzati in cache separatamente dai caricamenti di attivazione e non sostituiscono
il registro del Gateway in esecuzione. Il rilevamento non attiva, ma non è privo di import:
OpenClaw può valutare la entry del plugin fidato o il modulo del plugin di canale per costruire
lo snapshot. Mantieni i livelli superiori dei moduli leggeri e privi di effetti collaterali, e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio dei servizi
dietro i percorsi di runtime completo.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                 |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)     |
| `registerChannel`                       | Canale chat                   |
| `registerTool`                          | Strumento dell'agente         |
| `registerHook` / `on(...)`              | Hook del ciclo di vita        |
| `registerSpeechProvider`                | Sintesi vocale / STT          |
| `registerRealtimeTranscriptionProvider` | STT in streaming              |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex          |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio     |
| `registerImageGenerationProvider`       | Generazione di immagini       |
| `registerMusicGenerationProvider`       | Generazione musicale          |
| `registerVideoGenerationProvider`       | Generazione video             |
| `registerWebFetchProvider`              | Provider di recupero/scraping web |
| `registerWebSearchProvider`             | Ricerca web                   |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Comandi CLI                   |
| `registerContextEngine`                 | Motore di contesto            |
| `registerService`                       | Servizio in background        |

Comportamento delle guardie hook per gli hook di ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` non ha effetto e non annulla un annullamento precedente.

Il bridge app-server native di Codex reindirizza gli eventi degli strumenti native di Codex a questa
superficie di hook. I plugin possono bloccare gli strumenti native di Codex tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti native di Codex. Il confine esatto del supporto runtime di Codex si trova nel
[contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo degli hook tipizzati, vedi [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti dell'agente in un plugin
- [Componenti interni dei plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
