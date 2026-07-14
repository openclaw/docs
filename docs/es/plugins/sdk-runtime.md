---
read_when:
    - Necesita llamar a funciones auxiliares del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, Gateway, subagente, nodos)
    - Quieres entender qué expone `api.runtime`
    - Estás accediendo a auxiliares de configuración, agente o contenido multimedia desde el código del plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los auxiliares de ejecución inyectados disponibles para los plugins
title: Funciones auxiliares del entorno de ejecución del Plugin
x-i18n:
    generated_at: "2026-07-14T14:00:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5126ad814597ce5c23232624d4ea38d188f3a7efac39607312546476e6964e6f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referencia del objeto `api.runtime` que se inyecta en cada plugin durante el registro. Utilice estos asistentes en lugar de importar directamente los componentes internos del host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/es/plugins/sdk-channel-plugins">
    Guía paso a paso que utiliza estos asistentes en contexto para los plugins de canal.
  </Card>
  <Card title="Plugins de proveedor" href="/es/plugins/sdk-provider-plugins">
    Guía paso a paso que utiliza estos asistentes en contexto para los plugins de proveedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` es la versión actual del producto OpenClaw, obtenida del resolvedor de versiones compartido para que los plugins vean el mismo valor que muestra la CLI.

## Carga y escritura de la configuración

Utilice preferentemente la configuración que ya se haya pasado a la ruta de llamada activa, por ejemplo, `api.config` durante el registro o un argumento `cfg` en las devoluciones de llamada de canales o proveedores. Esto mantiene una única instantánea del proceso a lo largo del trabajo, en lugar de volver a analizar la configuración en rutas críticas.

Utilice `api.runtime.config.current()` únicamente cuando un controlador de larga duración necesite la instantánea actual del proceso y no se haya pasado ninguna configuración a esa función. El valor devuelto es de solo lectura; clónelo o utilice un asistente de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` junto con `ctx.getRuntimeConfig()`. Utilice el captador dentro de la devolución de llamada `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de crear la definición de la herramienta.

Conserve los cambios con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` permite que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando quien realiza la escritura sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga o el reinicio automáticos solo cuando quien realiza la llamada se encarga del seguimiento.

Los asistentes de mutación devuelven `afterWrite` junto con un resumen `followUp` tipado para que quienes realizan las llamadas puedan registrar o comprobar si solicitaron un reinicio. El Gateway sigue determinando cuándo se produce realmente ese reinicio.

<Warning>
`api.runtime.config.loadConfig()` y `api.runtime.config.writeConfigFile(...)` están obsoletos. Emiten una advertencia una vez por plugin durante la ejecución y permanecen disponibles únicamente para plugins externos antiguos durante el período de migración. Los plugins incluidos no deben utilizarlos: una protección interna de límites de configuración hace que la compilación falle si el código del plugin los llama o importa esos asistentes desde subrutas del SDK de plugins. Utilice en su lugar `current()`, un `cfg` proporcionado, `mutateConfigFile(...)` o `replaceConfigFile(...)`.
</Warning>

Para las importaciones directas del SDK, utilice preferentemente las subrutas específicas de configuración en lugar del módulo de compatibilidad general `openclaw/plugin-sdk/config-runtime`: `config-contracts` para los tipos, `plugin-config-runtime` para las aserciones de configuración ya cargada, la búsqueda de entradas de plugins y la combinación de configuración canónica, `runtime-config-snapshot` para las instantáneas actuales del proceso y `config-mutation` para las escrituras. Las pruebas de plugins incluidos deben simular directamente estas subrutas específicas en lugar de simular el módulo de compatibilidad general.

El código interno de ejecución de OpenClaw sigue el mismo enfoque: cargar la configuración una vez en el límite de la CLI, del Gateway o del proceso y, a continuación, pasar ese valor. Las escrituras de mutación correctas actualizan la instantánea de ejecución del proceso e incrementan su revisión interna; las cachés de larga duración deben utilizar como clave la clave de caché gestionada por el entorno de ejecución, en lugar de serializar localmente la configuración. Los módulos de ejecución de larga duración disponen de un analizador de tolerancia cero para las llamadas ambientales a `loadConfig()`; utilice un `cfg` proporcionado, un `context.getRuntimeConfig()` de la solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben utilizar la instantánea activa de la configuración de ejecución, no una instantánea del archivo devuelta para consultar o editar la configuración. Las instantáneas de archivos conservan valores de origen, como los marcadores SecretRef, para la interfaz de usuario y las escrituras; las devoluciones de llamada de los proveedores necesitan la vista de ejecución resuelta. Cuando se pueda llamar a un asistente con la instantánea activa de origen o con la instantánea activa de ejecución, pase por `selectApplicableRuntimeConfig()` antes de leer las credenciales.

## Utilidades de ejecución reutilizables

Utilice los datos `botLoopProtection` entrantes para los mensajes entrantes generados por bots. El núcleo aplica la protección compartida de ventana deslizante en memoria antes de registrar y despachar la sesión, sin vincular la política a un solo canal. La protección realiza el seguimiento de las claves `(scopeId, conversationId, participant pair)`, cuenta conjuntamente ambas direcciones de un par, aplica un período de espera cuando se supera el límite de la ventana y elimina oportunamente las entradas inactivas.

Los plugins de canal que expongan este comportamiento a los operadores deben utilizar preferentemente la estructura compartida `channels.defaults.botLoopProtection` para los límites de referencia y, a continuación, aplicar encima las anulaciones específicas del canal o proveedor. La configuración compartida utiliza segundos porque está orientada al usuario:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Pase los datos normalizados del par de bots junto con el turno resuelto. El núcleo resuelve los valores predeterminados, la conversión de unidades y la semántica de `enabled`:

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

Utilice `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos personalizados
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

    // Validar un nivel de razonamiento proporcionado por el usuario con el perfil activo del proveedor
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pasar el nivel a una ejecución integrada
    }

    // Obtener el tiempo de espera del agente
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Asegurarse de que exista el espacio de trabajo
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Ejecutar un turno integrado del agente
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Resume los cambios más recientes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` es el asistente neutral para iniciar un turno normal de un agente de OpenClaw desde el código de un plugin. Utiliza la misma resolución de proveedor y modelo, así como la misma selección del entorno del agente, que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidad obsoleto para los plugins existentes. El código nuevo debe utilizar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` devuelve los niveles de razonamiento admitidos por el proveedor o modelo y el valor predeterminado opcional. Los plugins de proveedor controlan el perfil específico del modelo mediante sus enlaces de razonamiento, por lo que los plugins de herramientas deben llamar a este asistente del entorno de ejecución en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto del usuario como `on`, `x-high` o `extra high` al nivel canónico almacenado antes de comprobarlo con la política resuelta.

    Los **asistentes del almacén de sesiones** se encuentran en `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterar por las filas de sesiones sin depender de la estructura heredada de sessions.json.
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
        // Crear o actualizar la sesión y, a continuación, pasar signal a la ejecución admitida del agente.
      },
    );
    ```

    Utilice preferentemente `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para los flujos de trabajo de sesiones. Estos asistentes identifican las sesiones mediante la identidad del agente y de la sesión para que los plugins no dependan de la estructura de almacenamiento heredada `sessions.json`. Utilice `preserveActivity: true` para modificaciones exclusivamente de metadatos que no deban actualizar la actividad de la sesión y `replaceEntry: true` solo cuando la devolución de llamada devuelva una entrada completa y los campos eliminados deban permanecer eliminados. Las rutas de diagnóstico y migración pueden combinar `fallbackEntry`, `skipMaintenance` y `requireWriteSuccess` para realizar una única reparación atómica del almacén canónico.

    `createSessionEntry(...)` crea una nueva fila de sesión canónica y una transcripción. Su superficie de confianza `initialEntry` es deliberadamente limitada: un `agentHarnessId` no vacío, un `modelSelectionLocked: true` opcional y un `pluginExtensions` opcional. El entorno de ejecución inyectado solo acepta identificadores de entornos que pertenezcan al plugin que realiza la llamada mediante `registerAgentHarness(...)`; se trata de una invariante de propiedad, no de un entorno aislado entre plugins dentro del proceso. Rechaza una fila existente; `label` y `spawnedCwd` son campos de creación independientes, no modificaciones de entradas de confianza.

    La creación mantiene el bloqueo de mutación del ciclo de vida de la sesión mediante `afterCreate`, de modo que el trabajo nuevo espera a que finalice la inicialización controlada por el plugin y el trabajo admitido previamente hace que la creación falle. La devolución de llamada recibe un clon del estado creado. Si devuelve una modificación, esta solo puede contener `pluginExtensions`, y su valor es el campo final completo `pluginExtensions`. Un fallo de la devolución de llamada o de la persistencia final revierte la nueva fila sin cambios y la transcripción; la reversión protegida conserva una fila modificada o reclamada simultáneamente. `recoverMatchingInitialEntry: true` sirve únicamente para reintentar una inicialización interrumpida cuando los campos de confianza conservados coinciden exactamente, y la recuperación requiere que `afterCreate` devuelva una modificación final.

    Utilice `runWithWorkAdmission(...)` cuando un plugin inicie trabajo en una sesión persistida. La devolución de llamada rechaza las sesiones archivadas o sustituidas simultáneamente, mantiene coordinadas hasta su finalización las mutaciones de archivado, restablecimiento o eliminación y recibe un `AbortSignal` que debe reenviarse a la ejecución del agente. Un entorno puede nombrar explícitamente delegados de ejecución de confianza mediante su campo de registro experimental `delegatedExecutionPluginIds`. Los delegados solo pueden admitir y ejecutar una sesión existente exacta con el modelo bloqueado; todas las mutaciones de la sesión permanecen restringidas al propietario del entorno. Consulte [Plugins de entornos de agentes](/es/plugins/sdk-agent-harness#delegated-execution).

    Los plugins de mantenimiento y reparación pueden utilizar `deleteSessionEntry(...)` para una entrada de sesión específica, `cleanupSessionLifecycleArtifacts(...)` para sesiones temporales gestionadas por el ciclo de vida y `resolveSessionStoreBackupPaths(...)` antes de modificar un almacén. Estos asistentes son superficies limitadas de reparación y ciclo de vida, no una API general para eliminar almacenes.

    `resolveStorePath(...)` y `updateSessionStoreEntry(...)` completan los auxiliares de sesión: `resolveStorePath` resuelve la ruta del almacén de sesiones para un ámbito determinado, y `updateSessionStoreEntry({ storePath, sessionKey, update })` modifica directamente una entrada mediante la ruta del almacén cuando el invocador ya la conoce.

    `loadTranscriptEventsSync(...)` está disponible para las rutas síncronas de diagnóstico y reparación que no pueden usar el entorno de ejecución asíncrono de transcripciones. Devuelve registros `SessionStoreTranscriptEvent` sin procesar. El código normal del entorno de ejecución de plugins debería preferir `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` y `sqliteSessionFileMarkerMatchesSession(...)` son auxiliares transitorios para el código que aún recibe un campo heredado denominado `sessionFile`. Un marcador de SQLite analizado identifica un destino activo de transcripción en SQLite; no es una ruta del sistema de archivos. Las API nuevas deberían transmitir una identidad de sesión tipada en lugar de cadenas de marcadores.

    Para leer y escribir transcripciones, importe `openclaw/plugin-sdk/session-transcript-runtime` y use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten que los plugins identifiquen una transcripción, lean eventos sin procesar o entradas de mensajes visibles y seguras para ramas, añadan mensajes, publiquen actualizaciones y ejecuten operaciones relacionadas con el mismo bloqueo de escritura de la transcripción sin depender de las rutas de archivos de transcripciones activas. `readVisibleSessionTranscriptMessageEntries(...)` devuelve metadatos de lectura ordenados; su campo `seq` no es un cursor reanudable.

    Los auxiliares heredados para el almacén completo y los archivos de transcripciones activas ya no se exportan desde el SDK de plugins. Use los auxiliares de entradas con ámbito para los metadatos de sesión y los auxiliares de identidad de transcripción para las operaciones de transcripciones activas. Los flujos de trabajo de archivado y asistencia que necesiten artefactos de archivos deberían usar sus superficies de archivado específicas en lugar de las API del entorno de ejecución de sesiones activas.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas del modelo y el proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // p. ej., "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // p. ej., "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Ejecute una finalización de texto administrada por el host sin importar elementos internos del proveedor ni
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
      // Envía y consume por completo la solicitud del proveedor.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` es un contrato estable y genérico del SDK
    para servicios de proveedores. El host resuelve la configuración del proceso desde
    `models.providers.<providerId>.localService`; los invocadores no pueden proporcionar
    un comando, argumentos, entorno ni política de ciclo de vida. La creación de procesos,
    la disponibilidad, los diagnósticos y la política de detención por inactividad permanecen como elementos internos del host.

    Pase el identificador exacto del proveedor configurado y la URL base resuelta de la solicitud. No
    sustituya los alias por un identificador de adaptador: distintos alias pueden apuntar a distintos
    hosts de GPU locales. El host rechaza los endpoints que no coincidan con la URL base
    configurada del proveedor, salvo por la normalización `/v1` que usan los adaptadores de Ollama y LM
    Studio. El host se encarga de la serialización del inicio, las pruebas de disponibilidad,
    las concesiones de solicitudes, la gestión de cancelaciones y el apagado por inactividad.

    El auxiliar usa la misma ruta de preparación de finalizaciones sencillas que el
    entorno de ejecución integrado de OpenClaw y la instantánea de configuración del entorno de ejecución administrada por el host. Los motores de contexto
    reciben una capacidad `llm.complete` vinculada a la sesión, de modo que las llamadas al modelo usan el
    agente de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye la atribución de proveedor, modelo y agente, además del uso normalizado de tokens,
    caché y coste estimado cuando está disponible.

    <Warning>
    Las sustituciones de modelo requieren la aceptación del operador mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Use `plugins.entries.<id>.llm.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Llame a otro método del Gateway dentro del proceso conservando la identidad de confianza
    del entorno de ejecución del plugin actual. Está destinado a plugins integrados u oficiales de confianza que componen
    capacidades del Gateway propias del plugin sin abrir una conexión WebSocket de bucle invertido.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Las solicitudes usan el ámbito `operator.write` y no conceden ámbito de administración. Se rechazan las llamadas de plugins
    externos arbitrarios. Los métodos que fallan generan un `GatewayClientRequestError` y conservan `details`
    estructurado, los metadatos de reintento y el código de error del Gateway para los flujos de recuperación. Use `isAvailable()`
    antes de elegir esta ruta desde herramientas que también puedan ejecutarse en procesos de agente independientes.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie y gestione ejecuciones de subagentes en segundo plano.

    ```typescript
    // Inicia una ejecución de subagente
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Amplía esta consulta para convertirla en búsquedas de seguimiento específicas.",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // sustitución opcional
      model: "gpt-5.6-sol", // sustitución opcional
      deliver: false,
    });

    // Espera a que finalice
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Lee los mensajes de la sesión
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Elimina una sesión
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Las sustituciones de modelo (`provider`/`model`) requieren la aceptación del operador mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins que no sean de confianza pueden seguir ejecutando subagentes, pero se rechazan las solicitudes de sustitución.
    </Warning>

    `toolsAlsoAllow` añade a la superficie normal de herramientas del trabajador las herramientas exactas y de propiedad exclusiva registradas por el plugin invocador. El entorno de ejecución rechaza las herramientas del núcleo y los nombres compartidos con otro plugin. Los perfiles y las políticas de herramientas del operador siguen aplicándose, incluidas las listas explícitas de permitidos y las denegaciones.

    `deleteSession(...)` puede eliminar sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. La eliminación de sesiones arbitrarias de usuarios u operadores sigue requiriendo una solicitud al Gateway con ámbito de administración.

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    Inspeccione la autoridad efectiva del espacio de trabajo aislado para una sesión de agente.

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    El resultado indica si esta sesión está aislada, si su espacio de trabajo
    no está disponible, es de solo lectura o permite escritura, y proporciona un `confinementError`
    opcional cuando la política efectiva de Docker, herramientas, sesión, navegador o elevación puede
    escapar de ese espacio de trabajo. Use esto para las decisiones de delegación administradas por el host que
    no deben conceder a un trabajador más autoridad que a su invocador. Es un auxiliar de
    certificación, no un sustituto de comprobar la autorización del propio invocador.

    `prepareWorkspaceAuthority(...)` realiza la misma comprobación de políticas y también
    prepara el entorno aislado de Docker para `workspaceDir`. Rechaza un contenedor activo
    cuyo hash de configuración en ejecución no coincida con los montajes o la política solicitados. Pase
    únicamente nombres exactos de herramientas cuyas implementaciones registradas estén restringidas por el plugin
    invocador; los prefijos con comodines no demuestran la propiedad de la herramienta.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumere los nodos conectados e invoque un comando del host de un nodo desde el código de un plugin cargado por el Gateway o desde comandos de la CLI del plugin. Use esto cuando un plugin sea responsable de trabajo local en un dispositivo emparejado, por ejemplo un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` incluye los descriptores `nodePluginTools` anunciados
    por cada nodo conectado cuando ese nodo expone al agente herramientas
    respaldadas por plugins o MCP. Esos descriptores representan el estado de la conexión activa: el Gateway
    los descarta cuando el nodo se desconecta, y un nodo puede sustituirlos por
    `node.pluginTools.update` después de que cambie el inventario local de plugins o MCP.

    Dentro del Gateway, este entorno de ejecución funciona en el proceso. En los comandos de la CLI del plugin, llama al Gateway configurado mediante RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar los nodos emparejados desde el terminal. Los comandos de nodo siguen pasando por el emparejamiento normal de nodos del Gateway, las listas de comandos permitidos, las políticas de invocación de nodos de los plugins y la gestión local de comandos del nodo.

    Los plugins que exponen herramientas de agente alojadas en nodos pueden establecer `agentTool.defaultPlatforms` para comandos no peligrosos que deban permitirse de forma predeterminada. Omítalo cuando los operadores deban habilitarlos mediante `gateway.nodes.allowCommands`. Los comandos peligrosos alojados en nodos deberían registrar una política de invocación de nodos con `api.registerNodeInvokePolicy(...)`; la política se ejecuta en el Gateway después de comprobar la lista de comandos permitidos y antes de reenviar el comando al nodo, por lo que las llamadas directas a `node.invoke`, las herramientas de plugins alojadas en nodos y las herramientas de plugins de nivel superior comparten la misma ruta de aplicación.

    <Warning>
    El campo opcional `scopes` solicita ámbitos de operador del Gateway para la invocación. OpenClaw solo lo respeta para plugins integrados e instalaciones de plugins oficiales de confianza; las solicitudes de otros plugins no elevan la llamada. Úselo únicamente cuando un plugin de confianza deba invocar un comando de nodo con un ámbito del Gateway más estricto, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Vincule el estado de Task Flow y Task Run a una clave de sesión existente de OpenClaw o a un contexto de herramienta de confianza.

    - `api.runtime.tasks.managedFlows` admite mutaciones: crear, avanzar y cancelar flujos de tareas.
    - `api.runtime.tasks.flows` y `api.runtime.tasks.runs` son vistas DTO de solo lectura para enumeraciones y consultas de estado; ambas exponen `bindSession(...)` / `fromToolContext(...)`, además de `get`, `list`, `findLatest` y `resolve`.
    - `api.runtime.tasks.flow` es un alias obsoleto de `managedFlows`.

    Task Flow realiza el seguimiento del estado duradero de los flujos de trabajo de varios pasos. No es un planificador:
    use Cron o `api.session.workflow.scheduleSessionTurn(...)` para futuras
    activaciones y, después, use `managedFlows` desde el turno programado cuando ese trabajo
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
      task: "Revisar la solicitud de incorporación de cambios n.º 123",
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

    Use `bindSession({ sessionKey, requesterOrigin })` cuando ya se disponga de una clave de sesión de OpenClaw de confianza procedente de la propia capa de vinculación. No se debe vincular a partir de entradas de usuario sin procesar.

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

    Utiliza la configuración principal `messages.tts` y la selección de proveedor. Devuelve un búfer de audio PCM y la frecuencia de muestreo. `textToSpeechStream` también está disponible para la síntesis en streaming.

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
      mime: "audio/ogg", // opcional, para cuando no se pueda inferir el tipo MIME
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
        { type: "text", text: "Dar preferencia al total impreso frente a las notas manuscritas." },
      ],
      instructions: "Extraer el proveedor, el total y las etiquetas de búsqueda.",
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
    `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    la configuración que ya se haya pasado a la ruta de llamada activa; se debe usar
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

    `mutateConfigFile(...)` y `replaceConfigFile(...)` devuelven un valor
    `followUp`, por ejemplo `{ mode: "restart", requiresRestart: true, reason }`,
    que registra la intención del escritor sin retirar al
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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Alias de compatibilidad obsoleto.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` ejecuta inmediatamente un único ciclo de Heartbeat, omitiendo el temporizador de agrupación normal. Se debe pasar `{ heartbeat: { target: "last" } }` para forzar la entrega al último canal activo en lugar de la supresión predeterminada `target: "none"`.

    `runCommandWithTimeout(...)` devuelve los valores capturados `stdout` y `stderr`, recuentos opcionales
    de truncamiento, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera agotado y de tiempo de espera sin salida agotado indican `code: 124`
    cuando el proceso secundario no proporciona un código de salida distinto de cero. Las salidas
    por señal sin tiempo de espera agotado aún pueden devolver `code: null`, por lo que se deben usar `termination` y
    `noOutputTimedOut` para distinguir los motivos del tiempo de espera agotado.

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

    Los almacenes con claves sobreviven a los reinicios y están aislados por el identificador del plugin vinculado al entorno de ejecución. Se debe usar `registerIfAbsent(...)` para las reservas atómicas de deduplicación: devuelve `true` cuando la clave no existía o había caducado y se registró, o `false` cuando ya existe un valor vigente, sin sobrescribir su valor, hora de creación ni TTL. Límites: `maxEntries` por espacio de nombres, 50,000 filas vigentes por plugin, valores JSON inferiores a 64KB y caducidad TTL opcional. De forma predeterminada, una escritura que alcance cualquiera de los límites de filas descarta las filas vigentes más antiguas del espacio de nombres en el que se escribe; no se expulsan espacios de nombres hermanos para esa escritura, y la escritura sigue fallando si el espacio de nombres no puede liberar suficientes filas. Se debe establecer `overflowPolicy: "reject-new"` para los registros de propiedad duraderos que nunca deban expulsarse: las claves nuevas fallan al alcanzar cualquiera de los límites, mientras que las existentes se pueden seguir actualizando.

    `openSyncKeyedStore<T>(...)` devuelve la misma estructura de almacén con métodos síncronos (`register`, `registerIfAbsent`, `lookup`, `consume` y `clear` devuelven valores directamente en lugar de promesas) para los llamadores que no puedan esperar.

    `openChannelIngressQueue<TPayload>(...)` abre una cola de entrada persistente limitada al plugin que realiza la llamada, para almacenar en búfer eventos entrantes que necesiten procesamiento al menos una vez entre reinicios. Cuando la recuperación de reservas obsoletas utiliza `shouldRecover`, también se debe proporcionar `shouldRecoverCorrupt` si las cargas útiles reservadas dañadas deben ponerse en cuarentena: su identidad de reserva independiente de la carga útil permite que el plugin conserve la política vigente del propietario y del carril antes de que la cola marque la fila como eliminada.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` y `openChannelIngressQueue` solo están disponibles para plugins incluidos y para instalaciones oficiales de plugins de confianza en esta versión.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Ayudantes de tiempo de ejecución específicos del canal (disponibles cuando se carga un plugin de canal). Agrupados por función:

    | Grupo | Propósito |
    | --- | --- |
    | `text` | Fragmentación (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), detección de comandos de control y conversión de tablas Markdown. |
    | `reply` | Envío de respuestas mediante bloques almacenados en búfer, formato de envolturas y resolución de la configuración efectiva de mensajes y retrasos humanos. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, lecturas de listas de permitidos y operaciones de inserción o actualización de solicitudes de emparejamiento. |
    | `media` | Descarga y almacenamiento de medios remotos (véase más adelante). |
    | `activity` | Registrar o leer la última actividad del canal. |
    | `session` | Metadatos de sesión procedentes de eventos entrantes y actualizaciones de la última ruta. |
    | `mentions` | Ayudantes de políticas de menciones (véase más adelante). |
    | `reactions` | Identificadores de reacciones de confirmación para indicadores de procesamiento en curso. |
    | `groups` | Resolución de políticas de grupo y del requisito de mención. |
    | `debounce` | Antirrebote de mensajes entrantes. |
    | `commands` | Autorización de comandos y control de acceso a comandos de texto. |
    | `outbound` | Cargar el adaptador de salida de un canal. |
    | `inbound` | Crear el contexto de eventos entrantes y ejecutar el núcleo compartido de eventos entrantes y respuestas. |
    | `threadBindings` | Ajustar el tiempo de espera por inactividad y la antigüedad máxima de los hilos de sesión vinculados. |
    | `runtimeContexts` | Registrar, leer y observar el contexto local del proceso por canal, cuenta y capacidad. |

    `api.runtime.channel.media` es la superficie recomendada para descargar y almacenar medios de canales:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` cuando una URL remota deba convertirse en un medio de OpenClaw. Use `saveResponseMedia(...)` cuando el plugin ya haya obtenido un `Response` con autenticación, gestión de redirecciones o listas de permitidos propias del plugin. Use `readRemoteMediaBuffer(...)` únicamente cuando el plugin necesite los bytes sin procesar para inspeccionarlos, transformarlos, descifrarlos o volver a cargarlos. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto de `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` es la superficie compartida de políticas de menciones entrantes para los plugins de canal incluidos que utilizan inyección en tiempo de ejecución:

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

    `api.runtime.channel.mentions` no expone intencionadamente los antiguos ayudantes de compatibilidad `resolveMentionGating*`. Es preferible usar la ruta normalizada `{ facts, policy }`.

    Varios campos de `reply`, `session` y `inbound` contienen notas `@deprecated` por campo que apuntan al núcleo actual de turnos de canal o a los adaptadores de salida del canal; consulte el JSDoc integrado del ayudante específico antes de basar código nuevo en él.

  </Accordion>
</AccordionGroup>

## Almacenamiento de referencias de tiempo de ejecución

Use `createPluginRuntimeStore` para almacenar la referencia de tiempo de ejecución y utilizarla fuera de la devolución de llamada `register`:

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
      return store.getRuntime(); // genera una excepción si no está inicializado
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // devuelve null si no está inicializado
    }
    ```

  </Step>
</Steps>

<Note>
Es preferible usar `pluginId` para la identidad del almacén de tiempo de ejecución. La forma de nivel inferior `key` está destinada a casos poco frecuentes en los que un plugin necesita intencionadamente más de una ranura de tiempo de ejecución.
</Note>

## Otros campos de nivel superior de `api`

Además de `api.runtime`, el objeto de la API también proporciona:

<ParamField path="api.id" type="string">
  Identificador del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre para mostrar del plugin.
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
  Modo de carga actual: `"full"` (activación en vivo), `"discovery"` / `"tool-discovery"` (detección de capacidades de solo lectura), `"setup-only"` (entrada de configuración ligera), `"setup-runtime"` (flujo de configuración que también necesita la entrada del canal de tiempo de ejecución) o `"cli-metadata"` (recopilación de metadatos de comandos de la CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolver una ruta relativa a la raíz del plugin.
</ParamField>

## Temas relacionados

- [Aspectos internos de los plugins](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia de subrutas
