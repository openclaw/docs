---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o un'altra funzionalità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di plugin
x-i18n:
    generated_at: "2026-05-02T20:48:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
sintesi e riconoscimento vocale, trascrizione in tempo reale, voce in tempo reale, comprensione dei media, generazione di immagini,
generazione video, recupero web, ricerca web, strumenti per agenti o qualsiasi
combinazione.

Non devi aggiungere il tuo plugin al repository OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) e gli utenti lo installano con
`openclaw plugins install clawhub:<package-name>`. Le specifiche di pacchetto semplici continuano a
installare da npm durante la transizione di lancio.

## Prerequisiti

- Node >= 22 e un gestore di pacchetti (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i plugin nel repository: repository clonato e `pnpm install` completato. Lo sviluppo di plugin
  da checkout del codice sorgente è solo pnpm perché OpenClaw carica i plugin in bundle
  dai pacchetti workspace `extensions/*`.

## Che tipo di plugin?

<CardGroup cols={3}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Connetti OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin di strumento / hook" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti per agenti, hook di eventi o servizi — continua sotto
  </Card>
</CardGroup>

Per un plugin di canale che non è garantito sia installato quando viene eseguito onboarding/configurazione,
usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adattatore di configurazione + procedura guidata
che segnala il requisito di installazione e fallisce in modo chiuso sulle scritture reali di configurazione
finché il plugin non è installato.

## Avvio rapido: plugin strumento

Questa guida crea un plugin minimo che registra uno strumento per agenti. I plugin di canale
e provider hanno guide dedicate collegate sopra.

<Steps>
  <Step title="Crea il pacchetto e il manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Ogni plugin ha bisogno di un manifest, anche senza configurazione. Gli strumenti registrati a runtime
    devono essere elencati in `contracts.tools` così OpenClaw può scoprire il plugin proprietario
    senza caricare ogni runtime di plugin. I plugin dovrebbero anche dichiarare
    `activation.onStartup` intenzionalmente. Questo esempio lo imposta su `true`. Vedi
    [Manifest](/it/plugins/manifest) per lo schema completo. Gli snippet canonici di pubblicazione ClawHub
    si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Scrivi l'entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` è per plugin non di canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).
    Per le opzioni complete dell'entry point, vedi [Entry point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** valida e pubblica con ClawHub, poi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Le specifiche di pacchetto semplici come `@myorg/openclaw-my-plugin` installano da npm durante
    la transizione di lancio. Usa `clawhub:` quando vuoi la risoluzione ClawHub.

    **Plugin nel repository:** posizionali sotto l'albero workspace dei plugin in bundle — scoperti automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacità dei plugin

Un singolo plugin può registrare qualsiasi numero di capacità tramite l'oggetto `api`:

| Capacità              | Metodo di registrazione                         | Guida dettagliata                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferenza testuale (LLM) | `api.registerProvider(...)`                    | [Plugin provider](/it/plugins/sdk-provider-plugins)                                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | [Backend CLI](/it/gateway/cli-backends)                                            |
| Canale / messaggistica | `api.registerChannel(...)`                      | [Plugin di canale](/it/plugins/sdk-channel-plugins)                                |
| Voce (TTS/STT)         | `api.registerSpeechProvider(...)`               | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione video      | `api.registerVideoGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Recupero web           | `api.registerWebFetchProvider(...)`              | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Middleware per risultati degli strumenti | `api.registerAgentToolResultMiddleware(...)` | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                        |
| Strumenti per agenti   | `api.registerTool(...)`                          | Sotto                                                                           |
| Comandi personalizzati | `api.registerCommand(...)`                       | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Hook dei plugin        | `api.on(...)`                                    | [Hook dei plugin](/it/plugins/hooks)                                               |
| Hook di eventi interni | `api.registerHook(...)`                          | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Interni](/it/plugins/architecture-internals#gateway-http-routes)                  |
| Sottocomandi CLI       | `api.registerCli(...)`                           | [Entry point](/it/plugins/sdk-entrypoints)                                         |

Per l'API di registrazione completa, vedi [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

I plugin in bundle possono usare `api.registerAgentToolResultMiddleware(...)` quando
necessitano della riscrittura asincrona del risultato di uno strumento prima che il modello veda l'output. Dichiara i
runtime di destinazione in `contracts.agentToolResultMiddleware`, ad esempio
`["pi", "codex"]`. Questo è un seam attendibile per plugin in bundle; i plugin esterni
dovrebbero preferire i normali hook dei plugin OpenClaw a meno che OpenClaw non introduca una
policy di attendibilità esplicita per questa capacità.

Se il tuo plugin registra metodi RPC Gateway personalizzati, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi amministrativi core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in
`operator.admin`, anche se un plugin richiede un ambito più ristretto.

Semantica dei guard degli hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e chiede l'approvazione all'utente tramite overlay di approvazione exec, pulsanti Telegram, interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e interrompe gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando ti serve il routing di thread/topic in ingresso. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: preferisci i campi di routing tipizzati `replyToId` / `threadId` rispetto alle chiavi metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei plugin con fallback limitato: quando un id di approvazione exec non viene trovato, OpenClaw riprova lo stesso id tramite le approvazioni dei plugin. L'inoltro delle approvazioni dei plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se una logica di approvazione personalizzata deve rilevare quello stesso caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di confrontare manualmente le stringhe di scadenza dell'approvazione.

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi e il riferimento degli hook.

## Registrazione di strumenti per agenti

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere obbligatori (sempre
disponibili) o facoltativi (opt-in dell'utente):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Ogni strumento registrato con `api.registerTool(...)` deve anche essere dichiarato nel
manifest del plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw acquisisce e memorizza nella cache il descrittore validato dallo strumento registrato,
quindi i plugin non duplicano `description` o i dati dello schema nel manifest. Il
contratto del manifest dichiara solo proprietà e scoperta; l'esecuzione chiama ancora
l'implementazione live dello strumento registrato.

Gli utenti abilitano gli strumenti facoltativi nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono ignorati)
- Gli strumenti con oggetti di registrazione malformati, inclusa l'assenza di `parameters`, vengono ignorati e segnalati nella diagnostica del plugin invece di interrompere le esecuzioni dell'agente
- Usa `optional: true` per gli strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un plugin aggiungendo l'id del plugin a `tools.allow`

## Registrazione dei comandi CLI

I plugin possono aggiungere gruppi di comandi root `openclaw` con `api.registerCli`. Fornisci
`descriptors` per ogni radice di comando di livello superiore, così OpenClaw può mostrare e instradare
il comando senza caricare preventivamente ogni runtime del plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Dopo l'installazione, verifica la registrazione del runtime ed esegui il comando:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Convenzioni di importazione

Importa sempre dai percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei sottopercorsi, consulta [Panoramica SDK](/it/plugins/sdk-overview).

All'interno del tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne — non importare mai il tuo plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel
della root del pacchetto, a meno che il punto di integrazione non sia davvero generico. Esempi in bundle attuali:

- Anthropic: wrapper di stream Claude e helper `service_tier` / beta
- OpenAI: builder provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider in bundle, mantienilo su quel
punto di integrazione della root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Esistono ancora alcuni punti di integrazione helper generati `openclaw/plugin-sdk/<bundled-id>` per
la manutenzione dei plugin in bundle quando hanno utilizzi tracciati dai proprietari. Trattali come
superfici riservate, non come il pattern predefinito per i nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** contiene i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repository)</Check>

## Test della release beta

1. Monitora i tag delle release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un formato come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci delle release.
2. Testa il tuo plugin con il tag beta non appena appare. La finestra prima della stable di solito è solo di poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test, indicando `all good` oppure cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per i maintainer e l'automazione. I blocker con una PR vengono integrati; i blocker senza PR potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente arriverà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa delle importazioni e riferimento API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagente tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest del plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei plugin](/it/plugins/architecture) — approfondimento dell'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento SDK dei Plugin
- [Manifest](/it/plugins/manifest) — formato del manifest del plugin
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare plugin provider
