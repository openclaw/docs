---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste `api.registerEmbeddedExtensionFactory` antes de OpenClaw 2026.4.25
    - Estás actualizando un Plugin a la arquitectura moderna de Plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ha pasado de una amplia capa de compatibilidad con versiones anteriores a una arquitectura moderna de Plugins
con importaciones focalizadas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema antiguo de Plugins proporcionaba dos superficies muy abiertas que permitían a los Plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una sola importación que reexportaba decenas de
  utilidades. Se introdujo para mantener funcionando Plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de Plugins.
- **`openclaw/extension-api`** — un puente que daba a los Plugins acceso directo a
  utilidades del lado del host, como el runner de agentes integrados.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook eliminado de extensiones incluidas exclusivo de Pi
  que podía observar eventos del runner integrado como
  `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución,
pero los Plugins nuevos no deben usarlas, y los Plugins existentes deberían migrar antes de que la próxima versión principal las elimine. La API de registro
de factorías de extensiones integradas exclusiva de Pi ha sido eliminada; usa middleware de resultados de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta comportamiento documentado de Plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato primero deben pasar
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de deprecación.
Esto se aplica a importaciones del SDK, campos del manifiesto, APIs de configuración, hooks y comportamiento
de registro en tiempo de ejecución.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Los Plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
  Los registros de factorías de extensiones integradas exclusivas de Pi ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque antiguo causaba problemas:

- **Inicio lento** — importar una utilidad cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de distinguir qué exportaciones eran estables frente a internas

El SDK moderno de Plugin corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También desaparecieron las costuras heredadas de conveniencia para proveedores en canales incluidos. Importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
costuras de utilidades con marca de canal y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables de Plugin. Usa subrutas genéricas y acotadas del SDK en su lugar. Dentro del
espacio de trabajo del Plugin incluido, mantén las utilidades gestionadas por el proveedor en el propio
`api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores incluidos:

- Anthropic mantiene utilidades de streaming específicas de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builders de proveedor, utilidades de modelo predeterminado y builders
  de proveedores realtime en su propio `api.ts`
- OpenRouter mantiene el builder de proveedor y las utilidades de onboarding/configuración en su propio
  `api.ts`

## Política de compatibilidad

Para Plugins externos, el trabajo de compatibilidad sigue este orden:

1. añadir el nuevo contrato
2. mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la deprecación y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión principal

Si un campo del manifiesto sigue aceptándose, los autores de Plugins pueden seguir usándolo hasta
que la documentación y los diagnósticos indiquen lo contrario. El código nuevo debería preferir el
reemplazo documentado, pero los Plugins existentes no deberían romperse durante versiones menores normales.

## Cómo migrar

<Steps>
  <Step title="Migrar extensiones Pi de resultados de herramientas a middleware">
    Los Plugins incluidos deben reemplazar los manejadores de resultados de herramientas
    exclusivos de Pi de `api.registerEmbeddedExtensionFactory(...)` por
    middleware neutral respecto al runtime.

    ```typescript
    // Herramientas dinámicas de runtime Pi y Codex
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

    Los Plugins externos no pueden registrar middleware de resultados de herramientas porque puede
    reescribir salidas de herramientas de alta confianza antes de que el modelo las vea.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a hechos de capacidad">
    Los Plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y colócala en `approvalCapability`
    - `ChannelPlugin.approvals` ha sido eliminado del contrato público de
      Plugin de canal; mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` se mantiene solo para flujos de login/logout del canal; los hooks
      de autenticación de aprobación allí ya no son leídos por el núcleo
    - Registra objetos de runtime del canal gestionados por el propio canal, como clientes, tokens o apps
      Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección gestionados por el Plugin desde manejadores nativos de aprobación;
      el núcleo ahora gestiona los avisos de entregado en otro lugar a partir de los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Se rechazan stubs parciales.

    Consulta `/plugins/sdk-channel-plugins` para ver la estructura actual de
    capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan de forma cerrada a menos que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Configura esto solo para llamadores de compatibilidad de confianza que
      // aceptan intencionadamente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionadamente del fallback de shell, no configures
    `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones focalizadas">
    Cada exportación de la superficie antigua se asigna a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad con versiones anteriores)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas focalizadas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para utilidades del lado del host, usa el runtime del Plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (runtime inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otras utilidades heredadas del puente:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | utilidades de almacenamiento de sesión | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Utilidad canónica de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilidad de entrada para un solo proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y builders focalizados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilidades compartidas del asistente de configuración | Prompts de lista de permitidos, builders de estado de configuración |
  | `plugin-sdk/setup-runtime` | Utilidades de runtime en tiempo de configuración | Adaptadores de parches de configuración seguros para importación, utilidades de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Utilidades de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Utilidades de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilidades para múltiples cuentas | Utilidades de lista/configuración de cuentas/control de acciones |
  | `plugin-sdk/account-id` | Utilidades de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Utilidades de búsqueda de cuentas | Utilidades de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Utilidades acotadas de cuentas | Utilidades de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factorías de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de esquema de configuración | Primitivas compartidas de esquema de configuración de canal; las exportaciones de esquema con nombre de canal incluido son solo compatibilidad heredada |
  | `plugin-sdk/telegram-command-config` | Utilidades de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Utilidades de ciclo de vida de estado de cuenta y flujo de borradores | `createAccountStatusSink`, utilidades de finalización de vista previa de borradores |
  | `plugin-sdk/inbound-envelope` | Utilidades de envelope de entrada | Utilidades compartidas de ruta + construcción de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Utilidades de respuesta entrante | Utilidades compartidas de registrar y despachar |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Utilidades de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Utilidades de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Utilidades de runtime saliente | Utilidades de entrega saliente, delegado de identidad/envío, sesión, formato y planificación de payload |
  | `plugin-sdk/thread-bindings-runtime` | Utilidades de vinculación de hilos | Utilidades de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Utilidades heredadas de payload de medios | Builder de payload de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilidades amplias de runtime | Utilidades de runtime/logging/backup/instalación de Plugins |
  | `plugin-sdk/runtime-env` | Utilidades acotadas de entorno de runtime | Logger/entorno de runtime, timeout, retry y backoff |
  | `plugin-sdk/plugin-runtime` | Utilidades compartidas de runtime de Plugin | Utilidades de comandos/hooks/http/interacción del Plugin |
  | `plugin-sdk/hook-runtime` | Utilidades de pipeline de hooks | Utilidades compartidas de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Utilidades de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilidades de procesos | Utilidades compartidas de exec |
  | `plugin-sdk/cli-runtime` | Utilidades de runtime de CLI | Formato de comandos, esperas, utilidades de versión |
  | `plugin-sdk/gateway-runtime` | Utilidades de Gateway | Cliente de Gateway y utilidades de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Utilidades de configuración | Utilidades de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Utilidades de comandos de Telegram | Utilidades estables como fallback para validación de comandos de Telegram cuando la superficie contractual de Telegram incluida no está disponible |
  | `plugin-sdk/approval-runtime` | Utilidades de prompts de aprobación | Utilidades de payload de aprobación de exec/Plugin, capacidad/perfil de aprobación, utilidades nativas de enrutamiento/runtime de aprobación y formato estructurado de visualización de aprobaciones |
  | `plugin-sdk/approval-auth-runtime` | Utilidades de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Utilidades de cliente de aprobación | Utilidades nativas de perfil/filtro de aprobación de exec |
  | `plugin-sdk/approval-delivery-runtime` | Utilidades de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Utilidades de Gateway de aprobación | Utilidad compartida de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilidades de adaptador de aprobación | Utilidades ligeras de carga de adaptadores nativos de aprobación para puntos de entrada de canal calientes |
  | `plugin-sdk/approval-handler-runtime` | Utilidades de manejador de aprobación | Utilidades más amplias de runtime del manejador de aprobación; prefiere las costuras más acotadas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Utilidades de destino de aprobación | Utilidades nativas de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Utilidades de respuesta de aprobación | Utilidades de payload de respuesta de aprobación de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Utilidades de contexto de runtime de canal | Utilidades genéricas de registrar/obtener/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Utilidades de seguridad | Utilidades compartidas de confianza, control de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Utilidades de política SSRF | Utilidades de lista de permitidos de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Utilidades de runtime SSRF | Utilidades de dispatcher fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Utilidades de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilidades de control de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilidades de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, utilidades de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Utilidades de fetch/proxy envueltas | `resolveFetch`, utilidades de proxy |
  | `plugin-sdk/host-runtime` | Utilidades de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilidades de retry | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Utilidades de control de comandos y superficie de comandos | `resolveControlCommandGate`, utilidades de autorización del remitente, utilidades de registro de comandos incluida la generación dinámica de formato de menús de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Utilidades de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Utilidades de solicitudes de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilidades de guardas de solicitudes de Webhook | Utilidades de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Utilidades acotadas de despacho de respuestas | Finalización, despacho del proveedor y utilidades de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Utilidades de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilidades de fragmentación de respuestas | Utilidades de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Utilidades de almacén de sesión | Ruta del almacén + utilidades de updated-at |
  | `plugin-sdk/state-paths` | Utilidades de rutas de estado | Utilidades de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Utilidades de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilidades de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Utilidades de estado de canal | Builders de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, utilidades de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Utilidades de resolvedor de destino | Utilidades compartidas de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de cadenas | Utilidades de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Utilidades de URL de solicitud | Extraer URLs de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Utilidades de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramientas | Extraer payloads normalizados de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Utilidades de rutas temporales | Utilidades compartidas de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Utilidades de logging | Logger de subsistema y utilidades de redacción |
  | `plugin-sdk/markdown-table-runtime` | Utilidades de tablas Markdown | Utilidades de modo de tablas Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Utilidades seleccionadas de configuración de proveedores locales/autohospedados | Utilidades de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Utilidades focalizadas de configuración de proveedores autohospedados compatibles con OpenAI | Las mismas utilidades de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Utilidades de autenticación de runtime del proveedor | Utilidades de resolución de clave de API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Utilidades de configuración de clave de API del proveedor | Utilidades de onboarding/escritura de perfil de clave de API |
  | `plugin-sdk/provider-auth-result` | Utilidades de resultado de autenticación del proveedor | Builder estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Utilidades de login interactivo del proveedor | Utilidades compartidas de login interactivo |
  | `plugin-sdk/provider-selection-runtime` | Utilidades de selección de proveedor | Selección de proveedor configurado o automático y fusión de configuración bruta del proveedor |
  | `plugin-sdk/provider-env-vars` | Utilidades de variables de entorno del proveedor | Utilidades de búsqueda de variables de entorno de autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Utilidades compartidas de modelo/repetición de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartidos de políticas de repetición, utilidades de endpoints de proveedor y utilidades de normalización de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Utilidades compartidas de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de onboarding de proveedor | Utilidades de configuración de onboarding |
  | `plugin-sdk/provider-http` | Utilidades HTTP de proveedor | Utilidades genéricas de HTTP/capacidades de endpoint de proveedor, incluidas utilidades de formulario multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Utilidades de web-fetch de proveedor | Utilidades de registro/caché de proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilidades de configuración de búsqueda web de proveedor | Utilidades acotadas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilidades de contrato de búsqueda web de proveedor | Utilidades acotadas de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Utilidades de búsqueda web de proveedor | Utilidades de registro/caché/runtime de proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Utilidades de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos, y utilidades de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Utilidades de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otras utilidades de uso de proveedor |
  | `plugin-sdk/provider-stream` | Utilidades wrapper de streams de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream y utilidades wrapper compartidas de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilidades de transporte de proveedor | Utilidades de transporte nativo de proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilidades compartidas de medios | Utilidades de obtener/transformar/almacenar medios más builders de payload de medios |
  | `plugin-sdk/media-generation-runtime` | Utilidades compartidas de generación de medios | Utilidades compartidas de failover, selección de candidatos y mensajería de modelo faltante para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Utilidades de comprensión de medios | Tipos de proveedor de comprensión de medios más exportaciones de utilidades de imagen/audio orientadas al proveedor |
  | `plugin-sdk/text-runtime` | Utilidades compartidas de texto | Eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación/tablas de Markdown, utilidades de redacción, utilidades de etiquetas de directivas, utilidades de texto seguro y utilidades relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Utilidades de fragmentación de texto | Utilidad de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Utilidades de voz | Tipos de proveedor de voz más utilidades orientadas al proveedor de directivas, registro y validación |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Utilidades de transcripción en tiempo real | Tipos de proveedor, utilidades de registro y utilidad compartida de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Utilidades de voz en tiempo real | Tipos de proveedor, utilidades de registro/resolución y utilidades de sesión puente |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y utilidades de registro de generación de imágenes |
  | `plugin-sdk/music-generation` | Utilidades de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, utilidades de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Utilidades de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, utilidades de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Utilidades de respuesta interactiva | Normalización/reducción de payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas acotadas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Utilidades de escritura de configuración de canal | Utilidades de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Utilidades de estado de canal | Utilidades compartidas de snapshot/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilidades de configuración de lista de permitidos | Utilidades de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Utilidades de acceso a grupos | Utilidades compartidas de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Utilidades de DM directo | Utilidades compartidas de autenticación/guardas de DM directo |
  | `plugin-sdk/extension-shared` | Utilidades compartidas de extensión | Primitivas auxiliares de canal/estado pasivo y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Utilidades de destinos de Webhook | Registro de destinos de Webhook y utilidades de instalación de rutas |
  | `plugin-sdk/webhook-path` | Utilidades de rutas de Webhook | Utilidades de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Utilidades compartidas de medios web | Utilidades de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Utilidades incluidas de memory-core | Superficie de utilidades de administrador/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime del motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base de host de memoria | Exportaciones del motor base de host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y utilidades genéricas de lotes/remotas; los proveedores remotos concretos viven en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memoria | Exportaciones del motor QMD de host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento de host de memoria | Exportaciones del motor de almacenamiento de host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Utilidades multimodales de host de memoria | Utilidades multimodales de host de memoria |
  | `plugin-sdk/memory-core-host-query` | Utilidades de consulta de host de memoria | Utilidades de consulta de host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Utilidades de secretos de host de memoria | Utilidades de secretos de host de memoria |
  | `plugin-sdk/memory-core-host-events` | Utilidades de registro de eventos de host de memoria | Utilidades de registro de eventos de host de memoria |
  | `plugin-sdk/memory-core-host-status` | Utilidades de estado de host de memoria | Utilidades de estado de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI de host de memoria | Utilidades de runtime CLI de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal de host de memoria | Utilidades de runtime principal de host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilidades de archivos/runtime de host de memoria | Utilidades de archivos/runtime de host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de runtime principal de host de memoria | Alias neutral respecto al proveedor para utilidades de runtime principal de host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de registro de eventos de host de memoria | Alias neutral respecto al proveedor para utilidades de registro de eventos de host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/runtime de host de memoria | Alias neutral respecto al proveedor para utilidades de archivos/runtime de host de memoria |
  | `plugin-sdk/memory-host-markdown` | Utilidades de Markdown gestionado | Utilidades compartidas de Markdown gestionado para Plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada lazy de runtime del administrador de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado de host de memoria | Alias neutral respecto al proveedor para utilidades de estado de host de memoria |
  | `plugin-sdk/memory-lancedb` | Utilidades incluidas de memory-lancedb | Superficie de utilidades de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Utilidades de prueba y mocks |
</Accordion>

Esta tabla es intencionadamente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada está en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas costuras de utilidades de Plugins incluidos como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de Plugins incluidos, pero se omiten intencionadamente
de la tabla común de migración y no son el destino recomendado para
código nuevo de Plugins.

La misma regla se aplica a otras familias de utilidades incluidas como:

- utilidades de soporte de navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de utilidades/Plugins incluidos como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie acotada de utilidades de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más acotada que coincida con la tarea. Si no encuentras una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Deprecaciones activas

Deprecaciones más acotadas que se aplican en todo el SDK de Plugin, el contrato de proveedor,
la superficie de runtime y el manifiesto. Todas siguen funcionando hoy, pero se eliminarán
en una futura versión principal. La entrada debajo de cada elemento asigna la API antigua a su
reemplazo canónico.

<AccordionGroup>
  <Accordion title="builders de ayuda command-auth → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones — solo se importan desde la subruta más acotada. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Después
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Utilidades de control de menciones → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` desde
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })` — devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los Plugins de canal downstream (Slack, Discord, Matrix, Microsoft Teams) ya
    se han cambiado.

  </Accordion>

  <Accordion title="Shim de runtime de canal y utilidades de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es un shim de compatibilidad para Plugins
    de canal antiguos. No lo importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de runtime.

    Las utilidades `channelActions*` en `openclaw/plugin-sdk/channel-actions` están
    obsoletas junto con las exportaciones de canal de "actions" sin procesar. Expón
    capacidades mediante la superficie semántica `presentation` en su lugar: los Plugins
    de canal declaran qué renderizan (tarjetas, botones, selects) en lugar de qué nombres
    de acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Utilidad tool() de proveedor de búsqueda web → createTool() en el Plugin">
    **Antiguo**: factoría `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementa `createTool(...)` directamente en el Plugin del proveedor.
    OpenClaw ya no necesita la utilidad del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="Envelopes de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un envelope plano de prompt en texto
    desde mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto de usuario. Los Plugins
    de canal adjuntan metadatos de enrutamiento (hilo, tema, reply-to, reacciones) como
    campos tipados en lugar de concatenarlos en una cadena de prompt. La utilidad
    `formatAgentEnvelope(...)` sigue siendo compatible para envelopes sintetizados
    visibles para el asistente, pero los envelopes entrantes en texto plano van
    de salida.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier Plugin
    de canal personalizado que posprocesara el texto `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedor → tipos de catálogo de proveedor">
    Cuatro alias de tipo de descubrimiento ahora son wrappers ligeros sobre los
    tipos de la era del catálogo:

    | Alias antiguo             | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además del contenedor estático heredado `ProviderCapabilities` — los Plugins de proveedor
    deberían adjuntar hechos de capacidad mediante el contrato de runtime del proveedor
    en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de thinking → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y
    lista de niveles ordenada. OpenClaw degrada automáticamente por rango del perfil
    los valores almacenados obsoletos.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando durante
    la ventana de deprecación, pero no se componen con el resultado del perfil.

  </Accordion>

  <Accordion title="Fallback externo de proveedor OAuth → contracts.externalAuthProviders">
    **Antiguo**: implementar `resolveExternalOAuthProfiles(...)` sin
    declarar el proveedor en el manifiesto del Plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del Plugin
    **y** implementa `resolveExternalAuthProfiles(...)`. La ruta antigua de
    "auth fallback" emite una advertencia en tiempo de ejecución y se eliminará.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    **Campo antiguo del manifiesto**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    en el manifiesto. Esto consolida los metadatos de entorno de configuración/estado en un solo
    lugar y evita iniciar el runtime del Plugin solo para responder búsquedas de
    variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
    hasta que cierre la ventana de deprecación.

  </Accordion>

  <Accordion title="Registro de Plugin de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos slots, una sola llamada de registro. Las utilidades aditivas de memoria
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) no se ven afectadas.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipo heredados siguen exportados desde `src/plugins/runtime/types.ts`:

    | Antiguo                      | Nuevo                           |
    | ---------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    El método de runtime `readSession` está obsoleto en favor de
    `getSessionMessages`. Misma firma; el método antiguo llama al
    nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor de TaskFlow en vivo.

    **Nuevo**: `runtime.tasks.flows` (plural) devuelve acceso a TaskFlow basado en DTO,
    que es seguro para importación y no requiere cargar el runtime completo de tareas.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow(ctx);
    // Después
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factorías de extensiones integradas → middleware de resultados de herramientas del agente">
    Se trata en "Cómo migrar → Migrar extensiones Pi de resultados de herramientas a
    middleware" más arriba. Se incluye aquí por completitud: la ruta eliminada
    exclusiva de Pi `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de runtimes
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, reexportado desde `openclaw/plugin-sdk`, ahora es un
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
Las deprecaciones a nivel de extensión (dentro de Plugins de canal/proveedor incluidos bajo
`extensions/`) se rastrean dentro de sus propios barrels `api.ts` y `runtime-api.ts`.
No afectan a contratos de Plugins de terceros y no se listan
aquí. Si consumes directamente el barrel local de un Plugin incluido, lee los
comentarios de deprecación en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución   |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los Plugins que sigan usándolas fallarán |

Todos los Plugins principales ya han sido migrados. Los Plugins externos deberían migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Getting Started](/es/plugins/building-plugins) — crea tu primer Plugin
- [SDK Overview](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Channel Plugins](/es/plugins/sdk-channel-plugins) — creación de Plugins de canal
- [Provider Plugins](/es/plugins/sdk-provider-plugins) — creación de Plugins de proveedor
- [Plugin Internals](/es/plugins/architecture) — análisis detallado de la arquitectura
- [Plugin Manifest](/es/plugins/manifest) — referencia del esquema del manifiesto
