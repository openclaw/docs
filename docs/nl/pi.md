---
read_when:
    - Inzicht in het integratieontwerp van de Pi SDK in OpenClaw
    - Levenscyclus van agentsessies, hulpprogramma's of providerkoppeling voor Pi wijzigen
summary: Architectuur van de ingebedde Pi-agentintegratie en sessielevenscyclus van OpenClaw
title: Pi-integratiearchitectuur
x-i18n:
    generated_at: "2026-04-29T22:57:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw integreert met [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) en de bijbehorende pakketten (`pi-ai`, `pi-agent-core`, `pi-tui`) om zijn mogelijkheden voor AI-agents aan te sturen.

## Overzicht

OpenClaw gebruikt de pi-SDK om een AI-codeeragent in zijn messaging-Gateway-architectuur in te bedden. In plaats van pi als subproces te starten of de RPC-modus te gebruiken, importeert en instantieert OpenClaw rechtstreeks pi's `AgentSession` via `createAgentSession()`. Deze ingebedde aanpak biedt:

- Volledige controle over sessielevenscyclus en eventafhandeling
- Aangepaste toolinjectie (messaging, sandbox, kanaalspecifieke acties)
- Aanpassing van systeemprompt per kanaal/context
- Sessiepersistentie met ondersteuning voor vertakking/Compaction
- Rotatie van authenticatieprofielen voor meerdere accounts met failover
- Provider-agnostisch wisselen van model

## Pakketafhankelijkheden

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pakket            | Doel                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Kernabstracties voor LLM's: `Model`, `streamSimple`, berichttypen, provider-API's                      |
| `pi-agent-core`   | Agentlus, tooluitvoering, `AgentMessage`-typen                                                         |
| `pi-coding-agent` | SDK op hoog niveau: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ingebouwde tools |
| `pi-tui`          | Terminal-UI-componenten (gebruikt in OpenClaw's lokale TUI-modus)                                      |

## Bestandsstructuur

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

Kanaalspecifieke runtimes voor berichtacties bevinden zich nu in de Plugin-eigen extensiemappen in plaats van onder `src/agents/tools`, bijvoorbeeld:

- de runtimebestanden voor Discord-Plugin-acties
- het runtimebestand voor Slack-Plugin-acties
- het runtimebestand voor Telegram-Plugin-acties
- het runtimebestand voor WhatsApp-Plugin-acties

## Kernintegratiestroom

### 1. Een ingebedde agent uitvoeren

Het belangrijkste entrypoint is `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

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

### 2. Sessie maken

Binnen `runEmbeddedAttempt()` (aangeroepen door `runEmbeddedPiAgent()`) wordt de pi-SDK gebruikt:

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

### 3. Abonneren op events

`subscribeEmbeddedPiSession()` abonneert zich op pi's `AgentSession`-events:

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

Afgehandelde events omvatten:

- `message_start` / `message_end` / `message_update` (streaming tekst/denken)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompten

Na de setup wordt de sessie geprompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

De SDK handelt de volledige agentlus af: verzenden naar de LLM, toolcalls uitvoeren, responses streamen.

Afbeeldingsinjectie is promptlokaal: OpenClaw laadt afbeeldingsreferenties uit de huidige prompt en geeft ze alleen voor die beurt door via `images`. Het scant oudere geschiedenisbeurten niet opnieuw om afbeeldingspayloads opnieuw te injecteren.

## Toolarchitectuur

### Toolpipeline

1. **Basistools**: pi's `codingTools` (read, bash, edit, write)
2. **Aangepaste vervangingen**: OpenClaw vervangt bash door `exec`/`process`, past read/edit/write aan voor sandbox
3. **OpenClaw-tools**: messaging, browser, canvas, sessies, Cron, Gateway, enz.
4. **Kanaaltools**: Discord/Telegram/Slack/WhatsApp-specifieke actietools
5. **Beleidsfiltering**: tools gefilterd op profiel, provider, agent, groep, sandboxbeleid
6. **Schemanormalisatie**: schema's opgeschoond voor Gemini/OpenAI-eigenaardigheden
7. **AbortSignal-wrapping**: tools gewrapt om abortsignalen te respecteren

### Adapter voor tooldefinities

`AgentTool` van pi-agent-core heeft een andere `execute`-signatuur dan `ToolDefinition` van pi-coding-agent. De adapter in `pi-tool-definition-adapter.ts` overbrugt dit:

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

### Strategie voor toolsplitsing

`splitSdkTools()` geeft alle tools door via `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dit zorgt ervoor dat OpenClaw's beleidsfiltering, sandboxintegratie en uitgebreide toolset consistent blijven tussen providers.

## Systeempromptconstructie

De systeemprompt wordt opgebouwd in `buildAgentSystemPrompt()` (`system-prompt.ts`). Deze stelt een volledige prompt samen met secties zoals Tooling, Tool Call Style, Safety guardrails, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata, plus Memory en Reactions wanneer ingeschakeld, en optionele contextbestanden en extra systeempromptinhoud. Secties worden ingekort voor de minimale promptmodus die door subagents wordt gebruikt.

De prompt wordt na het aanmaken van de sessie toegepast via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sessiebeheer

### Sessiebestanden

Sessies zijn JSONL-bestanden met een boomstructuur (koppeling via id/parentId). Pi's `SessionManager` verwerkt persistentie:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw omhult dit met `guardSessionManager()` voor veiligheid van toolresultaten.

### Sessiecaching

`session-manager-cache.ts` cachet SessionManager-instanties om herhaald parsen van bestanden te vermijden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geschiedenis beperken

`limitHistoryTurns()` kort de gespreksgeschiedenis in op basis van kanaaltype (DM versus groep).

### Compaction

Automatische Compaction wordt geactiveerd bij contextoverloop. Veelvoorkomende overloopsignaturen
zijn onder andere `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` en `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` verwerkt handmatige
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authenticatie en modelresolutie

### Auth-profielen

OpenClaw onderhoudt een opslag voor auth-profielen met meerdere API-sleutels per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profielen roteren bij fouten met cooldowntracking:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Modelresolutie

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

`FailoverError` activeert terugval naar een ander model wanneer dit is geconfigureerd:

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

## Pi-extensies

OpenClaw laadt aangepaste Pi-extensies voor gespecialiseerd gedrag:

### Compaction-beveiliging

`src/agents/pi-hooks/compaction-safeguard.ts` voegt guardrails toe aan Compaction, waaronder adaptieve tokenbudgettering plus samenvattingen van toolfouten en bestandsbewerkingen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Contextopschoning

`src/agents/pi-hooks/context-pruning.ts` implementeert contextopschoning op basis van cache-TTL:

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

## Streaming en blokantwoorden

### Blokchunking

`EmbeddedBlockChunker` beheert het streamen van tekst naar afzonderlijke antwoordblokken:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Denken-/Final-tagverwijdering

Streaminguitvoer wordt verwerkt om `<think>`/`<thinking>`-blokken te verwijderen en `<final>`-inhoud te extraheren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Antwoorddirectieven

Antwoorddirectieven zoals `[[media:url]]`, `[[voice]]`, `[[reply:id]]` worden geparseerd en geëxtraheerd:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Foutafhandeling

### Foutclassificatie

`pi-embedded-helpers.ts` classificeert fouten voor passende afhandeling:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Terugval voor denkniveau

Als een denkniveau niet wordt ondersteund, wordt erop teruggevallen:

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

## Sandboxintegratie

Wanneer sandboxmodus is ingeschakeld, worden tools en paden beperkt:

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

## Provider-specifieke afhandeling

### Anthropic

- Opschonen van magische weigeringsstrings
- Beurtvalidatie voor opeenvolgende rollen
- Strikte upstream Pi-validatie van toolparameters

### Google/Gemini

- Door Plugin beheerde sanering van toolschema's

### OpenAI

- `apply_patch`-tool voor Codex-modellen
- Afhandeling van downgrade van denkniveau

## TUI-integratie

OpenClaw heeft ook een lokale TUI-modus die pi-tui-componenten rechtstreeks gebruikt:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dit biedt de interactieve terminalervaring die lijkt op Pi's native modus.

## Belangrijkste verschillen met Pi CLI

| Aspect          | Pi CLI                  | Ingebedde OpenClaw                                                                            |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Aanroep         | `pi`-opdracht / RPC     | SDK via `createAgentSession()`                                                                 |
| Tools           | Standaard codingtools   | Aangepaste OpenClaw-toolset                                                                    |
| Systeemprompt   | AGENTS.md + prompts     | Dynamisch per kanaal/context                                                                   |
| Sessieopslag    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (of `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Eén credential          | Meerdere profielen met rotatie                                                                 |
| Extensies       | Geladen vanaf schijf    | Programmatisch + schijfpaden                                                                   |
| Eventafhandeling | TUI-rendering          | Callback-gebaseerd (onBlockReply, enz.)                                                        |

## Toekomstige overwegingen

Gebieden voor mogelijke herwerking:

1. **Afstemming van toolsignatures**: Momenteel wordt aangepast tussen pi-agent-core- en pi-coding-agent-signatures
2. **Omhullen van sessiemanager**: `guardSessionManager` voegt veiligheid toe, maar verhoogt de complexiteit
3. **Laden van extensies**: Zou Pi's `ResourceLoader` directer kunnen gebruiken
4. **Complexiteit van streaminghandler**: `subscribeEmbeddedPiSession` is groot geworden
5. **Provider-eigenaardigheden**: Veel provider-specifieke codepaden die Pi mogelijk zou kunnen afhandelen

## Tests

Pi-integratiedekking omvat deze suites:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (schakel `OPENCLAW_LIVE_TEST=1` in)

Zie [Pi-ontwikkelworkflow](/nl/pi-dev) voor actuele uitvoeropdrachten.

## Gerelateerd

- [Pi-ontwikkelworkflow](/nl/pi-dev)
- [Installatieoverzicht](/nl/install)
