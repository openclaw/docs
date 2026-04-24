---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditando las subrutas de Plugins incluidos y las superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones van dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  El SDK de Plugin se expone como un conjunto de subrutas estrechas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas de uso común agrupadas por propósito. La lista
  completa generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas auxiliares reservadas para Plugins incluidos aparecen allí, pero son un
  detalle de implementación salvo que una página de documentación las promueva explícitamente.

  Para la guía de creación de Plugins, consulta [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

  ## Entrada del Plugin

  | Subruta                    | Exportaciones clave                                                                                                                    |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartidos del asistente de configuración, prompts de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuración/compuerta de acciones de múltiples cuentas, auxiliares de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Auxiliares de búsqueda de cuenta + reserva predeterminada |
    | `plugin-sdk/account-helpers` | Auxiliares estrechos para lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración del canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalización/validación de comandos personalizados de Telegram con reserva de contrato incluido |
    | `plugin-sdk/command-gating` | Auxiliares estrechos de compuerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, auxiliares de ciclo de vida/finalización de flujos borrador |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartidos de ruta entrante + constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartidos para registrar y despachar entradas |
    | `plugin-sdk/messaging-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Auxiliares compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidad saliente, delegado de envío y planificación de cargas útiles |
    | `plugin-sdk/poll-runtime` | Auxiliares estrechos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida y adaptador de asociaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil de medios del agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de asociación de conversación/hilo, emparejamiento y asociaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolución de política de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Auxiliares compartidos de instantánea/resumen del estado del canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estrechas del esquema de configuración del canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorización de escritura de configuración del canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas del Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de lectura/edición de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Auxiliares compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Auxiliares compartidos de autenticación/protección para mensajes directos |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y auxiliares heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para antirrebote de entradas, coincidencia de menciones, auxiliares de política de mención y auxiliares de sobre |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares estrechos de antirrebote de entradas |
    | `plugin-sdk/channel-mention-gating` | Auxiliares estrechos de política de mención y texto de mención sin la superficie más amplia del tiempo de ejecución de entradas |
    | `plugin-sdk/channel-envelope` | Auxiliares estrechos de formato de sobre de entrada |
    | `plugin-sdk/channel-location` | Auxiliares de contexto y formato de ubicación del canal |
    | `plugin-sdk/channel-logging` | Auxiliares de registro de canal para descartes de entrada y fallos de escritura/acuse |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Auxiliares de acciones de mensajes del canal, además de auxiliares de esquema nativo obsoletos conservados para compatibilidad con Plugins |
    | `plugin-sdk/channel-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato del canal |
    | `plugin-sdk/channel-feedback` | Conexión de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estrechos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolución de claves API en tiempo de ejecución para Plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación/escritura de perfiles de claves API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de Auth OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartidos de inicio de sesión interactivo para Plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de búsqueda de variables de entorno de Auth del proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de repetición, auxiliares de endpoint del proveedor y auxiliares de normalización de id de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidad HTTP/endpoint del proveedor, incluidos auxiliares de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estrechos de contrato de configuración/selección de captura web como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/caché de proveedores de captura web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan conexión de habilitación del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estrechos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/caché/tiempo de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y auxiliares de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y auxiliares compartidos de envoltorios para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares nativos de transporte del proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos escribibles de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de parche de configuración para incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/caché local al proceso |
    | `plugin-sdk/group-activation` | Auxiliares estrechos de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de Auth y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares del registro de comandos, auxiliares de autorización del remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y Auth de acciones dentro del mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprobación para exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartido de resolución del Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del tiempo de ejecución del controlador de aprobación; prefiere las uniones más estrechas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprobación + asociación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de carga útil de respuesta de aprobación para exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Auxiliares estrechos de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estrechos de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Auxiliares de Auth de comandos nativos + auxiliares nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas activas del canal |
    | `plugin-sdk/command-surface` | Auxiliares de normalización del cuerpo de comandos y de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estrechos de recopilación de contratos de secretos para superficies de secretos de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estrechos de tipado `coerceSecretRef` y SecretRef para el análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Auxiliares compartidos de confianza, restricción de mensajes directos, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF para listas de hosts permitidos y redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estrechos de dispatcher fijado sin la amplia superficie del tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño del cuerpo/tiempo de espera de la solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Amplios auxiliares de tiempo de ejecución/registro/copias de seguridad/instalación de Plugins |
    | `plugin-sdk/runtime-env` | Auxiliares estrechos de entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro y búsqueda del contexto de tiempo de ejecución del canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartidos de comandos/hooks/http/interacción del Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartidos de la canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importación/asociación diferida del tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Auxiliares de formato CLI, espera y versión |
    | `plugin-sdk/gateway-runtime` | Auxiliares del cliente Gateway y de parche de estado del canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carga/escritura de configuración y auxiliares de búsqueda de configuración del Plugin |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivos sin el amplio barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprobación de exec/Plugin, constructores de capacidad de aprobación, auxiliares de Auth/perfil, auxiliares nativos de enrutamiento/tiempo de ejecución |
    | `plugin-sdk/reply-runtime` | Auxiliares compartidos del tiempo de ejecución de entradas/respuestas, fragmentación, despacho, heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estrechos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Auxiliares compartidos de historial de respuestas de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares estrechos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de ruta del almacén de sesiones + actualización de `updated-at` |
    | `plugin-sdk/state-paths` | Auxiliares de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de asociación de ruta/clave de sesión/cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartidos de resumen de estado de canal/cuenta, valores predeterminados del estado en tiempo de ejecución y auxiliares de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena de entradas tipo fetch/solicitud |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados `stdout`/`stderr` normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramienta/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Auxiliares compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Auxiliares de registrador de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo y conversión de tablas markdown |
    | `plugin-sdk/json-store` | Auxiliares pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de asociaciones ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estrechas del esquema de configuración en tiempo de ejecución del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de inicio de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas para canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de respuestas de proveedor/comando `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares nativos de registro/construcción/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental para Plugins de confianza para harnesses de agente de bajo nivel: tipos de harness, auxiliares de control/aborto de ejecuciones activas, auxiliares del puente de herramientas de OpenClaw, auxiliares de formato/detalle de progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detección de endpoints de Z.A.I |
    | `plugin-sdk/infra-runtime` | Auxiliares de eventos del sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Auxiliares pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de indicadores y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Auxiliares de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la amplia superficie de tiempo de ejecución de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de asociación de conversación sin enrutamiento de asociaciones configuradas ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de lectura del almacén de sesiones sin importaciones amplias de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares estrechos de coerción y normalización de cadenas/registros primitivos sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Auxiliares de normalización de nombre de host y host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Auxiliares de directorio/identidad/espacio de trabajo del agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartidos de obtención/transformación/almacenamiento de medios, además de constructores de cargas útiles de medios |
    | `plugin-sdk/media-store` | Auxiliares estrechos de almacenamiento de medios como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de conmutación por error de generación de medios, selección de candidatos y mensajería para modelos faltantes |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones auxiliares orientadas a proveedores para imagen/audio |
    | `plugin-sdk/text-runtime` | Auxiliares compartidos de texto/markdown/registro como eliminación de texto visible para el asistente, auxiliares de renderizado/fragmentación/tablas markdown, auxiliares de redacción, auxiliares de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de auxiliares orientados a proveedores para directivas, registro y validación |
    | `plugin-sdk/speech-core` | Auxiliares compartidos de tipos de proveedores de voz, registro, directivas y normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real y auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Auxiliares compartidos de tipos, conmutación por error, Auth y registro de generación de imágenes |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Auxiliares compartidos de tipos de generación de música, conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Auxiliares compartidos de tipos de generación de video, conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/webhook-targets` | Auxiliares de registro de destinos Webhook e instalación de rutas |
    | `plugin-sdk/webhook-path` | Auxiliares de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Auxiliares compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar incluida de memory-core para auxiliares de administrador/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y auxiliares genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consultas del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principales del tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para auxiliares principales del tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para auxiliares de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de markdown administrado para Plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar incluida de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas auxiliares incluidas reservadas">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de compatibilidad del Plugin de navegador incluido (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie auxiliar/de tiempo de ejecución incluida de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie auxiliar/de tiempo de ejecución incluida de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie auxiliar incluida de IRC |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Uniones de compatibilidad/auxiliares de canales incluidos |
    | Auxiliares específicos de Auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Uniones auxiliares de funciones/Plugins incluidos; `plugin-sdk/github-copilot-token` actualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de Plugins](/es/plugins/building-plugins)
