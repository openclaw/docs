---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para una importación de Plugin
    - Auditoría de subrutas de Plugin incluido y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones están en cada lugar, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T05:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  El SDK de plugins se expone como un conjunto de subrutas específicas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas de uso común agrupadas por propósito. La lista
  completa generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas reservadas de ayudantes para plugins incluidos aparecen allí, pero son un detalle de
  implementación a menos que una página de documentación las promueva explícitamente. Los mantenedores pueden auditar las subrutas
  activas reservadas de ayudantes con `pnpm plugins:boundary-report:summary`; las exportaciones
  reservadas de ayudantes no usadas hacen fallar el informe de CI en lugar de permanecer en el SDK público
  como deuda de compatibilidad latente.

  Para la guía de creación de plugins, consulta [Resumen del SDK de Plugin](/es/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subruta                                   | Exportaciones clave                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel amplio de compatibilidad para pruebas de plugins heredadas; prefiere subrutas de prueba específicas para nuevas pruebas de extensiones                                                                     |
  | `plugin-sdk/plugin-test-api`              | Constructor mínimo de mocks de `OpenClawPluginApi` para pruebas unitarias directas de registro de plugins                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato del adaptador nativo de tiempo de ejecución de agentes para perfiles de autenticación, supresión de entregas, clasificación de alternativas, hooks de herramientas, superposiciones de prompts, esquemas y reparación de transcripciones |
  | `plugin-sdk/channel-test-helpers`         | Ayudantes de prueba para ciclo de vida de cuentas de canal, directorio, configuración de envío, mock de tiempo de ejecución, hook, entrada de canal incluido, marca de tiempo de sobre, respuesta de emparejamiento y contrato genérico de canal   |
  | `plugin-sdk/channel-target-testing`       | Suite compartida de pruebas de casos de error de resolución de destinos de canal                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Ayudantes de contrato para registro de plugins, manifiesto de paquete, artefacto público, API de tiempo de ejecución, efectos secundarios de importación e importación directa                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures para pruebas de tiempo de ejecución de plugins, registro, registro de proveedores, asistente de configuración y TaskFlow de tiempo de ejecución                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Ayudantes de contrato para tiempo de ejecución de proveedor, autenticación, descubrimiento, incorporación, catálogo, capacidad multimedia, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y asistente                 |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticación optativos de Vitest para pruebas de proveedores que ejercitan `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures de entorno de prueba, fetch/red, servidor HTTP desechable, solicitud entrante, prueba en vivo, sistema de archivos temporal y control de tiempo                                        |
  | `plugin-sdk/test-fixtures`                | Fixtures genéricos de prueba para CLI, sandbox, skill, mensaje de agente, evento del sistema, recarga de módulo, ruta de plugin incluido, terminal, fragmentación, token de autenticación y caso tipado                   |
  | `plugin-sdk/test-node-mocks`              | Ayudantes específicos de mocks integrados de Node para usar dentro de fábricas Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Ayudantes de elementos de proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elemento, ayudantes de censura y `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Ayudantes de migración de tiempo de ejecución como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, prompts de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración/puerta de acciones para múltiples cuentas, ayudantes de alternativa de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuenta y alternativa predeterminada |
    | `plugin-sdk/account-helpers` | Ayudantes específicos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas del esquema de configuración de canal y constructor genérico |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canal incluido de OpenClaw solo para plugins incluidos mantenidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Ayudantes de normalización/validación de comandos personalizados de Telegram con alternativa de contrato incluido |
    | `plugin-sdk/command-gating` | Ayudantes específicos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, ayudantes de ciclo de vida/finalización de flujos de borrador |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos para ruta entrante y constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Ayudantes compartidos de registro y despacho entrantes |
    | `plugin-sdk/messaging-targets` | Ayudantes de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos para carga de medios salientes |
    | `plugin-sdk/outbound-send-deps` | Búsqueda ligera de dependencias de envío saliente para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Ayudantes de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de payloads |
    | `plugin-sdk/poll-runtime` | Ayudantes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Ayudantes de ciclo de vida y adaptador para vinculaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload de medios de agente |
    | `plugin-sdk/conversation-runtime` | Ayudantes de conversación/vinculación de hilos, emparejamiento y vinculación configurada |
    | `plugin-sdk/runtime-config-snapshot` | Ayudante de snapshot de configuración de tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de política de grupo de tiempo de ejecución |
    | `plugin-sdk/channel-status` | Ayudantes compartidos de snapshot/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Ayudantes compartidos de decisión de acceso de grupo |
    | `plugin-sdk/direct-dm` | Ayudantes compartidos de autenticación/guardia de DM directo |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad de propietario rastreada; los plugins nuevos deben usar subrutas genéricas del SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad de propietario rastreada; los plugins nuevos deben usar ayudantes de tiempo de ejecución inyectados o subrutas genéricas del SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes publicados de Lark/Zalo que aún importan autorización de comandos de remitente; los plugins nuevos deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Ayudantes de presentación semántica de mensajes, entrega y respuestas interactivas heredadas. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, ayudantes de política de mención y ayudantes de sobres |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes específicos de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Ayudantes específicos de política de mención, marcador de mención y texto de mención sin la superficie más amplia de tiempo de ejecución entrante |
    | `plugin-sdk/channel-envelope` | Ayudantes específicos de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Ayudantes de contexto de ubicación de canal y formato |
    | `plugin-sdk/channel-logging` | Ayudantes de registro de canal para descartes entrantes y fallos de escritura/confirmación |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Ayudantes de acción de mensajes de canal, más ayudantes obsoletos de esquema nativo conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Ayudantes compartidos de normalización de rutas, resolución de destinos guiada por analizador, conversión de id de hilo a string, claves de ruta de deduplicación/compactación, tipos de destino analizado y comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Ayudantes de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes específicos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor de LM Studio compatible para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada en tiempo de ejecución de LM Studio compatible para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y helpers de modelos cargados |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves de API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfiles de claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, helpers de endpoint de proveedor y helpers de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook en tiempo de ejecución de aumento del catálogo de proveedores y uniones de registro de plugin-proveedor para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedor, errores HTTP de proveedor y helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers acotados de contrato de configuración/selección de web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers acotados de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedores de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas + diagnósticos de Gemini, y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y helpers compartidos de envoltorios Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de proveedor, como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers acotados de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, incluido formato de menú de argumentos dinámicos, helpers de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprobación de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para entrypoints de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios en tiempo de ejecución del controlador de aprobaciones; prefiere las uniones de adaptador/Gateway más acotadas cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación + vinculación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprobación de exec/plugin, helpers nativos de enrutamiento/tiempo de ejecución de aprobaciones y helpers de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers acotados de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers acotados de pruebas de contrato de canales sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativa, formato de menú de argumentos dinámicos y helpers nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canal activas |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y helpers de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de recopilación de contratos de secretos para superficies de secretos de canales/plugins |
    | `plugin-sdk/secret-ref-runtime` | Helpers acotados de `coerceSecretRef` y tipado SecretRef para análisis de contrato de secretos/configuración |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, bloqueo de DM, contenido externo, censura de texto sensible, comparación de secretos en tiempo constante y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers acotados de dispatcher fijado sin la superficie amplia de runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF, error SSRF y helpers de política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño/timeout del cuerpo de la solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución, registro, copias de seguridad e instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers acotados de entorno de tiempo de ejecución, logger, timeout, reintentos y backoff |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfiles/valores predeterminados normalizados, análisis de URL CDP y helpers de autenticación de control del navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos, hooks, http e interacción de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de Webhook/hooks internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación diferida de tiempo de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores de protocolo de Gateway y helpers de parches de estado de canal |
    | `plugin-sdk/config-types` | Superficie de configuración solo de tipos para formas de configuración de plugin como `OpenClawConfig` y tipos de configuración de canal/proveedor |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugin en tiempo de ejecución, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutación transaccional de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantánea de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y setters de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram incluida no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autovínculos de referencias de archivo sin el barrel amplio de tiempo de ejecución de texto |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de ejecución/plugin, constructores de capacidades de aprobación, helpers de autenticación/perfil, helpers de enrutamiento/tiempo de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución de entrada/respuesta, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers y marcadores compartidos de historial de respuestas de ventana corta, como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers acotados de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta de almacén de sesiones, clave de sesión, actualización y mutación de almacén |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado del almacén Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de enrutamiento, clave de sesión y vinculación de cuenta, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con temporizador y resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descarga temporal |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y censura |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de anulación de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración del proveedor Talk |
    | `plugin-sdk/json-store` | Helpers pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Helpers ligeros de registro de backend ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas acotadas de esquema de configuración de tiempo de ejecución de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivos y tokens de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta del comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugins de confianza para arneses de agente de bajo nivel: tipos de arnés, helpers de dirección/cancelación de ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de políticas de herramientas de plan de tiempo de ejecución, clasificación de resultados de terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoints de Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia de tareas asíncronas acotada |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de deduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de eventos Heartbeat y visibilidad |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de disponibilidad del transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas de tiempo de ejecución enfocadas de arriba |
    | `plugin-sdk/collection-runtime` | Helpers pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de indicadores de diagnóstico, eventos y contexto de trazas |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato y clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers acotados de coerción y normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidad y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener/transformar/almacenar medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas útiles de medios |
    | `plugin-sdk/media-store` | Helpers específicos de almacenamiento de medios, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones de helpers de imagen/audio orientadas a proveedores |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/markdown/registro, como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas de markdown, helpers de redacción, helpers de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones orientadas a proveedores para directivas, registro, validación, constructor de TTS compatible con OpenAI y helpers de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de helpers de URL de recurso/datos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos para carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | Barrel amplio de compatibilidad para pruebas heredadas de Plugin. Las nuevas pruebas de extensión deben importar subrutas enfocadas del SDK, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para pruebas unitarias de registro directo de Plugin sin importar puentes de helpers de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativos de contratos de adaptador de tiempo de ejecución de agente para pruebas de autenticación, entrega, respaldo, enlace de herramienta, superposición de prompt, esquema y proyección de transcripción |
    | `plugin-sdk/channel-test-helpers` | Helpers de prueba orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, enhebrado de configuración de envío, mocks de tiempo de ejecución, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida de casos de error de resolución de destino para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contratos de paquete de Plugin, registro, artefacto público, importación directa, API de tiempo de ejecución y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers de contratos de tiempo de ejecución de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de repetición, audio en vivo STT en tiempo real, búsqueda/obtención web y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth de Vitest opcionales para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos de captura de tiempo de ejecución CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento de sistema, recarga de módulo, ruta de Plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers enfocados de mocks integrados de Node para usar dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie incluida de helpers memory-core para helpers de administrador/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor de base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para helpers de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para helpers de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown administrado para Plugins adyacentes a la memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Actualmente no hay subrutas reservadas del SDK para helpers incluidos. Los helpers específicos del propietario
    viven dentro del paquete de Plugin propietario, mientras que los contratos de host reutilizables
    usan subrutas genéricas del SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
