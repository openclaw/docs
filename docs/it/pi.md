---
read_when:
    - Comprendere la progettazione dell'integrazione del Pi SDK in OpenClaw
    - Modifica del ciclo di vita delle sessioni degli agenti, degli strumenti o del collegamento dei provider per Pi
summary: Architettura dell'integrazione dell'agente Pi incorporato di OpenClaw e del ciclo di vita delle sessioni
title: Architettura dell'integrazione con Pi
x-i18n:
    generated_at: "2026-04-30T09:00:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e i suoi pacchetti sibling (`pi-ai`, `pi-agent-core`, `pi-tui`) per alimentare le sue capacità di agente IA.

## Panoramica

OpenClaw usa l’SDK pi per incorporare un agente di coding IA nella propria architettura Gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato offre:

- Controllo completo sul ciclo di vita della sessione e sulla gestione degli eventi
- Iniezione di strumenti personalizzati (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del prompt di sistema per canale/contesto
- Persistenza della sessione con supporto per ramificazione/Compaction
- Rotazione dei profili di autenticazione multi-account con failover
- Cambio di modello indipendente dal provider

## Dipendenze dei pacchetti

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pacchetto         | Scopo                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Astrazioni LLM di base: `Model`, `streamSimple`, tipi di messaggio, API dei provider                   |
| `pi-agent-core`   | Loop dell’agente, esecuzione degli strumenti, tipi `AgentMessage`                                      |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, strumenti integrati |
| `pi-tui`          | Componenti dell’interfaccia terminale (usati nella modalità TUI locale di OpenClaw)                    |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
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

I runtime delle azioni di messaggio specifiche del canale ora risiedono nelle directory delle estensioni di proprietà dei plugin invece che in `src/agents/tools`, per esempio:

- i file runtime delle azioni del plugin Discord
- il file runtime delle azioni del plugin Slack
- il file runtime delle azioni del plugin Telegram
- il file runtime delle azioni del plugin WhatsApp

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
} from "@mariozechner/pi-coding-agent";

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

- `message_start` / `message_end` / `message_update` (testo/pensiero in streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Dopo la configurazione, viene inviato il prompt alla sessione:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L’SDK gestisce l’intero loop dell’agente: invio all’LLM, esecuzione delle chiamate agli strumenti, streaming delle risposte.

L’iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti immagine dal prompt corrente e li passa tramite `images` solo per quel turno. Non riesamina i turni precedenti della cronologia per reiniettare i payload immagine.

## Architettura degli strumenti

### Pipeline degli strumenti

1. **Strumenti di base**: `codingTools` di pi (read, bash, edit, write)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Strumenti OpenClaw**: messaggistica, browser, canvas, sessioni, Cron, Gateway, ecc.
4. **Strumenti di canale**: strumenti di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtro delle policy**: strumenti filtrati in base a profilo, provider, agente, gruppo, policy della sandbox
6. **Normalizzazione degli schemi**: schemi ripuliti per le particolarità di Gemini/OpenAI
7. **Wrapping di AbortSignal**: strumenti avvolti per rispettare i segnali di interruzione

### Adapter della definizione degli strumenti

`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L’adapter in `pi-tool-definition-adapter.ts` collega le due interfacce:

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

### Strategia di separazione degli strumenti

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

Il prompt di sistema viene creato in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Strumentazione, Stile delle chiamate agli strumenti, guardrail di sicurezza, riferimento CLI di OpenClaw, Skills, documentazione, workspace, sandbox, messaggistica, tag di risposta, voce, risposte silenziose, Heartbeat, metadati di runtime, oltre a memoria e reazioni quando abilitati, e file di contesto opzionali e contenuto extra del prompt di sistema. Le sezioni vengono ridotte per la modalità di prompt minimo usata dai subagent.

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

OpenClaw lo avvolge con `guardSessionManager()` per la sicurezza dei risultati degli strumenti.

### Cache delle sessioni

`session-manager-cache.ts` memorizza nella cache le istanze di SessionManager per evitare parsing ripetuto dei file:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitazione della cronologia

`limitHistoryTurns()` riduce la cronologia della conversazione in base al tipo di canale (DM rispetto a gruppo).

### Compaction

La Compaction automatica si attiva in caso di overflow del contesto. Le firme di overflow comuni includono `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` e `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gestisce la Compaction manuale:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticazione e risoluzione del modello

### Profili di autenticazione

OpenClaw mantiene uno store dei profili di autenticazione con più chiavi API per provider:

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

### Salvaguardia della Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge guardrail alla Compaction, inclusi budgeting adattivo dei token più riepiloghi degli errori degli strumenti e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Riduzione del contesto

`src/agents/pi-hooks/context-pruning.ts` implementa la riduzione del contesto basata su cache-TTL:

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

### Fallback del livello di thinking

Se un livello di thinking non è supportato, viene usato un fallback:

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

- Rimozione della stringa magica di rifiuto
- Validazione dei turni per ruoli consecutivi
- Validazione rigida upstream dei parametri degli strumenti Pi

### Google/Gemini

- Sanitizzazione degli schemi degli strumenti di proprietà del Plugin

### OpenAI

- Strumento `apply_patch` per modelli Codex
- Gestione del downgrade del livello di thinking

## Integrazione TUI

OpenClaw dispone anche di una modalità TUI locale che usa direttamente i componenti pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Questo fornisce l'esperienza interattiva da terminale simile alla modalità nativa di pi.

## Differenze principali rispetto alla CLI Pi

| Aspetto              | CLI Pi                            | OpenClaw Embedded                                                                                  |
| -------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| Invocazione          | comando `pi` / RPC                | SDK tramite `createAgentSession()`                                                                 |
| Strumenti            | Strumenti di coding predefiniti   | Suite di strumenti OpenClaw personalizzata                                                         |
| Prompt di sistema    | AGENTS.md + prompt                | Dinamico per canale/contesto                                                                       |
| Archiviazione sessioni | `~/.pi/agent/sessions/`         | `~/.openclaw/agents/<agentId>/sessions/` (o `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`)      |
| Autenticazione       | Credenziale singola               | Multiprofilo con rotazione                                                                         |
| Estensioni           | Caricate da disco                 | Programmatiche + percorsi su disco                                                                 |
| Gestione eventi      | Rendering TUI                     | Basata su callback (onBlockReply, ecc.)                                                            |

## Considerazioni future

Aree per potenziale rielaborazione:

1. **Allineamento delle firme degli strumenti**: attualmente adattamento tra le firme di pi-agent-core e pi-coding-agent
2. **Wrapping del gestore sessioni**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare il `ResourceLoader` di pi in modo più diretto
4. **Complessità del gestore streaming**: `subscribeEmbeddedPiSession` è diventato grande
5. **Particolarità dei provider**: molti percorsi di codice specifici per provider che pi potrebbe potenzialmente gestire

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (abilitare `OPENCLAW_LIVE_TEST=1`)

Per i comandi di esecuzione correnti, vedere [Workflow di sviluppo Pi](/it/pi-dev).

## Correlati

- [Workflow di sviluppo Pi](/it/pi-dev)
- [Panoramica dell'installazione](/it/install)
