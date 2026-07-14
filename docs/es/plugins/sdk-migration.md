---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usó api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Está actualizando un plugin a la arquitectura moderna de plugins
    - Mantienes un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK de plugins moderno
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-14T13:52:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7afd1c39e33f90c19e3e75824abb81074d0699ff0e49bb1d9d577d4e3a3e91bf
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw sustituyó una amplia capa de compatibilidad con versiones anteriores por una arquitectura moderna de plugins
basada en importaciones pequeñas y específicas. Si el plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Dos superficies de importación totalmente abiertas permitían que los plugins accedieran a casi cualquier elemento desde un
único punto de entrada:

- **`openclaw/plugin-sdk/compat`** - reexportaba decenas de utilidades para mantener
  operativos los plugins antiguos basados en hooks mientras se desarrollaba la nueva arquitectura.
- **`openclaw/plugin-sdk/infra-runtime`** - un barrel amplio que combinaba eventos del
  sistema, estado de Heartbeat, colas de entrega, utilidades de obtención/proxy, utilidades de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`** - un barrel de configuración amplio que aún
  incluía utilidades directas de carga/escritura obsoletas durante el periodo de migración.
- **`openclaw/extension-api`** - un puente que proporcionaba a los plugins acceso directo a
  utilidades del lado del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook eliminado y exclusivo del ejecutor
  integrado que observaba eventos de este, como `tool_result`. En su lugar, use
  middleware de resultados de herramientas del agente (consulte [Migrar extensiones de resultados de herramientas
  integradas a middleware](#how-to-migrate)).

Estas superficies están **obsoletas**: todavía funcionan, pero los plugins nuevos no deben
usarlas y los existentes deberían migrar antes de que la próxima versión principal
las elimine. `registerEmbeddedExtensionFactory` ya se ha eliminado;
los registros heredados ya no se cargan.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Cuando esto ocurra, los plugins que todavía importen desde estas superficies dejarán de funcionar.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un sustituto. Los cambios de contrato incompatibles pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y un periodo de obsolescencia. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los hooks y el comportamiento
de registro en tiempo de ejecución.

### Motivos

- **Inicio lento** - importar una utilidad cargaba decenas de módulos no relacionados.
- **Dependencias circulares** - las reexportaciones amplias facilitaban la
  creación de ciclos de importación.
- **Superficie de API poco clara** - no había forma de distinguir las exportaciones estables de las internas.

Ahora, cada `openclaw/plugin-sdk/<subpath>` es un módulo pequeño y autónomo con
un contrato documentado.

También se han eliminado las interfaces heredadas de conveniencia de proveedores para los canales incluidos:
los accesos directos a utilidades asociados a canales eran comodidades privadas del monorrepositorio, no
contratos estables de plugins. En su lugar, use subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, mantenga las utilidades propiedad del proveedor en los propios
`api.ts` o `runtime-api.ts` de ese plugin:

- Anthropic mantiene las utilidades de transmisión específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las utilidades del modelo predeterminado y los constructores de proveedores
  en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedores y las utilidades de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad para plugins externos sigue este orden:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su sustituta.
4. Cubrir ambas rutas en las pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar únicamente después del periodo de migración anunciado, normalmente en una versión
   principal.

Si todavía se acepta un campo del manifiesto, continúe usándolo hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debería preferir el sustituto documentado;
los plugins existentes no deberían dejar de funcionar durante las versiones secundarias ordinarias.

Audite la cola de migración actual con `pnpm plugins:boundary-report`:

| Opción                                                   | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar de detalles completos.                                         |
| `--json`                                                | Informe legible por máquina.                                                       |
| `--owner <id>`                                          | Filtra por un solo plugin o propietario de compatibilidad.                                   |
| `--fail-on-cross-owner`                                 | Finaliza con un código distinto de cero si hay importaciones reservadas del SDK entre propietarios.                             |
| `--fail-on-eligible-compat`                             | Finaliza con un código distinto de cero cuando ha pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Finaliza con un código distinto de cero si hay shims reservados del SDK sin usar.                                    |

`pnpm plugins:boundary-report:ci` se ejecuta con las tres opciones de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una imprecisa «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, cuenta
las referencias locales en código/documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK del host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por parte del propietario; las exportaciones reservadas sin usar deberían eliminarse del
SDK público.

## Cómo migrar

<Steps>
  <Step title="Migrar las utilidades de carga/escritura de la configuración en tiempo de ejecución">
    Los plugins incluidos deberían dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Es preferible usar la configuración ya
    pasada a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deberían leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de escribir la configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por la utilidad transaccional con una política explícita
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
    un reinicio limpio del Gateway y `afterWrite: { mode: "none", reason: "..." }`
    únicamente cuando el llamador sea responsable del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de la mutación incluyen un resumen `followUp` tipado para
    pruebas y registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` se mantienen como utilidades de compatibilidad
    obsoletas para plugins externos y emiten una sola advertencia con el
    código de compatibilidad `runtime-config-load-write`. Los plugins incluidos y el código de
    tiempo de ejecución del repositorio están protegidos por `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el uso nuevo en plugins de producción
    falla de inmediato, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea de tiempo de ejecución de la solicitud, las utilidades de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su límite y los módulos de tiempo de ejecución de larga duración
    no permiten ninguna llamada ambiental a `loadConfig()`.

    El código nuevo de plugins debería evitar el barrel amplio `openclaw/plugin-sdk/config-runtime`.
    Use la subruta específica para la tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Aserciones de configuración ya cargada, búsqueda de configuración de entrada del plugin y combinación de configuraciones | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecturas de la instantánea actual en tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Utilidades del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Utilidades en tiempo de ejecución de políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entradas de secretos | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante escáner contra el barrel
    amplio, de modo que las importaciones y las simulaciones permanezcan limitadas al comportamiento que necesitan. El
    barrel sigue existiendo para la compatibilidad externa, pero el código nuevo no debería
    depender de él.

  </Step>

  <Step title="Migrar las extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben sustituir los controladores de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)`, exclusivos del ejecutor integrado, por
    middleware independiente del entorno de ejecución:

    ```typescript
    // Herramientas dinámicas de los entornos de ejecución OpenClaw y Codex
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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando se habilite
    explícitamente y cada entorno de ejecución de destino esté declarado en
    `contracts.agentToolResultMiddleware`. Se rechazan los registros de middleware
    instalados que no estén declarados.

  </Step>

  <Step title="Migrar los controladores de aprobación nativos a datos de capacidades">
    Los plugins de canales con capacidad de aprobación exponen el comportamiento de aprobación nativo mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto
    en tiempo de ejecución:

    - Sustituya `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Traslade la autenticación/entrega específica de aprobaciones fuera del cableado heredado de `plugin.auth` /
      `plugin.approvals` y a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canales; traslade los campos de entrega/nativos/renderización a
      `approvalCapability`.
    - `plugin.auth` se mantiene únicamente para los flujos de inicio/cierre de sesión del canal; el núcleo ya no
      lee allí los hooks de autenticación de aprobaciones.
    - Registre los objetos en tiempo de ejecución propiedad del canal (clientes, tokens, aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíe avisos de redireccionamiento propiedad del plugin desde controladores de aprobación nativos;
      el núcleo controla los avisos de redireccionamiento a otro destino a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporcione una
      superficie `createPluginRuntime().channel` real; se rechazan las
      implementaciones parciales.

    Consulte [Plugins de canales](/es/plugins/sdk-channel-plugins) para conocer la disposición actual
    de las capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento alternativo de los wrappers de Windows">
    Si el plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` sin resolver ahora fallan de forma cerrada, salvo que se pase explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establezca esta opción únicamente para llamadores de compatibilidad de confianza que acepten
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

  <Step title="Sustituir por importaciones específicas">
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

    Para las utilidades del lado del host, use el entorno de ejecución del plugin inyectado en lugar de
    importarlas directamente:

    ```typescript
    // Antes (puente extension-api obsoleto)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (entorno de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros auxiliares de puente heredados:

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
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la superficie específica que
    realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y respaldadas por almacenamiento persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros para rutas de archivos locales y contenido multimedia | `openclaw/plugin-sdk/file-access-runtime` |
    | Solicitud fetch compatible con el despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del despachador SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobación | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares de comandos y carga útil de respuesta de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante un escáner contra `infra-runtime`, por lo que el código del repositorio
    no puede volver a usar el barrel amplio.

  </Step>

  <Step title="Migrar los auxiliares de rutas de canales">
    El código nuevo de rutas de canales utiliza `openclaw/plugin-sdk/channel-route`. Los nombres anteriores
    de claves de ruta y destinos comparables se mantienen como alias de compatibilidad:

    | Auxiliar anterior | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Los auxiliares modernos de rutas normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en las aprobaciones nativas, la supresión de respuestas, la deduplicación de entradas,
    la entrega mediante cron y el enrutamiento de sesiones.

    No añada usos nuevos de `ChannelMessagingAdapter.parseExplicitTarget`, los
    auxiliares de rutas cargadas basados en analizadores (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) ni
    `resolveChannelRouteTargetWithParser(...)` de `plugin-sdk/channel-route`;
    están obsoletos y se mantienen únicamente para plugins anteriores. Los plugins de
    canales nuevos deben usar `messaging.targetResolver.resolveTarget(...)` para
    normalizar identificadores de destino y proporcionar un comportamiento alternativo cuando no se encuentre el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesite determinar anticipadamente el tipo de par,
    y `messaging.resolveOutboundSessionRoute(...)` para la identidad
    nativa del proveedor de sesiones e hilos.

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
  | `plugin-sdk/plugin-entry` | Función auxiliar canónica para la entrada del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones y constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Función auxiliar para entradas de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | Funciones auxiliares compartidas del asistente de configuración | Traductor de configuración, solicitudes de listas de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Funciones auxiliares de entorno de ejecución durante la configuración | `createSetupTranslator`, adaptadores de parches de configuración seguros para la importación, funciones auxiliares de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto del adaptador de configuración | Usar `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Funciones auxiliares de las herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Funciones auxiliares para varias cuentas | Funciones auxiliares de lista de cuentas, configuración y control de acciones |
  | `plugin-sdk/account-id` | Funciones auxiliares de identificadores de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de identificadores de cuenta |
  | `plugin-sdk/account-resolution` | Funciones auxiliares de búsqueda de cuentas | Funciones auxiliares de búsqueda de cuentas y respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Funciones auxiliares específicas para cuentas | Funciones auxiliares de lista de cuentas y acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de vinculación de mensajes directos | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Integración del prefijo de respuesta, la escritura y la entrega de origen | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración y funciones auxiliares de acceso a mensajes directos | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Solo las primitivas compartidas de esquemas de configuración de canales y el constructor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración incluidos | Solo plugins incluidos mantenidos por OpenClaw; los plugins nuevos deben definir esquemas locales del plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuración incluidos obsoletos | Solo alias de compatibilidad; usar `plugin-sdk/bundled-channel-config-schema` para los plugins incluidos que reciben mantenimiento |
  | `plugin-sdk/telegram-command-config` | Funciones auxiliares de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados y conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupos y mensajes directos | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Funciones auxiliares de sobres entrantes | Funciones auxiliares compartidas para construir rutas y sobres |
  | `plugin-sdk/channel-inbound` | Funciones auxiliares de recepción entrante | Construcción de contexto, formato, raíces, ejecutores, envío de respuestas preparadas y predicados de envío |
  | `plugin-sdk/messaging-targets` | Ruta de importación obsoleta para el análisis de destinos | Usar `plugin-sdk/channel-targets` para las funciones auxiliares genéricas de análisis de destinos, `plugin-sdk/channel-route` para la comparación de rutas y las funciones `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` propiedad del plugin para la resolución de destinos específica del proveedor |
  | `plugin-sdk/outbound-media` | Funciones auxiliares de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Funciones auxiliares del ciclo de vida de mensajes salientes | Adaptadores de mensajes, recibos, funciones auxiliares de envío duradero, funciones auxiliares de vista previa en directo y transmisión, opciones de respuesta, funciones auxiliares del ciclo de vida, identidad saliente y planificación de cargas útiles |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta | Usar `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Funciones auxiliares de vinculación de hilos | Funciones auxiliares del ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Funciones auxiliares heredadas de cargas útiles de medios | Constructor de cargas útiles de medios del agente para disposiciones de campos heredadas |
  | `plugin-sdk/channel-runtime` | Adaptador provisional de compatibilidad obsoleto | Solo utilidades heredadas del entorno de ejecución de canales |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Funciones auxiliares generales del entorno de ejecución | Funciones auxiliares del entorno de ejecución, registro, copias de seguridad e instalación de plugins |
  | `plugin-sdk/runtime-env` | Funciones auxiliares específicas del entorno del entorno de ejecución | Funciones auxiliares de registrador y entorno de ejecución, tiempo de espera, reintentos y espera exponencial |
  | `plugin-sdk/plugin-runtime` | Funciones auxiliares compartidas del entorno de ejecución de plugins | Funciones auxiliares de comandos, enlaces, HTTP e interacción de plugins |
  | `plugin-sdk/hook-runtime` | Funciones auxiliares de canalización de enlaces | Funciones auxiliares compartidas de canalización de Webhooks y enlaces internos |
  | `plugin-sdk/lazy-runtime` | Funciones auxiliares de carga diferida del entorno de ejecución | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Funciones auxiliares de procesos | Funciones auxiliares compartidas de ejecución |
  | `plugin-sdk/cli-runtime` | Funciones auxiliares del entorno de ejecución de la CLI | Formato de comandos, esperas y funciones auxiliares de versión |
  | `plugin-sdk/gateway-runtime` | Funciones auxiliares del Gateway | Cliente del Gateway, función auxiliar de inicio cuando el bucle de eventos está listo, resolución del host LAN anunciado y funciones auxiliares para parches del estado de canales |
  | `plugin-sdk/config-runtime` | Adaptador provisional obsoleto de compatibilidad de configuración | Se prefieren `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Funciones auxiliares de comandos de Telegram | Funciones auxiliares de validación de comandos de Telegram con respaldo estable cuando la superficie del contrato de Telegram incluido no está disponible |
  | `plugin-sdk/approval-runtime` | Funciones auxiliares de solicitudes de aprobación | Carga útil de aprobación de ejecución/plugins, funciones auxiliares de capacidad y perfil de aprobación, funciones auxiliares nativas de enrutamiento y entorno de ejecución de aprobaciones, y formato estructurado de rutas para mostrar aprobaciones |
  | `plugin-sdk/approval-auth-runtime` | Funciones auxiliares de autenticación de aprobaciones | Resolución de aprobadores, autorización de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Funciones auxiliares del cliente de aprobaciones | Funciones auxiliares nativas de perfil y filtro de aprobación de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Funciones auxiliares de entrega de aprobaciones | Adaptadores nativos de capacidad y entrega de aprobaciones |
  | `plugin-sdk/approval-gateway-runtime` | Funciones auxiliares de aprobación del Gateway | Resolutor compartido del Gateway de aprobaciones |
  | `plugin-sdk/approval-reference-runtime` | Referencias de transporte de aprobaciones | Función auxiliar determinista de localización duradera para devoluciones de llamada con limitaciones de transporte |
  | `plugin-sdk/approval-handler-adapter-runtime` | Funciones auxiliares del adaptador de aprobaciones | Funciones auxiliares ligeras de carga del adaptador nativo de aprobaciones para puntos de entrada activos de canales |
  | `plugin-sdk/approval-handler-runtime` | Funciones auxiliares del controlador de aprobaciones | Funciones auxiliares más amplias del entorno de ejecución del controlador de aprobaciones; se prefieren las interfaces más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Funciones auxiliares de destinos de aprobación | Funciones auxiliares nativas de vinculación de destinos y cuentas de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Funciones auxiliares de respuestas de aprobación | Funciones auxiliares de cargas útiles de respuesta de aprobación de ejecución/plugins |
  | `plugin-sdk/channel-runtime-context` | Funciones auxiliares del contexto de ejecución de canales | Funciones auxiliares genéricas para registrar, obtener y observar el contexto de ejecución de canales |
  | `plugin-sdk/security-runtime` | Funciones auxiliares de seguridad | Funciones auxiliares compartidas de confianza, control de mensajes directos, archivos/rutas limitados a la raíz, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Funciones auxiliares de políticas SSRF | Funciones auxiliares de listas de hosts permitidos y políticas de redes privadas |
  | `plugin-sdk/ssrf-runtime` | Funciones auxiliares del entorno de ejecución SSRF | Distribuidor fijado, obtención protegida y funciones auxiliares de políticas SSRF |
  | `plugin-sdk/system-event-runtime` | Funciones auxiliares de eventos del sistema | `enqueueSystemEvent` (incluida la sustitución por clave), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Funciones auxiliares de Heartbeat | Funciones auxiliares de activación, eventos y visibilidad de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Funciones auxiliares de la cola de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Funciones auxiliares de actividad de canales | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Funciones auxiliares de desduplicación | Cachés de desduplicación en memoria y con respaldo persistente |
  | `plugin-sdk/file-access-runtime` | Funciones auxiliares de acceso a archivos | Funciones auxiliares seguras para archivos locales y rutas de medios |
  | `plugin-sdk/transport-ready-runtime` | Funciones auxiliares de preparación del transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Funciones auxiliares de políticas de aprobación de ejecución | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Funciones auxiliares de cachés limitadas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Funciones auxiliares de control de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Funciones auxiliares de errores | `formatUncaughtError`, `isApprovalNotFoundError`, funciones auxiliares de grafos de errores, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Funciones auxiliares de obtención encapsulada y proxy | `resolveFetch`, funciones auxiliares de proxy, funciones auxiliares de opciones de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Funciones auxiliares de normalización de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Funciones auxiliares de reintentos | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de listas de permitidos y asignación de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Funciones auxiliares de control y superficie de comandos | `resolveControlCommandGate`, funciones auxiliares de autorización de remitentes, funciones auxiliares del registro de comandos, incluido el formato dinámico del menú de argumentos |
  | `plugin-sdk/command-status` | Representadores de estado y ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entradas de secretos | Funciones auxiliares de entradas de secretos |
  | `plugin-sdk/webhook-ingress` | Funciones auxiliares de solicitudes de Webhook | Utilidades de destinos de Webhook |
  | `plugin-sdk/webhook-request-guards` | Funciones auxiliares de protección del cuerpo de Webhooks | Funciones auxiliares de lectura y limitación del cuerpo de solicitudes |
  | `plugin-sdk/reply-runtime` | Entorno de ejecución compartido de respuestas | Envío entrante, Heartbeat, planificador de respuestas y fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Funciones auxiliares específicas para el envío de respuestas | Finalización, envío del proveedor y funciones auxiliares de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Funciones auxiliares del historial de respuestas | `createChannelHistoryWindow`; exportaciones obsoletas de compatibilidad de funciones auxiliares de mapas, como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuestas | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Funciones auxiliares de fragmentos de respuesta | Funciones auxiliares de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Funciones auxiliares del almacén de sesiones | Funciones auxiliares de filas de sesión con ámbito, funciones auxiliares de rutas del almacén y lecturas de la fecha de actualización |
  | `plugin-sdk/state-paths` | Funciones auxiliares de rutas de estado | Funciones auxiliares de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Funciones auxiliares de enrutamiento y claves de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, funciones auxiliares de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Funciones auxiliares de estado de canales | Constructores de resúmenes del estado de canales/cuentas, valores predeterminados del estado del entorno de ejecución y funciones auxiliares de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Funciones auxiliares de resolución de destinos | Funciones auxiliares compartidas de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Funciones auxiliares de normalización de cadenas | Funciones auxiliares de normalización de slugs/cadenas |
  | `plugin-sdk/request-url` | Funciones auxiliares de URL de solicitudes | Extracción de cadenas de URL a partir de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Funciones auxiliares de comandos temporizados | Ejecutor de comandos temporizados con salida estándar y salida de error normalizadas |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de cargas útiles de herramientas | Extracción de cargas útiles normalizadas a partir de objetos de resultados de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envíos de herramientas | Extracción de campos canónicos de destinos de envío a partir de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Funciones auxiliares de rutas temporales | Funciones auxiliares compartidas de rutas de descargas temporales |
  | `plugin-sdk/logging-core` | Funciones auxiliares de registro | Funciones auxiliares de registradores de subsistemas y ocultación |
  | `plugin-sdk/markdown-table-runtime` | Funciones auxiliares de tablas Markdown | Funciones auxiliares de modos de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de cargas útiles de respuesta |
  | `plugin-sdk/provider-setup` | Funciones auxiliares seleccionadas de configuración de proveedores locales o autoalojados | Funciones auxiliares de detección/configuración de proveedores autoalojados |
  | `plugin-sdk/self-hosted-provider-setup` | Funciones auxiliares específicas de configuración de proveedores autoalojados compatibles con OpenAI | Las mismas funciones auxiliares de detección/configuración de proveedores autoalojados |
  | `plugin-sdk/provider-auth-runtime` | Funciones auxiliares de autenticación del entorno de ejecución del proveedor | Funciones auxiliares de resolución de claves de API durante la ejecución |
  | `plugin-sdk/provider-auth-api-key` | Funciones auxiliares de configuración de claves de API del proveedor | Funciones auxiliares de incorporación mediante claves de API y escritura de perfiles |
  | `plugin-sdk/provider-auth-result` | Funciones auxiliares de resultados de autenticación del proveedor | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-selection-runtime` | Funciones auxiliares de selección de proveedores | Selección de proveedores configurados o automáticos y combinación de la configuración sin procesar de proveedores |
  | `plugin-sdk/provider-env-vars` | Funciones auxiliares de variables de entorno del proveedor | Funciones auxiliares de búsqueda de variables de entorno de autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelos/reproducción de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedores y ayudantes de normalización de identificadores de modelos |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos del catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedores | Ayudantes genéricos de capacidades HTTP/endpoints de proveedores, incluidos los ayudantes de formularios multiparte para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de obtención web de proveedores | Ayudantes de registro/caché de proveedores de obtención web |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de búsqueda web de proveedores | Ayudantes específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan integración para habilitar plugins |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contratos de búsqueda web de proveedores | Ayudantes específicos de contratos de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores/obtenedores de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de búsqueda web de proveedores | Ayudantes de registro/caché/entorno de ejecución de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza de esquemas + diagnósticos de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, y otros ayudantes de uso de proveedores |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de flujos de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos y ayudantes compartidos de envoltorios de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedores | Ayudantes de transporte nativos de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de contenido multimedia | Ayudantes de obtención/transformación/almacenamiento de contenido multimedia, sondeo de dimensiones de vídeo mediante ffprobe y constructores de cargas útiles multimedia |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación multimedia | Ayudantes compartidos de conmutación por error, selección de candidatos y mensajes de modelo ausente para la generación de imágenes/vídeos/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión multimedia | Tipos de proveedores de comprensión multimedia y exportaciones de ayudantes de imagen/audio orientados a proveedores |
  | `plugin-sdk/text-runtime` | Exportación amplia obsoleta de compatibilidad de texto | Use `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` y `logging-core` |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudantes de fragmentación de texto saliente y de rangos que conservan los desplazamientos |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedores de voz, ayudantes de directivas, registro y validación orientados a proveedores, y constructor de TTS compatible con OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas y normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedores, ayudantes de registro y ayudante compartido de sesiones WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedores, ayudantes de registro/resolución, ayudantes de sesiones puente, colas compartidas de respuesta oral del agente, control por voz de ejecuciones activas, estado de transcripciones/eventos, supresión de eco, correspondencia de preguntas de consulta, coordinación de consultas forzadas, seguimiento del contexto de turno, seguimiento de la actividad de salida y ayudantes de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Ayudantes de generación de imágenes | Tipos de proveedores de generación de imágenes, ayudantes de recursos de imagen/URL de datos y constructor de proveedores de imágenes compatible con OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes y ayudantes de conmutación por error, autenticación y registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedores/solicitudes/resultados de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/video-generation` | Ayudantes de generación de vídeo | Tipos de proveedores/solicitudes/resultados de generación de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de vídeo | Tipos de generación de vídeo, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuestas interactivas | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canales | Primitivas específicas de esquemas de configuración de canales |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canales | Ayudantes de autorización para la escritura de configuración de canales |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canales | Exportaciones compartidas del preludio de plugins de canales |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canales | Ayudantes compartidos de instantáneas/resúmenes del estado de canales |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de listas de permitidos | Ayudantes de edición/lectura de la configuración de listas de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso a grupos | Ayudantes compartidos de decisiones de acceso a grupos |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas | Use `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Ayudantes de protección de mensajes directos | Ayudantes específicos de políticas de protección previas al cifrado |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensiones | Primitivas de ayudantes para canales pasivos/estado y proxies de entorno |
  | `plugin-sdk/webhook-targets` | Ayudantes de destinos de Webhook | Ayudantes de registro de destinos e instalación de rutas de Webhook |
  | `plugin-sdk/webhook-path` | Alias obsoleto de ruta de Webhook | Use `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Ayudantes compartidos de contenido multimedia web | Ayudantes de carga de contenido multimedia remoto/local |
  | `plugin-sdk/zod` | Reexportación obsoleta de compatibilidad con Zod | Importe `zod` directamente desde `zod` |
  | `plugin-sdk/memory-core` | Ayudantes incluidos de memory-core | Superficie de ayudantes de gestor/configuración/archivos/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada del entorno de ejecución del motor de memoria | Fachada del entorno de ejecución de indexación/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de incrustaciones de memoria | Ayudantes ligeros del registro de proveedores de incrustaciones de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de incrustaciones del host de memoria | Contratos de incrustaciones de memoria, acceso al registro, proveedor local y ayudantes genéricos por lotes/remotos; los proveedores remotos concretos residen en los plugins que los poseen |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria | Ayudantes multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consultas del host de memoria | Ayudantes de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria | Ayudantes de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memoria | Use `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria | Ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Entorno de ejecución de CLI del host de memoria | Ayudantes del entorno de ejecución de CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Entorno de ejecución central del host de memoria | Ayudantes del entorno de ejecución central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/entorno de ejecución del host de memoria | Ayudantes de archivos/entorno de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del entorno de ejecución central del host de memoria | Alias independiente del proveedor para los ayudantes del entorno de ejecución central del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias independiente del proveedor para los ayudantes del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de archivos/entorno de ejecución de memoria | Use `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de Markdown gestionado | Ayudantes compartidos de Markdown gestionado para plugins relacionados con la memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida del entorno de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de estado del host de memoria | Use `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilidades de prueba | Módulo de exportación local del repositorio para compatibilidad obsoleta; use subrutas de prueba específicas locales del repositorio, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` y `plugin-sdk/test-fixtures` |
</Accordion>

  Esta tabla es el subconjunto común de migración, no toda la superficie del SDK. El
  inventario de puntos de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`;
  las exportaciones de paquetes se generan a partir del subconjunto público.

  Las interfaces auxiliares reservadas para plugins incluidos se han retirado del mapa
  de exportaciones del SDK público, salvo las fachadas de compatibilidad documentadas
  explícitamente, como el shim obsoleto `plugin-sdk/discord`, que se conserva para los
  plugins externos que todavía importan directamente el paquete publicado
  `@openclaw/discord`. Los auxiliares específicos de cada propietario se encuentran
  dentro del paquete del plugin correspondiente; el comportamiento compartido del host
  se canaliza mediante contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

  Utilice la importación más específica que corresponda a la tarea. Si no encuentra una
  exportación, consulte el código fuente en `src/plugin-sdk/` o pregunte a los
  responsables qué contrato genérico debe hacerse cargo de ella.

  ## Obsolescencias activas

  Obsolescencias más específicas en el SDK de plugins, el contrato de proveedores, la
  superficie de ejecución y el manifiesto. Todas siguen funcionando actualmente, pero
  se eliminarán en una futura versión principal. Cada entrada asigna la API antigua a
  su reemplazo canónico.

  <AccordionGroup>
  <Accordion title="Generadores de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas y las mismas
    exportaciones; solo se importan desde la subruta más específica. `command-auth`
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

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; un único objeto de
    decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio de Slack
    no utiliza este auxiliar.

  </Accordion>

  <Accordion title="Shim de ejecución de canales y auxiliares de acciones de canales">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para plugins de
    canales antiguos. No lo importe en código nuevo; utilice
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    ejecución.

    Los auxiliares `channelActions*` de `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones sin procesar de «actions» de los canales.
    Exponga las capacidades mediante la superficie semántica
    `presentation`; los plugins de canales declaran qué representan
    (tarjetas, botones, selectores), en lugar de qué nombres de acciones sin procesar
    aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implemente `createTool(...)` directamente en el plugin del proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el envoltorio de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal de texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el
    campo `channelEnvelope` de los objetos de mensajes entrantes) para crear un
    sobre de prompt plano en texto sin formato a partir de mensajes de canal entrantes.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto del usuario. Los
    plugins de canales adjuntan metadatos de enrutamiento (hilo, tema, respuesta a,
    reacciones) como campos tipados, en lugar de concatenarlos en una cadena de prompt. El
    auxiliar `formatAgentEnvelope(...)` sigue siendo compatible con los sobres sintetizados
    dirigidos al asistente, pero los sobres entrantes de texto sin formato están en proceso
    de eliminación.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que posprocesara el texto del sobre antiguo.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El mismo contrato de limpieza
    durante el apagado; solo cambia el nombre del hook.

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

    `deactivate` permanece conectado como alias de compatibilidad obsoleto hasta que se
    elimine después de 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)`, que devuelve
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permita que el núcleo prepare las vinculaciones de subagentes
    `thread: true` mediante el adaptador de vinculación de sesiones del
    canal. Utilice `api.on("subagent_spawned", handler)` únicamente para la
    observación posterior al inicio.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` se mantienen únicamente como
    superficies de compatibilidad obsoletas mientras migran los plugins externos; se
    eliminarán después de 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedores -> tipos de catálogo de proveedores">
    Cuatro alias de tipos de descubrimiento son ahora envoltorios ligeros de los tipos
    de la era del catálogo:

    | Alias anterior             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además de la bolsa estática heredada `ProviderCapabilities`; los plugins de
    proveedores deben utilizar hooks explícitos del proveedor, como
    `buildReplayPolicy`, `normalizeToolSchemas` y `wrapStreamFn`, en lugar de
    un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un
    `label` opcional y una lista de niveles clasificada. OpenClaw
    reduce automáticamente los valores almacenados obsoletos según la clasificación
    del perfil.

    El contexto incluye `provider`, `modelId`, un
    `reasoning` combinado opcional y datos combinados opcionales del modelo
    `compat`. Los plugins de proveedores pueden utilizar esos datos del
    catálogo para exponer un perfil específico del modelo solo cuando el contrato de
    solicitud configurado lo admita.

    Implemente un hook en lugar de tres. Los hooks heredados continúan funcionando
    durante el periodo de obsolescencia, pero no se combinan con el resultado del perfil.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: implementar hooks de autenticación externa sin declarar el proveedor
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

  <Accordion title="Consulta de variables de entorno del proveedor -> setup.providers[].envVars">
    Campo de manifiesto **anterior**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: reproduzca la misma consulta de variables de entorno en
    `setup.providers[].envVars` dentro del manifiesto. Esto consolida los metadatos de
    entorno de configuración y estado en un solo lugar y evita iniciar la ejecución
    del plugin únicamente para responder consultas de variables de entorno.

    `providerAuthEnvVars` continúa siendo compatible mediante un adaptador de
    compatibilidad hasta que finalice el periodo de obsolescencia.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas separadas: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Las mismas ranuras, una única llamada de registro. Los auxiliares aditivos de prompt
    y corpus (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no
    se ven afectados.

  </Accordion>

  <Accordion title="API del proveedor de incrustaciones de memoria">
    **Anterior**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico del proveedor de incrustaciones puede reutilizarse fuera de la
    memoria y es la vía compatible para los proveedores nuevos. La API de registro
    específica de memoria permanece conectada como compatibilidad obsoleta mientras
    migran los proveedores existentes. La inspección de plugins informa del uso no
    incluido como deuda de compatibilidad.

  </Accordion>

  <Accordion title="Resultados de envío de canal sin procesar -> OutboundDeliveryResult">
    **Anterior**: devolver `{ ok, messageId, error }` mediante
    `ChannelSendRawResult` y normalizarlo con
    `createRawChannelSendResultAdapter(...)`.

    **Nuevo**: devuelva los campos de `OutboundDeliveryResult` y adjunte el canal con
    `createAttachedChannelResultAdapter(...)`. Los envíos fallidos deben generar una excepción
    en lugar de devolver una cadena de error. El tipo de resultado sin procesar seguirá
    disponible hasta la próxima versión principal del SDK de plugins.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagentes renombrados">
    Dos alias de tipos heredados que aún se exportan desde `src/plugins/runtime/types.ts`:

    | Anterior                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La misma firma; el método antiguo delega en el
    nuevo.

  </Accordion>

  <Accordion title="API eliminadas de archivos de sesiones y transcripciones">
    La migración de sesiones y transcripciones a SQLite elimina o deja obsoletas las API
    dirigidas a plugins que exponían almacenes `sessions.json` activos, rutas de
    transcripciones JSONL o listas de archivos de sesiones. Los plugins de ejecución
    deben utilizar la identidad de sesión y los auxiliares de ejecución del SDK en lugar
    de resolver o modificar archivos activos.

    | Superficie en migración | Reemplazo |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` y mutaciones de sesión a nivel de fila. |
    | `resolveSessionFilePath(...)` obsoleto | Identidad de sesión (`sessionKey`, `sessionId` y auxiliares de destino de ejecución del SDK), además de métodos de Gateway que operan sobre la sesión actual. |
    | `saveSessionStore(...)` eliminado | API de ejecución de sesiones gestionadas por Gateway; el código del plugin debe solicitar o modificar el estado de la sesión mediante auxiliares documentados de ejecución o contexto, en lugar de escribir en el archivo del almacén activo. |
    | `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` eliminados | Identidad de sesión y métodos de Gateway que operan sobre la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lectores de transcripciones respaldados por identidad expuestos por el contexto de ejecución actual, o métodos de historial o sesión de Gateway cuando el plugin está fuera de la ruta del propietario de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria como `sessionFiles` | Fuentes de transcripciones o sesiones respaldadas por identidad que proporciona el host; no rastree archivos JSONL activos para sesiones en vivo. |
    | Opciones de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos de `sessionTarget` o de destino de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos heredados de transcripciones JSONL siguen siendo válidos como
    artefactos de importación, archivo, exportación y soporte. Ya no constituyen el
    contrato de ejecución estable para las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    auxiliares obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime` mantiene
    exactamente ese puente hasta 2026-10-12; los plugins nuevos deben usar los reemplazos.
    `resolveStorePath(...)` sigue siendo un auxiliar compatible del SDK y no forma parte de
    esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de los plugins no incluidos
    cuyos errores de carga o diagnósticos aún hacen referencia a estas API de archivos eliminadas. El
    barrido de avisos `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o
    una posterior para que los análisis de paquetes externos también marquen los auxiliares de sesión
    de todo el almacén, los auxiliares de rutas de archivos de sesión, los destinos de archivos de transcripciones
    heredados y los auxiliares de transcripciones de bajo nivel antes del lanzamiento.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor de acceso
    activo al flujo de tareas.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el entorno de ejecución de mutación
    administrada de TaskFlow para los plugins que crean, actualizan, cancelan o ejecutan tareas secundarias desde un
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

  <Accordion title="Factorías de extensiones integradas -> middleware de resultados de herramientas del agente">
    Se explica en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    completar la información: la ruta eliminada exclusiva del ejecutor integrado
    `api.registerEmbeddedExtensionFactory(...)` se sustituye por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de entornos de ejecución
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType`, reexportado desde `openclaw/plugin-sdk`, ahora es un
    alias de una línea para `OpenClawConfig`. Se recomienda usar el nombre canónico.

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
`extensions/`) se registran en sus propios módulos de exportación `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si se utiliza directamente el módulo de exportación local de un plugin incluido, deben leerse los
comentarios sobre obsolescencia de ese módulo antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador comparte un único controlador
de sesiones de Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador gestiona el contenedor común de eventos de Talk, el estado del turno activo, el estado de captura,
el estado del audio de salida, el historial de eventos recientes y el rechazo de turnos obsoletos.
Los plugins de proveedores gestionan las sesiones en tiempo real específicas de cada proveedor; los plugins de
superficie gestionan las particularidades de la captura, la reproducción, la telefonía y las reuniones.

Todas las superficies incluidas se ejecutan en el controlador compartido: retransmisión del navegador,
transferencia a salas administradas, llamadas de voz en tiempo real, STT en streaming para llamadas de voz, Google
Meet en tiempo real y pulsar para hablar nativo. Gateway anuncia un único canal activo de eventos de Talk
en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)`, salvo que
implemente un adaptador de bajo nivel o un accesorio de prueba. Use el controlador compartido para que
no puedan emitirse eventos delimitados por turno sin un identificador de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del ciclo de vida
del audio de salida sean coherentes entre telefonía, reuniones, retransmisión del navegador,
transferencia a salas administradas y clientes nativos de Talk.

La forma de la API pública:

```typescript
// API de sesión de Talk gestionada por Gateway.
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

Las sesiones WebRTC/websocket del proveedor gestionadas por el navegador usan `talk.client.create`,
porque el navegador gestiona la negociación con el proveedor y el transporte multimedia, mientras que
Gateway gestiona las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común administrada por Gateway para tiempo real mediante retransmisión de Gateway,
transcripción mediante retransmisión de Gateway y sesiones nativas de STT/TTS en salas administradas.

Las configuraciones heredadas que sitúan selectores de tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en tiempo de ejecución
no reinterpreta la configuración del proveedor de voz/TTS como configuración del proveedor en tiempo real.

Las combinaciones compatibles de `talk.session.create` son intencionadamente limitadas:

| Modo            | Transporte       | Cerebro           | Responsable              | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio bidireccional completo del proveedor transmitido mediante Gateway; las llamadas a herramientas se encaminan mediante la herramienta de consulta del agente.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los invocadores envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/del cliente | Salas de pulsar para hablar y estilo walkie-talkie en las que el cliente gestiona la captura/reproducción y Gateway gestiona el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/del cliente | Modo de sala exclusivo para administradores destinado a superficies propias de confianza que ejecutan directamente acciones de herramientas de Gateway.                  |

Mapa de métodos para quienes migren desde las familias anteriores `talk.realtime.*` /
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

| Método                          | Se aplica a                                              | Contrato                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión del proveedor gestionada por la misma conexión de Gateway.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario en una sala administrada.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar que no esté obsoleto.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | todas las sesiones gestionadas por Gateway                              | Cancela el trabajo activo de captura/proveedor/agente/TTS de un turno.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a una herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pase `options.willContinue` para una salida provisional o, cuando sea compatible, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones de Talk respaldadas por agentes                              | Envía un control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión de Talk.                                                                                                 |
| `talk.session.close`            | todas las sesiones unificadas                                    | Detiene las sesiones de retransmisión o revoca el estado de la sala administrada y, a continuación, olvida el identificador de sesión unificado.                                                                                                                                     |

No introduzca casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo gestiona la semántica de las sesiones de Talk. Los plugins de proveedores gestionan la configuración
de sesiones de cada proveedor. Las llamadas de voz y Google Meet gestionan los adaptadores de telefonía/reuniones.
El navegador y las aplicaciones nativas gestionan la experiencia de usuario de captura/reproducción del dispositivo.

## Cronología de eliminación

| Cuándo                                        | Qué sucede                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Ahora**                                     | Las superficies obsoletas emiten advertencias en tiempo de ejecución.                                                               |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica puede eliminarse; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace que la CI falle una vez pasada la fecha. |
| **Próxima versión principal**                 | Se eliminan todas las superficies que aún no se hayan migrado; los plugins que todavía las usen fallarán.                            |

Todos los plugins principales ya se han migrado. Los plugins externos deben migrarse
antes de la próxima versión principal. Ejecute `pnpm plugins:boundary-report` para consultar qué
registros de compatibilidad vencerán antes para las superficies que utiliza su plugin.

## Suprimir temporalmente las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Contenido relacionado

- [Primeros pasos](/es/plugins/building-plugins) - cree su primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
