---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Hai bisogno di una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o altra capability a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-04-23T08:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Creazione di Plugin

I plugin estendono OpenClaw con nuove capability: canali, provider di modelli,
speech, trascrizione realtime, voce realtime, comprensione dei media, generazione
di immagini, generazione video, web fetch, web search, strumenti dell'agente o qualsiasi
combinazione.

Non devi aggiungere il tuo Plugin al repository OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) o npm e gli utenti lo installano con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e
usa automaticamente npm come fallback.

## Prerequisiti

- Node >= 22 e un gestore pacchetti (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i plugin nel repository: repository clonato e `pnpm install` eseguito

## Che tipo di Plugin?

<CardGroup cols={3}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin strumento / hook" icon="wrench">
    Registra strumenti dell'agente, hook di eventi o servizi — continua sotto
  </Card>
</CardGroup>

Se un Plugin canale è facoltativo e potrebbe non essere installato quando viene
eseguito onboarding/setup, usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adapter + wizard di setup
che segnala il requisito di installazione e fallisce in modalità fail-closed sulle vere scritture di configurazione
finché il Plugin non è installato.

## Avvio rapido: Plugin strumento

Questa guida crea un Plugin minimo che registra uno strumento dell'agente. I Plugin
canale e provider hanno guide dedicate collegate sopra.

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
    [Manifest](/it/plugins/manifest) per lo schema completo. Gli snippet canonici
    per la pubblicazione su ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Scrivi il punto di ingresso">

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

    `definePluginEntry` è per i plugin non-canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Plugin canale](/it/plugins/sdk-channel-plugins).
    Per le opzioni complete del punto di ingresso, vedi [Punti di ingresso](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** convalida e pubblica con ClawHub, quindi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per specifiche pacchetto bare come
    `@myorg/openclaw-my-plugin`.

    **Plugin nel repository:** inserisci sotto l'albero workspace dei plugin inclusi — vengono individuati automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capability del Plugin

Un singolo Plugin può registrare qualsiasi numero di capability tramite l'oggetto `api`:

| Capability             | Metodo di registrazione                         | Guida dettagliata                                                                |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Inferenza testo (LLM)  | `api.registerProvider(...)`                     | [Plugin provider](/it/plugins/sdk-provider-plugins)                                 |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | [Backend CLI](/it/gateway/cli-backends)                                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | [Plugin canale](/it/plugins/sdk-channel-plugins)                                    |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`        | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione immagini   | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web search             | `api.registerWebSearchProvider(...)`            | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Estensione Pi incorporata | `api.registerEmbeddedExtensionFactory(...)`  | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                         |
| Strumenti dell'agente  | `api.registerTool(...)`                         | Sotto                                                                            |
| Comandi personalizzati | `api.registerCommand(...)`                      | [Punti di ingresso](/it/plugins/sdk-entrypoints)                                    |
| Hook di eventi         | `api.registerHook(...)`                         | [Punti di ingresso](/it/plugins/sdk-entrypoints)                                    |
| Route HTTP             | `api.registerHttpRoute(...)`                    | [Interni](/it/plugins/architecture#gateway-http-routes)                             |
| Sottocomandi CLI       | `api.registerCli(...)`                          | [Punti di ingresso](/it/plugins/sdk-entrypoints)                                    |

Per l'API completa di registrazione, vedi [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

Usa `api.registerEmbeddedExtensionFactory(...)` quando un Plugin ha bisogno di
hook embedded-runner nativi Pi come la riscrittura asincrona di `tool_result` prima che venga emesso il messaggio finale del risultato dello strumento. Preferisci i normali hook Plugin di OpenClaw quando il lavoro non richiede il timing dell'estensione Pi.

Se il tuo Plugin registra metodi RPC gateway personalizzati, mantienili su un
prefisso specifico del Plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e risolvono sempre a
`operator.admin`, anche se un Plugin richiede uno scope più ristretto.

Semantica dei guard hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e blocca gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e richiede l'approvazione dell'utente tramite overlay di approvazione exec, pulsanti Telegram, interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e blocca gli handler con priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e blocca gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando hai bisogno di instradamento di thread/topic in ingresso. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: preferisci i campi di instradamento tipizzati `replyToId` / `threadId` rispetto a chiavi metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei plugin con fallback limitato: quando un id di approvazione exec non viene trovato, OpenClaw riprova lo stesso id tramite le approvazioni Plugin. L'inoltro delle approvazioni Plugin può essere configurato in modo indipendente tramite `approvals.plugin` nella configurazione.

Se una logica di approvazione personalizzata deve rilevare quel medesimo caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di confrontare manualmente le stringhe di scadenza delle approvazioni.

Vedi [Panoramica SDK semantica delle decisioni hook](/it/plugins/sdk-overview#hook-decision-semantics) per i dettagli.

## Registrare strumenti dell'agente

Gli strumenti sono funzioni tipizzate che il LLM può chiamare. Possono essere obbligatori
(sempre disponibili) o facoltativi (opt-in dell'utente):

```typescript
register(api) {
  // Strumento obbligatorio — sempre disponibile
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

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono saltati)
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un Plugin aggiungendo l'id del Plugin a `tools.allow`

## Convenzioni di importazione

Importa sempre da percorsi focalizzati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Sbagliato: radice monolitica (deprecata, verrà rimossa)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei subpath, vedi [Panoramica SDK](/it/plugins/sdk-overview).

All'interno del tuo Plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne — non importare mai il tuo stesso Plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel alla radice
del pacchetto a meno che l'interfaccia non sia davvero generica. Esempi inclusi attuali:

- Anthropic: wrapper stream Claude e helper `service_tier` / beta
- OpenAI: builder provider, helper del modello predefinito, provider realtime
- OpenRouter: builder provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider incluso, mantienilo su quell'interfaccia alla radice del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Alcune interfacce helper generate `openclaw/plugin-sdk/<bundled-id>` esistono ancora per
la manutenzione e la compatibilità dei plugin inclusi, per esempio
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trattale come superfici
riservate, non come pattern predefinito per nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** ha metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi focalizzati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non auto-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repository)</Check>

## Test della beta release

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un aspetto simile a `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo Plugin contro il tag beta non appena appare. La finestra prima della stable è in genere di poche ore.
3. Scrivi nel thread del tuo Plugin nel canale Discord `plugin-forum` dopo il test, indicando `all good` oppure cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna un issue intitolato `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link dell'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega l'issue sia nella PR sia nel thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza PR potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, probabilmente la tua correzione finirà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Riferimento della mappa di importazione e dell'API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest del Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei plugin](/it/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento SDK del Plugin
- [Manifest](/it/plugins/manifest) — formato del manifest del Plugin
- [Plugin canale](/it/plugins/sdk-channel-plugins) — creazione di plugin canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
