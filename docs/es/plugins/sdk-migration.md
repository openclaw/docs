---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usabas api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un Plugin a la arquitectura moderna de Plugin
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad hacia atrás al SDK de plugin moderno
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T12:48:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ha pasado de una capa amplia de compatibilidad con versiones anteriores a una arquitectura moderna de plugins
con importaciones específicas y documentadas. Si tu plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema de plugins anterior proporcionaba dos superficies muy abiertas que permitían a los plugins importar
todo lo que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - una única importación que reexportaba decenas de
  helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un barrel amplio de helpers de runtime que
  mezclaba eventos del sistema, estado de Heartbeat, colas de entrega, helpers de fetch/proxy,
  helpers de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un barrel amplio de compatibilidad de configuración
  que aún conserva helpers directos de carga/escritura obsoletos durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el ejecutor de agentes embebido.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook de extensión empaquetada eliminado y exclusivo del ejecutor embebido
  que podía observar eventos del ejecutor embebido como
  `tool_result`.

Las superficies amplias de importación ahora están **obsoletas**. Aún funcionan en runtime,
pero los plugins nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que
la próxima versión mayor las elimine. La API de registro de fábricas de extensiones
exclusiva del ejecutor embebido se ha eliminado; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo
cambio que introduce un reemplazo. Los cambios que rompen contratos deben pasar primero
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Eso se aplica a importaciones del SDK, campos del manifiesto, API de configuración, hooks y
comportamiento de registro en runtime.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión mayor.
  Los plugins que aún importen desde estas superficies se romperán cuando eso ocurra.
  Los registros heredados de fábricas de extensiones embebidas ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** - importar un helper cargaba decenas de módulos no relacionados
- **Dependencias circulares** - las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** - no había forma de saber qué exportaciones eran estables frente a internas

El SDK moderno de plugins soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autónomo con un propósito claro y un contrato documentado.

Las costuras heredadas de conveniencia de proveedores para canales empaquetados también desaparecieron.
Las costuras de helpers con marca de canal eran atajos privados del monorepo, no contratos
estables de plugins. Usa subrutas genéricas y específicas del SDK en su lugar. Dentro del espacio de trabajo del
plugin empaquetado, conserva los helpers propiedad del proveedor en el propio `api.ts` o
`runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic conserva helpers de flujo específicos de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI conserva constructores de proveedores, helpers de modelos predeterminados y constructores de proveedores
  en tiempo real en su propio `api.ts`
- OpenRouter conserva el constructor de proveedor y helpers de incorporación/configuración en su propio
  `api.ts`

## Plan de migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk de navegador se está moviendo de
la contabilidad de turnos local de la superficie a un controlador compartido de sesiones Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. El nuevo controlador posee el sobre común de eventos Talk,
el estado de turno activo, el estado de captura, el estado de audio de salida, el historial reciente
de eventos y el rechazo de turnos obsoletos. Los plugins de proveedores deben seguir siendo propietarios
de las sesiones en tiempo real específicas del proveedor; los plugins de superficie deben seguir siendo propietarios de captura,
reproducción, telefonía y particularidades de reuniones.

Esta migración de Talk es intencionalmente una ruptura limpia:

1. Mantener los primitivos compartidos de controlador/runtime en
   `plugin-sdk/realtime-voice`.
2. Migrar las superficies empaquetadas al controlador compartido: relé de navegador,
   traspaso de sala administrada, tiempo real de llamada de voz, STT de streaming de llamada de voz, tiempo real de Google
   Meet y push-to-talk nativo.
3. Reemplazar las familias antiguas de RPC de Talk con la API final `talk.session.*` y
   `talk.client.*`.
4. Anunciar un único canal de eventos Talk en vivo en
   `hello-ok.features.events` de Gateway: `talk.event`.
5. Eliminar el antiguo endpoint HTTP en tiempo real y cualquier ruta de sobrescritura de instrucciones
   en tiempo de solicitud.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)` salvo que esté
implementando un adaptador de bajo nivel o un fixture de prueba. Prefiere el controlador compartido
para que los eventos con ámbito de turno no puedan emitirse sin un id de turno, las llamadas `turnEnd` /
`turnCancel` obsoletas no puedan borrar un turno activo más reciente, y los eventos del ciclo de vida
del audio de salida se mantengan consistentes entre telefonía, reuniones, relé de navegador, traspaso de sala administrada
y clientes Talk nativos.

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

Las sesiones WebRTC/websocket de proveedor propiedad del navegador usan `talk.client.create`,
porque el navegador posee la negociación con el proveedor y el transporte de medios, mientras que el
Gateway posee credenciales, instrucciones y política de herramientas. `talk.session.*` es la
superficie común administrada por Gateway para tiempo real con gateway-relay, transcripción con gateway-relay
y sesiones nativas STT/TTS de sala administrada.

Las configuraciones heredadas que colocaban selectores en tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en runtime
no reinterpreta la configuración de proveedores de voz/TTS como configuración de proveedores en tiempo real.

Las combinaciones compatibles de `talk.session.create` son intencionalmente pequeñas:

| Modo            | Transporte       | Cerebro         | Propietario        | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio de proveedor dúplex completo puenteado a través del Gateway; las llamadas de herramientas se enrutan mediante la herramienta agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT de streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de estilo push-to-talk y walkie-talkie donde el cliente posee la captura/reproducción y el Gateway posee el estado de turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores para superficies propias de confianza que ejecutan acciones de herramientas de Gateway directamente.                  |

Mapa de métodos eliminados:

| Anterior                         | Nuevo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` o `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

El vocabulario de control unificado también es deliberadamente específico:

  | Método                          | Se aplica a                                             | Contrato                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Agrega un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión Gateway.                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de la validación de turno obsoleto.                                                                                                                     |
  | `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS para un turno.                                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a herramienta del proveedor emitida por el relay; pasa `options.willContinue` para salida provisional u `options.suppressResponse` para satisfacer la llamada sin otra respuesta del asistente. |
  | `talk.session.steer`            | sesiones Talk respaldadas por agente                    | Envía un control hablado `status`, `steer`, `cancel` o `followup` a la ejecución incrustada activa resuelta desde la sesión Talk.                                                        |
  | `talk.session.close`            | todas las sesiones unificadas                           | Detiene las sesiones de relay o revoca el estado de sala administrada y luego olvida el id de sesión unificada.                                                                          |

  No introduzcas casos especiales de proveedor o plataforma en core para que esto funcione.
  Core es dueño de la semántica de las sesiones Talk. Los plugins de proveedor son dueños de la configuración de sesiones del proveedor.
  Voice-call y Google Meet son dueños de los adaptadores de telefonía/reuniones. El navegador y las aplicaciones nativas
  son dueños de la experiencia de usuario de captura/reproducción del dispositivo.

  ## Política de compatibilidad

  Para plugins externos, el trabajo de compatibilidad sigue este orden:

  1. agregar el nuevo contrato
  2. mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad
  3. emitir un diagnóstico o advertencia que nombre la ruta anterior y el reemplazo
  4. cubrir ambas rutas en las pruebas
  5. documentar la descontinuación y la ruta de migración
  6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión mayor

  Los mantenedores pueden auditar la cola de migración actual con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
  recuentos compactos, `--owner <id>` para un Plugin o propietario de compatibilidad, y
  `pnpm plugins:boundary-report:ci` cuando una puerta de CI deba fallar por registros
  de compatibilidad vencidos, importaciones reservadas del SDK entre propietarios o subrutas reservadas del SDK
  sin usar. El informe agrupa los registros de compatibilidad
  descontinuados por fecha de eliminación, cuenta referencias locales de código/docs,
  expone importaciones reservadas del SDK entre propietarios y resume el puente privado
  del SDK de host de memoria para que la limpieza de compatibilidad permanezca explícita en lugar de
  depender de búsquedas ad hoc. Las subrutas reservadas del SDK deben tener uso de propietarios registrado;
  las exportaciones auxiliares reservadas sin usar deben eliminarse del SDK público.

  Si un campo del manifiesto todavía se acepta, los autores de plugins pueden seguir usándolo hasta que
  la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo
  documentado, pero los plugins existentes no deben romperse durante versiones menores
  ordinarias.

  ## Cómo migrar

  <Steps>
  <Step title="Migrar auxiliares de carga/escritura de configuración en runtime">
    Los plugins incluidos deben dejar de llamar directamente a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Prefiere la configuración que
    ya se pasó a la ruta de llamada activa. Los manejadores de larga duración que necesitan la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben usar `ctx.getRuntimeConfig()` del contexto de herramienta dentro de
    `execute` para que una herramienta creada antes de una escritura de configuración siga viendo la
    configuración de runtime actualizada.

    Las escrituras de configuración deben pasar por los auxiliares transaccionales y elegir una
    política posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el llamador sepa
    que el cambio requiere un reinicio limpio del Gateway, y
    `afterWrite: { mode: "none", reason: "..." }` solo cuando el llamador sea dueño del
    seguimiento y quiera suprimir deliberadamente el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas y registro;
    el Gateway sigue siendo responsable de aplicar o programar el reinicio.
    `loadConfig` y `writeConfigFile` permanecen como auxiliares de compatibilidad
    descontinuados para plugins externos durante la ventana de migración y advierten una vez con
    el código de compatibilidad `runtime-config-load-write`. Los plugins incluidos y el código de runtime
    del repositorio están protegidos por guardarraíles de escáner en
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el uso nuevo en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor Gateway deben usar
    la instantánea de runtime de la solicitud, los auxiliares de envío/acción/cliente de canales de runtime
    deben recibir la configuración desde su límite, y los módulos de runtime de larga duración tienen
    cero llamadas ambientales permitidas a `loadConfig()`.

    El código nuevo de plugins también debe evitar importar el barrel amplio de compatibilidad
    `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha del SDK
    que coincida con la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de runtime para políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos por escáner contra el barrel
    amplio para que las importaciones y los mocks permanezcan locales al comportamiento que necesitan. El barrel
    amplio sigue existiendo para compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar extensiones incrustadas de resultados de herramientas a middleware">
    Los plugins incluidos deben reemplazar los manejadores de resultados de herramientas exclusivos del ejecutor incrustado
    `api.registerEmbeddedExtensionFactory(...)` por middleware
    neutral respecto al runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Actualiza el manifiesto del Plugin al mismo tiempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando están
    habilitados explícitamente y declaran cada runtime objetivo en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalado
    no declarados se rechazan.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a hechos de capacidad">
    Los plugins de canal capaces de aprobación ahora exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado de `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de plugin de canal;
      mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de canal; los hooks de autenticación de aprobación
      allí ya no son leídos por core
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o aplicaciones Bolt
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde manejadores nativos de aprobación;
      core ahora es dueño de los avisos de enrutamiento a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de la capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan cerrados salvo que pases explícitamente
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

    Si tu llamador no depende intencionalmente del fallback de shell, no establezcas
    `allowShellFallback` y maneja el error lanzado en su lugar.

  </Step>

  <Step title="Encontrar importaciones descontinuadas">
    Busca en tu Plugin importaciones desde cualquiera de las superficies descontinuadas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones enfocadas">
    Cada exportación de la superficie anterior se asigna a una ruta de importación moderna específica:

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

    Para auxiliares del lado del host, usa el runtime del Plugin inyectado en lugar de importar
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

  <Step title="Reemplazar importaciones amplias de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debería importar la superficie enfocada de
    ayudantes que realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Ayudantes de cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Ayudantes de activación de Heartbeat, eventos y visibilidad | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Ayudantes seguros para rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consciente del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Ayudantes de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Ayudantes de payload de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Ayudantes de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Ayudantes de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por escáner contra `infra-runtime`, por lo que el código del repositorio
    no puede regresar al barrel amplio.

  </Step>

  <Step title="Migrar ayudantes de rutas de canal">
    El código nuevo de rutas de canal debería usar `openclaw/plugin-sdk/channel-route`.
    Los nombres antiguos de clave de ruta y destino comparable permanecen como alias de compatibilidad
    durante la ventana de migración, pero los plugins nuevos deberían usar los nombres de ruta
    que describen el comportamiento directamente:

    | Ayudante antiguo | Ayudante moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los ayudantes de rutas modernos normalizan `{ channel, to, accountId, threadId }`
    de forma coherente entre aprobaciones nativas, supresión de respuestas, deduplicación de entrada,
    entrega de Cron y enrutamiento de sesiones.

    No agregues nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    de los ayudantes de rutas cargadas respaldados por el analizador (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` desde `plugin-sdk/channel-route`.
    Esos hooks están obsoletos y permanecen solo para plugins antiguos durante la
    ventana de migración. Los plugins de canal nuevos deberían usar
    `messaging.targetResolver.resolveTarget(...)` para la normalización de id de destino
    y el fallback ante ausencia en el directorio, `messaging.inferTargetChatType(...)` cuando el núcleo
    necesita un tipo de par temprano, y `messaging.resolveOutboundSessionRoute(...)`
    para la identidad de sesión e hilo nativa del proveedor.

  </Step>

  <Step title="Compilar y probar">
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
  | `plugin-sdk/plugin-entry` | Helper canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Traductor de configuración, avisos de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de tiempo de ejecución durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importación, helpers de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helpers de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de varias cuentas | Helpers de lista/configuración/compuerta de acciones de cuentas |
  | `plugin-sdk/account-id` | Helpers de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuentas + respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Helpers acotados de cuentas | Helpers de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y helpers de acceso por DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Primitivas compartidas de esquemas de configuración de canal y solo el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usa `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombres de comando, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helpers de envoltorios entrantes | Helpers compartidos de ruta + constructor de envoltorios |
  | `plugin-sdk/channel-inbound` | Helpers de recepción entrante | Construcción de contexto, formato, raíces, ejecutores, despacho de respuesta preparada y predicados de despacho |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para análisis de destino | Usa `plugin-sdk/channel-targets` para helpers genéricos de análisis de destino, `plugin-sdk/channel-route` para comparación de rutas y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propios del Plugin para resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Helpers de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helpers de ciclo de vida de mensajes salientes | Adaptadores de mensajes, recibos, helpers de envío duradero, helpers de vista previa en vivo/streaming, opciones de respuesta, helpers de ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vinculación de hilos | Helpers de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de carga útil de medios | Constructor de carga útil de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución | Helpers de tiempo de ejecución/registro/copia de seguridad/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Helpers acotados de entorno de tiempo de ejecución | Helpers de registrador/entorno de tiempo de ejecución, tiempo de espera, reintento y retroceso |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de tiempo de ejecución de Plugin | Helpers de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de canalización de hooks | Helpers compartidos de canalización de Webhook/hooks internos |
  | `plugin-sdk/lazy-runtime` | Helpers de tiempo de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de proceso | Helpers compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Helpers de tiempo de ejecución de CLI | Formato de comandos, esperas, helpers de versión |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente de Gateway, helper de inicio listo para bucle de eventos, resolución de host LAN anunciado y helpers de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilidad de configuración obsoleto | Prefiere `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers de validación de comandos de Telegram estables con respaldo cuando la superficie de contrato del Telegram incluido no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de aviso de aprobación | Carga útil de aprobación de ejecución/Plugin, helpers de capacidad/perfil de aprobación, helpers de enrutamiento/tiempo de ejecución de aprobación nativa y formato de rutas de visualización de aprobación estructurada |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución de aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers de perfil/filtro de aprobación de ejecución nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprobación | Helper compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptadores de aprobación | Helpers ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal calientes |
  | `plugin-sdk/approval-handler-runtime` | Helpers de manejadores de aprobación | Helpers más amplios de tiempo de ejecución de manejadores de aprobación; prefiere las uniones más acotadas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación | Helpers nativos de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de carga útil de respuesta de aprobación de ejecución/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de tiempo de ejecución de canal | Helpers genéricos de registro/obtención/observación de contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, compuerta de DM, archivos/rutas acotados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de permitidos de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de tiempo de ejecución SSRF | Despachador fijado, fetch protegido, helpers de política SSRF |
  | `plugin-sdk/system-event-runtime` | Helpers de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helpers de Heartbeat | Helpers de activación, evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helpers de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helpers de deduplicación | Cachés de deduplicación en memoria |
  | `plugin-sdk/file-access-runtime` | Helpers de acceso a archivos | Helpers seguros de rutas de archivos/medios locales |
  | `plugin-sdk/transport-ready-runtime` | Helpers de preparación del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helpers de política de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de compuerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envueltos | `resolveFetch`, helpers de proxy, helpers de opciones EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpers de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y asignación de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de compuerta de comandos y superficie de comandos | `resolveControlCommandGate`, helpers de autorización de remitentes, helpers de registro de comandos, incluido el formato de menú de argumentos dinámicos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Helpers de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitudes de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protección del cuerpo de Webhook | Helpers de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuestas | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho de respuestas | Finalización, despacho de proveedor y helpers de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Helpers de historial de respuestas | `createChannelHistoryWindow`; exportaciones obsoletas de compatibilidad de helpers de mapas como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentos de respuesta | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones | Helpers de ruta de almacén + updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Constructores de resúmenes de estado de canal/cuenta, valores predeterminados de estado en tiempo de ejecución, ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de destino | Ayudantes compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Ayudantes de comandos con tiempo límite | Ejecutor de comandos con tiempo límite con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extrae cargas útiles normalizadas desde objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas de descarga temporal |
  | `plugin-sdk/logging-core` | Ayudantes de registro | Ayudantes de registrador de subsistema y censura |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes de modos de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autohospedados | Ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de proveedores en tiempo de ejecución | Ayudantes de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de claves de API de proveedores | Ayudantes de onboarding/escritura de perfiles de claves de API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedores | Selección de proveedores configurada o automática y fusión de configuración sin procesar de proveedores |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedores | Ayudantes de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelo/replay de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, ayudantes de endpoints de proveedores y ayudantes de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de onboarding de proveedores | Ayudantes de configuración de onboarding |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidades HTTP/endpoint de proveedores, incluidos ayudantes de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de web-fetch de proveedores | Ayudantes de registro/caché de proveedores de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de web-search de proveedores | Ayudantes estrechos de configuración/credenciales de web-search para proveedores que no necesitan cableado de activación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contrato de web-search de proveedores | Ayudantes estrechos de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de web-search de proveedores | Ayudantes de registro/caché/tiempo de ejecución de proveedores de web-search |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza + diagnósticos de esquemas de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de flujo de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y ayudantes compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativo de proveedores, como fetch protegido, extracción de texto de resultados de herramienta, transformaciones de mensajes de transporte y flujos escribibles de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes multimedia compartidos | Ayudantes de obtención/transformación/almacenamiento de multimedia, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas útiles multimedia |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación multimedia | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión multimedia | Tipos de proveedores de comprensión multimedia más exportaciones de ayudantes de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia de compatibilidad de texto obsoleta | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedores de voz más ayudantes de directivas, registro y validación orientados a proveedores, y constructor de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo de voz compartido | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedores, ayudantes de registro y ayudante compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedores, ayudantes de registro/resolución, ayudantes de sesión puente, colas compartidas de respuesta hablada del agente, control de voz de ejecución activa, salud de transcripciones/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consulta forzada, seguimiento de contexto de turno, seguimiento de actividad de salida y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedores de generación de imágenes más ayudantes de recursos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedores/solicitudes/resultados de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Ayudantes de generación de video | Tipos de proveedores/solicitudes/resultados de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuestas interactivas | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas estrechas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canal | Ayudantes de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio de canal compartido | Exportaciones compartidas de preludio de plugin de canal |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canal | Ayudantes compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de lista de permitidos | Ayudantes de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso de grupos | Ayudantes compartidos de decisión de acceso de grupos |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Ayudantes de protección de DM directo | Ayudantes estrechos de política de protección previa a cifrado |
  | `plugin-sdk/extension-shared` | Ayudantes de extensión compartidos | Primitivas de ayudantes de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destino de Webhook | Registro de destinos de Webhook y ayudantes de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Ayudantes compartidos de multimedia web | Ayudantes de carga de multimedia remota/local |
  | `plugin-sdk/zod` | Reexportación de compatibilidad Zod obsoleta | Importa `zod` desde `zod` directamente |
  | `plugin-sdk/memory-core` | Ayudantes memory-core incluidos | Superficie de ayudantes de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memoria | Ayudantes ligeros de registro de proveedores de embeddings de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor foundation del host de memoria | Exportaciones del motor foundation del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y ayudantes genéricos de lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria | Ayudantes multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de memoria | Ayudantes de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria | Ayudantes de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria | Ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Ayudantes de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Ayudantes de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivo/tiempo de ejecución del host de memoria | Ayudantes de archivo/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de tiempo de ejecución central del host de memoria | Alias neutral respecto del proveedor para ayudantes de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos del host de memoria | Alias neutral respecto del proveedor para ayudantes de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivo/tiempo de ejecución de memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de Markdown gestionado | Ayudantes compartidos de Markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de active-memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado del host de memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel de compatibilidad obsoleto local del repo; usa subrutas de prueba locales del repo enfocadas, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionadamente el subconjunto común de migración, no la superficie completa del SDK. El inventario del punto de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se generan a partir del subconjunto público.

Las costuras auxiliares reservadas para plugins incluidos se han retirado del mapa de exportaciones del SDK público, salvo las fachadas de compatibilidad documentadas explícitamente, como el shim obsoleto `plugin-sdk/discord` conservado para el paquete publicado `@openclaw/discord@2026.3.13`. Los auxiliares específicos del propietario viven dentro del paquete del plugin propietario; el comportamiento compartido del host debe moverse mediante contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

Usa la importación más estrecha que coincida con la tarea. Si no encuentras una exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los mantenedores qué contrato genérico debería poseerla.

## Obsolescencias activas

Obsolescencias más específicas que se aplican al SDK de plugins, al contrato de proveedor, a la superficie de runtime y al manifiesto. Cada una sigue funcionando hoy, pero se eliminará en una futura versión mayor. La entrada debajo de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="constructores de ayuda command-auth → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones; solo se importan desde la subruta más estrecha. `command-auth`
    los reexporta como stubs de compatibilidad.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="auxiliares de activación por mención → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal descendentes (Slack, Discord, Matrix, MS Teams) ya
    han cambiado.

  </Accordion>

  <Accordion title="shim de runtime de canal y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para plugins
    de canal antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los auxiliares `channelActions*` en `openclaw/plugin-sdk/channel-actions`
    están obsoletos junto con las exportaciones de canal "actions" sin procesar.
    Expón capacidades mediante la superficie semántica `presentation` en su lugar:
    los plugins de canal declaran qué renderizan (tarjetas, botones, selectores)
    en vez de qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="auxiliar tool() del proveedor de búsqueda web → createTool() en el plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="sobres de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre de prompt
    plano en texto sin formato a partir de mensajes de canal entrantes.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario. Los
    plugins de canal adjuntan metadatos de enrutamiento (hilo, tema, respuesta a,
    reacciones) como campos tipados en lugar de concatenarlos en una cadena de
    prompt. El auxiliar `formatAgentEnvelope(...)` sigue siendo compatible para
    sobres sintetizados orientados al asistente, pero los sobres entrantes en
    texto plano están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que posprocesara texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Antiguo**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El evento y el contexto son el
    mismo contrato de limpieza durante el apagado; solo cambia el nombre del hook.

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

    `deactivate` permanece cableado como alias de compatibilidad obsoleto hasta
    después del 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → vinculación de hilo del núcleo">
    **Antiguo**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: deja que el núcleo prepare vinculaciones de subagentes `thread: true`
    mediante el adaptador de vinculación de sesión del canal. Usa
    `api.on("subagent_spawned", handler)` solo para observación posterior al lanzamiento.

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

  <Accordion title="tipos de descubrimiento de proveedor → tipos de catálogo de proveedor">
    Cuatro alias de tipos de descubrimiento ahora son wrappers ligeros sobre los
    tipos de la era de catálogo:

    | Alias antiguo             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además de la bolsa estática heredada `ProviderCapabilities`: los plugins
    proveedores deberían usar hooks de proveedor explícitos como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn` en lugar de un objeto estático.

  </Accordion>

  <Accordion title="hooks de política de razonamiento → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y lista de
    niveles ordenada. OpenClaw degrada automáticamente los valores almacenados
    obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, `reasoning` fusionado opcional y
    datos `compat` fusionados opcionales del modelo. Los plugins proveedores pueden
    usar esos datos de catálogo para exponer un perfil específico del modelo solo
    cuando el contrato de solicitud configurado lo admite.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de obsolescencia, pero no se componen con el resultado del perfil.

  </Accordion>

  <Accordion title="proveedores de autenticación externa → contracts.externalAuthProviders">
    **Antiguo**: implementar hooks de autenticación externa sin declarar el proveedor
    en el manifiesto del plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del plugin
    **e** implementa `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    Campo de manifiesto **antiguo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` en el manifiesto. Esto consolida los metadatos de
    entorno de configuración/estado en un solo lugar y evita iniciar el runtime
    del plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="registro de plugin de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos espacios, una sola llamada de registro. Los auxiliares aditivos de prompt
    y corpus (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no
    se ven afectados.

  </Accordion>

  <Accordion title="API de proveedor de embeddings de memoria">
    **Antiguo**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico de proveedor de embeddings es reutilizable fuera de memoria
    y es la ruta compatible para nuevos proveedores. La API de registro específica
    de memoria permanece cableada como compatibilidad obsoleta mientras migran los
    proveedores existentes. La inspección de plugins informa el uso no incluido como
    deuda de compatibilidad.

  </Accordion>

  <Accordion title="tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipo heredados siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ---------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo delega en el nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de flujo de
    tareas en vivo.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el runtime de mutación de
    TaskFlow gestionado para plugins que crean, actualizan, cancelan o ejecutan
    tareas secundarias desde un flujo. Usa `runtime.tasks.flows` cuando el plugin
    solo necesita lecturas basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="fábricas de extensiones incrustadas → middleware de resultado de herramienta de agente">
    Cubierto en "Cómo migrar → Migrar extensiones incrustadas de resultado de
    herramienta a middleware" más arriba. Se incluye aquí para completar: la ruta
    eliminada solo para el runner incrustado
    `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de runtimes
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, reexportado desde `openclaw/plugin-sdk`, ahora es un
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
y `runtime-api.ts`. No afectan a los contratos de plugins de terceros y no se
enumeran aquí. Si consumes directamente el barrel local de un plugin incluido,
lee los comentarios de obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                  | Qué sucede                                                                 |
| ----------------------- | -------------------------------------------------------------------------- |
| **Ahora**               | Las superficies obsoletas emiten advertencias en tiempo de ejecución        |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir las advertencias temporalmente

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
