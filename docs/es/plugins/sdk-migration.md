---
read_when:
    - Ves la advertencia `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ves la advertencia `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Estás actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad retroactiva al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del SDK de Plugin

OpenClaw ha pasado de una amplia capa de compatibilidad retroactiva a una arquitectura moderna de plugins con importaciones específicas y documentadas. Si tu Plugin se creó antes de la nueva arquitectura, esta guía te ayudará a migrarlo.

## Qué está cambiando

El sistema de plugins anterior proporcionaba dos superficies muy amplias que permitían a los plugins importar cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de utilidades. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se desarrollaba la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a utilidades del host, como el ejecutor de agentes embebido.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los plugins nuevos no deben usarlas, y los plugins existentes deben migrar antes de que la próxima versión mayor las elimine.

<Warning>
  La capa de compatibilidad retroactiva se eliminará en una futura versión mayor.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar una utilidad cargaba docenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables y cuáles eran internas

El SDK moderno de Plugin corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También se han eliminado las uniones de conveniencia heredadas de proveedores para canales empaquetados. Importaciones como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, las uniones de utilidades con marca de canal y `openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no contratos estables de plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del espacio de trabajo de plugins empaquetados, mantén las utilidades propias del proveedor en el `api.ts` o `runtime-api.ts` de ese propio Plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene las utilidades de flujo específicas de Claude en su propia unión `api.ts` / `contract-api.ts`
- OpenAI mantiene los constructores del proveedor, las utilidades de modelos predeterminados y los constructores del proveedor en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor del proveedor y las utilidades de incorporación/configuración en su propio `api.ts`

## Cómo migrar

<Steps>
  <Step title="Migrar los handlers nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante `approvalCapability.nativeRuntime` junto con el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Sustituye `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público del plugin de canal;
      mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` se mantiene solo para los flujos de inicio/cierre de sesión del canal; los hooks
      de autenticación de aprobación ahí ya no son leídos por el core
    - Registra los objetos de tiempo de ejecución propiedad del canal, como clientes, tokens o apps de Bolt,
      mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del plugin desde handlers nativos de aprobación;
      el core ahora se encarga de los avisos de enrutado a otro lugar a partir de los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de la
    capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat` de Windows no resueltos ahora fallan de forma cerrada, a menos que pases explícitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Solo configura esto para llamadores de compatibilidad confiables que acepten
      // intencionalmente un fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionalmente del fallback por shell, no configures
    `allowShellFallback` y en su lugar maneja el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu Plugin las importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sustituir por importaciones específicas">
    Cada exportación de la superficie anterior se asigna a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad retroactiva)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas y específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para las utilidades del host, usa el tiempo de ejecución del Plugin inyectado en lugar de importar directamente:

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
    | utilidades del almacén de sesiones | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilidad de entrada de un solo proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilidades compartidas del asistente de configuración | Prompts de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Utilidades de tiempo de ejecución para la configuración | Adaptadores de parche de configuración seguros para importación, utilidades de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Utilidades del adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Utilidades de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilidades para múltiples cuentas | Utilidades de lista/configuración de cuentas/puerta de acciones |
  | `plugin-sdk/account-id` | Utilidades de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Utilidades de búsqueda de cuentas | Utilidades de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Utilidades específicas de cuentas | Utilidades de lista de cuentas/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Utilidades de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Seguimiento del estado de cuentas | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Utilidades de sobre de entrada | Utilidades compartidas de enrutamiento + constructor de sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Utilidades de respuestas entrantes | Utilidades compartidas de registro y envío |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Utilidades de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Utilidades de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Utilidades de tiempo de ejecución saliente | Utilidades de identidad saliente/delegado de envío |
  | `plugin-sdk/thread-bindings-runtime` | Utilidades de vinculación de hilos | Utilidades de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Utilidades heredadas de payload de medios | Constructor de payload de medios del agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilidades amplias de tiempo de ejecución | Utilidades de tiempo de ejecución/logging/copias de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Utilidades específicas del entorno de ejecución | Logger/entorno de ejecución, utilidades de timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Utilidades compartidas de tiempo de ejecución de Plugin | Utilidades de comandos/hooks/http/interacción del Plugin |
  | `plugin-sdk/hook-runtime` | Utilidades del pipeline de hooks | Utilidades compartidas del pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Utilidades de tiempo de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilidades de procesos | Utilidades compartidas de exec |
  | `plugin-sdk/cli-runtime` | Utilidades de tiempo de ejecución de CLI | Formato de comandos, esperas, utilidades de versión |
  | `plugin-sdk/gateway-runtime` | Utilidades de Gateway | Cliente de Gateway y utilidades de parche de estado de canal |
  | `plugin-sdk/config-runtime` | Utilidades de configuración | Utilidades de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Utilidades de comandos de Telegram | Utilidades de validación de comandos de Telegram estables como fallback cuando la superficie del contrato empaquetado de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Utilidades de prompts de aprobación | Payload de aprobación de exec/Plugin, utilidades de capacidad/perfil de aprobación, utilidades nativas de enrutamiento/tiempo de ejecución de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Utilidades de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Utilidades del cliente de aprobación | Utilidades nativas de perfil/filtro de aprobación de exec |
  | `plugin-sdk/approval-delivery-runtime` | Utilidades de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Utilidades de Gateway de aprobación | Utilidad compartida de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilidades del adaptador de aprobación | Utilidades ligeras de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canal |
  | `plugin-sdk/approval-handler-runtime` | Utilidades del handler de aprobación | Utilidades más amplias de tiempo de ejecución del handler de aprobación; prefiere las uniones más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Utilidades de destino de aprobación | Utilidades nativas de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Utilidades de respuesta de aprobación | Utilidades de payload de respuesta de aprobación de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Utilidades de contexto de tiempo de ejecución de canal | Utilidades genéricas de registro/obtención/observación de contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Utilidades de seguridad | Utilidades compartidas de confianza, restricción de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Utilidades de política SSRF | Utilidades de lista de permitidos de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Utilidades de tiempo de ejecución SSRF | Utilidades de despachador fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Utilidades de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilidades de restricción de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilidades de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, utilidades de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Utilidades de fetch/proxy envueltas | `resolveFetch`, utilidades de proxy |
  | `plugin-sdk/host-runtime` | Utilidades de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilidades de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Asignación de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Restricción de comandos y utilidades de superficie de comandos | `resolveControlCommandGate`, utilidades de autorización del remitente, utilidades de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Utilidades de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Utilidades de solicitudes de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilidades de guardas de solicitudes de Webhook | Utilidades de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuesta | Envío de entrada, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de envío de respuestas | Utilidades de finalización + envío al proveedor |
  | `plugin-sdk/reply-history` | Utilidades de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilidades de fragmentación de respuestas | Utilidades de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Utilidades del almacén de sesiones | Utilidades de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Utilidades de rutas de estado | Utilidades de directorio de estado y OAuth |
  | `plugin-sdk/routing` | Utilidades de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilidades de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Utilidades de estado de canal | Constructores de resúmenes de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución, utilidades de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Utilidades de resolvedor de destinos | Utilidades compartidas del resolvedor de destinos |
  | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de cadenas | Utilidades de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Utilidades de URL de solicitud | Extraer URL de cadena de entradas similares a request |
  | `plugin-sdk/run-command` | Utilidades de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros para herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramientas | Extraer payloads normalizados de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Utilidades de rutas temporales | Utilidades compartidas de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Utilidades de logging | Logger de subsistema y utilidades de redacción |
  | `plugin-sdk/markdown-table-runtime` | Utilidades de tablas Markdown | Utilidades de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Utilidades seleccionadas de configuración de proveedor local/autohospedado | Utilidades de descubrimiento/configuración de proveedor autohospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Utilidades específicas de configuración de proveedor autohospedado compatible con OpenAI | Las mismas utilidades de descubrimiento/configuración de proveedor autohospedado |
  | `plugin-sdk/provider-auth-runtime` | Utilidades de autenticación de proveedor en tiempo de ejecución | Utilidades de resolución de claves API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Utilidades de configuración de claves API del proveedor | Utilidades de onboarding/escritura de perfiles de claves API |
  | `plugin-sdk/provider-auth-result` | Utilidades de resultados de autenticación del proveedor | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Utilidades de inicio de sesión interactivo del proveedor | Utilidades compartidas de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Utilidades de variables de entorno del proveedor | Utilidades de búsqueda de variables de entorno de autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Utilidades compartidas de modelos/replay del proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, utilidades de endpoints del proveedor y utilidades de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Utilidades compartidas del catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Utilidades de configuración de incorporación |
  | `plugin-sdk/provider-http` | Utilidades HTTP de proveedores | Utilidades genéricas de capacidad HTTP/endpoint de proveedores |
  | `plugin-sdk/provider-web-fetch` | Utilidades de web-fetch de proveedores | Utilidades de registro/caché de proveedores web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilidades de configuración de búsqueda web de proveedores | Utilidades específicas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Utilidades de contrato de búsqueda web de proveedores | Utilidades específicas del contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance definido |
  | `plugin-sdk/provider-web-search` | Utilidades de búsqueda web de proveedores | Utilidades de registro/caché/tiempo de ejecución de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Utilidades de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos y utilidades de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Utilidades de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otras utilidades de uso de proveedores |
  | `plugin-sdk/provider-stream` | Utilidades contenedoras de streams de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de contenedores de streams y utilidades compartidas de contenedores para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilidades de transporte de proveedores | Utilidades nativas de transporte de proveedores como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilidades compartidas de medios | Utilidades de obtención/transformación/almacenamiento de medios, además de constructores de payload de medios |
  | `plugin-sdk/media-generation-runtime` | Utilidades compartidas de generación de medios | Utilidades compartidas de failover, selección de candidatos y mensajería de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Utilidades de comprensión de medios | Tipos de proveedores de comprensión de medios, además de exportaciones de utilidades de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Utilidades compartidas de texto | Eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación/tablas Markdown, utilidades de redacción, utilidades de etiquetas de directivas, utilidades de texto seguro y otras utilidades relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Utilidades de fragmentación de texto | Utilidad de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Utilidades de voz | Tipos de proveedores de voz, además de utilidades de directivas, registro y validación orientadas a proveedores |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Utilidades de transcripción en tiempo real | Tipos de proveedores y utilidades de registro |
  | `plugin-sdk/realtime-voice` | Utilidades de voz en tiempo real | Tipos de proveedores y utilidades de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y utilidades de registro para generación de imágenes |
  | `plugin-sdk/music-generation` | Utilidades de generación de música | Tipos de proveedor/solicitud/resultado para generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, utilidades de failover, búsqueda de proveedores y análisis de model-ref |
  | `plugin-sdk/video-generation` | Utilidades de generación de video | Tipos de proveedor/solicitud/resultado para generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, utilidades de failover, búsqueda de proveedores y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Utilidades de respuesta interactiva | Normalización/reducción de payloads de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Utilidades de escritura de configuración de canal | Utilidades de autorización para escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de plugins de canal |
  | `plugin-sdk/channel-status` | Utilidades de estado de canal | Utilidades compartidas de snapshot/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilidades de configuración de listas de permitidos | Utilidades de edición/lectura de configuración de listas de permitidos |
  | `plugin-sdk/group-access` | Utilidades de acceso a grupos | Utilidades compartidas de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Utilidades de DM directo | Utilidades compartidas de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Utilidades compartidas de extensiones | Primitivas auxiliares de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Utilidades de destinos de Webhook | Registro de destinos de Webhook y utilidades de instalación de rutas |
  | `plugin-sdk/webhook-path` | Utilidades de rutas de Webhook | Utilidades de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Utilidades compartidas de medios web | Utilidades de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Utilidades empaquetadas de memory-core | Superficie de utilidades del gestor de memoria/configuración/archivos/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y utilidades genéricas por lotes/remotas; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Utilidades multimodales del host de memoria | Utilidades multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Utilidades de consultas del host de memoria | Utilidades de consultas del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Utilidades de secretos del host de memoria | Utilidades de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Utilidades del diario de eventos del host de memoria | Utilidades del diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Utilidades de estado del host de memoria | Utilidades de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Utilidades de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución core del host de memoria | Utilidades de tiempo de ejecución core del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilidades de archivos/tiempo de ejecución del host de memoria | Utilidades de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de tiempo de ejecución core del host de memoria | Alias neutral respecto al proveedor para las utilidades de tiempo de ejecución core del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para las utilidades del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para las utilidades de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Utilidades de Markdown gestionado | Utilidades compartidas de Markdown gestionado para plugins adyacentes a la memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para las utilidades de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Utilidades empaquetadas de memory-lancedb | Superficie de utilidades de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Utilidades y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no la
superficie completa del SDK. La lista completa de más de 200 puntos de entrada está en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas uniones de utilidades de plugins empaquetados como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Estas siguen exportándose para
mantenimiento y compatibilidad de plugins empaquetados, pero se omiten
intencionalmente de la tabla común de migración y no son el destino recomendado para
código nuevo de plugins.

La misma regla se aplica a otras familias de utilidades empaquetadas como:

- utilidades de compatibilidad con navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de utilidades/plugins empaquetados como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

Actualmente `plugin-sdk/github-copilot-token` expone la superficie específica
de utilidades de token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con la tarea. Si no puedes encontrar una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                  | Qué sucede                                                             |
| ----------------------- | ---------------------------------------------------------------------- |
| **Ahora**               | Las superficies obsoletas emiten advertencias en tiempo de ejecución   |
| **Próxima versión mayor** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins del core ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión mayor.

## Suprimir temporalmente las advertencias

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer Plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — crear plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crear plugins de proveedor
- [Aspectos internos de los plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
