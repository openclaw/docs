---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un Plugin a la arquitectura moderna de Plugin
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad con versiones anteriores al SDK de Plugin moderno
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T12:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw pasó de una amplia capa de compatibilidad hacia atrás a una arquitectura de Plugin moderna
con importaciones enfocadas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrar.

## Qué está cambiando

El sistema de Plugin anterior proporcionaba dos superficies muy abiertas que permitían a los plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - una única importación que reexportaba decenas de
  auxiliares. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un amplio barril de auxiliares de runtime que
  mezclaba eventos del sistema, estado de Heartbeat, colas de entrega, auxiliares de fetch/proxy,
  auxiliares de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un amplio barril de compatibilidad de configuración
  que aún mantiene auxiliares directos de carga/escritura obsoletos durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a
  auxiliares del lado del host, como el ejecutor de agente integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook de extensión empaquetada eliminado, exclusivo del ejecutor integrado,
  que podía observar eventos del ejecutor integrado como
  `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Todavía funcionan en runtime,
pero los plugins nuevos no deben usarlas, y los plugins existentes deben migrar antes de que
la próxima versión mayor las elimine. La API de registro de factoría de extensiones exclusiva
del ejecutor integrado se eliminó; usa middleware de resultado de herramienta en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de Plugin en el mismo
cambio que introduce un reemplazo. Los cambios que rompen contratos primero deben pasar
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Eso aplica a importaciones del SDK, campos de manifiesto, API de configuración, hooks y comportamiento de
registro en runtime.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una futura versión mayor.
  Los plugins que todavía importen desde estas superficies se romperán cuando eso ocurra.
  Los registros antiguos de factorías de extensiones integradas ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** - importar un auxiliar cargaba decenas de módulos no relacionados
- **Dependencias circulares** - las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** - no había forma de saber qué exportaciones eran estables y cuáles internas

El SDK de Plugin moderno corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autónomo con un propósito claro y un contrato documentado.

Las costuras de conveniencia de proveedor antiguas para canales empaquetados también desaparecieron.
Las costuras auxiliares con marca de canal eran atajos privados del monorepo, no contratos de
Plugin estables. Usa subrutas genéricas y estrechas del SDK en su lugar. Dentro del espacio de trabajo de
Plugin empaquetado, conserva los auxiliares propiedad del proveedor en el propio `api.ts` o
`runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic conserva los auxiliares de stream específicos de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI conserva constructores de proveedor, auxiliares de modelo predeterminado y constructores de proveedor
  en tiempo real en su propio `api.ts`
- OpenRouter conserva el constructor de proveedor y los auxiliares de onboarding/configuración en su propio
  `api.ts`

## Plan de migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk de navegador se está moviendo desde la
contabilidad de turnos local de cada superficie a un controlador compartido de sesión de Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. El nuevo controlador posee el sobre común de eventos de Talk,
el estado del turno activo, el estado de captura, el estado de audio de salida, el historial reciente
de eventos y el rechazo de turnos obsoletos. Los plugins de proveedor deben seguir siendo propietarios
de las sesiones en tiempo real específicas del proveedor; los plugins de superficie deben seguir siendo propietarios de las particularidades de
captura, reproducción, telefonía y reuniones.

Esta migración de Talk es intencionalmente limpia y con ruptura:

1. Mantén las primitivas compartidas del controlador/runtime en
   `plugin-sdk/realtime-voice`.
2. Mueve las superficies empaquetadas al controlador compartido: retransmisión de navegador,
   transferencia de sala administrada, tiempo real de llamada de voz, STT en streaming de llamada de voz, Google
   Meet en tiempo real y push-to-talk nativo.
3. Reemplaza las antiguas familias RPC de Talk por la API final `talk.session.*` y
   `talk.client.*`.
4. Anuncia un único canal de eventos Talk en vivo en
   `hello-ok.features.events` de Gateway: `talk.event`.
5. Elimina el antiguo endpoint HTTP en tiempo real y cualquier ruta de sobrescritura de instrucciones
   en tiempo de solicitud.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)` salvo que esté
implementando un adaptador de bajo nivel o una fixture de prueba. Prefiere el controlador compartido
para que los eventos con alcance de turno no puedan emitirse sin un id de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan limpiar un turno activo más nuevo, y los eventos del ciclo de vida de audio de salida
se mantengan coherentes en telefonía, reuniones, retransmisión de navegador, transferencia de sala administrada
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
porque el navegador posee la negociación con el proveedor y el transporte multimedia, mientras que el
Gateway posee credenciales, instrucciones y política de herramientas. `talk.session.*` es la
superficie común administrada por Gateway para tiempo real con gateway-relay, transcripción con gateway-relay
y sesiones STT/TTS nativas de sala administrada.

Las configuraciones antiguas que colocaban selectores en tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en runtime
no reinterpreta la configuración de proveedor de voz/TTS como configuración de proveedor en tiempo real.

Las combinaciones admitidas de `talk.session.create` son intencionalmente reducidas:

| Modo            | Transporte      | Cerebro         | Propietario       | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio full-duplex del proveedor puenteado a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de estilo push-to-talk y walkie-talkie donde el cliente posee captura/reproducción y el Gateway posee el estado de turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores para superficies propias de confianza que ejecutan acciones de herramientas del Gateway directamente. |

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
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Agrega un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión de Gateway.                                                                          |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                         |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de la validación de turno obsoleto.                                                                                                                     |
  | `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS para un turno.                                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada de herramienta del proveedor emitida por el relé; pasa `options.willContinue` para salida provisional u `options.suppressResponse` para satisfacer la llamada sin otra respuesta del asistente. |
  | `talk.session.steer`            | sesiones Talk respaldadas por agente                    | Envía control hablado `status`, `steer`, `cancel` o `followup` a la ejecución incrustada activa resuelta desde la sesión Talk.                                                           |
  | `talk.session.close`            | todas las sesiones unificadas                           | Detiene las sesiones de relé o revoca el estado de sala administrada y luego olvida el id de sesión unificada.                                                                           |

  No introduzcas casos especiales de proveedor o plataforma en el núcleo para hacer que esto funcione.
  El núcleo es propietario de la semántica de las sesiones Talk. Los plugins de proveedor son propietarios de la configuración de sesiones de proveedor.
  Voice-call y Google Meet son propietarios de los adaptadores de telefonía/reuniones. El navegador y las aplicaciones nativas
  son propietarios de la UX de captura/reproducción del dispositivo.

  ## Política de compatibilidad

  Para plugins externos, el trabajo de compatibilidad sigue este orden:

  1. agregar el nuevo contrato
  2. mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad
  3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
  4. cubrir ambas rutas en pruebas
  5. documentar la obsolescencia y la ruta de migración
  6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión mayor

  Los mantenedores pueden auditar la cola de migración actual con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
  conteos compactos, `--owner <id>` para un Plugin o propietario de compatibilidad, y
  `pnpm plugins:boundary-report:ci` cuando una puerta de CI deba fallar por registros
  de compatibilidad vencidos, importaciones reservadas de SDK entre propietarios o subrutas reservadas de SDK
  sin usar. El informe agrupa los registros de compatibilidad
  obsoletos por fecha de eliminación, cuenta referencias locales de código/docs,
  expone importaciones reservadas de SDK entre propietarios y resume el puente privado
  del SDK de host de memoria para que la limpieza de compatibilidad siga siendo explícita en lugar de
  depender de búsquedas ad hoc. Las subrutas reservadas de SDK deben tener uso de propietario rastreado;
  las exportaciones auxiliares reservadas sin usar deben eliminarse del SDK público.

  Si un campo de manifiesto todavía se acepta, los autores de plugins pueden seguir usándolo hasta que
  la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo
  documentado, pero los plugins existentes no deben romperse durante versiones menores ordinarias.

  ## Cómo migrar

  <Steps>
  <Step title="Migrar auxiliares de carga/escritura de configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de llamar directamente a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Prefiere la configuración que ya se haya
    pasado a la ruta de llamada activa. Los manejadores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas
    de agente de larga duración deben usar `ctx.getRuntimeConfig()` del contexto de herramienta dentro de
    `execute` para que una herramienta creada antes de una escritura de configuración siga viendo la
    configuración de tiempo de ejecución actualizada.

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

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el llamador sabe
    que el cambio requiere un reinicio limpio de gateway, y
    `afterWrite: { mode: "none", reason: "..." }` solo cuando el llamador es propietario del
    seguimiento y deliberadamente quiere suprimir el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas y registro;
    el gateway sigue siendo responsable de aplicar o programar el reinicio.
    `loadConfig` y `writeConfigFile` permanecen como auxiliares de compatibilidad obsoletos
    para plugins externos durante la ventana de migración y advierten una vez con
    el código de compatibilidad `runtime-config-load-write`. Los plugins incluidos y el código de
    tiempo de ejecución del repositorio están protegidos por barreras de escáner en
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso de producción en plugins
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor gateway deben usar
    la instantánea de tiempo de ejecución de la solicitud, los auxiliares de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su frontera, y los módulos de tiempo de ejecución de larga duración tienen
    cero llamadas ambientales permitidas a `loadConfig()`.

    El código nuevo de plugins también debe evitar importar el barril amplio de compatibilidad
    `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha del
    SDK que coincida con el trabajo:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de instantánea actual de tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares de almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tabla Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de tiempo de ejecución de política de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos por escáner contra el barril amplio
    para que las importaciones y mocks permanezcan locales al comportamiento que necesitan. El barril amplio
    sigue existiendo para compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar extensiones incrustadas de resultados de herramientas a middleware">
    Los plugins incluidos deben reemplazar los manejadores de resultados de herramientas solo para
    ejecutor incrustado `api.registerEmbeddedExtensionFactory(...)` por
    middleware neutral respecto al tiempo de ejecución.

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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando estén
    habilitados explícitamente y declaren cada tiempo de ejecución objetivo en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalado
    no declarados se rechazan.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de Plugin de canal;
      mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de canales; los hooks de autenticación de aprobación
      allí ya no son leídos por el núcleo
    - Registra objetos de tiempo de ejecución propiedad del canal, como clientes, tokens o aplicaciones Bolt
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde manejadores nativos de aprobación;
      el núcleo ahora es propietario de los avisos de enrutado a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan de forma cerrada a menos que pases explícitamente
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

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar con importaciones enfocadas">
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

    Para auxiliares del lado del host, usa el tiempo de ejecución de Plugin inyectado en lugar de importar
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
    externa, pero el código nuevo debe importar la superficie enfocada de ayudantes que
    realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Ayudantes de cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Ayudantes de activación, evento y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de desduplicación en memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Ayudantes seguros para rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch con conocimiento del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Ayudantes de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Ayudantes de payload de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Ayudantes de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de preparación de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Ayudantes de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por escáner contra `infra-runtime`, por lo que el código del repositorio
    no puede retroceder al barrel amplio.

  </Step>

  <Step title="Migrar ayudantes de rutas de canal">
    El código nuevo de rutas de canal debe usar `openclaw/plugin-sdk/channel-route`.
    Los nombres antiguos de route-key y comparable-target permanecen como alias de compatibilidad
    durante la ventana de migración, pero los plugins nuevos deben usar los nombres de ruta
    que describen directamente el comportamiento:

    | Ayudante antiguo | Ayudante moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los ayudantes de ruta modernos normalizan `{ channel, to, accountId, threadId }`
    de forma coherente entre aprobaciones nativas, supresión de respuestas, desduplicación entrante,
    entrega Cron y enrutamiento de sesiones.

    No agregues nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    de los ayudantes de ruta cargada respaldados por parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) ni
    `resolveChannelRouteTargetWithParser(...)` desde `plugin-sdk/channel-route`.
    Esos hooks están obsoletos y permanecen solo para plugins antiguos durante la
    ventana de migración. Los nuevos plugins de canal deben usar
    `messaging.targetResolver.resolveTarget(...)` para la normalización de id de destino
    y fallback ante ausencia en directorio, `messaging.inferTargetChatType(...)` cuando core
    necesita un tipo de par temprano, y `messaging.resolveOutboundSessionRoute(...)`
    para la identidad de sesión y de hilo nativa del proveedor.

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Tabla común de rutas de importación">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Traductor de configuración, prompts de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de runtime durante la configuración | `createSetupTranslator`, adaptadores de parche de configuración seguros para importar, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes de múltiples cuentas | Ayudantes de lista/configuración/puerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Ayudantes de id. de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id. de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas + reserva predeterminada |
  | `plugin-sdk/account-helpers` | Ayudantes limitados de cuentas | Ayudantes de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y ayudantes de acceso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo primitivas compartidas de esquema de configuración de canal y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usa `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comando, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobre entrante | Ayudantes compartidos de ruta + constructor de sobres |
  | `plugin-sdk/channel-inbound` | Ayudantes de recepción entrante | Construcción de contexto, formato, raíces, ejecutores, despacho de respuestas preparadas y predicados de despacho |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para análisis de objetivos | Usa `plugin-sdk/channel-targets` para ayudantes genéricos de análisis de objetivos, `plugin-sdk/channel-route` para comparación de rutas y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del Plugin para resolución de objetivos específica del proveedor |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Ayudantes de ciclo de vida de mensajes salientes | Adaptadores de mensajes, acuses de recibo, ayudantes de envío duradero, ayudantes de vista previa en vivo/streaming, opciones de respuesta, ayudantes de ciclo de vida, identidad saliente y planificación de payload |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ciclo de vida de vinculación de hilos y ayudantes de adaptador |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de payload de medios | Constructor de payload de medios de agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Adaptador de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes amplios de runtime | Ayudantes de runtime/registro/copia de seguridad/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Ayudantes limitados de entorno de runtime | Entorno de logger/runtime, timeout, reintento y ayudantes de backoff |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de runtime de Plugin | Ayudantes de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de pipeline de hooks | Ayudantes compartidos de pipeline de hooks internos/Webhook |
  | `plugin-sdk/lazy-runtime` | Ayudantes de runtime diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de exec |
  | `plugin-sdk/cli-runtime` | Ayudantes de runtime de CLI | Formato de comandos, esperas, ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway, ayudante de inicio listo para bucle de eventos y ayudantes de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Adaptador de compatibilidad de configuración obsoleto | Prefiere `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram estables con reserva cuando la superficie contractual incluida de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de prompts de aprobación | Payload de aprobación de exec/Plugin, ayudantes de capacidad/perfil de aprobación, ayudantes de routing/runtime de aprobación nativa y formato estructurado de rutas de visualización de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones del mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobación | Ayudantes de perfil/filtro de aprobación de exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobación | Ayudante compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptador de aprobación | Ayudantes ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal activos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de manejador de aprobación | Ayudantes más amplios de runtime de manejador de aprobación; prefiere los límites más estrechos de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de objetivos de aprobación | Ayudantes nativos de vinculación de objetivo/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobación | Ayudantes de payload de respuesta de aprobación de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de runtime de canal | Ayudantes genéricos de registrar/obtener/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, puerta de DM, archivos/rutas limitados a raíz, contenido externo y recolección de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de política SSRF | Ayudantes de lista de hosts permitidos y política de redes privadas |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de runtime SSRF | Dispatcher fijado, fetch protegido, ayudantes de política SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Reactivación, evento y ayudantes de visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de deduplicación | Cachés de deduplicación en memoria |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros de rutas de archivos locales/medios |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de disponibilidad de transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Ayudantes de política de aprobación de exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché limitada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de puerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch/proxy envueltos | `resolveFetch`, ayudantes de proxy, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos y mapeo de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Puerta de comandos y ayudantes de superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes de registro de comandos incluido el formato de menús de argumentos dinámicos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Ayudantes de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes Webhook | Utilidades de objetivos Webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección del cuerpo de Webhook | Ayudantes de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes limitados de despacho de respuestas | Finalización, despacho de proveedor y ayudantes de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuestas | `createChannelHistoryWindow`; exportaciones de compatibilidad de ayudantes de mapa obsoletas como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuesta | Ayudantes de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones | Ruta de almacén + ayudantes de updated-at |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Constructores de resúmenes de estado de canal/cuenta, valores predeterminados de estado de runtime, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de destino | Helpers compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos con temporizador | Ejecutor de comandos con temporizador con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramienta | Extrae payloads normalizados de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas de descarga temporal |
  | `plugin-sdk/logging-core` | Helpers de registro | Logger de subsistema y helpers de redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de runtime de proveedor | Helpers de resolución de claves de API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API de proveedor | Helpers de incorporación/escritura de perfiles con claves de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedor | Selección de proveedor configurado o automática y combinación de configuración sin procesar de proveedor |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedor | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelo/replay de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, helpers de endpoint de proveedor y helpers de normalización de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedor | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedor | Helpers genéricos de capacidad HTTP/endpoint de proveedor, incluidos helpers de formulario multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de proveedor | Helpers de registro/caché de proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de búsqueda web de proveedor | Helpers estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de activación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de búsqueda web de proveedor | Helpers estrechos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Helpers de búsqueda web de proveedor | Helpers de registro/caché/runtime de proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos para DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedor |
  | `plugin-sdk/provider-stream` | Helpers de wrappers de stream de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream y helpers compartidos de wrappers para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de proveedor | Helpers de transporte nativo de proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de payloads de medios |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación de medios | Helpers compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedor de comprensión de medios más exports de helpers de imagen/audio orientados a proveedores |
  | `plugin-sdk/text-runtime` | Export amplio obsoleto de compatibilidad de texto | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedor de voz más helpers de directivas, registro y validación orientados a proveedores, y constructor TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedor, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedor, helpers de registro/resolución, helpers de sesión de puente, colas compartidas de respuesta de voz del agente, control de voz de ejecución activa, salud de transcripción/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consulta forzada, seguimiento del contexto de turno, seguimiento de actividad de salida y helpers rápidos de consulta de contexto |
  | `plugin-sdk/image-generation` | Helpers de generación de imágenes | Tipos de proveedor de generación de imágenes más helpers de activos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción de payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas estrechas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exports compartidos de preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de snapshot/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista de permitidos | Helpers de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso de grupo | Helpers compartidos de decisiones de acceso de grupo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helpers de protección de DM directa | Helpers estrechos de política de protección previa a criptografía |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensión | Primitivas de canal pasivo/estado y helpers de proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destinos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Re-export obsoleto de compatibilidad Zod | Importa `zod` desde `zod` directamente |
  | `plugin-sdk/memory-core` | Helpers incluidos de memory-core | Superficie de helpers de administrador/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memoria | Helpers ligeros de registro de proveedores de embeddings de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor foundation de host de memoria | Exports del motor foundation de host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos de lote/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memoria | Exports del motor QMD de host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento de host de memoria | Exports del motor de almacenamiento de host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales de host de memoria | Helpers multimodales de host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memoria | Helpers de consulta de host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos de host de memoria | Helpers de secretos de host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado de host de memoria | Helpers de estado de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI de host de memoria | Helpers de runtime CLI de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central de host de memoria | Helpers de runtime central de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime de host de memoria | Helpers de archivo/runtime de host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de runtime central de host de memoria | Alias neutral respecto al proveedor para helpers de runtime central de host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos de host de memoria | Alias neutral respecto al proveedor para helpers de diario de eventos de host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivo/runtime de memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helpers de Markdown gestionado | Helpers compartidos de Markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de memoria activa | Fachada de runtime lazy del administrador de búsqueda de memoria activa |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado de host de memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel de compatibilidad obsoleto local del repo; usa subrutas de prueba enfocadas locales del repo como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionadamente el subconjunto común de migración, no la superficie completa del SDK. El inventario del punto de entrada del compilador vive en `scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se generan a partir del subconjunto público.

Las costuras auxiliares reservadas para plugins incluidos se han retirado del mapa de exportaciones público del SDK, excepto las fachadas de compatibilidad documentadas explícitamente, como el shim obsoleto `plugin-sdk/discord` conservado para el paquete publicado `@openclaw/discord@2026.3.13`. Los helpers específicos del propietario viven dentro del paquete del plugin propietario; el comportamiento compartido del host debe pasar por contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

Usa la importación más estrecha que coincida con la tarea. Si no encuentras una exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los mantenedores qué contrato genérico debería poseerla.

## Desaprobaciones activas

Desaprobaciones más estrechas que se aplican en todo el SDK de plugins, el contrato de proveedor, la superficie de runtime y el manifiesto. Cada una todavía funciona hoy, pero se eliminará en una futura versión mayor. La entrada debajo de cada elemento asigna la API antigua a su reemplazo canónico.

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

  <Accordion title="Helpers de control de menciones → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` u
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal posteriores (Slack, Discord, Matrix, MS Teams) ya han
    cambiado.

  </Accordion>

  <Accordion title="Shim de runtime de canal y helpers de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para
    plugins de canal más antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los helpers `channelActions*` en `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones de canal de "actions" sin procesar.
    Expón capacidades a través de la superficie semántica `presentation` en su
    lugar: los plugins de canal declaran qué renderizan (tarjetas, botones,
    selectores) en vez de qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="Helper tool() del proveedor de búsqueda web → createTool() en el plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el helper del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre plano de prompt
    en texto desde mensajes entrantes de canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario. Los
    plugins de canal adjuntan metadatos de enrutamiento (hilo, tema, respuesta a,
    reacciones) como campos tipados en lugar de concatenarlos en una cadena de prompt.
    El helper `formatAgentEnvelope(...)` sigue siendo compatible para sobres
    sintetizados orientados al asistente, pero los sobres entrantes en texto plano
    están en proceso de retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de canal
    personalizado que posprocesara texto de `channelEnvelope`.

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

    `deactivate` sigue cableado como alias de compatibilidad obsoleto hasta después
    del 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → enlace de hilos del núcleo">
    **Antiguo**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: deja que el núcleo prepare enlaces de subagente `thread: true` a
    través del adaptador de enlace de sesión del canal. Usa
    `api.on("subagent_spawned", handler)` solo para observación posterior al inicio.

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

  <Accordion title="Tipos de descubrimiento de proveedor → tipos de catálogo de proveedores">
    Cuatro alias de tipo de descubrimiento ahora son wrappers delgados sobre los
    tipos de la era del catálogo:

    | Alias antiguo             | Tipo nuevo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Más la bolsa estática heredada `ProviderCapabilities`: los plugins proveedores
    deben usar hooks de proveedor explícitos como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn` en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de pensamiento → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y una lista
    ordenada de niveles. OpenClaw degrada automáticamente los valores almacenados
    obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, `reasoning` combinado opcional y
    datos `compat` combinados opcionales del modelo. Los plugins proveedores pueden
    usar esos datos del catálogo para exponer un perfil específico del modelo solo
    cuando el contrato de solicitud configurado lo admite.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de desaprobación, pero no se componen con el resultado del perfil.

  </Accordion>

  <Accordion title="Proveedores de autenticación externa → contracts.externalAuthProviders">
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

  <Accordion title="Búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    **Antiguo** campo de manifiesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` del manifiesto. Esto consolida los metadatos de
    entorno de setup/estado en un solo lugar y evita arrancar el runtime del plugin
    solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
    hasta que se cierre la ventana de desaprobación.

  </Accordion>

  <Accordion title="Registro de plugin de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos slots, una sola llamada de registro. Los helpers aditivos de prompt y corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no se ven afectados.

  </Accordion>

  <Accordion title="API de proveedor de embeddings de memoria">
    **Antiguo**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico de proveedor de embeddings es reutilizable fuera de la memoria
    y es la ruta compatible para nuevos proveedores. La API de registro específica de
    memoria permanece cableada como compatibilidad obsoleta mientras migran los
    proveedores existentes. La inspección de plugins informa el uso no incluido como
    deuda de compatibilidad.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipo heredados todavía se exportan desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto a favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de flujo de tareas en vivo.

    **Nuevo**: `runtime.tasks.managedFlows` mantiene el runtime de mutación de TaskFlow
    administrado para plugins que crean, actualizan, cancelan o ejecutan tareas hijas
    desde un flujo. Usa `runtime.tasks.flows` cuando el plugin solo necesita lecturas
    basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fábricas de extensiones embebidas → middleware de resultados de herramientas de agente">
    Cubierto en "Cómo migrar → Migrar extensiones embebidas de resultados de herramientas
    a middleware" arriba. Se incluye aquí por completitud: la ruta eliminada solo del
    runner embebido `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de runtimes
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado desde `openclaw/plugin-sdk` ahora es un alias
    de una línea para `OpenClawConfig`. Prefiere el nombre canónico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las desaprobaciones a nivel de extensión (dentro de plugins de canal/proveedor incluidos bajo
`extensions/`) se rastrean dentro de sus propios barrels `api.ts` y `runtime-api.ts`.
No afectan los contratos de plugins de terceros y no se enumeran aquí. Si consumes
directamente el barrel local de un plugin incluido, lee los comentarios de desaprobación
en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                    | Qué ocurre                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| **Ahora**                 | Las superficies obsoletas emiten advertencias en tiempo de ejecución        |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir las advertencias temporalmente

Define estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis profundo de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
