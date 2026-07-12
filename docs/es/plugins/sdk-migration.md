---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaba api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un plugin a la arquitectura moderna de plugins
    - Mantiene un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T14:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw sustituyó una amplia capa de compatibilidad con versiones anteriores por una arquitectura
moderna de plugins basada en importaciones pequeñas y específicas. Si tu plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Dos superficies de importación de acceso amplio permitían anteriormente que los plugins accedieran a
casi cualquier cosa desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`**: reexportaba decenas de funciones auxiliares para mantener
  en funcionamiento los plugins antiguos basados en hooks mientras se desarrollaba la nueva arquitectura.
- **`openclaw/plugin-sdk/infra-runtime`**: un módulo de reexportación amplio que combinaba eventos del sistema,
  estado de heartbeat, colas de entrega, funciones auxiliares de fetch/proxy, funciones auxiliares de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`**: un módulo de reexportación amplio de configuración que aún
  incluía funciones auxiliares directas obsoletas de carga/escritura durante el período de migración.
- **`openclaw/extension-api`**: un puente que daba a los plugins acceso directo a
  funciones auxiliares del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`**: un hook eliminado exclusivo del ejecutor integrado
  que observaba eventos del ejecutor integrado como `tool_result`. En su lugar, usa middleware
  para resultados de herramientas del agente (consulta [Migrar las extensiones de resultados de herramientas
  integradas a middleware](#how-to-migrate)).

Estas superficies están **obsoletas**: todavía funcionan, pero los plugins nuevos no deben
usarlas, y los plugins existentes deben migrar antes de que la próxima versión principal
las elimine. `registerEmbeddedExtensionFactory` ya se eliminó;
los registros heredados ya no se cargan.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una versión principal futura.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y un período de obsolescencia. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los hooks y el comportamiento
de registro en tiempo de ejecución.

### Motivo

- **Inicio lento**: importar una función auxiliar cargaba decenas de módulos no relacionados.
- **Dependencias circulares**: las reexportaciones amplias facilitaban la creación de ciclos de
  importación.
- **Superficie de API poco clara**: no había forma de distinguir las exportaciones estables de las internas.

Cada `openclaw/plugin-sdk/<subpath>` es ahora un módulo pequeño y autónomo con
un contrato documentado.

También se eliminaron las interfaces heredadas de conveniencia para proveedores de los canales incluidos:
los atajos de funciones auxiliares específicos de cada canal eran recursos privados del monorepositorio, no
contratos estables para plugins. En su lugar, usa subrutas genéricas específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, mantén las funciones auxiliares propiedad del proveedor en el
`api.ts` o `runtime-api.ts` del propio plugin:

- Anthropic mantiene las funciones auxiliares de transmisión específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las funciones auxiliares del modelo predeterminado y los constructores
  de proveedores en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedores y las funciones auxiliares de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad de plugins externos sigue este orden:

1. Añadir el nuevo contrato.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su reemplazo.
4. Cubrir ambas rutas con pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar únicamente después del período de migración anunciado, normalmente en una versión
   principal.

Si un campo del manifiesto aún se acepta, sigue usándolo hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo documentado;
los plugins existentes no deben dejar de funcionar durante versiones secundarias ordinarias.

Audita la cola de migración actual con `pnpm plugins:boundary-report`:

| Opción                                                  | Efecto                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar del detalle completo.                                      |
| `--json`                                                | Informe legible por máquinas.                                                           |
| `--owner <id>`                                          | Filtra por un plugin o propietario de compatibilidad.                                   |
| `--fail-on-cross-owner`                                 | Finaliza con un código distinto de cero si hay importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Finaliza con un código distinto de cero cuando ha pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Finaliza con un código distinto de cero si hay adaptadores reservados del SDK sin usar. |

`pnpm plugins:boundary-report:ci` se ejecuta con las tres opciones de error. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una imprecisa «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, cuenta
las referencias locales de código/documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK para el host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por parte del propietario; las exportaciones reservadas sin usar deben eliminarse del SDK
público.

## Cómo migrar

<Steps>
  <Step title="Migrar las funciones auxiliares de carga/escritura de la configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Es preferible usar la configuración que ya
    se haya pasado a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de escribir una configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por la función auxiliar transaccional con una política
    explícita posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio requiera
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    únicamente cuando el llamador se encargue del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de la mutación incluyen un resumen `followUp` tipado para
    pruebas y registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` permanecen como funciones auxiliares de compatibilidad
    obsoletas para plugins externos y emiten una única advertencia con el código de compatibilidad
    `runtime-config-load-write`. Los plugins incluidos y el código de tiempo de ejecución del repositorio
    están protegidos por `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en plugins de producción
    falla de inmediato, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea de tiempo de ejecución de la solicitud, las funciones auxiliares de envío/acción/cliente de los canales
    en tiempo de ejecución deben recibir la configuración desde su límite, y los módulos de tiempo de ejecución
    de larga duración permiten cero llamadas ambientales a `loadConfig()`.

    El código nuevo de plugins debe evitar el módulo de reexportación amplio `openclaw/plugin-sdk/config-runtime`.
    Usa la subruta específica correspondiente:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada y búsqueda de configuración en la entrada del plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual de tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Funciones auxiliares del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Funciones auxiliares en tiempo de ejecución para políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entradas de secretos | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante análisis contra el módulo de reexportación
    amplio, de modo que las importaciones y los mocks permanezcan limitados al comportamiento que necesitan. El
    módulo de reexportación sigue existiendo por compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar las extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben reemplazar los controladores de resultados de herramientas exclusivos
    del ejecutor integrado basados en `api.registerEmbeddedExtensionFactory(...)` por
    middleware independiente del tiempo de ejecución:

    ```typescript
    // Herramientas dinámicas de los tiempos de ejecución de OpenClaw y Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Actualiza al mismo tiempo el manifiesto del plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando esté
    habilitado explícitamente y todos los tiempos de ejecución de destino estén declarados en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalado
    no declarados se rechazan.

  </Step>

  <Step title="Migrar los controladores de aprobación nativos a datos de capacidad">
    Los plugins de canales con capacidad de aprobación exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` y el registro compartido de contexto
    de tiempo de ejecución:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Traslada la autenticación/entrega específica de aprobaciones fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canal; traslada los campos de entrega/nativos/renderizado a
      `approvalCapability`.
    - `plugin.auth` permanece únicamente para los flujos de inicio/cierre de sesión del canal; el núcleo
      ya no lee allí los hooks de autenticación de aprobaciones.
    - Registra los objetos de tiempo de ejecución propiedad del canal (clientes, tokens, aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíes avisos de redirección propiedad del plugin desde controladores nativos de aprobación;
      el núcleo se encarga de los avisos de enrutamiento a otro destino a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`; los stubs parciales se
      rechazan.

    Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins) para conocer la estructura actual
    de la capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento alternativo de los wrappers de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat`
    de Windows no resueltos ahora fallan de forma cerrada, salvo que pases explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto únicamente para llamadores de compatibilidad de confianza que acepten
      // deliberadamente una alternativa mediada por el shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende deliberadamente de la alternativa mediante shell, no establezcas
    `allowShellFallback` y gestiona en su lugar el error generado.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Sustituirlas por importaciones específicas">
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

    Para los auxiliares del lado del host, use el entorno de ejecución del plugin
    inyectado en lugar de importarlos directamente:

    ```typescript
    // Antes (puente extension-api obsoleto)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (entorno de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Siga el mismo patrón para los demás auxiliares de puente heredados:

    | Importación anterior | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Reemplazar las importaciones amplias de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo para mantener la
    compatibilidad externa, pero el código nuevo debe importar la superficie
    específica que realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de desduplicación en memoria y con respaldo persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros para rutas de archivos locales y contenido multimedia | `openclaw/plugin-sdk/file-access-runtime` |
    | Obtención compatible con el despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de obtención mediante proxy y con protecciones | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares para comandos y cargas útiles de respuestas de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares para dar formato a errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares para tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante análisis contra
    `infra-runtime`, por lo que el código del repositorio no puede volver a usar
    el punto de exportación amplio.

  </Step>

  <Step title="Migrar los auxiliares de rutas de canales">
    El código nuevo de rutas de canales usa `openclaw/plugin-sdk/channel-route`.
    Los nombres anteriores de claves de ruta y destinos comparables se mantienen
    como alias de compatibilidad:

    | Auxiliar anterior | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los auxiliares modernos de rutas normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en las aprobaciones nativas, la supresión de respuestas,
    la desduplicación entrante, la entrega de cron y el enrutamiento de sesiones.

    No añada usos nuevos de `ChannelMessagingAdapter.parseExplicitTarget`, de los
    auxiliares de rutas cargadas basados en analizadores (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` de `plugin-sdk/channel-route`;
    están obsoletos y se mantienen únicamente para plugins antiguos. Los plugins
    de canales nuevos deben usar `messaging.targetResolver.resolveTarget(...)`
    para normalizar los identificadores de destino y proporcionar una alternativa
    cuando no se encuentre el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesite conocer
    anticipadamente el tipo de interlocutor y
    `messaging.resolveOutboundSessionRoute(...)` para la identidad nativa del
    proveedor de la sesión y el hilo.

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
  | Ruta de importación | Propósito | Exportaciones principales |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de plugins | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación global heredada para definiciones y constructores de entradas de canales | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entradas de canales | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Traductor de configuración, solicitudes de listas de permitidos, constructores del estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de tiempo de ejecución durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para importación, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Use `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes para varias cuentas | Ayudantes de lista de cuentas, configuración y control de acciones |
  | `plugin-sdk/account-id` | Ayudantes de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas y reserva predeterminada |
  | `plugin-sdk/account-helpers` | Ayudantes específicos de cuentas | Ayudantes de lista de cuentas y acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de vinculación de mensajes directos | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Integración del prefijo de respuesta, la escritura y la entrega desde el origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y ayudantes de acceso a mensajes directos | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo primitivas compartidas de esquemas de configuración de canales y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; use `plugin-sdk/bundled-channel-config-schema` para los plugins incluidos mantenidos |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados y conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupos y mensajes directos | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobres entrantes | Ayudantes compartidos para rutas y construcción de sobres |
  | `plugin-sdk/channel-inbound` | Ayudantes de recepción entrante | Creación de contexto, formato, raíces, ejecutores, envío de respuestas preparadas y predicados de envío |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para el análisis de destinos | Use `plugin-sdk/channel-targets` para ayudantes genéricos de análisis de destinos, `plugin-sdk/channel-route` para la comparación de rutas y `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del plugin para la resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Ayudantes del ciclo de vida de mensajes salientes | Adaptadores de mensajes, confirmaciones, ayudantes de envío duradero, ayudantes de vista previa en vivo y transmisión, opciones de respuesta, ayudantes del ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes del ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de cargas útiles multimedia | Constructor de cargas útiles multimedia del agente para disposiciones de campos heredadas |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas del entorno de ejecución de canales |
  | `plugin-sdk/channel-send-result` | Tipos de resultados de envío | Tipos de resultados de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes generales del entorno de ejecución | Ayudantes del entorno de ejecución, registro, copias de seguridad e instalación de plugins |
  | `plugin-sdk/runtime-env` | Ayudantes específicos del entorno de ejecución | Ayudantes de registrador, entorno de ejecución, tiempo de espera, reintentos y espera incremental |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos del entorno de ejecución de plugins | Ayudantes de comandos, enlaces, HTTP e interacción de plugins |
  | `plugin-sdk/hook-runtime` | Ayudantes de la canalización de enlaces | Ayudantes compartidos de la canalización de Webhooks y enlaces internos |
  | `plugin-sdk/lazy-runtime` | Ayudantes de carga diferida del entorno de ejecución | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Ayudantes del entorno de ejecución de la CLI | Formato de comandos, esperas y ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes del Gateway | Cliente del Gateway, ayudante de inicio preparado para el bucle de eventos, resolución del host LAN anunciado y ayudantes de parches del estado de los canales |
  | `plugin-sdk/config-runtime` | Capa obsoleta de compatibilidad de configuración | Prefiera `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram con reserva estable cuando la superficie del contrato incluido de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de solicitudes de aprobación | Carga útil de aprobación de ejecución/plugins, ayudantes de capacidad y perfil de aprobación, ayudantes nativos de enrutamiento y entorno de ejecución de aprobaciones, y formato estructurado de rutas de visualización de aprobaciones |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autorización de aprobaciones | Resolución de aprobadores, autorización de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes del cliente de aprobaciones | Ayudantes nativos de perfiles y filtros de aprobación de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobaciones | Adaptadores nativos de capacidad y entrega de aprobaciones |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes del Gateway de aprobaciones | Resolutor compartido del Gateway de aprobaciones |
  | `plugin-sdk/approval-reference-runtime` | Referencias de transporte de aprobaciones | Ayudante determinista de localización duradera para devoluciones de llamada limitadas por el transporte |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptadores de aprobaciones | Ayudantes ligeros de carga de adaptadores nativos de aprobaciones para puntos de entrada de canales críticos |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de gestión de aprobaciones | Ayudantes más amplios del entorno de ejecución para gestionar aprobaciones; prefiera las interfaces más específicas de adaptadores y Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destinos de aprobación | Ayudantes nativos de vinculación de destinos y cuentas de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuestas de aprobación | Ayudantes de cargas útiles de respuesta de aprobación de ejecución/plugins |
  | `plugin-sdk/channel-runtime-context` | Ayudantes del contexto de ejecución de canales | Ayudantes genéricos para registrar, obtener y observar el contexto de ejecución de canales |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, control de mensajes directos, archivos y rutas limitados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de políticas SSRF | Ayudantes de listas de hosts permitidos y políticas de redes privadas |
  | `plugin-sdk/ssrf-runtime` | Ayudantes del entorno de ejecución SSRF | Distribuidor fijado, solicitudes protegidas y ayudantes de políticas SSRF |
  | `plugin-sdk/system-event-runtime` | Ayudantes de eventos del sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Ayudantes de Heartbeat | Ayudantes de activación, eventos y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Ayudantes de colas de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Ayudantes de actividad de canales | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Ayudantes de desduplicación | Cachés de desduplicación en memoria y respaldadas por almacenamiento persistente |
  | `plugin-sdk/file-access-runtime` | Ayudantes de acceso a archivos | Ayudantes seguros de rutas de archivos locales y medios |
  | `plugin-sdk/transport-ready-runtime` | Ayudantes de disponibilidad del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Ayudantes de políticas de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Ayudantes de cachés acotadas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de control de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafos de errores, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Ayudantes de solicitudes encapsuladas y proxies | `resolveFetch`, ayudantes de proxies, ayudantes de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintentos | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y asignación de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ayudantes de control y superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitentes, ayudantes del registro de comandos, incluido el formato dinámico de menús de argumentos |
  | `plugin-sdk/command-status` | Representadores de estado y ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entradas de secretos | Ayudantes de entradas de secretos |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes de Webhooks | Utilidades de destinos de Webhooks |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección del cuerpo de Webhooks | Ayudantes de lectura y limitación del cuerpo de las solicitudes |
  | `plugin-sdk/reply-runtime` | Entorno de ejecución compartido de respuestas | Envío entrante, Heartbeat, planificador de respuestas, división en fragmentos |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de envío de respuestas | Finalización, envío del proveedor y ayudantes de etiquetas de conversaciones |
  | `plugin-sdk/reply-history` | Ayudantes del historial de respuestas | `createChannelHistoryWindow`; exportaciones obsoletas de compatibilidad de ayudantes de mapas, como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuestas | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuestas | Ayudantes de división de texto y Markdown en fragmentos |
  | `plugin-sdk/session-store-runtime` | Ayudantes del almacén de sesiones | Ayudantes de filas de sesión con ámbito, ayudantes de rutas del almacén y lecturas de la fecha de actualización |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Generadores de resúmenes de estado de canales/cuentas, valores predeterminados del estado de ejecución y ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de destinos | Ayudantes compartidos de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slugs/cadenas |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitudes | Extrae URL de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Ayudantes de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de cargas útiles de herramientas | Extrae cargas útiles normalizadas de objetos de resultados de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envíos de herramientas | Extrae campos canónicos del destino de envío de los argumentos de herramientas |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas de descargas temporales |
  | `plugin-sdk/logging-core` | Ayudantes de registro | Ayudantes de registro de subsistemas y censura |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes del modo de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de cargas útiles de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/alojados por el usuario | Ayudantes de detección/configuración de proveedores alojados por el usuario |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos de configuración de proveedores alojados por el usuario compatibles con OpenAI | Los mismos ayudantes de detección/configuración de proveedores alojados por el usuario |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de proveedores en tiempo de ejecución | Ayudantes de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de claves de API de proveedores | Ayudantes de incorporación/escritura de perfiles mediante claves de API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultados de autenticación de proveedores | Generador estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedores | Selección de proveedores configurados o automáticos y combinación de configuraciones sin procesar de proveedores |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedores | Ayudantes de consulta de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelos/reproducción de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, generadores compartidos de políticas de reproducción, ayudantes de endpoints de proveedores y ayudantes de normalización de identificadores de modelos |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogos de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidades HTTP/endpoints de proveedores, incluidos ayudantes de formularios multiparte para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de obtención web de proveedores | Ayudantes de registro/caché de proveedores de obtención web |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de búsqueda web de proveedores | Ayudantes específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan conexión con la activación del Plugin |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contratos de búsqueda web de proveedores | Ayudantes específicos de contratos de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores/obtenedores de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de búsqueda web de proveedores | Ayudantes de registro/caché/ejecución de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza de esquemas + diagnósticos de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de contenedores de flujos de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de contenedores de flujos y ayudantes compartidos de contenedores de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativo de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de medios | Ayudantes de obtención/transformación/almacenamiento de medios, sondeo de dimensiones de vídeo respaldado por ffprobe y generadores de cargas útiles de medios |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación de medios | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelos faltantes para la generación de imágenes/vídeo/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión de medios | Tipos de proveedores de comprensión de medios y exportaciones de ayudantes de imagen/audio orientados a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia y obsoleta de compatibilidad de texto | Use `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedores de voz y ayudantes orientados a proveedores para directivas, registro y validación, además de un generador de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas y normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedores, ayudantes de registro y ayudante compartido de sesiones WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedores, ayudantes de registro/resolución, ayudantes de sesiones puente, colas compartidas de respuesta oral del agente, control por voz de ejecuciones activas, estado de transcripciones/eventos, supresión de eco, coincidencia de preguntas de consulta, coordinación de consultas forzadas, seguimiento del contexto de turnos, seguimiento de actividad de salida y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedores de generación de imágenes, ayudantes de URL de datos/recursos de imagen y generador de proveedores de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes y ayudantes de conmutación por error, autenticación y registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedores/solicitudes/resultados de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/video-generation` | Ayudantes de generación de vídeo | Tipos de proveedores/solicitudes/resultados de generación de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de vídeo | Tipos de generación de vídeo, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuestas interactivas | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canales | Primitivas específicas de esquemas de configuración de canales |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canales | Ayudantes de autorización de escritura de configuración de canales |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canales | Exportaciones compartidas del preludio de Plugins de canales |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canales | Ayudantes compartidos de instantáneas/resúmenes de estado de canales |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de listas de permitidos | Ayudantes de edición/lectura de configuración de listas de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso a grupos | Ayudantes compartidos de decisiones de acceso a grupos |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Use `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Ayudantes de protección de mensajes directos | Ayudantes específicos de políticas de protección previas al cifrado |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensiones | Primitivas auxiliares de canales pasivos/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destinos de Webhooks | Registro de destinos de Webhooks y ayudantes de instalación de rutas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Use `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Ayudantes compartidos de medios web | Ayudantes de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad con Zod | Importe `zod` directamente desde `zod` |
  | `plugin-sdk/memory-core` | Ayudantes de memory-core incluidos | Superficie de ayudantes de gestión/configuración/archivos/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de ejecución del motor de memoria | Fachada de ejecución de indexación/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de incrustaciones de memoria | Ayudantes ligeros del registro de proveedores de incrustaciones de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de incrustaciones del host de memoria | Contratos de incrustaciones de memoria, acceso al registro, proveedor local y ayudantes genéricos de procesamiento por lotes/remotos; los proveedores remotos concretos residen en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria | Ayudantes multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consultas del host de memoria | Ayudantes de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria | Ayudantes de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Use `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria | Ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Ejecución de CLI del host de memoria | Ayudantes de ejecución de CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Ejecución principal del host de memoria | Ayudantes de ejecución principal del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/ejecución del host de memoria | Ayudantes de archivos/ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de ejecución principal del host de memoria | Alias independiente del proveedor para los ayudantes de ejecución principal del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias independiente del proveedor para los ayudantes del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivos/ejecución de memoria | Use `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de Markdown administrado | Ayudantes compartidos de Markdown administrado para Plugins relacionados con la memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado del host de memoria | Use `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Barrel de compatibilidad obsoleto local del repositorio; use subrutas de prueba específicas locales del repositorio, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

  Esta tabla corresponde al subconjunto común de migración, no a toda la superficie del SDK. El
  inventario de puntos de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`;
  las exportaciones de paquetes se generan a partir del subconjunto público.

  Las interfaces auxiliares reservadas para plugins incluidos se han retirado del mapa de
  exportaciones del SDK público, salvo las fachadas de compatibilidad documentadas explícitamente,
  como el shim obsoleto `plugin-sdk/discord`, que se conserva para los plugins externos que aún
  importan directamente el paquete publicado `@openclaw/discord`. Los auxiliares específicos de
  cada propietario se encuentran dentro del paquete del plugin correspondiente; el comportamiento
  compartido del host se canaliza mediante contratos genéricos del SDK, como
  `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
  `plugin-sdk/plugin-config-runtime`.

  Use la importación más específica que corresponda a la tarea. Si no encuentra una exportación,
  consulte el código fuente en `src/plugin-sdk/` o pregunte a los responsables qué contrato
  genérico debería gestionarla.

  ## Funciones obsoletas activas

  Funciones obsoletas más específicas en el SDK de plugins, el contrato de proveedores, la superficie
  de ejecución y el manifiesto. Todas siguen funcionando actualmente, pero se eliminarán en una futura
  versión principal. Cada entrada asigna la API anterior a su reemplazo canónico.

  <AccordionGroup>
  <Accordion title="Auxiliares de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas y las mismas
    exportaciones; simplemente se importan desde la subruta más específica. `command-auth`
    las reexporta como stubs de compatibilidad.

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

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`: un único objeto de
    decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio de Slack
    no utiliza este auxiliar.

  </Accordion>

  <Accordion title="Shim de ejecución de canales y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para plugins
    de canal antiguos. No lo importe en código nuevo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    ejecución.

    Los auxiliares `channelActions*` de `openclaw/plugin-sdk/channel-actions` están
    obsoletos, al igual que las exportaciones de canal de "actions" sin procesar. Exponga las
    capacidades mediante la superficie semántica `presentation`: los plugins de canal
    declaran qué representan (tarjetas, botones, selectores), en lugar de los nombres de
    acciones sin procesar que aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implemente `createTool(...)` directamente en el plugin del proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el contenedor de la herramienta.

  </Accordion>

  <Accordion title="Envoltorios de canal de texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el
    campo `channelEnvelope` de los objetos de mensajes entrantes) para crear un
    envoltorio plano de solicitud en texto sin formato a partir de mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` junto con bloques estructurados de contexto del usuario. Los plugins
    de canal adjuntan metadatos de enrutamiento (hilo, tema, respuesta y reacciones) como
    campos tipados, en lugar de concatenarlos en una cadena de solicitud. El auxiliar
    `formatAgentEnvelope(...)` sigue siendo compatible con los envoltorios sintetizados
    destinados al asistente, pero los envoltorios entrantes de texto sin formato están en proceso
    de eliminación.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que procesara posteriormente el texto del envoltorio anterior.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El mismo contrato de limpieza durante el
    cierre; solo cambia el nombre del hook.

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

    `deactivate` sigue conectado como un alias de compatibilidad obsoleto hasta que se
    elimine después de 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)` que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permita que el núcleo prepare vinculaciones de subagentes con `thread: true`
    mediante el adaptador de vinculación de sesiones del canal. Use
    `api.on("subagent_spawned", handler)` únicamente para la observación posterior al inicio.

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

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` y
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecen únicamente como
    superficies de compatibilidad obsoletas mientras migran los plugins externos y se eliminarán
    después de 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de detección de proveedores -> tipos de catálogo de proveedores">
    Cuatro alias de tipos de detección son ahora contenedores ligeros de los tipos de la era
    del catálogo:

    | Alias anterior             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además, el contenedor estático heredado `ProviderCapabilities`: los plugins de proveedores
    deben usar hooks explícitos del proveedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres hooks independientes en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un `label` opcional y una
    lista ordenada de niveles. OpenClaw reduce automáticamente los valores almacenados
    obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, un valor combinado opcional de `reasoning`
    y datos `compat` combinados y opcionales del modelo. Los plugins de proveedores pueden
    usar esos datos del catálogo para exponer un perfil específico del modelo únicamente cuando
    el contrato de solicitud configurado lo admita.

    Implemente un hook en lugar de tres. Los hooks heredados siguen funcionando durante
    el período de obsolescencia, pero no se combinan con el resultado del perfil.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: implementar hooks de autenticación externos sin declarar el proveedor
    en el manifiesto del plugin.

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
    Campo de manifiesto **anterior**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: replique la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    del manifiesto. Esto consolida los metadatos de entorno de configuración y estado en un solo lugar
    y evita iniciar el entorno de ejecución del plugin únicamente para responder consultas de variables
    de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
    hasta que finalice el período de obsolescencia.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas independientes: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Las mismas ranuras, una única llamada de registro. Los auxiliares aditivos de solicitudes y corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no se ven
    afectados.

  </Accordion>

  <Accordion title="API del proveedor de incrustaciones de memoria">
    **Anterior**: `api.registerMemoryEmbeddingProvider(...)` junto con
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` junto con
    `contracts.embeddingProviders`.

    El contrato genérico del proveedor de incrustaciones se puede reutilizar fuera de la memoria y es
    la vía compatible para los proveedores nuevos. La API de registro específica de la memoria
    sigue conectada como compatibilidad obsoleta mientras migran los proveedores
    existentes. La inspección de plugins informa del uso en plugins no incluidos como deuda de
    compatibilidad.

  </Accordion>

  <Accordion title="Cambio de nombre de los tipos de mensajes de sesión de subagentes">
    Dos alias de tipos heredados siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Anterior                      | Nuevo                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La misma firma; el método anterior delega la llamada en el
    nuevo.

  </Accordion>

  <Accordion title="API eliminadas de archivos de sesiones y transcripciones">
    La migración de sesiones y transcripciones a SQLite elimina o marca como obsoletas las API
    orientadas a plugins que exponían almacenes `sessions.json` activos, rutas de transcripciones
    JSONL o listas de archivos de sesión. Los plugins de ejecución deben usar la identidad de sesión
    y los auxiliares de ejecución del SDK, en lugar de resolver o modificar archivos activos.

    | Superficie en migración | Reemplazo |
    | ----------------- | ----------- |
    | Las funciones obsoletas `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)` y mutaciones de sesión a nivel de fila. |
    | La función obsoleta `resolveSessionFilePath(...)` | La identidad de sesión (`sessionKey`, `sessionId` y los auxiliares de destino del entorno de ejecución del SDK), además de los métodos del Gateway que operan sobre la sesión actual. |
    | La función eliminada `saveSessionStore(...)` | Las API del entorno de ejecución de sesiones gestionadas por el Gateway; el código de los plugins debe solicitar o modificar el estado de sesión mediante los auxiliares documentados del entorno de ejecución o del contexto, en lugar de escribir en el archivo del almacén activo. |
    | Las funciones eliminadas `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` | La identidad de sesión y los métodos del Gateway que operan sobre la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Los lectores de transcripciones respaldados por identidad expuestos por el contexto actual del entorno de ejecución, o los métodos de historial o sesión del Gateway cuando el plugin se encuentre fuera de la ruta propietaria de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria como `sessionFiles` | Fuentes de transcripciones o sesiones respaldadas por identidad y proporcionadas por el host; no rastree archivos JSONL activos para sesiones en curso. |
    | Opciones del entorno de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos `sessionTarget` o de destino del entorno de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos de transcripción JSONL heredados siguen siendo válidos como
    artefactos de importación, archivo, exportación y soporte. Ya no constituyen
    el contrato permanente del entorno de ejecución para las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    auxiliares obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime`
    mantiene exactamente ese puente hasta 2026-10-12; los plugins nuevos deben
    usar los reemplazos. `resolveStorePath(...)` sigue siendo un auxiliar
    compatible del SDK y no forma parte de esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de los plugins no incluidos
    cuyos errores de carga o diagnósticos todavía hacen referencia a estas API
    de archivos eliminadas. El análisis informativo de
    `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o una posterior
    para que los análisis de paquetes externos también detecten, antes del
    lanzamiento, los auxiliares de sesión del almacén completo, los auxiliares
    de rutas de archivos de sesión, los destinos heredados de archivos de
    transcripción y los auxiliares de transcripción de bajo nivel.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor activo
    de flujo de tareas.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el entorno de ejecución de
    mutaciones de TaskFlow gestionadas para los plugins que crean, actualizan,
    cancelan o ejecutan tareas secundarias desde un flujo. Use
    `runtime.tasks.flows` cuando el plugin solo necesite lecturas basadas en DTO.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Después
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Eliminado después de 2026-07-26.

  </Accordion>

  <Accordion title="Factorías de extensiones integradas -> middleware de resultados de herramientas del agente">
    Se explica en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    completar la información: la ruta eliminada exclusiva del ejecutor integrado
    `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de
    entornos de ejecución en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType`, reexportado desde `openclaw/plugin-sdk`, ahora es un
    alias de una sola línea para `OpenClawConfig`. Prefiera el nombre canónico.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Después
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias a nivel de extensión (dentro de los plugins incluidos de
canales o proveedores en `extensions/`) se registran en sus propios archivos
de exportación `api.ts` y `runtime-api.ts`. No afectan a los contratos de
plugins de terceros y no se enumeran aquí. Si utiliza directamente el archivo
de exportación local de un plugin incluido, lea los comentarios sobre
obsolescencia de ese archivo antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador
comparte un único controlador de sesiones de Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. El controlador posee el sobre común de
eventos de Talk, el estado del turno activo, el estado de captura, el estado
del audio de salida, el historial de eventos recientes y el rechazo de turnos
obsoletos. Los plugins de proveedores poseen las sesiones en tiempo real
específicas de cada proveedor; los plugins de superficies poseen las
particularidades de captura, reproducción, telefonía y reuniones.

Todas las superficies incluidas se ejecutan sobre el controlador compartido:
retransmisión del navegador, transferencia a salas gestionadas, llamadas de
voz en tiempo real, STT por streaming para llamadas de voz, Google Meet en
tiempo real y pulsar para hablar nativo. El Gateway anuncia un único canal
activo de eventos de Talk en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)`,
salvo que implemente un adaptador de bajo nivel o un elemento de prueba. Use el
controlador compartido para que los eventos asociados a un turno no puedan
emitirse sin un identificador de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del
ciclo de vida del audio de salida se mantengan coherentes entre la telefonía,
las reuniones, la retransmisión del navegador, la transferencia a salas
gestionadas y los clientes nativos de Talk.

La forma de la API pública:

```typescript
// API de sesión de Talk gestionada por el Gateway.
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

// API de sesión del proveedor gestionada por el cliente.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Las sesiones WebRTC o de WebSocket del proveedor gestionadas por el navegador
usan `talk.client.create`, porque el navegador gestiona la negociación con el
proveedor y el transporte multimedia, mientras que el Gateway gestiona las
credenciales, las instrucciones y la política de herramientas.
`talk.session.*` es la superficie común gestionada por el Gateway para el
tiempo real mediante retransmisión del Gateway, la transcripción mediante
retransmisión del Gateway y las sesiones STT/TTS nativas de salas gestionadas.

Las configuraciones heredadas que sitúen selectores de tiempo real junto a
`talk.provider` / `talk.providers` deben repararse con
`openclaw doctor --fix`; el entorno de ejecución de Talk no reinterpreta la
configuración del proveedor de voz/TTS como configuración del proveedor en
tiempo real.

Las combinaciones compatibles con `talk.session.create` son intencionadamente
reducidas:

| Modo            | Transporte      | Cerebro         | Propietario         | Notas                                                                                                                        |
| --------------- | --------------- | --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway             | Audio bidireccional completo del proveedor retransmitido mediante el Gateway; las llamadas a herramientas se enrutan mediante la herramienta de consulta del agente. |
| `transcription` | `gateway-relay` | `none`          | Gateway             | Solo STT por streaming; los invocadores envían audio de entrada y reciben eventos de transcripción.                           |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas de tipo pulsar para hablar y walkie-talkie en las que el cliente gestiona la captura y reproducción, y el Gateway gestiona el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala exclusivo para administradores y destinado a superficies propias de confianza que ejecutan directamente acciones de herramientas del Gateway. |

Mapa de métodos para quienes migren desde las familias anteriores
`talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` (todas
eliminadas):

| Anterior                           | Nuevo                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`            | `talk.client.create`                                     |
| `talk.realtime.toolCall`           | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`         | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`        | `talk.session.cancelOutput` o `talk.session.cancelTurn`  |
| `talk.realtime.relayToolResult`    | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`          | `talk.session.close`                                     |
| `talk.transcription.session`       | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`    | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel`   | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`     | `talk.session.close`                                     |
| `talk.handoff.create`              | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`                | `talk.session.join`                                      |
| `talk.handoff.revoke`              | `talk.session.close`                                     |

El vocabulario de control unificado también es deliberadamente reducido:

| Método                          | Se aplica a                                              | Contrato                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay`  | Añade un fragmento de audio PCM en base64 a la sesión del proveedor que pertenece a la misma conexión de Gateway.                                                                                                         |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                   | Inicia un turno de usuario en una sala administrada.                                                                                                                                                                      |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                   | Finaliza el turno activo después de validar que no esté obsoleto.                                                                                                                                                         |
| `talk.session.cancelTurn`       | todas las sesiones pertenecientes al Gateway             | Cancela la captura activa y el trabajo del proveedor, del agente y de TTS correspondiente a un turno.                                                                                                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                 | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                               |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                 | Completa una llamada de herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pasa `options.willContinue` para una salida provisional o, cuando se admita, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones de Talk respaldadas por un agente               | Envía el control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión de Talk.                                                                                        |
| `talk.session.close`            | todas las sesiones unificadas                            | Detiene las sesiones de retransmisión o revoca el estado de la sala administrada y, a continuación, olvida el identificador de sesión unificado.                                                                          |

No introduzca casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo es responsable de la semántica de las sesiones de Talk. Los plugins de proveedores son responsables de configurar las sesiones de cada proveedor.
Voice-call y Google Meet son responsables de los adaptadores de telefonía y reuniones. Las aplicaciones web y nativas
son responsables de la experiencia de usuario de captura y reproducción en los dispositivos.

## Calendario de eliminación

| Cuándo                                      | Qué sucede                                                                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas emiten advertencias en tiempo de ejecución.                                                                   |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica puede eliminarse; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace que la CI falle una vez transcurrida la fecha. |
| **Próxima versión principal**               | Se eliminan todas las superficies que aún no se hayan migrado; los plugins que todavía las utilicen dejarán de funcionar.                |

Todos los plugins del núcleo ya se han migrado. Los plugins externos deben migrarse
antes de la próxima versión principal. Ejecute `pnpm plugins:boundary-report` para consultar qué
registros de compatibilidad vencerán antes para las superficies que utiliza su plugin.

## Supresión temporal de las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Contenido relacionado

- [Primeros pasos](/es/plugins/building-plugins) - cree su primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Plugins de canales](/es/plugins/sdk-channel-plugins) - creación de plugins de canales
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedores
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
