---
read_when:
    - Comprender el diseño de integración del SDK de Pi en OpenClaw
    - Modificar el ciclo de vida de la sesión del agente, las herramientas o el cableado del proveedor para Pi
summary: Arquitectura de la integración del agente Pi integrado de OpenClaw y del ciclo de vida de la sesión
title: Arquitectura de integración de Pi
x-i18n:
    generated_at: "2026-05-11T20:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw se integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) y sus paquetes hermanos (`pi-ai`, `pi-agent-core`, `pi-tui`) para impulsar sus capacidades de agente de IA.

## Descripción general

OpenClaw usa el SDK de pi para incrustar un agente de codificación de IA en su arquitectura de Gateway de mensajería. En lugar de iniciar pi como subproceso o usar el modo RPC, OpenClaw importa e instancia directamente `AgentSession` de pi mediante `createAgentSession()`. Este enfoque incrustado proporciona:

- Control total sobre el ciclo de vida de la sesión y el manejo de eventos
- Inyección de herramientas personalizada (mensajería, sandbox, acciones específicas del canal)
- Personalización del prompt del sistema por canal/contexto
- Persistencia de sesión con compatibilidad para ramificación/Compaction
- Rotación de perfiles de autenticación multicuenta con conmutación por error
- Cambio de modelo independiente del proveedor

## Dependencias de paquetes

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| Paquete           | Propósito                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstracciones LLM principales: `Model`, `streamSimple`, tipos de mensaje, API de proveedor             |
| `pi-agent-core`   | Bucle de agente, ejecución de herramientas, tipos `AgentMessage`                                       |
| `pi-coding-agent` | SDK de alto nivel: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, herramientas integradas |
| `pi-tui`          | Componentes de interfaz de terminal (usados en el modo TUI local de OpenClaw)                          |

## Estructura de archivos

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

Los runtimes de acciones de mensajes específicas del canal ahora viven en los directorios
de extensión propiedad del plugin en lugar de bajo `src/agents/tools`, por ejemplo:

- los archivos de runtime de acciones del plugin de Discord
- el archivo de runtime de acciones del plugin de Slack
- el archivo de runtime de acciones del plugin de Telegram
- el archivo de runtime de acciones del plugin de WhatsApp

## Flujo de integración principal

### 1. Ejecutar un agente incrustado

El punto de entrada principal es `runEmbeddedPiAgent()` en `pi-embedded-runner/run.ts`:

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

### 2. Creación de sesión

Dentro de `runEmbeddedAttempt()` (llamado por `runEmbeddedPiAgent()`), se usa el SDK de pi:

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

### 3. Suscripción a eventos

`subscribeEmbeddedPiSession()` se suscribe a los eventos de `AgentSession` de pi:

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

Los eventos manejados incluyen:

- `message_start` / `message_end` / `message_update` (texto/pensamiento en streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Después de la configuración, se envía el prompt a la sesión:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

El SDK maneja el bucle completo del agente: envío al LLM, ejecución de llamadas a herramientas, streaming de respuestas.

La inyección de imágenes es local al prompt: OpenClaw carga las referencias de imagen del prompt actual y
las pasa mediante `images` solo para ese turno. No vuelve a escanear turnos antiguos del historial
para reinyectar cargas útiles de imagen.

## Arquitectura de herramientas

### Pipeline de herramientas

1. **Herramientas base**: `codingTools` de pi (read, bash, edit, write)
2. **Reemplazos personalizados**: OpenClaw reemplaza bash con `exec`/`process`, personaliza read/edit/write para sandbox
3. **Herramientas de OpenClaw**: mensajería, navegador, canvas, sesiones, Cron, Gateway, etc.
4. **Herramientas de canal**: herramientas de acción específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtrado de políticas**: herramientas filtradas por políticas de perfil, proveedor, agente, grupo y sandbox
6. **Normalización de esquemas**: esquemas limpiados para particularidades de Gemini/OpenAI
7. **Envoltura de AbortSignal**: herramientas envueltas para respetar señales de cancelación

### Adaptador de definición de herramientas

`AgentTool` de pi-agent-core tiene una firma de `execute` distinta de la de `ToolDefinition` de pi-coding-agent. El adaptador en `pi-tool-definition-adapter.ts` conecta ambas:

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

### Estrategia de división de herramientas

`splitSdkTools()` pasa todas las herramientas mediante `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Esto garantiza que el filtrado de políticas, la integración de sandbox y el conjunto de herramientas extendido de OpenClaw sigan siendo coherentes entre proveedores.

## Construcción del prompt del sistema

El prompt del sistema se construye en `buildAgentSystemPrompt()` (`system-prompt.ts`). Ensambla un prompt completo con secciones que incluyen herramientas, estilo de llamadas a herramientas, medidas de seguridad, control de OpenClaw, Skills, documentación, espacio de trabajo, sandbox, mensajería, directivas de salida del asistente, voz, respuestas silenciosas, Heartbeats, metadatos de runtime, además de memoria y reacciones cuando están habilitadas, y archivos de contexto opcionales y contenido adicional del prompt del sistema. Las secciones se recortan para el modo de prompt mínimo usado por subagentes.

El prompt se aplica después de crear la sesión mediante `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestión de sesiones

### Archivos de sesión

Las sesiones son archivos JSONL con estructura de árbol (enlace id/parentId). El `SessionManager` de Pi gestiona la persistencia:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo envuelve con `guardSessionManager()` para la seguridad de los resultados de herramientas.

### Caché de sesiones

`session-manager-cache.ts` almacena en caché instancias de SessionManager para evitar el análisis repetido de archivos:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitación del historial

`limitHistoryTurns()` recorta el historial de conversación según el tipo de canal (DM frente a grupo).

### Compaction

La compactación automática se activa cuando se desborda el contexto. Las firmas comunes de desbordamiento incluyen `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` y `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gestiona la compactación manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticación y resolución de modelos

### Perfiles de autenticación

OpenClaw mantiene un almacén de perfiles de autenticación con varias claves de API por proveedor:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Los perfiles rotan ante fallos con seguimiento de tiempo de espera:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolución de modelos

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

### Conmutación por error

`FailoverError` activa el modelo de respaldo cuando está configurado:

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

## Extensiones de Pi

OpenClaw carga extensiones personalizadas de Pi para comportamiento especializado:

### Salvaguarda de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` añade medidas de seguridad a la compactación, incluido presupuesto adaptativo de tokens más resúmenes de fallos de herramientas y operaciones de archivos:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto basada en TTL de caché:

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

## Streaming y respuestas en bloques

### Fragmentación en bloques

`EmbeddedBlockChunker` gestiona el texto en streaming en bloques de respuesta discretos:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Eliminación de etiquetas Thinking/Final

La salida de streaming se procesa para eliminar bloques `<think>`/`<thinking>` y extraer contenido de `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Directivas de respuesta

Las directivas de respuesta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` se analizan y extraen:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Manejo de errores

### Clasificación de errores

`pi-embedded-helpers.ts` clasifica errores para su manejo adecuado:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Respaldo del nivel de razonamiento

Si un nivel de razonamiento no es compatible, se usa un respaldo:

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

## Integración de sandbox

Cuando el modo sandbox está habilitado, las herramientas y rutas quedan restringidas:

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

## Manejo específico de proveedores

### Anthropic

- Limpieza de cadena mágica de rechazo
- Validación de turnos para roles consecutivos
- Validación estricta de parámetros de herramientas de Pi upstream

### Google/Gemini

- Saneamiento del esquema de herramientas propiedad del Plugin

### OpenAI

- Herramienta `apply_patch` para modelos Codex
- Manejo de reducción de nivel de razonamiento

## Integración con TUI

OpenClaw también tiene un modo TUI local que usa componentes pi-tui directamente:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

Esto proporciona la experiencia interactiva de terminal similar al modo nativo de Pi.

## Diferencias clave con Pi CLI

| Aspecto          | Pi CLI                  | OpenClaw integrado                                                                               |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocación      | comando `pi` / RPC      | SDK mediante `createAgentSession()`                                                            |
| Herramientas    | Herramientas de codificación predeterminadas | Conjunto personalizado de herramientas de OpenClaw                                             |
| Prompt del sistema | AGENTS.md + prompts     | Dinámico por canal/contexto                                                                      |
| Almacenamiento de sesión | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (o `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticación   | Credencial única        | Varios perfiles con rotación                                                                     |
| Extensiones     | Cargadas desde disco    | Programáticas + rutas de disco                                                                   |
| Manejo de eventos | Renderizado de TUI      | Basado en callbacks (onBlockReply, etc.)                                                         |

## Consideraciones futuras

Áreas de posible reelaboración:

1. **Alineación de firmas de herramientas**: actualmente se adapta entre firmas de pi-agent-core y pi-coding-agent
2. **Envoltura del gestor de sesiones**: `guardSessionManager` añade seguridad, pero aumenta la complejidad
3. **Carga de extensiones**: podría usar el `ResourceLoader` de Pi de forma más directa
4. **Complejidad del manejador de streaming**: `subscribeEmbeddedPiSession` ha crecido mucho
5. **Particularidades de proveedores**: muchas rutas de código específicas de proveedores que Pi podría gestionar potencialmente

## Pruebas

La cobertura de integración de Pi abarca estos conjuntos:

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

En vivo/con suscripción explícita:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilitar `OPENCLAW_LIVE_TEST=1`)

Para comandos de ejecución actuales, consulta [Flujo de desarrollo de Pi](/es/pi-dev).

## Relacionado

- [Flujo de desarrollo de Pi](/es/pi-dev)
- [Resumen de instalación](/es/install)
