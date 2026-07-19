---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste `api.registerEmbeddedExtensionFactory` antes de OpenClaw 2026.4.25
    - Está actualizando un plugin a la arquitectura moderna de plugins
    - Mantiene un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de plugins
x-i18n:
    generated_at: "2026-07-19T02:06:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50cd42eb7512d223d7693a9dbc99db27392bf2797e409d096bbcf11c59c1fd2b
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw reemplazó una amplia capa de compatibilidad con versiones anteriores por una arquitectura moderna de plugins
construida a partir de importaciones pequeñas y específicas. Si el plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Anteriormente, dos superficies de importación completamente abiertas permitían que los plugins accedieran a casi cualquier elemento desde un
único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - reexportaba decenas de utilidades para mantener
  en funcionamiento los plugins antiguos basados en hooks mientras se creaba la nueva arquitectura.
- **`openclaw/plugin-sdk/infra-runtime`** - un amplio barrel que combinaba eventos del
  sistema, estado de Heartbeat, colas de entrega, utilidades de obtención/proxy, utilidades de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un amplio barrel de configuración que aún
  incluía utilidades obsoletas de carga/escritura directa durante el periodo de migración.
- **`openclaw/extension-api`** - un puente que proporcionaba a los plugins acceso directo a
  utilidades del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook eliminado, exclusivo del ejecutor
  integrado, que observaba eventos de este, como `tool_result`. En su lugar, se debe usar middleware
  de resultados de herramientas del agente (consulte [Migrar las extensiones de resultados de herramientas
  integradas a middleware](#how-to-migrate)).

Estas superficies están **obsoletas**: todavía funcionan, pero los plugins nuevos no deben
usarlas y los plugins existentes deben migrar antes de que la próxima versión principal
las elimine. `registerEmbeddedExtensionFactory` ya se ha eliminado;
los registros heredados ya no se cargan.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando esto ocurra.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios de contrato incompatibles pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y un periodo de obsolescencia. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los hooks y el comportamiento de
registro en tiempo de ejecución.

### Motivos

- **Inicio lento** - importar una utilidad cargaba decenas de módulos no relacionados.
- **Dependencias circulares** - las reexportaciones amplias facilitaban la
  creación de ciclos de importación.
- **Superficie de API poco clara** - no había forma de distinguir las exportaciones estables de las internas.

Ahora, cada `openclaw/plugin-sdk/<subpath>` es un módulo pequeño y autónomo con
un contrato documentado.

También se han eliminado las interfaces auxiliares heredadas de proveedores para los canales incluidos:
los accesos directos a utilidades específicas de canales eran elementos privados de conveniencia del monorepo, no
contratos estables de plugins. En su lugar, se deben usar subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, las utilidades propiedad del proveedor deben mantenerse en los propios
`api.ts` o `runtime-api.ts` de ese plugin:

- Anthropic mantiene las utilidades de transmisión específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las utilidades del modelo predeterminado y los constructores de proveedores
  en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedores y las utilidades de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad de plugins externos sigue este orden:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su reemplazo.
4. Cubrir ambas rutas en las pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar únicamente después del periodo de migración anunciado, normalmente en una versión
   principal.

Si todavía se acepta un campo del manifiesto, debe seguir usándose hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo documentado;
los plugins existentes no deben dejar de funcionar durante versiones menores ordinarias.

Audite la cola de migración actual con `pnpm plugins:boundary-report`:

| Indicador                                               | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar de todos los detalles.                            |
| `--json`                                                | Informe legible por máquina.                                                   |
| `--owner <id>`                                          | Filtra por un plugin o propietario de compatibilidad.                          |
| `--fail-on-cross-owner`                                 | Sale con un código distinto de cero ante importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Sale con un código distinto de cero cuando ha pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Sale con un código distinto de cero ante adaptadores reservados del SDK sin usar. |

`pnpm plugins:boundary-report:ci` se ejecuta con los tres indicadores de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una imprecisa «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, cuenta
las referencias locales de código/documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK del host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por el propietario; las exportaciones reservadas sin usar deben eliminarse del
SDK público.

## Cómo migrar

<Steps>
  <Step title="Migrar las utilidades de carga/escritura de configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Se debe preferir la configuración ya
    proporcionada a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas
    de agente de larga duración deben leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de escribir una configuración siga viendo la configuración actualizada.

    Las escrituras de configuración se realizan mediante la utilidad transaccional con una política explícita
    posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio requiera
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    únicamente cuando el llamador sea responsable del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de mutación incluyen un resumen tipado `followUp` para
    pruebas y registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` se mantienen como utilidades de compatibilidad
    obsoletas para plugins externos y emiten una advertencia una sola vez con el código de compatibilidad
    `runtime-config-load-write`. Los plugins incluidos y el código de tiempo de ejecución
    del repositorio están protegidos por `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso de plugins en producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea de tiempo de ejecución de la solicitud, las utilidades de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su límite y los módulos de tiempo de ejecución de larga duración
    no permiten ninguna llamada ambiental a `loadConfig()`.

    El código de plugins nuevo debe evitar el amplio barrel `openclaw/plugin-sdk/config-runtime`.
    Use la subruta específica para cada tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada, búsqueda de configuración de entrada del plugin y combinación de configuraciones | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Utilidades del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Utilidades de tiempo de ejecución de políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entrada de secretos | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante un escáner contra el barrel
    amplio para que las importaciones y los simulacros permanezcan limitados al comportamiento que necesitan. El
    barrel sigue existiendo para la compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar las extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben reemplazar los controladores de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)`, exclusivos del ejecutor integrado, por
    middleware independiente del entorno de ejecución:

    ```typescript
    // Herramientas de tiempo de ejecución de OpenClaw y herramientas dinámicas de tiempo de ejecución de Codex (el resultado puede
    // transformarse). Los resultados de herramientas nativas de Codex también se retransmiten para su observación,
    // pero su salida transformada nunca llega al modelo: el contrato del hook
    // PostToolUse de Codex no puede reemplazar una respuesta de herramienta nativa.
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Actualice al mismo tiempo el manifiesto del plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando esté explícitamente
    habilitado y todos los entornos de ejecución de destino estén declarados en
    `contracts.agentToolResultMiddleware`. Se rechazan los registros de middleware
    instalado no declarado.

  </Step>

  <Step title="Migrar los controladores nativos de aprobación a datos de capacidades">
    Los plugins de canales compatibles con aprobaciones exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto
    de tiempo de ejecución:

    - Reemplace `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Traslade la autenticación/entrega específica de aprobaciones fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canales; traslade los campos de entrega/nativos/renderización a
      `approvalCapability`.
    - `plugin.auth` se mantiene únicamente para los flujos de inicio/cierre de sesión del canal; el núcleo ya no
      lee allí los hooks de autenticación de aprobación.
    - Registre los objetos de tiempo de ejecución propiedad del canal (clientes, tokens, aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíe avisos de redireccionamiento propiedad del plugin desde controladores de aprobación nativos;
      el núcleo es responsable de los avisos de enrutamiento a otro destino a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporcione una
      superficie `createPluginRuntime().channel` real; se rechazan los stubs
      parciales.

    Consulte [Plugins de canales](/es/plugins/sdk-channel-plugins) para conocer la disposición actual
    de las capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento alternativo de los wrappers de Windows">
    Si el plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan de forma cerrada, a menos que se pase explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establezca esto únicamente para llamadores de compatibilidad de confianza que acepten
      // deliberadamente la alternativa mediada por el shell.
      allowShellFallback: true,
    });
    ```

    Si el llamador no depende deliberadamente de la alternativa del shell, no establezca
    `allowShellFallback` y gestione en su lugar el error generado.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie anterior corresponde a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad con versiones anteriores)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para los ayudantes del lado del host, utilice el entorno de ejecución del plugin
    inyectado en lugar de importarlos directamente:

    ```typescript
    // Antes (puente obsoleto de extension-api)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (entorno de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros ayudantes de puentes heredados:

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

  <Step title="Reemplazar las importaciones amplias de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la superficie específica que
    realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Ayudantes de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Ayudantes de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y con respaldo persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Ayudantes seguros para rutas de archivos locales y medios | `openclaw/plugin-sdk/file-access-runtime` |
    | Obtención compatible con el despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Ayudantes de obtención mediante proxy y con protección | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Ayudantes de comandos y carga útil de respuesta de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Ayudantes de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Ayudantes de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Conversión numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante análisis contra `infra-runtime`,
    por lo que el código del repositorio no puede volver al módulo de exportación amplio.

  </Step>

  <Step title="Migrar los ayudantes de rutas de canales">
    El código nuevo de rutas de canales utiliza `openclaw/plugin-sdk/channel-route`. Los nombres
    antiguos de claves de ruta permanecen como alias de compatibilidad:

    | Ayudante antiguo | Ayudante moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Los ayudantes modernos de rutas normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en las aprobaciones nativas, la supresión de respuestas,
    la deduplicación de entradas, la entrega de cron y el enrutamiento de sesiones.

    No añada nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    `resolveChannelRouteTargetWithParser(...)` desde
    `plugin-sdk/channel-route`; están obsoletos y se mantienen únicamente para plugins
    antiguos. Los plugins de canal nuevos deben utilizar
    `messaging.targetResolver.resolveTarget(...)` para normalizar el identificador de destino
    y como alternativa cuando no se encuentre en el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesite determinar de forma anticipada el tipo de par,
    y `messaging.resolveOutboundSessionRoute(...)` para la identidad de
    sesiones e hilos nativa del proveedor.

  </Step>

  <Step title="Compilar y probar">
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
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de plugins | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones/constructores de entradas de canales | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada para un único proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entradas de canales | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Traductor de configuración, solicitudes de listas de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de ejecución durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importación, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usar `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes para varias cuentas | Ayudantes de lista de cuentas, configuración y control de acciones |
  | `plugin-sdk/account-id` | Ayudantes de identificadores de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de identificadores de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas y respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Ayudantes específicos de cuentas | Ayudantes de listas de cuentas y acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de vinculación de mensajes directos | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Integración del prefijo de respuesta, la escritura y la entrega desde el origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y ayudantes de acceso a mensajes directos | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo las primitivas compartidas de esquemas de configuración de canales y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usar `plugin-sdk/bundled-channel-config-schema` para los plugins incluidos que reciben mantenimiento |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados y conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupos/mensajes directos | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Ayudantes de envoltorios entrantes | Ayudantes compartidos para crear rutas y envoltorios |
  | `plugin-sdk/channel-inbound` | Ayudantes de recepción entrante | Creación de contexto, formato, raíces, ejecutores, envío de respuestas preparadas y predicados de envío |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para el análisis de destinos | Usar `plugin-sdk/channel-targets` para ayudantes genéricos de análisis de destinos, `plugin-sdk/channel-route` para comparar rutas y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del plugin para resolver destinos específicos del proveedor |
  | `plugin-sdk/outbound-media` | Ayudantes de contenido multimedia saliente | Carga compartida de contenido multimedia saliente |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Ayudantes del ciclo de vida de mensajes salientes | Adaptadores de mensajes, confirmaciones de recepción, ayudantes de envío duradero, ayudantes de vista previa en directo/transmisión, opciones de respuesta, ayudantes del ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes del ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de cargas útiles multimedia | Constructor de cargas útiles multimedia del agente para disposiciones de campos heredadas |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas de ejecución de canales |
  | `plugin-sdk/channel-send-result` | Tipos de resultados de envío | Tipos de resultados de respuestas |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes generales de ejecución | Ayudantes de ejecución, registro, copias de seguridad e instalación de plugins |
  | `plugin-sdk/runtime-env` | Ayudantes específicos del entorno de ejecución | Ayudantes de registro/entorno de ejecución, tiempo de espera, reintentos y espera incremental |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de ejecución de plugins | Ayudantes de comandos, enlaces, HTTP e interacción de plugins |
  | `plugin-sdk/hook-runtime` | Ayudantes de la pipeline de enlaces | Ayudantes compartidos de la pipeline de Webhooks/enlaces internos |
  | `plugin-sdk/lazy-runtime` | Ayudantes de ejecución diferida | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Ayudantes de ejecución de la CLI | Formato de comandos, esperas y ayudantes de versiones |
  | `plugin-sdk/gateway-runtime` | Ayudantes del Gateway | Cliente del Gateway, ayudante de inicio con el bucle de eventos listo, resolución del host LAN anunciado y ayudantes de parches de estado de canales |
  | `plugin-sdk/config-runtime` | Capa obsoleta de compatibilidad de configuración | Se prefieren `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram con respaldo estable cuando la superficie de contrato incluida de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de solicitudes de aprobación | Carga útil de aprobación de ejecución/plugins, ayudantes de capacidades/perfiles de aprobación, ayudantes nativos de enrutamiento/ejecución de aprobaciones y formato estructurado de rutas para mostrar aprobaciones |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobaciones | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes del cliente de aprobaciones | Ayudantes nativos de perfiles/filtros de aprobación de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobaciones | Adaptadores nativos de capacidad/entrega de aprobaciones |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes del Gateway de aprobaciones | Resolutor compartido del Gateway de aprobaciones |
  | `plugin-sdk/approval-reference-runtime` | Referencias de transporte de aprobaciones | Ayudante determinista de localizadores duraderos para devoluciones de llamada limitadas por el transporte |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptadores de aprobación | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canales críticos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de controladores de aprobación | Ayudantes más generales para la ejecución de controladores de aprobación; se prefieren las interfaces más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destinos de aprobación | Ayudantes nativos de vinculación de destinos/cuentas de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuestas de aprobación | Ayudantes de cargas útiles de respuesta para aprobaciones de ejecución/plugins |
  | `plugin-sdk/channel-runtime-context` | Ayudantes del contexto de ejecución de canales | Ayudantes genéricos para registrar, obtener y observar el contexto de ejecución de canales |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, control de mensajes directos, archivos/rutas limitados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de políticas SSRF | Ayudantes de listas de hosts permitidos y políticas de redes privadas |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de ejecución SSRF | Despachador fijado, solicitudes protegidas y ayudantes de políticas SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent` (incluida la sustitución por clave), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Ayudantes de activación, eventos y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de la cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canales | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de desduplicación | Cachés de desduplicación en memoria y con respaldo persistente |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros para rutas de archivos locales y contenido multimedia |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de disponibilidad del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Ayudantes de políticas de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Ayudantes de cachés acotadas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de control de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafos de errores, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Ayudantes de solicitudes encapsuladas/proxies | `resolveFetch`, ayudantes de proxies, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintentos | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y asignación de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ayudantes de control y superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes del registro de comandos, incluido el formato dinámico del menú de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entradas de secretos | Ayudantes de entradas de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes de Webhooks | Utilidades de destinos de Webhooks |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección del cuerpo de Webhooks | Ayudantes de lectura/límites del cuerpo de solicitudes |
  | `plugin-sdk/reply-runtime` | Ejecución compartida de respuestas | Envío entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de envío de respuestas | Ayudantes de finalización, envío del proveedor y etiquetas de conversaciones |
  | `plugin-sdk/reply-history` | Ayudantes del historial de respuestas | `createChannelHistoryWindow`; exportaciones de compatibilidad obsoletas de ayudantes de mapas, como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuestas | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuestas | Ayudantes de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes del almacén de sesiones | Ayudantes de filas de sesiones con ámbito, ayudantes de rutas del almacén y lecturas de fechas de actualización |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/claves de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canales | Constructores de resúmenes de estado de canales/cuentas, valores predeterminados del estado de ejecución, ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes del resolutor de destinos | Ayudantes compartidos del resolutor de destinos |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slugs/cadenas |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitudes | Extraen URL de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Ayudantes de comandos cronometrados | Ejecutor de comandos cronometrados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de cargas útiles de herramientas | Extrae cargas útiles normalizadas de objetos de resultados de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envíos de herramientas | Extrae campos canónicos de destinos de envío de los argumentos de herramientas |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas de descargas temporales |
  | `plugin-sdk/logging-core` | Ayudantes de registro | Ayudantes de registro de subsistemas y ocultación de datos |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes del modo de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuestas de mensajes | Tipos de cargas útiles de respuestas |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados para configurar proveedores locales/alojados por el usuario | Ayudantes de detección/configuración de proveedores alojados por el usuario |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos para configurar proveedores alojados por el usuario compatibles con OpenAI | Los mismos ayudantes de detección/configuración de proveedores alojados por el usuario |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de ejecución de proveedores | Ayudantes de resolución de claves de API durante la ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de claves de API de proveedores | Ayudantes de incorporación mediante claves de API y escritura de perfiles |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultados de autenticación de proveedores | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedores | Selección de proveedores configurados o automáticos y combinación de la configuración sin procesar de proveedores |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedores | Ayudantes de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelos/reproducción de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedores y ayudantes de normalización de identificadores de modelos |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogos de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidades HTTP/endpoints de proveedores, incluidos ayudantes de formularios multiparte para la transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de obtención web de proveedores | Ayudantes de registro/caché de proveedores de obtención web |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de búsqueda web de proveedores | Ayudantes específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan integración de habilitación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contratos de búsqueda web de proveedores | Ayudantes específicos de contratos de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y establecedores/obtenedores de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de búsqueda web de proveedores | Ayudantes de registro/caché/entorno de ejecución de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza de esquemas y diagnósticos de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de flujos de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos y ayudantes compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativo de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes multimedia compartidos | Ayudantes de obtención/transformación/almacenamiento multimedia, sondeo de dimensiones de vídeo mediante ffprobe y constructores de cargas útiles multimedia |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación multimedia | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelo ausente para la generación de imágenes/vídeo/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión multimedia | Tipos de proveedores de comprensión multimedia y exportaciones de ayudantes de imagen/audio orientados a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia obsoleta de compatibilidad de texto | Use `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudantes de fragmentación de texto saliente y de intervalos que conservan los desplazamientos |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedores de voz, ayudantes de directivas, registro y validación orientados a proveedores, y constructor de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas y normalización |
  | `plugin-sdk/speech-settings` | Configuración de voz | Primitivas ligeras de resolución y normalización de la configuración de TTS sin registros de proveedores ni entorno de ejecución de síntesis |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedores, ayudantes de registro y ayudante compartido de sesiones WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedores, ayudantes de registro/resolución, ayudantes de sesiones puente, infraestructura de sesiones independiente del transporte, controles de energía de audio/inicio del habla, colas compartidas de respuesta hablada del agente, control por voz de ejecuciones activas, estado de transcripciones/eventos, supresión de eco, correspondencia de preguntas de consulta, coordinación de consultas forzadas, seguimiento del contexto de turno, seguimiento de la actividad de salida y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedores de generación de imágenes, ayudantes de recursos de imagen/URL de datos y constructor de proveedores de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes y ayudantes de conmutación por error, autenticación y registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedores/solicitudes/resultados de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/video-generation` | Ayudantes de generación de vídeo | Tipos de proveedores/solicitudes/resultados de generación de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de vídeo | Tipos de generación de vídeo, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuestas interactivas | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canales | Primitivas específicas de esquemas de configuración de canales |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canales | Ayudantes de autorización para la escritura de configuración de canales |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canales | Exportaciones del preludio compartido de plugins de canales |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canales | Ayudantes compartidos de instantáneas/resúmenes del estado de canales |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de listas de permitidos | Ayudantes de edición/lectura de la configuración de listas de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso a grupos | Ayudantes compartidos para decisiones de acceso a grupos |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Use `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Ayudantes de protección de mensajes directos | Ayudantes específicos de políticas de protección previas al cifrado |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensiones | Primitivas auxiliares de canales pasivos/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destinos de Webhook | Ayudantes de registro de destinos e instalación de rutas de Webhook |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Use `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Ayudantes compartidos de contenido multimedia web | Ayudantes de carga de contenido multimedia remoto/local |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad con Zod | Importe `zod` directamente desde `zod` |
  | `plugin-sdk/memory-core` | Ayudantes incluidos de memory-core | Superficie de ayudantes del gestor/configuración/archivos/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada del entorno de ejecución del motor de memoria | Fachada del entorno de ejecución de indexación/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de incrustaciones de memoria | Ayudantes ligeros del registro de proveedores de incrustaciones de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de incrustaciones del host de memoria | Contratos de incrustaciones de memoria, acceso al registro, proveedor local y ayudantes genéricos de procesamiento por lotes/remoto; los proveedores remotos concretos residen en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria | Ayudantes multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consultas del host de memoria | Ayudantes de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria | Ayudantes de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Use `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria | Ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Entorno de ejecución de CLI del host de memoria | Ayudantes del entorno de ejecución de CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Entorno de ejecución principal del host de memoria | Ayudantes del entorno de ejecución principal del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/entorno de ejecución del host de memoria | Ayudantes de archivos/entorno de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del entorno de ejecución principal del host de memoria | Alias independiente del proveedor para los ayudantes del entorno de ejecución principal del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias independiente del proveedor para los ayudantes del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivos/entorno de ejecución de memoria | Use `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de Markdown gestionado | Ayudantes compartidos de Markdown gestionado para plugins relacionados con la memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida del entorno de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado del host de memoria | Use `plugin-sdk/memory-core-host-status` |
</Accordion>

  Esta tabla es el subconjunto común de migración, no toda la superficie del SDK. El
  inventario de puntos de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`;
  las exportaciones de paquetes se generan a partir del subconjunto público.

  Las interfaces auxiliares reservadas para plugins incluidos se han retirado del mapa de
  exportaciones del SDK público, excepto las fachadas de compatibilidad documentadas
  explícitamente, como el shim obsoleto `plugin-sdk/discord`, conservado para plugins
  externos que aún importan directamente el paquete publicado
  `@openclaw/discord`. Los auxiliares específicos de cada propietario se encuentran
  dentro del paquete del plugin correspondiente; el comportamiento compartido del host
  se canaliza mediante contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

  Use la importación más específica que corresponda a la tarea. Si no encuentra una
  exportación, consulte el código fuente en `src/plugin-sdk/` o pregunte a los
  responsables qué contrato genérico debe asumirla.

  ## Superficies de compatibilidad eliminadas

  ### Barrel privado de pruebas

  `openclaw/plugin-sdk/testing` era local al repositorio y se excluía de los artefactos
  distribuidos del paquete, por lo que se eliminó antes de su fecha
  `removeAfter` del 2026-07-28. Las pruebas del repositorio usan subrutas
  específicas como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`,
  `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures`.

  ## Elementos obsoletos activos

  Elementos obsoletos más específicos en el SDK de plugins, el contrato del proveedor,
  la superficie de tiempo de ejecución y el manifiesto. Todos siguen funcionando
  actualmente, pero se eliminarán en una versión principal futura. Cada entrada asigna
  la API antigua a su reemplazo canónico.

  <AccordionGroup>
  <Accordion title="Generadores de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas y las mismas
    exportaciones; solo se importan desde la subruta más específica.
    `command-auth` las reexporta como stubs de compatibilidad.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Después
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de control de menciones -> resolveInboundMentionDecision">
    **Anterior**: `resolveMentionGating(params)` y
    `resolveMentionGatingWithBypass(params)` de
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; un objeto de
    decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio
    de Slack no usa este auxiliar.

  </Accordion>

  <Accordion title="Shim del tiempo de ejecución del canal y auxiliares de acciones del canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para plugins
    de canal antiguos. No lo importe en código nuevo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de tiempo de
    ejecución.

    Los auxiliares `channelActions*` de `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones sin procesar de «actions» del canal.
    Exponga las capacidades mediante la superficie semántica
    `presentation`; los plugins de canal declaran qué representan
    (tarjetas, botones, selectores), en lugar de qué nombres de acciones sin
    procesar aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implemente `createTool(...)` directamente en el plugin del
    proveedor. OpenClaw ya no necesita el auxiliar del SDK para registrar el
    contenedor de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal de texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el campo
    `channelEnvelope` de los objetos de mensajes entrantes) para crear un sobre
    plano de indicaciones de texto sin formato a partir de mensajes entrantes
    del canal.

    **Nuevo**: `BodyForAgent` junto con bloques estructurados de contexto
    del usuario. Los plugins de canal adjuntan metadatos de enrutamiento (hilo,
    tema, respuesta y reacciones) como campos tipados, en lugar de concatenarlos
    en una cadena de indicación. El auxiliar `formatAgentEnvelope(...)` sigue siendo
    compatible con sobres sintetizados dirigidos al asistente, pero los sobres
    entrantes de texto sin formato están en proceso de eliminación.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que posprocesara el texto del sobre anterior.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El mismo contrato de
    limpieza durante el apagado; solo cambia el nombre del hook.

    ```typescript
    // Antes
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Después
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` permanece conectado como alias de compatibilidad obsoleto
    hasta su eliminación después del 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)`, que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permita que el núcleo prepare las vinculaciones de subagentes
    `thread: true` mediante el adaptador de vinculación de sesiones del
    canal. Use `api.on("subagent_spawned", handler)` únicamente para la observación posterior al
    inicio.

    ```typescript
    // Antes
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Después
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`, `PluginHookSubagentSpawningResult` y
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecen únicamente como superficies de compatibilidad
    obsoletas mientras migran los plugins externos; se eliminarán después del
    2026-08-30.

  </Accordion>

  <Accordion title="Tipos de detección de proveedores -> tipos de catálogo de proveedores">
    Cuatro alias de tipos de detección son ahora contenedores ligeros de los
    tipos de la era del catálogo:

    | Alias anterior             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además del contenedor estático heredado `ProviderCapabilities`; los plugins de
    proveedores deben usar hooks explícitos del proveedor, como
    `buildReplayPolicy`, `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un
    objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres hooks independientes en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un
    `label` opcional y una lista ordenada de niveles. OpenClaw reduce
    automáticamente los valores almacenados obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, un
    `reasoning` combinado opcional y datos combinados opcionales del
    modelo `compat`. Los plugins de proveedores pueden usar esos datos
    del catálogo para exponer un perfil específico del modelo únicamente cuando
    el contrato de solicitud configurado lo admita.

    Implemente un hook en lugar de tres. Los hooks heredados siguen funcionando
    durante el período de obsolescencia, pero no se combinan con el resultado
    del perfil.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: implementar hooks de autenticación externos sin declarar el
    proveedor en el manifiesto del plugin.

    **Nuevo**: declare `contracts.externalAuthProviders` en el manifiesto del plugin
    **e** implemente `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno del proveedor -> setup.providers[].envVars">
    Campo anterior del manifiesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleje la misma búsqueda de variables de entorno en
    `setup.providers[].envVars` dentro del manifiesto. Esto consolida los metadatos de
    entorno de configuración y estado en un solo lugar y evita iniciar el tiempo
    de ejecución del plugin únicamente para resolver búsquedas de variables de
    entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de
    compatibilidad hasta que finalice el período de obsolescencia.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas independientes: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Las mismas ranuras, una única llamada de registro. Los auxiliares aditivos
    de indicaciones y corpus (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no se ven
    afectados.

  </Accordion>

  <Accordion title="API del proveedor de incrustaciones de memoria">
    **Anterior**: `api.registerMemoryEmbeddingProvider(...)` junto con
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` junto con
    `contracts.embeddingProviders`.

    El contrato genérico del proveedor de incrustaciones puede reutilizarse
    fuera de la memoria y es la vía compatible para los proveedores nuevos. La
    API de registro específica de memoria permanece conectada como compatibilidad
    obsoleta mientras migran los proveedores existentes. La inspección de
    plugins informa del uso no incluido como deuda de compatibilidad.

  </Accordion>

  <Accordion title="Resultados sin procesar de envío del canal -> OutboundDeliveryResult">
    **Anterior**: devolver `{ ok, messageId, error }` mediante
    `ChannelSendRawResult` y normalizarlo con
    `createRawChannelSendResultAdapter(...)`.

    **Nuevo**: devuelva los campos de `OutboundDeliveryResult` y adjunte el canal con
    `createAttachedChannelResultAdapter(...)`. Los envíos fallidos deben generar una excepción en lugar
    de devolver una cadena de error. El tipo de resultado sin procesar seguirá
    disponible hasta la próxima versión principal del SDK de plugins.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagentes renombrados">
    Dos alias de tipos heredados que aún se exportan desde `src/plugins/runtime/types.ts`:

    | Anterior                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de tiempo de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La misma firma; el método anterior delega en el nuevo.

  </Accordion>

  <Accordion title="API eliminadas de archivos de sesión y transcripción">
    La transición a SQLite para sesiones y transcripciones elimina o marca como
    obsoletas las API dirigidas a plugins que exponían almacenes
    `sessions.json` activos, rutas de transcripciones JSONL o listas de
    archivos de sesión. Los plugins de tiempo de ejecución deben usar la
    identidad de sesión y los auxiliares del tiempo de ejecución del SDK, en
    lugar de resolver o modificar archivos activos.

    | Superficie en migración | Reemplazo |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` y mutaciones de sesión a nivel de fila. |
    | `resolveSessionFilePath(...)` obsoleto | Identidad de sesión (`sessionKey`, `sessionId` y auxiliares de destino del tiempo de ejecución del SDK), además de métodos del Gateway que operan en la sesión actual. |
    | `saveSessionStore(...)` eliminado | API del tiempo de ejecución de sesiones propiedad del Gateway; el código del plugin debe solicitar o modificar el estado de sesión mediante auxiliares documentados del tiempo de ejecución o del contexto, en lugar de escribir en el archivo del almacén activo. |
    | `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` eliminados | Identidad de sesión y métodos del Gateway que operan en la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lectores de transcripciones respaldados por identidad que expone el contexto actual del tiempo de ejecución, o métodos de historial y sesión del Gateway cuando el plugin está fuera de la ruta propietaria de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria como `sessionFiles` | Fuentes de transcripción y sesión respaldadas por identidad que proporciona el host; no recorra archivos JSONL activos para sesiones en curso. |
    | Opciones del tiempo de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos `sessionTarget` o de destino del tiempo de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos de transcripción JSONL heredados siguen siendo válidos como artefactos de importación, archivo, exportación y
    soporte. Ya no constituyen el contrato de ejecución de estado estable para
    las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    asistentes obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime` mantiene
    exactamente ese puente hasta 2026-10-12; los plugins nuevos deben usar los reemplazos.
    `resolveStorePath(...)` sigue siendo un asistente compatible del SDK y no forma parte de
    esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de los plugins no incluidos
    cuyos errores de carga o diagnósticos todavía hacen referencia a estas API de archivos eliminadas. El
    barrido de avisos `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o
    una posterior para que los análisis de paquetes externos también señalen los asistentes de sesión
    de almacén completo, los asistentes de rutas de archivos de sesión, los destinos de archivos de
    transcripción heredados y los asistentes de transcripción de bajo nivel antes del lanzamiento.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor de acceso
    activo al flujo de tareas.

    **Nuevo**: `runtime.tasks.managedFlows` mantiene el entorno de ejecución de mutación
    de TaskFlow administrado para los plugins que crean, actualizan, cancelan o ejecutan tareas secundarias desde un
    flujo. Use `runtime.tasks.flows` cuando el plugin solo necesite
    lecturas basadas en DTO.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Después
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Eliminado después de 2026-07-26.

  </Accordion>

  <Accordion title="Fábricas de extensiones integradas -> middleware de resultados de herramientas del agente">
    Se trata en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    mayor exhaustividad: la ruta eliminada exclusiva del ejecutor integrado
    `api.registerEmbeddedExtensionFactory(...)` se sustituye por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de entornos de ejecución
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType` reexportado desde `openclaw/plugin-sdk` es ahora un
    alias de una línea para `OpenClawConfig`. Se prefiere el nombre canónico.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Después
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias en el nivel de extensión (dentro de los plugins de canal/proveedor incluidos en
`extensions/`) se registran en sus propios barrels `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si se consume directamente el barrel local de un plugin incluido, deben leerse los
comentarios sobre obsolescencia de ese barrel antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador comparte un único controlador de
sesiones Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador posee el sobre común de eventos de Talk, el estado del turno activo, el estado de
captura, el estado del audio de salida, el historial reciente de eventos y el rechazo de turnos obsoletos.
Los plugins de proveedores poseen las sesiones en tiempo real específicas de cada proveedor. Los plugins de reuniones en navegador
usan `openclaw/plugin-sdk/meeting-runtime` para los mecanismos de sesión, navegador, audio, host de Node,
consulta al agente y llamada de voz, y luego implementan `MeetingPlatformAdapter`
para las reglas de URL, scripts del DOM, asignación de acciones manuales, subtítulos, creación y
planes de acceso telefónico. Las API REST de las plataformas, OAuth, los artefactos, los selectores y los nombres del protocolo permanecen en
el plugin. Los planes de permisos del navegador reciben la URL de reunión solicitada para que cada
plataforma pueda conceder únicamente sus orígenes compatibles exactos. Los entornos de ejecución de sesión también deben
normalizar el estado operativo en vivo específico de la plataforma tras confirmar la salida del navegador;
los campos históricos de la transcripción pueden permanecer, pero la disponibilidad de subtítulos y audio no debe
seguir activa después de salir.

Todas las superficies incluidas se ejecutan en el controlador compartido: retransmisión del navegador,
traspaso de sala administrada, llamada de voz en tiempo real, STT por streaming de llamadas de voz, Google
Meet en tiempo real y pulsar para hablar nativo. Gateway anuncia un único canal de eventos de Talk
en vivo en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)`, salvo que
implemente un adaptador de bajo nivel o un dispositivo de pruebas. Use el controlador compartido para que
no puedan emitirse eventos limitados al turno sin un id. de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del ciclo de vida
del audio de salida se mantengan uniformes entre telefonía, reuniones, retransmisión del navegador,
traspaso de sala administrada y clientes Talk nativos.

La forma de la API pública:

```typescript
// API de sesión Talk propiedad de Gateway.
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

// API de sesión de proveedor propiedad del cliente.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Las sesiones WebRTC/websocket del proveedor propiedad del navegador usan `talk.client.create`,
porque el navegador posee la negociación con el proveedor y el transporte multimedia, mientras que
Gateway posee las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común administrada por Gateway para tiempo real mediante retransmisión de Gateway, transcripción mediante
retransmisión de Gateway y sesiones STT/TTS nativas de salas administradas.

Las configuraciones heredadas que colocan selectores de tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en tiempo de ejecución
no reinterpreta la configuración del proveedor de voz/TTS como configuración del proveedor en tiempo real.

Las combinaciones compatibles con `talk.session.create` son deliberadamente limitadas:

| Modo            | Transporte       | Cerebro           | Propietario              | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio bidireccional completo del proveedor enlazado mediante Gateway; las llamadas a herramientas se enrutan mediante la herramienta de consulta al agente.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT por streaming; los llamantes envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/del cliente | Salas de estilo pulsar para hablar y walkie-talkie en las que el cliente posee la captura/reproducción y Gateway posee el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/del cliente | Modo de sala exclusivo para administradores destinado a superficies propias de confianza que ejecutan directamente acciones de herramientas de Gateway.                  |

Mapa de métodos para lectores que migren desde las familias anteriores `talk.realtime.*` /
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

El vocabulario unificado de control también es deliberadamente limitado:

| Método                          | Se aplica a                                              | Contrato                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión de Gateway.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario de sala administrada.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar si está obsoleto.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | todas las sesiones propiedad de Gateway                              | Cancela el trabajo activo de captura/proveedor/agente/TTS de un turno.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pase `options.willContinue` para obtener una salida provisional o, cuando sea compatible, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones Talk respaldadas por agentes                              | Envía el control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión Talk.                                                                                                 |
| `talk.session.close`            | todas las sesiones unificadas                                    | Detiene las sesiones de retransmisión o revoca el estado de la sala administrada y, a continuación, olvida el id. de sesión unificado.                                                                                                                                     |

No introduzca casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo es responsable de la semántica de las sesiones de Talk. Los plugins de proveedores son responsables de la configuración de sesiones del proveedor.
Las llamadas de voz y Google Meet son responsables de los adaptadores de telefonía y reuniones. El navegador y las aplicaciones
nativas son responsables de la experiencia de usuario de captura y reproducción del dispositivo.

## Cronograma de eliminación

| Cuándo                                      | Qué sucede                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas con capacidad de advertencia emiten advertencias en tiempo de ejecución; las protecciones del repositorio rechazan las importaciones obsoletas del SDK desde el núcleo y los plugins incluidos. |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica puede eliminarse; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace que la Pipeline de CI falle una vez pasada la fecha.    |
| **Próxima versión principal**               | Se eliminan todas las superficies que aún no se hayan migrado; los plugins que sigan utilizándolas fallarán.                                                          |

Las subrutas públicas del SDK que aparecen a continuación tienen períodos de eliminación o degradación respaldados por el registro.
Actualmente no emiten una advertencia en tiempo de ejecución cuando un plugin externo las importa.
La protección contra usos obsoletos del repositorio se aplica únicamente al nivel
θ1, que no se utiliza en absoluto, y al nivel de compatibilidad anterior; θ2 sigue disponible para los plugins incluidos
durante el período.

Para el período introducido el 2026-07-15, θ1 no tiene consumidores externos ni incluidos
conocidos y se eliminará después del período. θ2 tiene consumidores incluidos, pero no
consumidores externos conocidos; solo se retirará su exportación pública del paquete. Su
módulo seguirá estando disponible para los plugins incluidos como una subruta
privada y exclusivamente local.

| `removeAfter` | Nivel                                  | Subrutas del SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-30`  | Obsolescencias de compatibilidad anteriores | `agent-dir-compat`, `channel-envelope`, `channel-inbound-roots`, `channel-location`, `channel-message-runtime`, `channel-pairing-paths`, `channel-reply-options-runtime`, `config-schema`, `config-types`, `direct-dm`, `direct-dm-access`, `mattermost`, `media-generation-runtime-shared`, `memory-core`, `memory-core-engine-runtime`, `memory-core-host-events`, `memory-core-host-multimodal`, `memory-core-host-query`, `memory-host-files`, `memory-host-status`, `music-generation-core`, `outbound-runtime`, `outbound-send-deps`, `provider-auth-login`, `provider-zai-endpoint`, `reply-dedupe`, `runtime-logger`, `runtime-secret-resolution`, `self-hosted-provider-setup`, `setup-adapter-runtime`, `telegram-command-config`, `webhook-path`, `zalouser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `2026-07-30`  | θ1: totalmente sin usar; eliminar la subruta       | `command-gating`, `lmstudio`, `lmstudio-runtime`, `secret-provider-integration`, `skills-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `2026-07-30`  | θ2: solo incluido; retirar la exportación pública | `access-groups`, `account-resolution-runtime`, `acp-binding-resolve-runtime`, `acp-binding-runtime`, `acp-runtime`, `acp-runtime-backend`, `agent-core`, `agent-harness-exec-review-runtime`, `agent-harness-task-runtime`, `agent-harness-tool-runtime`, `agent-media-payload`, `agent-sessions`, `approval-reaction-runtime`, `approval-reference-runtime`, `async-lock-runtime`, `browser-config`, `bundled-channel-config-schema`, `channel-activity-runtime`, `channel-config-writes`, `channel-mention-gating`, `channel-route`, `channel-secret-tts-runtime`, `channel-targets`, `chat-channel-ids`, `cli-backend`, `cli-runtime`, `codex-mcp-projection`, `command-status-runtime`, `command-surface`, `concurrency-runtime`, `context-visibility-runtime`, `conversation-binding-runtime`, `cron-store-runtime`, `dangerous-name-runtime`, `delivery-queue-runtime`, `direct-dm-guard-policy`, `directory-config-runtime`, `document-extractor`, `embedding-providers`, `exec-approvals-runtime`, `expect-runtime`, `fetch-runtime`, `file-access-runtime`, `file-lock`, `global-singleton`, `group-activation`, `heartbeat-runtime`, `host-runtime`, `html-entity-runtime`, `image-generation`, `image-generation-core`, `image-generation-runtime`, `inline-image-data-url-runtime`, `json-schema-runtime`, `json-unsafe-integers`, `keyed-async-queue`, `llm`, `markdown-table-runtime`, `media-generation-runtime`, `media-understanding`, `memory-core-host-embedding-registry`, `memory-core-host-engine-embeddings`, `memory-core-host-engine-qmd`, `memory-core-host-engine-storage`, `memory-core-host-runtime-cli`, `memory-core-host-runtime-core`, `memory-core-host-runtime-files`, `memory-core-host-secret`, `memory-core-host-status`, `memory-host-core`, `memory-host-events`, `memory-host-markdown`, `memory-host-search`, `message-tool-delivery-hints`, `migration`, `migration-runtime`, `music-generation`, `node-host`, `number-runtime`, `outbound-media`, `pair-loop-guard-runtime`, `plugin-config-runtime`, `plugin-state-runtime`, `poll-runtime`, `process-runtime`, `provider-auth-api-key`, `provider-auth-login-flow-runtime`, `provider-auth-result`, `provider-auth-runtime`, `provider-catalog-live-runtime`, `provider-catalog-shared`, `provider-entry`, `provider-env-vars`, `provider-http`, `provider-model-shared`, `provider-model-types`, `provider-oauth-runtime`, `provider-onboard`, `provider-selection-runtime`, `provider-setup`, `provider-stream`, `provider-stream-family`, `provider-stream-shared`, `provider-tools`, `provider-transport-runtime`, `provider-usage`, `provider-web-fetch`, `provider-web-fetch-contract`, `provider-web-search`, `provider-web-search-config-contract`, `provider-web-search-contract`, `qa-runner-runtime`, `realtime-bootstrap-context`, `realtime-transcription`, `realtime-voice`, `reply-reference`, `request-url`, `response-limit-runtime`, `retry-runtime`, `runtime-doctor`, `runtime-fetch`, `sandbox`, `secret-file-runtime`, `secure-random-runtime`, `session-binding-runtime`, `session-catalog`, `session-key-runtime`, `session-transcript-hit`, `session-transcript-runtime`, `session-visibility`, `simple-completion-runtime`, `speech`, `speech-core`, `sqlite-runtime`, `ssrf-dispatcher`, `string-normalization-runtime`, `system-event-runtime`, `talk-config-runtime`, `target-resolver-runtime`, `text-autolink-runtime`, `text-utility-runtime`, `thread-bindings-runtime`, `thread-bindings-session-runtime`, `time-runtime`, `tool-payload`, `tool-plugin`, `tool-results`, `transcripts`, `transport-ready-runtime`, `tts-runtime`, `types`, `video-generation`, `video-generation-core`, `video-generation-runtime`, `web-content-extractor`, `webhook-targets`, `windows-spawn` |
| `2026-08-15`  | Obsolescencias de compatibilidad anteriores     | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `2026-09-01`  | Obsolescencias de compatibilidad anteriores     | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Todos los plugins principales ya han migrado. Los plugins externos deben migrar
antes de la próxima versión principal. Ejecuta `pnpm plugins:boundary-report` para ver qué
registros de compatibilidad vencen antes para las superficies que utiliza tu plugin.

## Suprimir temporalmente las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Contenido relacionado

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
