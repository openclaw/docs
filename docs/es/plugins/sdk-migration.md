---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usabas api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad hacia atrás al SDK de Plugin moderno
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T07:51:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ha pasado de una capa amplia de compatibilidad hacia atrás a una arquitectura moderna de plugins
con importaciones enfocadas y documentadas. Si tu plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrar.

## Qué está cambiando

El sistema antiguo de plugins proporcionaba dos superficies completamente abiertas que permitían a los plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - una única importación que reexportaba docenas de
  helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un barrel amplio de helpers de runtime que
  mezclaba eventos del sistema, estado de Heartbeat, colas de entrega, helpers de fetch/proxy,
  helpers de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un barrel amplio de compatibilidad de configuración
  que todavía conserva helpers obsoletos de carga/escritura directa durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el ejecutor de agente embebido.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook de extensión empaquetada solo para el ejecutor embebido, ya eliminado,
  que podía observar eventos del ejecutor embebido como
  `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Todavía funcionan en runtime,
pero los plugins nuevos no deben usarlas, y los plugins existentes deben migrar antes de que
la próxima versión mayor las elimine. La API de registro de fábrica de extensiones solo para el ejecutor embebido
se ha eliminado; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo
cambio que introduce un reemplazo. Los cambios de contrato incompatibles primero deben pasar
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Esto se aplica a importaciones del SDK, campos de manifiesto, APIs de configuración, hooks y comportamiento
de registro en runtime.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una versión mayor futura.
  Los plugins que todavía importen desde estas superficies dejarán de funcionar cuando eso ocurra.
  Los registros heredados de fábricas de extensiones embebidas ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque antiguo causaba problemas:

- **Inicio lento** - importar un helper cargaba docenas de módulos no relacionados
- **Dependencias circulares** - las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** - no había forma de saber qué exportaciones eran estables frente a internas

El SDK moderno de plugins soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autónomo con un propósito claro y un contrato documentado.

Las costuras heredadas de conveniencia de proveedores para canales empaquetados también desaparecieron.
Las costuras de helpers con marca de canal eran atajos privados del monorepo, no contratos
estables de plugins. Usa subrutas genéricas y estrechas del SDK en su lugar. Dentro del espacio de trabajo
de plugins empaquetados, mantén los helpers propiedad del proveedor en el propio `api.ts` o
`runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene los helpers de stream específicos de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedores, helpers de modelos predeterminados y constructores de proveedores
  en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y los helpers de onboarding/configuración en su propio
  `api.ts`

## Plan de migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk de navegador se está moviendo de
contabilidad de turnos local a la superficie a un controlador compartido de sesiones Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. El nuevo controlador es propietario del sobre común de eventos Talk,
el estado de turno activo, el estado de captura, el estado de audio de salida, el historial reciente
de eventos y el rechazo de turnos obsoletos. Los plugins de proveedor deben seguir siendo propietarios de
las sesiones en tiempo real específicas del proveedor; los plugins de superficie deben seguir siendo propietarios de captura,
reproducción, telefonía y particularidades de reuniones.

Esta migración de Talk es intencionalmente limpia e incompatible:

1. Mantén los primitivos compartidos de controlador/runtime en
   `plugin-sdk/realtime-voice`.
2. Mueve las superficies empaquetadas al controlador compartido: relay de navegador,
   traspaso de sala administrada, tiempo real de llamadas de voz, STT de streaming de llamadas de voz, tiempo real de Google
   Meet y push-to-talk nativo.
3. Reemplaza las familias antiguas de RPC de Talk con la API final `talk.session.*` y
   `talk.client.*`.
4. Anuncia un canal vivo de eventos Talk en Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina el antiguo endpoint HTTP en tiempo real y cualquier ruta de sobrescritura de instrucciones
   en tiempo de solicitud.

El código nuevo no debe llamar a `createTalkEventSequencer(...)` directamente salvo que esté
implementando un adaptador de bajo nivel o un fixture de prueba. Prefiere el controlador compartido
para que los eventos con ámbito de turno no puedan emitirse sin un id de turno, las llamadas obsoletas `turnEnd` /
`turnCancel` no puedan borrar un turno activo más nuevo, y los eventos de ciclo de vida
de audio de salida se mantengan coherentes en telefonía, reuniones, relay de navegador, traspaso
de sala administrada y clientes Talk nativos.

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
porque el navegador es propietario de la negociación del proveedor y del transporte de medios mientras el
Gateway es propietario de credenciales, instrucciones y política de herramientas. `talk.session.*` es la
superficie común administrada por Gateway para tiempo real gateway-relay, transcripción
gateway-relay y sesiones nativas STT/TTS de sala administrada.

Las configuraciones heredadas que colocaban selectores en tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en runtime
no reinterpreta la configuración de proveedor de voz/TTS como configuración de proveedor en tiempo real.

Las combinaciones admitidas de `talk.session.create` son intencionalmente pequeñas:

| Modo            | Transporte       | Cerebro         | Propietario        | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio de proveedor full-duplex puenteado a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT de streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas estilo push-to-talk y walkie-talkie donde el cliente es propietario de captura/reproducción y el Gateway es propietario del estado de turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores en superficies propias de confianza que ejecutan acciones de herramientas del Gateway directamente.                  |

Mapa de métodos eliminados:

| Antiguo                          | Nuevo                                                    |
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
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Anexa un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión de Gateway.                                                                           |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar turnos obsoletos.                                                                                                                            |
  | `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS de un turno.                                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a herramienta del proveedor emitida por el relay; pasa `options.willContinue` para salida provisional u `options.suppressResponse` para satisfacer la llamada sin otra respuesta del asistente. |
  | `talk.session.steer`            | sesiones Talk respaldadas por agente                    | Envía control hablado `status`, `steer`, `cancel` o `followup` a la ejecución incrustada activa resuelta desde la sesión Talk.                                                           |
  | `talk.session.close`            | todas las sesiones unificadas                           | Detiene sesiones relay o revoca el estado de sala administrada, y luego olvida el id de sesión unificada.                                                                                |

  No introduzcas casos especiales de proveedor o plataforma en el núcleo para que esto funcione.
  El núcleo posee la semántica de sesiones Talk. Los plugins de proveedor poseen la configuración de sesiones del proveedor.
  Voice-call y Google Meet poseen los adaptadores de telefonía/reunión. Las aplicaciones de navegador y nativas
  poseen la UX de captura/reproducción del dispositivo.

  ## Política de compatibilidad

  Para plugins externos, el trabajo de compatibilidad sigue este orden:

  1. agrega el contrato nuevo
  2. conserva el comportamiento anterior conectado mediante un adaptador de compatibilidad
  3. emite un diagnóstico o advertencia que nombre la ruta anterior y el reemplazo
  4. cubre ambas rutas en pruebas
  5. documenta la obsolescencia y la ruta de migración
  6. elimina solo después de la ventana de migración anunciada, normalmente en una versión principal

  Los mantenedores pueden auditar la cola de migración actual con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
  conteos compactos, `--owner <id>` para un plugin o propietario de compatibilidad, y
  `pnpm plugins:boundary-report:ci` cuando una puerta de CI deba fallar por registros
  de compatibilidad vencidos, importaciones de SDK reservadas entre propietarios o subrutas de SDK
  reservadas sin usar. El informe agrupa registros de compatibilidad
  obsoletos por fecha de eliminación, cuenta referencias locales de código/docs,
  expone importaciones de SDK reservadas entre propietarios y resume el puente privado
  del SDK de host de memoria para que la limpieza de compatibilidad permanezca explícita en lugar de
  depender de búsquedas ad hoc. Las subrutas de SDK reservadas deben tener uso de propietario rastreado;
  las exportaciones auxiliares reservadas sin uso deben eliminarse del SDK público.

  Si todavía se acepta un campo de manifiesto, los autores de plugins pueden seguir usándolo hasta que
  la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo
  documentado, pero los plugins existentes no deberían romperse durante versiones menores
  ordinarias.

  ## Cómo migrar

  <Steps>
  <Step title="Migrar helpers de carga/escritura de configuración en runtime">
    Los plugins incluidos deben dejar de llamar directamente a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Prefiere la configuración que ya
    se pasó a la ruta de llamada activa. Los manejadores de larga duración que necesitan la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben usar `ctx.getRuntimeConfig()` del contexto de herramienta dentro de
    `execute` para que una herramienta creada antes de una escritura de configuración todavía vea la
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
    seguimiento y quiere suprimir deliberadamente el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas y registro;
    el gateway sigue siendo responsable de aplicar o programar el reinicio.
    `loadConfig` y `writeConfigFile` permanecen como helpers de compatibilidad
    obsoletos para plugins externos durante la ventana de migración y advierten una vez con
    el código de compatibilidad `runtime-config-load-write`. Los plugins incluidos y el código de
    runtime del repo están protegidos por barreras de escáner en
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el uso nuevo en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor gateway deben usar
    la instantánea de runtime de la solicitud, los helpers de envío/acción/cliente del canal de runtime
    deben recibir configuración desde su frontera, y los módulos de runtime de larga duración tienen
    cero llamadas ambientales `loadConfig()` permitidas.

    El código nuevo de plugins también debe evitar importar el barrel amplio de compatibilidad
    `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha del SDK
    que coincida con la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Helpers de almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tabla Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers de runtime de política de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos por escáner contra el barrel
    amplio para que las importaciones y mocks permanezcan locales al comportamiento que necesitan. El barrel
    amplio sigue existiendo para compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar extensiones incrustadas de resultados de herramientas a middleware">
    Los plugins incluidos deben reemplazar los manejadores de resultados de herramientas exclusivos del ejecutor incrustado
    `api.registerEmbeddedExtensionFactory(...)` por middleware
    neutral respecto del runtime.

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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando estén
    habilitados explícitamente y declaren cada runtime de destino en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalado no declarados
    se rechazan.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a datos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobaciones fuera del cableado heredado de `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de plugins de canal;
      mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión del canal; los hooks de autenticación
      de aprobación allí ya no los lee el núcleo
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o aplicaciones Bolt,
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redireccionamiento propiedad del plugin desde manejadores nativos de aprobación;
      el núcleo ahora posee los avisos de enrutamiento a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento fallback del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
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
    Busca en tu plugin importaciones de cualquiera de las superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones enfocadas">
    Cada exportación de la superficie anterior se mapea a una ruta de importación moderna específica:

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

    | Importación anterior | Equivalente moderno |
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
    | Ayudantes de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Ayudantes de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drenaje de cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Ayudantes seguros de rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` con reconocimiento del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Ayudantes de proxy y `fetch` protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política del despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Ayudantes de carga útil de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Ayudantes de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de preparación del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Ayudantes de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por escáner contra `infra-runtime`,
    por lo que el código del repositorio no puede retroceder al barrel amplio.

  </Step>

  <Step title="Migrate channel route helpers">
    El código nuevo de rutas de canal debe usar `openclaw/plugin-sdk/channel-route`.
    Los nombres anteriores de route-key y comparable-target permanecen como alias
    de compatibilidad durante la ventana de migración, pero los plugins nuevos
    deben usar los nombres de ruta que describen el comportamiento directamente:

    | Ayudante anterior | Ayudante moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los ayudantes de ruta modernos normalizan `{ channel, to, accountId, threadId }`
    de forma consistente en aprobaciones nativas, supresión de respuestas,
    deduplicación entrante, entrega de Cron y enrutamiento de sesiones.

    No agregues nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    de los ayudantes de rutas cargadas respaldados por el analizador
    (`parseExplicitTargetForLoadedChannel` o `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` desde `plugin-sdk/channel-route`.
    Esos hooks están obsoletos y permanecen solo para plugins anteriores durante la
    ventana de migración. Los nuevos plugins de canal deben usar
    `messaging.targetResolver.resolveTarget(...)` para la normalización del id
    de destino y la alternativa ante falta en directorio, `messaging.inferTargetChatType(...)`
    cuando el núcleo necesita un tipo de par temprano, y `messaging.resolveOutboundSessionRoute(...)`
    para la sesión nativa del proveedor y la identidad del hilo.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Tabla de rutas de importación comunes">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartidos del asistente de configuración | Traductor de configuración, solicitudes de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Auxiliares de entorno de ejecución para el momento de configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importar, auxiliares de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Use `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Auxiliares de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares multicuenta | Auxiliares de lista/configuración/compuerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Auxiliares de id. de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id. de cuenta |
  | `plugin-sdk/account-resolution` | Auxiliares de búsqueda de cuentas | Auxiliares de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Auxiliares de cuenta específicos | Auxiliares de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y auxiliares de acceso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo primitivas compartidas del esquema de configuración de canal y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; use `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envoltorios entrantes | Auxiliares compartidos de ruta + constructor de envoltorios |
  | `plugin-sdk/channel-inbound` | Auxiliares de recepción entrante | Construcción de contexto, formato, raíces, ejecutores, despacho de respuestas preparado y predicados de despacho |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para análisis de destinos | Use `plugin-sdk/channel-targets` para auxiliares genéricos de análisis de destinos, `plugin-sdk/channel-route` para comparación de rutas, y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del Plugin para la resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Auxiliares de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Auxiliares del ciclo de vida de mensajes salientes | Adaptadores de mensajes, recibos, auxiliares de envío duradero, auxiliares de vista previa/transmisión en vivo, opciones de respuesta, auxiliares de ciclo de vida, identidad saliente y planificación de payload |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculación de hilos | Auxiliares de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Auxiliares heredados de payload de medios | Constructor de payload de medios de agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de entorno de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplios de entorno de ejecución | Auxiliares de entorno de ejecución/registro/copia de seguridad/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Auxiliares específicos de entorno de ejecución | Auxiliares de registrador/entorno de ejecución, tiempo de espera, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartidos de entorno de ejecución de Plugin | Auxiliares de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de canalización de hooks | Auxiliares compartidos de canalización de hooks internos/Webhook |
  | `plugin-sdk/lazy-runtime` | Auxiliares de entorno de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de procesos | Auxiliares compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Auxiliares de entorno de ejecución de CLI | Formato de comandos, esperas, auxiliares de versión |
  | `plugin-sdk/gateway-runtime` | Auxiliares de Gateway | Cliente de Gateway, auxiliar de inicio listo para bucle de eventos y auxiliares de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Shim obsoleto de compatibilidad de configuración | Prefiera `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comandos de Telegram | Auxiliares de validación de comandos de Telegram estables ante fallback cuando la superficie de contrato de Telegram incluida no está disponible |
  | `plugin-sdk/approval-runtime` | Auxiliares de solicitud de aprobación | Payload de aprobación de ejecución/Plugin, auxiliares de capacidad/perfil de aprobación, auxiliares de enrutamiento/entorno de ejecución de aprobación nativa y formato de rutas de visualización de aprobación estructurada |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticación de aprobación | Resolución de aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares de cliente de aprobación | Auxiliares de perfil/filtro de aprobación de ejecución nativa |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de Gateway de aprobación | Auxiliar compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares de adaptadores de aprobación | Auxiliares ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal en caliente |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares de manejadores de aprobación | Auxiliares más amplios de entorno de ejecución de manejadores de aprobación; prefiera los puntos específicos de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de destinos de aprobación | Auxiliares de vinculación de destino/cuenta de aprobación nativa |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de respuesta de aprobación | Auxiliares de payload de respuesta de aprobación de ejecución/Plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de entorno de ejecución de canal | Auxiliares genéricos para registrar/obtener/observar contexto de entorno de ejecución de canal |
  | `plugin-sdk/security-runtime` | Auxiliares de seguridad | Auxiliares compartidos de confianza, compuertas de DM, archivos/rutas limitados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF | Auxiliares de lista de hosts permitidos y política de redes privadas |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de entorno de ejecución SSRF | Dispatcher fijado, fetch protegido, auxiliares de política SSRF |
  | `plugin-sdk/system-event-runtime` | Auxiliares de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Auxiliares de Heartbeat | Auxiliares de activación, evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Auxiliares de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Auxiliares de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Auxiliares de deduplicación | Cachés de deduplicación en memoria |
  | `plugin-sdk/file-access-runtime` | Auxiliares de acceso a archivos | Auxiliares seguros de rutas de archivos/medios locales |
  | `plugin-sdk/transport-ready-runtime` | Auxiliares de disponibilidad del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Auxiliares de política de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Auxiliares de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de compuertas de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy envueltos | `resolveFetch`, auxiliares de proxy, auxiliares de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Auxiliares de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos y mapeo de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Auxiliares de compuertas de comandos y superficie de comandos | `resolveControlCommandGate`, auxiliares de autorización de remitentes, auxiliares de registro de comandos, incluido formato de menú de argumentos dinámicos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Auxiliares de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de protección del cuerpo de Webhook | Auxiliares de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Entorno de ejecución compartido de respuestas | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho de respuestas | Finalización, despacho del proveedor y auxiliares de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Auxiliares de historial de respuestas | `createChannelHistoryWindow`; exportaciones de compatibilidad obsoletas de auxiliares de mapas como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de fragmentos de respuesta | Auxiliares de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Auxiliares de almacén de sesiones | Auxiliares de ruta de almacén + actualizado-en |
  | `plugin-sdk/state-paths` | Auxiliares de rutas de estado | Auxiliares de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Constructores de resúmenes de estado de canal/cuenta, valores predeterminados de estado de runtime, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de destinos | Helpers compartidos de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slugs/cadenas |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extrae cargas útiles normalizadas de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de destino de envío de argumentos de herramienta |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas de descarga temporal |
  | `plugin-sdk/logging-core` | Helpers de registro | Logger de subsistema y helpers de redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de runtime de proveedor | Helpers de resolución de claves de API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API de proveedor | Helpers de incorporación/escritura de perfiles de claves de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultados de autenticación de proveedor | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedor | Selección de proveedor configurado o automático y combinación de configuración sin procesar del proveedor |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedor | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelo/repetición de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, helpers de endpoints de proveedor y helpers de normalización de identificadores de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedor | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedor | Helpers genéricos de capacidad HTTP/endpoint de proveedor, incluidos helpers de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch de proveedor | Helpers de registro/caché de proveedores web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de búsqueda web de proveedor | Helpers acotados de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de búsqueda web de proveedor | Helpers acotados de contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Helpers de búsqueda web de proveedor | Helpers de registro/caché/runtime de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedor |
  | `plugin-sdk/provider-stream` | Helpers de envoltorios de streams de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorio de stream y helpers compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de proveedor | Helpers de transporte nativo de proveedor, como fetch protegido, extracción de texto de resultados de herramienta, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas útiles de medios |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación de medios | Helpers compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedores de comprensión de medios más exportaciones de helpers de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia obsoleta de compatibilidad de texto | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedores de voz más helpers orientados a proveedores para directivas, registro, validación y constructor de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedor, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedor, helpers de registro/resolución, helpers de sesión de puente, colas compartidas de respuesta hablada del agente, control de voz de ejecuciones activas, salud de transcripción/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consulta forzada, seguimiento de contexto de turno, seguimiento de actividad de salida y helpers de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Helpers de generación de imágenes | Tipos de proveedores de generación de imágenes más helpers de activos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción de cargas útiles de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas acotadas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de instantáneas/resúmenes de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista de permitidos | Helpers de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso de grupo | Helpers compartidos de decisión de acceso de grupo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas obsoletas de compatibilidad | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helpers de protección para mensajes directos | Helpers acotados de política de protección previa a criptografía |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensión | Primitivas de helpers de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destinos de Webhook | Registro de destinos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad con Zod | Importa `zod` desde `zod` directamente |
  | `plugin-sdk/memory-core` | Helpers de memory-core incluidos | Superficie de helpers de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime del motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memoria | Helpers ligeros de registro de proveedores de embeddings de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base de host de memoria | Exportaciones del motor base de host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos; los proveedores remotos concretos viven en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memoria | Exportaciones del motor QMD de host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento de host de memoria | Exportaciones del motor de almacenamiento de host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales de host de memoria | Helpers multimodales de host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memoria | Helpers de consulta de host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos de host de memoria | Helpers de secretos de host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado de host de memoria | Helpers de estado de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI de host de memoria | Helpers de runtime de CLI de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central de host de memoria | Helpers de runtime central de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime de host de memoria | Helpers de archivo/runtime de host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de runtime central de host de memoria | Alias independiente del proveedor para helpers de runtime central de host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos de host de memoria | Alias independiente del proveedor para helpers de diario de eventos de host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivo/runtime de memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helpers de Markdown gestionado | Helpers compartidos de Markdown gestionado para Plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada perezosa de runtime del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado de host de memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel obsoleto de compatibilidad local del repositorio; usa subrutas de prueba locales del repositorio enfocadas, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. El inventario del punto de entrada del compilador vive en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se
generan a partir del subconjunto público.

Las superficies auxiliares reservadas de plugins incluidos se retiraron del
mapa de exportaciones público del SDK, excepto las fachadas de compatibilidad
documentadas explícitamente, como el shim obsoleto `plugin-sdk/discord`
conservado para el paquete publicado `@openclaw/discord@2026.3.13`. Los
helpers específicos del propietario viven dentro del paquete del plugin
propietario; el comportamiento compartido del host debe pasar por contratos
genéricos del SDK como `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

Usa la importación más acotada que coincida con la tarea. Si no encuentras una
exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los
mantenedores qué contrato genérico debería poseerla.

## Obsolescencias activas

Obsolescencias más acotadas que aplican en todo el SDK de plugins, el contrato
de proveedor, la superficie de runtime y el manifiesto. Cada una todavía
funciona hoy, pero se eliminará en una futura versión mayor. La entrada debajo
de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones; solo se importan desde la subruta más acotada. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` u
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; devuelve
    un único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal downstream (Slack, Discord, Matrix, MS Teams) ya
    cambiaron.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para
    plugins de canal más antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los helpers `channelActions*` en `openclaw/plugin-sdk/channel-actions`
    están obsoletos junto con las exportaciones de canal "actions" sin procesar.
    Expón capacidades mediante la superficie semántica `presentation`: los
    plugins de canal declaran qué renderizan (tarjetas, botones, selectores) en
    lugar de qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin de
    proveedor. OpenClaw ya no necesita el helper del SDK para registrar el
    envoltorio de la herramienta.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para crear una envoltura plana de
    prompt en texto sin formato a partir de mensajes entrantes de canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (hilo, tema,
    respuesta a, reacciones) como campos tipados en lugar de concatenarlos en
    una cadena de prompt. El helper `formatAgentEnvelope(...)` sigue siendo
    compatible para envolturas sintetizadas orientadas al asistente, pero las
    envolturas entrantes en texto sin formato están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que posprocese texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
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

    `deactivate` permanece conectado como alias de compatibilidad obsoleto
    hasta después del 2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Antiguo**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: deja que el núcleo prepare enlaces de subagente `thread: true`
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

  <Accordion title="Provider discovery types → provider catalog types">
    Cuatro alias de tipos de descubrimiento ahora son envoltorios ligeros sobre
    los tipos de la era del catálogo:

    | Alias antiguo              | Tipo nuevo                 |
    | -------------------------- | -------------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`     |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`   |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`    |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`    |

    Más la bolsa estática heredada `ProviderCapabilities`: los plugins de
    proveedor deben usar hooks explícitos de proveedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y lista de
    niveles clasificada. OpenClaw degrada automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, `reasoning` combinado opcional y
    datos `compat` combinados del modelo opcionales. Los plugins de proveedor
    pueden usar esos datos de catálogo para exponer un perfil específico del
    modelo solo cuando el contrato de solicitud configurado lo admite.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de obsolescencia, pero no se componen con el resultado
    del perfil.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
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

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    Campo de manifiesto **antiguo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` en el manifiesto. Esto consolida los metadatos
    de entorno de configuración/estado en un solo lugar y evita arrancar el
    runtime del plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos espacios, una sola llamada de registro. Los helpers aditivos de
    prompt y corpus (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) no se ven afectados.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Antiguo**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico de proveedor de embeddings se puede reutilizar fuera
    de memoria y es la ruta compatible para proveedores nuevos. La API de
    registro específica de memoria permanece conectada como compatibilidad
    obsoleta mientras migran los proveedores existentes. La inspección de
    plugins informa el uso no incluido como deuda de compatibilidad.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Dos alias de tipos heredados todavía se exportan desde
    `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                            |
    | ---------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto a favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor en vivo de
    flujo de tareas.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el runtime de mutación
    administrada de TaskFlow para plugins que crean, actualizan, cancelan o
    ejecutan tareas hijas desde un flujo. Usa `runtime.tasks.flows` cuando el
    plugin solo necesita lecturas basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Cubierto arriba en "Cómo migrar → Migrar extensiones incrustadas de
    resultados de herramienta a middleware". Incluido aquí para completar: la
    ruta eliminada solo para el ejecutor incrustado
    `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de
    runtimes en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
incluidos en `extensions/`) se rastrean dentro de sus propios barrels `api.ts`
y `runtime-api.ts`. No afectan los contratos de plugins de terceros y no se
enumeran aquí. Si consumes directamente el barrel local de un plugin incluido,
lee los comentarios de obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                         | Qué ocurre                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **Ahora**                      | Las superficies obsoletas emiten advertencias en tiempo de ejecución          |
| **Próxima versión principal**  | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión principal.

## Suprimir las advertencias temporalmente

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis profundo de la arquitectura
- [Manifiesto de plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
