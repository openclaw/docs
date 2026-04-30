---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Hai bisogno di una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o un'altra funzionalità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-04-30T09:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media, generazione di immagini,
generazione di video, recupero web, ricerca web, strumenti agente o qualsiasi
combinazione.

Non devi aggiungere il tuo Plugin al repository OpenClaw. Pubblica su
[ClawHub](/it/tools/clawhub) e gli utenti installano con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e
ripiega automaticamente su npm per i pacchetti che usano ancora la distribuzione npm.

## Prerequisiti

- Node >= 22 e un gestore di pacchetti (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i Plugin nel repository: repository clonato e `pnpm install` completato

## Che tipo di Plugin?

<CardGroup cols={3}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin strumento / hook" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti agente, hook di evento o servizi — continua sotto
  </Card>
</CardGroup>

Per un Plugin canale che non è garantito sia installato quando vengono eseguiti onboarding/configurazione,
usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adattatore di configurazione + procedura guidata
che segnala il requisito di installazione e non consente scritture reali della configurazione
finché il Plugin non è installato.

## Avvio rapido: Plugin strumento

Questa procedura crea un Plugin minimale che registra uno strumento agente. I Plugin canale
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

    Ogni Plugin richiede un manifest, anche senza configurazione, e ogni Plugin dovrebbe
    dichiarare `activation.onStartup` intenzionalmente. Gli strumenti registrati a runtime richiedono
    l'importazione all'avvio, quindi questo esempio lo imposta su `true`. Consulta
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

    `definePluginEntry` è per i Plugin non canale. Per i canali, usa
    `defineChannelPluginEntry` — consulta [Plugin canale](/it/plugins/sdk-channel-plugins).
    Per tutte le opzioni dell'entry point, consulta [Entry point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** valida e pubblica con ClawHub, quindi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per specifiche di pacchetto semplici come
    `@myorg/openclaw-my-plugin`; npm resta un fallback per i pacchetti che
    non sono ancora migrati a ClawHub.

    **Plugin nel repository:** posizionali sotto l'albero di workspace dei Plugin inclusi — scoperti automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Funzionalità dei Plugin

Un singolo Plugin può registrare qualsiasi numero di funzionalità tramite l'oggetto `api`:

| Funzionalità           | Metodo di registrazione                         | Guida dettagliata                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferenza testuale (LLM) | `api.registerProvider(...)`                    | [Plugin provider](/it/plugins/sdk-provider-plugins)                                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | [Backend CLI](/it/gateway/cli-backends)                                            |
| Canale / messaggistica | `api.registerChannel(...)`                       | [Plugin canale](/it/plugins/sdk-channel-plugins)                                   |
| Voce (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Recupero web           | `api.registerWebFetchProvider(...)`              | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Middleware risultati degli strumenti | `api.registerAgentToolResultMiddleware(...)` | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                        |
| Strumenti agente       | `api.registerTool(...)`                          | Sotto                                                                           |
| Comandi personalizzati | `api.registerCommand(...)`                       | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Hook dei Plugin        | `api.on(...)`                                    | [Hook dei Plugin](/it/plugins/hooks)                                               |
| Hook di eventi interni | `api.registerHook(...)`                          | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Internals](/it/plugins/architecture-internals#gateway-http-routes)                |
| Sottocomandi CLI       | `api.registerCli(...)`                           | [Entry point](/it/plugins/sdk-entrypoints)                                         |

Per l'API di registrazione completa, consulta [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

I Plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
hanno bisogno di riscrivere in modo asincrono i risultati degli strumenti prima che il modello veda l'output. Dichiara i
runtime di destinazione in `contracts.agentToolResultMiddleware`, per esempio
`["pi", "codex"]`. Questo è un punto di integrazione attendibile per Plugin inclusi; i Plugin esterni
dovrebbero preferire i normali hook dei Plugin OpenClaw, a meno che OpenClaw non aggiunga una
policy di attendibilità esplicita per questa funzionalità.

Se il tuo Plugin registra metodi RPC Gateway personalizzati, mantienili su un
prefisso specifico del Plugin. Gli spazi dei nomi amministrativi del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in
`operator.admin`, anche se un Plugin richiede un ambito più ristretto.

Semantica delle protezioni degli hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e chiede l'approvazione all'utente tramite l'overlay di approvazione exec, i pulsanti Telegram, le interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e ferma gli handler con priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando hai bisogno di instradamento in ingresso di thread/argomento. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: preferisci i campi di instradamento tipizzati `replyToId` / `threadId` rispetto alle chiavi di metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei Plugin con fallback limitato: quando un id di approvazione exec non viene trovato, OpenClaw ritenta lo stesso id tramite le approvazioni dei Plugin. L'inoltro delle approvazioni dei Plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se un impianto di approvazione personalizzato deve rilevare lo stesso caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di confrontare manualmente le stringhe di scadenza dell'approvazione.

Consulta [Hook dei Plugin](/it/plugins/hooks) per esempi e il riferimento degli hook.

## Registrazione degli strumenti agente

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere obbligatori (sempre
disponibili) o opzionali (con attivazione esplicita dell'utente):

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

Gli utenti abilitano gli strumenti opzionali nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono saltati)
- Gli strumenti con oggetti di registrazione malformati, incluso `parameters` mancante, vengono saltati e segnalati nella diagnostica del Plugin invece di interrompere le esecuzioni dell'agente
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un Plugin aggiungendo l'id del Plugin a `tools.allow`

## Convenzioni di importazione

Importa sempre da percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei sottopercorsi, consulta [Panoramica SDK](/it/plugins/sdk-overview).

All'interno del tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per gli
import interni — non importare mai il tuo plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider nei barrel alla radice
del pacchetto, a meno che il punto di integrazione non sia davvero generico. Esempi bundled attuali:

- Anthropic: wrapper degli stream Claude e helper `service_tier` / beta
- OpenAI: builder dei provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder del provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider bundled, mantienilo su quel
punto di integrazione alla radice del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Esistono ancora alcuni punti di integrazione helper generati `openclaw/plugin-sdk/<bundled-id>` per
la manutenzione dei plugin bundled quando hanno utilizzi tracciati dal proprietario. Trattali come
superfici riservate, non come pattern predefinito per nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** ha i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non auto-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repo)</Check>

## Test delle release beta

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un formato come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo plugin con il tag beta appena compare. La finestra prima della stable in genere dura solo poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test, scrivendo `all good` oppure cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna un issue intitolato `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link dell'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega l'issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza una PR potrebbero comunque essere rilasciati. I maintainer seguono questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente arriverà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Riferimento della mappa di import e dell'API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura Plugin](/it/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento SDK dei Plugin
- [Manifest](/it/plugins/manifest) — formato del manifest del plugin
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
