---
read_when:
    - Comprendere la progettazione dell'integrazione dell'SDK Pi in OpenClaw
    - Modificare il ciclo di vita della sessione dell'agente, gli strumenti o il collegamento dei provider per Pi
summary: Architettura dell'integrazione dell'agente Pi incorporato di OpenClaw e ciclo di vita della sessione
title: Architettura dell'integrazione Pi
x-i18n:
    generated_at: "2026-04-05T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 596de5fbb1430008698079f211db200e02ca8485547550fd81571a459c4c83c7
    source_path: pi.md
    workflow: 15
---

# Architettura dell'integrazione Pi

Questo documento descrive come OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e i suoi pacchetti correlati (`pi-ai`, `pi-agent-core`, `pi-tui`) per fornire le sue capacità di agente AI.

## Panoramica

OpenClaw usa l'SDK pi per incorporare un agente di coding AI nella propria architettura di gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato offre:

- Controllo completo sul ciclo di vita della sessione e sulla gestione degli eventi
- Iniezione di strumenti personalizzati (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del prompt di sistema per canale/contesto
- Persistenza della sessione con supporto per branching/compaction
- Rotazione multi-account dei profili di autenticazione con failover
- Cambio di modello indipendente dal provider

## Dipendenze dei pacchetti

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Pacchetto        | Scopo                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | Astrazioni LLM di base: `Model`, `streamSimple`, tipi di messaggio, API provider                      |
| `pi-agent-core`  | Loop dell'agente, esecuzione degli strumenti, tipi `AgentMessage`                                     |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, strumenti built-in |
| `pi-tui`         | Componenti UI terminale (usati nella modalità TUI locale di OpenClaw)                                 |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Riesporta da pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Punto di ingresso principale: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logica di un singolo tentativo con configurazione della sessione
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Costruisce i payload di risposta dai risultati dell'esecuzione
│   │   ├── images.ts              # Iniezione immagini del vision model
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Rilevamento degli errori di interruzione
│   ├── cache-ttl.ts               # Tracciamento del TTL della cache per il pruning del contesto
│   ├── compact.ts                 # Logica di compattazione manuale/automatica
│   ├── extensions.ts              # Carica estensioni pi per esecuzioni incorporate
│   ├── extra-params.ts            # Parametri stream specifici del provider
│   ├── google.ts                  # Correzioni dell'ordinamento dei turni Google/Gemini
│   ├── history.ts                 # Limite della cronologia (DM vs gruppo)
│   ├── lanes.ts                   # Corsie di comando della sessione/globali
│   ├── logger.ts                  # Logger del sottosistema
│   ├── model.ts                   # Risoluzione del modello tramite ModelRegistry
│   ├── runs.ts                    # Tracciamento delle esecuzioni attive, interruzione, coda
│   ├── sandbox-info.ts            # Informazioni sandbox per il prompt di sistema
│   ├── session-manager-cache.ts   # Caching delle istanze SessionManager
│   ├── session-manager-init.ts    # Inizializzazione dei file di sessione
│   ├── system-prompt.ts           # Builder del prompt di sistema
│   ├── tool-split.ts              # Divide gli strumenti in builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappatura ThinkLevel, descrizione errori
├── pi-embedded-subscribe.ts       # Sottoscrizione/dispatch degli eventi di sessione
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory degli handler di eventi
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking delle risposte a blocchi in streaming
├── pi-embedded-messaging.ts       # Tracciamento degli invii dello strumento di messaggistica
├── pi-embedded-helpers.ts         # Classificazione degli errori, convalida del turno
├── pi-embedded-helpers/           # Moduli helper
├── pi-embedded-utils.ts           # Utilità di formattazione
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping AbortSignal per gli strumenti
├── pi-tools.policy.ts             # Criterio allowlist/denylist degli strumenti
├── pi-tools.read.ts               # Personalizzazioni dello strumento read
├── pi-tools.schema.ts             # Normalizzazione dello schema degli strumenti
├── pi-tools.types.ts              # Alias di tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adattatore AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override delle impostazioni
├── pi-hooks/                      # Hook pi personalizzati
│   ├── compaction-safeguard.ts    # Estensione safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Estensione di pruning del contesto basata su cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Risoluzione del profilo auth
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
├── tool-summaries.ts              # Riepiloghi descrittivi degli strumenti
├── tool-policy.ts                 # Risoluzione del criterio degli strumenti
├── transcript-policy.ts           # Criterio di convalida della trascrizione
├── skills.ts                      # Snapshot/prompt building delle Skills
├── skills/                        # Sottosistema Skills
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

I runtime delle azioni di messaggio specifiche del canale ora si trovano nelle directory extension possedute dal plugin
anziché sotto `src/agents/tools`, ad esempio:

- i file del runtime delle azioni del plugin Discord
- il file del runtime delle azioni del plugin Slack
- il file del runtime delle azioni del plugin Telegram
- il file del runtime delle azioni del plugin WhatsApp

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

All'interno di `runEmbeddedAttempt()` (chiamato da `runEmbeddedPiAgent()`), viene usato l'SDK pi:

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

- `message_start` / `message_end` / `message_update` (streaming di testo/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Dopo la configurazione, viene inviato il prompt alla sessione:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L'SDK gestisce il loop completo dell'agente: invio all'LLM, esecuzione delle chiamate agli strumenti, streaming delle risposte.

L'iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti immagine dal prompt corrente e
li passa tramite `images` solo per quel turno. Non riesegue la scansione dei turni più vecchi della cronologia
per reiniettare i payload immagine.

## Architettura degli strumenti

### Pipeline degli strumenti

1. **Strumenti di base**: `codingTools` di pi (read, bash, edit, write)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Strumenti OpenClaw**: messaggistica, browser, canvas, sessions, cron, gateway, ecc.
4. **Strumenti del canale**: strumenti di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtraggio tramite criterio**: strumenti filtrati per profilo, provider, agente, gruppo, criteri sandbox
6. **Normalizzazione dello schema**: schemi ripuliti per le particolarità di Gemini/OpenAI
7. **Wrapping AbortSignal**: strumenti wrappati per rispettare gli abort signal

### Adattatore della definizione degli strumenti

L'`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L'adattatore in `pi-tool-definition-adapter.ts` fa da ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // La firma di pi-coding-agent differisce da pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategia di suddivisione degli strumenti

`splitSdkTools()` passa tutti gli strumenti tramite `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vuoto. Sovrascriviamo tutto
    customTools: toToolDefinitions(options.tools),
  };
}
```

Questo garantisce che il filtraggio tramite criterio di OpenClaw, l'integrazione sandbox e il set di strumenti esteso restino coerenti tra i provider.

## Costruzione del prompt di sistema

Il prompt di sistema viene costruito in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Tooling, Tool Call Style, guardrail di sicurezza, riferimento CLI di OpenClaw, Skills, documentazione, workspace, sandbox, messaggistica, Reply Tags, voce, risposte silenziose, heartbeat, metadati runtime, più Memory e Reactions quando abilitati, oltre a eventuali file di contesto e contenuto extra del prompt di sistema. Le sezioni vengono ridotte per la modalità prompt minimale usata dai subagent.

Il prompt viene applicato dopo la creazione della sessione tramite `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestione della sessione

### File di sessione

Le sessioni sono file JSONL con struttura ad albero (collegamento id/parentId). `SessionManager` di Pi gestisce la persistenza:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo avvolge con `guardSessionManager()` per la sicurezza dei risultati degli strumenti.

### Caching della sessione

`session-manager-cache.ts` mette in cache le istanze `SessionManager` per evitare parsing ripetuti dei file:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitazione della cronologia

`limitHistoryTurns()` riduce la cronologia della conversazione in base al tipo di canale (DM vs gruppo).

### Compattazione

La compattazione automatica si attiva in caso di overflow del contesto. Le firme comuni di overflow
includono `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gestisce la
compattazione manuale:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticazione e risoluzione del modello

### Profili di autenticazione

OpenClaw mantiene un archivio di profili auth con più API key per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

I profili ruotano in caso di errore con tracciamento del cooldown:

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

// Usa ModelRegistry e AuthStorage di pi
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

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge guardrail alla compattazione, inclusi budgeting adattivo dei token più riepiloghi dei fallimenti degli strumenti e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` implementa il pruning del contesto basato su cache-TTL:

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

### Block Chunking

`EmbeddedBlockChunker` gestisce il testo in streaming trasformandolo in blocchi di risposta discreti:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Rimozione dei tag Thinking/Final

L'output in streaming viene elaborato per rimuovere i blocchi `<think>`/`<thinking>` ed estrarre il contenuto `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Rimuove il contenuto <think>...</think>
  // Se enforceFinalTag, restituisce solo il contenuto <final>...</final>
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
isContextOverflowError(errorText)     // Contesto troppo grande
isCompactionFailureError(errorText)   // Compattazione non riuscita
isAuthAssistantError(lastAssistant)   // Errore di autenticazione
isRateLimitAssistantError(...)        // Limite di frequenza raggiunto
isFailoverAssistantError(...)         // Deve eseguire failover
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

## Integrazione della sandbox

Quando la modalità sandbox è abilitata, strumenti e percorsi vengono limitati:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa strumenti read/edit/write sandboxed
  // Exec viene eseguito nel contenitore
  // Browser usa l'URL bridge
}
```

## Gestione specifica per provider

### Anthropic

- Rimozione della magic string di rifiuto
- Convalida del turno per ruoli consecutivi
- Compatibilità dei parametri Claude Code

### Google/Gemini

- Sanitizzazione dello schema degli strumenti posseduti dal plugin

### OpenAI

- Strumento `apply_patch` per i modelli Codex
- Gestione del downgrade del livello di thinking

## Integrazione TUI

OpenClaw ha anche una modalità TUI locale che usa direttamente i componenti pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Questo fornisce l'esperienza terminale interattiva simile alla modalità nativa di pi.

## Differenze principali rispetto alla CLI di Pi

| Aspetto         | CLI di Pi               | OpenClaw incorporato                                                                             |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Invocazione     | comando `pi` / RPC      | SDK tramite `createAgentSession()`                                                               |
| Strumenti       | Strumenti di coding predefiniti | Suite di strumenti OpenClaw personalizzata                                                 |
| Prompt di sistema | AGENTS.md + prompt    | Dinamico per canale/contesto                                                                     |
| Archiviazione sessione | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oppure `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credenziale singola     | Multi-profile con rotazione                                                                      |
| Estensioni      | Caricate da disco       | Percorsi programmatici + su disco                                                                |
| Gestione eventi | Rendering TUI           | Basata su callback (`onBlockReply`, ecc.)                                                        |

## Considerazioni future

Aree di possibile rielaborazione:

1. **Allineamento della firma degli strumenti**: attualmente vengono adattate le firme tra pi-agent-core e pi-coding-agent
2. **Wrapping del session manager**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare più direttamente `ResourceLoader` di pi
4. **Complessità dell'handler di streaming**: `subscribeEmbeddedPiSession` è diventato grande
5. **Particolarità dei provider**: molti percorsi di codice specifici per provider che pi potrebbe potenzialmente gestire

## Test

La copertura dell'integrazione Pi si estende a queste suite:

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

Per i comandi di esecuzione correnti, vedi [Workflow di sviluppo Pi](/pi-dev).
