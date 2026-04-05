---
read_when:
    - Vuoi creare un nuovo plugin OpenClaw
    - Hai bisogno di una guida rapida per lo sviluppo di plugin
    - Stai aggiungendo un nuovo canale, provider, tool o altra capacità a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo plugin OpenClaw in pochi minuti
title: Creazione di plugin
x-i18n:
    generated_at: "2026-04-05T13:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Creazione di plugin

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media, generazione
di immagini, generazione video, recupero web, ricerca web, strumenti per agenti o qualsiasi
combinazione.

Non è necessario aggiungere il tuo plugin al repository OpenClaw. Pubblicalo su
[ClawHub](/tools/clawhub) o npm e gli utenti lo installano con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e
ripiega automaticamente su npm.

## Prerequisiti

- Node >= 22 e un package manager (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i plugin nel repository: repository clonato e `pnpm install` eseguito

## Che tipo di plugin?

<CardGroup cols={3}>
  <Card title="Plugin di canale" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin tool / hook" icon="wrench">
    Registra strumenti per agenti, hook di eventi o servizi — continua sotto
  </Card>
</CardGroup>

Se un plugin di canale è opzionale e potrebbe non essere installato quando vengono eseguiti onboarding/setup,
usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia setup adapter + wizard
che pubblicizza il requisito di installazione e fallisce in modo sicuro sulle scritture reali di configurazione
finché il plugin non è installato.

## Guida rapida: plugin tool

Questa procedura crea un plugin minimale che registra uno strumento per agenti. I plugin di canale
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Ogni plugin ha bisogno di un manifest, anche senza configurazione. Vedi
    [Manifest](/plugins/manifest) per lo schema completo. Gli snippet canonici di pubblicazione su ClawHub
    si trovano in `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` è per plugin non di canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Plugin di canale](/plugins/sdk-channel-plugins).
    Per tutte le opzioni del punto di ingresso, vedi [Punti di ingresso](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** valida e pubblica con ClawHub, poi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per package spec semplici come
    `@myorg/openclaw-my-plugin`.

    **Plugin nel repository:** posizionali sotto l'albero workspace dei plugin inclusi — vengono rilevati automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacità dei plugin

Un singolo plugin può registrare qualsiasi numero di capacità tramite l'oggetto `api`:

| Capacità               | Metodo di registrazione                         | Guida dettagliata                                                                |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Inferenza testo (LLM)  | `api.registerProvider(...)`                     | [Plugin provider](/plugins/sdk-provider-plugins)                                 |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | [Backend CLI](/gateway/cli-backends)                                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | [Plugin di canale](/plugins/sdk-channel-plugins)                                 |
| Voce (TTS/STT)         | `api.registerSpeechProvider(...)`               | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`        | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione immagini   | `api.registerImageGenerationProvider(...)`      | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Recupero web           | `api.registerWebFetchProvider(...)`             | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Ricerca web            | `api.registerWebSearchProvider(...)`            | [Plugin provider](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Strumenti per agenti   | `api.registerTool(...)`                         | Sotto                                                                            |
| Comandi personalizzati | `api.registerCommand(...)`                      | [Punti di ingresso](/plugins/sdk-entrypoints)                                    |
| Hook di eventi         | `api.registerHook(...)`                         | [Punti di ingresso](/plugins/sdk-entrypoints)                                    |
| Route HTTP             | `api.registerHttpRoute(...)`                    | [Dettagli interni](/plugins/architecture#gateway-http-routes)                    |
| Sottocomandi CLI       | `api.registerCli(...)`                          | [Punti di ingresso](/plugins/sdk-entrypoints)                                    |

Per l'API completa di registrazione, vedi [Panoramica SDK](/plugins/sdk-overview#registration-api).

Se il tuo plugin registra metodi RPC gateway personalizzati, mantienili su un
prefisso specifico del plugin. I namespace di amministrazione core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre risolti a
`operator.admin`, anche se un plugin richiede un ambito più ristretto.

Semantica delle guardie hook da tenere a mente:

- `before_tool_call`: `{ block: true }` è terminale e ferma i gestori con priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e richiede l'approvazione dell'utente tramite l'overlay di approvazione exec, pulsanti Telegram, interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e ferma i gestori con priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e ferma i gestori con priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei plugin con fallback limitato: quando non viene trovato un id di approvazione exec, OpenClaw riprova lo stesso id tramite le approvazioni dei plugin. L'inoltro delle approvazioni dei plugin può essere configurato in modo indipendente tramite `approvals.plugin` nella configurazione.

Se la logica personalizzata di approvazione deve rilevare quel medesimo caso di fallback limitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di cercare manualmente corrispondenze con stringhe di scadenza dell'approvazione.

Vedi [Semantica delle decisioni hook nella panoramica SDK](/plugins/sdk-overview#hook-decision-semantics) per i dettagli.

## Registrazione degli strumenti per agenti

Gli strumenti sono funzioni tipizzate che il LLM può chiamare. Possono essere richiesti (sempre
disponibili) oppure opzionali (opt-in dell'utente):

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

  // Strumento opzionale — l'utente deve aggiungerlo all'allowlist
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

- I nomi degli strumenti non devono entrare in conflitto con i tool core (i conflitti vengono saltati)
- Usa `optional: true` per gli strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un plugin aggiungendo l'id del plugin a `tools.allow`

## Convenzioni di importazione

Importa sempre da percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errato: root monolitica (deprecata, verrà rimossa)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei subpath, vedi [Panoramica SDK](/plugins/sdk-overview).

All'interno del tuo plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
le importazioni interne — non importare mai il tuo stesso plugin tramite il suo percorso SDK.

Per i plugin provider, mantieni gli helper specifici del provider in quei barrel
alla root del pacchetto, a meno che il punto di estensione non sia davvero generico. Esempi inclusi attuali:

- Anthropic: wrapper di stream Claude e helper `service_tier` / beta
- OpenAI: builder del provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder del provider più helper di onboarding/configurazione

Se un helper è utile solo all'interno di un singolo pacchetto provider incluso, mantienilo su quel
punto di estensione alla root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Esistono ancora alcuni punti di estensione helper generati `openclaw/plugin-sdk/<bundled-id>` per
la manutenzione e la compatibilità dei plugin inclusi, ad esempio
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trattali come superfici
riservate, non come il modello predefinito per nuovi plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** ha i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne usano moduli locali, non auto-importazioni SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugin nel repository)</Check>

## Test della beta release

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un aspetto come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo plugin contro il tag beta non appena appare. La finestra prima della stabile di solito è di poche ore.
3. Scrivi nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test con `all good` o con cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza una PR potrebbero essere distribuiti comunque. I maintainer monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente finirà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Crea un plugin di canale di messaggistica
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="Panoramica SDK" icon="book-open" href="/plugins/sdk-overview">
    Riferimento per import map e API di registrazione
  </Card>
  <Card title="Helper runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/plugins/sdk-testing">
    Utility e pattern di test
  </Card>
  <Card title="Manifest del plugin" icon="file-json" href="/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Architettura dei plugin](/plugins/architecture) — approfondimento sull'architettura interna
- [Panoramica SDK](/plugins/sdk-overview) — riferimento del Plugin SDK
- [Manifest](/plugins/manifest) — formato del manifest del plugin
- [Plugin di canale](/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/plugins/sdk-provider-plugins) — creazione di plugin provider
