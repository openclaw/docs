---
read_when:
    - Comprendere il design dell'integrazione dell'SDK di Pi in OpenClaw
    - Modifica del ciclo di vita della sessione dell'agente, degli strumenti o del collegamento del provider per Pi
summary: Architettura dell'integrazione dell'agente Pi incorporato di OpenClaw e ciclo di vita della sessione
title: Architettura dell'integrazione di Pi
x-i18n:
    generated_at: "2026-04-24T15:23:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Questo documento descrive come OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e con i pacchetti correlati (`pi-ai`, `pi-agent-core`, `pi-tui`) per alimentare le proprie funzionalità di agente AI.

## Panoramica

OpenClaw usa l'SDK di pi per incorporare un agente di coding AI nella propria architettura di Gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato fornisce:

- Controllo completo del ciclo di vita della sessione e della gestione degli eventi
- Iniezione personalizzata degli strumenti (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del prompt di sistema per canale/contesto
- Persistenza della sessione con supporto per branching/Compaction
- Rotazione di più profili di autenticazione account con failover
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
| `pi-ai`           | Astrazioni LLM di base: `Model`, `streamSimple`, tipi di messaggio, API del provider                  |
| `pi-agent-core`   | Loop dell'agente, esecuzione degli strumenti, tipi `AgentMessage`                                      |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, strumenti incorporati |
| `pi-tui`          | Componenti UI del terminale (usati nella modalità TUI locale di OpenClaw)                              |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export da pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Punto di ingresso principale: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logica di un singolo tentativo con configurazione della sessione
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Costruzione dei payload di risposta dai risultati dell'esecuzione
│   │   ├── images.ts              # Iniezione immagini del modello di visione
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Rilevamento degli errori di interruzione
│   ├── cache-ttl.ts               # Tracciamento del TTL della cache per il pruning del contesto
│   ├── compact.ts                 # Logica di Compaction manuale/automatica
│   ├── extensions.ts              # Caricamento delle estensioni pi per le esecuzioni incorporate
│   ├── extra-params.ts            # Parametri di stream specifici del provider
│   ├── google.ts                  # Correzioni dell'ordinamento dei turni per Google/Gemini
│   ├── history.ts                 # Limitazione della cronologia (DM vs gruppo)
│   ├── lanes.ts                   # Corsie di comando sessione/globali
│   ├── logger.ts                  # Logger del sottosistema
│   ├── model.ts                   # Risoluzione del modello tramite ModelRegistry
│   ├── runs.ts                    # Tracciamento delle esecuzioni attive, interruzione, coda
│   ├── sandbox-info.ts            # Informazioni sulla sandbox per il prompt di sistema
│   ├── session-manager-cache.ts   # Cache delle istanze di SessionManager
│   ├── session-manager-init.ts    # Inizializzazione del file di sessione
│   ├── system-prompt.ts           # Costruttore del prompt di sistema
│   ├── tool-split.ts              # Suddivisione degli strumenti in builtIn e custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappatura di ThinkLevel, descrizione degli errori
├── pi-embedded-subscribe.ts       # Sottoscrizione/instradamento degli eventi della sessione
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory dei gestori di eventi
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Suddivisione in chunk delle risposte a blocchi in streaming
├── pi-embedded-messaging.ts       # Tracciamento degli invii dello strumento di messaggistica
├── pi-embedded-helpers.ts         # Classificazione degli errori, validazione dei turni
├── pi-embedded-helpers/           # Moduli di supporto
├── pi-embedded-utils.ts           # Utilità di formattazione
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping di AbortSignal per gli strumenti
├── pi-tools.policy.ts             # Policy di allowlist/denylist degli strumenti
├── pi-tools.read.ts               # Personalizzazioni dello strumento di lettura
├── pi-tools.schema.ts             # Normalizzazione dello schema degli strumenti
├── pi-tools.types.ts              # Alias di tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adattatore AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override delle impostazioni
├── pi-hooks/                      # Hook pi personalizzati
│   ├── compaction-safeguard.ts    # Estensione di salvaguardia
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Estensione di pruning del contesto Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Risoluzione del profilo di autenticazione
├── auth-profiles.ts               # Archivio dei profili, cooldown, failover
├── model-selection.ts             # Risoluzione del modello predefinito
├── models-config.ts               # Generazione di models.json
├── model-catalog.ts               # Cache del catalogo dei modelli
├── context-window-guard.ts        # Validazione della finestra di contesto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Risoluzione dei parametri del prompt di sistema
├── system-prompt-report.ts        # Generazione del report di debug
├── tool-summaries.ts              # Riepiloghi della descrizione degli strumenti
├── tool-policy.ts                 # Risoluzione della policy degli strumenti
├── transcript-policy.ts           # Policy di validazione della trascrizione
├── skills.ts                      # Snapshot delle Skills/costruzione del prompt
├── skills/                        # Sottosistema Skills
├── sandbox.ts                     # Risoluzione del contesto della sandbox
├── sandbox/                       # Sottosistema sandbox
├── channel-tools.ts               # Iniezione degli strumenti specifici del canale
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

I runtime delle azioni di messaggio specifiche del canale ora si trovano nelle directory di estensione possedute dal Plugin invece che sotto `src/agents/tools`, per esempio:

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

All'interno di `runEmbeddedAttempt()` (chiamato da `runEmbeddedPiAgent()`), viene usato l'SDK di pi:

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

`subscribeEmbeddedPiSession()` si sottoscrive agli eventi di `AgentSession` di pi:

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

- `message_start` / `message_end` / `message_update` (testo/thinking in streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Dopo la configurazione, il prompt viene inviato alla sessione:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L'SDK gestisce il loop completo dell'agente: invio all'LLM, esecuzione delle chiamate agli strumenti, streaming delle risposte.

L'iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti alle immagini dal prompt corrente e li passa tramite `images` solo per quel turno. Non esegue nuovamente la scansione dei turni di cronologia precedenti per re-iniettare i payload delle immagini.

## Architettura degli strumenti

### Pipeline degli strumenti

1. **Strumenti di base**: `codingTools` di pi (`read`, `bash`, `edit`, `write`)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Strumenti OpenClaw**: messaggistica, browser, canvas, sessioni, Cron, Gateway, ecc.
4. **Strumenti del canale**: strumenti di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtraggio tramite policy**: strumenti filtrati in base a policy di profilo, provider, agente, gruppo e sandbox
6. **Normalizzazione dello schema**: gli schemi vengono ripuliti per le particolarità di Gemini/OpenAI
7. **Wrapping di AbortSignal**: gli strumenti vengono wrappati per rispettare i segnali di interruzione

### Adattatore di definizione degli strumenti

`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L'adattatore in `pi-tool-definition-adapter.ts` colma questa differenza:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // la firma di pi-coding-agent differisce da quella di pi-agent-core
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
    builtInTools: [], // Vuoto. Sostituiamo tutto
    customTools: toToolDefinitions(options.tools),
  };
}
```

Questo garantisce che il filtraggio tramite policy di OpenClaw, l'integrazione con la sandbox e il set di strumenti esteso rimangano coerenti tra i vari provider.

## Costruzione del prompt di sistema

Il prompt di sistema viene costruito in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Tooling, stile delle chiamate agli strumenti, guardrail di sicurezza, riferimento alla CLI di OpenClaw, Skills, documentazione, workspace, sandbox, messaggistica, tag di risposta, voce, risposte silenziose, Heartbeat, metadati di runtime, oltre a Memory e Reactions quando abilitati, e file di contesto opzionali e contenuto aggiuntivo del prompt di sistema. Le sezioni vengono ridotte per la modalità prompt minima usata dai sottoagenti.

Il prompt viene applicato dopo la creazione della sessione tramite `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestione della sessione

### File di sessione

Le sessioni sono file JSONL con struttura ad albero (collegamento tramite id/parentId). `SessionManager` di Pi gestisce la persistenza:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo incapsula con `guardSessionManager()` per la sicurezza dei risultati degli strumenti.

### Cache della sessione

`session-manager-cache.ts` mantiene in cache le istanze di SessionManager per evitare il parsing ripetuto dei file:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitazione della cronologia

`limitHistoryTurns()` riduce la cronologia della conversazione in base al tipo di canale (DM vs gruppo).

### Compaction

La Compaction automatica si attiva in caso di overflow del contesto. Le firme comuni di overflow includono `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` e `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gestisce la Compaction manuale:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticazione e risoluzione del modello

### Profili di autenticazione

OpenClaw mantiene un archivio di profili di autenticazione con più chiavi API per provider:

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

// Usa ModelRegistry e AuthStorage di Pi
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

OpenClaw carica estensioni Pi personalizzate per comportamenti specializzati:

### Salvaguardia della Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge guardrail alla Compaction, inclusi budgeting adattivo dei token più riepiloghi degli errori degli strumenti e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning del contesto

`src/agents/pi-hooks/context-pruning.ts` implementa il pruning del contesto basato su Cache-TTL:

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

`EmbeddedBlockChunker` gestisce lo streaming del testo in blocchi di risposta discreti:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Rimozione dei tag thinking/final

L'output in streaming viene elaborato per rimuovere i blocchi `<think>`/`<thinking>` ed estrarre il contenuto di `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Rimuove il contenuto <think>...</think>
  // Se enforceFinalTag è attivo, restituisce solo il contenuto <final>...</final>
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
isCompactionFailureError(errorText)   // Compaction non riuscita
isAuthAssistantError(lastAssistant)   // Errore di autenticazione
isRateLimitAssistantError(...)        // Rate limit raggiunto
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

## Integrazione con la sandbox

Quando la modalità sandbox è abilitata, gli strumenti e i percorsi sono vincolati:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa strumenti read/edit/write in sandbox
  // Exec viene eseguito nel container
  // Browser usa l'URL bridge
}
```

## Gestione specifica del provider

### Anthropic

- Rimozione della stringa magica di rifiuto
- Validazione dei turni per ruoli consecutivi
- Validazione rigorosa a monte dei parametri degli strumenti di Pi

### Google/Gemini

- Sanificazione dello schema degli strumenti posseduti dal Plugin

### OpenAI

- Strumento `apply_patch` per i modelli Codex
- Gestione del downgrade del livello di thinking

## Integrazione TUI

OpenClaw dispone anche di una modalità TUI locale che usa direttamente i componenti di pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Questo fornisce l'esperienza di terminale interattivo simile alla modalità nativa di pi.

## Differenze principali rispetto alla CLI di Pi

| Aspetto         | CLI di Pi               | OpenClaw incorporato                                                                            |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Invocazione     | comando `pi` / RPC      | SDK tramite `createAgentSession()`                                                              |
| Strumenti       | Strumenti di coding predefiniti | Suite di strumenti OpenClaw personalizzata                                              |
| Prompt di sistema | AGENTS.md + prompt    | Dinamico per canale/contesto                                                                    |
| Archiviazione sessione | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oppure `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credenziale singola     | Multi-profilo con rotazione                                                                     |
| Estensioni      | Caricate dal disco      | Percorsi programmatici + da disco                                                               |
| Gestione eventi | Rendering TUI           | Basata su callback (`onBlockReply`, ecc.)                                                       |

## Considerazioni future

Aree di possibile rielaborazione:

1. **Allineamento della firma degli strumenti**: attualmente viene effettuato un adattamento tra le firme di pi-agent-core e pi-coding-agent
2. **Wrapping del gestore della sessione**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare `ResourceLoader` di pi più direttamente
4. **Complessità del gestore dello streaming**: `subscribeEmbeddedPiSession` è cresciuto molto
5. **Particolarità dei provider**: molti percorsi di codice specifici del provider che pi potrebbe potenzialmente gestire

## Test

La copertura dell'integrazione di Pi include queste suite:

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

Per i comandi di esecuzione correnti, vedere [Flusso di sviluppo di Pi](/it/pi-dev).

## Correlati

- [Flusso di sviluppo di Pi](/it/pi-dev)
- [Panoramica dell'installazione](/it/install)
