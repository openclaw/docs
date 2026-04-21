---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad retroactiva al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-21T05:17:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del SDK de Plugin

OpenClaw ha pasado de una amplia capa de compatibilidad retroactiva a una arquitectura moderna de plugins
con importaciones específicas y documentadas. Si tu Plugin se creó antes de
la nueva arquitectura, esta guía te ayudará a migrarlo.

## Qué está cambiando

El antiguo sistema de plugins proporcionaba dos superficies muy amplias que permitían a los plugins importar
todo lo que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de
  helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se construía la
  nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el runner del agente integrado.

Ambas superficies están ahora **obsoletas**. Siguen funcionando en runtime, pero los plugins
nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima
versión mayor las elimine.

<Warning>
  La capa de compatibilidad retroactiva se eliminará en una futura versión mayor.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar un helper cargaba docenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables y cuáles internas

El SDK moderno de Plugin soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También han desaparecido las superficies heredadas de conveniencia para proveedores de canales integrados. Importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
las superficies helper con marca del canal, y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables de plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del
workspace del Plugin integrado, mantén los helpers gestionados por el proveedor en el propio
`api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores integrados:

- Anthropic mantiene los helpers de stream específicos de Claude en su propia superficie `api.ts` /
  `contract-api.ts`
- OpenAI mantiene los builders de proveedor, los helpers de modelo predeterminado y los builders de proveedor
  realtime en su propio `api.ts`
- OpenRouter mantiene el builder de proveedor y los helpers de configuración/incorporación en su propio
  `api.ts`

## Cómo migrar

<Steps>
  <Step title="Migrar handlers nativos de aprobación a facts de capabilities">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento de aprobación nativo mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y llévala a `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público de plugins de canal;
      mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` se mantiene solo para los flujos de inicio/cierre de sesión del canal; los hooks de autenticación
      de aprobación allí ya no son leídos por el core
    - Registra objetos de runtime gestionados por el canal, como clientes, tokens o apps
      Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección gestionados por el Plugin desde handlers nativos de aprobación;
      el core ahora se encarga de los avisos routed-elsewhere a partir de los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie `createPluginRuntime().channel` real. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de approval capability.

  </Step>

  <Step title="Auditar el comportamiento fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat` de Windows
    no resueltos ahora fallan de forma cerrada a menos que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadores de compatibilidad confiables que
      // acepten intencionalmente el fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionalmente del fallback por shell, no establezcas
    `allowShellFallback` y maneja el error lanzado en su lugar.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la antigua superficie se asigna a una ruta de importación moderna específica:

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

    Para los helpers del lado del host, usa el runtime de Plugin inyectado en lugar de importarlo
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (runtime inyectado)
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
    | helpers del almacén de sesión | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/core` | Reexportación umbrella heredada para definiciones/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada para un solo proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y builders específicos de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Prompts de lista de permitidos, builders de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de runtime en tiempo de configuración | Adaptadores de patch de configuración seguros para importación, helpers de notas de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers del adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multicuenta | Helpers de lista/configuración/puerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Helpers de account-id | `DEFAULT_ACCOUNT_ID`, normalización de account-id |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuenta + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Helpers de cuenta específicos | Helpers de lista de cuentas/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de esquemas de configuración | Tipos de esquemas de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Seguimiento del estado de cuentas | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope entrante | Helpers compartidos de ruta + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de respuesta entrante | Helpers compartidos de registro y dispatch |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Helpers de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Helpers de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime saliente | Helpers de identidad saliente/delegado de envío y planificación de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de enlace de hilos | Helpers de ciclo de vida y adaptadores de thread-binding |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de payload multimedia | Builder de payload multimedia del agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de runtime | Helpers de runtime/logging/backup/instalación de plugins |
  | `plugin-sdk/runtime-env` | Helpers específicos de entorno de runtime | Logger/entorno de runtime, helpers de timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de runtime de Plugin | Helpers de comandos/hooks/http/interactivos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers compartidos de pipeline de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime perezoso | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de procesos | Helpers compartidos de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formato de comandos, esperas, helpers de versión |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Helpers de cliente de Gateway y patch de estado de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuración | Helpers de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers de validación de comandos de Telegram estables como fallback cuando la superficie de contrato integrada de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts de aprobación | Helpers de payload de aprobación exec/Plugin, helpers de approval capability/profile, helpers nativos de enrutamiento/runtime de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución del aprobador, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers nativos de perfil/filtro de aprobación exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores nativos de approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprobación | Helper compartido de resolución de gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprobación | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprobación | Helpers más amplios de runtime de handler de aprobación; prefiere las superficies más específicas adapter/gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación | Helpers nativos de enlace de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de payload de respuesta de aprobación exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registro/obtención/observación de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, restricción de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de permitidos de host y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de dispatcher fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de restricción de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envueltos | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalización del host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, runners de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Restricción de comandos y helpers de superficie de comandos | `resolveControlCommandGate`, helpers de autorización del remitente, helpers de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/help de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada secreta | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitudes webhook | Utilidades de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guardas de cuerpo de webhook | Helpers de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Dispatch entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de dispatch de respuesta | Helpers de finalización + dispatch del proveedor |
  | `plugin-sdk/reply-history` | Helpers de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentación de respuestas | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers del almacén de sesión | Helpers de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de estado y directorio OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de session-key |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Builders de resumen de estado de canal/cuenta, valores predeterminados del estado de runtime, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destinos | Helpers compartidos de resolvedor de destinos |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extraer URLs de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Runner de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramientas | Extraer payloads normalizados de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema y helpers de redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuración de proveedores locales/self-hosted | Helpers de descubrimiento/configuración de proveedores self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers específicos de configuración de proveedores self-hosted compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de runtime del proveedor | Helpers de resolución de claves de API de runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API del proveedor | Helpers de incorporación/escritura de perfiles con clave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticación del proveedor | Builder estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de inicio de sesión interactivo del proveedor | Helpers compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno del proveedor | Helpers de búsqueda de variables de entorno de autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelos/replay del proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartidos de política de replay, helpers de endpoint del proveedor y helpers de normalización de IDs de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo del proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de incorporación del proveedor | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP del proveedor | Helpers genéricos HTTP/del endpoint del proveedor |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch del proveedor | Helpers de registro/caché del proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de búsqueda web del proveedor | Helpers específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación del Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de búsqueda web del proveedor | Helpers específicos del contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Helpers de búsqueda web del proveedor | Helpers de registro/caché/runtime del proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquemas del proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso del proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso del proveedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream del proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream y helpers compartidos de wrappers para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte del proveedor | Helpers nativos de transporte del proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios más builders de payload multimedia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación multimedia | Helpers compartidos de failover, selección de candidatos y mensajes de modelo faltante para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión multimedia | Tipos de proveedor de comprensión multimedia más exportaciones de helpers de imagen/audio orientadas al proveedor |
  | `plugin-sdk/text-runtime` | Helpers compartidos de texto | Eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de redacción, helpers de etiquetas de directivas, utilidades de texto seguro y helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedor de voz más helpers de directivas, registro y validación orientados al proveedor |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción realtime | Tipos de proveedor y helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz realtime | Tipos de proveedor y helpers de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y helpers de registro para generación de imágenes |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado para generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de failover, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado para generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de failover, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción del payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio del Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de snapshot/resumen del estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista de permitidos | Helpers de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso a grupos | Helpers compartidos de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Helpers de mensajes directos | Helpers compartidos de autenticación/guarda para mensajes directos |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensiones | Primitivas auxiliares de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destino de webhook | Registro de destinos de webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Helpers de ruta de webhook | Helpers de normalización de ruta de webhook |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers integrados de memory-core | Superficie helper de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime del motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor foundation del host de memoria | Exportaciones del motor foundation del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y helpers genéricos batch/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consultas del host de memoria | Helpers de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria | Helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI del host de memoria | Helpers de runtime de CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core del host de memoria | Helpers de runtime core del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de memoria | Helpers de archivos/runtime del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del runtime core del host de memoria | Alias neutral respecto al proveedor para helpers de runtime core del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/runtime del host de memoria | Alias neutral respecto al proveedor para helpers de archivos/runtime del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gestionado | Helpers compartidos de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada lazy de runtime del search-manager de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias del estado del host de memoria | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Helpers integrados de memory-lancedb | Superficie helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Helpers y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada está en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas superficies helper de plugins integrados como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de plugins integrados, pero se omiten intencionalmente
de la tabla común de migración y no son el objetivo recomendado para
código nuevo de plugins.

La misma regla se aplica a otras familias de helpers integrados como:

- helpers de soporte del navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de helpers/plugins integrados como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie específica de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con la tarea. Si no encuentras una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en runtime              |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins del core ya se han migrado. Los plugins externos deberían migrar
antes de la próxima versión mayor.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Getting Started](/es/plugins/building-plugins) — crea tu primer Plugin
- [SDK Overview](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Channel Plugins](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Provider Plugins](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Plugin Internals](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Plugin Manifest](/es/plugins/manifest) — referencia del esquema del manifest
