---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di rilevamento e caricamento dei plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-05T14:07:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
strumenti, skills, speech, trascrizione in tempo reale, voce in tempo reale,
media-understanding, generazione di immagini, generazione video, web fetch, web
search e altro ancora. Alcuni plugin sono **core** (forniti con OpenClaw), altri
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

    # Da una directory locale o un archivio
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

Se preferisci il controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>`
esplicito oppure specifica pacchetto semplice (prima ClawHub, poi fallback su npm).

Se la configurazione non è valida, normalmente l'installazione fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è un ristretto percorso di
reinstallazione di plugin inclusi per i plugin che scelgono di aderire a
`openclaw.install.allowInvalidConfigRecovery`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                   | Esempi                                                 |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; viene eseguito in-process | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Plugin Bundles](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Building Plugins](/it/plugins/building-plugins)
e da [Plugin SDK Overview](/it/plugins/sdk-overview).

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

### Core (forniti con OpenClaw)

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
    - `memory-lancedb` — memoria a lungo termine installata su richiesta con auto-recall/capture (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
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
| `deny`           | Denylist dei plugin (facoltativa; deny ha precedenza)     |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazione/disattivazione + configurazione per plugin    |

Le modifiche alla configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con config
watch + riavvio in-process abilitato (il percorso predefinito di `openclaw gateway`), quel
riavvio viene di solito eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene mantenuta.
  - **Mancante**: la configurazione fa riferimento a un ID plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Rilevamento e precedenza

OpenClaw analizza i plugin in questo ordine (la prima corrispondenza vince):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory.
  </Step>

  <Step title="Estensioni del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Estensioni globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin inclusi">
    Forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, speech).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme predefinito integrato attivo salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una può essere attiva alla volta):

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

| Slot            | Cosa controlla             | Predefinito         |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin di memoria attivo   | `memory-core`       |
| `contextEngine` | Motore di contesto attivo  | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella dell'intera flotta
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive l'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la specifica npm esatta risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # aggiorna un plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove record di configurazione/installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin inclusi vengono forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio
i provider di modelli inclusi, i provider speech inclusi e il plugin browser
incluso). Altri plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin o un pacchetto hook già installato.
Non è supportato con `--link`, che riutilizza il percorso sorgente invece di
copiare su una destinazione di installazione gestita.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni dal marketplace mantengono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per falsi
positivi del rilevatore integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti integrati `critical`, ma comunque
non aggira i blocchi di policy `before_install` del plugin né i blocchi dovuti a errori di scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze skill
supportate dal Gateway usano invece il corrispondente override di richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione skill da ClawHub.

I bundle compatibili partecipano allo stesso flusso plugin di list/inspect/enable/disable.
Il supporto runtime attuale include skill bundle, command-skills Claude,
valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità del bundle rilevate più
le voci di server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti del marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root di marketplace locale o un percorso
`marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub
oppure un URL git. Per i marketplace remoti, le voci plugin devono rimanere dentro il
repository del marketplace clonato e usare solo sorgenti di percorso relative.

Vedi il riferimento CLI [`openclaw plugins`](/cli/plugins) per tutti i dettagli.

## Panoramica dell'API dei plugin

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
Il loader continua a usare come fallback `activate(api)` per i plugin più vecchi,
ma i plugin inclusi e i nuovi plugin esterni dovrebbero trattare `register` come
contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra                 |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)     |
| `registerChannel`                       | Canale di chat                |
| `registerTool`                          | Strumento agente              |
| `registerHook` / `on(...)`              | Hook del ciclo di vita        |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT in streaming              |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex          |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio     |
| `registerImageGenerationProvider`       | Generazione di immagini       |
| `registerVideoGenerationProvider`       | Generazione video             |
| `registerWebFetchProvider`              | Provider di web fetch / scrape |
| `registerWebSearchProvider`             | Web search                    |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Comandi CLI                   |
| `registerContextEngine`                 | Motore di contesto            |
| `registerService`                       | Servizio in background        |

Comportamento delle guardie hook per hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; i gestori con priorità più bassa vengono saltati.
- `before_tool_call`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; i gestori con priorità più bassa vengono saltati.
- `before_install`: `{ block: false }` è un no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; i gestori con priorità più bassa vengono saltati.
- `message_sending`: `{ cancel: false }` è un no-op e non annulla una precedente cancellazione.

Per il comportamento completo degli hook tipizzati, vedi [SDK Overview](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — crea il tuo plugin
- [Plugin Bundles](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Plugin Manifest](/it/plugins/manifest) — schema del manifest
- [Registering Tools](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Plugin Internals](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Community Plugins](/it/plugins/community) — elenchi di terze parti
