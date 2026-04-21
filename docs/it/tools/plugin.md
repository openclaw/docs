---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di discovery e caricamento dei plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-21T08:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
tool, Skills, speech, trascrizione realtime, voce realtime,
media-understanding, generazione di immagini, generazione video, web fetch, web
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
    # Da npm
    openclaw plugins install @openclaw/voice-call

    # Da una directory o archivio locale
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Poi configura sotto `plugins.entries.\<id\>.config` nel tuo file di config.

  </Step>
</Steps>

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: path/archive locale, esplicito
`clawhub:<pkg>` oppure specifica di package semplice (prima ClawHub, poi fallback npm).

Se la config non è valida, l'installazione normalmente fallisce in modo fail-closed e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è un ristretto percorso di
reinstallazione per plugin bundled per i plugin che fanno opt-in a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano eagerly l'intero
albero delle dipendenze runtime di ogni plugin bundled. Quando un plugin bundled di proprietà OpenClaw è attivo dalla
config del plugin, dalla config legacy del canale o da un manifest default-enabled,
lo startup ripara solo le dipendenze runtime dichiarate di quel plugin prima dell'import.
I plugin esterni e i path di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                    | Esempi                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; esegue in-process       | Plugin ufficiali, package npm della community          |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato sulle funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creare Plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Plugin ufficiali

### Installabili (npm)

| Plugin          | Package                | Docs                                 |
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
    - `memory-core` — ricerca memoria bundled (predefinito tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installata on demand con auto-recall/capture (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser bundled per il tool browser, CLI `openclaw browser`, metodo gateway `browser.request`, runtime browser e servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descrizione                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle master (predefinito: `true`)                       |
| `allow`          | Allowlist dei plugin (facoltativa)                        |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza)  |
| `load.paths`     | File/directory plugin extra                               |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle per-plugin + config                                |

Le modifiche alla config **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con config
watch + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`), quel
riavvio di solito viene eseguito automaticamente poco dopo che la scrittura della config è andata a buon fine.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno spento. La config viene preservata.
  - **Mancante**: la config fa riferimento a un ID plugin che il discovery non ha trovato.
  - **Non valido**: il plugin esiste ma la sua config non corrisponde allo schema dichiarato.
</Accordion>

## Discovery e precedenza

OpenClaw cerca i plugin in questo ordine (la prima corrispondenza vince):

<Steps>
  <Step title="Percorsi di config">
    `plugins.load.paths` — percorsi espliciti di file o directory.
  </Step>

  <Step title="Estensioni del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Estensioni globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bundled">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, speech).
    Altri richiedono abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin bundled seguono l'insieme built-in predefinito acceso salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oppure "none" per disabilitare
      contextEngine: "legacy", // oppure un ID plugin
    },
  },
}
```

| Slot            | Cosa controlla         | Predefinito         |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin di memoria attivo  | `memory-core`     |
| `contextEngine` | Motore di contesto attivo | `legacy` (built-in) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella globale
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive installazione esistente
openclaw plugins install <path>            # installa da path locale
openclaw plugins install -l <path>         # link (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la specifica npm esatta risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # aggiorna un plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove config/record di installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin bundled sono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
provider di modelli bundled, provider speech bundled e il plugin browser
bundled). Altri plugin bundled richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o un hook pack esistente.
Non è supportato con `--link`, che riusa il path sorgente invece di
copiare sopra una destinazione di installazione gestita.

`--pin` è solo npm. Non è supportato con `--marketplace`, perché
le installazioni marketplace persistono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override break-glass per falsi
positivi dallo scanner built-in del codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre risultati built-in `critical`, ma continua comunque
a non bypassare i blocchi di policy dei plugin `before_install` o il blocco per fallimento della scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze Skill supportate dal Gateway
usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione Skill di ClawHub.

I bundle compatibili partecipano allo stesso flusso di list/inspect/enable/disable dei plugin. Il supporto runtime attuale include bundle Skills, Claude command-Skills,
default di Claude `settings.json`, default di Claude `.lsp.json` e `lspServers`
dichiarati nel manifest, Cursor command-Skills e directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità bundle rilevate più le voci
server MCP e LSP supportate o non supportate per i plugin supportati da bundle.

Le sorgenti marketplace possono essere un nome marketplace Claude noto da
`~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o
un path `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repo GitHub o un URL git. Per marketplace remoti, le voci plugin devono restare dentro il
repo marketplace clonato e usare solo sorgenti di path relative.

Vedi il [riferimento CLI `openclaw plugins`](/cli/plugins) per i dettagli completi.

## Panoramica dell'API plugin

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del plugin.
Il loader continua a usare come fallback `activate(api)` per i plugin più vecchi,
ma i plugin bundled e i nuovi plugin esterni dovrebbero trattare `register` come
contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)   |
| `registerChannel`                       | Canale chat                 |
| `registerTool`                          | Tool dell'agente            |
| `registerHook` / `on(...)`              | Hook del ciclo di vita      |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT in streaming            |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex        |
| `registerMediaUnderstandingProvider`    | Analisi immagine/audio      |
| `registerImageGenerationProvider`       | Generazione immagini        |
| `registerMusicGenerationProvider`       | Generazione musicale        |
| `registerVideoGenerationProvider`       | Generazione video           |
| `registerWebFetchProvider`              | Provider di web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandi CLI                 |
| `registerContextEngine`                 | Motore di contesto          |
| `registerService`                       | Servizio in background      |

Comportamento dei guard hook per hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler a priorità più bassa vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non rimuove un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler a priorità più bassa vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non rimuove un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler a priorità più bassa vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non rimuove una cancellazione precedente.

Per il comportamento completo degli hook tipizzati, vedi [Panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
- [Registrare tool](/it/plugins/building-plugins#registering-agent-tools) — aggiungi tool agente in un plugin
- [Interni del Plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
