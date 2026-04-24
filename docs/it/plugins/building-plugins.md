---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o altra capacità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creare Plugin
x-i18n:
    generated_at: "2026-04-24T08:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

I Plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini,
generazione video, web fetch, web search, strumenti per agenti o qualsiasi
combinazione.

Non devi aggiungere il tuo Plugin al repository di OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) o npm e gli utenti lo installano con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e
poi usa automaticamente il fallback a npm.

## Prerequisiti

- Node >= 22 e un package manager (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i Plugin nel repository: repository clonato ed esecuzione di `pnpm install` completata

## Che tipo di Plugin?

<CardGroup cols={3}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin strumento / hook" icon="wrench">
    Registra strumenti per agenti, hook di evento o servizi — continua sotto
  </Card>
</CardGroup>

Per un Plugin canale che non è garantito essere installato quando vengono eseguiti onboarding/setup,
usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adapter + wizard di setup
che pubblicizza il requisito di installazione e fallisce in modalità fail-closed sulle vere scritture di configurazione
finché il Plugin non è installato.

## Avvio rapido: Plugin strumento

Questa procedura crea un Plugin minimo che registra uno strumento per agenti. I
Plugin canale e provider hanno guide dedicate collegate sopra.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Ogni Plugin ha bisogno di un manifest, anche senza configurazione. Vedi
    [Manifest](/it/plugins/manifest) per lo schema completo. Gli snippet canonici di
    pubblicazione su ClawHub si trovano in `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` è per i Plugin non-canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Plugin canale](/it/plugins/sdk-channel-plugins).
    Per tutte le opzioni dell'entry point, vedi [Entry Points](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** valida e pubblica con ClawHub, poi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per specifiche di pacchetto semplici come
    `@myorg/openclaw-my-plugin`.

    **Plugin nel repository:** posizionali sotto l'albero workspace dei Plugin inclusi — vengono rilevati automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacità del Plugin

Un singolo Plugin può registrare qualsiasi numero di capacità tramite l'oggetto `api`:

| Capacità               | Metodo di registrazione                         | Guida dettagliata                                                                |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Inferenza testuale (LLM) | `api.registerProvider(...)`                   | [Plugin provider](/it/plugins/sdk-provider-plugins)                                 |
| Backend CLI di inferenza | `api.registerCliBackend(...)`                 | [Backend CLI](/it/gateway/cli-backends)                                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | [Plugin canale](/it/plugins/sdk-channel-plugins)                                    |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`        | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`     | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web search             | `api.registerWebSearchProvider(...)`            | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Estensione Pi embedded | `api.registerEmbeddedExtensionFactory(...)`     | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                         |
| Strumenti per agenti   | `api.registerTool(...)`                         | Sotto                                                                            |
| Comandi personalizzati | `api.registerCommand(...)`                      | [Entry Points](/it/plugins/sdk-entrypoints)                                         |
| Hook di evento         | `api.registerHook(...)`                         | [Entry Points](/it/plugins/sdk-entrypoints)                                         |
| Route HTTP             | `api.registerHttpRoute(...)`                    | [Internals](/it/plugins/architecture-internals#gateway-http-routes)                 |
| Sottocomandi CLI       | `api.registerCli(...)`                          | [Entry Points](/it/plugins/sdk-entrypoints)                                         |

Per l'API completa di registrazione, vedi [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

Usa `api.registerEmbeddedExtensionFactory(...)` quando un Plugin ha bisogno di
hook embedded-runner nativi di Pi, come la riscrittura asincrona di `tool_result` prima che venga emesso il messaggio finale del risultato dello strumento. Preferisci gli hook regolari dei Plugin OpenClaw quando il lavoro non richiede la tempistica di un'estensione Pi.

Se il tuo Plugin registra metodi RPC gateway personalizzati, mantienili su un
prefisso specifico del Plugin. I namespace amministrativi core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre su
`operator.admin`, anche se un Plugin richiede uno scope più ristretto.

Semantica dei guard hook da tenere presente:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e richiede l'approvazione dell'utente tramite overlay di approvazione exec, pulsanti Telegram, interazioni Discord o comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando hai bisogno dell'instradamento in entrata di thread/topic. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: preferisci i campi tipizzati di instradamento `replyToId` / `threadId` rispetto alle chiavi `metadata` specifiche del canale.

Il comando `/approve` gestisce sia approvazioni exec sia approvazioni Plugin con fallback delimitato: quando non viene trovato un ID di approvazione exec, OpenClaw riprova lo stesso ID tramite le approvazioni Plugin. L'inoltro delle approvazioni Plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se una logica personalizzata di approvazione deve rilevare quel medesimo caso di fallback delimitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di fare matching manuale delle stringhe di scadenza dell'approvazione.

Vedi [Semantica delle decisioni degli hook nella panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics) per i dettagli.

## Registrare strumenti per agenti

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere richiesti (sempre
disponibili) o facoltativi (opt-in dell'utente):

```typescript
register(api) {
  // Strumento richiesto — sempre disponibile
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Strumento facoltativo — l'utente deve aggiungerlo all'allowlist
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

Gli utenti abilitano gli strumenti facoltativi nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono ignorati)
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un Plugin aggiungendo l'ID del Plugin a `tools.allow`

## Convenzioni di importazione

Importa sempre da percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Sbagliato: root monolitica (deprecata, sarà rimossa)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei sottopercorsi, vedi [Panoramica SDK](/it/plugins/sdk-overview).

All'interno del tuo Plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne — non importare mai il tuo stesso Plugin tramite il suo percorso SDK.

Per i Plugin provider, mantieni gli helper specifici del provider in quei
barrel alla root del pacchetto, a meno che il seam non sia davvero generico. Esempi inclusi attuali:

- Anthropic: wrapper stream Claude e helper `service_tier` / beta
- OpenAI: builder provider, helper dei modelli predefiniti, provider realtime
- OpenRouter: builder provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider incluso, mantienilo su quel seam alla root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Alcuni seam helper generati `openclaw/plugin-sdk/<bundled-id>` esistono ancora per
manutenzione e compatibilità dei Plugin inclusi, ad esempio
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trattali come superfici
riservate, non come modello predefinito per nuovi Plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** ha metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugin nel repository)</Check>

## Test della beta release

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno questo aspetto: `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di rilascio.
2. Testa il tuo Plugin contro il tag beta appena compare. La finestra prima della stable è in genere di poche ore.
3. Pubblica nel thread del tuo Plugin nel canale Discord `plugin-forum` dopo il test con `all good` oppure descrivendo cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna un'issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link dell'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega l'issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza PR potrebbero comunque finire nella release. I maintainer tengono d'occhio questi thread durante il test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente entrerà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa delle importazioni e riferimento API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, sotto-agente tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest del Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento del Plugin SDK
- [Manifest](/it/plugins/manifest) — formato del manifest del plugin
- [Plugin canale](/it/plugins/sdk-channel-plugins) — creazione di Plugin canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di Plugin provider
