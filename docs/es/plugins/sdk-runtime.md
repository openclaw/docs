---
read_when:
    - Necesitas llamar a helpers del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, Nodes)
    - Quieres entender qué expone api.runtime
    - Estás accediendo a helpers de configuración, agente o multimedia desde código de Plugin
sidebarTitle: Runtime Helpers
summary: 'api.runtime: los helpers de runtime inyectados disponibles para Plugins'
title: Helpers de runtime de Plugins
x-i18n:
    generated_at: "2026-04-24T05:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referencia del objeto `api.runtime` inyectado en cada Plugin durante el
registro. Usa estos helpers en lugar de importar directamente internos del host.

<Tip>
  **¿Buscas un recorrido guiado?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso
  que muestran estos helpers en contexto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espacios de nombres de runtime

### `api.runtime.agent`

Identidad del agente, directorios y gestión de sesiones.

```typescript
// Resolver el directorio de trabajo del agente
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolver el espacio de trabajo del agente
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Obtener la identidad del agente
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Obtener el nivel predeterminado de thinking
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Obtener el timeout del agente
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Asegurar que el espacio de trabajo existe
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Ejecutar un turno embebido de agente
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Resume los cambios más recientes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` es el helper neutral para iniciar un turno normal de
agente de OpenClaw desde código de Plugin. Usa la misma resolución de proveedor/modelo y
la misma selección de harness de agente que las respuestas activadas por canal.

`runEmbeddedPiAgent(...)` se mantiene como alias de compatibilidad.

**Los helpers del almacén de sesiones** están bajo `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes de modelo y proveedor predeterminados:

```typescript
const model = api.runtime.agent.defaults.model; // p. ej. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // p. ej. "anthropic"
```

### `api.runtime.subagent`

Inicia y gestiona ejecuciones en segundo plano de subagentes.

```typescript
// Iniciar una ejecución de subagente
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Amplía esta consulta en búsquedas de seguimiento más enfocadas.",
  provider: "openai", // sobrescritura opcional
  model: "gpt-4.1-mini", // sobrescritura opcional
  deliver: false,
});

// Esperar a que termine
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Leer mensajes de sesión
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Eliminar una sesión
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Las sobrescrituras de modelo (`provider`/`model`) requieren adhesión del operador mediante
  `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración.
  Los Plugins no confiables aún pueden ejecutar subagentes, pero las solicitudes de sobrescritura se rechazan.
</Warning>

### `api.runtime.nodes`

Lista los Nodes conectados e invoca un comando alojado en Node desde código de Plugin
cargado por Gateway. Úsalo cuando un Plugin sea propietario de trabajo local en un dispositivo emparejado, por ejemplo un
puente de navegador o audio en otro Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Este runtime solo está disponible dentro del Gateway. Los comandos de Node siguen
pasando por el Pairing normal de Nodes del Gateway, listas de permitidos de comandos y manejo de comandos local del Node.

### `api.runtime.taskFlow`

Vincula un runtime de TaskFlow a una clave de sesión existente de OpenClaw o a un contexto confiable
de herramienta, luego crea y gestiona TaskFlows sin pasar un propietario en cada llamada.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tengas una
clave de sesión confiable de OpenClaw desde tu propia capa de vinculación. No vincules desde entrada de usuario sin procesar.

### `api.runtime.tts`

Síntesis de texto a voz.

```typescript
// TTS estándar
const clip = await api.runtime.tts.textToSpeech({
  text: "Hola desde OpenClaw",
  cfg: api.config,
});

// TTS optimizado para telefonía
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hola desde OpenClaw",
  cfg: api.config,
});

// Listar voces disponibles
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Usa la configuración central `messages.tts` y la selección de proveedor. Devuelve
búfer de audio PCM + frecuencia de muestreo.

### `api.runtime.mediaUnderstanding`

Análisis de imagen, audio y video.

```typescript
// Describir una imagen
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribir audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // opcional, cuando no se puede inferir el MIME
});

// Describir un video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Análisis genérico de archivo
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Devuelve `{ text: undefined }` cuando no se produce salida (p. ej. entrada omitida).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad
  de `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generación de imágenes.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Un robot pintando una puesta de sol",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Búsqueda web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilidades multimedia de bajo nivel.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Carga y escritura de configuración.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilidades a nivel de sistema.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Suscripciones a eventos.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Registro.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Resolución de autenticación de modelos y proveedores.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Resolución del directorio de estado.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factorías de herramientas de memory y CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helpers de runtime específicos del canal (disponibles cuando está cargado un Plugin de canal).

`api.runtime.channel.mentions` es la superficie compartida de política de mención entrante para
Plugins de canal incluidos que usan inyección de runtime:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Helpers de menciones disponibles:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` no expone intencionadamente los antiguos
helpers de compatibilidad `resolveMentionGating*`. Prefiere la ruta normalizada
`{ facts, policy }`.

## Almacenamiento de referencias de runtime

Usa `createPluginRuntimeStore` para almacenar la referencia de runtime y usarla fuera
del callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// En tu punto de entrada
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// En otros archivos
export function getRuntime() {
  return store.getRuntime(); // lanza error si no está inicializado
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // devuelve null si no está inicializado
}
```

Prefiere `pluginId` para la identidad del runtime-store. La forma de nivel más bajo `key` es
para casos poco comunes en los que un Plugin necesita intencionadamente más de un slot
de runtime.

## Otros campos `api` de nivel superior

Además de `api.runtime`, el objeto API también proporciona:

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del Plugin                                                                               |
| `api.name`               | `string`                  | Nombre visible del Plugin                                                                   |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                     |
| `api.logger`             | `PluginLogger`            | Logger con ámbito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver una ruta relativa a la raíz del Plugin                                             |

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) -- referencia de subrutas
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) -- opciones de `definePluginEntry`
- [Internals de Plugin](/es/plugins/architecture) -- modelo de capacidades y registro
