---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Está actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-04T10:28:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ha pasado de una capa amplia de compatibilidad con versiones anteriores a una arquitectura moderna de plugins con importaciones enfocadas y documentadas. Si tu plugin se creó antes de la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema de plugins anterior proporcionaba dos superficies totalmente abiertas que permitían a los plugins importar todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - una única importación que reexportaba decenas de helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se construía la nueva arquitectura de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un barrel amplio de helpers de runtime que mezclaba eventos del sistema, estado de Heartbeat, colas de entrega, helpers de fetch/proxy, helpers de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un barrel amplio de compatibilidad de configuración que todavía conserva helpers directos de carga/escritura obsoletos durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a helpers del host, como el ejecutor de agente integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook de extensión empaquetada, exclusivo del ejecutor integrado y eliminado, que podía observar eventos del ejecutor integrado como `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Todavía funcionan en runtime, pero los plugins nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima versión mayor las elimine. La API de registro de fábricas de extensión exclusiva del ejecutor integrado se eliminó; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo cambio que introduce un reemplazo. Los cambios que rompen contratos deben pasar primero por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia. Eso aplica a importaciones del SDK, campos de manifiesto, APIs de configuración, hooks y comportamiento de registro en runtime.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión mayor.
  Los plugins que todavía importen desde estas superficies dejarán de funcionar cuando eso ocurra.
  Los registros heredados de fábricas de extensión integradas ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** - importar un helper cargaba decenas de módulos no relacionados
- **Dependencias circulares** - las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** - no había forma de saber qué exportaciones eran estables frente a internas

El SDK moderno de plugins soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño, autónomo, con un propósito claro y un contrato documentado.

Las superficies heredadas de conveniencia de proveedores para canales empaquetados también desaparecieron. Las superficies helper con marca de canal eran atajos privados del monorepo, no contratos estables de plugins. Usa subrutas genéricas y estrechas del SDK en su lugar. Dentro del workspace de plugins empaquetados, mantén los helpers propiedad del proveedor en el propio `api.ts` o `runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene helpers de streaming específicos de Claude en su propia superficie `api.ts` / `contract-api.ts`
- OpenAI mantiene constructores de proveedor, helpers de modelo predeterminado y constructores de proveedor en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y los helpers de onboarding/configuración en su propio `api.ts`

## Plan de migración de Talk y voz en tiempo real

El código de Talk para voz en tiempo real, telefonía, reuniones y navegador se está moviendo desde la contabilidad de turnos local de cada superficie a un controlador compartido de sesiones Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El nuevo controlador posee el sobre común de eventos Talk, el estado del turno activo, el estado de captura, el estado de audio de salida, el historial reciente de eventos y el rechazo de turnos obsoletos. Los plugins de proveedor deben seguir siendo dueños de las sesiones en tiempo real específicas del proveedor; los plugins de superficie deben seguir siendo dueños de las particularidades de captura, reproducción, telefonía y reuniones.

Esta migración de Talk es intencionalmente una ruptura limpia:

1. Mantén las primitivas compartidas de controlador/runtime en
   `plugin-sdk/realtime-voice`.
2. Mueve las superficies empaquetadas al controlador compartido: relay de navegador,
   handoff de sala administrada, tiempo real de llamada de voz, STT en streaming de llamada de voz, Google
   Meet en tiempo real y push-to-talk nativo.
3. Reemplaza las antiguas familias RPC de Talk con la API final `talk.session.*` y
   `talk.client.*`.
4. Anuncia un único canal de eventos Talk en vivo en Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina el antiguo endpoint HTTP de tiempo real y cualquier ruta de sobrescritura de instrucciones en tiempo de solicitud.

El código nuevo no debería llamar directamente a `createTalkEventSequencer(...)` salvo que esté implementando un adaptador de bajo nivel o un fixture de prueba. Prefiere el controlador compartido para que los eventos con alcance de turno no puedan emitirse sin un id de turno, las llamadas obsoletas `turnEnd` / `turnCancel` no puedan borrar un turno activo más nuevo, y los eventos del ciclo de vida del audio de salida se mantengan consistentes entre telefonía, reuniones, relay de navegador, handoff de sala administrada y clientes Talk nativos.

La forma objetivo de la API pública es:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Las sesiones WebRTC/websocket de proveedor propiedad del navegador usan `talk.client.create`, porque el navegador posee la negociación con el proveedor y el transporte de medios mientras el Gateway posee las credenciales, instrucciones y política de herramientas. `talk.session.*` es la superficie común administrada por Gateway para tiempo real con gateway-relay, transcripción con gateway-relay y sesiones nativas STT/TTS de sala administrada.

Las configuraciones heredadas que colocaban selectores de tiempo real junto a `talk.provider` / `talk.providers` deben repararse con `openclaw doctor --fix`; el runtime de Talk no reinterpreta la configuración de proveedor de voz/TTS como configuración de proveedor de tiempo real.

Las combinaciones admitidas de `talk.session.create` son intencionalmente pequeñas:

| Modo            | Transporte      | Cerebro         | Propietario        | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio de proveedor full-duplex puenteado a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de estilo push-to-talk y walkie-talkie donde el cliente posee la captura/reproducción y el Gateway posee el estado de turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores para superficies propias de confianza que ejecutan directamente acciones de herramientas del Gateway. |

Mapa de métodos eliminados:

| Antiguo                         | Nuevo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

El vocabulario de control unificado también es deliberadamente estrecho:

  | Método                          | Se aplica a                                             | Contrato                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión de Gateway.                                                                           |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                         |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de la validación de turno obsoleto.                                                                                                                     |
  | `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS para un turno.                                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada de herramienta del proveedor emitida por el relay; pasa `options.willContinue` para salida provisional u `options.suppressResponse` para satisfacer la llamada sin otra respuesta del asistente. |
  | `talk.session.steer`            | sesiones de Talk respaldadas por agente                 | Envía control hablado `status`, `steer`, `cancel` o `followup` a la ejecución embebida activa resuelta desde la sesión de Talk.                                                          |
  | `talk.session.close`            | todas las sesiones unificadas                           | Detiene sesiones de relay o revoca el estado de sala administrada y luego olvida el id de sesión unificada.                                                                              |

  No introduzcas casos especiales de proveedor o plataforma en core para que esto funcione.
  Core posee la semántica de las sesiones de Talk. Los plugins de proveedor poseen la configuración de sesiones de proveedor.
  Las llamadas de voz y Google Meet poseen los adaptadores de telefonía/reuniones. Las apps de navegador y nativas
  poseen la UX de captura/reproducción del dispositivo.

  ## Política de compatibilidad

  Para plugins externos, el trabajo de compatibilidad sigue este orden:

  1. añadir el contrato nuevo
  2. mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad
  3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
  4. cubrir ambas rutas en pruebas
  5. documentar la obsolescencia y la ruta de migración
  6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión mayor

  Los mantenedores pueden auditar la cola de migración actual con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
  recuentos compactos, `--owner <id>` para un plugin o propietario de compatibilidad, y
  `pnpm plugins:boundary-report:ci` cuando una puerta de CI deba fallar por registros
  de compatibilidad vencidos, importaciones reservadas del SDK entre propietarios o subrutas reservadas del SDK
  sin usar. El informe agrupa los registros de compatibilidad obsoletos
  por fecha de eliminación, cuenta referencias locales de código/docs,
  expone importaciones reservadas del SDK entre propietarios y resume el puente privado
  del SDK del host de memoria para que la limpieza de compatibilidad siga siendo explícita en lugar de
  depender de búsquedas ad hoc. Las subrutas reservadas del SDK deben tener uso de propietario rastreado;
  las exportaciones de helpers reservados sin uso deben eliminarse del SDK público.

  Si un campo del manifiesto todavía se acepta, los autores de plugins pueden seguir usándolo hasta que
  la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo
  documentado, pero los plugins existentes no deben romperse durante versiones menores ordinarias.

  ## Cómo migrar

  <Steps>
  <Step title="Migrar helpers de carga/escritura de configuración en runtime">
    Los plugins incluidos deben dejar de llamar a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)` directamente. Prefiere la configuración que
    ya se pasó a la ruta de llamada activa. Los manejadores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben usar `ctx.getRuntimeConfig()` del contexto de herramienta dentro de
    `execute` para que una herramienta creada antes de una escritura de configuración siga viendo la
    configuración de runtime actualizada.

    Las escrituras de configuración deben pasar por los helpers transaccionales y elegir una
    política posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el llamador sabe
    que el cambio requiere un reinicio limpio del gateway, y
    `afterWrite: { mode: "none", reason: "..." }` solo cuando el llamador posee el
    seguimiento y deliberadamente quiere suprimir el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas y registro;
    el gateway sigue siendo responsable de aplicar o programar el reinicio.
    `loadConfig` y `writeConfigFile` permanecen como helpers de compatibilidad obsoletos
    para plugins externos durante la ventana de migración y advierten una vez con
    el código de compatibilidad `runtime-config-load-write`. Los plugins incluidos y el código
    de runtime del repositorio están protegidos por barreras de escáner en
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el uso nuevo en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos de servidor del gateway deben usar
    la instantánea de runtime de la solicitud, los helpers de envío/acción/cliente de canal en runtime
    deben recibir la configuración desde su frontera, y los módulos de runtime de larga duración tienen
    cero llamadas ambientales `loadConfig()` permitidas.

    El código nuevo de plugins también debe evitar importar el barrel amplio de compatibilidad
    `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha del SDK que coincida con la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de instantánea de runtime actual | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Helpers de almacén de sesión | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers de runtime de política de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos por escáner contra el barrel amplio
    para que las importaciones y mocks se mantengan locales al comportamiento que necesitan. El barrel amplio
    todavía existe para compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar extensiones embebidas de resultados de herramienta a middleware">
    Los plugins incluidos deben reemplazar los manejadores de resultados de herramienta solo del ejecutor embebido
    `api.registerEmbeddedExtensionFactory(...)` por middleware neutral respecto al runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Actualiza el manifiesto del plugin al mismo tiempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Los plugins instalados también pueden registrar middleware de resultados de herramienta cuando están
    habilitados explícitamente y declaran cada runtime objetivo en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalados no declarados
    se rechazan.

  </Step>

  <Step title="Migrar manejadores nativos de aprobaciones a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y a `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de plugin de canal;
      mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de canal; los hooks de autenticación de aprobación
      allí ya no son leídos por core
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o apps Bolt,
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del plugin desde manejadores nativos de aprobación;
      core ahora posee los avisos enrutados a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat`
    de Windows no resueltos ahora fallan cerrados salvo que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionadamente del fallback de shell, no establezcas
    `allowShellFallback` y maneja el error lanzado en su lugar.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu plugin importaciones de cualquiera de las superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones enfocadas">
    Cada exportación de la superficie antigua se asigna a una ruta de importación moderna específica:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers del lado del host, usa el runtime de plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros ayudantes de puente heredados:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ayudantes del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la superficie de ayudantes
    enfocada que realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Ayudantes de cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Ayudantes de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y con respaldo persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Ayudantes seguros de rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` con reconocimiento del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Ayudantes de proxy y `fetch` protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Ayudantes de carga útil de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Ayudantes de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de preparación del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Ayudantes de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivo | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por escáner contra `infra-runtime`, por lo que el código del repositorio
    no puede volver a depender del barril amplio.

  </Step>

  <Step title="Migrate channel route helpers">
    El código nuevo de rutas de canal debe usar `openclaw/plugin-sdk/channel-route`.
    Los nombres antiguos de clave de ruta y destino comparable permanecen como alias
    de compatibilidad durante la ventana de migración, pero los plugins nuevos deben usar
    los nombres de ruta que describen el comportamiento directamente:

    | Ayudante antiguo | Ayudante moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los ayudantes de ruta modernos normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en aprobaciones nativas, supresión de respuestas, deduplicación
    entrante, entrega de Cron y enrutamiento de sesiones.

    No agregues nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    de los ayudantes de ruta cargada respaldados por parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` desde `plugin-sdk/channel-route`.
    Esos hooks están obsoletos y permanecen solo para plugins antiguos durante la
    ventana de migración. Los plugins de canal nuevos deben usar
    `messaging.targetResolver.resolveTarget(...)` para la normalización del id de destino
    y el fallback ante ausencia de directorio, `messaging.inferTargetChatType(...)` cuando el núcleo
    necesita un tipo de par temprano, y `messaging.resolveOutboundSessionRoute(...)`
    para la identidad de sesión y conversación nativa del proveedor.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Common import path table">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Traductor de configuración, indicaciones de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de entorno de ejecución durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importar, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usar `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes de varias cuentas | Ayudantes de lista/configuración/puerta de acción de cuentas |
  | `plugin-sdk/account-id` | Ayudantes de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas y alternativa predeterminada |
  | `plugin-sdk/account-helpers` | Ayudantes acotados de cuentas | Ayudantes de lista de cuentas/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Conexión de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y ayudantes de acceso por DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo primitivas compartidas de esquema de configuración de canal y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración empaquetados | Solo plugins empaquetados mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración empaquetados obsoletos | Solo alias de compatibilidad; usar `plugin-sdk/bundled-channel-config-schema` para plugins empaquetados mantenidos |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobres entrantes | Ayudantes compartidos de ruta y constructor de sobres |
  | `plugin-sdk/channel-inbound` | Ayudantes de recepción entrante | Construcción de contexto, formato, raíces, ejecutores, envío de respuestas preparadas y predicados de envío |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para análisis de destinos | Usar `plugin-sdk/channel-targets` para ayudantes genéricos de análisis de destinos, `plugin-sdk/channel-route` para comparación de rutas y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del Plugin para resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Ayudantes del ciclo de vida de mensajes salientes | Adaptadores de mensajes, recibos, ayudantes de envío duradero, ayudantes de vista previa en vivo/transmisión, opciones de respuesta, ayudantes de ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes de adaptadores y ciclo de vida de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de cargas útiles de medios | Constructor de cargas útiles de medios de agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas de entorno de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes amplios de entorno de ejecución | Ayudantes de entorno de ejecución/registro/copia de seguridad/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Ayudantes acotados de entorno de entorno de ejecución | Ayudantes de registrador/entorno de ejecución, tiempo de espera, reintento y retroceso |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de entorno de ejecución de Plugin | Ayudantes de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de canalización de hooks | Ayudantes compartidos de canalización de hooks internos/Webhook |
  | `plugin-sdk/lazy-runtime` | Ayudantes de entorno de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Ayudantes de entorno de ejecución de CLI | Formato de comandos, esperas, ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway, ayudante de inicio listo para bucle de eventos, resolución de host LAN anunciado y ayudantes de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Capa obsoleta de compatibilidad de configuración | Preferir `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram estables con alternativa cuando la superficie contractual de Telegram empaquetada no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de indicaciones de aprobación | Carga útil de aprobación de ejecución/Plugin, ayudantes de capacidad/perfil de aprobación, ayudantes nativos de enrutamiento/entorno de ejecución de aprobaciones y formato estructurado de rutas de visualización de aprobaciones |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobaciones | Resolución de aprobador, autenticación de acción en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobaciones | Ayudantes nativos de perfil/filtro de aprobación de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobaciones | Adaptadores nativos de capacidad/entrega de aprobaciones |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobaciones | Ayudante compartido de resolución de Gateway de aprobaciones |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptadores de aprobaciones | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal críticos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de manejadores de aprobaciones | Ayudantes más amplios de entorno de ejecución del manejador de aprobaciones; preferir las conexiones más acotadas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destino de aprobaciones | Ayudantes nativos de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobaciones | Ayudantes de cargas útiles de respuesta de aprobación de ejecución/Plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de entorno de ejecución de canal | Ayudantes genéricos para registrar/obtener/vigilar contextos de entorno de ejecución de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, control de DM, archivos/rutas acotados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de política SSRF | Ayudantes de lista de permitidos de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de entorno de ejecución SSRF | Despachador fijado, fetch protegido, ayudantes de política SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Ayudantes de activación, evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de deduplicación | Cachés de deduplicación en memoria y respaldadas por persistencia |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros de rutas de archivo local/medios |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de preparación del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Ayudantes de política de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de control de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafos de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch envuelto/proxy | `resolveFetch`, ayudantes de proxy, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintentos | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y mapeo de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ayudantes de control de comandos y superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes de registro de comandos incluido el formato de menús de argumentos dinámicos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Ayudantes de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección de cuerpo de Webhook | Ayudantes de lectura/límite de cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Entorno de ejecución compartido de respuestas | Envío entrante, Heartbeat, planificador de respuestas, división en fragmentos |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes acotados de envío de respuestas | Finalización, envío de proveedor y ayudantes de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuestas | `createChannelHistoryWindow`; exportaciones obsoletas de compatibilidad de ayudantes de mapas como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuesta | Ayudantes de división en fragmentos de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones | Ayudantes de ruta de almacén y actualización de fecha |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de destino | Ayudantes compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Ayudantes de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramienta | Extrae payloads normalizados desde objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos de destino de envío canónicos desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas de descarga temporal |
  | `plugin-sdk/logging-core` | Ayudantes de registro | Ayudantes de registrador de subsistema y redacción |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autohospedados | Ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de runtime de proveedores | Ayudantes de resolución de claves de API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de claves de API de proveedores | Ayudantes de incorporación/escritura de perfiles de claves de API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultado de autenticación de proveedores | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedores | Selección de proveedor configurado o automática y combinación de configuración de proveedor sin procesar |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedores | Ayudantes de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelo/reproducción de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de reproducción, ayudantes de endpoint de proveedor y ayudantes de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidad HTTP/endpoint de proveedores, incluidos ayudantes de formulario multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de web-fetch de proveedores | Ayudantes de registro/caché de proveedores de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de búsqueda web de proveedores | Ayudantes estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contrato de búsqueda web de proveedores | Ayudantes estrechos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de búsqueda web de proveedores | Ayudantes de registro/caché/runtime de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza + diagnósticos de esquemas de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de stream de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream y ayudantes compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativo de proveedores, como fetch protegido, extracción de texto de resultados de herramienta, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de medios | Ayudantes de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de payloads de medios |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación de medios | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión de medios | Tipos de proveedor de comprensión de medios más exportaciones de ayudantes de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia obsoleta de compatibilidad de texto | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedor de voz más ayudantes de directivas, registro y validación orientados a proveedores, y constructor TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedor, ayudantes de registro y ayudante compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedor, ayudantes de registro/resolución, ayudantes de sesión de puente, colas compartidas de respuesta hablada del agente, control de voz de ejecución activa, estado de transcripción/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consulta forzada, seguimiento de contexto de turno, seguimiento de actividad de salida y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedor de generación de imágenes más ayudantes de URL de datos/activos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Ayudantes de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuesta interactiva | Normalización/reducción de payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas estrechas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canal | Ayudantes de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canal | Ayudantes compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de allowlist | Ayudantes de edición/lectura de configuración de allowlist |
  | `plugin-sdk/group-access` | Ayudantes de acceso de grupo | Ayudantes compartidos de decisión de acceso de grupo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Ayudantes de protección de DM directo | Ayudantes estrechos de política de protección precriptográfica |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensión | Primitivas de ayudantes de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destino de Webhook | Registro de destinos de Webhook y ayudantes de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Ayudantes compartidos de medios web | Ayudantes de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad de Zod | Importa `zod` desde `zod` directamente |
  | `plugin-sdk/memory-core` | Ayudantes memory-core incluidos | Superficie de ayudantes de administrador/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memoria | Ayudantes ligeros de registro de proveedores de embeddings de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base de host de memoria | Exportaciones del motor base de host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y ayudantes genéricos de lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memoria | Exportaciones del motor QMD de host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento de host de memoria | Exportaciones del motor de almacenamiento de host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales de host de memoria | Ayudantes multimodales de host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta de host de memoria | Ayudantes de consulta de host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos de host de memoria | Ayudantes de secretos de host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado de host de memoria | Ayudantes de estado de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI de host de memoria | Ayudantes de runtime de CLI de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central de host de memoria | Ayudantes de runtime central de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivo/runtime de host de memoria | Ayudantes de archivo/runtime de host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de runtime central de host de memoria | Alias independiente del proveedor para ayudantes de runtime central de host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos de host de memoria | Alias independiente del proveedor para ayudantes de diario de eventos de host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivo/runtime de memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de markdown gestionado | Ayudantes compartidos de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de memoria activa | Fachada diferida de runtime del administrador de búsqueda de memoria activa |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado de host de memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel obsoleto de compatibilidad local del repositorio; usa subrutas de prueba enfocadas y locales del repositorio, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. El inventario de puntos de entrada del compilador vive en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se
generan desde el subconjunto público.

Las costuras auxiliares reservadas para plugins incluidos se han retirado del mapa
de exportación público del SDK, salvo fachadas de compatibilidad documentadas
explícitamente, como el shim obsoleto `plugin-sdk/discord` conservado para el
paquete publicado `@openclaw/discord@2026.3.13`. Los auxiliares específicos del
propietario viven dentro del paquete del plugin propietario; el comportamiento
compartido del host debe moverse mediante contratos genéricos del SDK como
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
`plugin-sdk/plugin-config-runtime`.

Usa la importación más estrecha que coincida con el trabajo. Si no encuentras
una exportación, revisa la fuente en `src/plugin-sdk/` o pregunta a los
mantenedores qué contrato genérico debería poseerla.

## Obsolescencias activas

Obsolescencias más estrechas que se aplican en todo el SDK de plugins, el
contrato de proveedor, la superficie de runtime y el manifiesto. Cada una sigue
funcionando hoy, pero se eliminará en una versión mayor futura. La entrada debajo
de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="Constructores de ayuda de command-auth → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones; solo se importan desde la subruta más estrecha. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de compuerta de menciones → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal descendentes (Slack, Discord, Matrix, MS Teams) ya han
    cambiado.

  </Accordion>

  <Accordion title="Shim de runtime de canal y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para
    plugins de canal más antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los auxiliares `channelActions*` en `openclaw/plugin-sdk/channel-actions`
    están obsoletos junto con las exportaciones de canal "actions" sin procesar.
    Expón capacidades mediante la superficie semántica `presentation` en su
    lugar: los plugins de canal declaran qué renderizan (tarjetas, botones,
    selectores) en lugar de qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() de proveedor de búsqueda web → createTool() en el plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el envoltorio de la
    herramienta.

  </Accordion>

  <Accordion title="Sobres de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre de prompt
    plano en texto plano a partir de mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (hilo, tema,
    responder a, reacciones) como campos tipados en lugar de concatenarlos en una
    cadena de prompt. El auxiliar `formatAgentEnvelope(...)` sigue siendo
    compatible para sobres sintetizados orientados al asistente, pero los sobres
    entrantes en texto plano están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que haya posprocesado texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Antiguo**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El evento y el contexto son el
    mismo contrato de limpieza de apagado; solo cambia el nombre del hook.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` permanece conectado como alias de compatibilidad obsoleto hasta
    después del 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → enlace de hilo del core">
    **Antiguo**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: deja que el core prepare enlaces de subagentes `thread: true`
    mediante el adaptador de enlace de sesión de canal. Usa
    `api.on("subagent_spawned", handler)` solo para observación posterior al
    lanzamiento.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` y
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecen solo como
    superficies de compatibilidad obsoletas mientras migran los plugins externos.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedores → tipos de catálogo de proveedores">
    Cuatro alias de tipo de descubrimiento ahora son envoltorios delgados sobre
    los tipos de la era de catálogo:

    | Alias antiguo             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además de la bolsa estática heredada `ProviderCapabilities`: los plugins
    proveedores deben usar hooks de proveedor explícitos como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn` en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y lista de
    niveles ordenada. OpenClaw degrada automáticamente los valores almacenados
    obsoletos por rango de perfil.

    El contexto incluye `provider`, `modelId`, `reasoning` fusionado opcional y
    hechos `compat` del modelo fusionados opcionales. Los plugins proveedores
    pueden usar esos hechos de catálogo para exponer un perfil específico del
    modelo solo cuando el contrato de solicitud configurado lo admite.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de obsolescencia, pero no se componen con el resultado del
    perfil.

  </Accordion>

  <Accordion title="Proveedores de autenticación externa → contracts.externalAuthProviders">
    **Antiguo**: implementar hooks de autenticación externa sin declarar el
    proveedor en el manifiesto del plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del
    plugin **e** implementa `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    **Antiguo** campo de manifiesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` en el manifiesto. Esto consolida los metadatos de
    entorno de configuración/estado en un solo lugar y evita iniciar el runtime
    del plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="Registro de plugin de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos espacios, una sola llamada de registro. Los auxiliares aditivos de
    prompt y corpus (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) no se ven afectados.

  </Accordion>

  <Accordion title="API de proveedor de embeddings de memoria">
    **Antiguo**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico de proveedor de embeddings es reutilizable fuera de la
    memoria y es la ruta compatible para nuevos proveedores. La API de registro
    específica de memoria permanece conectada como compatibilidad obsoleta
    mientras migran los proveedores existentes. La inspección de plugins informa
    el uso no incluido como deuda de compatibilidad.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipo heredados siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de flujo de
    tareas en vivo.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el runtime de mutación
    administrada de TaskFlow para plugins que crean, actualizan, cancelan o
    ejecutan tareas hijas desde un flujo. Usa `runtime.tasks.flows` cuando el
    plugin solo necesite lecturas basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fábricas de extensiones incrustadas → middleware de resultado de herramienta del agente">
    Cubierto en "Cómo migrar → Migrar extensiones de resultado de herramienta
    incrustadas a middleware" más arriba. Incluido aquí por completitud: la ruta
    eliminada exclusiva del runner incrustado
    `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de
    runtimes en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado desde `openclaw/plugin-sdk` ahora es un
    alias de una línea para `OpenClawConfig`. Prefiere el nombre canónico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias a nivel de extensión (dentro de plugins de canal/proveedor
incluidos bajo `extensions/`) se rastrean dentro de sus propios barrels `api.ts`
y `runtime-api.ts`. No afectan los contratos de plugins de terceros y no se
enumeran aquí. Si consumes directamente el barrel local de un plugin incluido,
lee los comentarios de obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronología de eliminación

| Cuándo                    | Qué ocurre                                                                    |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Ahora**                 | Las superficies obsoletas emiten advertencias en tiempo de ejecución          |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir temporalmente las advertencias

Define estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - crear plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - crear plugins de proveedor
- [Internals de Plugin](/es/plugins/architecture) - análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
