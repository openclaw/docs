---
read_when:
    - Necesitas llamar a funciones auxiliares del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, nodos)
    - Quieres entender qué expone api.runtime
    - Estás accediendo a helpers de configuración, agente o medios desde código de plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- las funciones auxiliares de tiempo de ejecución inyectadas disponibles para los plugins
title: Ayudantes de ejecución de Plugin
x-i18n:
    generated_at: "2026-07-05T11:36:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8341516832d7876e7f1412b443e7582a090b7f94893303560b3713ee7a7e6aa
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia del objeto `api.runtime` inyectado en cada plugin durante el registro. Usa estos helpers en lugar de importar directamente elementos internos del host.

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

`api.runtime.version` es la versión actual del producto OpenClaw, obtenida del resolvedor de versión compartido para que los plugins vean el mismo valor que informa la CLI.

## Carga y escritura de configuración

Prefiere la configuración que ya se pasó a la ruta de llamada activa, por ejemplo `api.config` durante el registro o un argumento `cfg` en callbacks de canal/proveedor. Esto mantiene una única instantánea del proceso fluyendo por el trabajo en lugar de volver a analizar la configuración en rutas activas.

Usa `api.runtime.config.current()` solo cuando un manejador de larga vida necesite la instantánea actual del proceso y no se haya pasado ninguna configuración a esa función. El valor devuelto es de solo lectura; clónalo o usa un helper de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` además de `ctx.getRuntimeConfig()`. Usa el getter dentro del callback `execute` de una herramienta de larga vida cuando la configuración pueda cambiar después de que se haya creado la definición de la herramienta.

Persiste los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` deja que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando el escritor sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga o el reinicio automáticos solo cuando el llamador es responsable del seguimiento.

Los helpers de mutación devuelven `afterWrite` además de un resumen tipado `followUp` para que los llamadores puedan registrar o probar si solicitaron un reinicio. El Gateway sigue siendo responsable de cuándo ocurre realmente ese reinicio.

<Warning>
`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` están obsoletos. Emiten una advertencia una vez por plugin en runtime y siguen disponibles solo para plugins externos antiguos durante la ventana de migración. Los plugins incluidos no deben usarlos: una guarda interna de límite de configuración hace fallar la compilación si el código del plugin los llama o importa esos helpers desde subrutas del SDK de plugins. Usa `current()`, un `cfg` recibido, `mutateConfigFile(...)` o `replaceConfigFile(...)` en su lugar.
</Warning>

Para importaciones directas del SDK, prefiere las subrutas de configuración enfocadas por encima del barrel amplio de compatibilidad `openclaw/plugin-sdk/config-runtime`: `config-contracts` para tipos, `plugin-config-runtime` para aserciones de configuración ya cargada y búsqueda de entrada de plugin, `runtime-config-snapshot` para instantáneas actuales del proceso, y `config-mutation` para escrituras. Las pruebas de plugins incluidos deben simular directamente estas subrutas enfocadas en lugar de simular el barrel amplio de compatibilidad.

El código interno de runtime de OpenClaw sigue la misma dirección: cargar la configuración una vez en la CLI, el Gateway o el límite del proceso, y luego pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de runtime del proceso y avanzan su revisión interna; las cachés de larga vida deben basarse en la clave de caché propiedad del runtime en lugar de serializar la configuración localmente. Los módulos de runtime de larga vida tienen un escáner de tolerancia cero para llamadas ambientales a `loadConfig()`; usa un `cfg` pasado, un `context.getRuntimeConfig()` de solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben usar la instantánea de configuración de runtime activa, no una instantánea de archivo devuelta para lectura o edición de configuración. Las instantáneas de archivo conservan valores de origen como marcadores SecretRef para la interfaz y las escrituras; los callbacks de proveedor necesitan la vista de runtime resuelta. Cuando un helper pueda llamarse con la instantánea de origen activa o con la instantánea de runtime activa, enruta a través de `selectApplicableRuntimeConfig()` antes de leer credenciales.

## Utilidades de runtime reutilizables

Usa los datos entrantes `botLoopProtection` para mensajes entrantes escritos por bots. El núcleo aplica la guarda compartida de ventana deslizante en memoria antes del registro de sesión y el despacho, sin vincular la política a un canal. La guarda rastrea claves `(scopeId, conversationId, participant pair)`, cuenta juntas ambas direcciones de un par, aplica un enfriamiento cuando se supera el presupuesto de la ventana y depura oportunistamente las entradas inactivas.

Los plugins de canal que exponen este comportamiento a operadores deben preferir la forma compartida `channels.defaults.botLoopProtection` para presupuestos base, y luego añadir encima sobrescrituras específicas del canal/proveedor. La configuración compartida usa segundos porque es visible para el usuario:

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

Usa `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos personalizados de dos participantes que no pasan por el ejecutor compartido de respuestas entrantes.

## Espacios de nombres de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidad del agente, directorios y gestión de sesiones.

    ```typescript
    // Resolve the agent's working directory (agentId is required)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

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
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` es el helper neutral para iniciar un turno normal de agente de OpenClaw desde código de plugin. Usa la misma resolución de proveedor/modelo y selección de arnés de agente que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidad obsoleto para plugins existentes. El código nuevo debe usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` devuelve los niveles de razonamiento admitidos por el proveedor/modelo y un valor predeterminado opcional. Los plugins de proveedor son responsables del perfil específico del modelo mediante sus hooks de razonamiento, por lo que los plugins de herramientas deben llamar a este helper de runtime en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto de usuario como `on`, `x-high` o `extra high` al nivel almacenado canónico antes de comprobarlo frente a la política resuelta.

    Los **helpers del almacén de sesiones** están en `api.runtime.agent.session`:

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

    Prefiere `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para flujos de trabajo de sesión. Estos helpers direccionan las sesiones por identidad de agente/sesión para que los plugins no dependan de la forma de almacenamiento heredada `sessions.json`. Usa `preserveActivity: true` para parches solo de metadatos que no deben actualizar la actividad de la sesión, y `replaceEntry: true` solo cuando el callback devuelva una entrada completa y los campos eliminados deban permanecer eliminados.

    Usa `runWithWorkAdmission(...)` cuando un plugin inicia trabajo en una sesión persistida. El callback rechaza sesiones archivadas o reemplazadas concurrentemente, mantiene coordinadas las mutaciones de archivo/restablecimiento/eliminación hasta la finalización y recibe un `AbortSignal` que debe reenviarse a la ejecución del agente.

    Para lecturas y escrituras de transcripciones, importa `openclaw/plugin-sdk/session-transcript-runtime` y usa `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten a los plugins identificar una transcripción, leer sus eventos, añadir mensajes, publicar actualizaciones y ejecutar operaciones relacionadas bajo el mismo bloqueo de escritura de transcripción. Pasar `sessionFile`, usar `resolveSessionTranscriptLegacyFileTarget(...)` o importar los elementos de bajo nivel `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` está obsoleto; esas rutas existen solo para código heredado que ya recibe un artefacto de transcripción activo.

    `resolveStorePath(...)` y `updateSessionStoreEntry(...)` completan los helpers de sesión: `resolveStorePath` resuelve la ruta del almacén de sesiones para un ámbito dado, y `updateSessionStoreEntry({ storePath, sessionKey, update })` parchea una entrada directamente por ruta de almacén cuando el llamador ya la conoce.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionFilePath(...)` son helpers de compatibilidad obsoletos para plugins que aún dependen intencionalmente de la forma heredada de almacén completo o archivo de transcripción. El código nuevo de plugins no debe usar esos helpers, y los llamadores existentes deben migrar a helpers de entrada y helpers de identidad de transcripción.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas de modelo y proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "gpt-5.5"
    const provider = api.runtime.agent.defaults.provider; // e.g. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Ejecuta una finalización de texto propiedad del host sin importar elementos internos de proveedores ni
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
    reciben una capacidad `llm.complete` vinculada a la sesión, por lo que las llamadas al modelo usan el agente
    de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye atribución de proveedor/modelo/agente, además de uso normalizado de tokens,
    caché y costo estimado cuando está disponible.

    <Warning>
    Las sobrescrituras de modelo requieren aceptación explícita del operador mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Usa `plugins.entries.<id>.llm.allowedModels` para restringir los plugins de confianza a objetivos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
      model: "gpt-5.5", // optional override
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
    Las sobrescrituras de modelo (`provider`/`model`) requieren aceptación explícita del operador mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins no confiables aún pueden ejecutar subagentes, pero las solicitudes de sobrescritura se rechazan.
    </Warning>

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. Eliminar sesiones arbitrarias de usuario u operador sigue requiriendo una solicitud de Gateway con alcance de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumera los nodos conectados e invoca un comando alojado en un nodo desde código de plugin cargado por Gateway o desde comandos de CLI del plugin. Usa esto cuando un plugin posee trabajo local en un dispositivo emparejado, por ejemplo un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro del Gateway, este runtime está en proceso. En comandos de CLI del plugin, llama al Gateway configurado por RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar nodos emparejados desde la terminal. Los comandos de Node siguen pasando por el emparejamiento normal de nodos de Gateway, listas de comandos permitidos, políticas node-invoke de plugins y manejo de comandos local al nodo.

    Los plugins que exponen comandos peligrosos alojados en nodos deberían registrar una política node-invoke con `api.registerNodeInvokePolicy(...)`. La política se ejecuta en el Gateway después de las comprobaciones de lista de comandos permitidos y antes de que el comando se reenvíe al nodo, por lo que las llamadas directas `node.invoke` y las herramientas de plugin de nivel superior comparten la misma ruta de aplicación.

    <Warning>
    El campo opcional `scopes` solicita alcances de operador de Gateway para la invocación. OpenClaw lo respeta solo para plugins integrados e instalaciones de plugins oficiales de confianza; las solicitudes de otros plugins no elevan la llamada. Úsalo solo cuando un plugin de confianza deba invocar un comando de nodo con un alcance de Gateway más estricto, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Vincula el estado de Task Flow y Task Run a una clave de sesión existente de OpenClaw o a un contexto de herramienta de confianza.

    - `api.runtime.tasks.managedFlows` permite mutaciones: crear, avanzar y cancelar Task Flows.
    - `api.runtime.tasks.flows` y `api.runtime.tasks.runs` son vistas DTO de solo lectura para listados y consultas de estado; ambas exponen `bindSession(...)` / `fromToolContext(...)`, además de `get`, `list`, `findLatest` y `resolve`.
    - `api.runtime.tasks.flow` es un alias obsoleto de `managedFlows`.

    Task Flow rastrea el estado duradero de flujos de trabajo de varios pasos. No es un programador:
    usa Cron o `api.session.workflow.scheduleSessionTurn(...)` para activaciones futuras,
    y luego usa `managedFlows` desde el turno programado cuando ese trabajo
    necesita estado de flujo, tareas secundarias, esperas o cancelación.

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

    Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tengas una clave de sesión de OpenClaw de confianza desde tu propia capa de enlace. No enlaces desde entradas sin procesar de usuario.

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

    Usa la configuración principal `messages.tts` y la selección de proveedor. Devuelve búfer de audio PCM + frecuencia de muestreo. `textToSpeechStream` también está disponible para síntesis en streaming.

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

    `describeImageFileWithModel(...)` describe una imagen ya conocida mediante un proveedor/modelo específico, evitando la resolución predeterminada del modelo activo que usa `describeImageFile(...)`.

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
  <Accordion title="api.runtime.videoGeneration">
    Generación de video, reflejando la forma de generación de imágenes.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "A drone shot flying over a coastline at sunrise",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Generación de música, reflejando la forma de generación de imágenes.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "An upbeat lo-fi track for a coding session",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
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
    Instantánea de configuración de runtime actual y escrituras transaccionales de configuración. Prefiere
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
    que registra la intención del escritor sin quitarle al
    Gateway el control del reinicio.

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
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` ejecuta inmediatamente un único ciclo de Heartbeat, omitiendo el temporizador normal de combinación. Pasa `{ heartbeat: { target: "last" } }` para forzar la entrega al último canal activo en lugar de la supresión predeterminada `target: "none"`.

    `runCommandWithTimeout(...)` devuelve `stdout` y `stderr` capturados, conteos opcionales
    de truncamiento, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera y tiempo de espera sin salida informan `code: 124`
    cuando el proceso hijo no proporciona un código de salida distinto de cero. Las salidas
    por señal sin tiempo de espera aún pueden devolver `code: null`, así que usa `termination` y
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
    Resolución de autenticación de modelo y proveedor.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // Request-ready auth, including provider runtime exchanges (e.g. OAuth refresh)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

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

    Los almacenes con claves sobreviven a los reinicios y están aislados por el id de Plugin vinculado al runtime. Usa `registerIfAbsent(...)` para reclamaciones atómicas de deduplicación: devuelve `true` cuando la clave faltaba o había caducado y se registró, o `false` cuando ya existe un valor activo sin sobrescribir su valor, hora de creación ni TTL. Límites: `maxEntries` por espacio de nombres, 50 000 filas activas por Plugin, valores JSON inferiores a 64 KB y caducidad TTL opcional. Cuando una escritura superaría el límite de filas del Plugin, el runtime descarta las filas activas más antiguas del espacio de nombres en el que se escribe; los espacios de nombres hermanos no se expulsan para esa escritura, y la escritura sigue fallando si el espacio de nombres no puede liberar suficientes filas.

    `openSyncKeyedStore<T>(...)` devuelve la misma forma de almacén con métodos síncronos (`register`, `registerIfAbsent`, `lookup`, `consume`, `clear` devuelven todos valores directamente en lugar de promesas) para llamadores que no pueden usar `await`.

    `openChannelIngressQueue<TPayload>(...)` abre una cola de entrada persistente limitada al Plugin llamador, para almacenar en búfer eventos entrantes que necesitan procesamiento al menos una vez entre reinicios.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` y `openChannelIngressQueue` solo están disponibles para plugins incluidos e instalaciones oficiales confiables de Plugin en esta versión.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Ayudantes de runtime específicos del canal (disponibles cuando se carga un Plugin de canal). Agrupados por área:

    | Grupo | Propósito |
    | --- | --- |
    | `text` | Fragmentación (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), detección de comandos de control, conversión de tablas Markdown. |
    | `reply` | Envío de respuestas de bloques en búfer, formato de envoltorio, resolución de mensajes efectivos/configuración de demora humana. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, lecturas de listas de permitidos, upserts de solicitudes de emparejamiento. |
    | `media` | Descarga/guardado de medios remotos (ver abajo). |
    | `activity` | Registrar/leer la última actividad del canal. |
    | `session` | Metadatos de sesión desde eventos entrantes, actualizaciones de última ruta. |
    | `mentions` | Ayudantes de política de menciones (ver abajo). |
    | `reactions` | Manejadores de reacciones de confirmación para indicadores de procesamiento en curso. |
    | `groups` | Política de grupos y resolución de mención obligatoria. |
    | `debounce` | Debounce de mensajes entrantes. |
    | `commands` | Autorización de comandos y control de comandos de texto. |
    | `outbound` | Cargar el adaptador saliente de un canal. |
    | `inbound` | Crear contexto de evento entrante y ejecutar el núcleo compartido de evento entrante/respuesta. |
    | `threadBindings` | Ajustar tiempo de espera por inactividad/edad máxima para hilos de sesión vinculados. |
    | `runtimeContexts` | Registrar, leer y observar contexto local de proceso por canal/cuenta/capacidad. |

    `api.runtime.channel.media` es la superficie preferida para descargas y almacenamiento de medios de canal:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Usa `saveRemoteMedia(...)` cuando una URL remota deba convertirse en medio de OpenClaw. Usa `saveResponseMedia(...)` cuando el Plugin ya obtuvo una `Response` con autenticación, redirección o manejo de lista de permitidos propiedad del Plugin. Usa `readRemoteMediaBuffer(...)` solo cuando el Plugin necesita bytes sin procesar para inspección, transformaciones, descifrado o recarga. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto para `readRemoteMediaBuffer(...)`.

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

    Ayudantes de mención disponibles:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` no expone intencionalmente los antiguos ayudantes de compatibilidad `resolveMentionGating*`. Prefiere la ruta normalizada `{ facts, policy }`.

    Varios campos bajo `reply`, `session` e `inbound` incluyen notas `@deprecated` por campo que apuntan al núcleo actual de turno de canal o a los adaptadores salientes de canal; revisa el JSDoc en línea del ayudante específico antes de basar código nuevo en él.

  </Accordion>
</AccordionGroup>

## Almacenar referencias del runtime

Usa `createPluginRuntimeStore` para almacenar la referencia del runtime y usarla fuera del callback `register`:

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
Prefiere `pluginId` para la identidad del almacén de runtime. La forma de nivel inferior `key` es para casos poco comunes en los que un Plugin necesita intencionalmente más de una ranura de runtime.
</Note>

## Otros campos `api` de nivel superior

Además de `api.runtime`, el objeto API también proporciona:

<ParamField path="api.id" type="string">
  Id de Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre visible de Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de configuración actual (instantánea activa del runtime en memoria cuando está disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica de Plugin desde `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con ámbito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual: `"full"` (activación en vivo), `"discovery"` / `"tool-discovery"` (descubrimiento de capacidades de solo lectura), `"setup-only"` (entrada de configuración ligera), `"setup-runtime"` (flujo de configuración que también necesita la entrada del canal de runtime), o `"cli-metadata"` (recopilación de metadatos de comandos de CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolver una ruta relativa a la raíz del Plugin.
</ParamField>

## Relacionado

- [Elementos internos de Plugin](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia de subrutas
