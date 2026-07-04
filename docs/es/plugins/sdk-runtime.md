---
read_when:
    - Necesitas llamar a helpers del núcleo desde un plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, nodos)
    - Quieres entender qué expone api.runtime
    - Estás accediendo a utilidades de configuración, agente o medios desde el código del Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los helpers de runtime inyectados disponibles para plugins
title: Funciones auxiliares de tiempo de ejecución del Plugin
x-i18n:
    generated_at: "2026-07-04T20:24:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia del objeto `api.runtime` inyectado en cada plugin durante el registro. Usa estos helpers en lugar de importar directamente los componentes internos del host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/es/plugins/sdk-channel-plugins">
    Guía paso a paso que usa estos helpers en contexto para plugins de canal.
  </Card>
  <Card title="Plugins de proveedor" href="/es/plugins/sdk-provider-plugins">
    Guía paso a paso que usa estos helpers en contexto para plugins de proveedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Carga y escrituras de configuración

Prefiere la configuración que ya se pasó a la ruta de llamada activa, por ejemplo `api.config` durante el registro o un argumento `cfg` en callbacks de canal/proveedor. Esto mantiene una instantánea de proceso fluyendo por el trabajo en lugar de volver a analizar la configuración en rutas críticas.

Usa `api.runtime.config.current()` solo cuando un manejador de larga duración necesita la instantánea actual del proceso y no se pasó ninguna configuración a esa función. El valor devuelto es de solo lectura; clónalo o usa un helper de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` más `ctx.getRuntimeConfig()`. Usa el getter dentro del callback `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de que se creó la definición de la herramienta.

Persiste los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política explícita `afterWrite`:

- `afterWrite: { mode: "auto" }` permite que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando quien escribe sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga/reinicio automáticos solo cuando el llamador controla el seguimiento.

Los helpers de mutación devuelven `afterWrite` más un resumen tipado `followUp` para que los llamadores puedan registrar o probar si solicitaron un reinicio. El Gateway sigue controlando cuándo ocurre realmente ese reinicio.

`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` son helpers de compatibilidad obsoletos bajo `runtime-config-load-write`. Advierten una vez en tiempo de ejecución y siguen disponibles para plugins externos antiguos durante la ventana de migración. Los plugins incluidos no deben usarlos; las protecciones del límite de configuración fallan si el código del plugin los llama o importa esos helpers desde subrutas del SDK de plugins.

Para importaciones directas del SDK, usa las subrutas de configuración enfocadas en lugar del barrel amplio de compatibilidad
`openclaw/plugin-sdk/config-runtime`: `config-contracts` para
tipos, `plugin-config-runtime` para aserciones de configuración ya cargada y búsqueda de entradas de plugin, `runtime-config-snapshot` para instantáneas del proceso actual y
`config-mutation` para escrituras. Las pruebas de plugins incluidos deben simular estas subrutas enfocadas directamente en lugar de simular el barrel amplio de compatibilidad.

El código interno del runtime de OpenClaw sigue la misma dirección: cargar la configuración una vez en el CLI, el Gateway o el límite del proceso, y luego pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de runtime del proceso y avanzan su revisión interna; las cachés de larga duración deben usar como clave la clave de caché propiedad del runtime en lugar de serializar la configuración localmente. Los módulos de runtime de larga duración tienen un escáner de tolerancia cero para llamadas ambientales a `loadConfig()`; usa un `cfg` pasado, un `context.getRuntimeConfig()` de solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben usar la instantánea activa de configuración de runtime, no una instantánea de archivo devuelta para relectura o edición de configuración. Las instantáneas de archivo conservan valores de origen como marcadores SecretRef para la UI y escrituras; los callbacks de proveedor necesitan la vista de runtime resuelta. Cuando se pueda llamar a un helper con la instantánea de origen activa o con la instantánea de runtime activa, pásalo por `selectApplicableRuntimeConfig()` antes de leer credenciales.

## Utilidades de runtime reutilizables

Usa datos entrantes `botLoopProtection` para mensajes entrantes creados por bots. El núcleo aplica la protección compartida en memoria de ventana deslizante antes del registro de sesión y el despacho, sin vincular la política a un canal. La protección rastrea claves `(scopeId, conversationId, participant pair)`, cuenta juntas ambas direcciones de un par, aplica un enfriamiento una vez que se supera el presupuesto de la ventana y poda entradas inactivas de forma oportunista.

Los plugins de canal que expongan este comportamiento a operadores deben preferir la forma compartida `channels.defaults.botLoopProtection` para presupuestos base y luego superponer anulaciones específicas de canal/proveedor. La configuración compartida usa segundos porque es visible para el usuario:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Pasa datos normalizados de pares de bots con el turno resuelto. El núcleo resuelve valores predeterminados, conversión de unidades y semántica de `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Usa `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos personalizados de dos partes que no pasan por el ejecutor compartido de respuestas entrantes.

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` es el helper neutral para iniciar un turno normal de agente de OpenClaw desde código de plugin. Usa la misma resolución de proveedor/modelo y selección de arnés de agente que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidad obsoleto para plugins existentes. El código nuevo debe usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` devuelve los niveles de pensamiento admitidos del proveedor/modelo y el valor predeterminado opcional. Los plugins de proveedor controlan el perfil específico del modelo mediante sus hooks de pensamiento, por lo que los plugins de herramientas deben llamar a este helper de runtime en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto de usuario como `on`, `x-high` o `extra high` al nivel almacenado canónico antes de comprobarlo contra la política resuelta.

    Los **helpers de almacén de sesiones** están bajo `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Prefiere `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para flujos de trabajo de sesión. Estos helpers dirigen las sesiones por identidad de agente/sesión para que los plugins no dependan de la forma de almacenamiento heredada `sessions.json`. Usa `preserveActivity: true` para parches solo de metadatos que no deban actualizar la actividad de la sesión, y `replaceEntry: true` solo cuando el callback devuelve una entrada completa y los campos eliminados deben permanecer eliminados.

    Usa `runWithWorkAdmission(...)` cuando un plugin inicia trabajo en una sesión persistida. El callback rechaza sesiones archivadas o reemplazadas concurrentemente, mantiene coordinadas las mutaciones de archivo/restablecimiento/eliminación hasta la finalización y recibe un `AbortSignal` que debe reenviarse a la ejecución del agente.

    Para lecturas y escrituras de transcripciones, importa `openclaw/plugin-sdk/session-transcript-runtime` y usa `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten que los plugins identifiquen una transcripción, lean sus eventos, agreguen mensajes, publiquen actualizaciones y ejecuten operaciones relacionadas bajo el mismo bloqueo de escritura de transcripción. Pasar `sessionFile`, usar `resolveSessionTranscriptLegacyFileTarget(...)` o importar `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` de bajo nivel desde `openclaw/plugin-sdk/agent-harness-runtime` está obsoleto; esas rutas existen solo para código heredado que ya recibe un artefacto de transcripción activo.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` y `resolveAndPersistSessionFile(...)` son helpers de compatibilidad obsoletos para plugins que todavía dependen intencionalmente de la forma heredada de almacén completo o archivo de transcripción. El código nuevo de plugins no debe usar esos helpers, y los llamadores existentes deben migrar a helpers de entrada y helpers de identidad de transcripción.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas de modelo y proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Ejecuta una finalización de texto propiedad del host sin importar componentes internos del proveedor ni
    duplicar la preparación de modelo/autenticación/URL base de OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    El helper usa la misma ruta de preparación de finalización simple que el runtime
    integrado de OpenClaw y la instantánea de configuración de runtime propiedad del host. Los motores de contexto
    reciben una capacidad `llm.complete` vinculada a la sesión, por lo que las llamadas de modelo usan el
    agente de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye atribución de proveedor/modelo/agente más uso normalizado de tokens,
    caché y coste estimado cuando está disponible.

    <Warning>
    Las sobrescrituras de modelo requieren la aceptación explícita del operador mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Usa `plugins.entries.<id>.llm.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

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

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. Eliminar sesiones arbitrarias de usuarios u operadores todavía requiere una solicitud Gateway con alcance de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumera los nodos conectados e invoca un comando de host de nodo desde código de plugin cargado por Gateway o desde comandos CLI del plugin. Usa esto cuando un plugin posee trabajo local en un dispositivo emparejado, por ejemplo, un navegador o puente de audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro del Gateway, este runtime está en proceso. En comandos CLI de plugins, llama al Gateway configurado mediante RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar nodos emparejados desde la terminal. Los comandos Node aún pasan por el emparejamiento normal de nodos de Gateway, listas de permisos de comandos, políticas de invocación de nodos del plugin y manejo de comandos local del nodo.

    Los plugins que exponen comandos de host de nodo peligrosos deben registrar una política de invocación de nodos con `api.registerNodeInvokePolicy(...)`. La política se ejecuta en el Gateway después de las comprobaciones de la lista de permisos de comandos y antes de que el comando se reenvíe al nodo, por lo que las llamadas directas a `node.invoke` y las herramientas de plugin de nivel superior comparten la misma ruta de aplicación.

    <Warning>
    El campo opcional `scopes` solicita alcances de operador de Gateway para la invocación. OpenClaw lo respeta solo para plugins incluidos e instalaciones de plugins oficiales de confianza; las solicitudes de otros plugins no elevan la llamada. Úsalo solo cuando un plugin de confianza deba invocar un comando de nodo con un alcance de Gateway más estricto, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincula un runtime de flujo de tareas a una clave de sesión existente de OpenClaw o a un contexto de herramienta de confianza, y luego crea y administra flujos de tareas sin pasar un propietario en cada llamada.

    El flujo de tareas rastrea el estado duradero de flujos de trabajo de varios pasos. No es un programador:
    usa Cron o `api.session.workflow.scheduleSessionTurn(...)` para activaciones
    futuras, y luego usa `managedFlows` desde el turno programado cuando ese trabajo
    necesite estado de flujo, tareas secundarias, esperas o cancelación.

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

    Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tengas una clave de sesión de OpenClaw de confianza desde tu propia capa de vinculación. No vincules desde entrada de usuario sin procesar.

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
    Análisis de imágenes, audio y video.

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

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
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
    Instantánea de configuración del runtime actual y escrituras de configuración transaccionales. Prefiere
    la configuración que ya se pasó a la ruta de llamada activa; usa
    `current()` solo cuando el manejador necesite directamente la instantánea del proceso.

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
    que registra la intención del escritor sin quitarle el control de reinicio al
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilidades de nivel de sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` devuelve `stdout` y `stderr` capturados, conteos
    opcionales de truncamiento, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera y de tiempo de espera sin salida informan `code: 124`
    cuando el proceso hijo no proporciona un código de salida distinto de cero. Las salidas por señal
    sin tiempo de espera aún pueden devolver `code: null`, así que usa `termination` y
    `noOutputTimedOut` para distinguir los motivos del tiempo de espera.

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
    Resolución de autenticación de modelos y proveedores.

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
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Los almacenes con claves sobreviven a los reinicios y están aislados por el id del plugin vinculado al runtime. Usa `registerIfAbsent(...)` para reclamos atómicos de deduplicación: devuelve `true` cuando la clave faltaba o había expirado y se registró, o `false` cuando ya existe un valor activo sin sobrescribir su valor, hora de creación ni TTL. Límites: `maxEntries` por espacio de nombres, 6000 filas activas por plugin, valores JSON de menos de 64 KB y expiración TTL opcional. Cuando una escritura superaría el límite de filas del plugin, el runtime puede expulsar las filas activas más antiguas del espacio de nombres que se está escribiendo; los espacios de nombres hermanos no se expulsan para esa escritura, y la escritura sigue fallando si el espacio de nombres no puede liberar suficientes filas.

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
    Ayudantes de runtime específicos de canal (disponibles cuando se carga un plugin de canal).

    `api.runtime.channel.media` es la superficie preferida para descargas y almacenamiento de medios del canal:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Usa `saveRemoteMedia(...)` cuando una URL remota deba convertirse en medios de OpenClaw. Usa `saveResponseMedia(...)` cuando el plugin ya haya obtenido una `Response` con manejo de autenticación, redirecciones o listas de permitidos propiedad del plugin. Usa `readRemoteMediaBuffer(...)` solo cuando el plugin necesite bytes sin procesar para inspección, transformaciones, descifrado o recarga. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto de `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` es la superficie compartida de políticas de menciones entrantes para plugins de canal incluidos que usan inyección de runtime:

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

    `api.runtime.channel.mentions` no expone intencionalmente los antiguos ayudantes de compatibilidad `resolveMentionGating*`. Prefiere la ruta normalizada `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Almacenar referencias de runtime

Usa `createPluginRuntimeStore` para almacenar la referencia de runtime para usarla fuera del callback `register`:

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
  <Step title="Conectar con el punto de entrada">
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
Prefiere `pluginId` para la identidad del almacén de runtime. La forma de nivel inferior `key` es para casos poco comunes en los que un plugin necesita intencionalmente más de una ranura de runtime.
</Note>

## Otros campos `api` de nivel superior

Además de `api.runtime`, el objeto de API también proporciona:

<ParamField path="api.id" type="string">
  Id del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre visible del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de configuración actual (instantánea activa de runtime en memoria cuando está disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica del plugin desde `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Registrador con ámbito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resuelve una ruta relativa a la raíz del plugin.
</ParamField>

## Relacionado

- [Componentes internos de Plugin](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia de subrutas
