---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, fornitore, strumento o un'altra funzionalità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo plugin OpenClaw in pochi minuti
title: Creazione di plugin
x-i18n:
    generated_at: "2026-05-02T08:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove funzionalità: canali, provider di modelli,
speech, trascrizione realtime, voce realtime, comprensione dei media, generazione
di immagini, generazione di video, recupero web, ricerca web, strumenti per agenti
o qualsiasi combinazione.

Non devi aggiungere il tuo plugin al repository OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) e gli utenti lo installano con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e passa
automaticamente a npm come fallback per i pacchetti che usano ancora la distribuzione npm.

## Prerequisiti

- Node >= 22 e un gestore di pacchetti (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i plugin nel repository: repository clonato e `pnpm install` eseguito. Lo sviluppo
  di plugin da checkout dei sorgenti è solo pnpm perché OpenClaw carica i plugin
  inclusi dai pacchetti workspace `extensions/*`.

## Che tipo di plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Connetti OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti per agenti, hook di eventi o servizi — continua sotto
  </Card>
</CardGroup>

Per un plugin di canale che non è garantito sia installato quando viene eseguito
onboarding/setup, usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adattatore di configurazione + procedura guidata
che indica il requisito di installazione e impedisce in modo sicuro le scritture
di configurazione reali finché il plugin non è installato.

## Avvio rapido: plugin di strumenti

Questa procedura crea un plugin minimale che registra uno strumento per agenti. I plugin di canale
e provider hanno guide dedicate collegate sopra.

<Steps>
  <Step title="Create the package and manifest">
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

    Ogni plugin necessita di un manifest, anche senza configurazione. Gli strumenti registrati a runtime
    devono essere elencati in `contracts.tools` in modo che OpenClaw possa scoprire il plugin
    proprietario senza caricare ogni runtime dei plugin. I plugin dovrebbero anche dichiarare
    `activation.onStartup` intenzionalmente. Questo esempio lo imposta a `true`. Vedi
    [Manifest](/it/plugins/manifest) per lo schema completo. Gli snippet canonici di pubblicazione ClawHub
    si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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

    `definePluginEntry` è per i plugin non di canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).
    Per le opzioni complete degli entry point, vedi [Entry Point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Plugin esterni:** valida e pubblica con ClawHub, quindi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per specifiche di pacchetto semplici come
    `@myorg/openclaw-my-plugin`; npm resta un fallback per i pacchetti che non sono
    ancora migrati a ClawHub.

    **Plugin nel repository:** posizionali sotto l'albero workspace dei plugin inclusi — vengono scoperti automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Funzionalità dei Plugin

Un singolo plugin può registrare qualsiasi numero di funzionalità tramite l'oggetto `api`:

| Funzionalità           | Metodo di registrazione                          | Guida dettagliata                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferenza di testo (LLM) | `api.registerProvider(...)`                    | [Plugin provider](/it/plugins/sdk-provider-plugins)                                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | [Backend CLI](/it/gateway/cli-backends)                                            |
| Canale / messaggistica | `api.registerChannel(...)`                       | [Plugin di canale](/it/plugins/sdk-channel-plugins)                                |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`         | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recupero web           | `api.registerWebFetchProvider(...)`              | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware dei risultati degli strumenti | `api.registerAgentToolResultMiddleware(...)` | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                        |
| Strumenti per agenti   | `api.registerTool(...)`                          | Sotto                                                                           |
| Comandi personalizzati | `api.registerCommand(...)`                       | [Entry Point](/it/plugins/sdk-entrypoints)                                         |
| Hook dei plugin        | `api.on(...)`                                    | [Hook dei plugin](/it/plugins/hooks)                                               |
| Hook di eventi interni | `api.registerHook(...)`                          | [Entry Point](/it/plugins/sdk-entrypoints)                                         |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Interni](/it/plugins/architecture-internals#gateway-http-routes)                  |
| Sottocomandi CLI       | `api.registerCli(...)`                           | [Entry Point](/it/plugins/sdk-entrypoints)                                         |

Per l'API di registrazione completa, vedi [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

I plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
hanno bisogno di riscrivere in modo asincrono i risultati degli strumenti prima che il modello veda l'output. Dichiara i
runtime di destinazione in `contracts.agentToolResultMiddleware`, per esempio
`["pi", "codex"]`. Questa è una seam attendibile per plugin inclusi; i plugin
esterni dovrebbero preferire i normali hook dei plugin OpenClaw a meno che OpenClaw non introduca una
policy di fiducia esplicita per questa funzionalità.

Se il tuo plugin registra metodi RPC personalizzati del gateway, tienili su un
prefisso specifico del plugin. Gli spazi dei nomi amministrativi core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in
`operator.admin`, anche se un plugin richiede un ambito più ristretto.

Semantica delle guardie degli hook da tenere presente:

- `before_tool_call`: `{ block: true }` è terminale e interrompe gli handler con priorità più bassa.
- `before_tool_call`: `{ block: false }` è trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e chiede l'approvazione all'utente tramite l'overlay di approvazione exec, i pulsanti Telegram, le interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e interrompe gli handler con priorità più bassa.
- `before_install`: `{ block: false }` è trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e interrompe gli handler con priorità più bassa.
- `message_sending`: `{ cancel: false }` è trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando ti serve il routing in ingresso di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: preferisci i campi di routing tipizzati `replyToId` / `threadId` rispetto alle chiavi di metadati specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei plugin con fallback limitato: quando non viene trovato un id di approvazione exec, OpenClaw riprova lo stesso id tra le approvazioni dei plugin. L'inoltro delle approvazioni dei plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se il plumbing di approvazione personalizzato deve rilevare lo stesso caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di confrontare manualmente le stringhe di scadenza dell'approvazione.

Vedi [Hook dei plugin](/it/plugins/hooks) per esempi e il riferimento degli hook.

## Registrare strumenti per agenti

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere obbligatori (sempre
disponibili) o opzionali (opt-in dell'utente):

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

Ogni strumento registrato con `api.registerTool(...)` deve essere dichiarato anche nel
manifest del plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Gli utenti abilitano gli strumenti opzionali nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono ignorati)
- Gli strumenti con oggetti di registrazione non validi, inclusa l'assenza di `parameters`, vengono ignorati e segnalati nella diagnostica del plugin invece di interrompere le esecuzioni degli agenti
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un plugin aggiungendo l'id del plugin a `tools.allow`

## Registrazione dei comandi CLI

I plugin possono aggiungere gruppi di comandi root `openclaw` con `api.registerCli`. Fornisci
`descriptors` per ogni root di comando di livello superiore, così OpenClaw può mostrare e instradare
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

Dopo l'installazione, verifica la registrazione runtime ed esegui il comando:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Convenzioni di importazione

Importa sempre da percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo ai sottopercorsi, consulta [Panoramica dell'SDK](/it/plugins/sdk-overview).

All'interno del tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne — non importare mai il tuo plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel
alla root del pacchetto, a meno che la seam non sia davvero generica. Esempi bundled attuali:

- Anthropic: wrapper di stream Claude e helper `service_tier` / beta
- OpenAI: builder provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder provider più helper per onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider bundled, tienilo su quella
seam alla root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Esistono ancora alcune seam helper generate `openclaw/plugin-sdk/<bundled-id>` per
la manutenzione dei plugin bundled quando hanno utilizzi tracciati dal proprietario. Considerale
superfici riservate, non il modello predefinito per nuovi plugin di terze parti.

## Checklist prima dell'invio

<Check>**package.json** contiene metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repository)</Check>

## Test delle release beta

1. Monitora i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno il formato `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo plugin rispetto al tag beta non appena appare. La finestra prima della stabile è in genere solo di poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo i test, con `all good` oppure con ciò che si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; quelli senza potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente finirà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="Panoramica dell'SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa di importazione e riferimento API di registrazione
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagente tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern di test
  </Card>
  <Card title="Manifest del Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo allo schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento SDK dei Plugin
- [Manifest](/it/plugins/manifest) — formato del manifest del plugin
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
