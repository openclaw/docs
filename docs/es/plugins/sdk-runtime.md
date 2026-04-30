---
read_when:
    - Necesitas llamar a funciones auxiliares del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, nodos)
    - Quieres entender qué expone api.runtime
    - Estás accediendo a utilidades auxiliares de configuración, agente o medios desde el código del Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los helpers de runtime inyectados disponibles para los plugins
title: Funciones auxiliares de tiempo de ejecución de Plugin
x-i18n:
    generated_at: "2026-04-30T05:54:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia para el objeto `api.runtime` inyectado en cada plugin durante el registro. Usa estos ayudantes en lugar de importar directamente elementos internos del host.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/es/plugins/sdk-channel-plugins">
    Guía paso a paso que usa estos ayudantes en contexto para plugins de canal.
  </Card>
  <Card title="Provider plugins" href="/es/plugins/sdk-provider-plugins">
    Guía paso a paso que usa estos ayudantes en contexto para plugins de proveedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Carga Y Escrituras De Configuración

Prefiere la configuración que ya se pasó a la ruta de llamada activa, por ejemplo `api.config` durante el registro o un argumento `cfg` en callbacks de canal/proveedor. Esto mantiene una instantánea de proceso fluyendo por el trabajo en lugar de volver a analizar la configuración en rutas calientes.

Usa `api.runtime.config.current()` solo cuando un manejador de larga duración necesita la instantánea actual del proceso y no se pasó ninguna configuración a esa función. El valor devuelto es de solo lectura; clónalo o usa un ayudante de mutación antes de editar.

Las fábricas de herramientas reciben `ctx.runtimeConfig` más `ctx.getRuntimeConfig()`. Usa el getter dentro del callback `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de crear la definición de la herramienta.

Persiste los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política explícita `afterWrite`:

- `afterWrite: { mode: "auto" }` permite que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando quien escribe sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga/reinicio automáticos solo cuando el llamador es responsable del seguimiento.

Los ayudantes de mutación devuelven `afterWrite` más un resumen tipado `followUp` para que los llamadores puedan registrar o probar si solicitaron un reinicio. El Gateway sigue siendo responsable de cuándo ocurre realmente ese reinicio.

`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` son ayudantes de compatibilidad obsoletos bajo `runtime-config-load-write`. Advierten una vez en tiempo de ejecución y siguen disponibles para plugins externos antiguos durante la ventana de migración. Los plugins incluidos no deben usarlos; las protecciones del límite de configuración fallan si el código del plugin los llama o importa esos ayudantes desde subrutas del SDK de plugins.

Para importaciones directas del SDK, usa las subrutas de configuración enfocadas en lugar del barril amplio de compatibilidad
`openclaw/plugin-sdk/config-runtime`: `config-types` para
tipos, `plugin-config-runtime` para aserciones de configuración ya cargada y búsqueda de entradas de plugin,
`runtime-config-snapshot` para instantáneas actuales del proceso, y
`config-mutation` para escrituras. Las pruebas de plugins incluidos deben simular estas subrutas enfocadas
directamente en lugar de simular el barril amplio de compatibilidad.

El código interno de runtime de OpenClaw sigue la misma dirección: cargar la configuración una vez en la CLI, el Gateway o el límite del proceso, y luego pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de runtime del proceso y avanzan su revisión interna; las cachés de larga duración deben basarse en la clave de caché propiedad del runtime en lugar de serializar la configuración localmente. Los módulos de runtime de larga duración tienen un escáner de tolerancia cero para llamadas ambientales a `loadConfig()`; usa un `cfg` pasado, un `context.getRuntimeConfig()` de solicitud o `getRuntimeConfig()` en un límite de proceso explícito.

Las rutas de ejecución de proveedores y canales deben usar la instantánea activa de configuración de runtime, no una instantánea de archivo devuelta para lectura o edición de configuración. Las instantáneas de archivo preservan valores de origen como marcadores SecretRef para la interfaz de usuario y escrituras; los callbacks de proveedor necesitan la vista de runtime resuelta. Cuando un ayudante pueda llamarse con la instantánea activa de origen o la instantánea activa de runtime, enruta a través de `selectApplicableRuntimeConfig()` antes de leer credenciales.

## Espacios de nombres de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidad del agente, directorios y gestión de sesiones.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` es el ayudante neutral para iniciar un turno normal de agente de OpenClaw desde código de plugin. Usa la misma resolución de proveedor/modelo y selección de arnés de agente que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidad.

    `resolveThinkingPolicy(...)` devuelve los niveles de razonamiento admitidos por el proveedor/modelo y el valor predeterminado opcional. Los plugins de proveedor son responsables del perfil específico del modelo mediante sus hooks de razonamiento, por lo que los plugins de herramientas deben llamar a este ayudante de runtime en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto de usuario como `on`, `x-high` o `extra high` al nivel almacenado canónico antes de comprobarlo contra la política resuelta.

    Los **ayudantes del almacén de sesiones** están bajo `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas de modelo y proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicia y administra ejecuciones de subagentes en segundo plano.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Las sobrescrituras de modelo (`provider`/`model`) requieren la aceptación explícita del operador mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins no confiables aún pueden ejecutar subagentes, pero las solicitudes de sobrescritura se rechazan.
    </Warning>

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. Eliminar sesiones arbitrarias de usuarios u operadores aún requiere una solicitud de Gateway con alcance de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Lista nodos conectados e invoca un comando alojado en nodo desde código de plugin cargado por el Gateway o desde comandos CLI de plugin. Usa esto cuando un plugin posee trabajo local en un dispositivo emparejado, por ejemplo un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro del Gateway, este runtime está en proceso. En comandos CLI de plugin llama al Gateway configurado por RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar nodos emparejados desde la terminal. Los comandos de Node aún pasan por el emparejamiento normal de nodos del Gateway, listas de comandos permitidos, políticas de invocación de nodo del plugin y manejo de comandos local del nodo.

    Los plugins que exponen comandos peligrosos alojados en nodo deben registrar una política de invocación de nodo con `api.registerNodeInvokePolicy(...)`. La política se ejecuta en el Gateway después de las comprobaciones de la lista de comandos permitidos y antes de que el comando se reenvíe al nodo, por lo que las llamadas directas a `node.invoke` y las herramientas de plugin de nivel superior comparten la misma ruta de aplicación.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincula un runtime de TaskFlow a una clave de sesión existente de OpenClaw o a un contexto de herramienta confiable, y luego crea y administra TaskFlows sin pasar un propietario en cada llamada.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

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

    Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tienes una clave de sesión confiable de OpenClaw desde tu propia capa de vinculación. No vincules desde entrada de usuario sin procesar.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Síntesis de texto a voz.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Usa la configuración central `messages.tts` y la selección de proveedor. Devuelve búfer de audio PCM + frecuencia de muestreo.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Análisis de imagen, audio y video.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Devuelve `{ text: undefined }` cuando no se produce ninguna salida (por ejemplo, entrada omitida).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generación de imágenes.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Búsqueda web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
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

  </Accordion>
  <Accordion title="api.runtime.config">
    Instantánea de configuración actual del entorno de ejecución y escrituras de configuración transaccionales. Prefiere
    la configuración que ya se pasó a la ruta de llamada activa; usa
    `current()` solo cuando el controlador necesita directamente la instantánea del proceso.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` y `replaceConfigFile(...)` devuelven un valor
    `followUp`, por ejemplo `{ mode: "restart", requiresRestart: true, reason }`,
    que registra la intención del escritor sin quitarle el control del reinicio al
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilidades de nivel de sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Suscripciones a eventos.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Registro.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolución de autenticación de modelo y proveedor.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolución del directorio de estado y almacenamiento con claves respaldado por SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Los almacenes con claves sobreviven a los reinicios y se aíslan por el id de plugin vinculado al entorno de ejecución. Límites: `maxEntries` por espacio de nombres, 1.000 filas activas por plugin, valores JSON inferiores a 64 KB y caducidad TTL opcional.

    <Warning>
    Solo plugins incluidos en esta versión.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fábricas de herramientas de memoria y CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Ayudantes de entorno de ejecución específicos del canal (disponibles cuando se carga un plugin de canal).

    `api.runtime.channel.mentions` es la superficie compartida de política de menciones entrantes para plugins de canal incluidos que usan inyección en tiempo de ejecución:

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

    Ayudantes de menciones disponibles:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` no expone intencionadamente los ayudantes de compatibilidad antiguos `resolveMentionGating*`. Prefiere la ruta normalizada `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Almacenar referencias del entorno de ejecución

Usa `createPluginRuntimeStore` para almacenar la referencia del entorno de ejecución para usarla fuera de la devolución de llamada `register`:

<Steps>
  <Step title="Crear el almacén">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Conectar al punto de entrada">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Acceder desde otros archivos">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Prefiere `pluginId` para la identidad de runtime-store. La forma de bajo nivel `key` es para casos poco comunes en los que un plugin necesita intencionadamente más de un slot de entorno de ejecución.
</Note>

## Otros campos `api` de nivel superior

Más allá de `api.runtime`, el objeto API también proporciona:

<ParamField path="api.id" type="string">
  Id del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre visible del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de configuración actual (instantánea activa del entorno de ejecución en memoria cuando está disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica del plugin desde `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con alcance (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resuelve una ruta relativa a la raíz del plugin.
</ParamField>

## Relacionado

- [Internos de plugin](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia de subrutas
