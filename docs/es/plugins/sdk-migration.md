---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad retroactiva al Plugin SDK moderno
title: Migración del Plugin SDK
x-i18n:
    generated_at: "2026-04-23T05:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del Plugin SDK

OpenClaw ha pasado de una capa amplia de compatibilidad retroactiva a una arquitectura moderna de plugins
con importaciones específicas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayudará a migrarlo.

## Qué está cambiando

El sistema antiguo de plugins proporcionaba dos superficies muy abiertas que permitían a los plugins importar
todo lo que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de
  utilidades. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a
  utilidades del host, como el ejecutor de agentes embebido.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los
plugins nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima
versión principal las elimine.

<Warning>
  La capa de compatibilidad retroactiva se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar una utilidad cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables y cuáles eran internas

El Plugin SDK moderno corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño, autocontenido, con un propósito claro y un contrato documentado.

Las costuras de conveniencia heredadas de proveedores para canales incluidos también desaparecieron. Importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
costuras de utilidades con marca de canal y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables para plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo del Plugin incluido, mantén las utilidades propiedad del proveedor en el propio
`api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores incluidos:

- Anthropic mantiene las utilidades de streaming específicas de Claude en su propia costura `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedor, utilidades de modelos predeterminados y constructores de proveedores
  en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y las utilidades de onboarding/configuración en su propio
  `api.ts`

## Cómo migrar

<Steps>
  <Step title="Migrar controladores nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento de aprobación nativa mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se eliminó del contrato público del plugin de canal;
      mueve los campos `delivery`/`native`/`render` a `approvalCapability`
    - `plugin.auth` se mantiene solo para los flujos de inicio/cierre de sesión del canal; los hooks
      de autenticación de aprobación allí ya no son leídos por el núcleo
    - Registra objetos de tiempo de ejecución propiedad del canal, como clientes, tokens o apps
      Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del plugin desde controladores nativos de aprobación;
      el núcleo ahora es propietario de los avisos de redirigido a otro lugar desde los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie `createPluginRuntime().channel` real. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para el diseño actual de capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de respaldo del envoltorio de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los envoltorios
    `.cmd`/`.bat` de Windows no resueltos ahora fallan en modo cerrado a menos que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadores de compatibilidad confiables que
      // acepten intencionalmente el respaldo mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionalmente del respaldo por shell, no establezcas
    `allowShellFallback` y gestiona el error lanzado en su lugar.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie antigua se corresponde con una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad retroactiva)
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

    Para utilidades del lado del host, usa el tiempo de ejecución del plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (tiempo de ejecución inyectado)
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
    | utilidades de almacén de sesión | `api.runtime.agent.session.*` |

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
  | Import path | Purpose | Key exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Utilidad canónica de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilidad de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilidades compartidas del asistente de configuración | Solicitudes de lista permitida, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Utilidades de tiempo de ejecución para configuración | Adaptadores de parche de configuración seguros para importación, utilidades de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Utilidades de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Utilidades de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilidades para múltiples cuentas | Utilidades de lista/configuración de cuentas/restricción de acciones |
  | `plugin-sdk/account-id` | Utilidades de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Utilidades de búsqueda de cuentas | Utilidades de búsqueda de cuentas + respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Utilidades de cuenta específicas | Utilidades de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de vinculación por mensaje directo | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Utilidades de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Utilidades de ciclo de vida de estado de cuenta y flujo de borrador | `createAccountStatusSink`, utilidades de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Utilidades de sobre entrante | Utilidades compartidas de ruta + construcción de sobres |
  | `plugin-sdk/inbound-reply-dispatch` | Utilidades de respuesta entrante | Utilidades compartidas de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Utilidades de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Utilidades de multimedia saliente | Carga compartida de multimedia saliente |
  | `plugin-sdk/outbound-runtime` | Utilidades de tiempo de ejecución saliente | Utilidades de identidad/envío delegado saliente y planificación de cargas útiles |
  | `plugin-sdk/thread-bindings-runtime` | Utilidades de vinculaciones de hilos | Utilidades de ciclo de vida y adaptador de vinculaciones de hilos |
  | `plugin-sdk/agent-media-payload` | Utilidades heredadas de carga útil multimedia | Constructor de carga útil multimedia del agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilidades amplias de tiempo de ejecución | Utilidades de runtime/logging/respaldo/instalación de plugins |
  | `plugin-sdk/runtime-env` | Utilidades específicas de entorno de tiempo de ejecución | Entorno de logger/runtime, utilidades de tiempo de espera, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Utilidades compartidas de tiempo de ejecución de Plugin | Utilidades de comandos/hooks/http/interactivas de Plugin |
  | `plugin-sdk/hook-runtime` | Utilidades de canalización de hooks | Utilidades compartidas de canalización interna/webhook |
  | `plugin-sdk/lazy-runtime` | Utilidades de tiempo de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilidades de proceso | Utilidades compartidas de ejecución |
  | `plugin-sdk/cli-runtime` | Utilidades de tiempo de ejecución de CLI | Formato de comandos, esperas, utilidades de versión |
  | `plugin-sdk/gateway-runtime` | Utilidades de Gateway | Cliente Gateway y utilidades de parcheo de estado de canal |
  | `plugin-sdk/config-runtime` | Utilidades de configuración | Utilidades de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Utilidades de comandos de Telegram | Validación de comandos de Telegram estable con respaldo cuando la superficie de contrato incluida de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Utilidades de solicitudes de aprobación | Carga útil de aprobación exec/plugin, utilidades de capacidad/perfil de aprobación, utilidades nativas de enrutamiento/runtime de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Utilidades de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Utilidades de cliente de aprobación | Utilidades nativas de perfil/filtro de aprobación exec |
  | `plugin-sdk/approval-delivery-runtime` | Utilidades de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Utilidades de Gateway de aprobación | Utilidad compartida de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilidades de adaptador de aprobación | Utilidades ligeras de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
  | `plugin-sdk/approval-handler-runtime` | Utilidades de controlador de aprobación | Utilidades más amplias de tiempo de ejecución de controlador de aprobación; prefiere las costuras más específicas de adaptador/gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Utilidades de destino de aprobación | Utilidades nativas de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Utilidades de respuesta de aprobación | Utilidades de carga útil de respuesta de aprobación exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Utilidades de contexto de tiempo de ejecución de canal | Utilidades genéricas de registro/obtención/observación de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Utilidades de seguridad | Utilidades compartidas de confianza, restricción de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Utilidades de política SSRF | Utilidades de lista permitida de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Utilidades de tiempo de ejecución SSRF | Dispatcher fijado, fetch protegido, utilidades de política SSRF |
  | `plugin-sdk/collection-runtime` | Utilidades de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilidades de restricción de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilidades de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, utilidades de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Utilidades envueltas de fetch/proxy | `resolveFetch`, utilidades de proxy |
  | `plugin-sdk/host-runtime` | Utilidades de normalización del host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilidades de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista permitida | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista permitida | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Restricción de comandos y utilidades de superficie de comandos | `resolveControlCommandGate`, utilidades de autorización de remitente, utilidades de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada secreta | Utilidades de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Utilidades de solicitud webhook | Utilidades de destino webhook |
  | `plugin-sdk/webhook-request-guards` | Utilidades de protección del cuerpo de webhook | Utilidades de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de despacho de respuesta | Utilidades de finalización + despacho de proveedor |
  | `plugin-sdk/reply-history` | Utilidades de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilidades de fragmentación de respuestas | Utilidades de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Utilidades de almacenamiento de sesión | Utilidades de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Utilidades de rutas de estado | Utilidades de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Utilidades de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilidades de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Utilidades de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, utilidades de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Utilidades de resolvedor de destinos | Utilidades compartidas de resolvedor de destinos |
  | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de cadenas | Utilidades de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Utilidades de URL de solicitud | Extraer URL de texto de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Utilidades de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramientas | Extraer cargas útiles normalizadas de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío desde argumentos de herramienta |
  | `plugin-sdk/temp-path` | Utilidades de rutas temporales | Utilidades compartidas de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Utilidades de logging | Logger de subsistema y utilidades de redacción |
  | `plugin-sdk/markdown-table-runtime` | Utilidades de tablas Markdown | Utilidades de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Utilidades seleccionadas de configuración de proveedores locales/autohospedados | Utilidades de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Utilidades específicas de configuración de proveedores autohospedados compatibles con OpenAI | Las mismas utilidades de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Utilidades de autenticación de proveedor en tiempo de ejecución | Utilidades de resolución de claves API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Utilidades de configuración de claves API de proveedor | Utilidades de onboarding/escritura de perfil para claves API |
  | `plugin-sdk/provider-auth-result` | Utilidades de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Utilidades de inicio de sesión interactivo de proveedor | Utilidades compartidas de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Utilidades de variables de entorno de proveedor | Utilidades de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Utilidades compartidas de modelo/replay de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, utilidades de endpoints de proveedor y utilidades de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Utilidades compartidas de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de onboarding de proveedores | Utilidades de configuración de onboarding |
  | `plugin-sdk/provider-http` | Utilidades HTTP de proveedores | Utilidades genéricas de HTTP/capacidades de endpoints de proveedores, incluidas utilidades de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Utilidades web-fetch de proveedores | Utilidades de registro/caché de proveedores web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilidades de configuración de búsqueda web de proveedores | Utilidades específicas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilidades de contrato de búsqueda web de proveedores | Utilidades específicas de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Utilidades de búsqueda web de proveedores | Utilidades de registro/caché/runtime de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Utilidades de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y utilidades de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Utilidades de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otras utilidades de uso de proveedores |
  | `plugin-sdk/provider-stream` | Utilidades de envoltura de flujos de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y utilidades compartidas de envoltorios Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilidades de transporte de proveedores | Utilidades nativas de transporte de proveedores como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilidades compartidas de multimedia | Utilidades de obtención/transformación/almacenamiento de multimedia más constructores de cargas útiles multimedia |
  | `plugin-sdk/media-generation-runtime` | Utilidades compartidas de generación multimedia | Utilidades compartidas de failover, selección de candidatos y mensajería por falta de modelo para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Utilidades de comprensión multimedia | Tipos de proveedor de comprensión multimedia más exportaciones de utilidades de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Utilidades compartidas de texto | Eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación/tablas Markdown, utilidades de redacción, utilidades de etiquetas de directivas, utilidades de texto seguro y utilidades relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Utilidades de fragmentación de texto | Utilidad de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Utilidades de voz | Tipos de proveedores de voz más utilidades de directivas, registro y validación orientadas a proveedores |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Utilidades de transcripción en tiempo real | Tipos de proveedores, utilidades de registro y utilidad compartida de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Utilidades de voz en tiempo real | Tipos de proveedores y utilidades de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, failover, autenticación y utilidades de registro |
  | `plugin-sdk/music-generation` | Utilidades de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, utilidades de failover, búsqueda de proveedores y análisis de refs de modelo |
  | `plugin-sdk/video-generation` | Utilidades de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, utilidades de failover, búsqueda de proveedores y análisis de refs de modelo |
  | `plugin-sdk/interactive-runtime` | Utilidades de respuesta interactiva | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de schema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Utilidades de escritura de configuración de canal | Utilidades de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de plugins de canal |
  | `plugin-sdk/channel-status` | Utilidades de estado de canal | Utilidades compartidas de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilidades de configuración de lista permitida | Utilidades de edición/lectura de configuración de lista permitida |
  | `plugin-sdk/group-access` | Utilidades de acceso a grupos | Utilidades compartidas de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Utilidades de mensajes directos directos | Utilidades compartidas de autenticación/protección de mensajes directos directos |
  | `plugin-sdk/extension-shared` | Utilidades compartidas de extensiones | Primitivas de canal pasivo/estado y utilidades de proxy ambiental |
  | `plugin-sdk/webhook-targets` | Utilidades de destinos webhook | Registro de destinos webhook y utilidades de instalación de rutas |
  | `plugin-sdk/webhook-path` | Utilidades de rutas webhook | Utilidades de normalización de rutas webhook |
  | `plugin-sdk/web-media` | Utilidades compartidas de multimedia web | Utilidades de carga de multimedia remota/local |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del Plugin SDK |
  | `plugin-sdk/memory-core` | Utilidades incluidas de memory-core | Superficie de utilidades de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y utilidades genéricas de lote/remotas; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Utilidades multimodales del host de memoria | Utilidades multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Utilidades de consulta del host de memoria | Utilidades de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Utilidades de secretos del host de memoria | Utilidades de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Utilidades de diario de eventos del host de memoria | Utilidades de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Utilidades de estado del host de memoria | Utilidades de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI del host de memoria | Utilidades de tiempo de ejecución de CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal del host de memoria | Utilidades de tiempo de ejecución principal del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilidades de archivos/runtime del host de memoria | Utilidades de archivos/runtime del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de runtime principal del host de memoria | Alias neutral respecto al proveedor para utilidades del runtime principal del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos del host de memoria | Alias neutral respecto al proveedor para utilidades de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/runtime del host de memoria | Alias neutral respecto al proveedor para utilidades de archivos/runtime del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Utilidades de markdown gestionado | Utilidades compartidas de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada de runtime diferido del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para utilidades de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Utilidades incluidas de memory-lancedb | Superficie de utilidades de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Utilidades de prueba y mocks |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no la superficie
completa del SDK. La lista completa de más de 200 puntos de entrada se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas costuras de utilidades de plugins incluidos como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de plugins incluidos, pero se omiten intencionalmente
de la tabla común de migración y no son el destino recomendado para
código nuevo de plugins.

La misma regla se aplica a otras familias de utilidades incluidas como:

- utilidades de compatibilidad con navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de utilidades/plugins incluidos como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie específica
de utilidades de token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con el trabajo. Si no puedes encontrar una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| When                   | What happens                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Now**                | Las superficies obsoletas emiten advertencias en tiempo de ejecución    |
| **Next major release** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se migraron. Los plugins externos deberían migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer Plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importación por subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Internals de Plugin](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
