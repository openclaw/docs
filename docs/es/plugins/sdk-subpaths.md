---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para una importación de Plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-05-06T05:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de Plugin se expone como un conjunto de subrutas específicas bajo `openclaw/plugin-sdk/`.
Esta página cataloga las subrutas de uso común agrupadas por finalidad. La lista
completa generada de más de 200 subrutas está en `scripts/lib/plugin-sdk-entrypoints.json`;
las subrutas auxiliares reservadas para Plugins incluidos aparecen allí, pero son un
detalle de implementación salvo que una página de documentación las promueva explícitamente. Los mantenedores pueden auditar las subrutas auxiliares reservadas
activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
reservadas sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK
público como deuda de compatibilidad inactiva.

Para la guía de creación de Plugins, consulta [descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                                   | Exportaciones clave                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Barrel de compatibilidad amplio para pruebas de Plugins heredadas; prefiere subrutas de prueba específicas para nuevas pruebas de extensiones                                                                     |
| `plugin-sdk/plugin-test-api`              | Generador mínimo de mocks de `OpenClawPluginApi` para pruebas unitarias directas de registro de Plugins                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contratos del adaptador nativo de tiempo de ejecución de agentes para perfiles de autenticación, supresión de entrega, clasificación de alternativas, hooks de herramientas, superposiciones de prompts, esquemas y reparación de transcripciones |
| `plugin-sdk/channel-test-helpers`         | Ayudantes de pruebas para ciclo de vida de cuentas de canal, directorio, configuración de envío, mock de tiempo de ejecución, hook, entrada de canal incluido, marca de tiempo de sobre, respuesta de emparejamiento y contrato genérico de canal   |
| `plugin-sdk/channel-target-testing`       | Suite compartida de pruebas de casos de error de resolución de destinos de canal                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Ayudantes de contratos para registro de Plugins, manifiesto de paquete, artefacto público, API de tiempo de ejecución, efecto secundario de importación e importación directa                                                  |
| `plugin-sdk/plugin-test-runtime`          | Fixtures de tiempo de ejecución de Plugins, registro, registro de proveedores, asistente de configuración y TaskFlow de tiempo de ejecución para pruebas                                                                      |
| `plugin-sdk/provider-test-contracts`      | Ayudantes de contratos de tiempo de ejecución de proveedor, autenticación, descubrimiento, incorporación, catálogo, capacidad multimedia, política de repetición, audio en vivo de STT en tiempo real, búsqueda/captura web y asistente                 |
| `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticación opcionales de Vitest para pruebas de proveedor que ejercitan `plugin-sdk/provider-http`                                                                                    |
| `plugin-sdk/test-env`                     | Fixtures de entorno de pruebas, fetch/red, servidor HTTP desechable, solicitud entrante, prueba en vivo, sistema de archivos temporal y control de tiempo                                        |
| `plugin-sdk/test-fixtures`                | Fixtures de pruebas genéricas para CLI, sandbox, skill, mensaje de agente, evento de sistema, recarga de módulo, ruta de Plugin incluido, terminal, fragmentación, token de autenticación y caso tipado                   |
| `plugin-sdk/test-node-mocks`              | Ayudantes específicos de mocks de elementos integrados de Node para usar dentro de fábricas Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | Ayudantes de elementos de proveedor de migración, como `createMigrationItem`, constantes de motivo, marcadores de estado de elemento, ayudantes de redacción y `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | Ayudantes de migración en tiempo de ejecución, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación raíz del esquema Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/puerta de acciones multicuenta, helpers de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas y reserva predeterminada |
    | `plugin-sdk/account-helpers` | Helpers específicos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helpers heredados de canalización de respuesta. El código nuevo de canalización de respuesta de canal debe usar `createChannelMessageReplyPipeline` y `resolveChannelMessageSourceReplyDeliveryMode` de `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas del esquema de configuración de canal, más constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos de OpenClaw solo para plugins incluidos mantenidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con reserva de contrato incluido |
    | `plugin-sdk/command-gating` | Helpers específicos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, y helpers heredados de ciclo de vida de flujo de borrador. El código nuevo de finalización de vista previa debe usar `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helpers económicos de contrato del ciclo de vida de mensajes, como `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, fachadas de compatibilidad, derivación de capacidad final duradera, helpers de prueba de capacidades para capacidades de envío/recepción/efecto secundario, `MessageReceiveContext`, pruebas de política de acuse de recibo, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, pruebas de capacidad de vista previa en vivo y finalizador en vivo, estado de recuperación duradera, `RenderedMessageBatch`, tipos de recibo de mensaje y helpers de ID de recibo. Consulta [API de mensajes de canal](/es/plugins/sdk-channel-message). El `createChannelTurnReplyPipeline` heredado permanece solo para despachadores de compatibilidad. |
    | `plugin-sdk/channel-message-runtime` | Helpers de entrega en tiempo de ejecución que pueden cargar entrega saliente, incluidos `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` y `recordChannelMessageReplyDispatch`. Úsalos desde módulos de tiempo de ejecución de monitor/envío, no desde archivos activos de arranque de plugins. |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante y constructores de envoltorio |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers heredados compartidos para registrar y despachar entradas, predicados de despacho visible/final y compatibilidad obsoleta de `deliverDurableInboundReplyPayload` para despachadores de canal preparados. El código nuevo de recepción/despacho de canales debe importar helpers de ciclo de vida en tiempo de ejecución desde `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-send-deps` | Búsqueda ligera de dependencias de envío saliente para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de payload |
    | `plugin-sdk/poll-runtime` | Helpers específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptador de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload de medios de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de vinculación de conversación/hilo, emparejamiento y vinculación configurada |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preludio de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/guardia de DM directos |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad de propietario rastreada; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad de propietario rastreada; los plugins nuevos deben usar helpers de tiempo de ejecución inyectados o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes Lark/Zalo publicados que aún importan autorización de comandos de remitente; los plugins nuevos deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y helpers heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para antirrebote entrante, coincidencia de menciones, helpers de política de menciones y helpers de envoltorio |
    | `plugin-sdk/channel-inbound-debounce` | Helpers específicos de antirrebote entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers específicos de política de menciones, marcador de mención y texto de mención sin la superficie más amplia de tiempo de ejecución entrante |
    | `plugin-sdk/channel-envelope` | Helpers específicos de formato de envoltorio entrante |
    | `plugin-sdk/channel-location` | Helpers de contexto de ubicación de canal y formato |
    | `plugin-sdk/channel-logging` | Helpers de registro de canales para descartes entrantes y errores de escritura/acuse |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensaje de canal, más helpers obsoletos de esquema nativo conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos controlada por analizador, conversión de ID de hilo a cadena, claves de ruta de deduplicación/compactación, tipos de destino analizado y helpers de comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Helpers de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers específicos de contrato de secretos, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible de tiempo de ejecución de LM Studio para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y helpers de modelos cargados |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves de API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfiles con clave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, helpers de endpoints de proveedor y helpers de normalización de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para ampliación del catálogo de proveedores y puntos de integración del registro plugin-proveedor para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedor, errores HTTP de proveedor y helpers de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers acotados de contrato de configuración/selección para web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers acotados de configuración/credenciales para web-search destinados a proveedores que no necesitan cableado de habilitación de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers acotados de contrato de configuración/credenciales para web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedores web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos y helpers de compatibilidad xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de flujo y helpers compartidos de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo de proveedor, como fetch protegido, transformaciones de mensajes de transporte y flujos escribibles de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de parches de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers acotados de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos que incluyen formato dinámico de menús de argumentos, helpers de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfiles/filtros de aprobación de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de tiempo de ejecución del manejador de aprobaciones; prefiere los puntos de integración más acotados de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación + vinculación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprobación de exec/plugin, helpers nativos de enrutamiento/tiempo de ejecución de aprobación y helpers de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers acotados de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers acotados de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico de menús de argumentos y helpers nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canal activas |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo de comandos y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers acotados de tipado de `coerceSecretRef` y SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, control de DM, archivos/rutas limitados a la raíz, incluidas escrituras de solo creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, helpers de almacén privado de archivos, guardas de padres de symlink, contenido externo, censura de texto sensible, comparación de secretos en tiempo constante y helpers de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de hosts y política SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Helpers acotados de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF, error SSRF y helpers de política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño/timeout del cuerpo de la solicitud |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers generales de runtime/registro/copia de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers específicos de entorno de runtime, registrador, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfil/valores predeterminados normalizados, análisis de URL CDP y helpers de autenticación de control del navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidad de Matrix obsoleta para paquetes de canal de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad de Mattermost obsoleta para paquetes de canal de terceros antiguos; los plugins nuevos deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactivos de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación diferida de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de gateway, errores de protocolo de gateway y helpers de parches de estado de canal |
    | `plugin-sdk/config-types` | Superficie de configuración solo de tipos para formas de configuración de plugins, como `OpenClawConfig` y tipos de configuración de canal/proveedor |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugins en runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutación transaccional de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantánea de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram incluida no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivo sin el barril amplio de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de exec/plugins, constructores de capacidades de aprobación, helpers de autenticación/perfil, helpers nativos de enrutamiento/runtime y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de runtime entrante/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta y marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta de almacén de sesiones, clave de sesión, actualizado-en y mutación del almacén |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de enlace de ruta/clave de sesión/cuenta, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadena |
    | `plugin-sdk/request-url` | Extraer URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con temporizador y resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extraer payloads normalizados de objetos de resultado de herramienta |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío desde argumentos de herramienta |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descarga temporal y espacios de trabajo temporales privados seguros |
    | `plugin-sdk/logging-core` | Registrador de subsistema y helpers de redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tablas Markdown y conversión |
    | `plugin-sdk/model-session-runtime` | Helpers de anulación de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración de proveedor de conversación |
    | `plugin-sdk/json-store` | Helpers pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sesión de ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Helpers ligeros de registro de backend de ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de enlace de ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de runtime de agente |
    | `plugin-sdk/boolean-param` | Lector laxo de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para arneses de agente de bajo nivel: tipos de arnés, helpers de conducción/cancelación de ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de política de herramientas de plan de runtime, clasificación de resultado de terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoints de Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia limitada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de desduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Helpers de rutas seguras de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de eventos y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de disponibilidad de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas de runtime enfocadas de arriba |
    | `plugin-sdk/collection-runtime` | Helpers pequeños de caché limitada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de marca de diagnóstico, evento y contexto de trazas |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato y clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime consciente del despachador sin importaciones de proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Lector limitado de cuerpo de respuesta sin la superficie amplia de runtime multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado de enlace de la conversación actual sin enrutamiento de enlace configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers específicos de coerción y normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombre de host y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agente, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener, transformar y almacenar medios, detección de dimensiones de video respaldada por ffprobe y constructores de cargas útiles de medios |
    | `plugin-sdk/media-store` | Helpers acotados de almacenamiento de medios como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios más exportaciones de helpers de imagen/audio orientadas a proveedores |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/markdown/registro, como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas de markdown, helpers de redacción, helpers de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más exportaciones orientadas a proveedores para directivas, registro, validación, constructor TTS compatible con OpenAI y helpers de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes más helpers de URL de datos/recursos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de plugins |
    | `plugin-sdk/testing` | Barrel amplio de compatibilidad para pruebas heredadas de plugins. Las nuevas pruebas de extensiones deberían importar subrutas enfocadas del SDK como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` en su lugar |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para pruebas unitarias de registro directo de plugins sin importar puentes de helpers de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativos de contratos de adaptador de runtime de agente para pruebas de autenticación, entrega, fallback, hooks de herramientas, superposición de prompts, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Helpers de prueba orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuentas, enhebrado de configuración de envío, mocks de runtime, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida de casos de error de resolución de destino para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contratos de paquete de Plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers de contratos de runtime de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de repetición, audio en vivo STT en tiempo real, búsqueda/obtención web y stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación de Vitest opcionales para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas de captura de runtime de CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento de sistema, recarga de módulos, ruta de plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers enfocados de mocks de módulos integrados de Node para usar dentro de factories de Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de helpers memory-core incluidos para helpers de administrador/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para helpers de runtime central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para helpers de archivo/runtime del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown administrado para plugins adyacentes a la memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Actualmente no hay subrutas de SDK reservadas para helpers incluidos. Los helpers
    específicos de propietario viven dentro del paquete del plugin propietario, mientras que los contratos de host reutilizables
    usan subrutas genéricas del SDK como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
