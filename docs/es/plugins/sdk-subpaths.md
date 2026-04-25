---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de plugin
    - Auditar subrutas de plugins integrados y superficies auxiliares
summary: 'Catálogo de subrutas de Plugin SDK: qué importaciones viven dónde, agrupadas por área'
title: Subrutas de Plugin SDK
x-i18n:
    generated_at: "2026-04-25T18:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  El Plugin SDK se expone como un conjunto de subrutas específicas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas más usadas agrupadas por propósito. La lista
  completa generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas auxiliares reservadas para plugins integrados aparecen allí, pero son un detalle
  de implementación a menos que una página de documentación las promueva explícitamente.

  Para la guía de creación de plugins, consulta [Resumen de Plugin SDK](/es/plugins/sdk-overview).

  ## Entrada del plugin

  | Subruta                    | Exportaciones clave                                                                                                                    |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de lista permitida, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/marca de acción de múltiples cuentas, helpers alternativos de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta + alternativa predeterminada |
    | `plugin-sdk/account-helpers` | Helpers específicos de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con alternativa de contrato integrado |
    | `plugin-sdk/command-gating` | Helpers específicos de puertas de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalización de flujo borrador |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante + constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Helpers de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de carga |
    | `plugin-sdk/poll-runtime` | Helpers específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptadores de asociación de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga de medios del agente |
    | `plugin-sdk/conversation-runtime` | Helpers de asociación de conversación/hilo, emparejamiento y asociaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de política de grupo en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado del canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lectura/edición de configuración de lista permitida |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/guarda de DM directa |
    | `plugin-sdk/interactive-runtime` | Helpers de presentación semántica de mensajes, entrega y respuesta interactiva heredada. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, helpers de política de menciones y helpers de sobres |
    | `plugin-sdk/channel-inbound-debounce` | Helpers específicos de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers específicos de política de menciones y texto de menciones sin la superficie más amplia de runtime entrante |
    | `plugin-sdk/channel-envelope` | Helpers específicos de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Helpers de contexto y formato de ubicación de canal |
    | `plugin-sdk/channel-logging` | Helpers de registro del canal para descartes entrantes y fallos de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensajes del canal, además de helpers de esquema nativo obsoletos conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexión de retroalimentación/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers específicos de contratos de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autoalojados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de runtime para resolución de claves de API para plugins de proveedores |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfiles de claves de API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedores |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación del proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de reproducción, helpers de endpoint de proveedor y helpers de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidades de endpoint del proveedor, errores HTTP del proveedor y helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers específicos de contrato de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers específicos de configuración/credenciales de web-search para proveedores que no necesitan habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Helpers específicos de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/runtime de proveedores web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquema Gemini y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de flujo y helpers compartidos de wrappers para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de proveedores como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parche de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers específicos de modo de activación de grupos y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, incluido el formato dinámico de menú de argumentos, helpers de autorización del remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprobación de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de gateway de aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de runtime del manejador de aprobaciones; prefiere los puntos de conexión más específicos de adaptador/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación + asociación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga de respuesta de aprobación de ejecución/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de carga de aprobación de ejecución/plugin, helpers nativos de enrutamiento/runtime de aprobación y helpers estructurados de visualización de aprobaciones como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers específicos para reinicio de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers específicos de prueba de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticación de comandos, formato dinámico de menú de argumentos y helpers nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas activas de canal |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo de comandos y de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers específicos de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers específicos de tipado de `coerceSecretRef` y SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, puertas de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista permitida de hosts y de política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers específicos de dispatcher fijado sin la superficie amplia de runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño de cuerpo de solicitud/tiempo de espera |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de runtime/registro/copias de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers específicos de entorno de runtime, logger, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactive de plugins |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de pipeline de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/asociación diferida de runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente de Gateway y de parches de estado de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración y de búsqueda de configuración de plugins |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato integrada de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autolink de referencias de archivo sin el barrel amplio `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de ejecución/plugin, constructores de capacidad de aprobación, helpers de autenticación/perfil, helpers nativos de enrutamiento/runtime y formato estructurado de rutas de visualización de aprobación |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de runtime de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta de almacén de sesión + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión/asociación de cuentas como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extraer URL de cadena de entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extraer cargas normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistemas y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo y conversión de tablas Markdown |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de bloqueo de archivos |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de asociación ACP de solo lectura sin importaciones de arranque del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas del esquema de configuración de runtime del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque del dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas para canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de proveedor/comando `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/compilación/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para harnesses de agente de bajo nivel: tipos de harness, helpers para dirigir/abortar ejecuciones activas, helpers de puente de herramientas de OpenClaw, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoint de Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flags y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, helpers compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime con conocimiento de dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la amplia superficie de runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de asociación de conversación sin enrutamiento de asociación configurada ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de lectura de almacén de sesión sin importaciones amplias de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers específicos de coerción y normalización de registros/cadenas primitivas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintento y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo del agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios basada en configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de obtención/transformación/almacenamiento de medios, además de constructores de carga de medios |
    | `plugin-sdk/media-store` | Helpers específicos de almacenamiento de medios como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error de generación de medios, selección de candidatos y mensajería de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios, además de exportaciones auxiliares de imagen/audio orientadas al proveedor |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/markdown/registro como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de redacción, helpers de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz, además de exportaciones auxiliares orientadas al proveedor para directivas, registro, validación y voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, exportaciones auxiliares de registro, directivas, normalización y voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, helpers de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación musical |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación musical, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores de Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar integrada memory-core para helpers de administrador/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto del proveedor para los helpers de runtime principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto del proveedor para los helpers del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto del proveedor para los helpers de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown administrado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto del proveedor para los helpers de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar integrada memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas auxiliares integradas reservadas">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de soporte para el plugin integrado de navegador. `browser-profiles` exporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` y `ResolvedBrowserTabCleanupConfig` para la forma normalizada `browser.tabCleanup`. `browser-support` sigue siendo el barrel de compatibilidad. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie integrada de helpers/runtime de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie integrada de helpers/runtime de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie integrada de helpers de IRC |
    | Helpers específicos de canales | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Puntos de conexión integrados de compatibilidad/helpers de canales |
    | Helpers específicos de autenticación/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Puntos de conexión integrados de helpers de funciones/plugins; `plugin-sdk/github-copilot-token` actualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de Plugin SDK](/es/plugins/sdk-overview)
- [Configuración de Plugin SDK](/es/plugins/sdk-setup)
- [Compilación de plugins](/es/plugins/building-plugins)
