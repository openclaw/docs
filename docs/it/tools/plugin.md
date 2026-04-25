---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di individuazione e caricamento dei plugin
    - Lavorare con bundle Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-25T18:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
agent harness, strumenti, Skills, speech, trascrizione realtime, voce realtime,
media-understanding, generazione di immagini, generazione di video, recupero web, ricerca web
e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni** (pubblicati su npm dalla community).

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

    Poi configura sotto `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso locale/archivio, `clawhub:<pkg>`
esplicito, o specifica package semplice (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo chiuso e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è un percorso ristretto di
reinstallazione del plugin integrato per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo eager ogni albero di dipendenze
runtime di ogni plugin integrato. Quando un plugin integrato di proprietà di OpenClaw è attivo dalla
configurazione del plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita, l'avvio
ripara solo le dipendenze runtime dichiarate di quel plugin prima di importarlo.
La disabilitazione esplicita ha comunque priorità: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impediscono la riparazione automatica delle dipendenze runtime integrate per quel plugin/canale.
I plugin esterni e i percorsi di caricamento personalizzati devono ancora essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                  | Esempi                                                 |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; eseguito in-process   | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato sulle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle Plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare Plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

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
    - `memory-core` — ricerca in memoria integrata (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installata su richiesta con auto-recall/capture (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser integrato per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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
| --------------- | -------------------------------------------------------- |
| `enabled`       | Interruttore principale (predefinito: `true`)            |
| `allow`         | Allowlist dei plugin (facoltativa)                       |
| `deny`          | Denylist dei plugin (facoltativa; `deny` ha priorità)    |
| `load.paths`    | File/directory plugin aggiuntivi                         |
| `slots`         | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + configurazione per plugin                      |

Le modifiche alla configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con
watch della configurazione + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`),
di solito quel riavvio viene eseguito automaticamente poco dopo che la scrittura della configurazione è avvenuta.
Non esiste un percorso hot-reload supportato per il codice runtime nativo dei plugin o per gli hook
del ciclo di vita; riavvia il processo Gateway che serve il canale live prima di
aspettarti che vengano eseguiti codice `register(api)` aggiornato, hook `api.on(...)`, strumenti, servizi o
hook di provider/runtime.

`openclaw plugins list` è uno snapshot locale del registro/configurazione dei plugin. Un
plugin `enabled` lì significa che il registro persistito e la configurazione corrente consentono al
plugin di partecipare. Non dimostra che un child remoto Gateway già in esecuzione
sia stato riavviato nello stesso codice del plugin. Su configurazioni VPS/container con
processi wrapper, invia i riavvii al vero processo `openclaw gateway run`,
oppure usa `openclaw gateway restart` sul Gateway in esecuzione.

<Accordion title="Stati del plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene mantenuta.
  - **Mancante**: la configurazione fa riferimento a un ID plugin che l'individuazione non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Individuazione e precedenza

OpenClaw analizza i plugin in questo ordine (la prima corrispondenza ha priorità):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory.
  </Step>

  <Step title="Plugin del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin integrati">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, speech).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre priorità rispetto a `allow`
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin integrati seguono l'insieme predefinito built-in attivo salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin integrati opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un riferimento provider di modello, configurazione di canale o runtime
  harness
- Le route Codex della famiglia OpenAI mantengono confini plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin integrato del
  server app Codex è selezionato da `embeddedHarness.runtime: "codex"` o dai riferimenti di modello legacy
  `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un plugin appare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico della chat live, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che URL, profilo, percorso di configurazione e processo del Gateway attivo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei container
  wrapper, PID 1 potrebbe essere solo un supervisor; riavvia o invia un segnale al processo child
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` per confermare le registrazioni degli hook e la
  diagnostica. Gli hook di conversazione non integrati come `llm_input`,
  `llm_output` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione del modello per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo di modello produce output dell'assistente.
- Per una prova del modello di sessione effettivo, usa `openclaw sessions` o le superfici di sessione/stato del Gateway e, quando esegui il debug dei payload del provider, avvia il Gateway con `--raw-stream --raw-stream-path <path>`.

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva per volta):

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

| Slot            | Cosa controlla            | Predefinito          |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Plugin Active Memory      | `memory-core`        |
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
openclaw plugins registry                  # ispeziona lo stato del registro persistito
openclaw plugins registry --refresh        # ricostruisce il registro persistito

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive l'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la specifica npm esatta risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove i record di configurazione/installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin integrati vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
i provider di modelli integrati, i provider speech integrati e il plugin browser
integrato). Altri plugin integrati richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin o hook pack già installato. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'ID
del plugin installato a quell'allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

OpenClaw mantiene un registro locale persistito dei plugin come modello di lettura a freddo per
inventario dei plugin, proprietà dei contributi e pianificazione dell'avvio. I flussi di installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione aggiornano quel registro dopo aver modificato lo stato
del plugin. Se il registro manca, è obsoleto o non valido, `openclaw plugins registry
--refresh` lo ricostruisce dal ledger durevole di installazione, dalla policy di configurazione e dai
metadati del manifest/package senza caricare i moduli runtime del plugin.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica package npm con un dist-tag o una versione esatta risolve il nome del package
nel record del plugin tracciato e registra la nuova specifica per gli aggiornamenti futuri.
Passare il nome del package senza versione riporta un'installazione esatta fissata alla linea
di release predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi del rilevatore integrato di codice pericoloso. Consente alle installazioni e agli aggiornamenti
dei plugin di proseguire oltre i risultati integrati `critical`, ma comunque
non aggira i blocchi di policy `before_install` dei plugin né il blocco per errore di scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni delle dipendenze di Skills supportate dal Gateway
usano invece il corrispondente override di richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install`
rimane il flusso separato di download/installazione di Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei plugin. L'attuale supporto runtime include bundle Skills, command-skills Claude,
valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e `lspServers`
dichiarati nel manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` segnala anche le capacità del bundle rilevate più
le voci di server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una radice locale di marketplace o un percorso
`marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub
o un URL git. Per i marketplace remoti, le voci plugin devono restare all'interno del
repository marketplace clonato e usare solo sorgenti di percorso relative.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API Plugin

I plugin nativi esportano un oggetto entry che espone `register(api)`. I plugin
più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi plugin dovrebbero
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
ma i plugin integrati e i nuovi plugin esterni dovrebbero trattare `register` come contratto
pubblico.

`api.registrationMode` indica a un plugin perché la sua entry viene caricata:

| Modalità        | Significato                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                       |
| `discovery`     | Individuazione in sola lettura delle capacità. Registra provider e metadati; il codice entry del plugin fidato può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite una entry di configurazione leggera.                               |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche la entry runtime.                                                |
| `cli-metadata`  | Solo raccolta di metadati dei comandi CLI.                                                                                      |

Le entry dei plugin che aprono socket, database, worker in background o client di lunga durata
dovrebbero proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti di discovery sono memorizzati separatamente dai caricamenti di attivazione e non sostituiscono
il registro del Gateway in esecuzione. La discovery non attiva, ma non è priva di importazione:
OpenClaw può valutare la entry del plugin fidato o il modulo del plugin canale per costruire
lo snapshot. Mantieni i top level dei moduli leggeri e senza effetti collaterali e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio di servizi
dietro i percorsi full-runtime.

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
| `registerImageGenerationProvider`       | Generazione di immagini      |
| `registerMusicGenerationProvider`       | Generazione musicale         |
| `registerVideoGenerationProvider`       | Generazione video            |
| `registerWebFetchProvider`              | Provider di recupero / scraping web |
| `registerWebSearchProvider`             | Ricerca web                  |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandi CLI                  |
| `registerContextEngine`                 | Motore di contesto           |
| `registerService`                       | Servizio in background       |

Comportamento delle guardie hook per gli hook di ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità più bassa vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità più bassa vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non cancella un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità più bassa vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non cancella una cancellazione precedente.

L'app-server Codex nativo eseguito in nativo riporta gli eventi degli strumenti nativi Codex in bridge
su questa superficie hook. I plugin possono bloccare gli strumenti Codex nativi tramite `before_tool_call`,
osservare i risultati tramite `after_tool_call` e partecipare alle approvazioni di
`PermissionRequest` di Codex. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex. L'esatto confine di supporto del runtime Codex è descritto nel
[contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo e tipizzato degli hook, vedi [panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest Plugin](/it/plugins/manifest) — schema del manifest
- [Registrare strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Interni dei plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
