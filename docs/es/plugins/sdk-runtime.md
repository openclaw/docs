---
read_when:
    - Necesitas llamar a funciones auxiliares del núcleo desde un plugin (TTS, STT, generación de imágenes, búsqueda web, Gateway, subagente, nodos)
    - Quieres entender qué expone `api.runtime`
    - Estás accediendo a utilidades de configuración, agente o contenido multimedia desde el código del plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- los auxiliares de runtime inyectados disponibles para los plugins
title: Herramientas auxiliares del entorno de ejecución de Plugin
x-i18n:
    generated_at: "2026-07-22T11:04:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 165f8354a480dba8ff1127ed2f79f8bb8f41011ce585987854a9017671ca36cd
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

`api.runtime.version` es la versión actual del producto OpenClaw, obtenida del solucionador de versiones compartido para que los plugins vean el mismo valor que muestra la CLI.

## Carga y escritura de la configuración

Es preferible utilizar la configuración que ya se haya pasado a la ruta de llamada activa, por ejemplo, `api.config` durante el registro o un argumento `cfg` en las devoluciones de llamada de canales o proveedores. Esto permite que una única instantánea del proceso fluya por el trabajo, en lugar de volver a analizar la configuración en rutas críticas.

Utilice `api.runtime.config.current()` únicamente cuando un controlador de larga duración necesite la instantánea actual del proceso y no se haya pasado ninguna configuración a esa función. El valor devuelto es de solo lectura; clónelo o utilice un asistente de mutación antes de editarlo.

Las fábricas de herramientas reciben `ctx.runtimeConfig` junto con `ctx.getRuntimeConfig()`. Utilice el método de obtención dentro de la devolución de llamada `execute` de una herramienta de larga duración cuando la configuración pueda cambiar después de haberse creado la definición de la herramienta.

Conserve los cambios mediante `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Cada escritura debe elegir una política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` permite que el planificador de recarga del Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` fuerza un reinicio limpio cuando quien realiza la escritura sabe que la recarga en caliente no es segura.
- `afterWrite: { mode: "none", reason: "..." }` suprime la recarga o el reinicio automáticos únicamente cuando el llamador se encarga del seguimiento.

Los asistentes de mutación devuelven `afterWrite` junto con un resumen `followUp` tipado, de modo que los llamadores puedan registrar o comprobar si solicitaron un reinicio. El Gateway sigue controlando cuándo se produce realmente ese reinicio.

Utilice `current()`, un `cfg` proporcionado, `mutateConfigFile(...)` o
`replaceConfigFile(...)` para acceder a la configuración en tiempo de ejecución y escribirla.

Para las importaciones directas del SDK, prefiera las subrutas específicas de configuración al amplio módulo de compatibilidad `openclaw/plugin-sdk/config-runtime`: `config-contracts` para los tipos, `runtime-config-snapshot` para las instantáneas actuales del proceso y `config-mutation` para las escrituras. Lea los valores cuyo ámbito sea la entrada desde `api.pluginConfig`; utilice un contexto de herramienta proporcionado únicamente para su instantánea de configuración de todo el entorno de ejecución y mantenga la combinación específica del plugin en ese límite. Las pruebas de plugins incluidos deben simular directamente estas subrutas específicas en lugar de simular el amplio módulo de compatibilidad.

El código interno del entorno de ejecución de OpenClaw sigue el mismo enfoque: carga la configuración una vez en el límite de la CLI, del Gateway o del proceso y, a continuación, pasa ese valor. Las escrituras de mutación correctas actualizan la instantánea del entorno de ejecución del proceso y avanzan su revisión interna; las cachés de larga duración deben utilizar como clave la clave de caché propiedad del entorno de ejecución, en lugar de serializar la configuración localmente. Los módulos de entorno de ejecución de larga duración cuentan con un analizador de tolerancia cero para las llamadas ambientales a `loadConfig()`; utilice un `cfg` proporcionado, un `context.getRuntimeConfig()` de solicitud o `getRuntimeConfig()` en un límite explícito del proceso.

Las rutas de ejecución de proveedores y canales deben utilizar la instantánea activa de la configuración en tiempo de ejecución, no una instantánea del archivo devuelta para leer o editar la configuración. Las instantáneas del archivo conservan valores de origen, como los marcadores SecretRef, para la interfaz de usuario y las escrituras; las devoluciones de llamada de proveedores necesitan la vista resuelta del entorno de ejecución. Cuando un asistente pueda recibir la instantánea activa del origen o la instantánea activa del entorno de ejecución, canalice el acceso mediante `selectApplicableRuntimeConfig()` antes de leer las credenciales.

## Utilidades reutilizables del entorno de ejecución

Utilice los datos `botLoopProtection` entrantes para los mensajes entrantes creados por bots. El núcleo aplica la protección compartida de ventana deslizante en memoria antes de registrar la sesión y realizar el envío, sin vincular la política a un canal concreto. La protección realiza el seguimiento de las claves `(scopeId, conversationId, participant pair)`, contabiliza conjuntamente ambas direcciones de un par, aplica un periodo de espera cuando se supera el límite de la ventana y elimina de manera oportunista las entradas inactivas.

Los plugins de canal que expongan este comportamiento a los operadores deben utilizar preferentemente la estructura compartida `channels.defaults.botLoopProtection` para los límites de referencia y, a continuación, superponer las anulaciones específicas del canal o proveedor. La configuración compartida utiliza segundos porque está orientada al usuario:

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

Utilice `openclaw/plugin-sdk/pair-loop-guard-runtime` directamente solo para bucles de eventos personalizados
entre dos partes que no pasen por el ejecutor compartido de respuestas entrantes.

## Espacios de nombres del entorno de ejecución

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidad, directorios y gestión de sesiones del agente.

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

    `runEmbeddedAgent(...)` es el asistente neutral para iniciar un turno normal de un agente de OpenClaw desde el código de un plugin. Utiliza la misma resolución de proveedor y modelo, así como la misma selección del arnés del agente, que las respuestas activadas por canales.

    `runEmbeddedPiAgent(...)` se mantiene como alias de compatibilidad obsoleto para los plugins existentes. El código nuevo debe utilizar `runEmbeddedAgent(...)`.

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` comparte con los llamadores que optan por incluir ejecuciones integradas en `cliBackendDispatch: "subscription-auth"` la decisión de envío al backend de la CLI del ejecutor integrado (la ruta, la capacidad `subscriptionAuthDispatch` declarada por el backend y el modo de credenciales almacenado, respetando un `authProfileId` fijado explícitamente). Devuelve `{ provider }` cuando la ejecución se realizaría mediante el backend de la CLI y `undefined` cuando permanece en el paso directo, de modo que los llamadores puedan asignar tiempos de espera a la ejecución que se realizará realmente.

    `resolveThinkingPolicy(...)` devuelve los niveles de razonamiento compatibles con el proveedor o modelo y un valor predeterminado opcional. Los plugins de proveedor controlan el perfil específico del modelo mediante sus enlaces de razonamiento, por lo que los plugins de herramientas deben llamar a este asistente del entorno de ejecución en lugar de importar o duplicar listas de proveedores.

    `normalizeThinkingLevel(...)` convierte texto del usuario como `on`, `x-high` o `extra high` al nivel canónico almacenado antes de compararlo con la política resuelta.

    Los **asistentes del almacén de sesiones** se encuentran en `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterar por las filas de sesión sin depender de la estructura sessions.json heredada.
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

    Utilice preferentemente `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` para los flujos de trabajo de sesiones. Estos asistentes identifican las sesiones mediante la identidad del agente y de la sesión, para que los plugins no dependan de la estructura de almacenamiento heredada `sessions.json`. Utilice `preserveActivity: true` para las modificaciones únicamente de metadatos que no deban actualizar la actividad de la sesión y `replaceEntry: true` solo cuando la devolución de llamada devuelva una entrada completa y los campos eliminados deban permanecer eliminados. Las rutas de Doctor y migración pueden combinar `fallbackEntry`, `skipMaintenance` y `requireWriteSuccess` para realizar una reparación atómica del almacén canónico.

    `createSessionEntry(...)` crea una nueva fila de sesión canónica y su transcripción. Su superficie `initialEntry` de confianza es deliberadamente limitada: un `agentHarnessId` no vacío, un `modelSelectionLocked: true` opcional y un `pluginExtensions` opcional. El entorno de ejecución inyectado solo acepta identificadores de arneses que pertenezcan al plugin llamador mediante `registerAgentHarness(...)`; se trata de una invariancia de propiedad, no de un entorno aislado entre plugins que se ejecutan en el mismo proceso. Rechaza las filas existentes; `label` y `spawnedCwd` son campos de creación independientes, no modificaciones de entradas de confianza.

    La creación mantiene la barrera de mutación del ciclo de vida de la sesión mediante `afterCreate`, por lo que el trabajo nuevo espera a que finalice la inicialización propiedad del plugin y el trabajo admitido previamente hace que la creación falle. La devolución de llamada recibe un clon del estado creado. Si devuelve una modificación, esta solo puede contener `pluginExtensions`, y su valor es el campo `pluginExtensions` final completo. Si falla una devolución de llamada o la persistencia final, se revierten la nueva fila sin cambios y su transcripción; la reversión protegida conserva una fila modificada o reclamada simultáneamente. `recoverMatchingInitialEntry: true` solo sirve para reintentar una inicialización interrumpida cuando los campos de confianza conservados coinciden exactamente, y la recuperación requiere que `afterCreate` devuelva una modificación final.

    Utilice `runWithWorkAdmission(...)` cuando un plugin inicie trabajo en una sesión persistida. La devolución de llamada rechaza sesiones archivadas o sustituidas simultáneamente, mantiene coordinadas hasta su finalización las mutaciones de archivado, restablecimiento o eliminación y recibe un `AbortSignal` que debe pasarse a la ejecución del agente. Un arnés puede nombrar explícitamente delegados de ejecución de confianza mediante su campo de registro experimental `delegatedExecutionPluginIds`. Los delegados solo pueden admitir y ejecutar una sesión existente exacta con el modelo bloqueado; todas las mutaciones de la sesión siguen restringidas al propietario del arnés. Consulte [Plugins de arnés de agente](/es/plugins/sdk-agent-harness#delegated-execution).

    Los plugins de mantenimiento y reparación pueden usar `deleteSessionEntry(...)` para una entrada de sesión con un ámbito determinado, `cleanupSessionLifecycleArtifacts(...)` para sesiones temporales administradas por el ciclo de vida y `resolveSessionStoreBackupPaths(...)` antes de modificar un almacén. Pase `expectedSessionId` y `expectedUpdatedAt` cuando la eliminación no deba entrar en conflicto con una actualización simultánea de la sesión; use `expectedSessionId: null` cuando la instantánea anterior no tuviera id. de sesión. Estos auxiliares son superficies específicas de reparación y ciclo de vida, no una API general para eliminar datos del almacén.

    `resolveStorePath(...)` y `updateSessionStoreEntry(...)` completan los auxiliares de sesión: `resolveStorePath` resuelve la ruta del almacén de sesiones para un ámbito determinado y `updateSessionStoreEntry({ storePath, sessionKey, update })` modifica directamente una entrada mediante la ruta del almacén cuando el llamador ya la conoce.

    `loadTranscriptEventsSync(...)` está disponible para las rutas síncronas de diagnóstico y reparación que no pueden usar el entorno de ejecución asíncrono de transcripciones. Devuelve registros `SessionStoreTranscriptEvent` sin procesar. El código normal del entorno de ejecución de los plugins debe usar preferentemente `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` y `sqliteSessionFileMarkerMatchesSession(...)` son auxiliares de transición para el código que aún recibe un campo heredado denominado `sessionFile`. Un marcador de SQLite analizado identifica un destino de transcripción activo en SQLite; no es una ruta del sistema de archivos. Las API nuevas deben transportar una identidad de sesión tipada en lugar de cadenas de marcadores.

    Para leer y escribir transcripciones, importe `openclaw/plugin-sdk/session-transcript-runtime` y use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Estas API permiten a los plugins identificar una transcripción, leer eventos sin procesar o entradas de mensajes visibles y seguras para la rama, añadir mensajes, publicar actualizaciones y ejecutar operaciones relacionadas bajo el mismo bloqueo de escritura de la transcripción, sin depender de las rutas de los archivos de transcripción activos. `readVisibleSessionTranscriptMessageEntries(...)` devuelve metadatos de lectura ordenados; su campo `seq` no es un cursor reanudable.

    `readSessionTranscriptRawDelta(...)` devuelve un resultado acotado `page`, `reset` o `missing`. Pase el valor opaco `page.cursor` a la siguiente llamada. Las adiciones puras conservan el cursor, mientras que la sustitución de la transcripción devuelve `reset` con un nuevo cursor de inicialización. Las páginas tienen de forma predeterminada 1,000 eventos y 1,000,000 bytes serializados; los llamadores pueden solicitar hasta 10,000 eventos y 64 MiB. Cuando solo el siguiente evento supera `maxBytes`, la página está vacía e indica `requiredBytes`; vuelva a intentarlo con al menos ese límite de bytes cuando no sea superior a 64 MiB. Los eventos individuales más grandes requieren la API de lectura completa. Un cursor solo identifica una posición y nunca concede acceso a otra sesión.

    `readSessionTranscriptVisibleMessageDelta(...)` proporciona la misma estructura acotada de inicialización y reanudación sobre la proyección activa de mensajes administrada por el host. Devuelve los mensajes del más antiguo al más reciente, de modo que los motores de contexto puedan consumir el historial inicial y conservar el cursor opaco como su marca de agua. Almacene y devuelva el cursor sin modificarlo; es una indicación de continuación, no una credencial de autorización. Las adiciones lineales se reanudan después del último mensaje devuelto. La sustitución de la transcripción, un cursor cuyo anclaje haya salido de la rama activa o se haya desplazado dentro de ella, los cursores con formato incorrecto y los cursores de otras sesiones devuelven `reset` con un nuevo cursor de inicialización. Los valores predeterminados y los límites de cantidad y bytes coinciden con los de la API de deltas sin procesar. Mientras se reconstruye la proyección activa tras un cambio de rama, el resultado es `unavailable` con el motivo `projection_rebuilding`; vuelva a intentarlo más tarde en lugar de recurrir a un archivo de transcripción activo.

    Los auxiliares heredados para todo el almacén y para los archivos de transcripción activos ya no se exportan desde el SDK de plugins. Use los auxiliares de entradas con ámbito para los metadatos de sesión y los auxiliares de identidad de transcripciones para las operaciones de transcripciones activas. Los flujos de trabajo de archivo y soporte que necesiten artefactos de archivos deben usar sus superficies de archivo específicas en lugar de las API del entorno de ejecución de sesiones activas.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes predeterminadas de modelo y proveedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // p. ej., "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // p. ej., "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Ejecute una finalización de texto administrada por el host sin importar componentes internos del proveedor ni
    duplicar la preparación del modelo, la autenticación o la URL base de OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Resume esta transcripción." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
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

    `acquireLocalService(...)` es un contrato estable y genérico del SDK para servicios
    de proveedores. El host resuelve la configuración del proceso desde
    `models.providers.<providerId>.localService`; los llamadores no pueden proporcionar un
    comando, argumentos, entorno ni política de ciclo de vida. La creación de procesos,
    la preparación, los diagnósticos y la política de detención por inactividad siguen siendo internos del host.

    Pase el id. exacto del proveedor configurado y la URL base resuelta de la solicitud. No
    sustituya los alias por el id. de un adaptador: distintos alias pueden apuntar a distintos
    hosts de GPU locales. El host rechaza los endpoints que no coincidan con la URL base
    configurada del proveedor, salvo la normalización `/v1` utilizada por los adaptadores
    de Ollama y LM Studio. El host administra la serialización del inicio, las comprobaciones de preparación,
    las asignaciones de solicitudes, la gestión de cancelaciones y el apagado por inactividad.

    El auxiliar usa la misma ruta de preparación de finalizaciones simples que el
    entorno de ejecución integrado de OpenClaw y la instantánea de configuración del entorno de ejecución administrada por el host. Los motores de contexto
    reciben una capacidad `llm.complete` vinculada a la sesión, por lo que las llamadas al modelo usan el
    agente de la sesión activa y no recurren silenciosamente al agente predeterminado. El
    resultado incluye la atribución de proveedor, modelo y agente, además del uso normalizado de tokens,
    caché y coste estimado cuando está disponible.

    Establezca `reasoning` para solicitar un esfuerzo de razonamiento para el modelo seleccionado. El
    host normaliza los niveles de razonamiento canónicos (`off`, `minimal`, `low`,
    `medium`, `high`, `xhigh`, `adaptive`, `max` y `ultra`) para el
    proveedor y el modelo seleccionados antes de enviar la finalización. `adaptive` se convierte en
    `medium`; `max` y `ultra` se convierten en `max` cuando se admite; de lo contrario, en `xhigh`.

    <Warning>
    Las anulaciones del modelo requieren que el operador las habilite mediante `plugins.entries.<id>.llm.allowModelOverride: true` en la configuración. Use `plugins.entries.<id>.llm.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos. Las finalizaciones entre agentes requieren `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Llame a otro método del Gateway dentro del proceso y conserve la identidad de confianza del entorno de ejecución
    del plugin actual. Esto está destinado a plugins integrados u oficiales de confianza que combinan capacidades
    del Gateway administradas por plugins sin abrir una conexión WebSocket de bucle invertido.

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
    externos arbitrarios. Los métodos fallidos generan un `GatewayClientRequestError` y conservan los datos estructurados
    `details`, los metadatos de reintento y el código de error del Gateway para los flujos de recuperación. Use `isAvailable()`
    antes de elegir esta ruta desde herramientas que también puedan ejecutarse en procesos de agentes independientes.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie y administre ejecuciones de subagentes en segundo plano.

    ```typescript
    // Iniciar una ejecución de subagente
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Amplía esta consulta para generar búsquedas de seguimiento específicas.",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // anulación opcional
      model: "gpt-5.6-sol", // anulación opcional
      deliver: false,
    });

    // Esperar a que finalice
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Leer los mensajes de la sesión
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
    Las anulaciones del modelo (`provider`/`model`) requieren que el operador las habilite mediante `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración. Los plugins que no son de confianza pueden ejecutar subagentes, pero se rechazan las solicitudes de anulación.
    </Warning>

    `toolsAlsoAllow` añade a la superficie normal de herramientas del proceso de trabajo las herramientas exactas y de propiedad exclusiva registradas por el plugin llamador. El entorno de ejecución rechaza las herramientas del núcleo y los nombres compartidos con otro plugin. Se siguen aplicando los perfiles y las políticas de herramientas del operador, incluidas las listas explícitas de elementos permitidos y denegados.

    `deleteSession(...)` puede eliminar las sesiones creadas por el mismo plugin mediante `api.runtime.subagent.run(...)`. Para eliminar sesiones arbitrarias de usuarios u operadores, sigue siendo necesaria una solicitud del Gateway con ámbito de administración.

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    Inspeccione la autoridad efectiva del espacio de trabajo del entorno aislado para una sesión de agente.

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

    El resultado indica si esta sesión está en un entorno aislado, si su espacio de trabajo
    no está disponible, es de solo lectura o permite escritura, y un `confinementError` opcional
    cuando la política efectiva de Docker, herramientas, sesiones, navegador o privilegios elevados puede
    escapar de ese espacio de trabajo. Use esto para las decisiones de delegación administradas por el host que
    no deben conceder a un proceso de trabajo más autoridad que la de su llamador. Es un auxiliar de certificación,
    no un sustituto de la comprobación de la propia autorización del llamador.

    `prepareWorkspaceAuthority(...)` realiza la misma comprobación de políticas y también
    prepara el entorno aislado de Docker para `workspaceDir`. Rechaza un contenedor activo
    cuyo hash de configuración actual no coincida con los montajes o la política solicitados. Pase
    únicamente los nombres exactos de las herramientas cuyas implementaciones registradas confine el plugin
    llamador; los prefijos con comodines no demuestran la propiedad de una herramienta.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Enumere los nodos conectados e invoque un comando del host de un nodo desde el código de un plugin cargado por el Gateway o desde comandos de la CLI del plugin. Use esta opción cuando un plugin administre trabajo local en un dispositivo emparejado, por ejemplo, un puente de navegador o audio en otro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` incluye los descriptores `nodePluginTools`
    anunciados por cada nodo conectado cuando ese nodo expone al agente herramientas
    respaldadas por plugins o MCP. Esos descriptores representan el estado de la conexión activa: el Gateway
    los descarta cuando el nodo se desconecta, y un nodo puede sustituirlos por
    `node.pluginTools.update` tras cambios en el inventario local de plugins o MCP.

    Dentro del Gateway, este entorno de ejecución está en proceso. En los comandos de la CLI del plugin, llama al Gateway configurado mediante RPC, por lo que comandos como `openclaw googlemeet recover-tab` pueden inspeccionar los nodos emparejados desde el terminal. Los comandos de Node siguen pasando por el emparejamiento normal de nodos del Gateway, las listas de comandos permitidos, las políticas de invocación de nodos del plugin y el procesamiento local de comandos del nodo.

    Los plugins que exponen herramientas de agente alojadas en nodos pueden establecer `agentTool.defaultPlatforms` para los comandos no peligrosos que deban incluirse de forma predeterminada en la lista de permitidos. Omítalo cuando los operadores deban habilitarlos explícitamente con `gateway.nodes.commands.allow`. Los comandos peligrosos del host del nodo deben registrar una política de invocación de nodos con `api.registerNodeInvokePolicy(...)`; la política se ejecuta en el Gateway después de comprobar la lista de comandos permitidos y antes de reenviar el comando al nodo, de modo que las llamadas directas a `node.invoke`, las herramientas de plugins alojadas en nodos y las herramientas de plugins de nivel superior compartan la misma ruta de aplicación.

    <Warning>
    El campo opcional `scopes` solicita ámbitos de operador del Gateway para la invocación. OpenClaw solo lo respeta para los plugins incluidos y las instalaciones de plugins oficiales de confianza; las solicitudes de otros plugins no elevan los privilegios de la llamada. Úselo únicamente cuando un plugin de confianza deba invocar un comando de nodo con un ámbito del Gateway más estricto, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Vincula el estado de Task Flow y Task Run con una clave de sesión existente de OpenClaw o con un contexto de herramienta de confianza.

    - `api.runtime.tasks.managedFlows` permite realizar mutaciones: crear, avanzar y cancelar Task Flows.
    - `api.runtime.tasks.flows` y `api.runtime.tasks.runs` son vistas DTO de solo lectura para realizar listados y consultas de estado; ambas exponen `bindSession(...)` / `fromToolContext(...)`, además de `get`, `list`, `findLatest` y `resolve`.

    Task Flow mantiene el estado duradero de los flujos de trabajo de varios pasos. No es un planificador:
    use Cron o `api.session.workflow.scheduleSessionTurn(...)` para activaciones
    futuras y, a continuación, use `managedFlows` desde el turno programado cuando ese trabajo
    necesite el estado del flujo, tareas secundarias, esperas o cancelación.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Revisar nuevos pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Revisar el PR #123",
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

    Use `bindSession({ sessionKey, requesterOrigin })` cuando ya disponga de una clave de sesión de confianza de OpenClaw procedente de su propia capa de vinculación. No realice la vinculación a partir de entradas sin procesar del usuario.

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

    Utiliza la configuración principal `tts` y la selección de proveedor. Devuelve un búfer de audio PCM y la frecuencia de muestreo. `textToSpeechStream` también está disponible para la síntesis en streaming.

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
      mime: "audio/ogg", // opcional, cuando no se puede inferir el tipo MIME
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
    // Incluya al menos una imagen; las entradas de texto aportan contexto complementario.
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
        { type: "text", text: "Prioriza el total impreso sobre las notas manuscritas." },
      ],
      instructions: "Extrae el proveedor, el total y las etiquetas de búsqueda.",
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
      prompt: "Una toma de dron sobrevolando una costa al amanecer",
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
    Instantánea de la configuración actual del entorno de ejecución y escrituras transaccionales de configuración. Se recomienda usar
    la configuración que ya se haya pasado a la ruta de llamada activa; use
    `current()` únicamente cuando el controlador necesite acceder directamente a la instantánea del proceso.

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

    `runHeartbeatOnce(...)` ejecuta inmediatamente un único ciclo de Heartbeat, omitiendo el temporizador normal de fusión. Pase `{ heartbeat: { target: "last" } }` para forzar la entrega al último canal activo en lugar de aplicar la supresión predeterminada `target: "none"`.

    `runCommandWithTimeout(...)` devuelve los valores capturados de `stdout` y `stderr`, recuentos opcionales
    de truncamiento, `code`, `signal`, `killed`, `termination` y
    `noOutputTimedOut`. Los resultados de tiempo de espera y de tiempo de espera sin salida informan de `code: 124`
    cuando el proceso secundario no proporciona un código de salida distinto de cero. Las salidas
    por señal sin tiempo de espera también pueden devolver `code: null`, por lo que deben usarse `termination` y
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
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    Los almacenes con clave sobreviven a los reinicios y están aislados por el identificador del plugin vinculado al entorno de ejecución. Use `registerIfAbsent(...)` para las reclamaciones atómicas de deduplicación: devuelve `true` cuando la clave no existía o había caducado y se registró, o `false` cuando ya existe un valor vigente, sin sobrescribir su valor, hora de creación ni TTL. Use `deleteIf(...)` cuando la limpieza deba eliminar únicamente el valor observado anteriormente; su predicado síncrono y la eliminación se ejecutan en una sola transacción de SQLite. Límites: `maxEntries` por espacio de nombres, 50,000 filas vigentes por plugin, valores JSON inferiores a 64KB y caducidad TTL opcional. De forma predeterminada, una escritura que alcanza cualquiera de los límites de filas descarta las filas vigentes más antiguas del espacio de nombres en el que se escribe; los espacios de nombres hermanos no se desalojan para esa escritura, y la escritura falla igualmente si el espacio de nombres no puede liberar suficientes filas. Establezca `overflowPolicy: "reject-new"` para los registros de propiedad duraderos que nunca deban desalojarse: las claves nuevas fallan al alcanzar cualquiera de los límites, mientras que las existentes siguen pudiendo actualizarse.

    `openSyncKeyedStore<T>(...)` devuelve la misma estructura de almacén con métodos síncronos (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume` y `clear` devuelven los valores directamente en lugar de promesas) para los llamadores que no pueden esperar.

    `openBlobStore<TMetadata>(...)` almacena cargas binarias acotadas en SQLite compartido, sin base64 ni archivos auxiliares. Requiere límites de bytes por entrada y por espacio de nombres, además de límites de filas; copia las matrices de bytes en el límite de la API; y enumera los metadatos sin cargar todos los BLOB. `register(...)` es una operación explícita de inserción o actualización, incluso para claves caducadas. `registerIfAbsent(...)` proporciona una creación segura frente a colisiones: una clave caducada permanece ocupada hasta que su propietario la reclama mediante `deleteExpiredKey(key)` o `deleteExpired()`, lo que conserva los metadatos necesarios para eliminar los artefactos relacionados con nombre después de confirmar la transacción de SQLite. Cualquier fila con TTL es transitoria y queda excluida de la copia de seguridad y la restauración incluso antes de caducar; omita el TTL para el estado duradero y restaurable. Los fusibles del host limitan cada BLOB a 100 MiB, cada plugin a 512 MiB de BLOB almacenados físicamente y cada plugin a 50,000 filas almacenadas físicamente, incluidas las filas caducadas pendientes de limpieza por parte del propietario. Use `registerIfAbsent(...)` con `overflowPolicy: "reject-new"` cuando las materializaciones externas no deban quedar huérfanas silenciosamente debido a una sustitución o un desalojo.

    `openChannelIngressQueue<TPayload>(...)` abre una cola de entrada persistente, limitada al plugin que realiza la llamada, para almacenar temporalmente eventos entrantes que requieren procesamiento al menos una vez entre reinicios. Cuando la recuperación de reclamaciones obsoletas use `shouldRecover`, proporcione también `shouldRecoverCorrupt` si las cargas reclamadas dañadas deben ponerse en cuarentena: su identidad de reclamación independiente de la carga permite que el plugin conserve las políticas vigentes de propietario y carril antes de que la cola marque la fila como eliminada.

    `withLease(...)` serializa el trabajo cooperativo de los plugins entre procesos de OpenClaw. Elija `database: { scope: "shared" }` para un único propietario global o `{ scope: "agent", agentId }` para una propiedad independiente por agente. Reenvíe el `AbortSignal` de la función de devolución de llamada a cada operación que pueda fallar. `assertOwned()` es un punto de control en un instante concreto antes de iniciar otro paso importante; el host también verifica la propiedad después de la función de devolución de llamada. La pérdida del arrendamiento o la cancelación por parte del llamador interrumpen la señal. Las esperas de adquisición y los Heartbeat se producen fuera de las transacciones síncronas breves de SQLite; los plugins nunca reciben rutas ni identificadores de bases de datos. Se trata de cancelación cooperativa, no de un token de aislamiento ni de autorización para escrituras externas sin aislamiento.

    `openChannelIngressDrain(...)` abre el trabajador principal independiente del canal sobre esa cola (o crea una cuando no se proporciona ninguna). El drenaje se encarga de la recuperación de reclamaciones obsoletas, la serialización de reclamaciones por carril, la finalización al adoptar o al devolver el envío, la disposición para reintentos o mensajes fallidos, la sustitución opcional previa a la adopción y el tiempo de espera por bloqueo entre la reclamación y la adopción. Conecte la propiedad de la reclamación con la generación de respuestas mediante `turnAdoptionLifecycle` (a través de `bindIngressLifecycleToReplyOptions` desde `plugin-sdk/channel-outbound`). Los plugins de canal conservan el encolado del lado de la aceptación, la derivación del carril, la clasificación de elementos no reintentables y cualquier política de autorización de sustitución.

    <Warning>
    `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue` y `openChannelIngressDrain` solo están disponibles para los plugins incluidos y las instalaciones de plugins oficiales de confianza en esta versión.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Ayudantes del entorno de ejecución específicos del canal (disponibles cuando se carga un plugin de canal). Agrupados por función:

    | Grupo | Propósito |
    | --- | --- |
    | `text` | División en fragmentos (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), detección de comandos de control y conversión de tablas de Markdown. |
    | `reply` | Envío de respuestas por bloques almacenados en búfer, formato de envoltorios y resolución de la configuración efectiva de mensajes y retraso humano. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, lecturas y eliminaciones de listas de permitidos, inserciones o actualizaciones de solicitudes de emparejamiento y entradas de aprobación derivadas de solicitudes. |
    | `media` | Descarga y almacenamiento de contenido multimedia remoto (véase más adelante). |
    | `activity` | Registrar y leer la última actividad del canal. |
    | `session` | Metadatos de sesión de eventos entrantes y actualizaciones de la última ruta. |
    | `mentions` | Ayudantes de políticas de menciones (véase más adelante). |
    | `reactions` | Identificadores de reacciones de confirmación para indicadores de procesamiento en curso. |
    | `groups` | Resolución de políticas de grupo y del requisito de mención. |
    | `debounce` | Supresión de rebotes de mensajes entrantes. |
    | `commands` | Autorización de comandos y control de acceso a comandos de texto. |
    | `outbound` | Cargar el adaptador de salida de un canal. |
    | `inbound` | Crear el contexto del evento entrante y ejecutar el núcleo compartido de eventos entrantes y respuestas. |
    | `threadBindings` | Ajustar el tiempo de espera de inactividad y la antigüedad máxima de los hilos de sesión vinculados. |
    | `runtimeContexts` | Registrar, leer y observar el contexto local del proceso por canal, cuenta y capacidad. |

    `api.runtime.channel.media` es la superficie preferida para descargar y almacenar contenido multimedia de canales:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` cuando una URL remota deba convertirse en contenido multimedia de OpenClaw. Use `saveResponseMedia(...)` cuando el plugin ya haya obtenido un `Response` con autenticación, redirecciones o gestión de listas de permitidos propias del plugin. Use `readRemoteMediaBuffer(...)` únicamente cuando el plugin necesite los bytes sin procesar para inspeccionarlos, transformarlos, descifrarlos o volver a cargarlos. `fetchRemoteMedia(...)` sigue siendo un alias de compatibilidad obsoleto de `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` es la superficie compartida de políticas de menciones entrantes para los plugins de canal incluidos que usan inyección en el entorno de ejecución:

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

    Use la ruta normalizada `{ facts, policy }` para tomar decisiones sobre menciones.

    Varios campos de `reply`, `session` y `inbound` contienen notas `@deprecated` por campo que apuntan al núcleo actual del turno del canal o a los adaptadores de salida del canal; consulte la documentación JSDoc en línea del ayudante específico antes de crear código nuevo basado en él.

  </Accordion>
</AccordionGroup>

## Almacenamiento de referencias del entorno de ejecución

Use `createPluginRuntimeStore` para almacenar la referencia del entorno de ejecución y usarla fuera de la función de devolución de llamada `register`:

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
Use preferentemente `pluginId` para la identidad del almacén del entorno de ejecución. La forma de nivel inferior `key` está destinada a casos poco habituales en los que un plugin necesita intencionadamente más de una ranura del entorno de ejecución.
</Note>

## Otros campos `api` de nivel superior

Además de `api.runtime`, el objeto de la API también proporciona:

<ParamField path="api.id" type="string">
  Identificador del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nombre para mostrar del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantánea de la configuración actual (instantánea activa del entorno de ejecución en memoria cuando está disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuración específica del plugin de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Registrador limitado al ámbito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carga actual: `"full"` (activación en vivo), `"discovery"` / `"tool-discovery"` (detección de capacidades de solo lectura), `"setup-only"` (entrada de configuración ligera), `"setup-runtime"` (flujo de configuración que también necesita la entrada del canal del entorno de ejecución) o `"cli-metadata"` (recopilación de metadatos de comandos de la CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resuelve una ruta relativa a la raíz del plugin.
</ParamField>

## Temas relacionados

- [Componentes internos de los plugins](/es/plugins/architecture) — modelo de capacidades y registro
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia de subrutas
