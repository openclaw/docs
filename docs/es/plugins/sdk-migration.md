---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad hacia atrás al SDK de Plugin moderno
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-05T11:36:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed78d88fde5449c4e8f979839a729e05348a4307a85ef9839be9d98a29b93178
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw reemplazó una amplia capa de compatibilidad retroactiva por una arquitectura de plugins moderna
creada a partir de importaciones pequeñas y enfocadas. Si tu plugin es anterior a ese
cambio, esta guía lo lleva a los contratos actuales.

## Qué cambió

Dos superficies de importación completamente abiertas solían permitir que los plugins alcanzaran casi cualquier cosa desde un
único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - reexportaba decenas de helpers para mantener
  funcionando los plugins antiguos basados en hooks mientras se construía la nueva arquitectura.
- **`openclaw/plugin-sdk/infra-runtime`** - un barrel amplio que mezclaba eventos
  del sistema, estado de heartbeat, colas de entrega, helpers de fetch/proxy, helpers de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un barrel de configuración amplio que todavía
  llevaba helpers obsoletos de carga/escritura directa durante la ventana de migración.
- **`openclaw/extension-api`** - un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el ejecutor de agente integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook eliminado exclusivo del ejecutor integrado
  que observaba eventos del ejecutor integrado como `tool_result`. Usa en su lugar
  middleware de resultados de herramientas de agente (consulta [Migrar extensiones integradas de resultados de herramientas
  a middleware](#how-to-migrate)).

Estas superficies están **obsoletas**: todavía funcionan, pero los plugins nuevos no deben
usarlas, y los plugins existentes deberían migrar antes de que la próxima versión mayor
las elimine. `registerEmbeddedExtensionFactory` ya se eliminó;
los registros heredados ya no se cargan.

<Warning>
  La capa de compatibilidad retroactiva se eliminará en una futura versión mayor.
  Los plugins que sigan importando desde estas superficies se romperán cuando eso ocurra.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios que rompen contratos pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia. Eso
se aplica a importaciones del SDK, campos del manifiesto, APIs de configuración, hooks y comportamiento
de registro en runtime.

### Por qué

- **Inicio lento** - importar un helper cargaba decenas de módulos no relacionados.
- **Dependencias circulares** - las reexportaciones amplias facilitaban la creación de
  ciclos de importación.
- **Superficie de API poco clara** - no había forma de distinguir las exportaciones estables de las internas.

Cada `openclaw/plugin-sdk/<subpath>` ahora es un módulo pequeño y autónomo con
un contrato documentado.

También desaparecieron las seams heredadas de conveniencia de proveedores para canales agrupados:
los atajos de helpers con marca de canal eran conveniencias privadas del monorepo, no
contratos estables de plugins. Usa en su lugar subrutas genéricas y estrechas del SDK. Dentro del
workspace de plugins agrupados, mantén los helpers propiedad del proveedor en el propio
`api.ts` o `runtime-api.ts` de ese plugin:

- Anthropic mantiene los helpers de stream específicos de Claude en su propia seam `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene constructores de proveedor, helpers de modelo predeterminado y constructores
  de proveedor en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedor y los helpers de onboarding/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad para plugins externos sigue este orden:

1. Agregar el contrato nuevo.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o advertencia que nombre la ruta antigua y su reemplazo.
4. Cubrir ambas rutas en pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar solo después de la ventana de migración anunciada, normalmente en una versión
   mayor.

Si un campo del manifiesto todavía se acepta, sigue usándolo hasta que la documentación y los
diagnósticos indiquen lo contrario. El código nuevo debería preferir el reemplazo documentado;
los plugins existentes no deberían romperse durante versiones menores ordinarias.

Audita la cola de migración actual con `pnpm plugins:boundary-report`:

| Marca                                                   | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`)  | Recuentos compactos en lugar del detalle completo.                             |
| `--json`                                                | Informe legible por máquina.                                                   |
| `--owner <id>`                                          | Filtra a un plugin o propietario de compatibilidad.                            |
| `--fail-on-cross-owner`                                 | Sale con código distinto de cero en importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Sale con código distinto de cero cuando ha pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Sale con código distinto de cero en shims reservados del SDK sin usar.          |

`pnpm plugins:boundary-report:ci` se ejecuta con las tres marcas de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una vaga "próxima
versión mayor"): el informe agrupa los registros obsoletos por esa fecha, cuenta
referencias locales en código/documentación, muestra importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK de memory-host. Las subrutas reservadas del SDK deben tener
uso de propietario rastreado; las exportaciones reservadas sin usar deberían eliminarse del SDK
público.

## Cómo migrar

<Steps>
  <Step title="Migrar helpers de carga/escritura de configuración en runtime">
    Los plugins agrupados deberían dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Prefiere la configuración ya
    pasada a la ruta de llamada activa. Los handlers de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deberían leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de una escritura de configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por el helper transaccional con una política explícita
    posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio necesite
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    solo cuando el llamador sea dueño del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de mutación incluyen un resumen tipado `followUp` para
    pruebas y registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` permanecen como helpers de compatibilidad obsoletos
    para plugins externos y advierten una vez con el código de compatibilidad
    `runtime-config-load-write`. Los plugins agrupados y el código de runtime del repo
    están protegidos por `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor Gateway deben usar
    la instantánea de runtime de la solicitud, los helpers de envío/acción/cliente del canal de runtime
    deben recibir configuración desde su límite, y los módulos de runtime de larga duración
    permiten cero llamadas ambientales a `loadConfig()`.

    El código nuevo de plugins debería evitar el barrel amplio `openclaw/plugin-sdk/config-runtime`.
    Usa la subruta estrecha para la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración de entrada de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Helpers de almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers de runtime de política de grupos | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescrituras de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins agrupados y sus pruebas están protegidos por escáner contra el barrel amplio
    para que las importaciones y los mocks permanezcan locales al comportamiento que necesitan. El
    barrel todavía existe para compatibilidad externa, pero el código nuevo no debería
    depender de él.

  </Step>

  <Step title="Migrar extensiones integradas de resultados de herramientas a middleware">
    Los plugins agrupados deben reemplazar los handlers de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)` exclusivos del ejecutor integrado por
    middleware neutral respecto al runtime:

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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando estén explícitamente
    habilitados y cada runtime objetivo esté declarado en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalados no declarados
    se rechazan.

  </Step>

  <Step title="Migrar handlers nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`.
    - `ChannelPlugin.approvals` se eliminó del contrato público
      de plugin de canal; mueve los campos de entrega/nativo/renderizado a
      `approvalCapability`.
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión de canal; core ya no
      lee hooks de autenticación de aprobación ahí.
    - Registra objetos de runtime propiedad del canal (clientes, tokens, apps Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíes avisos de redirección propiedad del plugin desde handlers nativos de aprobación;
      core es dueño de los avisos de enrutado a otro lugar a partir de resultados de entrega reales.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`: los stubs parciales se
      rechazan.

    Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins) para el diseño actual
    de capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat`
    de Windows no resueltos ahora fallan de forma cerrada a menos que pases explícitamente
    `allowShellFallback: true`:

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
    `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
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

    Para los helpers del lado del host, usa el runtime de Plugin inyectado en lugar de
    importar directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
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
    | helpers de almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la superficie específica que realmente
    necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Helpers de cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de cola de entrega pendiente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y respaldadas por persistencia | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers seguros para rutas de archivos/medios locales | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch con reconocimiento del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud/resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers de payload de respuesta de aprobación y comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia acotada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local al proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivo | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos por el escáner contra `infra-runtime`, así que el código del repo
    no puede volver al barrel amplio.

  </Step>

  <Step title="Migrate channel route helpers">
    El código nuevo de rutas de canal usa `openclaw/plugin-sdk/channel-route`. Los nombres antiguos
    de route-key y comparable-target permanecen como alias de compatibilidad:

    | Helper antiguo | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los helpers modernos de ruta normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en aprobaciones nativas, supresión de respuestas, deduplicación entrante,
    entrega de Cron y enrutamiento de sesiones.

    No agregues nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget`, los
    helpers de ruta cargada respaldados por parser (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`), ni
    `resolveChannelRouteTargetWithParser(...)` de `plugin-sdk/channel-route`; 
    están obsoletos y permanecen solo para plugins antiguos. Los nuevos plugins de canal
    deben usar `messaging.targetResolver.resolveTarget(...)` para la
    normalización de target-id y el fallback ante ausencia en directorio,
    `messaging.inferTargetChatType(...)` cuando el core necesita un tipo de par temprano,
    y `messaging.resolveOutboundSessionRoute(...)` para la identidad de sesión y thread
    nativa del proveedor.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Common import path table">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante de entrada canónica de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Traductor de configuración, mensajes de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de runtime durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importar, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes multicuenta | Ayudantes de lista/configuración/compuerta de acciones de cuentas |
  | `plugin-sdk/account-id` | Ayudantes de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas y respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Ayudantes acotados de cuentas | Ayudantes de lista de cuentas/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta, escritura y entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y ayudantes de acceso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo primitivas compartidas de esquemas de configuración de canal y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usa `plugin-sdk/bundled-channel-config-schema` para plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comando, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobres entrantes | Ayudantes compartidos de ruta y constructor de sobres |
  | `plugin-sdk/channel-inbound` | Ayudantes de recepción entrante | Creación de contexto, formato, raíces, ejecutores, despacho de respuestas preparadas y predicados de despacho |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para análisis de destinos | Usa `plugin-sdk/channel-targets` para ayudantes genéricos de análisis de destinos, `plugin-sdk/channel-route` para comparación de rutas, y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del Plugin para resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Ayudantes del ciclo de vida de mensajes salientes | Adaptadores de mensajes, recibos, ayudantes de envío duradero, ayudantes de vista previa/transmisión en vivo, opciones de respuesta, ayudantes de ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de cargas útiles de medios | Constructor de cargas útiles de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes amplios de runtime | Ayudantes de runtime/registro/respaldo/instalación de plugins |
  | `plugin-sdk/runtime-env` | Ayudantes acotados de entorno de runtime | Ayudantes de registrador/entorno de runtime, tiempo de espera, reintento y retroceso |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de runtime de Plugin | Ayudantes de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de canalización de hooks | Ayudantes compartidos de canalización de Webhook/hooks internos |
  | `plugin-sdk/lazy-runtime` | Ayudantes de runtime diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de proceso | Ayudantes compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Ayudantes de runtime de CLI | Formato de comandos, esperas, ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway, ayudante de inicio listo para bucle de eventos, resolución de host LAN anunciado y ayudantes de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Capa obsoleta de compatibilidad de configuración | Prefiere `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram estables con respaldo cuando la superficie del contrato de Telegram incluido no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de mensajes de aprobación | Carga útil de aprobación de ejecución/Plugin, ayudantes de capacidad/perfil de aprobación, ayudantes nativos de enrutamiento/runtime de aprobación y formato de rutas de visualización estructurada de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobación | Resolución de aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobación | Ayudantes nativos de perfil/filtro de aprobación de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobación | Ayudante compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptador de aprobación | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de manejador de aprobación | Ayudantes más amplios de runtime del manejador de aprobación; prefiere las superficies más acotadas de adaptador/Gateway cuando basten |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destino de aprobación | Ayudantes nativos de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobación | Ayudantes de cargas útiles de respuesta de aprobación de ejecución/Plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de runtime de canal | Ayudantes genéricos de registro/obtención/observación de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, compuerta de DM, archivos/rutas acotados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de políticas SSRF | Ayudantes de lista de permitidos de hosts y políticas de red privada |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de runtime SSRF | Despachador fijado, fetch protegido, ayudantes de políticas SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Ayudantes de activación, evento y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de deduplicación | Cachés de deduplicación en memoria y respaldadas por persistencia |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros de rutas de archivos/medios locales |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de preparación de transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Ayudantes de política de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de compuerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch/proxy envueltos | `resolveFetch`, ayudantes de proxy, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y asignación de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ayudantes de compuerta de comandos y superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes de registro de comandos, incluido formato de menú de argumentos dinámicos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Ayudantes de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes Webhook | Utilidades de destinos Webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección del cuerpo de Webhook | Ayudantes de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes acotados de despacho de respuestas | Finalización, despacho de proveedor y ayudantes de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuestas | `createChannelHistoryWindow`; exportaciones obsoletas de compatibilidad de ayudantes de mapa como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuesta | Ayudantes de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones | Ayudantes de ruta de almacén y fecha de actualización |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado en tiempo de ejecución, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de destino | Helpers compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URL de cadena desde entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos con límite de tiempo | Ejecutor de comandos con límite de tiempo con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extrae cargas útiles normalizadas desde objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas de descarga temporales |
  | `plugin-sdk/logging-core` | Helpers de registro | Helpers de registrador de subsistema y censura |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de proveedor en tiempo de ejecución | Helpers de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API de proveedor | Helpers de incorporación/escritura de perfil de claves de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedor | Selección de proveedor configurado o automático y combinación de configuración sin procesar de proveedor |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedor | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelo/repetición de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, helpers de endpoints de proveedor y helpers de normalización de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedor | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedor | Helpers genéricos de capacidades HTTP/endpoint de proveedor, incluidos helpers de formulario multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de proveedor | Helpers de registro/caché de proveedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de búsqueda web de proveedor | Helpers estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de búsqueda web de proveedor | Helpers estrechos de contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Helpers de búsqueda web de proveedor | Helpers de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza + diagnósticos de esquemas de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedor |
  | `plugin-sdk/provider-stream` | Helpers de contenedor de streams de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de contenedor de stream y helpers compartidos de contenedor de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de proveedor | Helpers nativos de transporte de proveedor, como fetch protegido, extracción de texto de resultados de herramienta, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de carga útil de medios |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación de medios | Helpers compartidos de conmutación por error, selección de candidatos y mensajería de modelo faltante para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedor de comprensión de medios y exportaciones de helpers de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia obsoleta de compatibilidad de texto | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedor de voz y helpers de directivas, registro y validación orientados a proveedores, además del constructor TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedor, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedor, helpers de registro/resolución, helpers de sesión puente, colas compartidas de respuesta oral de agente, control de voz de ejecución activa, salud de transcripción/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consulta forzada, seguimiento de contexto de turno, seguimiento de actividad de salida y helpers de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Helpers de generación de imágenes | Tipos de proveedor de generación de imágenes y helpers de recursos de imagen/URL de datos, además del constructor de proveedor de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de referencia de modelo |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de referencia de modelo |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción de carga útil de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas estrechas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de allowlist | Helpers de edición/lectura de configuración de allowlist |
  | `plugin-sdk/group-access` | Helpers de acceso de grupo | Helpers compartidos de decisión de acceso de grupo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helpers de protección de mensajes directos | Helpers estrechos de política de protección previa a criptografía |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensión | Primitivas de helpers de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destinos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad con Zod | Importa `zod` desde `zod` directamente |
  | `plugin-sdk/memory-core` | Helpers incluidos de memory-core | Superficie de helpers de gestor de memoria/configuración/archivo/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memoria | Helpers ligeros de registro de proveedores de embeddings de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos de lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria | Helpers de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Helpers de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Helpers de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/tiempo de ejecución del host de memoria | Helpers de archivo/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del tiempo de ejecución central del host de memoria | Alias neutral respecto al proveedor para helpers del tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para helpers del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivo/tiempo de ejecución de memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gestionado | Helpers compartidos de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado del host de memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel de compatibilidad obsoleto local del repositorio; usa subrutas de prueba locales enfocadas del repositorio, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabla es el subconjunto común de migración, no toda la superficie del SDK. El
inventario de puntos de entrada del compilador está en `scripts/lib/plugin-sdk-entrypoints.json`;
las exportaciones de paquetes se generan a partir del subconjunto público.

Las costuras auxiliares reservadas para plugins incluidos se retiraron del mapa
de exportación del SDK público, salvo las fachadas de compatibilidad documentadas
explícitamente, como el shim obsoleto `plugin-sdk/discord`, conservado para plugins
externos que aún importan directamente el paquete publicado `@openclaw/discord`.
Los auxiliares específicos del propietario viven dentro del paquete del plugin
propietario; el comportamiento compartido del host pasa por contratos genéricos
del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
`plugin-sdk/plugin-config-runtime`.

Usa la importación más estrecha que coincida con la tarea. Si no encuentras una
exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta a los
mantenedores qué contrato genérico debería poseerla.

## Desaprobaciones activas

Desaprobaciones más estrechas en el SDK de plugins, el contrato de proveedor, la
superficie de runtime y el manifiesto. Cada una todavía funciona hoy, pero se
eliminará en una futura versión mayor. Cada entrada asigna la API antigua a su
reemplazo canónico.

<AccordionGroup>
  <Accordion title="constructores de ayuda command-auth -> command-status">
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

  <Accordion title="auxiliares de control de menciones -> resolveInboundMentionDecision">
    **Antiguo**: `resolveMentionGating(params)` y
    `resolveMentionGatingWithBypass(params)` desde
    `openclaw/plugin-sdk/channel-inbound` u
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`: un objeto de
    decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El propio modelo de evento `app_mention` de Slack
    no usa este auxiliar.

  </Accordion>

  <Accordion title="shim de runtime de canal y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para
    plugins de canal antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Los auxiliares `channelActions*` en `openclaw/plugin-sdk/channel-actions`
    están desaprobados junto con las exportaciones de canal "actions" sin procesar.
    Expón capacidades mediante la superficie semántica `presentation` en su lugar:
    los plugins de canal declaran qué renderizan (tarjetas, botones, selectores)
    en vez de qué nombres de acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Antiguo**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el plugin proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="sobres de canal en texto plano -> BodyForAgent">
    **Antiguo**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el
    campo `channelEnvelope` en los objetos de mensaje entrante) para construir un
    sobre de prompt plano de texto a partir de mensajes entrantes de canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (hilo, tema,
    responder a, reacciones) como campos tipados en lugar de concatenarlos en una
    cadena de prompt. El auxiliar `formatAgentEnvelope(...)` sigue siendo
    compatible para sobres sintetizados orientados al asistente, pero los sobres
    entrantes de texto plano están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin de
    canal personalizado que posprocesara el texto del sobre antiguo.

  </Accordion>

  <Accordion title="hook deactivate -> gateway_stop">
    **Antiguo**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. Mismo contrato de limpieza de
    apagado; solo cambia el nombre del hook.

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
    que se elimine después del 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning -> vinculación de hilos del núcleo">
    **Antiguo**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: deja que el núcleo prepare vinculaciones de subagentes
    `thread: true` mediante el adaptador de vinculación de sesiones de canal.
    Usa `api.on("subagent_spawned", handler)` solo para observación posterior al
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
    superficies de compatibilidad obsoletas mientras migran los plugins externos;
    se eliminarán después del 2026-08-30.

  </Accordion>

  <Accordion title="tipos de descubrimiento de proveedores -> tipos de catálogo de proveedores">
    Cuatro alias de tipos de descubrimiento ahora son wrappers ligeros sobre los
    tipos de la era del catálogo:

    | Alias antiguo             | Tipo nuevo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además de la bolsa estática heredada `ProviderCapabilities`: los plugins de
    proveedor deberían usar hooks de proveedor explícitos como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn` en lugar de un objeto estático.

  </Accordion>

  <Accordion title="hooks de política de razonamiento -> resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y una lista
    ordenada de niveles. OpenClaw rebaja automáticamente valores almacenados
    obsoletos por rango de perfil.

    El contexto incluye `provider`, `modelId`, `reasoning` fusionado opcional y
    hechos `compat` de modelo fusionados opcionales. Los plugins de proveedor
    pueden usar esos hechos de catálogo para exponer un perfil específico del
    modelo solo cuando el contrato de solicitud configurado lo admite.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante la ventana de desaprobación, pero no se componen con el resultado del
    perfil.

  </Accordion>

  <Accordion title="proveedores de autenticación externos -> contracts.externalAuthProviders">
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

  <Accordion title="búsqueda de variables de entorno de proveedor -> setup.providers[].envVars">
    Campo de manifiesto **antiguo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: replica la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` dentro del manifiesto. Esto consolida los
    metadatos de entorno de configuración/estado en un solo lugar y evita iniciar
    el runtime del plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que se cierre la ventana de desaprobación.

  </Accordion>

  <Accordion title="registro de plugin de memoria -> registerMemoryCapability">
    **Antiguo**: tres llamadas separadas: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismas ranuras, una sola llamada de registro. Los auxiliares aditivos de
    prompt y corpus (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) no se ven afectados.

  </Accordion>

  <Accordion title="API de proveedor de embeddings de memoria">
    **Antiguo**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico de proveedor de embeddings se puede reutilizar fuera de
    la memoria y es la ruta compatible para proveedores nuevos. La API de registro
    específica de memoria permanece conectada como compatibilidad obsoleta
    mientras migran los proveedores existentes. La inspección de plugins informa
    el uso no incluido como deuda de compatibilidad.

  </Accordion>

  <Accordion title="tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipos heredados siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está desaprobado a favor de
    `getSessionMessages`. Misma firma; el método antiguo delega en el nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de flujo de
    tareas en vivo.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el runtime de mutación de
    TaskFlow gestionado para plugins que crean, actualizan, cancelan o ejecutan
    tareas hijas desde un flujo. Usa `runtime.tasks.flows` cuando el plugin solo
    necesita lecturas basadas en DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Eliminado después del 2026-07-26.

  </Accordion>

  <Accordion title="fábricas de extensiones integradas -> middleware de resultados de herramientas del agente">
    Cubierto en [Cómo migrar](#how-to-migrate) arriba. Incluido aquí para mayor
    completitud: la ruta `api.registerEmbeddedExtensionFactory(...)`, eliminada
    y exclusiva del ejecutor integrado, se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de
    runtimes en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType -> OpenClawConfig">
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
Las obsolescencias a nivel de extensión (dentro de los plugins de canal/proveedor incluidos en
`extensions/`) se rastrean dentro de sus propios barriles `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si consumes directamente el barril local de un plugin incluido, lee los
comentarios de obsolescencia en ese barril antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk del navegador comparte un
controlador de sesión Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador posee el sobre de eventos Talk común, el estado del turno activo, el estado
de captura, el estado de audio de salida, el historial de eventos reciente y el rechazo
de turnos obsoletos. Los plugins de proveedor poseen las sesiones en tiempo real específicas
del proveedor; los plugins de superficie poseen las particularidades de captura,
reproducción, telefonía y reuniones.

Todas las superficies incluidas se ejecutan sobre el controlador compartido: retransmisión
del navegador, traspaso de sala administrada, tiempo real de llamada de voz, STT en streaming
de llamada de voz, tiempo real de Google Meet y pulsar para hablar nativo. Gateway anuncia un
canal de eventos Talk en vivo en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)` salvo que
implemente un adaptador de bajo nivel o un fixture de prueba. Usa el controlador compartido para que
los eventos con alcance de turno no puedan emitirse sin un id de turno, las llamadas
`turnEnd` / `turnCancel` obsoletas no puedan limpiar un turno activo más nuevo, y los eventos
de ciclo de vida de audio de salida se mantengan coherentes entre telefonía, reuniones,
retransmisión del navegador, traspaso de sala administrada y clientes Talk nativos.

La forma de la API pública:

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
porque el navegador posee la negociación del proveedor y el transporte de medios, mientras que el
Gateway posee las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común administrada por Gateway para tiempo real con gateway-relay, transcripción con
gateway-relay y sesiones STT/TTS nativas de sala administrada.

Las configuraciones heredadas que colocan selectores de tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; el Talk en tiempo de ejecución
no reinterpreta la configuración de proveedor de voz/TTS como configuración de proveedor en tiempo real.

Las combinaciones admitidas de `talk.session.create` son intencionalmente reducidas:

| Modo            | Transporte      | Cerebro         | Propietario        | Notas                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio de proveedor full-duplex puenteado a través del Gateway; las llamadas a herramientas se enrutan por la herramienta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los llamadores envían audio de entrada y reciben eventos de transcripción.                   |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de estilo pulsar para hablar y walkie-talkie donde el cliente posee la captura/reproducción y el Gateway posee el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala solo para administradores para superficies propias de confianza que ejecutan directamente acciones de herramientas del Gateway. |

Mapa de métodos para lectores que migran desde las familias anteriores `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` (todas eliminadas):

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

El vocabulario de control unificado también es deliberadamente limitado:

| Método                          | Se aplica a                                             | Contrato                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión de proveedor propiedad de la misma conexión Gateway.                                                                               |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                         |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de la validación de turno obsoleto.                                                                                                                     |
| `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                 | Cancela el trabajo activo de captura/proveedor/agente/TTS para un turno.                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                              |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a herramienta de proveedor emitida por la retransmisión; pasa `options.willContinue` para salida provisional u `options.suppressResponse` para satisfacer la llamada sin otra respuesta del asistente. |
| `talk.session.steer`            | sesiones Talk respaldadas por agente                    | Envía control hablado `status`, `steer`, `cancel` o `followup` a la ejecución incrustada activa resuelta desde la sesión Talk.                                                           |
| `talk.session.close`            | todas las sesiones unificadas                           | Detiene sesiones de retransmisión o revoca el estado de sala administrada, y luego olvida el id de sesión unificada.                                                                     |

No introduzcas casos especiales de proveedor o plataforma en core para que esto funcione.
Core posee la semántica de sesiones Talk. Los plugins de proveedor poseen la configuración de sesiones
de proveedor. Voice-call y Google Meet poseen adaptadores de telefonía/reuniones. El navegador y las
apps nativas poseen la UX de captura/reproducción del dispositivo.

## Calendario de eliminación

| Cuándo                                      | Qué ocurre                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas emiten advertencias en tiempo de ejecución.                                                                  |
| **Fecha `removeAfter` de cada registro compat** | Esa superficie específica es elegible para eliminación; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace fallar CI una vez pasada la fecha. |
| **Próxima versión principal**               | Cualquier superficie que aún no haya migrado se elimina; los plugins que todavía las usen fallarán.                                    |

Todos los plugins core ya han migrado. Los plugins externos deben migrar
antes de la próxima versión principal. Ejecuta `pnpm plugins:boundary-report` para ver qué
registros compat vencen antes para las superficies que usa tu plugin.

## Suprimir temporalmente las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Internals de Plugin](/es/plugins/architecture) - análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
