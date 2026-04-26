---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Estás actualizando un Plugin a la arquitectura moderna de Plugin
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad hacia atrás al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ha pasado de una capa amplia de compatibilidad hacia atrás a una arquitectura moderna de Plugin
con importaciones enfocadas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El antiguo sistema de Plugins proporcionaba dos superficies muy abiertas que permitían a los Plugins importar
cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una sola importación que reexportaba decenas de
  helpers. Se introdujo para mantener funcionando Plugins antiguos basados en hooks mientras se construía la
  nueva arquitectura de Plugin.
- **`openclaw/extension-api`** — un puente que daba a los Plugins acceso directo a
  helpers del lado del host, como el ejecutor de agente integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook eliminado de extensión incluida
  solo para Pi que podía observar eventos del ejecutor integrado como
  `tool_result`.

Las superficies amplias de importación ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución,
pero los Plugins nuevos no deben usarlas y los Plugins existentes deben migrar antes de que la siguiente versión principal las elimine. La API de registro del factory de extensión integrada
solo para Pi ha sido eliminada; usa en su lugar middleware de resultado de herramienta.

OpenClaw no elimina ni reinterpreta comportamiento documentado de Plugins en el mismo
cambio que introduce un reemplazo. Los cambios de contrato incompatibles deben pasar primero
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Esto se aplica a importaciones del SDK, campos del manifiesto, APIs de configuración, hooks y comportamiento de registro en tiempo de ejecución.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una futura versión principal.
  Los Plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
  Los registros del factory de extensión integrada solo para Pi ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Arranque lento** — importar un helper cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables frente a internas

El SDK moderno de Plugin corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También desaparecieron las interfaces heredadas de conveniencia para proveedores de canales incluidos. Importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
interfaces de helpers con marca de canal y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables de Plugins. Usa en su lugar subrutas estrechas y genéricas del SDK. Dentro del
espacio de trabajo del Plugin incluido, mantén los helpers propiedad del proveedor en el propio
`api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores incluidos:

- Anthropic mantiene helpers específicos de flujos Claude en su propia interfaz `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builders de proveedor, helpers de modelo predeterminado y builders
  de proveedor realtime en su propio `api.ts`
- OpenRouter mantiene el builder del proveedor y los helpers de configuración/incorporación en su
  propio `api.ts`

## Política de compatibilidad

Para Plugins externos, el trabajo de compatibilidad sigue este orden:

1. agregar el nuevo contrato
2. mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la obsolescencia y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión principal

Si un campo del manifiesto sigue siendo aceptado, quienes desarrollan Plugins pueden seguir usándolo hasta
que la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el
reemplazo documentado, pero los Plugins existentes no deben romperse durante lanzamientos menores ordinarios.

## Cómo migrar

<Steps>
  <Step title="Migrar extensiones Pi de resultado de herramienta a middleware">
    Los Plugins incluidos deben reemplazar los manejadores de resultados de herramienta
    solo para Pi de `api.registerEmbeddedExtensionFactory(...)` por
    middleware neutro al tiempo de ejecución.

    ```typescript
    // Herramientas dinámicas de tiempo de ejecución Pi y Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Actualiza también el manifiesto del Plugin al mismo tiempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Los Plugins externos no pueden registrar middleware de resultados de herramienta porque puede
    reescribir salidas de herramientas de alta confianza antes de que el modelo las vea.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a hechos de capacidad">
    Los Plugins de canal con capacidad de aprobación ahora exponen comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público del Plugin de canal;
      mueve los campos de entrega/nativo/renderizado a `approvalCapability`
    - `plugin.auth` sigue siendo para flujos de inicio/cierre de sesión del canal únicamente; los hooks
      de autenticación de aprobación allí ya no son leídos por el núcleo
    - Registra objetos de tiempo de ejecución propiedad del canal, como clientes, tokens o apps
      Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde manejadores nativos de aprobación;
      el núcleo ahora se encarga de los avisos de enrutado a otro sitio a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de la
    capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de respaldo del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers no resueltos de Windows
    `.cmd`/`.bat` ahora fallan de forma cerrada salvo que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para quienes llaman por compatibilidad de confianza que
      // aceptan intencionalmente el respaldo mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si quien llama no depende intencionalmente del respaldo por shell, no establezcas
    `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de estas superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones enfocadas">
    Cada exportación de la superficie antigua corresponde a una ruta específica de importación moderna:

    ```typescript
    // Antes (capa obsoleta de compatibilidad hacia atrás)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas y enfocadas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers del lado del host, usa el tiempo de ejecución del Plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (tiempo de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros helpers heredados del puente:

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
  | `plugin-sdk/plugin-entry` | Helper canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y builders enfocados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Prompts de lista de permitidos, builders de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de tiempo de ejecución para configuración | Adaptadores de parches de configuración seguros para importación, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de varias cuentas | Helpers de lista/configuración/compuerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Helpers de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuenta + respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Helpers acotados de cuenta | Helpers de lista de cuenta/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factorías de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de esquema de configuración | Primitivas compartidas de esquema de configuración de canal; las exportaciones de esquema con nombre de canal incluido son solo compatibilidad heredada |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombre de comando, recorte de descripción, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de ciclo de vida de estado de cuenta y flujo de borradores | `createAccountStatusSink`, helpers de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Helpers de sobre entrante | Helpers compartidos de construcción de ruta + sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de respuesta entrante | Helpers compartidos de registrar y despachar |
  | `plugin-sdk/messaging-targets` | Análisis de objetivos de mensajería | Helpers de análisis/coincidencia de objetivos |
  | `plugin-sdk/outbound-media` | Helpers de contenido multimedia saliente | Carga compartida de contenido multimedia saliente |
  | `plugin-sdk/outbound-send-deps` | Helpers de dependencias de envío saliente | Búsqueda ligera `resolveOutboundSendDep` sin importar todo el tiempo de ejecución saliente |
  | `plugin-sdk/outbound-runtime` | Helpers de tiempo de ejecución saliente | Helpers de entrega saliente, delegado de identidad/envío, sesión, formato y planificación de carga útil |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vinculaciones de hilos | Helpers de ciclo de vida y adaptadores de vinculaciones de hilos |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de carga útil multimedia | Builder de carga útil multimedia del agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Shim obsoleto de compatibilidad | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución | Helpers de tiempo de ejecución/registro/copia de seguridad/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Helpers acotados de entorno de tiempo de ejecución | Helpers de logger/entorno de tiempo de ejecución, timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de tiempo de ejecución de Plugin | Helpers de comandos/hooks/http/interactivo de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de canalización de hooks | Helpers compartidos de canalización de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de tiempo de ejecución perezoso | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de proceso | Helpers compartidos de exec |
  | `plugin-sdk/cli-runtime` | Helpers de tiempo de ejecución de CLI | Helpers de formato de comandos, esperas y versión |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Helpers de cliente de Gateway y parcheo de estado de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuración | Helpers de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers estables de respaldo para validación de comandos de Telegram cuando la superficie del contrato incluido de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts de aprobación | Carga útil de aprobación exec/Plugin, helpers de capacidad/perfil de aprobación, helpers nativos de enrutamiento/tiempo de ejecución de aprobación y formato estructurado de la ruta de visualización de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución del aprobador, autenticación de acción en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers nativos de perfil/filtro de aprobación exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprobación | Helper compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprobación | Helpers ligeros de carga de adaptadores nativos de aprobación para entrypoints calientes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de manejador de aprobación | Helpers más amplios de tiempo de ejecución del manejador de aprobación; prefiere las interfaces más acotadas de adaptador/gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de objetivos de aprobación | Helpers nativos de vinculación de objetivo/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de carga útil de respuesta de aprobación exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de tiempo de ejecución de canal | Helpers genéricos de registrar/obtener/observar contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, filtrado DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de permitidos de host y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de tiempo de ejecución SSRF | Helpers de despachador fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de compuerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envueltos | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalización del host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Compuertas de comandos y helpers de superficie de comandos | `resolveControlCommandGate`, helpers de autorización del remitente, helpers de registro de comandos incluyendo formato dinámico del menú de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada secreta | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitudes Webhook | Utilidades de objetivo de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protección de cuerpo de Webhook | Helpers de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuesta, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho de respuesta | Finalización, despacho de proveedor y helpers de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Helpers de historial de respuesta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentación de respuesta | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesión | Helpers de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Builders de resumen de estado de canal/cuenta, valores predeterminados de estado en tiempo de ejecución, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de objetivos | Helpers compartidos de resolución de objetivos |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URLs en cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extrae cargas útiles normalizadas de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extrae campos canónicos de objetivo de envío desde args de herramienta |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Helpers de registro | Helpers de logger de subsistema y redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas markdown | Helpers de modo de tabla markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuración de proveedores locales/alojados por cuenta propia | Helpers de descubrimiento/configuración de proveedores autoalojados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autoalojados compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores autoalojados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de proveedor en tiempo de ejecución | Helpers de resolución de clave API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de clave API de proveedor | Helpers de incorporación/escritura de perfil para clave API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticación de proveedor | Builder estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de inicio de sesión interactivo de proveedor | Helpers compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedor | Selección de proveedor configurado o automático y fusión de configuración sin procesar del proveedor |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno del proveedor | Helpers de búsqueda de variables de entorno para autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelo/repetición del proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartidos de política de repetición, helpers de endpoint del proveedor y helpers de normalización de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo del proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación del proveedor | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP del proveedor | Helpers genéricos de HTTP/capacidad de endpoint del proveedor, incluidos helpers de formulario multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch del proveedor | Helpers de registro/caché del proveedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de web-search del proveedor | Helpers acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search del proveedor | Helpers acotados de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters acotados de credenciales |
  | `plugin-sdk/provider-web-search` | Helpers de web-search del proveedor | Helpers de registro/caché/tiempo de ejecución del proveedor de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquema del proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso del proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso del proveedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream del proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream y helpers compartidos de wrapper para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte del proveedor | Helpers nativos de transporte del proveedor, como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers multimedia compartidos | Helpers de obtención/transformación/almacenamiento multimedia más builders de carga útil multimedia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación multimedia | Helpers compartidos de failover, selección de candidatos y mensajes de modelo faltante para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión multimedia | Tipos de proveedor de comprensión multimedia más exportaciones de helpers de imagen/audio orientadas al proveedor |
  | `plugin-sdk/text-runtime` | Helpers de texto compartidos | Eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas markdown, helpers de redacción, helpers de etiquetas de directiva, utilidades de texto seguro y helpers relacionados de texto/registro |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedor de voz más helpers orientados al proveedor para directivas, registro y validación |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción realtime | Tipos de proveedor, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz realtime | Tipos de proveedor, helpers de registro/resolución y helpers de sesión bridge |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, failover, autenticación y helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de failover, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de failover, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción de carga útil de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas acotadas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista de permitidos | Helpers de lectura/edición de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso de grupo | Helpers compartidos de decisión de acceso de grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM directo | Helpers compartidos de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensión | Primitivas de helper para canal/estado pasivo y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de objetivos de Webhook | Registro de objetivos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Helpers de rutas de Webhook | Helpers de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Helpers multimedia web compartidos | Helpers de carga multimedia remota/local |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers incluidos de memory-core | Superficie de helpers de memory manager/config/archivo/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada del tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de index/search de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos de lotes/remotos; los proveedores remotos concretos viven en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria | Helpers de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria | Helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Helpers de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución core del host de memoria | Helpers de tiempo de ejecución core del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/tiempo de ejecución del host de memoria | Helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de tiempo de ejecución core del host de memoria | Alias neutral respecto al proveedor para helpers de tiempo de ejecución core del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos del host de memoria | Alias neutral respecto al proveedor para helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown administrado | Helpers compartidos de markdown administrado para Plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de memoria activa | Fachada de tiempo de ejecución perezoso del administrador de búsqueda de memoria activa |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Helpers incluidos de memory-lancedb | Superficie de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Helpers de prueba y mocks |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 entrypoints vive en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas interfaces helper de Plugins incluidos como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de Plugins incluidos, pero se omiten intencionalmente de la tabla común de migración y no son el destino recomendado para
código nuevo de Plugins.

La misma regla se aplica a otras familias de helpers incluidos como:

- helpers de soporte del navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de helper/Plugin incluidos como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`
  y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` actualmente expone la superficie acotada de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más acotada que coincida con el trabajo. Si no encuentras una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Obsolescencias activas

Obsolescencias más acotadas que se aplican en todo el SDK de Plugin, el contrato del proveedor,
la superficie de tiempo de ejecución y el manifiesto. Todas siguen funcionando hoy, pero se eliminarán
en una futura versión principal. La entrada bajo cada elemento asigna la API antigua a su
reemplazo canónico.

<AccordionGroup>
  <Accordion title="builders de ayuda command-auth → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones; simplemente importadas desde la subruta más acotada. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Después
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers de filtrado por mención → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })` — devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los Plugins de canal descendentes (Slack, Discord, Matrix, Microsoft Teams) ya
    cambiaron.

  </Accordion>

  <Accordion title="Shim de tiempo de ejecución de canal y helpers de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para Plugins
    de canal antiguos. No lo importes en código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos
    de tiempo de ejecución.

    Los helpers `channelActions*` en `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones sin procesar de canal de "actions". Expón
    capacidades mediante la superficie semántica `presentation` en su lugar: los
    Plugins de canal declaran lo que renderizan (tarjetas, botones, selects) en lugar
    de qué nombres de acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Helper tool() de proveedor de búsqueda web → createTool() en el Plugin">
    **Antiguo**: factoría `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementar `createTool(...)` directamente en el Plugin del proveedor.
    OpenClaw ya no necesita el helper del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal en texto sin formato → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre de prompt
    plano en texto sin formato a partir de mensajes de canal entrantes.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario.
    Los Plugins de canal adjuntan metadatos de enrutamiento (hilo, tema, reply-to, reacciones) como
    campos tipados en lugar de concatenarlos en una cadena de prompt. El
    helper `formatAgentEnvelope(...)` sigue siendo compatible para sobres
    sintetizados orientados al asistente, pero los sobres entrantes en texto plano están desapareciendo.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier Plugin
    de canal personalizado que posprocese texto `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedor → tipos de catálogo de proveedor">
    Cuatro alias de tipos de descubrimiento ahora son wrappers ligeros sobre los
    tipos de la era del catálogo:

    | Alias antiguo             | Tipo nuevo               |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Además de la bolsa estática heredada `ProviderCapabilities`: los Plugins
    de proveedor deben adjuntar hechos de capacidad mediante el contrato de tiempo de ejecución del proveedor
    en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de thinking → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y
    lista clasificada de niveles. OpenClaw degrada automáticamente los valores almacenados obsoletos según el rango del perfil.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando durante
    la ventana de obsolescencia, pero no se componen con el resultado del perfil.

  </Accordion>

  <Accordion title="Respaldo de proveedor OAuth externo → contracts.externalAuthProviders">
    **Antiguo**: implementar `resolveExternalOAuthProfiles(...)` sin
    declarar el proveedor en el manifiesto del Plugin.

    **Nuevo**: declarar `contracts.externalAuthProviders` en el manifiesto del Plugin
    **y** implementar `resolveExternalAuthProfiles(...)`. La antigua ruta de
    "auth fallback" emite una advertencia en tiempo de ejecución y será eliminada.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno del proveedor → setup.providers[].envVars">
    **Campo antiguo del manifiesto**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    del manifiesto. Esto consolida en un único lugar los metadatos de entorno de setup/status
    y evita iniciar el tiempo de ejecución del Plugin solo para responder búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
    hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="Registro de Plugin de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos slots, una sola llamada de registro. Los helpers aditivos de memoria
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) no se ven afectados.

  </Accordion>

  <Accordion title="Se renombraron tipos de mensajes de sesión de subagente">
    Dos alias heredados de tipos siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                          |
    | ---------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    El método de tiempo de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un descriptor live de TaskFlow.

    **Nuevo**: `runtime.tasks.flows` (plural) devuelve acceso DTO a TaskFlow,
    que es seguro para importación y no requiere cargar todo el tiempo de ejecución de tareas.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow(ctx);
    // Después
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factories de extensiones integradas → middleware de resultado de herramienta del agente">
    Cubierto arriba en "Cómo migrar → Migrar extensiones Pi de resultado de herramienta a
    middleware". Se incluye aquí por completitud: la ruta eliminada
    `api.registerEmbeddedExtensionFactory(...)` solo para Pi se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de tiempos de ejecución
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado desde `openclaw/plugin-sdk` es ahora un
    alias de una línea para `OpenClawConfig`. Prefiere el nombre canónico.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Después
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias a nivel de extensión (dentro de los Plugins incluidos de canal/proveedor bajo
`extensions/`) se rastrean dentro de sus propios barrels `api.ts` y `runtime-api.ts`.
No afectan a contratos de Plugins de terceros y no se enumeran
aquí. Si consumes directamente el barrel local de un Plugin incluido, lee los
comentarios de obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                 | Qué ocurre                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución  |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los Plugins que aún las usen fallarán |

Todos los Plugins principales ya se migraron. Los Plugins externos deben migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer Plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — crear Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crear Plugins de proveedor
- [Detalles internos de Plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
