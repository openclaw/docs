---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditando subrutas de Plugins incluidos y superficies de helpers
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones viven dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T05:42:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  El SDK de Plugin se expone como un conjunto de subrutas estrechas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas de uso común agrupadas por propósito. La lista completa
  generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas reservadas de helpers de Plugins incluidos aparecen allí, pero son
  detalle de implementación salvo que una página de documentación las promocione explícitamente.

  Para la guía de creación de Plugins, consulta [Resumen del SDK de Plugin](/es/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subpath                     | Key exports                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/puertas de acción para varias cuentas, helpers de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta + reserva predeterminada |
    | `plugin-sdk/account-helpers` | Helpers estrechos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con reserva de contrato incluido |
    | `plugin-sdk/command-gating` | Helpers estrechos de control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalización de stream en borrador |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos para rutas entrantes y construcción de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos para registrar y despachar entradas |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Helpers compartidos para cargar medios salientes |
    | `plugin-sdk/outbound-runtime` | Helpers de identidad saliente, delegado de envío y planificación de carga útil |
    | `plugin-sdk/poll-runtime` | Helpers estrechos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptador para enlaces de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil multimedia del agente |
    | `plugin-sdk/conversation-runtime` | Helpers para enlaces de conversación/hilo, emparejamiento y enlaces configurados |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de política de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estrechas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización para escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preludio de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers para editar/leer configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos para decisiones de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/protección para mensajes directos |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y helpers heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, helpers de política de menciones y helpers de sobres |
    | `plugin-sdk/channel-inbound-debounce` | Helpers estrechos de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers estrechos de política de menciones y texto de mención sin la superficie más amplia del entorno entrante |
    | `plugin-sdk/channel-envelope` | Helpers estrechos de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Helpers de contexto y formato de ubicación del canal |
    | `plugin-sdk/channel-logging` | Helpers de registro de canal para descartes entrantes y fallos de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensajes de canal, además de helpers obsoletos de esquema nativo conservados por compatibilidad de Plugins |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers estrechos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers seleccionados para configuración de proveedores locales/autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers centrados para configuración de proveedores autoalojados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados de backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de clave API en tiempo de ejecución para Plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfil de clave API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers interactivos compartidos de inicio de sesión para Plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación del proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de reproducción, helpers de endpoint de proveedor y helpers de normalización de id de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidad HTTP/endpoint de proveedor, incluidos helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estrechos de contrato de configuración/selección de obtención web como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estrechos de configuración/credenciales para búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estrechos de contrato de configuración/credenciales para búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream y helpers compartidos de wrappers para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo del proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parche de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers estrechos para modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorización de remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolución de aprobadores y helpers de autenticación de acción en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro para aprobaciones nativas de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de gateway para aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptador nativo de aprobaciones para puntos de entrada de canal en caliente |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de tiempo de ejecución para controladores de aprobación; prefiere los seams más estrechos de adaptador/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación + enlace de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga útil de respuesta para aprobaciones de ejecución/Plugin |
    | `plugin-sdk/reply-dedupe` | Helpers estrechos de reinicio de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers estrechos de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticación de comandos + destino de sesión nativa |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canal en caliente |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo de comandos y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estrechos de recopilación de contrato de secretos para superficies de secretos de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estrechos `coerceSecretRef` y tipado SecretRef para análisis de contrato de secretos/configuración |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, control de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de permitidos de hosts y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estrechos de dispatcher fijado sin la amplia superficie de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño de cuerpo/tiempo de espera de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución/registro/copia de seguridad/instalación de Plugins |
    | `plugin-sdk/runtime-env` | Helpers estrechos de entorno de tiempo de ejecución, logger, timeout, retry y backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactivo del Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de pipeline de hooks webhook/internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/enlace perezoso de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato, espera y versión para CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente Gateway y de parche de estado de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración y de búsqueda de configuración de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie contractual incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autolink de referencias de archivo sin el barrel amplio `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de ejecución/Plugin, constructores de capacidad de aprobación, helpers de autenticación/perfil, helpers nativos de enrutamiento/tiempo de ejecución |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución para entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estrechos de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial corto de respuestas como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estrechos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta de almacén de sesión + updated-at |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de enlace de ruta/clave de sesión/cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolvedor de destinos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extrae URL en cadena de entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío de argumentos de herramienta |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo y conversión de tablas Markdown |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivo reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de enlace ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estrechas de esquema de configuración de tiempo de ejecución del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta para comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental para Plugins de confianza de harness de agente de bajo nivel: tipos de harness, helpers de steer/abort de ejecución activa, helpers de puente de herramientas OpenClaw y utilidades de resultados de intento |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de banderas y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución con conocimiento de dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la amplia superficie de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de enlace de conversación sin enrutamiento de enlaces configurados ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de lectura de almacén de sesión sin importaciones amplias de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin amplias importaciones de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers estrechos de coerción/normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y SCP host |
    | `plugin-sdk/retry-runtime` | Helpers de configuración y ejecución de retry |
    | `plugin-sdk/agent-runtime` | Helpers de dir/identidad/espacio de trabajo del agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorio respaldado por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidad y pruebas">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de obtención/transformación/almacenamiento multimedia más constructores de carga útil multimedia |
    | `plugin-sdk/media-store` | Helpers estrechos de almacén multimedia como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación multimedia, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión multimedia más exportaciones de helpers de imagen/audio orientados al proveedor |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/Markdown/registro como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas de Markdown, helpers de redacción, helpers de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más helpers de directiva, registro y validación orientados al proveedor |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva y helpers de normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, helpers de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado para generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de referencia de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado para generación de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de vídeo, helpers de conmutación por error, búsqueda de proveedor y análisis de referencia de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos de webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga multimedia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de helpers `memory-core` incluida para helpers de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers del tiempo de ejecución core del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral de proveedor para helpers del tiempo de ejecución core del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral de proveedor para helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral de proveedor para helpers de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de Markdown gestionado para Plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral de proveedor para helpers de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie de helpers `memory-lancedb` incluida |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de compatibilidad para el Plugin de navegador incluido (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie de helpers/tiempo de ejecución de Matrix incluido |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie de helpers/tiempo de ejecución de LINE incluido |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie de helpers de IRC incluido |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams de compatibilidad/helpers de canales incluidos |
    | Helpers específicos de autenticación/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams de helpers de funciones/Plugins incluidos; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Construcción de Plugins](/es/plugins/building-plugins)
