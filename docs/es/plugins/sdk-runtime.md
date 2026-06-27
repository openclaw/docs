---
read_when:
    - Necesitas llamar a funciones auxiliares del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, nodos)
    - Quieres entender qué expone api.runtime
    - Estás accediendo a configuración, agente o asistentes multimedia desde código de plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los helpers de runtime inyectados disponibles para los plugins
title: Ayudantes del runtime de Plugin
x-i18n:
    generated_at: "2026-06-27T12:29:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia para el objeto `api.runtime` inyectado en cada plugin durante el registro. Usa estos helpers en lugar de importar directamente componentes internos del host.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/es/plugins/sdk-channel-plugins">
    Guía paso a paso que usa estos helpers en contexto para plugins de canal.
  </Card>
  <Card title="Provider plugins" href="/es/plugins/sdk-provider-plugins">
    Guía paso a paso que usa estos helpers en contexto para plugins de proveedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Carga y escritura de configuración

Prefiere la configuración que ya se pasó a la ruta de llamada activa, por ejemplo `api.config` durante el registro o un argumento `cfg` en callbacks de canal/proveedor. Esto mantiene una única instantánea del proceso fluyendo por el trabajo en lugar de volver a analizar la configuración en rutas críticas.

Usa `api.runtime.config.current()` solo cuando un manejador de larga duración necesita la instantánea actual del proceso y no se pasó ninguna configuración a esa función. El valor devuelto es de solo lectura; clónalo o usa un helper de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` además de `ctx.getRuntimeConfig()`. Usa el getter dentro del callback `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de crear la definición de la herramienta.

Persiste los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` deja que el Gateway decida la recarga del planificador.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando quien escribe sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga/reinicio automático solo cuando el llamador se hace cargo del seguimiento.

Los helpers de mutación devuelven `afterWrite` junto con un resumen `followUp` tipado para que los llamadores puedan registrar o probar si solicitaron un reinicio. El Gateway sigue siendo responsable de cuándo ocurre realmente ese reinicio.

`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` son helpers de compatibilidad obsoletos bajo `runtime-config-load-write`. Emiten una advertencia una vez en tiempo de ejecución y siguen disponibles para plugins externos antiguos durante la ventana de migración. Los plugins incluidos no deben usarlos; las protecciones de límite de configuración fallan si el código del plugin los llama o importa esos helpers desde subrutas del SDK de plugins.

Para importaciones directas del SDK, usa las subrutas de configuración enfocadas en lugar del barril amplio de compatibilidad
`openclaw/plugin-sdk/config-runtime`: `config-contracts` para
tipos, `plugin-config-runtime` para aserciones de configuración ya cargada y búsqueda de entradas de plugins,
`runtime-config-snapshot` para instantáneas del proceso actual, y
`config-mutation` para escrituras. Las pruebas de plugins incluidos deben simular estas subrutas enfocadas
directamente en lugar de simular el barril amplio de compatibilidad.

El código interno de tiempo de ejecución de OpenClaw sigue la misma dirección: cargar la configuración una vez en el límite de la CLI, el Gateway o el proceso, y luego pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de tiempo de ejecución del proceso y avanzan su revisión interna; las cachés de larga duración deben basarse en la clave de caché propiedad del tiempo de ejecución en lugar de serializar la configuración localmente. Los módulos de tiempo de ejecución de larga duración tienen un escáner de tolerancia cero para llamadas ambientales a `loadConfig()`; usa un `cfg` pasado, un `context.getRuntimeConfig()` de solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben usar la instantánea activa de configuración de tiempo de ejecución, no una instantánea de archivo devuelta para lectura o edición de configuración. Las instantáneas de archivo conservan valores de origen como marcadores SecretRef para la IU y escrituras; los callbacks de proveedor necesitan la vista resuelta del tiempo de ejecución. Cuando un helper pueda llamarse con la instantánea activa de origen o con la instantánea activa de tiempo de ejecución, enruta mediante `selectApplicableRuntimeConfig()` antes de leer credenciales.

## Utilidades reutilizables de tiempo de ejecución

Usa hechos entrantes `botLoopProtection` para mensajes entrantes escritos por bots. Core aplica la protección compartida en memoria de ventana deslizante antes del registro de sesión y el envío, sin vincular la política a un solo canal. La protección rastrea claves `(scopeId, conversationId, participant pair)`, cuenta ambas direcciones de un par juntas, aplica un enfriamiento cuando se excede el presupuesto de la ventana y poda de forma oportunista las entradas inactivas.

Los plugins de canal que exponen este comportamiento a operadores deben preferir la forma compartida `channels.defaults.botLoopProtection` para presupuestos base y luego superponer encima las anulaciones específicas de canal/proveedor. La configuración compartida usa segundos porque está orientada al usuario:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Pasa hechos normalizados de pares de bots con el turno resuelto. Core resuelve valores predeterminados, conversión de unidades y semántica de `enabled`:

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

Usa `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos
personalizados de dos partes que no pasan por el ejecutor compartido de respuestas entrantes.

## Espacios de nombres de tiempo de ejecución

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

    `runEmbeddedAgent(...)` es el helper neutral para iniciar un turno normal de agente de OpenClaw desde código de plugin. Usa la misma resolución de proveedor/modelo y selección de arnés de agente que las respuestas disparadas por canales.

    `runEmbeddedPiAgent(...)` permanece como un alias de compatibilidad obsoleto para plugins existentes. El código nuevo debe usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` devuelve los niveles de pensamiento admitidos por el proveedor/modelo y el valor predeterminado opcional. Los plugins de proveedor poseen el perfil específico del modelo mediante sus hooks de pensamiento, por lo que los plugins de herramientas deben llamar a este helper de tiempo de ejecución en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto de usuario como `on`, `x-high` o `extra high` al nivel almacenado canónico antes de comprobarlo contra la política resuelta.

    **Los helpers del almacén de sesiones** están bajo `api.runtime.agent.session`:

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
    ```

    Prefiere `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para flujos de trabajo de sesiones. Estos helpers direccionan las sesiones por identidad de agente/sesión para que los plugins no dependan de la forma de almacenamiento heredada `sessions.json`. Usa `preserveActivity: true` para parches solo de metadatos que no deben actualizar la actividad de la sesión, y `replaceEntry: true` solo cuando el callback devuelve una entrada completa y los campos eliminados deben permanecer eliminados.

    Para lecturas y escrituras de transcripciones, importa `openclaw/plugin-sdk/session-transcript-runtime` y usa `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten que los plugins identifiquen una transcripción, lean sus eventos, agreguen mensajes, publiquen actualizaciones y ejecuten operaciones relacionadas bajo el mismo bloqueo de escritura de transcripción. Pasa `sessionFile` solo al adaptar código que ya recibe un artefacto de transcripción activo y necesita que cada helper opere sobre ese mismo artefacto.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionFilePath(...)` son helpers de compatibilidad para plugins que todavía dependen intencionalmente de la forma heredada de almacén completo o de archivo de transcripción. El código nuevo de plugins no debe usar esos helpers, y los llamadores existentes deben migrar a los helpers de entrada.

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

    El helper usa la misma ruta de preparación de finalización simple que el tiempo de ejecución
    integrado de OpenClaw y la instantánea de configuración de tiempo de ejecución propiedad del host. Los motores de contexto
    reciben una capacidad `llm.complete` vinculada a la sesión, por lo que las llamadas al modelo usan el
    agente de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye atribución de proveedor/modelo/agente además de uso normalizado de tokens,
    caché y coste estimado cuando está disponible.

    <Warning>
    Las anulaciones de modelo requieren consentimiento explícito del operador mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Usa `plugins.entries.<id>.llm.allowedModels` para restringir plugins de confianza a destinos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Lanza y gestiona ejecuciones de subagentes en segundo plano.

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
    Las sustituciones de modelo (`provider`/`model`) requieren la aceptación explícita del operador mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins no confiables todavía pueden ejecutar subagentes, pero las solicitudes de sustitución se rechazan.
    </Warning>

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. Eliminar sesiones arbitrarias de usuario u operador todavía requiere una solicitud de Gateway con ámbito de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumera los nodos conectados e invoca un comando del host del nodo desde código de plugin cargado por Gateway o desde comandos de CLI del plugin. Usa esto cuando un plugin posee trabajo local en un dispositivo emparejado, por ejemplo un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro de Gateway, este runtime está en el proceso. En los comandos de CLI del plugin, llama al Gateway configurado por RPC, de modo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar nodos emparejados desde la terminal. Los comandos de Node todavía pasan por el emparejamiento normal de nodos de Gateway, las listas de comandos permitidos, las políticas de invocación de nodo del plugin y el manejo de comandos local del nodo.

    Los plugins que exponen comandos peligrosos del host del nodo deben registrar una política de invocación de nodo con `api.registerNodeInvokePolicy(...)`. La política se ejecuta en Gateway después de las comprobaciones de la lista de comandos permitidos y antes de que el comando se reenvíe al nodo, de modo que las llamadas directas a `node.invoke` y las herramientas de plugin de nivel superior comparten la misma ruta de aplicación.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincula un runtime de flujo de tareas a una clave de sesión existente de OpenClaw o a un contexto de herramienta confiable, y luego crea y administra flujos de tareas sin pasar un propietario en cada llamada.

    El flujo de tareas rastrea estado duradero de flujos de trabajo de varios pasos. No es un programador:
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

    Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tengas una clave de sesión confiable de OpenClaw desde tu propia capa de vinculación. No vincules desde entrada de usuario sin procesar.

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

    Usa la configuración central `messages.tts` y la selección de proveedor. Devuelve un búfer de audio PCM + frecuencia de muestreo.

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
    Utilidades de medios de bajo nivel.

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
    Instantánea de configuración actual del runtime y escrituras transaccionales de configuración. Prefiere
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

    `mutateConfigFile(...)` y `replaceConfigFile(...)` devuelven un valor `followUp`,
    por ejemplo `{ mode: "restart", requiresRestart: true, reason }`,
    que registra la intención del escritor sin quitarle al
    gateway el control del reinicio.

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

    `runCommandWithTimeout(...)` devuelve `stdout` y `stderr` capturados, conteos opcionales
    de truncamiento, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera y de tiempo de espera sin salida informan `code: 124`
    cuando el proceso hijo no proporciona un código de salida distinto de cero. Las salidas por señal
    sin tiempo de espera todavía pueden devolver `code: null`, así que usa `termination` y
    `noOutputTimedOut` para distinguir los motivos de tiempo de espera.

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
    Resolución de directorio de estado y almacenamiento con claves respaldado por SQLite.

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

    Los almacenes con clave sobreviven a los reinicios y están aislados por el id del plugin vinculado al runtime. Usa `registerIfAbsent(...)` para reclamaciones atómicas de deduplicación: devuelve `true` cuando la clave faltaba o había vencido y se registró, o `false` cuando ya existe un valor activo sin sobrescribir su valor, hora de creación ni TTL. Límites: `maxEntries` por espacio de nombres, 6000 filas activas por plugin, valores JSON de menos de 64 KB y vencimiento TTL opcional. Cuando una escritura superaría el límite de filas del plugin, el runtime puede desalojar las filas activas más antiguas del espacio de nombres en el que se escribe; los espacios de nombres hermanos no se desalojan para esa escritura, y la escritura aun así falla si el espacio de nombres no puede liberar suficientes filas.

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
    Helpers de runtime específicos del canal (disponibles cuando se carga un plugin de canal).

    `api.runtime.channel.media` es la superficie preferida para descargas y almacenamiento de medios del canal:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Usa `saveRemoteMedia(...)` cuando una URL remota deba convertirse en medios de OpenClaw. Usa `saveResponseMedia(...)` cuando el plugin ya obtuvo una `Response` con manejo de autenticación, redirecciones o lista de permitidos propiedad del plugin. Usa `readRemoteMediaBuffer(...)` solo cuando el plugin necesite bytes sin procesar para inspección, transformaciones, descifrado o recarga. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto para `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` es la superficie compartida de política de menciones entrantes para plugins de canal incluidos que usan inyección de runtime:

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

    `api.runtime.channel.mentions` no expone intencionadamente los helpers de compatibilidad antiguos `resolveMentionGating*`. Prefiere la ruta normalizada `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Almacenar referencias del runtime

Usa `createPluginRuntimeStore` para almacenar la referencia del runtime para usarla fuera del callback `register`:

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
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
  <Step title="Access from other files">
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
Prefiere `pluginId` para la identidad del almacén de runtime. La forma de nivel inferior `key` es para casos poco comunes en los que un plugin necesita intencionadamente más de una ranura de runtime.
</Note>

## Otros campos `api` de nivel superior

Además de `api.runtime`, el objeto de API también proporciona:

<ParamField path="api.id" type="string">
  Id del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre para mostrar del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de configuración actual (instantánea activa del runtime en memoria cuando está disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica del plugin desde `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con ámbito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resuelve una ruta relativa a la raíz del plugin.
</ParamField>

## Relacionado

- [Aspectos internos del plugin](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia de subrutas
