---
read_when:
    - Comprendere la progettazione dell'integrazione dell'SDK Pi in OpenClaw
    - Modifica del ciclo di vita della sessione dell'agente, degli strumenti o del cablaggio dei provider per Pi
summary: Architettura dell'integrazione dell'agente Pi integrato di OpenClaw e del ciclo di vita della sessione
title: Architettura di integrazione di Pi
x-i18n:
    generated_at: "2026-05-11T20:31:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e con i suoi pacchetti correlati (`pi-ai`, `pi-agent-core`, `pi-tui`) per alimentare le sue funzionalità di agente AI.

## Panoramica

OpenClaw usa l’SDK pi per incorporare un agente di coding AI nella sua architettura di Gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato offre:

- Controllo completo sul ciclo di vita della sessione e sulla gestione degli eventi
- Iniezione di strumenti personalizzati (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del prompt di sistema per canale/contesto
- Persistenza della sessione con supporto per ramificazione/Compaction
- Rotazione dei profili di autenticazione multi-account con failover
- Cambio modello indipendente dal provider

## Dipendenze dei pacchetti

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| Pacchetto         | Scopo                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Astrazioni LLM principali: `Model`, `streamSimple`, tipi di messaggi, API dei provider                 |
| `pi-agent-core`   | Ciclo dell’agente, esecuzione degli strumenti, tipi `AgentMessage`                                     |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, strumenti integrati |
| `pi-tui`          | Componenti UI terminale (usati nella modalità TUI locale di OpenClaw)                                  |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Riesporta da pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Punto di ingresso principale: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logica di un singolo tentativo con configurazione della sessione
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Crea payload di risposta dai risultati dell’esecuzione
│   │   ├── images.ts              # Iniezione immagini per modelli vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Rilevamento errori di interruzione
│   ├── cache-ttl.ts               # Tracciamento TTL della cache per la potatura del contesto
│   ├── compact.ts                 # Logica di Compaction manuale/automatica
│   ├── extensions.ts              # Carica estensioni pi per esecuzioni incorporate
│   ├── extra-params.ts            # Parametri di stream specifici del provider
│   ├── google.ts                  # Correzioni dell’ordine dei turni Google/Gemini
│   ├── history.ts                 # Limitazione della cronologia (DM vs gruppo)
│   ├── lanes.ts                   # Corsie dei comandi di sessione/globali
│   ├── logger.ts                  # Logger del sottosistema
│   ├── model.ts                   # Risoluzione del modello tramite ModelRegistry
│   ├── runs.ts                    # Tracciamento esecuzioni attive, interruzione, coda
│   ├── sandbox-info.ts            # Informazioni sandbox per il prompt di sistema
│   ├── session-manager-cache.ts   # Caching delle istanze SessionManager
│   ├── session-manager-init.ts    # Inizializzazione del file di sessione
│   ├── system-prompt.ts           # Costruttore del prompt di sistema
│   ├── tool-split.ts              # Divide gli strumenti tra builtIn e custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappatura ThinkLevel, descrizione degli errori
├── pi-embedded-subscribe.ts       # Sottoscrizione/dispatch degli eventi di sessione
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory dei gestori eventi
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Suddivisione in blocchi delle risposte streaming
├── pi-embedded-messaging.ts       # Tracciamento degli strumenti di messaggistica inviati
├── pi-embedded-helpers.ts         # Classificazione errori, validazione dei turni
├── pi-embedded-helpers/           # Moduli helper
├── pi-embedded-utils.ts           # Utilità di formattazione
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping AbortSignal per gli strumenti
├── pi-tools.policy.ts             # Policy allowlist/denylist degli strumenti
├── pi-tools.read.ts               # Personalizzazioni dello strumento di lettura
├── pi-tools.schema.ts             # Normalizzazione degli schemi degli strumenti
├── pi-tools.types.ts              # Alias di tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adattatore AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override delle impostazioni
├── pi-hooks/                      # Hook pi personalizzati
│   ├── compaction-safeguard.ts    # Estensione di salvaguardia
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Estensione di potatura del contesto Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Risoluzione dei profili di autenticazione
├── auth-profiles.ts               # Archivio profili, cooldown, failover
├── model-selection.ts             # Risoluzione del modello predefinito
├── models-config.ts               # Generazione di models.json
├── model-catalog.ts               # Cache del catalogo modelli
├── context-window-guard.ts        # Validazione della finestra di contesto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Risoluzione dei parametri del prompt di sistema
├── system-prompt-report.ts        # Generazione del report di debug
├── tool-summaries.ts              # Riepiloghi delle descrizioni degli strumenti
├── tool-policy.ts                 # Risoluzione della policy degli strumenti
├── transcript-policy.ts           # Policy di validazione della trascrizione
├── skills.ts                      # Creazione snapshot/prompt delle Skill
├── skills/                        # Sottosistema Skill
├── sandbox.ts                     # Risoluzione del contesto sandbox
├── sandbox/                       # Sottosistema sandbox
├── channel-tools.ts               # Iniezione di strumenti specifici del canale
├── openclaw-tools.ts              # Strumenti specifici di OpenClaw
├── bash-tools.ts                  # Strumenti exec/process
├── apply-patch.ts                 # Strumento apply_patch (OpenAI)
├── tools/                         # Implementazioni dei singoli strumenti
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

I runtime delle azioni di messaggio specifiche del canale ora si trovano nelle directory
delle estensioni possedute dai Plugin invece che sotto `src/agents/tools`, ad esempio:

- i file runtime delle azioni del Plugin Discord
- il file runtime delle azioni del Plugin Slack
- il file runtime delle azioni del Plugin Telegram
- il file runtime delle azioni del Plugin WhatsApp

## Flusso di integrazione principale

### 1. Esecuzione di un agente incorporato

Il punto di ingresso principale è `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Creazione della sessione

Dentro `runEmbeddedAttempt()` (chiamato da `runEmbeddedPiAgent()`), viene usato l’SDK pi:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Sottoscrizione agli eventi

`subscribeEmbeddedPiSession()` si sottoscrive agli eventi `AgentSession` di pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Gli eventi gestiti includono:

- `message_start` / `message_end` / `message_update` (testo/ragionamento in streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Dopo la configurazione, viene inviato un prompt alla sessione:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L’SDK gestisce l’intero ciclo dell’agente: invio all’LLM, esecuzione delle chiamate agli strumenti, streaming delle risposte.

L’iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti immagine dal prompt corrente e
li passa tramite `images` solo per quel turno. Non riesamina i turni più vecchi della cronologia
per reiniettare i payload immagine.

## Architettura degli strumenti

### Pipeline degli strumenti

1. **Strumenti di base**: i `codingTools` di pi (read, bash, edit, write)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Strumenti OpenClaw**: messaggistica, browser, canvas, sessioni, Cron, Gateway, ecc.
4. **Strumenti di canale**: strumenti di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtro delle policy**: strumenti filtrati per profilo, provider, agente, gruppo, policy sandbox
6. **Normalizzazione degli schemi**: schemi ripuliti per peculiarità di Gemini/OpenAI
7. **Wrapping AbortSignal**: strumenti racchiusi per rispettare i segnali di interruzione

### Adattatore delle definizioni degli strumenti

`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L’adattatore in `pi-tool-definition-adapter.ts` fa da ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategia di divisione degli strumenti

`splitSdkTools()` passa tutti gli strumenti tramite `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Questo garantisce che il filtro delle policy, l'integrazione sandbox e il set di strumenti esteso di OpenClaw restino coerenti tra i provider.

## Costruzione del prompt di sistema

Il prompt di sistema viene costruito in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Strumenti, Stile delle chiamate agli strumenti, protezioni di sicurezza, Controllo OpenClaw, Skills, Documenti, Workspace, Sandbox, Messaggistica, Direttive di output dell'assistente, Voce, Risposte silenziose, Heartbeats, metadati di runtime, più Memory e Reactions quando abilitate, e file di contesto opzionali e contenuto extra del prompt di sistema. Le sezioni vengono ridotte per la modalità prompt minimale usata dai subagent.

Il prompt viene applicato dopo la creazione della sessione tramite `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestione delle sessioni

### File di sessione

Le sessioni sono file JSONL con struttura ad albero (collegamento id/parentId). Il `SessionManager` di Pi gestisce la persistenza:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo incapsula con `guardSessionManager()` per la sicurezza dei risultati degli strumenti.

### Cache delle sessioni

`session-manager-cache.ts` memorizza nella cache le istanze di SessionManager per evitare il parsing ripetuto dei file:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitazione della cronologia

`limitHistoryTurns()` riduce la cronologia della conversazione in base al tipo di canale (DM rispetto a gruppo).

### Compaction

L'auto-Compaction si attiva in caso di overflow del contesto. Le firme di overflow comuni
includono `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gestisce la Compaction
manuale:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticazione e risoluzione del modello

### Profili di autenticazione

OpenClaw mantiene uno store di profili di autenticazione con più chiavi API per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

I profili ruotano in caso di errori con tracciamento del cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Risoluzione del modello

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` attiva il fallback del modello quando configurato:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Estensioni Pi

OpenClaw carica estensioni pi personalizzate per comportamenti specializzati:

### Protezione della Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge protezioni alla Compaction, incluso il budgeting adattivo dei token più riepiloghi degli errori degli strumenti e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Potatura del contesto

`src/agents/pi-hooks/context-pruning.ts` implementa la potatura del contesto basata su cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming e risposte a blocchi

### Suddivisione in blocchi

`EmbeddedBlockChunker` gestisce lo streaming del testo in blocchi di risposta distinti:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Rimozione dei tag Thinking/Final

L'output in streaming viene elaborato per rimuovere i blocchi `<think>`/`<thinking>` ed estrarre il contenuto `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Direttive di risposta

Le direttive di risposta come `[[media:url]]`, `[[voice]]`, `[[reply:id]]` vengono analizzate ed estratte:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestione degli errori

### Classificazione degli errori

`pi-embedded-helpers.ts` classifica gli errori per una gestione appropriata:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback del livello di pensiero

Se un livello di pensiero non è supportato, viene usato un fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integrazione sandbox

Quando la modalità sandbox è abilitata, strumenti e percorsi sono vincolati:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Gestione specifica per provider

### Anthropic

- Pulizia della stringa magica di rifiuto
- Validazione dei turni per ruoli consecutivi
- Validazione rigorosa upstream dei parametri degli strumenti Pi

### Google/Gemini

- Sanificazione degli schemi degli strumenti di proprietà del Plugin

### OpenAI

- Strumento `apply_patch` per i modelli Codex
- Gestione del downgrade del livello di pensiero

## Integrazione TUI

OpenClaw dispone anche di una modalità TUI locale che usa direttamente i componenti pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

Questo fornisce un'esperienza di terminale interattiva simile alla modalità nativa di Pi.

## Differenze principali rispetto alla CLI Pi

| Aspetto              | CLI Pi                  | OpenClaw incorporato                                                                          |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocazione          | comando `pi` / RPC      | SDK tramite `createAgentSession()`                                                            |
| Strumenti            | Strumenti di coding predefiniti | Suite di strumenti OpenClaw personalizzata                                                    |
| Prompt di sistema    | AGENTS.md + prompt      | Dinamico per canale/contesto                                                                  |
| Archiviazione sessioni | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (o `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticazione       | Singola credenziale     | Multi-profilo con rotazione                                                                   |
| Estensioni           | Caricate da disco       | Percorsi programmatici + su disco                                                             |
| Gestione eventi      | Rendering TUI           | Basata su callback (onBlockReply, ecc.)                                                       |

## Considerazioni future

Aree per possibile rielaborazione:

1. **Allineamento delle firme degli strumenti**: attualmente adattamento tra le firme di pi-agent-core e pi-coding-agent
2. **Incapsulamento del gestore sessioni**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare più direttamente il `ResourceLoader` di Pi
4. **Complessità del gestore di streaming**: `subscribeEmbeddedPiSession` è diventato grande
5. **Particolarità dei provider**: molti percorsi di codice specifici per provider che Pi potrebbe potenzialmente gestire

## Test

La copertura dell'integrazione Pi comprende queste suite:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (abilita `OPENCLAW_LIVE_TEST=1`)

Per i comandi di esecuzione correnti, vedi [Flusso di lavoro di sviluppo Pi](/it/pi-dev).

## Correlati

- [Flusso di lavoro di sviluppo Pi](/it/pi-dev)
- [Panoramica dell'installazione](/it/install)
