---
read_when:
    - Comprender el diseño de integración del SDK de Pi en OpenClaw
    - Modificar el ciclo de vida de las sesiones de agente, las herramientas o la conexión de proveedores para Pi
summary: Arquitectura de la integración del agente Pi integrado de OpenClaw y del ciclo de vida de la sesión
title: Arquitectura de integración de Pi
x-i18n:
    generated_at: "2026-04-30T05:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw se integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) y sus paquetes hermanos (`pi-ai`, `pi-agent-core`, `pi-tui`) para impulsar sus capacidades de agente de IA.

## Descripción general

OpenClaw usa el SDK de pi para insertar un agente de codificación de IA en su arquitectura de Gateway de mensajería. En lugar de iniciar pi como un subproceso o usar el modo RPC, OpenClaw importa e instancia directamente el `AgentSession` de pi mediante `createAgentSession()`. Este enfoque integrado proporciona:

- Control total sobre el ciclo de vida de la sesión y el manejo de eventos
- Inyección de herramientas personalizadas (mensajería, sandbox, acciones específicas del canal)
- Personalización del prompt del sistema por canal/contexto
- Persistencia de sesión con soporte de ramificación/Compaction
- Rotación de perfiles de autenticación multicuenta con conmutación por error
- Cambio de modelo independiente del proveedor

## Dependencias de paquetes

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paquete           | Propósito                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstracciones LLM principales: `Model`, `streamSimple`, tipos de mensaje, API de proveedores           |
| `pi-agent-core`   | Bucle del agente, ejecución de herramientas, tipos `AgentMessage`                                      |
| `pi-coding-agent` | SDK de alto nivel: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, herramientas integradas |
| `pi-tui`          | Componentes de interfaz de terminal (usados en el modo TUI local de OpenClaw)                          |

## Estructura de archivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexportaciones desde pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de un solo intento con configuración de sesión
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construye payloads de respuesta a partir de resultados de ejecución
│   │   ├── images.ts              # Inyección de imágenes en modelos de visión
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detección de errores de aborto
│   ├── cache-ttl.ts               # Seguimiento de TTL de caché para poda de contexto
│   ├── compact.ts                 # Lógica de Compaction manual/automática
│   ├── extensions.ts              # Carga extensiones de pi para ejecuciones integradas
│   ├── extra-params.ts            # Parámetros de stream específicos del proveedor
│   ├── google.ts                  # Correcciones de orden de turnos para Google/Gemini
│   ├── history.ts                 # Limitación de historial (DM frente a grupo)
│   ├── lanes.ts                   # Carriles de comandos de sesión/globales
│   ├── logger.ts                  # Registrador del subsistema
│   ├── model.ts                   # Resolución de modelo mediante ModelRegistry
│   ├── runs.ts                    # Seguimiento de ejecuciones activas, aborto, cola
│   ├── sandbox-info.ts            # Información de sandbox para el prompt del sistema
│   ├── session-manager-cache.ts   # Caché de instancias de SessionManager
│   ├── session-manager-init.ts    # Inicialización de archivo de sesión
│   ├── system-prompt.ts           # Constructor de prompt del sistema
│   ├── tool-split.ts              # Divide herramientas en builtIn frente a custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeo ThinkLevel, descripción de error
├── pi-embedded-subscribe.ts       # Suscripción/despacho de eventos de sesión
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de manejadores de eventos
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # División en fragmentos de respuestas de bloque en streaming
├── pi-embedded-messaging.ts       # Seguimiento de herramientas de mensajería enviadas
├── pi-embedded-helpers.ts         # Clasificación de errores, validación de turnos
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilidades de formato
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Envoltura de AbortSignal para herramientas
├── pi-tools.policy.ts             # Política de allowlist/denylist de herramientas
├── pi-tools.read.ts               # Personalizaciones de la herramienta de lectura
├── pi-tools.schema.ts             # Normalización de esquemas de herramientas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Sobrescrituras de configuración
├── pi-hooks/                      # Hooks personalizados de pi
│   ├── compaction-safeguard.ts    # Extensión de protección
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensión de poda de contexto Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolución de perfil de autenticación
├── auth-profiles.ts               # Almacén de perfiles, enfriamiento, conmutación por error
├── model-selection.ts             # Resolución del modelo predeterminado
├── models-config.ts               # Generación de models.json
├── model-catalog.ts               # Caché de catálogo de modelos
├── context-window-guard.ts        # Validación de ventana de contexto
├── failover-error.ts              # Clase FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolución de parámetros del prompt del sistema
├── system-prompt-report.ts        # Generación de informe de depuración
├── tool-summaries.ts              # Resúmenes de descripciones de herramientas
├── tool-policy.ts                 # Resolución de política de herramientas
├── transcript-policy.ts           # Política de validación de transcripciones
├── skills.ts                      # Creación de instantáneas/prompts de Skills
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolución de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Inyección de herramientas específicas del canal
├── openclaw-tools.ts              # Herramientas específicas de OpenClaw
├── bash-tools.ts                  # Herramientas exec/process
├── apply-patch.ts                 # Herramienta apply_patch (OpenAI)
├── tools/                         # Implementaciones individuales de herramientas
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

Los runtimes de acciones de mensajes específicas del canal ahora viven en los directorios de extensiones propiedad del Plugin en lugar de bajo `src/agents/tools`, por ejemplo:

- los archivos de runtime de acciones del Plugin de Discord
- el archivo de runtime de acciones del Plugin de Slack
- el archivo de runtime de acciones del Plugin de Telegram
- el archivo de runtime de acciones del Plugin de WhatsApp

## Flujo de integración principal

### 1. Ejecutar un agente integrado

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

### 4. Prompts

Después de la configuración, se envía el prompt a la sesión:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

El SDK maneja todo el bucle del agente: envío al LLM, ejecución de llamadas a herramientas, streaming de respuestas.

La inyección de imágenes es local al prompt: OpenClaw carga referencias de imágenes desde el prompt actual y las pasa mediante `images` solo para ese turno. No vuelve a escanear turnos de historial anteriores para reinyectar payloads de imágenes.

## Arquitectura de herramientas

### Pipeline de herramientas

1. **Herramientas base**: `codingTools` de pi (read, bash, edit, write)
2. **Reemplazos personalizados**: OpenClaw reemplaza bash por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Herramientas de OpenClaw**: mensajería, navegador, canvas, sesiones, cron, Gateway, etc.
4. **Herramientas de canal**: herramientas de acción específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtrado de políticas**: herramientas filtradas por perfil, proveedor, agente, grupo, políticas de sandbox
6. **Normalización de esquemas**: esquemas limpiados para peculiaridades de Gemini/OpenAI
7. **Envoltura de AbortSignal**: herramientas envueltas para respetar señales de aborto

### Adaptador de definición de herramientas

El `AgentTool` de pi-agent-core tiene una firma `execute` diferente de `ToolDefinition` de pi-coding-agent. El adaptador en `pi-tool-definition-adapter.ts` conecta ambos:

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

Esto garantiza que el filtrado de políticas de OpenClaw, la integración con sandbox y el conjunto de herramientas ampliado sigan siendo consistentes entre proveedores.

## Construcción del prompt del sistema

El prompt del sistema se construye en `buildAgentSystemPrompt()` (`system-prompt.ts`). Ensambla un prompt completo con secciones que incluyen herramientas, estilo de llamada a herramientas, directrices de seguridad, referencia de la CLI de OpenClaw, Skills, documentación, espacio de trabajo, sandbox, mensajería, etiquetas de respuesta, voz, respuestas silenciosas, Heartbeats, metadatos de Runtime, además de memoria y reacciones cuando están habilitadas, y archivos de contexto opcionales y contenido adicional del prompt del sistema. Las secciones se recortan para el modo de prompt mínimo usado por subagentes.

El prompt se aplica después de crear la sesión mediante `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestión de sesiones

### Archivos de sesión

Las sesiones son archivos JSONL con estructura de árbol (enlaces id/parentId). El `SessionManager` de Pi gestiona la persistencia:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw envuelve esto con `guardSessionManager()` para la seguridad de los resultados de herramientas.

### Caché de sesiones

`session-manager-cache.ts` almacena en caché instancias de SessionManager para evitar análisis repetidos de archivos:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitación del historial

`limitHistoryTurns()` recorta el historial de conversación según el tipo de canal (DM frente a grupo).

### Compaction

La Compaction automática se activa al desbordarse el contexto. Las firmas comunes de desbordamiento incluyen `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` y `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gestiona la Compaction manual:

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

Los perfiles rotan ante fallos con seguimiento de enfriamiento:

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

`FailoverError` activa el respaldo del modelo cuando está configurado:

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

### Protección de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` agrega directrices a Compaction, incluido presupuesto adaptativo de tokens y resúmenes de fallos de herramientas y operaciones de archivos:

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

## Streaming y respuestas en bloque

### Fragmentación de bloques

`EmbeddedBlockChunker` gestiona el streaming de texto en bloques de respuesta discretos:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Eliminación de etiquetas de pensamiento/final

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

## Gestión de errores

### Clasificación de errores

`pi-embedded-helpers.ts` clasifica errores para una gestión adecuada:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Respaldo de nivel de pensamiento

Si un nivel de pensamiento no es compatible, se usa un respaldo:

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

## Integración con sandbox

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

## Gestión específica de proveedores

### Anthropic

- Depuración de cadena mágica de rechazo
- Validación de turnos para roles consecutivos
- Validación estricta de parámetros de herramientas de Pi ascendente

### Google/Gemini

- Saneamiento de esquemas de herramientas propiedad del Plugin

### OpenAI

- Herramienta `apply_patch` para modelos Codex
- Gestión de degradación del nivel de pensamiento

## Integración con TUI

OpenClaw también tiene un modo TUI local que usa componentes de pi-tui directamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Esto proporciona la experiencia interactiva de terminal similar al modo nativo de Pi.

## Diferencias clave respecto a la CLI de Pi

| Aspecto                | CLI de Pi               | OpenClaw integrado                                                                            |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Invocación             | comando `pi` / RPC      | SDK mediante `createAgentSession()`                                                           |
| Herramientas           | Herramientas de codificación predeterminadas | Suite de herramientas personalizada de OpenClaw                                                |
| Prompt del sistema     | AGENTS.md + prompts     | Dinámico por canal/contexto                                                                    |
| Almacenamiento de sesión | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (o `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticación          | Credencial única        | Varios perfiles con rotación                                                                   |
| Extensiones            | Cargadas desde disco    | Programáticas + rutas de disco                                                                 |
| Gestión de eventos     | Renderizado de TUI      | Basada en callbacks (onBlockReply, etc.)                                                       |

## Consideraciones futuras

Áreas para posible rediseño:

1. **Alineación de firmas de herramientas**: actualmente adapta entre las firmas de pi-agent-core y pi-coding-agent
2. **Envoltura del gestor de sesiones**: `guardSessionManager` agrega seguridad, pero aumenta la complejidad
3. **Carga de extensiones**: podría usar el `ResourceLoader` de Pi de forma más directa
4. **Complejidad del gestor de streaming**: `subscribeEmbeddedPiSession` ha crecido mucho
5. **Particularidades de proveedores**: muchas rutas de código específicas de proveedores que Pi podría gestionar potencialmente

## Pruebas

La cobertura de integración de Pi abarca estas suites:

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

En vivo/opcional:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilitar `OPENCLAW_LIVE_TEST=1`)

Para los comandos de ejecución actuales, consulta [Flujo de trabajo de desarrollo de Pi](/es/pi-dev).

## Relacionado

- [Flujo de trabajo de desarrollo de Pi](/es/pi-dev)
- [Resumen de instalación](/es/install)
