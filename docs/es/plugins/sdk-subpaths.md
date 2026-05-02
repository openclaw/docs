---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditoría de subrutas de Plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se ubican dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-05-02T21:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  El SDK de Plugin se expone como un conjunto de subrutas estrechas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas de uso común agrupadas por propósito. La lista
  completa generada de más de 200 subrutas reside en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas auxiliares reservadas de plugins incluidos aparecen allí, pero son un
  detalle de implementación salvo que una página de documentación las promueva explícitamente. Los mantenedores pueden auditar las subrutas auxiliares reservadas
  activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
  reservadas sin usar hacen fallar el informe de CI en lugar de permanecer en el SDK público
  como deuda de compatibilidad inactiva.

  Para la guía de creación de plugins, consulta [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subruta                                   | Exportaciones clave                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel amplio de compatibilidad para pruebas heredadas de plugins; prefiere subrutas de prueba enfocadas para nuevas pruebas de extensiones                                                                     |
  | `plugin-sdk/plugin-test-api`              | Constructor mínimo de mocks de `OpenClawPluginApi` para pruebas unitarias directas de registro de plugins                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativas de contrato del adaptador de entorno de ejecución del agente para perfiles de autenticación, supresión de entrega, clasificación de fallback, hooks de herramientas, superposiciones de prompts, esquemas y reparación de transcripciones |
  | `plugin-sdk/channel-test-helpers`         | Ayudantes de prueba de ciclo de vida de cuentas de canal, directorio, configuración de envío, mock de entorno de ejecución, hook, entrada de canal incluido, marca de tiempo de sobre, respuesta de emparejamiento y contrato genérico de canal   |
  | `plugin-sdk/channel-target-testing`       | Suite compartida de pruebas de casos de error de resolución de destino de canal                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Ayudantes de contrato de registro de plugins, manifiesto de paquete, artefacto público, API de entorno de ejecución, efecto secundario de importación e importación directa                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de entorno de ejecución de plugins, registro, registro de proveedores, asistente de configuración y flujo de tareas de entorno de ejecución para pruebas                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Ayudantes de contrato de entorno de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, capacidad multimedia, política de reproducción, audio en vivo de STT en tiempo real, búsqueda/obtención web y asistente                 |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticación opcionales de Vitest para pruebas de proveedores que ejercitan `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures de entorno de prueba, fetch/red, servidor HTTP descartable, solicitud entrante, prueba en vivo, sistema de archivos temporal y control de tiempo                                        |
  | `plugin-sdk/test-fixtures`                | Fixtures genéricas de prueba de CLI, sandbox, Skills, mensaje de agente, evento del sistema, recarga de módulo, ruta de Plugin incluido, terminal, fragmentación, token de autenticación y caso tipado                   |
  | `plugin-sdk/test-node-mocks`              | Ayudantes enfocados de mocks integrados de Node para usar dentro de fábricas de Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Ayudantes de elementos del proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elemento, ayudantes de redacción y `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Ayudantes de migración en tiempo de ejecución como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                                    |

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
    | `plugin-sdk/account-core` | Ayudantes de configuración multicuenta/puerta de acciones, ayudantes de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas + fallback predeterminado |
    | `plugin-sdk/account-helpers` | Ayudantes estrechos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquema de configuración de canal más constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos de OpenClaw solo para plugins incluidos mantenidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Ayudantes de normalización/validación de comandos personalizados de Telegram con fallback de contrato incluido |
    | `plugin-sdk/command-gating` | Ayudantes estrechos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, ayudantes de ciclo de vida/finalización de stream de borradores |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos de ruta entrante + constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Ayudantes compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Ayudantes de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-send-deps` | Búsqueda ligera de dependencias de envío saliente para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Ayudantes de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de carga útil |
    | `plugin-sdk/poll-runtime` | Ayudantes estrechos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Ayudantes de ciclo de vida y adaptador de enlaces de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil multimedia de agente |
    | `plugin-sdk/conversation-runtime` | Ayudantes de enlaces de conversación/hilo, emparejamiento y enlaces configurados |
    | `plugin-sdk/runtime-config-snapshot` | Ayudante de instantánea de configuración de entorno de ejecución |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de política de grupo en entorno de ejecución |
    | `plugin-sdk/channel-status` | Ayudantes compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estrechas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preludio de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Ayudantes compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Ayudantes compartidos de autenticación/guardia de DM directo |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad de propietario rastreada; los nuevos plugins deben usar subrutas genéricas del SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad de propietario rastreada; los nuevos plugins deben usar ayudantes de entorno de ejecución inyectados o subrutas genéricas del SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes publicados de Lark/Zalo que todavía importan autorización de comandos de remitente; los nuevos plugins deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Ayudantes de presentación semántica de mensajes, entrega y respuesta interactiva heredada. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, ayudantes de política de mención y ayudantes de sobre |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes estrechos de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Ayudantes estrechos de política de mención, marcador de mención y texto de mención sin la superficie más amplia de entorno de ejecución entrante |
    | `plugin-sdk/channel-envelope` | Ayudantes estrechos de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Ayudantes de contexto de ubicación de canal y formato |
    | `plugin-sdk/channel-logging` | Ayudantes de registro de canal para descartes entrantes y fallos de escritura/acuse |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Ayudantes de acciones de mensajes de canal, más ayudantes de esquema nativo obsoletos conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Ayudantes compartidos de normalización de rutas, resolución de destinos impulsada por analizador, conversión de id de hilo a cadena, claves de ruta de deduplicación/compactación, tipos de destino analizado y comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Ayudantes de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes estrechos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor compatible de LM Studio para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución compatible de LM Studio para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y helpers de modelos cargados |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers centrados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves de API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfiles de claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, helpers de endpoints de proveedores y helpers de normalización de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución de aumento de catálogo de proveedores y uniones de registro de plugin-proveedor para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedores, errores HTTP de proveedores y helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers de contrato estrechos de configuración/selección de web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estrechos de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Helpers estrechos de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedores de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de streaming y helpers compartidos de wrappers de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo de proveedores, como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parches de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singletons/mapas/cachés locales al proceso |
    | `plugin-sdk/group-activation` | Helpers estrechos de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, incluido el formato dinámico de menús de argumentos, helpers de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfiles/filtros de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canales activos |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de tiempo de ejecución de manejadores de aprobación; prefiere las uniones más estrechas de adaptador/Gateway cuando basten |
    | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación nativa + vinculación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de respuesta de aprobación de ejecución/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprobación de ejecución/plugin, helpers de enrutamiento/tiempo de ejecución de aprobación nativa y helpers de visualización estructurada de aprobación, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers estrechos de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers estrechos de pruebas de contrato de canales sin el barril amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico de menús de argumentos y helpers nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canales activas |
    | `plugin-sdk/command-surface` | Helpers de normalización de cuerpo de comandos y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estrechos de recopilación de contratos de secretos para superficies de secretos de canales/plugins |
    | `plugin-sdk/secret-ref-runtime` | Helpers estrechos de `coerceSecretRef` y tipado SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, control de DM, contenido externo, redacción de texto sensible, comparación de secretos en tiempo constante y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estrechos de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fijado, fetch protegido contra SSRF, error SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño/tiempo de espera del cuerpo de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución/registro/copia de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers específicos de entorno de tiempo de ejecución, logger, timeout, retry y backoff |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfil/valores predeterminados normalizados, análisis de URL de CDP y helpers de autenticación para control del navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactivos de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de hooks Webhook/internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación diferida de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de gateway, errores de protocolo de gateway y helpers de parches de estado de canal |
    | `plugin-sdk/config-types` | Superficie de configuración solo de tipos para formas de configuración de plugins como `OpenClawConfig` y tipos de configuración de canales/proveedores |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugins en tiempo de ejecución como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutación transaccional de configuración como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantánea de configuración del proceso actual como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y establecedores de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivos sin el barrel amplio de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de exec/plugin, constructores de capacidades de aprobación, helpers de autenticación/perfil, helpers de enrutamiento/tiempo de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución de entrada/respuesta, fragmentación, envío, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de envío/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta y marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta del almacén de sesiones, clave de sesión, actualizado-en y mutación del almacén |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de ruta/clave de sesión/vinculación de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y helpers de metadatos de problemas |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultado de herramienta |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descarga temporal |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y censura |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de anulación de modelo/sesión como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración del proveedor Talk |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión y envío de respuestas de ACP |
    | `plugin-sdk/acp-runtime-backend` | Helpers ligeros de registro de backend de ACP y envío de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de tiempo de ejecución de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuestas de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para arneses de agente de bajo nivel: tipos de arnés, helpers de dirigir/anular ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de políticas de herramientas de plan de tiempo de ejecución, clasificación de resultados de terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoint de Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de deduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper de drenaje de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Helpers de rutas seguras de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de evento Heartbeat y visibilidad |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de preparación de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas específicas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de bandera de diagnóstico, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato y clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers específicos de coerción y normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener/transformar/almacenar medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de payloads de medios |
    | `plugin-sdk/media-store` | Helpers concretos de almacén de medios, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios, además de exportaciones de helpers de imagen/audio orientadas a proveedores |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/markdown/registro, como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas de markdown, helpers de redacción, helpers de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz, además de exportaciones de directivas, registro, validación, constructor TTS compatible con OpenAI y helpers de voz orientadas a proveedores |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes, además de helpers de recurso de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | Barrel amplio de compatibilidad para pruebas de Plugin heredadas. Las nuevas pruebas de extensión deberían importar subrutas enfocadas del SDK, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para pruebas unitarias de registro directo de Plugin sin importar puentes de helpers de pruebas del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de runtime de agente para pruebas de autenticación, entrega, fallback, hooks de herramientas, superposición de prompts, esquema y proyección de transcripción |
    | `plugin-sdk/channel-test-helpers` | Helpers de pruebas orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, enhebrado de configuración de envío, mocks de runtime, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida de casos de error de resolución de destino para pruebas de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contratos de paquete de Plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers de contratos de runtime de proveedor, autenticación, descubrimiento, onboarding, catálogo, asistente, capacidad de medios, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y streaming |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación de Vitest de uso opcional para pruebas de proveedor que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos de captura de runtime de CLI, contexto sandbox, escritor de skill, mensaje de agente, evento de sistema, recarga de módulo, ruta de Plugin incluido, texto de terminal, fragmentación, token de autenticación y caso tipado |
    | `plugin-sdk/test-node-mocks` | Helpers enfocados de mocks integrados de Node para usar dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de helpers memory-core incluida para helpers de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor foundation de host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings de host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD de host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento de host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales de host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos de host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos de host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime de host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para helpers de runtime central de host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para helpers de diario de eventos de host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para helpers de archivo/runtime de host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown gestionado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para helpers de estado de host de memoria |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Actualmente no hay subrutas reservadas del SDK para helpers incluidos. Los
    helpers específicos del propietario viven dentro del paquete Plugin propietario,
    mientras que los contratos de host reutilizables usan subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
    `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
