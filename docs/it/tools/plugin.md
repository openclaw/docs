---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di discovery e caricamento dei plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T08:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

I plugin estendono OpenClaw con nuove capability: canali, provider di modelli,
strumenti, Skills, speech, trascrizione realtime, voce realtime,
media-understanding, generazione immagini, generazione video, web fetch, web
search e altro ancora. Alcuni plugin sono **core** (distribuiti con OpenClaw), altri
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

    Poi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci il controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>` esplicito oppure package spec bare (prima ClawHub, poi fallback npm).

Se la configurazione non è valida, normalmente l’installazione fallisce in fail-closed e ti indirizza a
`openclaw doctor --fix`. L’unica eccezione di recupero è uno stretto percorso di reinstallazione di plugin bundled
per i plugin che scelgono esplicitamente
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano eager l’intero
albero delle dipendenze runtime di ogni plugin bundled. Quando un plugin OpenClaw-owned bundled è attivo dalla
configurazione del plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita, l’avvio
ripara solo le dipendenze runtime dichiarate di quel plugin prima di importarlo.
I plugin external e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                   | Esempi                                                  |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + modulo runtime; esecuzione in-process | Plugin ufficiali, pacchetti npm della community         |
| **Bundle** | Layout compatibile Codex/Claude/Cursor; mappato alle capability di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Plugin Bundles](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Building Plugins](/it/plugins/building-plugins)
e [Plugin SDK Overview](/it/plugins/sdk-overview).

## Plugin ufficiali

### Installabili (npm)

| Plugin          | Pacchetto              | Documentazione                        |
| --------------- | ---------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/it/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/it/channels/msteams)  |
| Nostr           | `@openclaw/nostr`      | [Nostr](/it/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/it/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`       | [Zalo](/it/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/it/plugins/zalouser)    |

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
    - `memory-lancedb` — memoria a lungo termine install-on-demand con auto-recall/capture (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser bundled per lo strumento browser, CLI `openclaw browser`, metodo Gateway `browser.request`, runtime browser e servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)
  </Accordion>
</AccordionGroup>

Cerchi plugin di terze parti? Vedi [Community Plugins](/it/plugins/community).

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

| Campo           | Descrizione                                                |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Toggle master (predefinito: `true`)                        |
| `allow`          | Allowlist dei plugin (facoltativa)                         |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza)   |
| `load.paths`     | File/directory plugin aggiuntivi                           |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + configurazione per plugin                         |

Le modifiche alla configurazione **richiedono un riavvio del Gateway**. Se il Gateway è in esecuzione con
watch della configurazione + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`), quel
riavvio di solito viene eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.

<Accordion title="Stati del plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un ID plugin che la discovery non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Discovery e precedenza

OpenClaw cerca i plugin in questo ordine (vince la prima corrispondenza):

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

  <Step title="Plugin bundled">
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, speech).
    Altri richiedono un’abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin bundled seguono l’insieme built-in di quelli attivi per default salvo override
- Gli slot esclusivi possono forzare l’abilitazione del plugin selezionato per quello slot

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

| Slot            | Cosa controlla           | Predefinito         |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Plugin di memoria attivo | `memory-core`       |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile dalla macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile dalla macchina
openclaw plugins inspect --all             # tabella completa
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive un’installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # link (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra l’esatta npm spec risolta
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

I plugin bundled vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
provider di modelli bundled, provider speech bundled e il plugin browser bundled). Altri plugin bundled richiedono ancora `openclaw plugins enable <id>`.

`--force` sovrascrive un plugin o hook pack installato esistente sul posto. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm tracciati. Non è supportato con `--link`, che riusa il percorso sorgente invece
di copiare su una destinazione di installazione gestita.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una npm package spec con un dist-tag o una versione esatta risolve il nome del pacchetto
di nuovo nel record del plugin tracciato e registra la nuova spec per aggiornamenti futuri.
Passare il nome del pacchetto senza versione riporta un’installazione esattamente fissata alla
linea di release predefinita del registry. Se il plugin npm installato corrisponde già
alla versione risolta e all’identità dell’artefatto registrato, OpenClaw salta l’aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché le
installazioni da marketplace persistono metadati della sorgente marketplace invece di una npm spec.

`--dangerously-force-unsafe-install` è un override break-glass per i falsi positivi
dello scanner integrato di codice pericoloso. Consente a installazioni e aggiornamenti di plugin di proseguire oltre findings `critical` integrati, ma comunque
non bypassa i blocchi di policy `before_install` del plugin né il blocco dovuto a errore della scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle Skills supportate dal Gateway usano invece il corrispondente override di richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin. Il supporto runtime attuale include bundle Skills, Claude command-Skills,
valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e `lspServers`
dichiarati dal manifest, Cursor command-Skills e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capability bundle rilevate più
le voci MCP e LSP server supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root marketplace locale o un
percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub oppure un URL git. Per i marketplace remoti, le voci dei plugin devono restare dentro il
repository marketplace clonato e usare solo sorgenti di percorso relative.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell’API dei plugin

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

OpenClaw carica l’oggetto entry e chiama `register(api)` durante l’attivazione del plugin.
Il loader continua a usare come fallback `activate(api)` per i plugin più vecchi,
ma i plugin bundled e i nuovi plugin external dovrebbero trattare `register` come il contratto pubblico.

Metodi comuni di registrazione:

| Metodo                                  | Cosa registra                  |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | Provider di modelli (LLM)      |
| `registerChannel`                       | Canale chat                    |
| `registerTool`                          | Strumento agent                |
| `registerHook` / `on(...)`              | Hook del ciclo di vita         |
| `registerSpeechProvider`                | Text-to-speech / STT           |
| `registerRealtimeTranscriptionProvider` | STT in streaming               |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex           |
| `registerMediaUnderstandingProvider`    | Analisi immagini/audio         |
| `registerImageGenerationProvider`       | Generazione immagini           |
| `registerMusicGenerationProvider`       | Generazione musica             |
| `registerVideoGenerationProvider`       | Generazione video              |
| `registerWebFetchProvider`              | Provider di web fetch / scrape |
| `registerWebSearchProvider`             | Web search                     |
| `registerHttpRoute`                     | Endpoint HTTP                  |
| `registerCommand` / `registerCli`       | Comandi CLI                    |
| `registerContextEngine`                 | Motore di contesto             |
| `registerService`                       | Servizio in background         |

Comportamento delle guardie degli hook per gli hook di ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` non produce effetti e non annulla un block precedente.
- `before_install`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` non produce effetti e non annulla un block precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` non produce effetti e non annulla un cancel precedente.

Per il comportamento completo degli hook tipizzati, vedi [SDK Overview](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — crea il tuo plugin
- [Plugin Bundles](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Plugin Manifest](/it/plugins/manifest) — schema del manifest
- [Registering Tools](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agent in un plugin
- [Plugin Internals](/it/plugins/architecture) — modello di capability e pipeline di caricamento
- [Community Plugins](/it/plugins/community) — elenchi di terze parti
