---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, fornitore, strumento o un'altra funzionalità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-05-04T07:06:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
sintesi vocale, trascrizione in tempo reale, voce in tempo reale, comprensione
dei media, generazione di immagini, generazione di video, recupero web, ricerca
web, strumenti per agenti o qualsiasi combinazione.

Non devi aggiungere il tuo plugin al repository di OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) e gli utenti lo installano con
`openclaw plugins install clawhub:<package-name>`. Le specifiche di pacchetto
semplici continuano a installare da npm durante la transizione di lancio.

## Prerequisiti

- Node >= 22 e un gestore di pacchetti (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i plugin nel repository: repository clonato e `pnpm install` completato. Lo
  sviluppo dei plugin da checkout sorgente è solo pnpm perché OpenClaw carica i
  plugin inclusi dai pacchetti workspace `extensions/*`.

## Che tipo di plugin?

<CardGroup cols={3}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Connetti OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin di strumenti / hook" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti per agenti, hook di eventi o servizi — continua sotto
  </Card>
</CardGroup>

Per un plugin di canale che non è garantito sia installato quando viene eseguito
l'onboarding/setup, usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia adattatore di setup +
procedura guidata che segnala il requisito di installazione e fallisce in modo
chiuso sulle scritture di configurazione reali finché il plugin non è installato.

## Avvio rapido: plugin di strumenti

Questa guida dettagliata crea un plugin minimale che registra uno strumento per
agenti. I plugin di canale e provider hanno guide dedicate collegate sopra.

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

    Ogni plugin richiede un manifest, anche senza configurazione. Gli strumenti
    registrati a runtime devono essere elencati in `contracts.tools` così
    OpenClaw può individuare il plugin proprietario senza caricare ogni runtime
    di plugin. I plugin dovrebbero anche dichiarare intenzionalmente
    `activation.onStartup`. Questo esempio lo imposta su `true`. Consulta
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

    `definePluginEntry` è per plugin non di canale. Per i canali, usa
    `defineChannelPluginEntry` — consulta [Plugin di canale](/it/plugins/sdk-channel-plugins).
    Per tutte le opzioni dell'entry point, consulta [Entry point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** convalida e pubblica con ClawHub, poi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Le specifiche di pacchetto semplici come `@myorg/openclaw-my-plugin`
    installano da npm durante la transizione di lancio. Usa `clawhub:` quando
    vuoi la risoluzione tramite ClawHub.

    **Plugin nel repository:** posizionali sotto l'albero workspace dei plugin inclusi — vengono rilevati automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacità dei plugin

Un singolo plugin può registrare un numero qualsiasi di capacità tramite
l'oggetto `api`:

| Capacità               | Metodo di registrazione                         | Guida dettagliata                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferenza testuale (LLM) | `api.registerProvider(...)`                    | [Plugin provider](/it/plugins/sdk-provider-plugins)                                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | [Backend CLI](/it/gateway/cli-backends)                                            |
| Canale / messaggistica | `api.registerChannel(...)`                       | [Plugin di canale](/it/plugins/sdk-channel-plugins)                                |
| Voce (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`       | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recupero web           | `api.registerWebFetchProvider(...)`              | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | [Plugin provider](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware per risultati degli strumenti | `api.registerAgentToolResultMiddleware(...)` | [Panoramica SDK](/it/plugins/sdk-overview#registration-api)                        |
| Strumenti per agenti   | `api.registerTool(...)`                          | Sotto                                                                           |
| Comandi personalizzati | `api.registerCommand(...)`                       | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Hook dei plugin        | `api.on(...)`                                    | [Hook dei plugin](/it/plugins/hooks)                                               |
| Hook di eventi interni | `api.registerHook(...)`                          | [Entry point](/it/plugins/sdk-entrypoints)                                         |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Dettagli interni](/it/plugins/architecture-internals#gateway-http-routes)         |
| Sottocomandi CLI       | `api.registerCli(...)`                           | [Entry point](/it/plugins/sdk-entrypoints)                                         |

Per l'API di registrazione completa, consulta [Panoramica SDK](/it/plugins/sdk-overview#registration-api).

I plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)`
quando devono riscrivere in modo asincrono i risultati degli strumenti prima che
il modello veda l'output. Dichiara i runtime di destinazione in
`contracts.agentToolResultMiddleware`, ad esempio `["pi", "codex"]`. Questo è un
punto di integrazione attendibile per plugin inclusi; i plugin esterni dovrebbero
preferire i normali hook dei plugin OpenClaw a meno che OpenClaw non sviluppi una
policy di attendibilità esplicita per questa capacità.

Se il tuo plugin registra metodi RPC personalizzati del Gateway, mantienili su
un prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono
sempre in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

Semantica delle guardie degli hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e richiede l'approvazione dell'utente tramite l'overlay di approvazione exec, i pulsanti Telegram, le interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e interrompe gli handler con priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e interrompe gli handler con priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando ti serve l'instradamento di thread/topic in ingresso. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: preferisci i campi di instradamento tipizzati `replyToId` / `threadId` rispetto alle chiavi metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei plugin con
fallback limitato: quando non viene trovato un id di approvazione exec, OpenClaw
ritenta lo stesso id tra le approvazioni dei plugin. L'inoltro delle approvazioni
dei plugin può essere configurato indipendentemente tramite `approvals.plugin`
nella configurazione.

Se un'integrazione personalizzata per le approvazioni deve rilevare lo stesso
caso di fallback limitato, preferisci `isApprovalNotFoundError` da
`openclaw/plugin-sdk/error-runtime` invece di confrontare manualmente le stringhe
di scadenza delle approvazioni.

Consulta [Hook dei plugin](/it/plugins/hooks) per esempi e il riferimento degli hook.

## Registrare strumenti per agenti

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere
obbligatori (sempre disponibili) o opzionali (opt-in dell'utente):

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

Ogni strumento registrato con `api.registerTool(...)` deve anche essere
dichiarato nel manifest del plugin:

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

OpenClaw acquisisce e memorizza nella cache il descrittore convalidato dallo strumento registrato,
quindi i plugin non duplicano `description` o i dati dello schema nel manifesto. Il
contratto del manifesto dichiara solo proprietà e individuazione; l'esecuzione chiama comunque
l'implementazione live dello strumento registrato.
Imposta `toolMetadata.<tool>.optional: true` per gli strumenti registrati con
`api.registerTool(..., { optional: true })`, così OpenClaw può evitare di caricare quel
runtime del plugin finché lo strumento non viene incluso esplicitamente nell'elenco consentito.

Gli utenti abilitano gli strumenti opzionali nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono ignorati)
- Gli strumenti con oggetti di registrazione non validi, inclusa l'assenza di `parameters`, vengono ignorati e segnalati nella diagnostica del plugin invece di interrompere le esecuzioni degli agenti
- Usa `optional: true` per gli strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un plugin aggiungendo l'id del plugin a `tools.allow`

## Registrazione dei comandi CLI

I plugin possono aggiungere gruppi di comandi radice `openclaw` con `api.registerCli`. Fornisci
`descriptors` per ogni radice di comando di primo livello, così OpenClaw può mostrare e instradare
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

Per il riferimento completo dei sottopercorsi, consulta [Panoramica SDK](/it/plugins/sdk-overview).

All'interno del tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne: non importare mai il tuo plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel
alla radice del pacchetto, a meno che il punto di integrazione non sia davvero generico. Esempi bundled attuali:

- Anthropic: wrapper di stream Claude e helper `service_tier` / beta
- OpenAI: builder di provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder di provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider bundled, mantienilo su quel
punto di integrazione alla radice del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Alcuni punti di integrazione helper generati `openclaw/plugin-sdk/<bundled-id>` esistono ancora per
la manutenzione dei plugin bundled quando hanno un uso tracciato dal proprietario. Trattali come
superfici riservate, non come il pattern predefinito per nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** contiene i metadati `openclaw` corretti</Check>
<Check>Il manifesto **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repo)</Check>

## Test delle release beta

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un aspetto come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo plugin rispetto al tag beta appena appare. La finestra prima della stable di solito è di poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test con `all good` oppure con ciò che si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza una PR potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente finirà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa di importazione e riferimento dell'API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifesto Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifesto
  </Card>
</CardGroup>

## Correlati

- [Architettura Plugin](/it/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento SDK Plugin
- [Manifesto](/it/plugins/manifest) — formato del manifesto del plugin
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
