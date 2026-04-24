---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di rilevamento e caricamento dei Plugin
    - Lavorare con bundle Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T09:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

I Plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
strumenti, Skills, speech, trascrizione realtime, voce realtime,
comprensione dei media, generazione di immagini, generazione video, web fetch, web
search e altro. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
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
    # From npm
    openclaw plugins install @openclaw/voice-call

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

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archive locale, esplicito
`clawhub:<pkg>`, oppure specifica package semplice (prima ClawHub, poi fallback npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modalità fail-closed e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di
reinstallazione del plugin bundle per i plugin che scelgono esplicitamente
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo eager l'intero
albero delle dipendenze runtime di ogni plugin bundle. Quando un plugin bundle di proprietà OpenClaw è attivo dalla
configurazione plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita,
l'avvio ripara solo le dipendenze runtime dichiarate di quel plugin prima di importarlo.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                  | Esempi                                                 |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; esegue in-process     | Plugin ufficiali, package npm della community          |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato su feature OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono sotto `openclaw plugins list`. Vedi [Plugin Bundles](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin native, inizia da [Building Plugins](/it/plugins/building-plugins)
e dalla [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Plugin ufficiali

### Installabili (npm)

| Plugin          | Package                | Documentazione                       |
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
    - `memory-core` — ricerca nella memoria bundle (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installata on-demand con richiamo/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser bundle per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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

| Campo           | Descrizione                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)             |
| `allow`          | Allowlist dei plugin (facoltativa)                        |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza)  |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (ad esempio `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazione + configurazione per plugin                   |

Le modifiche di configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con
watch della configurazione + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`),
quel riavvio di solito viene eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.

<Accordion title="Stati del plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di attivazione lo hanno spento. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Rilevamento e precedenza

OpenClaw esegue la scansione dei plugin in questo ordine (vince la prima corrispondenza):

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

  <Step title="Plugin bundle">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, speech).
    Altri richiedono attivazione esplicita.
  </Step>
</Steps>

### Regole di attivazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin provenienti dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin bundle seguono l'insieme integrato predefinito di plugin attivi salvo override
- Gli slot esclusivi possono forzare l'attivazione del plugin selezionato per quello slot
- Alcuni plugin bundle opt-in vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un model ref del provider, una configurazione di canale o un
  runtime harness
- Le route Codex della famiglia OpenAI mantengono boundary di plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin bundle dell'app-server Codex
  viene selezionato da `embeddedHarness.runtime: "codex"` o dai model ref legacy `codex/*`

## Plugin slots (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva per volta):

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

| Slot            | Cosa controlla          | Predefinito         |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin di memoria attiva | `memory-core`      |
| `contextEngine` | Context engine attivo   | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile dalla macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile dalla macchina
openclaw plugins inspect --all             # tabella completa del parco plugin
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive l'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # link (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la specifica npm esatta risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove record di configurazione/installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin bundle sono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio
i provider di modelli bundle, i provider speech bundle e il plugin browser
bundle). Altri plugin bundle richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive in-place un plugin installato o un hook pack esistente. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riusa il percorso sorgente invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del
plugin installato a quella allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica package npm con un dist-tag o una versione esatta risolve il nome del package
ritornando al record del plugin tracciato e registra la nuova specifica per gli aggiornamenti futuri.
Passare il nome del package senza una versione riporta un'installazione esatta fissata alla
linea di release predefinita del registry. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrato, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override break-glass per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di continuare oltre i rilevamenti `critical` integrati, ma comunque
non aggira i blocchi di policy `before_install` del plugin né il blocco in caso di fallimento della scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skill
supportate dal Gateway usano invece il corrispondente override di richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei plugin. Il supporto runtime attuale include bundle Skills, command-skills Claude,
impostazioni predefinite di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills Cursor e directory hook Codex
compatibili.

`openclaw plugins inspect <id>` riporta anche le capability del bundle rilevate più
le voci server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un
percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repo GitHub oppure un URL git. Per i marketplace remoti, le voci plugin devono restare dentro il
repo marketplace clonato e usare solo sorgenti con percorso relativo.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API Plugin

I plugin native esportano un oggetto entry che espone `register(api)`. I plugin
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
del plugin. Il loader continua a ripiegare su `activate(api)` per i plugin più vecchi,
ma i plugin bundle e i nuovi plugin esterni dovrebbero trattare `register` come contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra              |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)  |
| `registerChannel`                       | Canale chat                |
| `registerTool`                          | Strumento dell'agente      |
| `registerHook` / `on(...)`              | Hook del ciclo di vita     |
| `registerSpeechProvider`                | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider` | STT in streaming           |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex       |
| `registerMediaUnderstandingProvider`    | Analisi immagini/audio     |
| `registerImageGenerationProvider`       | Generazione di immagini    |
| `registerMusicGenerationProvider`       | Generazione musicale       |
| `registerVideoGenerationProvider`       | Generazione video          |
| `registerWebFetchProvider`              | Provider web fetch / scrape |
| `registerWebSearchProvider`             | Ricerca web                |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Comandi CLI                |
| `registerContextEngine`                 | Context engine             |
| `registerService`                       | Servizio in background     |

Comportamento delle guardie degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una cancellazione precedente.

Per il comportamento completo degli hook tipizzati, vedi [Panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — crea il tuo plugin
- [Plugin Bundles](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Plugin Manifest](/it/plugins/manifest) — schema del manifest
- [Registering Tools](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Plugin Internals](/it/plugins/architecture) — modello di capability e pipeline di caricamento
- [Community Plugins](/it/plugins/community) — elenchi di terze parti
