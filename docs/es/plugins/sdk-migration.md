---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Está actualizando un Plugin a la arquitectura moderna de Plugin
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-05-06T05:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ha pasado de una amplia capa de compatibilidad con versiones anteriores a una arquitectura moderna de plugins
con importaciones enfocadas y documentadas. Si tu plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrar.

## Qué está cambiando

El sistema antiguo de plugins proporcionaba dos superficies muy abiertas que permitían a los plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - una única importación que reexportaba decenas de
  ayudantes. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un amplio barrel de ayudantes de runtime que
  mezclaba eventos del sistema, estado de heartbeat, colas de entrega, ayudantes de fetch/proxy,
  ayudantes de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un amplio barrel de compatibilidad de configuración
  que todavía contiene ayudantes directos de carga/escritura obsoletos durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a
  ayudantes del lado del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook eliminado de extensión empaquetada
  exclusivo de Pi que podía observar eventos del ejecutor integrado como
  `tool_result`.

Las superficies amplias de importación ahora están **obsoletas**. Todavía funcionan en runtime,
pero los plugins nuevos no deben usarlas, y los plugins existentes deben migrar antes de que
la próxima versión mayor las elimine. La API de registro de fábrica de extensión integrada
exclusiva de Pi se eliminó; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato primero deben pasar
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Eso aplica a importaciones del SDK, campos de manifiesto, APIs de configuración, hooks y comportamiento
de registro en runtime.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión mayor.
  Los plugins que todavía importen desde estas superficies se romperán cuando eso ocurra.
  Los registros de fábrica de extensión integrada exclusivos de Pi ya no cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** - importar un ayudante cargaba decenas de módulos no relacionados
- **Dependencias circulares** - las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** - no había forma de saber qué exportaciones eran estables frente a internas

El SDK de plugins moderno corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autónomo con un propósito claro y un contrato documentado.

Las costuras de conveniencia heredadas de proveedores para canales empaquetados también desaparecieron.
Las costuras auxiliares con marca de canal eran atajos privados del monorepo, no contratos estables
de plugins. Usa subrutas genéricas estrechas del SDK en su lugar. Dentro del espacio de trabajo de
plugins empaquetados, mantén los ayudantes propiedad del proveedor en el propio `api.ts` o
`runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene ayudantes de stream específicos de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedor, ayudantes de modelo predeterminado y constructores de proveedor
  realtime en su propio `api.ts`
- OpenRouter mantiene constructor de proveedor y ayudantes de onboarding/configuración en su propio
  `api.ts`

## Plan de migración de Talk y voz realtime

El código de voz realtime, telefonía, reuniones y Talk de navegador se está moviendo de
contabilidad de turnos local a la superficie a un controlador compartido de sesiones Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. El nuevo controlador posee el sobre común de eventos Talk,
el estado de turno activo, el estado de captura, el estado de audio de salida, el historial reciente
de eventos y el rechazo de turnos obsoletos. Los plugins de proveedor deben seguir siendo dueños de
las sesiones realtime específicas del proveedor; los plugins de superficie deben seguir siendo dueños de captura,
reproducción, telefonía y particularidades de reuniones.

Esta migración de Talk rompe limpiamente de forma intencional:

1. Mantén el controlador compartido y las primitivas de runtime en
   `plugin-sdk/realtime-voice`.
2. Mueve las superficies empaquetadas al controlador compartido: relé de navegador,
   traspaso de sala gestionada, realtime de llamada de voz, STT en streaming de llamada de voz, Google
   Meet realtime y push-to-talk nativo.
3. Reemplaza las familias antiguas de RPC de Talk por la API final `talk.session.*` y
   `talk.client.*`.
4. Anuncia un canal vivo de eventos Talk en Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina el antiguo endpoint HTTP realtime y cualquier ruta de sobrescritura de instrucciones
   en tiempo de solicitud.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)` salvo que esté
implementando un adaptador de bajo nivel o fixture de prueba. Prefiere el controlador compartido
para que los eventos con alcance de turno no puedan emitirse sin un id de turno, las llamadas obsoletas
a `turnEnd` / `turnCancel` no puedan borrar un turno activo más nuevo y los eventos del ciclo de vida
del audio de salida permanezcan coherentes entre telefonía, reuniones, relé de navegador, traspaso
de sala gestionada y clientes Talk nativos.

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
```

Las sesiones WebRTC/websocket de proveedor propiedad del navegador usan `talk.client.create`,
porque el navegador posee la negociación con el proveedor y el transporte de medios, mientras el
Gateway posee credenciales, instrucciones y política de herramientas. `talk.session.*` es la
superficie común gestionada por Gateway para realtime por gateway-relay, transcripción por gateway-relay
y sesiones STT/TTS nativas de sala gestionada.

Las configuraciones heredadas que ubicaban selectores realtime junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en runtime
no reinterpreta la configuración de proveedores de voz/TTS como configuración de proveedor realtime.

Las combinaciones admitidas de `talk.session.create` son deliberadamente pequeñas:

| Modo            | Transporte      | Brain           | Propietario        | Notas                                                                                                                     |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio de proveedor full-duplex puenteado a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                         |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de estilo push-to-talk y walkie-talkie donde el cliente posee captura/reproducción y el Gateway posee el estado de turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores para superficies propias de confianza que ejecutan acciones de herramientas del Gateway directamente. |

Mapa de métodos eliminados:

| Antiguo                         | Nuevo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` o `talk.session.cancelTurn`  |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

El vocabulario unificado de control también es deliberadamente estrecho:

| Método                          | Aplica a                                                | Contrato                                                                                              |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión de proveedor propiedad de la misma conexión Gateway. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala gestionada.                                                        |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo tras la validación de turno obsoleto.                                        |
| `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS para un turno.                              |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.           |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a herramienta de proveedor emitida por el relé.                                  |
| `talk.session.close`            | todas las sesiones unificadas                           | Detiene sesiones de relé o revoca el estado de sala gestionada y luego olvida el id de sesión unificada. |

No introduzcas casos especiales de proveedor o plataforma en core para hacer que esto funcione.
Core posee la semántica de sesiones Talk. Los plugins de proveedor poseen la configuración de sesión
del proveedor. Voice-call y Google Meet poseen adaptadores de telefonía/reunión. Las aplicaciones
de navegador y nativas poseen la experiencia de usuario de captura/reproducción del dispositivo.

## Política de compatibilidad

Para plugins externos, el trabajo de compatibilidad sigue este orden:

1. añade el nuevo contrato
2. mantén el comportamiento antiguo cableado mediante un adaptador de compatibilidad
3. emite un diagnóstico o advertencia que nombre la ruta antigua y su reemplazo
4. cubre ambas rutas en pruebas
5. documenta la obsolescencia y la ruta de migración
6. elimina solo después de la ventana de migración anunciada, normalmente en una versión mayor

  Los mantenedores pueden auditar la cola de migración actual con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
  conteos compactos, `--owner <id>` para un Plugin o propietario de compatibilidad,
  y `pnpm plugins:boundary-report:ci` cuando una compuerta de CI deba fallar por
  registros de compatibilidad vencidos, importaciones de SDK reservadas entre
  propietarios o subrutas de SDK reservadas sin usar. El informe agrupa los
  registros de compatibilidad obsoletos por fecha de eliminación, cuenta las
  referencias locales de código y documentación, muestra importaciones de SDK
  reservadas entre propietarios y resume el puente privado del SDK de host de
  memoria para que la limpieza de compatibilidad siga siendo explícita en lugar de
  depender de búsquedas ad hoc. Las subrutas de SDK reservadas deben tener uso de
  propietario registrado; las exportaciones de helpers reservados sin usar deben
  eliminarse del SDK público.

  Si un campo de manifiesto todavía se acepta, los autores de plugins pueden
  seguir usándolo hasta que la documentación y los diagnósticos indiquen lo
  contrario. El código nuevo debe preferir el reemplazo documentado, pero los
  plugins existentes no deben romperse durante versiones menores ordinarias.

  ## Cómo migrar

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Los plugins integrados deben dejar de llamar a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)` directamente. Prefiere la
    configuración que ya se pasó a la ruta de llamada activa. Los manejadores de
    larga duración que necesitan la instantánea actual del proceso pueden usar
    `api.runtime.config.current()`. Las herramientas de agente de larga duración
    deben usar `ctx.getRuntimeConfig()` del contexto de la herramienta dentro de
    `execute` para que una herramienta creada antes de una escritura de
    configuración todavía vea la configuración de runtime actualizada.

    Las escrituras de configuración deben pasar por los helpers transaccionales y
    elegir una política posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el llamador sabe
    que el cambio requiere un reinicio limpio del Gateway, y
    `afterWrite: { mode: "none", reason: "..." }` solo cuando el llamador es dueño
    del seguimiento y quiere suprimir deliberadamente el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas
    y registro; el Gateway sigue siendo responsable de aplicar o programar el
    reinicio. `loadConfig` y `writeConfigFile` permanecen como helpers de
    compatibilidad obsoletos para plugins externos durante la ventana de migración
    y advierten una vez con el código de compatibilidad
    `runtime-config-load-write`. Los plugins integrados y el código de runtime del
    repositorio están protegidos por barreras del escáner en
    `pnpm check:deprecated-internal-config-api` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso de plugins de
    producción falla directamente, las escrituras directas de configuración
    fallan, los métodos del servidor Gateway deben usar la instantánea de runtime
    de la solicitud, los helpers de envío/acción/cliente de canales de runtime
    deben recibir la configuración desde su límite, y los módulos de runtime de
    larga duración tienen cero llamadas ambientales permitidas a `loadConfig()`.

    El código nuevo de plugins también debe evitar importar el barrel amplio de
    compatibilidad `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha
    del SDK que coincida con la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Helpers del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers de runtime de política de grupos | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins integrados y sus pruebas están protegidos por escáner contra el
    barrel amplio para que las importaciones y los mocks sigan siendo locales al
    comportamiento que necesitan. El barrel amplio todavía existe por
    compatibilidad externa, pero el código nuevo no debe depender de él.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Los plugins integrados deben reemplazar los manejadores de resultados de
    herramientas exclusivos de Pi
    `api.registerEmbeddedExtensionFactory(...)` por middleware neutral respecto al
    runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Actualiza el manifiesto del Plugin al mismo tiempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Los plugins externos no pueden registrar middleware de resultados de
    herramientas porque puede reescribir salidas de herramientas de alta confianza
    antes de que el modelo las vea.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Los plugins de canal con capacidad de aprobación ahora exponen el
    comportamiento de aprobación nativo mediante `approvalCapability.nativeRuntime`
    más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobaciones fuera del cableado
      heredado `plugin.auth` / `plugin.approvals` y ponla en
      `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de plugins de
      canal; mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de
      canales; core ya no lee ahí los hooks de autenticación de aprobaciones
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o
      apps Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde manejadores de
      aprobación nativos; core ahora posee los avisos de enrutamiento a otro
      lugar a partir de los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se
      rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de la
    capacidad de aprobación.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers
    `.cmd`/`.bat` de Windows no resueltos ahora fallan de forma cerrada salvo que
    pases explícitamente `allowShellFallback: true`.

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

    Si tu llamador no depende deliberadamente del fallback de shell, no establezcas
    `allowShellFallback` y maneja el error lanzado en su lugar.

  </Step>

  <Step title="Find deprecated imports">
    Busca en tu Plugin importaciones desde cualquiera de estas superficies
    obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Cada exportación de la superficie antigua corresponde a una ruta de
    importación moderna específica:

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

    Para helpers del lado del host, usa el runtime de Plugin inyectado en lugar de
    importar directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros helpers de puente heredados:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` todavía existe por compatibilidad externa,
    pero el código nuevo debe importar la superficie de helpers enfocada que
    realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Helpers de cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers de eventos Heartbeat y visibilidad | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad de canales | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers seguros de rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consciente del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers de payload de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de preparación de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins integrados están protegidos por escáner contra `infra-runtime`, de
    modo que el código del repositorio no puede regresar al barrel amplio.

  </Step>

  <Step title="Migrate channel route helpers">
    El código nuevo de rutas de canal debe usar
    `openclaw/plugin-sdk/channel-route`.
    Los nombres antiguos de claves de ruta y destinos comparables permanecen como
    alias de compatibilidad durante la ventana de migración, pero los plugins
    nuevos deben usar los nombres de ruta que describen directamente el
    comportamiento:

    | Helper antiguo | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los helpers de ruta modernos normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en aprobaciones nativas, supresión de respuestas, deduplicación de entradas,
    entrega de cron y enrutamiento de sesiones. Si tu Plugin posee una gramática de destino
    personalizada, usa `resolveChannelRouteTargetWithParser(...)` para adaptar ese
    analizador al mismo contrato de destino de ruta.

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
  | `plugin-sdk/plugin-entry` | Helper canónico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/builders de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y builders enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Prompts de lista de permitidos, builders de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de runtime durante la configuración | Adaptadores de parches de configuración seguros para importar, helpers de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de configuración |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de varias cuentas | Helpers de lista/configuración/compuerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Helpers de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuenta + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Helpers acotados de cuenta | Helpers de lista de cuentas/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, indicador de escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factories de adaptadores de configuración y helpers de acceso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builders de esquemas de configuración | Primitivas compartidas de esquema de configuración de canal y solo el builder genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usa `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombres de comando, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de estado de cuenta y ciclo de vida del stream de borrador | `createAccountStatusSink`, helpers de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Helpers de sobre entrante | Helpers compartidos de ruta + builder de sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de respuesta entrante | Helpers compartidos de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Helpers de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Helpers de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Helpers de dependencias de envío saliente | Búsqueda ligera `resolveOutboundSendDep` sin importar todo el runtime saliente |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime saliente | Helpers de entrega saliente, delegado de identidad/envío, sesión, formateo y planificación de payloads |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vinculaciones de hilos | Helpers de ciclo de vida de vinculaciones de hilos y adaptadores |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de payload de medios | Builder de payload de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de runtime | Helpers de runtime/logging/copia de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Helpers acotados de entorno de runtime | Entorno de logger/runtime, timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de runtime de plugin | Helpers de comandos/hooks/http/interactivos de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers compartidos de pipeline de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de proceso | Helpers compartidos de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formateo de comandos, esperas, helpers de versión |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente de Gateway, helper de inicio listo para bucle de eventos y helpers de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilidad de configuración obsoleto | Prefiere `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers de validación de comandos de Telegram estables con fallback cuando la superficie de contrato del Telegram incluido no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts de aprobación | Payload de aprobación de exec/plugin, helpers de capacidad/perfil de aprobación, helpers de enrutamiento/runtime de aprobación nativa y formateo de rutas de visualización de aprobación estructurada |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución de aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers de perfil/filtro de aprobación nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de gateway de aprobación | Helper compartido de resolución de gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprobación | Helpers ligeros de carga de adaptadores de aprobación nativa para entrypoints de canal calientes |
  | `plugin-sdk/approval-handler-runtime` | Helpers de manejador de aprobación | Helpers más amplios de runtime de manejador de aprobación; prefiere las uniones de adaptador/gateway más acotadas cuando basten |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación | Helpers de vinculación de destino/cuenta de aprobación nativa |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de payload de respuesta de aprobación de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos para registrar/obtener/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, compuerta de DM, archivos/rutas acotados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de hosts permitidos y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Dispatcher fijado, fetch protegido, helpers de política SSRF |
  | `plugin-sdk/system-event-runtime` | Helpers de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helpers de Heartbeat | Helpers de evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helpers de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helpers de deduplicación | Cachés de deduplicación en memoria |
  | `plugin-sdk/file-access-runtime` | Helpers de acceso a archivos | Helpers seguros de rutas de archivo local/medios |
  | `plugin-sdk/transport-ready-runtime` | Helpers de preparación del transporte | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de compuerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formateo de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envuelto | `resolveFetch`, helpers de proxy, helpers de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpers de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formateo de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de compuerta de comandos y superficie de comandos | `resolveControlCommandGate`, helpers de autorización de remitentes, helpers de registro de comandos incluido el formateo dinámico de menú de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Helpers de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitud de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protección del cuerpo de Webhook | Helpers de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho de respuestas | Helpers de finalización, despacho de proveedor y etiqueta de conversación |
  | `plugin-sdk/reply-history` | Helpers de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencia de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentos de respuesta | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesión | Helpers de ruta de almacén + updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de estado y directorio de OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Builders de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartidos de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extrae cargas útiles normalizadas de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos para rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Ayudantes de registro | Ayudantes de registrador de subsistema y de censura |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados para configuración de proveedores locales/autohospedados | Ayudantes de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados para configuración de proveedores autohospedados compatibles con OpenAI | Los mismos ayudantes de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación en tiempo de ejecución de proveedores | Ayudantes de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de claves de API de proveedores | Ayudantes de incorporación/escritura de perfiles para claves de API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultado de autenticación de proveedores | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Ayudantes de inicio de sesión interactivo de proveedores | Ayudantes compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedores | Selección de proveedor configurado o automático y combinación de configuración sin procesar de proveedor |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedores | Ayudantes de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelo/reproducción de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedores y ayudantes de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidad HTTP/endpoint de proveedores, incluidos ayudantes de formulario multiparte para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de web-fetch de proveedores | Ayudantes de registro/caché de proveedores de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de web-search de proveedores | Ayudantes acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contrato de web-search de proveedores | Ayudantes acotados de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de web-search de proveedores | Ayudantes de registro/caché/tiempo de ejecución de proveedores de web-search |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos, y ayudantes de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de streams de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream y ayudantes compartidos de envoltorios Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativo de proveedores, como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de medios | Ayudantes de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas útiles de medios |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación de medios | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión de medios | Tipos de proveedores de comprensión de medios, más exportaciones de ayudantes de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Ayudantes compartidos de texto | Eliminación de texto visible para el asistente, ayudantes de renderizado/fragmentación/tablas Markdown, ayudantes de censura, ayudantes de etiquetas de directiva, utilidades de texto seguro y ayudantes relacionados de texto/registro |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedores de voz, más ayudantes de directivas, registro y validación orientados a proveedores, y constructor TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedores, ayudantes de registro y ayudante compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedores, ayudantes de registro/resolución, ayudantes de sesión puente, colas compartidas de respuesta hablada de agentes, salud de transcripción/eventos, supresión de eco y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedores de generación de imágenes, más ayudantes de URL de datos/activos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Ayudantes de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuesta interactiva | Normalización/reducción de carga útil de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas acotadas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canal | Ayudantes de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones de preludio de Plugin de canal compartido |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canal | Ayudantes compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de lista de permitidos | Ayudantes de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso de grupo | Ayudantes compartidos de decisión de acceso de grupo |
  | `plugin-sdk/direct-dm` | Ayudantes de DM directo | Ayudantes compartidos de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensión | Primitivas de ayudantes de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destino Webhook | Registro de destinos Webhook y ayudantes de instalación de rutas |
  | `plugin-sdk/webhook-path` | Ayudantes de rutas Webhook | Ayudantes de normalización de rutas Webhook |
  | `plugin-sdk/web-media` | Ayudantes compartidos de medios web | Ayudantes de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Ayudantes de memory-core incluidos | Superficie de ayudantes de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base de host de memoria | Exportaciones del motor base de host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memoria | Contratos de embeddings de memoria, acceso a registro, proveedor local y ayudantes genéricos de lotes/remotos; los proveedores remotos concretos viven en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memoria | Exportaciones del motor QMD de host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento de host de memoria | Exportaciones del motor de almacenamiento de host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales de host de memoria | Ayudantes multimodales de host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta de host de memoria | Ayudantes de consulta de host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos de host de memoria | Ayudantes de secretos de host de memoria |
  | `plugin-sdk/memory-core-host-events` | Ayudantes de diario de eventos de host de memoria | Ayudantes de diario de eventos de host de memoria |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado de host de memoria | Ayudantes de estado de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI de host de memoria | Ayudantes de tiempo de ejecución CLI de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central de host de memoria | Ayudantes de tiempo de ejecución central de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/tiempo de ejecución de host de memoria | Ayudantes de archivos/tiempo de ejecución de host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del tiempo de ejecución central de host de memoria | Alias independiente del proveedor para ayudantes de tiempo de ejecución central de host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos de host de memoria | Alias independiente del proveedor para ayudantes de diario de eventos de host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución de host de memoria | Alias independiente del proveedor para ayudantes de archivos/tiempo de ejecución de host de memoria |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de Markdown gestionado | Ayudantes compartidos de Markdown gestionado para Plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado de host de memoria | Alias independiente del proveedor para ayudantes de estado de host de memoria |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel heredado de compatibilidad amplia; prefiere subrutas de prueba enfocadas como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la superficie del SDK. La lista completa de más de 200 puntos de entrada está en `scripts/lib/plugin-sdk-entrypoints.json`.

Las interfaces auxiliares reservadas para plugins incluidos se retiraron del mapa de exportaciones del SDK público, salvo las fachadas de compatibilidad documentadas explícitamente, como el shim obsoleto `plugin-sdk/discord` conservado para el paquete publicado `@openclaw/discord@2026.3.13`. Los auxiliares específicos de propietario viven dentro del paquete del plugin propietario; el comportamiento compartido del host debe pasar por contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

Usa la importación más estrecha que coincida con el trabajo. Si no puedes encontrar una exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los mantenedores qué contrato genérico debe poseerla.

## Obsolescencias activas

Obsolescencias más acotadas que se aplican al SDK de plugins, el contrato de proveedores, la superficie de runtime y el manifiesto. Cada una aún funciona hoy, pero se eliminará en una versión mayor futura. La entrada debajo de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="constructores de ayuda command-auth → command-status">
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

  <Accordion title="auxiliares de control de menciones → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` u
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal posteriores (Slack, Discord, Matrix, MS Teams) ya
    cambiaron.

  </Accordion>

  <Accordion title="shim de runtime de canal y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para
    plugins de canal antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los auxiliares `channelActions*` en `openclaw/plugin-sdk/channel-actions`
    están obsoletos junto con las exportaciones de canal de "acciones" sin
    procesar. Expón capacidades mediante la superficie semántica `presentation`
    en su lugar: los plugins de canal declaran qué renderizan (tarjetas, botones,
    selectores) en lugar de qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="auxiliar tool() del proveedor de búsqueda web → createTool() en el plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el wrapper de la
    herramienta.

  </Accordion>

  <Accordion title="sobres de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre de prompt
    plano en texto desde mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (hilo, tema,
    responder a, reacciones) como campos tipados en lugar de concatenarlos en
    una cadena de prompt. El auxiliar `formatAgentEnvelope(...)` sigue siendo
    compatible para sobres sintetizados orientados al asistente, pero los sobres
    entrantes en texto plano están en proceso de eliminación.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que haya posprocesado texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="tipos de descubrimiento de proveedores → tipos de catálogo de proveedores">
    Cuatro alias de tipos de descubrimiento ahora son wrappers delgados sobre
    los tipos de la era de catálogos:

    | Alias antiguo             | Tipo nuevo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además del contenedor estático heredado `ProviderCapabilities`; los plugins
    de proveedor deben usar hooks explícitos de proveedor, como
    `buildReplayPolicy`, `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un
    objeto estático.

  </Accordion>

  <Accordion title="hooks de política de razonamiento → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un `label` opcional y una
    lista de niveles ordenados. OpenClaw degrada automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de obsolescencia, pero no se componen con el resultado del
    perfil.

  </Accordion>

  <Accordion title="fallback de proveedor OAuth externo → contracts.externalAuthProviders">
    **Antiguo**: implementar `resolveExternalOAuthProfiles(...)` sin declarar el
    proveedor en el manifiesto del plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del
    plugin **e** implementa `resolveExternalAuthProfiles(...)`. La ruta antigua
    de "fallback de auth" emite una advertencia en runtime y se eliminará.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    **Campo de manifiesto antiguo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` en el manifiesto. Esto consolida los metadatos de
    entorno de setup/estado en un solo lugar y evita arrancar el runtime del
    plugin solo para responder búsquedas de variables de entorno.

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

    Mismos slots, una sola llamada de registro. Los auxiliares de memoria
    aditivos (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) no se ven afectados.

  </Accordion>

  <Accordion title="tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipo heredados aún exportados desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de flujo de
    tareas activo.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el runtime de mutación
    administrada de TaskFlow para plugins que crean, actualizan, cancelan o
    ejecutan tareas secundarias desde un flujo. Usa `runtime.tasks.flows` cuando
    el plugin solo necesite lecturas basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="fábricas de extensión embebidas → middleware de resultado de herramienta de agente">
    Cubierto arriba en "Cómo migrar → Migrar extensiones de resultado de
    herramienta de Pi a middleware". Incluido aquí para completar: la ruta
    eliminada solo para Pi `api.registerEmbeddedExtensionFactory(...)` se
    reemplaza por `api.registerAgentToolResultMiddleware(...)` con una lista de
    runtimes explícita en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
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
Las obsolescencias de nivel de extensión (dentro de plugins de canal/proveedor
incluidos bajo `extensions/`) se rastrean dentro de sus propios barrels `api.ts`
y `runtime-api.ts`. No afectan los contratos de plugins de terceros y no se
enumeran aquí. Si consumes directamente el barrel local de un plugin incluido,
lee los comentarios de obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en runtime                |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se migraron. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir las advertencias temporalmente

Define estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - crear plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - crear plugins de proveedor
- [Internals de plugins](/es/plugins/architecture) - análisis profundo de la arquitectura
- [Manifiesto de plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
