---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un Plugin a la arquitectura moderna de Plugin
    - Mantienes un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T05:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ha pasado de una amplia capa de compatibilidad hacia atrás a una arquitectura moderna de plugins
con importaciones enfocadas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema de plugins anterior proporcionaba dos superficies completamente abiertas que permitían a los plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de
  helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** — un barrel amplio de helpers de runtime que
  mezclaba eventos del sistema, estado de Heartbeat, colas de entrega, helpers de fetch/proxy,
  helpers de archivos, tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** — un barrel amplio de compatibilidad de configuración
  que aún mantiene helpers directos obsoletos de carga/escritura durante la ventana de migración.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el ejecutor de agentes embebido.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook eliminado de extensión empaquetada
  solo para Pi que podía observar eventos del ejecutor embebido, como
  `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Siguen funcionando en runtime,
pero los nuevos plugins no deben usarlas, y los plugins existentes deberían migrar antes de que
la próxima versión mayor las elimine. La API de registro de fábrica de extensiones embebidas
solo para Pi se eliminó; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato primero deben pasar
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Eso aplica a importaciones del SDK, campos de manifiesto, APIs de configuración, hooks y
comportamiento de registro en runtime.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una futura versión mayor.
  Los plugins que sigan importando desde estas superficies se romperán cuando eso ocurra.
  Los registros de fábricas de extensiones embebidas solo para Pi ya no cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar un helper cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables frente a internas

El SDK moderno de plugins soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También desaparecieron los seams de conveniencia heredados para proveedores de canales empaquetados.
Los seams de helpers con marca de canal eran atajos privados del monorepo, no contratos estables
de plugins. Usa subrutas genéricas y estrechas del SDK en su lugar. Dentro del workspace de plugins
empaquetados, mantén los helpers propiedad del proveedor en el propio `api.ts` o
`runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene helpers de stream específicos de Claude en su propio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedor, helpers de modelo predeterminado y constructores de
  proveedor realtime en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y los helpers de onboarding/configuración en su propio
  `api.ts`

## Política de compatibilidad

Para plugins externos, el trabajo de compatibilidad sigue este orden:

1. añadir el nuevo contrato
2. mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la obsolescencia y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión mayor

Los mantenedores pueden auditar la cola de migración actual con
`pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` para
conteos compactos, `--owner <id>` para un Plugin o propietario de compatibilidad, y
`pnpm plugins:boundary-report:ci` cuando una compuerta de CI deba fallar por registros
de compatibilidad vencidos, importaciones reservadas del SDK entre propietarios o subrutas reservadas
del SDK sin uso. El informe agrupa los registros de compatibilidad obsoletos
por fecha de eliminación, cuenta referencias locales de código/documentación,
muestra importaciones reservadas del SDK entre propietarios y resume el puente privado
del SDK de memory-host para que la limpieza de compatibilidad permanezca explícita en lugar de
depender de búsquedas ad hoc. Las subrutas reservadas del SDK deben tener uso de propietario rastreado;
las exportaciones de helpers reservados sin uso deberían eliminarse del SDK público.

Si un campo de manifiesto aún se acepta, los autores de plugins pueden seguir usándolo hasta que
la documentación y los diagnósticos indiquen lo contrario. El código nuevo debería preferir el
reemplazo documentado, pero los plugins existentes no deberían romperse durante versiones menores
ordinarias.

## Cómo migrar

<Steps>
  <Step title="Migrar helpers de carga/escritura de configuración en runtime">
    Los plugins empaquetados deberían dejar de llamar directamente a
    `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Prefiere la configuración que ya se
    pasó a la ruta de llamada activa. Los handlers de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas
    de agente de larga duración deberían usar `ctx.getRuntimeConfig()` del contexto de herramienta dentro de
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
    que el cambio requiere un reinicio limpio del Gateway, y
    `afterWrite: { mode: "none", reason: "..." }` solo cuando el llamador posee el
    seguimiento y deliberadamente quiere suprimir el planificador de recarga.
    Los resultados de mutación incluyen un resumen tipado `followUp` para pruebas y logging;
    el Gateway sigue siendo responsable de aplicar o programar el reinicio.
    `loadConfig` y `writeConfigFile` permanecen como helpers de compatibilidad obsoletos
    para plugins externos durante la ventana de migración y advierten una vez con
    el código de compatibilidad `runtime-config-load-write`. Los plugins empaquetados y el código
    de runtime del repo están protegidos por barreras de escáner en
    `pnpm check:deprecated-internal-config-api` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea de runtime de la solicitud, los helpers de envío/acción/cliente de canales de runtime
    deben recibir configuración desde su frontera, y los módulos de runtime de larga duración tienen
    cero llamadas ambientales `loadConfig()` permitidas.

    El código nuevo de plugins también debería evitar importar el barrel amplio de compatibilidad
    `openclaw/plugin-sdk/config-runtime`. Usa la subruta estrecha del SDK que coincida con el trabajo:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de instantáneas actuales de runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Helpers de almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers de runtime de políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Overrides de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins empaquetados y sus pruebas están protegidos por escáner contra el barrel amplio
    para que las importaciones y mocks permanezcan locales al comportamiento que necesitan. El barrel amplio
    aún existe para compatibilidad externa, pero el código nuevo no debería
    depender de él.

  </Step>

  <Step title="Migrar extensiones de resultados de herramientas de Pi a middleware">
    Los plugins empaquetados deben reemplazar los handlers de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)` solo para Pi con
    middleware neutral respecto del runtime.

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

    Los plugins externos no pueden registrar middleware de resultados de herramientas porque puede
    reescribir salida de herramientas de alta confianza antes de que el modelo la vea.

  </Step>

  <Step title="Migrar handlers nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobaciones fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público de plugins de canal;
      mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de canales; los hooks de autenticación
      de aprobaciones allí ya no son leídos por core
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o apps Bolt,
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde handlers nativos de aprobación;
      core ahora posee los avisos de enrutado a otra parte a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat`
    de Windows no resueltos ahora fallan de forma cerrada salvo que pases explícitamente
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

    Para helpers del lado del host, usa el runtime de Plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otras funciones auxiliares del puente heredado:

    | Importación anterior | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | funciones auxiliares del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la interfaz enfocada de
    funciones auxiliares que realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Funciones auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Funciones auxiliares de eventos Heartbeat y visibilidad | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entrega pendiente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Funciones auxiliares seguras para rutas de archivos locales/medios | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` con reconocimiento de despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Funciones auxiliares de proxy y `fetch` protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Funciones auxiliares de carga útil y comando para respuesta de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Funciones auxiliares de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Funciones auxiliares para tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivo | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por el escáner contra `infra-runtime`, por lo que el código del repositorio
    no puede volver a depender del barril amplio.

  </Step>

  <Step title="Migrate channel route helpers">
    El código nuevo de rutas de canal debe usar `openclaw/plugin-sdk/channel-route`.
    Los nombres antiguos de clave de ruta y destino comparable permanecen como
    alias de compatibilidad durante la ventana de migración, pero los plugins nuevos deben usar los nombres de ruta
    que describen el comportamiento directamente:

    | Función auxiliar anterior | Función auxiliar moderna |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Las funciones auxiliares de ruta modernas normalizan `{ channel, to, accountId, threadId }`
    de forma coherente entre aprobaciones nativas, supresión de respuestas, deduplicación entrante,
    entrega por cron y enrutamiento de sesiones. Si tu plugin posee una gramática de destino
    personalizada, usa `resolveChannelRouteTargetWithParser(...)` para adaptar ese
    analizador al mismo contrato de destino de ruta.

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
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada para proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Indicaciones de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de runtime en tiempo de configuración | Adaptadores de parches de configuración seguros para importación, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Ayudantes de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes de varias cuentas | Ayudantes de lista/configuración/puerta de acciones de cuentas |
  | `plugin-sdk/account-id` | Ayudantes de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas y reserva predeterminada |
  | `plugin-sdk/account-helpers` | Ayudantes acotados de cuentas | Ayudantes de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factorías de adaptadores de configuración y ayudantes de acceso por DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquema de configuración | Primitivas compartidas de esquema de configuración de canal y solo el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los nuevos plugins deben definir esquemas locales del plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usa `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Ayudantes de estado de cuenta y ciclo de vida de flujo de borrador | `createAccountStatusSink`, ayudantes de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobre entrante | Ayudantes compartidos de ruta y constructor de sobres |
  | `plugin-sdk/inbound-reply-dispatch` | Ayudantes de respuestas entrantes | Ayudantes compartidos de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Ayudantes de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Ayudantes de dependencias de envío saliente | Búsqueda ligera `resolveOutboundSendDep` sin importar todo el runtime saliente |
  | `plugin-sdk/outbound-runtime` | Ayudantes de runtime saliente | Ayudantes de entrega saliente, delegado de identidad/envío, sesión, formato y planificación de cargas útiles |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes de ciclo de vida y adaptador de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de carga útil de medios | Constructor de carga útil de medios de agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes amplios de runtime | Ayudantes de runtime/registro/copia de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Ayudantes acotados de entorno de runtime | Entorno de logger/runtime, tiempo de espera, reintento y ayudantes de backoff |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de runtime de plugin | Ayudantes de comandos/hooks/http/interactivos de plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de canalización de hooks | Ayudantes compartidos de canalización de hooks internos/webhook |
  | `plugin-sdk/lazy-runtime` | Ayudantes de runtime perezoso | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de exec |
  | `plugin-sdk/cli-runtime` | Ayudantes de runtime de CLI | Formato de comandos, esperas, ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway, ayudante de inicio listo para el bucle de eventos y ayudantes de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilidad de configuración obsoleto | Prefiere `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram estables con reserva cuando la superficie contractual de Telegram incluida no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de indicaciones de aprobación | Carga útil de aprobación de exec/plugin, ayudantes de capacidad/perfil de aprobación, ayudantes de enrutamiento/runtime de aprobación nativa y formato de ruta de visualización de aprobación estructurada |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobación | Resolución de aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobación | Ayudantes de perfil/filtro de aprobación nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobación | Ayudante compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptador de aprobación | Ayudantes ligeros de carga de adaptador de aprobación nativa para puntos de entrada de canal activos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de manejador de aprobación | Ayudantes más amplios de runtime de manejador de aprobación; prefiere las costuras más acotadas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destino de aprobación | Ayudantes de vinculación de destino/cuenta de aprobación nativa |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobación | Ayudantes de carga útil de respuesta de aprobación de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de runtime de canal | Ayudantes genéricos para registrar/obtener/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, bloqueo de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de política SSRF | Ayudantes de lista de permitidos de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de runtime SSRF | Dispatcher fijado, fetch protegido, ayudantes de política SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Ayudantes de evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de deduplicación | Cachés de deduplicación en memoria |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros de rutas de archivos locales/medios |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de preparación de transporte | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de control de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch/proxy envueltos | `resolveFetch`, ayudantes de proxy, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entrada de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ayudantes de bloqueo de comandos y superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes de registro de comandos incluido el formato dinámico de menú de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Ayudantes de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes Webhook | Utilidades de destino Webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección de cuerpo de Webhook | Ayudantes de lectura/límite de cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes acotados de despacho de respuestas | Finalización, despacho de proveedor y ayudantes de etiqueta de conversación |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencia de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuesta | Ayudantes de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesión | Ruta de almacén y ayudantes de actualización |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de destino | Ayudantes compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitud | Extraer URL de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Ayudantes de comandos temporizados | Ejecutor de comandos temporizado con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de cargas de herramientas | Extrae cargas normalizadas de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extrae campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas de descargas temporales |
  | `plugin-sdk/logging-core` | Helpers de registro | Registrador de subsistema y helpers de censura |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de cargas de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación en tiempo de ejecución de proveedores | Helpers de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API de proveedores | Helpers de incorporación/escritura de perfiles de claves de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultados de autenticación de proveedores | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de inicio de sesión interactivo de proveedores | Helpers compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedores | Selección de proveedor configurado o automática y combinación de configuración sin procesar de proveedores |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedores | Helpers de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelos/repetición de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, helpers de endpoints de proveedores y helpers de normalización de identificadores de modelos |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedores | Helpers genéricos de capacidades HTTP/endpoints de proveedores, incluidos helpers de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de proveedores | Helpers de registro/caché de proveedores de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de web-search de proveedores | Helpers acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de activación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search de proveedores | Helpers acotados de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de proveedores | Helpers de registro/caché/tiempo de ejecución de proveedores de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos, y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedores |
  | `plugin-sdk/provider-stream` | Helpers envoltorios de flujos de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y helpers compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de proveedores | Helpers de transporte nativo de proveedores, como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas de medios |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación de medios | Helpers compartidos de conmutación por error, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedores de comprensión de medios más exportaciones de helpers de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Helpers compartidos de texto | Eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de censura, helpers de etiquetas de directivas, utilidades de texto seguro y helpers relacionados de texto/registro |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedores de voz más helpers de directivas, registro y validación orientados a proveedores, y constructor de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedores, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedores, helpers de registro/resolución y helpers de sesión de puente |
  | `plugin-sdk/image-generation` | Helpers de generación de imágenes | Tipos de proveedores de generación de imágenes más helpers de recursos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/interactive-runtime` | Helpers de respuestas interactivas | Normalización/reducción de cargas de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canales | Primitivas acotadas de esquemas de configuración de canales |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canales | Helpers de autorización de escritura de configuración de canales |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canales | Exportaciones compartidas del preludio de plugins de canales |
  | `plugin-sdk/channel-status` | Helpers de estado de canales | Helpers compartidos de instantáneas/resúmenes de estado de canales |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de listas de permitidos | Helpers de edición/lectura de configuración de listas de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso de grupos | Helpers compartidos de decisiones de acceso de grupos |
  | `plugin-sdk/direct-dm` | Helpers de DM directo | Helpers compartidos de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensiones | Primitivas de canal pasivo/estado y helpers de proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destinos de Webhook | Registro de destinos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Helpers de rutas de Webhook | Helpers de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de plugins |
  | `plugin-sdk/memory-core` | Helpers empaquetados de memory-core | Superficie de helpers de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada en tiempo de ejecución del motor de memoria | Fachada en tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor de base del host de memoria | Exportaciones del motor de base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consultas del host de memoria | Helpers de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria | Helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Helpers de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Helpers de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/tiempo de ejecución del host de memoria | Helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del tiempo de ejecución central del host de memoria | Alias neutral respecto al proveedor para helpers de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Helpers de Markdown gestionado | Helpers compartidos de Markdown gestionado para plugins adyacentes a la memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active memory | Fachada diferida en tiempo de ejecución del gestor de búsqueda de active-memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel amplio heredado de compatibilidad; prefiere subrutas de prueba enfocadas, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la superficie del SDK. La lista completa de más de 200 puntos de entrada está en `scripts/lib/plugin-sdk-entrypoints.json`.

Los seams auxiliares reservados de plugins incluidos se retiraron del mapa de exportación del SDK público, salvo por facades de compatibilidad documentadas explícitamente, como el shim obsoleto `plugin-sdk/discord` conservado para el paquete publicado `@openclaw/discord@2026.3.13`. Los auxiliares específicos del propietario viven dentro del paquete del plugin propietario; el comportamiento compartido del host debe pasar por contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

Usa la importación más específica que coincida con la tarea. Si no encuentras una exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los mantenedores qué contrato genérico debería poseerla.

## Obsolescencias activas

Obsolescencias más específicas que se aplican en todo el SDK de plugins, el contrato de proveedores, la superficie de runtime y el manifiesto. Cada una sigue funcionando hoy, pero se eliminará en una futura versión mayor. La entrada debajo de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones; solo importadas desde la subruta más específica. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Anterior**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` u
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`: devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal descendentes (Slack, Discord, Matrix, MS Teams) ya
    hicieron el cambio.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para plugins
    de canal más antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los auxiliares `channelActions*` en `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones de canal de "acciones" sin procesar.
    Expón capacidades a través de la superficie semántica `presentation` en su
    lugar: los plugins de canal declaran qué renderizan (tarjetas, botones,
    selectores), no qué nombres de acción sin procesar aceptan.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Anterior**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el contenedor de la
    herramienta.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Anterior**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para crear un sobre de prompt de
    texto plano desde mensajes entrantes de canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (hilo, tema,
    respuesta a, reacciones) como campos tipados en lugar de concatenarlos en una
    cadena de prompt. El auxiliar `formatAgentEnvelope(...)` sigue siendo
    compatible para sobres sintetizados orientados al asistente, pero los sobres
    entrantes de texto plano están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que posprocesara texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Cuatro alias de tipos de descubrimiento ahora son envoltorios ligeros sobre
    los tipos de la era del catálogo:

    | Alias anterior             | Tipo nuevo                |
    | -------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`   |

    Además, la bolsa estática heredada `ProviderCapabilities`: los plugins
    proveedores deben usar hooks explícitos de proveedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Anterior** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y lista
    ordenada de niveles. OpenClaw degrada automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de obsolescencia, pero no se componen con el resultado del
    perfil.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Anterior**: implementar `resolveExternalOAuthProfiles(...)` sin declarar el
    proveedor en el manifiesto del plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del
    plugin **e** implementa `resolveExternalAuthProfiles(...)`. La ruta antigua de
    "respaldo de autenticación" emite una advertencia en runtime y se eliminará.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    Campo de manifiesto **anterior**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` del manifiesto. Esto consolida los metadatos de
    entorno de configuración/estado en un solo lugar y evita iniciar el runtime
    del plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Anterior**: tres llamadas separadas:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos espacios, una sola llamada de registro. Los auxiliares de memoria
    aditivos (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) no se ven afectados.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Dos alias de tipo heredados siguen exportados desde `src/plugins/runtime/types.ts`:

    | Anterior                    | Nuevo                           |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo llama internamente al
    nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor activo de flujo de tareas.

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
    Cubierto arriba en "Cómo migrar → Migrar extensiones de resultado de
    herramienta de Pi a middleware". Se incluye aquí por completitud: la ruta
    eliminada exclusiva de Pi `api.registerEmbeddedExtensionFactory(...)` se
    reemplaza por `api.registerAgentToolResultMiddleware(...)` con una lista
    explícita de runtimes en `contracts.agentToolResultMiddleware`.
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
incluidos bajo `extensions/`) se rastrean dentro de sus propios barrels `api.ts`
y `runtime-api.ts`. No afectan los contratos de plugins de terceros y no se
listan aquí. Si consumes directamente el barrel local de un plugin incluido, lee
los comentarios de obsolescencia de ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                 | Qué ocurre                                                               |
| ---------------------- | ------------------------------------------------------------------------ |
| **Ahora**              | Las superficies obsoletas emiten advertencias en runtime                 |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se migraron. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir temporalmente las advertencias

Define estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia completa de importación de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins proveedores](/es/plugins/sdk-provider-plugins) — creación de plugins proveedores
- [Elementos internos de plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
