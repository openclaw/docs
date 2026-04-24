---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di rilevamento e caricamento dei plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:23:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
harness per agenti, strumenti, Skills, voce, trascrizione in tempo reale, voce in tempo reale,
comprensione dei media, generazione di immagini, generazione di video, recupero dal web, ricerca sul web
e altro ancora. Alcuni plugin sono **core** (forniti con OpenClaw), altri
sono **esterni** (pubblicati su npm dalla community).

## Guida rapida

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

    Poi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci un controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>` esplicito oppure specifica package semplice (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di recupero è un percorso limitato di
reinstallazione di plugin inclusi per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano preventivamente l'intero albero delle dipendenze di runtime di ogni plugin incluso.
Quando un plugin incluso di proprietà OpenClaw è attivo dalla configurazione dei
plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita, l'avvio
ripara solo le dipendenze di runtime dichiarate da quel plugin prima di importarlo.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                    | Esempi                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + modulo di runtime; viene eseguito in-process | Plugin ufficiali, package npm della community          |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato sulle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle di plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Creare plugin](/it/plugins/building-plugins)
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
    - `memory-core` — ricerca nella memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine installata su richiesta con richiamo/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo del browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
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

| Campo            | Descrizione                                              |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)           |
| `allow`          | Allowlist dei plugin (facoltativa)                      |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza) |
| `load.paths`     | File/directory plugin aggiuntivi                        |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruttori per plugin + configurazione                |

Le modifiche alla configurazione **richiedono un riavvio del Gateway**. Se il Gateway è in esecuzione con il monitoraggio
della configurazione + riavvio in-process abilitato (il percorso predefinito di `openclaw gateway`), quel
riavvio viene di solito eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.
Non esiste un percorso supportato di hot-reload per il codice di runtime nativo del plugin o per gli hook
del ciclo di vita; riavvia il processo Gateway che sta servendo il canale live prima di
aspettarti che il codice aggiornato di `register(api)`, gli hook `api.on(...)`, gli strumenti, i servizi o gli
hook di provider/runtime vengano eseguiti.

`openclaw plugins list` è un'istantanea locale di CLI/configurazione. Un plugin `loaded`
in quell'elenco significa che il plugin è individuabile e caricabile dalla configurazione/dai file visti da quella
invocazione della CLI. Non prova che un Gateway remoto già in esecuzione
sia stato riavviato con lo stesso codice del plugin. In configurazioni VPS/container con processi wrapper,
invia i riavvii al processo effettivo `openclaw gateway run`, oppure usa
`openclaw gateway restart` sul Gateway in esecuzione.

<Accordion title="Stati dei plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene preservata.
  - **Mancante**: la configurazione fa riferimento a un ID plugin che il rilevamento non ha trovato.
  - **Non valido**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Rilevamento e precedenza

OpenClaw esegue la scansione dei plugin in questo ordine (la prima corrispondenza vince):

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

  <Step title="Plugin inclusi">
    Forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin originati dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme interno predefinito di quelli attivi, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi opzionali vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal plugin, come un riferimento al modello del provider, una configurazione di canale o un
  runtime harness
- I percorsi Codex della famiglia OpenAI mantengono confini di plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server
  Codex incluso viene selezionato da `embeddedHarness.runtime: "codex"` o dai riferimenti legacy
  al modello `codex/*`

## Risoluzione dei problemi degli hook di runtime

Se un plugin compare in `plugins list` ma gli effetti collaterali di `register(api)` o gli hook
non vengono eseguiti nel traffico live della chat, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL,
  il profilo, il percorso di configurazione e il processo del Gateway attivo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del plugin. Nei
  container wrapper, PID 1 potrebbe essere solo un supervisore; riavvia o invia un segnale al processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` per confermare le registrazioni degli hook e la
  diagnostica. Gli hook di conversazione non inclusi come `llm_input`,
  `llm_output` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione
  del modello per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per avere prova del modello di sessione effettivo, usa `openclaw sessions` oppure le
  superfici di sessione/stato del Gateway e, quando esegui il debug dei payload del provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

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

| Slot            | Cosa controlla            | Predefinito         |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Plugin di memoria attiva  | `memory-core`       |
| `contextEngine` | Motore di contesto attivo | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile dalle macchine
openclaw plugins inspect <id>              # dettagli approfonditi
openclaw plugins inspect <id> --json       # leggibile dalle macchine
openclaw plugins inspect --all             # tabella dell'intero insieme
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

I plugin inclusi vengono forniti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio
i provider di modelli inclusi, i provider vocali inclusi e il plugin browser
incluso). Altri plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin o hook pack già installato. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin
npm tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare in una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'ID del
plugin installato a quella allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di package npm con un dist-tag o una versione esatta risolve il nome del package
risalendo al record del plugin tracciato e registra la nuova specifica per aggiornamenti futuri.
Passare il nome del package senza una versione riporta un'installazione bloccata a una versione esatta
alla linea di release predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni dal marketplace mantengono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre i risultati integrati `critical`, ma comunque
non aggira i blocchi di policy `before_install` del plugin né il blocco dovuto a errori di scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le
installazioni di dipendenze delle Skills supportate dal Gateway usano invece l'override corrispondente della richiesta
`dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione
delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei plugin.
Il supporto runtime attuale include bundle Skills, command-skills di Claude,
impostazioni predefinite di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` e `lspServers`
dichiarati nel manifest, command-skills di Cursor e directory hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità del bundle rilevate, oltre alle voci
MCP e server LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root di marketplace locale o un percorso
`marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub
oppure un URL git. Per i marketplace remoti, le voci plugin devono restare all'interno del
repository marketplace clonato e usare solo sorgenti di percorso relative.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione
del plugin. Il loader continua a usare `activate(api)` come fallback per i plugin più vecchi,
ma i plugin inclusi e i nuovi plugin esterni dovrebbero trattare `register` come contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)   |
| `registerChannel`                       | Canale chat                 |
| `registerTool`                          | Strumento agente            |
| `registerHook` / `on(...)`              | Hook del ciclo di vita      |
| `registerSpeechProvider`                | Sintesi vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT in streaming            |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex        |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio   |
| `registerImageGenerationProvider`       | Generazione di immagini     |
| `registerMusicGenerationProvider`       | Generazione musicale        |
| `registerVideoGenerationProvider`       | Generazione di video        |
| `registerWebFetchProvider`              | Provider di recupero / scraping web |
| `registerWebSearchProvider`             | Ricerca web                 |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandi CLI                 |
| `registerContextEngine`                 | Motore di contesto          |
| `registerService`                       | Servizio in background      |

Comportamento delle guardie hook per hook del ciclo di vita tipizzati:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` non ha effetto e non annulla una precedente cancellazione.

Per il comportamento completo degli hook tipizzati, vedi [Panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare plugin](/it/plugins/building-plugins) — crea il tuo plugin
- [Bundle di plugin](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti agente in un plugin
- [Componenti interni dei plugin](/it/plugins/architecture) — modello di capacità e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
