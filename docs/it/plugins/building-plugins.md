---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o un'altra funzionalità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-05-07T13:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media, generazione di immagini,
generazione di video, recupero web, ricerca web, strumenti per agenti o qualsiasi
combinazione.

Non devi aggiungere il tuo Plugin al repository OpenClaw. Pubblica su
[ClawHub](/it/tools/clawhub) e gli utenti lo installano con
`openclaw plugins install clawhub:<package-name>`. Le specifiche dei pacchetti bare continuano
a essere installate da npm durante il cutover di lancio.

## Prerequisiti

- Node >= 22 e un package manager (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i Plugin nel repository: repository clonato e `pnpm install` eseguito. Lo sviluppo di Plugin
  dal checkout sorgente è solo pnpm perché OpenClaw carica i Plugin
  inclusi dai pacchetti workspace `extensions/*`.

## Che tipo di Plugin?

<CardGroup cols={3}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Mappa una CLI AI locale nel runner di fallback testuale di OpenClaw
  </Card>
  <Card title="Plugin strumento / hook" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti per agenti, hook di eventi o servizi - continua sotto
  </Card>
</CardGroup>

Per un Plugin di canale che non è garantito sia installato quando l'onboarding/setup
viene eseguito, usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adattatore di setup + wizard
che segnala il requisito di installazione e fallisce in modo chiuso sulle scritture di configurazione reali
finché il Plugin non è installato.

## Avvio rapido: Plugin strumento

Questa guida dettagliata crea un Plugin minimo che registra uno strumento per agenti. I Plugin di canale
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

    Ogni Plugin ha bisogno di un manifest, anche senza configurazione. Gli strumenti registrati a runtime
    devono essere elencati in `contracts.tools` così OpenClaw può scoprire il
    Plugin proprietario senza caricare ogni runtime Plugin. I Plugin dovrebbero anche dichiarare
    `activation.onStartup` intenzionalmente. Questo esempio lo imposta su `true`. Consulta
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

    `definePluginEntry` è per i Plugin non di canale. Per i canali, usa
    `defineChannelPluginEntry` - consulta [Plugin di canale](/it/plugins/sdk-channel-plugins).
    Per le opzioni complete dell'entry point, consulta [Entry point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** valida e pubblica con ClawHub, quindi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Specifiche di pacchetti bare come `@myorg/openclaw-my-plugin` vengono installate da npm durante
    il cutover di lancio. Usa `clawhub:` quando vuoi la risoluzione ClawHub.

    **Plugin nel repository:** inseriscili sotto l'albero workspace dei Plugin inclusi - scoperti automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Funzionalità dei Plugin

Un singolo Plugin può registrare un numero qualsiasi di funzionalità tramite l'oggetto `api`:

| Funzionalità           | Metodo di registrazione                          | Guida dettagliata                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferenza testuale (LLM) | `api.registerProvider(...)`                    | [Plugin provider](/it/plugins/sdk-provider-plugins)                               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | [Plugin backend CLI](/it/plugins/cli-backend-plugins)                             |
| Canale / messaggistica | `api.registerChannel(...)`                       | [Plugin di canale](/it/plugins/sdk-channel-plugins)                               |
| Voce (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recupero web           | `api.registerWebFetchProvider(...)`              | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware dei risultati degli strumenti | `api.registerAgentToolResultMiddleware(...)` | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                       |
| Strumenti per agenti   | `api.registerTool(...)`                          | Sotto                                                                           |
| Comandi personalizzati | `api.registerCommand(...)`                       | [Entry point](/it/plugins/sdk-entrypoints)                                        |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/it/plugins/hooks)                                                  |
| Hook di eventi interni | `api.registerHook(...)`                          | [Entry point](/it/plugins/sdk-entrypoints)                                        |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Interni](/it/plugins/architecture-internals#gateway-http-routes)                 |
| Sottocomandi CLI       | `api.registerCli(...)`                           | [Entry point](/it/plugins/sdk-entrypoints)                                        |

Per l'API di registrazione completa, consulta [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

I Plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
hanno bisogno di riscrittura asincrona dei risultati degli strumenti prima che il modello veda l'output. Dichiara i
runtime di destinazione in `contracts.agentToolResultMiddleware`, per esempio
`["pi", "codex"]`. Questo è un seam attendibile per Plugin inclusi; i
Plugin esterni dovrebbero preferire i normali hook Plugin di OpenClaw, a meno che OpenClaw non sviluppi una
policy di fiducia esplicita per questa funzionalità.

Se il tuo Plugin registra metodi RPC gateway personalizzati, mantienili su un
prefisso specifico del Plugin. Gli spazi dei nomi di amministrazione core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in
`operator.admin`, anche se un Plugin richiede uno scope più ristretto.

Semantica delle guardie hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e arresta gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` è trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e richiede all'utente l'approvazione tramite l'overlay di approvazione exec, i pulsanti Telegram, le interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e arresta gli handler con priorità inferiore.
- `before_install`: `{ block: false }` è trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e arresta gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` è trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando hai bisogno di routing thread/topic in ingresso. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: preferisci i campi di routing tipizzati `replyToId` / `threadId` rispetto alle chiavi metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle Plugin con fallback limitato: quando un id di approvazione exec non viene trovato, OpenClaw riprova lo stesso id tramite le approvazioni Plugin. L'inoltro delle approvazioni Plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se la logica di approvazione personalizzata deve rilevare lo stesso caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di confrontare manualmente stringhe di scadenza dell'approvazione.

Consulta [Hook Plugin](/it/plugins/hooks) per esempi e il riferimento degli hook.

## Registrare strumenti per agenti

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere obbligatori (sempre
disponibili) o opzionali (opt-in dell'utente):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
manifest del Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw acquisisce e memorizza nella cache il descrittore validato dallo strumento registrato,
così i plugin non duplicano `description` o i dati dello schema nel manifest. Il
contratto del manifest dichiara solo proprietà e scoperta; l'esecuzione continua a chiamare
l'implementazione registrata live dello strumento.
Imposta `toolMetadata.<tool>.optional: true` per gli strumenti registrati con
`api.registerTool(..., { optional: true })` così OpenClaw può evitare di caricare quel
runtime del plugin finché lo strumento non viene esplicitamente inserito nell'allowlist.

Gli utenti abilitano gli strumenti opzionali nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono ignorati)
- Gli strumenti con oggetti di registrazione non validi, inclusi quelli senza `parameters`, vengono ignorati e riportati nella diagnostica del plugin invece di interrompere le esecuzioni degli agenti
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un plugin aggiungendo l'ID del plugin a `tools.allow`

## Registrazione dei comandi CLI

I plugin possono aggiungere gruppi di comandi root `openclaw` con `api.registerCli`. Fornisci
`descriptors` per ogni root di comando di primo livello così OpenClaw può mostrare e instradare
il comando senza caricare anticipatamente ogni runtime di plugin.

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

Per il riferimento completo ai sottopercorsi, consulta [Panoramica SDK](/it/plugins/sdk-overview).

Nel tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne - non importare mai il tuo plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel
a root del pacchetto, a meno che il punto di integrazione non sia davvero generico. Esempi bundled attuali:

- Anthropic: wrapper dello stream Claude e helper `service_tier` / beta
- OpenAI: builder di provider, helper dei modelli predefiniti, provider realtime
- OpenRouter: builder di provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un pacchetto provider bundled, tienilo su quel
punto di integrazione a root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Alcuni punti di integrazione helper generati `openclaw/plugin-sdk/<bundled-id>` esistono ancora per
la manutenzione dei plugin bundled quando hanno utilizzi tracciati dal proprietario. Trattali come
superfici riservate, non come pattern predefinito per nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** contiene metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repo)</Check>

## Test delle release beta

1. Monitora i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un formato simile a `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo plugin rispetto al tag beta appena compare. La finestra prima della stable di solito dura solo poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test, con `all good` oppure con ciò che si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna un issue intitolato `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link dell'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega l'issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono mergiati; quelli senza potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante i test beta.
6. Silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente arriverà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per canale di messaggistica
  </Card>
  <Card title="Plugin Provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin per provider di modelli
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Registra un backend CLI AI locale
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa di importazione e riferimento API di registrazione
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest del Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) - approfondimento sull'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) - riferimento SDK del Plugin
- [Manifest](/it/plugins/manifest) - formato del manifest del plugin
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione di plugin di canale
- [Plugin Provider](/it/plugins/sdk-provider-plugins) - creazione di plugin provider
