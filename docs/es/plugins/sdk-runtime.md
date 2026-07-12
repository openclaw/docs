---
read_when:
    - Necesitas llamar a los auxiliares del núcleo desde un plugin (TTS, STT, generación de imágenes, búsqueda web, Gateway, subagente, nodos)
    - Quieres entender qué expone `api.runtime`
    - Está accediendo a auxiliares de configuración, agente o contenido multimedia desde el código del plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los auxiliares de runtime inyectados disponibles para los plugins
title: Ayudantes del entorno de ejecución de Plugin
x-i18n:
    generated_at: "2026-07-12T14:45:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia del objeto `api.runtime` inyectado en cada plugin durante el registro. Use estos auxiliares en lugar de importar directamente componentes internos del host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/es/plugins/sdk-channel-plugins">
    Guía paso a paso que usa estos auxiliares en contexto para los plugins de canal.
  </Card>
  <Card title="Plugins de proveedor" href="/es/plugins/sdk-provider-plugins">
    Guía paso a paso que usa estos auxiliares en contexto para los plugins de proveedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` es la versión actual del producto OpenClaw, obtenida del resolutor de versiones compartido para que los plugins vean el mismo valor que muestra la CLI.

## Carga y escritura de la configuración

Prefiera la configuración que ya se haya pasado a la ruta de llamada activa, por ejemplo, `api.config` durante el registro o un argumento `cfg` en las devoluciones de llamada de canales o proveedores. Esto permite que una única instantánea del proceso fluya por el trabajo, en lugar de volver a analizar la configuración en rutas críticas.

Use `api.runtime.config.current()` solo cuando un controlador de larga duración necesite la instantánea actual del proceso y no se haya pasado ninguna configuración a esa función. El valor devuelto es de solo lectura; clónelo o use un auxiliar de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` junto con `ctx.getRuntimeConfig()`. Use el getter dentro de la devolución de llamada `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de crear la definición de la herramienta.

Conserve los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` permite que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando el escritor sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga o el reinicio automáticos solo cuando la persona que realiza la llamada se encarga del seguimiento.

Los auxiliares de mutación devuelven `afterWrite` junto con un resumen `followUp` tipado para que quienes realizan las llamadas puedan registrar o comprobar si solicitaron un reinicio. El Gateway sigue controlando cuándo ocurre realmente ese reinicio.

<Warning>
`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` están obsoletos. Emiten una advertencia una vez por plugin durante la ejecución y permanecen disponibles solo para plugins externos antiguos durante el período de migración. Los plugins incluidos no deben usarlos: una protección interna de límites de configuración hace que la compilación falle si el código del plugin los llama o importa esos auxiliares desde subrutas del SDK de plugins. En su lugar, use `current()`, un `cfg` proporcionado, `mutateConfigFile(...)` o `replaceConfigFile(...)`.
</Warning>

Para las importaciones directas del SDK, prefiera las subrutas de configuración específicas en lugar del barrel amplio de compatibilidad `openclaw/plugin-sdk/config-runtime`: `config-contracts` para tipos, `plugin-config-runtime` para aserciones de configuración ya cargada y búsqueda de entradas de plugins, `runtime-config-snapshot` para instantáneas actuales del proceso y `config-mutation` para escrituras. Las pruebas de plugins incluidos deben simular directamente estas subrutas específicas en lugar de simular el barrel amplio de compatibilidad.

El código interno del entorno de ejecución de OpenClaw sigue la misma orientación: cargar la configuración una vez en el límite de la CLI, del Gateway o del proceso y, después, pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de ejecución del proceso y avanzan su revisión interna; las cachés de larga duración deben usar como clave la clave de caché controlada por el entorno de ejecución, en lugar de serializar la configuración localmente. Los módulos de ejecución de larga duración tienen un analizador de tolerancia cero para las llamadas ambientales a `loadConfig()`; use un `cfg` proporcionado, un `context.getRuntimeConfig()` de la solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben usar la instantánea activa de configuración de ejecución, no una instantánea de archivo devuelta para consultar o editar la configuración. Las instantáneas de archivo conservan valores de origen, como marcadores SecretRef, para la interfaz de usuario y las escrituras; las devoluciones de llamada de proveedores necesitan la vista de ejecución resuelta. Cuando se pueda llamar a un auxiliar con la instantánea de origen activa o con la instantánea de ejecución activa, pase por `selectApplicableRuntimeConfig()` antes de leer las credenciales.

## Utilidades reutilizables del entorno de ejecución

Use los datos entrantes de `botLoopProtection` para los mensajes entrantes creados por bots. El núcleo aplica la protección compartida en memoria con ventana deslizante antes del registro y el envío de la sesión, sin vincular la política a un solo canal. La protección realiza el seguimiento de claves `(scopeId, conversationId, participant pair)`, cuenta conjuntamente ambas direcciones de un par, aplica un período de espera una vez superado el presupuesto de la ventana y elimina oportunamente las entradas inactivas.

Los plugins de canal que expongan este comportamiento a los operadores deben preferir la estructura compartida `channels.defaults.botLoopProtection` para los presupuestos de referencia y, después, superponer las anulaciones específicas del canal o proveedor. La configuración compartida usa segundos porque está orientada al usuario:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Pase los datos normalizados del par de bots con el turno resuelto. El núcleo resuelve los valores predeterminados, la conversión de unidades y la semántica de `enabled`:

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

Use `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos personalizados
entre dos partes que no pasen por el ejecutor compartido de respuestas entrantes.

## Espacios de nombres del entorno de ejecución

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidad del agente, directorios y gestión de sesiones.

    ```typescript
    // Resolver el directorio de trabajo del agente (agentId es obligatorio)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolver el espacio de trabajo del agente
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // Obtener la identidad del agente
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Obtener el nivel de razonamiento predeterminado
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validar un nivel de razonamiento proporcionado por el usuario con el perfil del proveedor activo
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pasar el nivel a una ejecución integrada
    }

    // Obtener el tiempo de espera del agente
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Asegurarse de que exista el espacio de trabajo
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Ejecutar un turno de agente integrado
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Resumir los cambios más recientes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` es el auxiliar neutral para iniciar un turno normal de agente de OpenClaw desde el código de un plugin. Usa la misma resolución de proveedor y modelo, y la misma selección del arnés del agente, que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidad obsoleto para los plugins existentes. El código nuevo debe usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` devuelve los niveles de razonamiento admitidos por el proveedor y el modelo, así como el valor predeterminado opcional. Los plugins de proveedores controlan el perfil específico del modelo mediante sus hooks de razonamiento, por lo que los plugins de herramientas deben llamar a este auxiliar del entorno de ejecución en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto del usuario como `on`, `x-high` o `extra high` al nivel canónico almacenado antes de compararlo con la política resuelta.

    Los **auxiliares del almacén de sesiones** se encuentran en `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterar por las filas de sesión sin depender de la estructura heredada de sessions.json.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Crear o actualizar la sesión y, después, pasar signal a la ejecución del agente admitida.
      },
    );
    ```

    Prefiera `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para los flujos de trabajo de sesiones. Estos auxiliares identifican las sesiones mediante la identidad del agente y de la sesión para que los plugins no dependan de la estructura de almacenamiento heredada `sessions.json`. Use `preserveActivity: true` para parches exclusivamente de metadatos que no deban actualizar la actividad de la sesión y `replaceEntry: true` solo cuando la devolución de llamada devuelva una entrada completa y los campos eliminados deban permanecer eliminados. Las rutas de diagnóstico y migración pueden combinar `fallbackEntry`, `skipMaintenance` y `requireWriteSuccess` para realizar una única reparación atómica del almacén canónico.

    `createSessionEntry(...)` crea una nueva fila de sesión canónica y una transcripción. Su superficie `initialEntry` de confianza es deliberadamente limitada: un `agentHarnessId` no vacío, un `modelSelectionLocked: true` opcional y `pluginExtensions` opcionales. El entorno de ejecución inyectado solo acepta identificadores de arnés que pertenezcan al plugin que realiza la llamada mediante `registerAgentHarness(...)`; se trata de una invariante de propiedad, no de un entorno aislado entre plugins dentro del mismo proceso. Rechaza una fila existente; `label` y `spawnedCwd` son campos de creación independientes, en lugar de parches de entradas de confianza.

    La creación mantiene el bloqueo de mutación del ciclo de vida de la sesión durante `afterCreate`, por lo que el trabajo nuevo espera a que termine la inicialización controlada por el plugin y el trabajo admitido preexistente hace que falle la creación. La devolución de llamada recibe un clon del estado creado. Si devuelve un parche, este solo puede contener `pluginExtensions`, y su valor constituye el campo `pluginExtensions` final completo. Un fallo de la devolución de llamada o de la persistencia final revierte la nueva fila sin cambios y la transcripción; la reversión protegida conserva una fila modificada o reclamada simultáneamente. `recoverMatchingInitialEntry: true` solo sirve para reintentar una inicialización interrumpida cuando los campos de confianza conservados coinciden exactamente, y la recuperación requiere que `afterCreate` devuelva un parche final.

    Use `runWithWorkAdmission(...)` cuando un plugin inicie trabajo en una sesión persistente. La devolución de llamada rechaza las sesiones archivadas o sustituidas simultáneamente, mantiene coordinadas hasta su finalización las mutaciones de archivado, restablecimiento y eliminación, y recibe un `AbortSignal` que debe reenviarse a la ejecución del agente. Un arnés puede indicar explícitamente delegados de ejecución de confianza mediante su campo experimental de registro `delegatedExecutionPluginIds`. Los delegados solo pueden admitir y ejecutar una sesión existente exacta con el modelo bloqueado; todas las mutaciones de la sesión siguen restringidas al propietario del arnés. Consulte [Plugins de arnés de agente](/es/plugins/sdk-agent-harness#delegated-execution).

    Los plugins de mantenimiento y reparación pueden usar `deleteSessionEntry(...)` para una entrada de sesión con ámbito específico, `cleanupSessionLifecycleArtifacts(...)` para sesiones temporales que pertenecen al ciclo de vida y `resolveSessionStoreBackupPaths(...)` antes de modificar un almacén. Estos auxiliares son superficies específicas de reparación y ciclo de vida, no una API general para eliminar almacenes.

    `resolveStorePath(...)` y `updateSessionStoreEntry(...)` completan los auxiliares de sesión: `resolveStorePath` resuelve la ruta del almacén de sesiones para un ámbito determinado, y `updateSessionStoreEntry({ storePath, sessionKey, update })` modifica directamente una entrada mediante la ruta del almacén cuando el llamador ya la conoce.

    `loadTranscriptEventsSync(...)` está disponible para rutas síncronas de diagnóstico y reparación que no pueden usar el entorno de ejecución asíncrono de transcripciones. Devuelve registros `SessionStoreTranscriptEvent` sin procesar. El código normal del entorno de ejecución de los plugins debe preferir `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` y `sqliteSessionFileMarkerMatchesSession(...)` son auxiliares de transición para el código que todavía recibe un campo heredado denominado `sessionFile`. Un marcador de SQLite analizado identifica un destino activo de transcripción de SQLite; no es una ruta del sistema de archivos. Las API nuevas deben transmitir una identidad de sesión tipada en lugar de cadenas de marcadores.

    Para leer y escribir transcripciones, importe `openclaw/plugin-sdk/session-transcript-runtime` y use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten que los plugins identifiquen una transcripción, lean eventos sin procesar o entradas de mensajes visibles y seguras para ramas, anexen mensajes, publiquen actualizaciones y ejecuten operaciones relacionadas bajo el mismo bloqueo de escritura de la transcripción sin depender de las rutas de los archivos de transcripción activos. `readVisibleSessionTranscriptMessageEntries(...)` devuelve metadatos de lectura ordenados; su campo `seq` no es un cursor reanudable.

    Los auxiliares heredados para el almacén completo y los archivos de transcripción activos ya no se exportan desde el SDK de plugins. Use los auxiliares de entradas con ámbito específico para los metadatos de sesión y los auxiliares de identidad de transcripción para las operaciones de transcripción activas. Los flujos de trabajo de archivado o soporte que necesiten artefactos de archivos deben usar sus superficies específicas de archivado en lugar de las API del entorno de ejecución de sesiones activas.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas del modelo y el proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // p. ej., "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // p. ej., "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Ejecute una finalización de texto gestionada por el host sin importar componentes internos del proveedor ni
    duplicar la preparación del modelo, la autenticación y la URL base de OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Resume esta transcripción." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    La orquestación del proveedor también puede adquirir el ciclo de vida
    configurado del servicio local antes de emitir una solicitud HTTP:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Envíe y consuma por completo la solicitud del proveedor.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` es un contrato estable y genérico del SDK
    para servicios de proveedores. El host resuelve la configuración del proceso desde
    `models.providers.<providerId>.localService`; los llamadores no pueden proporcionar un
    comando, argumentos, entorno ni política de ciclo de vida. La creación de procesos,
    la disponibilidad, los diagnósticos y la política de detención por inactividad siguen siendo internos del host.

    Pase el identificador exacto del proveedor configurado y la URL base resuelta de la solicitud. No
    sustituya los alias por un identificador de adaptador: distintos alias pueden apuntar a distintos
    hosts de GPU locales. El host rechaza los puntos de conexión que no coinciden con la URL base
    configurada del proveedor, salvo la normalización de `/v1` utilizada por los adaptadores de Ollama y LM
    Studio. El host gestiona la serialización del inicio, las comprobaciones de disponibilidad,
    las concesiones de solicitudes, la gestión de interrupciones y el apagado por inactividad.

    El auxiliar usa la misma ruta de preparación de finalizaciones simples que el
    entorno de ejecución integrado de OpenClaw y la instantánea de configuración del entorno de ejecución gestionada por el host. Los motores de contexto
    reciben una capacidad `llm.complete` vinculada a la sesión, de modo que las llamadas al modelo usan el
    agente de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye la atribución de proveedor, modelo y agente, además del uso normalizado de tokens,
    caché y coste estimado cuando está disponible.

    <Warning>
    Las sustituciones de modelos requieren la habilitación expresa del operador mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Use `plugins.entries.<id>.llm.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Llame a otro método del Gateway dentro del proceso conservando la identidad de confianza del entorno de ejecución
    del plugin actual. Esto está destinado a plugins integrados u oficiales de confianza que combinan capacidades
    del Gateway pertenecientes al plugin sin abrir una conexión WebSocket de bucle invertido.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Las solicitudes usan el ámbito `operator.write` y no conceden el ámbito de administración. Se rechazan las llamadas de plugins
    externos arbitrarios. Los métodos con errores lanzan un `GatewayClientRequestError`, conservando los
    `details` estructurados, los metadatos de reintento y el código de error del Gateway para los flujos de recuperación. Use `isAvailable()`
    antes de elegir esta ruta desde herramientas que también pueden ejecutarse en procesos de agente independientes.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie y gestione ejecuciones de subagentes en segundo plano.

    ```typescript
    // Inicie una ejecución de subagente
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Amplía esta consulta para convertirla en búsquedas de seguimiento específicas.",
      provider: "openai", // sustitución opcional
      model: "gpt-5.6-sol", // sustitución opcional
      deliver: false,
    });

    // Espere a que finalice
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Lea los mensajes de la sesión
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Elimine una sesión
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Las sustituciones de modelos (`provider`/`model`) requieren la habilitación expresa del operador mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins que no sean de confianza pueden seguir ejecutando subagentes, pero se rechazan las solicitudes de sustitución.
    </Warning>

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. La eliminación de sesiones arbitrarias de usuarios u operadores sigue requiriendo una solicitud del Gateway con ámbito de administración.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumere los nodos conectados e invoque un comando del host de un nodo desde código de plugin cargado por el Gateway o desde comandos de la CLI del plugin. Use esta opción cuando un plugin gestione trabajo local en un dispositivo emparejado, por ejemplo, un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` incluye los descriptores `nodePluginTools` anunciados de cada Node conectado
    cuando dicho Node expone al agente herramientas respaldadas por plugins o MCP.
    Esos descriptores forman parte del estado de conexión activo: el Gateway
    los descarta cuando el Node se desconecta, y un Node puede sustituirlos mediante
    `node.pluginTools.update` después de cambios en el inventario local de plugins o MCP.

    Dentro del Gateway, este entorno de ejecución opera en el mismo proceso. En los comandos de la CLI de plugins, llama al Gateway configurado mediante RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar los nodos emparejados desde el terminal. Los comandos de Node siguen sujetos al emparejamiento normal de nodos del Gateway, las listas de comandos permitidos, las políticas de invocación de nodos de los plugins y la gestión local de comandos del Node.

    Los plugins que exponen herramientas de agente alojadas en nodos pueden establecer `agentTool.defaultPlatforms` para los comandos no peligrosos que deban incluirse de forma predeterminada en la lista de permitidos. Omítalo cuando los operadores deban habilitarlos expresamente mediante `gateway.nodes.allowCommands`. Los comandos peligrosos alojados en nodos deben registrar una política de invocación de nodos mediante `api.registerNodeInvokePolicy(...)`; la política se ejecuta en el Gateway después de las comprobaciones de la lista de comandos permitidos y antes de que el comando se reenvíe al Node, de modo que las llamadas directas a `node.invoke`, las herramientas de plugins alojadas en nodos y las herramientas de plugins de nivel superior compartan la misma ruta de aplicación.

    <Warning>
    El campo opcional `scopes` solicita ámbitos de operador del Gateway para la invocación. OpenClaw solo lo respeta en plugins integrados e instalaciones de plugins oficiales de confianza; las solicitudes de otros plugins no elevan los privilegios de la llamada. Úselo únicamente cuando un plugin de confianza deba invocar un comando de Node con un ámbito más estricto del Gateway, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Vincule el estado de Task Flow y Task Run a una clave de sesión existente de OpenClaw o a un contexto de herramienta de confianza.

    - `api.runtime.tasks.managedFlows` permite realizar modificaciones: crear, avanzar y cancelar Task Flows.
    - `api.runtime.tasks.flows` y `api.runtime.tasks.runs` son vistas DTO de solo lectura para enumeraciones y consultas de estado; ambas exponen `bindSession(...)` / `fromToolContext(...)`, además de `get`, `list`, `findLatest` y `resolve`.
    - `api.runtime.tasks.flow` es un alias obsoleto de `managedFlows`.

    Task Flow realiza el seguimiento del estado persistente de flujos de trabajo de varios pasos. No es un programador:
    use Cron o `api.session.workflow.scheduleSessionTurn(...)` para futuras
    activaciones y, a continuación, use `managedFlows` desde el turno programado cuando ese trabajo
    necesite estado del flujo, tareas secundarias, esperas o cancelación.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Revisar nuevas solicitudes de incorporación de cambios",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Revisar la PR n.º 123",
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

    Use `bindSession({ sessionKey, requesterOrigin })` cuando ya disponga de una clave de sesión de confianza de OpenClaw procedente de su propia capa de vinculación. No realice la vinculación a partir de entradas de usuario sin procesar.

  </Accordion>
  <Accordion title="api.runtime.tts">
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

    // Enumerar las voces disponibles
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Utiliza la configuración principal de `messages.tts` y la selección de proveedor. Devuelve un búfer de audio PCM y la frecuencia de muestreo. `textToSpeechStream` también está disponible para la síntesis en streaming.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Análisis de imágenes, audio y vídeo.

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
      mime: "audio/ogg", // opcional, para cuando no se puede inferir el tipo MIME
    });

    // Describir un vídeo
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Análisis genérico de archivos
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Extracción estructurada de imágenes mediante un proveedor/modelo específico.
    // Incluya al menos una imagen; las entradas de texto son contexto complementario.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Priorice el total impreso frente a las notas manuscritas." },
      ],
      instructions: "Extraiga el proveedor, el total y las etiquetas de búsqueda.",
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

    Devuelve `{ text: undefined }` cuando no se produce ninguna salida (por ejemplo, si se omite la entrada).

    `describeImageFileWithModel(...)` describe una imagen ya conocida mediante un proveedor/modelo específico, omitiendo la resolución predeterminada del modelo activo que utiliza `describeImageFile(...)`.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad de `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generación de imágenes.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Un robot pintando una puesta de sol",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Generación de vídeo, con la misma estructura que la generación de imágenes.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Una toma de dron que sobrevuela una costa al amanecer",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Generación de música, con la misma estructura que la generación de imágenes.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Una pista lo-fi animada para una sesión de programación",
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
      args: { query: "SDK de plugins de OpenClaw", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilidades multimedia de bajo nivel.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "imagen"
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
    Instantánea de la configuración actual del entorno de ejecución y escrituras transaccionales de configuración. Se debe preferir
    la configuración que ya se haya pasado a la ruta de llamada activa; utilice
    `current()` solo cuando el controlador necesite directamente la instantánea del proceso.

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
    por ejemplo, `{ mode: "restart", requiresRestart: true, reason }`,
    que registra la intención de quien realiza la escritura sin quitarle al
    Gateway el control del reinicio.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilidades a nivel del sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Alias de compatibilidad obsoleto.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` ejecuta de inmediato un único ciclo de Heartbeat, omitiendo el temporizador normal de agrupación. Pase `{ heartbeat: { target: "last" } }` para forzar la entrega al último canal activo en lugar de la supresión predeterminada `target: "none"`.

    `runCommandWithTimeout(...)` devuelve los valores capturados de `stdout` y `stderr`, recuentos
    de truncamiento opcionales, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera y de tiempo de espera sin salida notifican `code: 124`
    cuando el proceso secundario no proporciona un código de salida distinto de cero. Las finalizaciones por señal
    sin tiempo de espera aún pueden devolver `code: null`, por lo que se deben usar `termination` y
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

    // Autenticación lista para solicitudes, incluidos los intercambios del entorno de ejecución del proveedor (por ejemplo, la renovación de OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolución del directorio de estado y almacenamiento por claves respaldado por SQLite.

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

    Los almacenes por claves sobreviven a los reinicios y están aislados por el identificador del plugin vinculado al entorno de ejecución. Utilice `registerIfAbsent(...)` para las reclamaciones atómicas de deduplicación: devuelve `true` cuando la clave no existía o había caducado y se registró, o `false` cuando ya existe un valor vigente, sin sobrescribir su valor, hora de creación ni TTL. Límites: `maxEntries` por espacio de nombres, 50,000 filas vigentes por plugin, valores JSON de menos de 64KB y caducidad TTL opcional. De forma predeterminada, una escritura que alcance cualquiera de los límites de filas descarta las filas vigentes más antiguas del espacio de nombres en el que se escribe; los espacios de nombres relacionados no se desalojan para esa escritura, y la escritura igualmente falla si el espacio de nombres no puede liberar suficientes filas. Configure `overflowPolicy: "reject-new"` para los registros de propiedad duraderos que nunca deban desalojarse: las claves nuevas fallan al alcanzar cualquiera de los límites, mientras que las claves existentes siguen pudiendo actualizarse.

    `openSyncKeyedStore<T>(...)` devuelve la misma estructura de almacén con métodos síncronos (`register`, `registerIfAbsent`, `lookup`, `consume` y `clear` devuelven valores directamente en lugar de promesas) para los llamadores que no pueden esperar.

    `openChannelIngressQueue<TPayload>(...)` abre una cola de entrada persistente, limitada al plugin que realiza la llamada, para almacenar en búfer eventos entrantes que necesitan procesarse al menos una vez entre reinicios. Cuando la recuperación de reclamaciones obsoletas utiliza `shouldRecover`, proporcione también `shouldRecoverCorrupt` si las cargas útiles reclamadas y dañadas deben ponerse en cuarentena: su identidad de reclamación independiente de la carga útil permite al plugin conservar la política vigente del propietario y del carril antes de que la cola marque la fila como eliminada.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` y `openChannelIngressQueue` solo están disponibles para los plugins incluidos y las instalaciones oficiales de plugins de confianza en esta versión.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Ayudantes del entorno de ejecución específicos del canal (disponibles cuando se carga un plugin de canal). Agrupados por función:

    | Grupo | Propósito |
    | --- | --- |
    | `text` | Fragmentación (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), detección de comandos de control y conversión de tablas Markdown. |
    | `reply` | Envío de respuestas por bloques almacenados en búfer, formato del sobre y resolución de la configuración de mensajes efectivos y retraso humano. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, lecturas de la lista de permitidos e inserciones o actualizaciones de solicitudes de emparejamiento. |
    | `media` | Descarga y almacenamiento de contenido multimedia remoto (véase más abajo). |
    | `activity` | Registrar y leer la última actividad del canal. |
    | `session` | Metadatos de sesión de eventos entrantes y actualizaciones de la última ruta. |
    | `mentions` | Funciones auxiliares de la política de menciones (véase más abajo). |
    | `reactions` | Identificadores de reacciones de confirmación para indicadores de procesamiento en curso. |
    | `groups` | Resolución de la política de grupos y del requisito de mención. |
    | `debounce` | Supresión de rebotes de mensajes entrantes. |
    | `commands` | Autorización de comandos y control de acceso a comandos de texto. |
    | `outbound` | Cargar el adaptador de salida de un canal. |
    | `inbound` | Crear el contexto de eventos entrantes y ejecutar el núcleo compartido de eventos entrantes y respuestas. |
    | `threadBindings` | Ajustar el tiempo de espera de inactividad y la antigüedad máxima de los hilos de sesión vinculados. |
    | `runtimeContexts` | Registrar, leer y observar el contexto local del proceso por canal, cuenta y capacidad. |

    `api.runtime.channel.media` es la interfaz preferida para descargar y almacenar contenido multimedia de canales:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` cuando una URL remota deba convertirse en contenido multimedia de OpenClaw. Use `saveResponseMedia(...)` cuando el plugin ya haya obtenido una `Response` mediante autenticación, redirecciones o gestión de listas de permitidos propias del plugin. Use `readRemoteMediaBuffer(...)` únicamente cuando el plugin necesite los bytes sin procesar para inspección, transformaciones, descifrado o recarga. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto de `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` es la interfaz compartida de políticas de menciones entrantes para los plugins de canal incluidos que usan inyección en tiempo de ejecución:

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

    Funciones auxiliares de menciones disponibles:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` no expone intencionadamente las funciones auxiliares de compatibilidad antiguas `resolveMentionGating*`. Se recomienda la ruta normalizada `{ facts, policy }`.

    Varios campos de `reply`, `session` e `inbound` incluyen notas `@deprecated` específicas que remiten al núcleo actual de turnos de canal o a los adaptadores de salida de canal; consulte el JSDoc en línea de la función auxiliar concreta antes de crear código nuevo basado en ella.

  </Accordion>
</AccordionGroup>

## Almacenamiento de referencias del tiempo de ejecución

Use `createPluginRuntimeStore` para almacenar la referencia del tiempo de ejecución y utilizarla fuera de la devolución de llamada `register`:

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
  <Step title="Conectarlo al punto de entrada">
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
Se recomienda `pluginId` como identidad del almacén del tiempo de ejecución. La forma de bajo nivel `key` está destinada a casos poco habituales en los que un plugin necesita intencionadamente más de una ranura de tiempo de ejecución.
</Note>

## Otros campos de nivel superior de `api`

Además de `api.runtime`, el objeto de API también proporciona:

<ParamField path="api.id" type="string">
  Identificador del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre visible del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de la configuración actual (la instantánea activa del tiempo de ejecución en memoria, cuando esté disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica del plugin procedente de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Registrador con ámbito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual: `"full"` (activación en vivo), `"discovery"` / `"tool-discovery"` (detección de capacidades de solo lectura), `"setup-only"` (entrada de configuración ligera), `"setup-runtime"` (flujo de configuración que también necesita la entrada del canal en tiempo de ejecución) o `"cli-metadata"` (recopilación de metadatos de comandos de la CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolver una ruta relativa a la raíz del plugin.
</ParamField>

## Relacionado

- [Detalles internos de los plugins](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia de subrutas
