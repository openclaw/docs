---
read_when:
    - Elegir la subruta correcta de plugin-sdk para un import de plugin
    - Auditar subrutas de plugins incluidos y superficies helper
summary: 'Catálogo de subrutas del SDK de Plugin: qué imports viven dónde, agrupados por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  El SDK de Plugin se expone como un conjunto de subrutas limitadas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas más usadas agrupadas por propósito. La lista completa
  generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas reservadas de helpers de plugins incluidos aparecen allí, pero son un detalle
  de implementación salvo que una página de documentación las promocione explícitamente.

  Para la guía de creación de plugins, consulta [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subruta                    | Exportaciones principales                                                                                                                |
  | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                      |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                         |
  | `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                        |

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos para asistentes de configuración, prompts de allowlist, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/controles de acción para varias cuentas, helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta + fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers limitados de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato incluido |
    | `plugin-sdk/command-gating` | Helpers limitados para control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalización de draft stream |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de construcción de ruta entrante + sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-send-deps` | Búsqueda ligera de dependencias de envío saliente para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de cargas útiles |
    | `plugin-sdk/poll-runtime` | Helpers limitados de normalización de sondeos |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida de thread-binding y adaptador |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de cargas útiles de medios del agente |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversación/hilo, emparejamiento y binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de políticas de grupo en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas limitadas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preludio de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lectura/edición de configuración de allowlist |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/protección de DM directo |
    | `plugin-sdk/interactive-runtime` | Helpers de presentación semántica de mensajes, entrega y respuesta interactiva heredada. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para helpers de debounce entrante, coincidencia de menciones, política de mención y sobre |
    | `plugin-sdk/channel-inbound-debounce` | Helpers limitados de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers limitados de política de mención y texto de mención sin la superficie más amplia de runtime entrante |
    | `plugin-sdk/channel-envelope` | Helpers limitados de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Helpers de contexto y formato de ubicación de canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes entrantes y fallos de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensaje de canal, además de helpers de esquema nativo obsoletos conservados por compatibilidad de plugins |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexión de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers limitados de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/alojados por uno mismo |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores alojados por uno mismo compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados de backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de clave API en runtime para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfiles de clave API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, helpers de endpoint de proveedor y helpers de normalización de id de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedor, errores HTTP de proveedor y helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers limitados de contrato de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedor web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers limitados de configuración/credenciales de búsqueda web para proveedores que no necesitan conexión de habilitación de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers limitados de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters limitados de credenciales |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/runtime de proveedor de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream y helpers compartidos de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo de proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parche de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers limitados de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos incluyendo formato dinámico de menús de argumentos, helpers de autorización de remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprobaciones nativas de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidad/entrega de aprobaciones nativas |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de aprobaciones del gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para entrypoints de canal frecuentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de runtime de manejadores de aprobación; prefiere las interfaces más limitadas de adaptador/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación + binding de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga útil de respuesta de aprobaciones exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de carga útil de aprobaciones exec/plugin, helpers nativos de enrutamiento/runtime de aprobación y helpers estructurados de visualización de aprobaciones como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers limitados para reinicio de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers limitados de prueba de contrato de canal sin el barrel amplio de testing |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticación de comandos, formato dinámico de menús de argumentos y helpers de destino de sesión nativa |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas frecuentes de canal |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo del comando y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers limitados de recopilación de contrato de secretos para superficies secretas de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers limitados de tipado `coerceSecretRef` y SecretRef para análisis de contrato/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, control de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de hosts y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers limitados de dispatcher fijado sin la amplia superficie de runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño/timeout del cuerpo de la solicitud |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de runtime/logging/backup/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers limitados de entorno de runtime, logger, timeout, retry y backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comando/hook/http/interactive de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/binding perezoso de runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato CLI, espera, versión, invocación de argumentos y grupos perezosos de comandos |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente del Gateway y de parche de estado de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración y de búsqueda de configuración de plugins |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando no está disponible la superficie de contrato de Telegram incluida |
    | `plugin-sdk/text-autolink-runtime` | Detección de autolinks de referencias de archivos sin el barrel amplio de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación exec/plugin, constructores de capacidad de aprobación, helpers de autenticación/perfil, helpers nativos de enrutamiento/runtime y formato estructurado de rutas de visualización de aprobación |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de runtime de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers limitados de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas en ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers limitados de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta del almacén de sesiones + updated-at |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de ruta/clave de sesión/binding de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y metadata de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/string |
    | `plugin-sdk/request-url` | Extrae URL en string de entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de tool/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo y conversión de tablas Markdown |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de bloqueo de archivos |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sesión ACP y de despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución ACP de binding en solo lectura sin imports de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas limitadas del esquema de configuración de runtime de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo y de token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas helper compartidas para canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para arneses de agente de bajo nivel: tipos de arnés, helpers de steer/abort de ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de política de herramientas del plan de runtime, clasificación de resultados terminales, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoints Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de banderas y eventos diagnósticos |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime con reconocimiento de dispatcher sin imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la amplia superficie de runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de binding de conversación sin enrutamiento de binding configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de lectura del almacén de sesiones sin imports amplios de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin imports amplios de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers limitados de coerción y normalización de registros/string primitivos sin imports de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración y ejecutor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldadas por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y testing">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de fetch/transformación/almacenamiento de medios más constructores de cargas útiles de medios |
    | `plugin-sdk/media-store` | Helpers limitados de almacén de medios como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de fallback de generación de medios, selección de candidatos y mensajes de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios más exportaciones de helpers orientados a proveedor para imagen/audio |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/Markdown/logging como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de redacción, helpers de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más exportaciones de directiva, registro, validación y helpers de voz orientados a proveedor |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, fallback, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de fallback, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de fallback, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/webhook-targets` | Helpers de registro de destinos de Webhook e instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar agrupada de memory-core para auxiliares de manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor de base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y auxiliares genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principales de tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los auxiliares principales de tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para los auxiliares de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de markdown gestionado para plugins adyacentes a la memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso a search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para los auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar agrupada de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares agrupados">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de soporte del plugin de navegador agrupados. `browser-profiles` exporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` y `ResolvedBrowserTabCleanupConfig` para la forma normalizada de `browser.tabCleanup`. `browser-support` sigue siendo el barrel de compatibilidad. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie agrupada de auxiliares/tiempo de ejecución de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie agrupada de auxiliares/tiempo de ejecución de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie agrupada de auxiliares de IRC |
    | Auxiliares específicos del canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams agrupados de compatibilidad/auxiliares de canal |
    | Auxiliares específicos de auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams agrupados de auxiliares de funciones/plugins; `plugin-sdk/github-copilot-token` actualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
