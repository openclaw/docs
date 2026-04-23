---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere il rilevamento dei plugin e le regole di caricamento
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T14:00:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
strumenti, Skills, voce, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca sul web
e altro ancora. Alcuni plugin sono **core** (forniti con OpenClaw), altri
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

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci il controllo nativo in chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>` esplicito oppure specifica di pacchetto bare (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di
reinstallazione di plugin integrati per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo eager l'intero
albero delle dipendenze runtime di ogni plugin integrato. Quando un plugin integrato di proprietà OpenClaw è attivo dalla
configurazione plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita, all'avvio
vengono riparate solo le dipendenze runtime dichiarate di quel plugin prima di importarlo.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                  | Esempi                                                 |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; esecuzione in-process | Plugin ufficiali, pacchetti npm della community        |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato sulle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Consulta [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia con [Creazione di plugin](/it/plugins/building-plugins)
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
    - `memory-core` — plugin di ricerca in memoria integrato (predefinito tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installata su richiesta con richiamo/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser integrato per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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
| `allow`          | Allowlist dei plugin (facoltativa)                        |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza)  |
| `load.paths`     | File/directory plugin aggiuntivi                          |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruttori + configurazione per plugin                  |

Le modifiche alla configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con
watch della configurazione + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`),
di solito quel riavvio viene eseguito automaticamente poco dopo che la scrittura della configurazione viene applicata.

<Accordion title="Stati del plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Rilevamento e precedenza

OpenClaw analizza i plugin in questo ordine (vince la prima corrispondenza):

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
    Forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere esplicitamente abilitati)
- I plugin integrati seguono l'insieme built-in di quelli attivi per impostazione predefinita, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" per disabilitare
      contextEngine: "legacy", // o un id plugin
    },
  },
}
```

| Slot            | Cosa controlla            | Predefinito         |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Plugin Active Memory      | `memory-core`       |
| `contextEngine` | Motore di contesto attivo | `legacy` (built-in) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella estesa all'intera flotta
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive un'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
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

I plugin integrati vengono forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
provider di modelli integrati, provider vocali integrati e il plugin browser
integrato). Altri plugin integrati richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin o hook pack già installato. Usa
`openclaw plugins update <id-or-npm-spec>` per i normali aggiornamenti dei
plugin npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente
invece di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge
l'id del plugin installato a quell'allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
sul record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri.
Passare il nome del pacchetto senza una versione riporta un'installazione esatta fissata
alla linea di release predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti built-in `critical`, ma comunque
non bypassa i blocchi di policy `before_install` del plugin né il blocco in caso di errore di scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze
delle Skills supportate dal Gateway usano invece l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane il flusso separato di download/installazione delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di list/inspect/enable/disable
dei plugin. Il supporto runtime attuale include bundle Skills, Claude command-skills,
impostazioni predefinite di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` e `lspServers`
dichiarati nel manifest, Cursor command-skills e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità del bundle rilevate più
le voci di server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti del marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root di marketplace locale o
un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub
oppure un URL git. Per i marketplace remoti, le voci dei plugin devono rimanere all'interno del
repository del marketplace clonato e usare solo sorgenti con percorso relativo.

Consulta il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API dei plugin

I plugin Native esportano un oggetto entry che espone `register(api)`. I plugin
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
del plugin. Il loader continua a usare `activate(api)` come fallback per i plugin
più vecchi, ma i bundle di plugin e i nuovi plugin esterni dovrebbero trattare `register` come
contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra              |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)  |
| `registerChannel`                       | Canale chat                |
| `registerTool`                          | Strumento dell'agente      |
| `registerHook` / `on(...)`              | Hook del ciclo di vita     |
| `registerSpeechProvider`                | Sintesi vocale / STT       |
| `registerRealtimeTranscriptionProvider` | STT in streaming           |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex       |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio  |
| `registerImageGenerationProvider`       | Generazione di immagini    |
| `registerMusicGenerationProvider`       | Generazione di musica      |
| `registerVideoGenerationProvider`       | Generazione di video       |
| `registerWebFetchProvider`              | Provider di recupero / scraping web |
| `registerWebSearchProvider`             | Ricerca web                |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Comandi CLI                |
| `registerContextEngine`                 | Motore di contesto         |
| `registerService`                       | Servizio in background     |

Comportamento delle guardie hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` non ha effetto e non annulla una cancellazione precedente.

Per il comportamento completo degli hook tipizzati, consulta [Panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti dell'agente in un plugin
- [Componenti interni dei plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
