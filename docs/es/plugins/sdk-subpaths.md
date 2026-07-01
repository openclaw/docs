---
read_when:
    - Elegir el subpath de plugin-sdk adecuado para una importación de plugin
    - Auditoría de subrutas de Plugin incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones viven dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T10:57:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de Plugin se expone como un conjunto de subrutas públicas acotadas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas por
propósito. El inventario generado del punto de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete son el subconjunto público
después de restar las subrutas locales del repositorio para pruebas/internas enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Los mantenedores pueden auditar
el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y las subrutas auxiliares
reservadas activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
reservadas sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK público como
deuda de compatibilidad inactiva.

Para la guía de creación de plugins, consulta [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, auxiliares de censura y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Registro, detección, reparación, selección, severidad y tipos de hallazgos de comprobaciones de salud de Doctor para consumidores de salud incluidos                                               |

### Compatibilidad obsoleta y auxiliares de prueba

Las subrutas obsoletas permanecen exportadas para plugins antiguos, pero el código nuevo debe usar las
subrutas enfocadas del SDK que aparecen abajo. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las importaciones de producción
incluidas desde ella. Los barriles amplios como `compat`, `config-types`,
`infra-runtime`, `text-runtime` y `zod` son solo de compatibilidad. Importa `zod`
directamente desde `zod`.

Las subrutas de auxiliares de prueba respaldadas por Vitest de OpenClaw son solo locales del repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` y `testing`.

### Subrutas auxiliares reservadas de plugins incluidos

Estas subrutas son superficies de compatibilidad propiedad del plugin para su plugin incluido propietario,
no APIs generales del SDK: `plugin-sdk/codex-mcp-projection` y
`plugin-sdk/codex-native-task-runtime`. Las importaciones de extensiones entre propietarios están bloqueadas
por las barreras de contrato del paquete.

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validación de JSON Schema en caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartidos del asistente de configuración, traductor de configuración, solicitudes de lista de permitidos y constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuración/puerta de acciones multicuenta, auxiliares de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Auxiliares de búsqueda de cuenta + reserva predeterminada |
    | `plugin-sdk/account-helpers` | Auxiliares específicos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/access-groups` | Auxiliares de análisis de listas de permitidos de grupos de acceso y diagnósticos de grupo redactados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquema de configuración de canal, además de constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canal de OpenClaw incluidos solo para plugins incluidos mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canónicos de canales de chat incluidos/oficiales, además de etiquetas/alias de formateador para plugins que necesitan reconocer texto con prefijo de envoltorio sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canal incluido |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalización/validación de comandos personalizados de Telegram con reserva de contrato incluido |
    | `plugin-sdk/command-gating` | Auxiliares específicos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidad de ingreso de canal de bajo nivel. Las nuevas rutas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de runtime de ingreso de canal de alto nivel y constructores de hechos de ruta para rutas de recepción de canal migradas. Prefiere esto antes que ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada plugin. Consulta [API de ingreso de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensajes, además de opciones de canalización de respuestas, recibos, vista previa/transmisión en vivo, auxiliares de ciclo de vida, identidad saliente, planificación de payload, envíos duraderos y auxiliares de contexto de envío de mensajes. Consulta [API saliente de canal](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartidos de ruta entrante + constructor de envoltorio |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-inbound` para ejecutores entrantes y predicados de despacho, y `plugin-sdk/channel-outbound` para auxiliares de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartidos de carga de medios salientes y estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida y adaptador de enlaces de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload multimedia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversación/enlace de hilo, emparejamiento y enlace configurado |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolución de política de grupo de runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Auxiliares compartidos de decisión de acceso de grupo |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares específicos de política de guarda de DM directo previa a criptografía |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad de propietario rastreada; los nuevos plugins deben usar subrutas genéricas del SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad de propietario rastreada; los nuevos plugins deben usar auxiliares de runtime inyectados o subrutas genéricas del SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes Lark/Zalo publicados que aún importan autorización de comandos de remitente; los nuevos plugins deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y auxiliares heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares entrantes compartidos para clasificación de eventos, construcción de contexto, formato, raíces, antirrebote, coincidencia de menciones, política de menciones y registro entrante |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares específicos de antirrebote entrante |
    | `plugin-sdk/channel-mention-gating` | Auxiliares específicos de política de menciones, marcador de mención y texto de mención sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Auxiliares de acciones de mensaje de canal, además de auxiliares obsoletos de esquema nativo conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Auxiliares compartidos de normalización de rutas, resolución de destinos basada en analizador, conversión de ID de hilo a cadena, claves de ruta compactas/de deduplicación, tipos de destino analizado y comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares específicos de contrato de secreto, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

Las familias de helpers de canal obsoletas siguen disponibles solo por compatibilidad con plugins publicados. El plan de eliminación es: mantenerlas durante la ventana de migración de plugins externos, mantener los plugins del repositorio/incluidos en `channel-inbound` y `channel-outbound`, y luego eliminar las subrutas de compatibilidad en la próxima limpieza mayor del SDK. Esto se aplica a las familias antiguas de mensajes/runtime de canal, streaming de canal, acceso a DM directos, escisión de helpers de entrada, opciones de respuesta y ruta de emparejamiento.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor LM Studio compatible para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución LM Studio compatible para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y ayudantes de modelos cargados |
    | `plugin-sdk/provider-setup` | Ayudantes seleccionados para configurar proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados para configurar proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Ayudantes de resolución de claves de API en tiempo de ejecución para plugins de proveedores |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de proveedores, renderizado de página de callback, ayudantes de PKCE/estado, análisis de entradas de autorización, ayudantes de expiración de tokens y ayudantes de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Ayudantes de incorporación/escritura de perfiles de claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Ayudantes de búsqueda de variables de entorno para autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ayudantes de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, ayudantes de endpoint de proveedores y ayudantes compartidos de normalización de id. de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Ayudantes de catálogo de modelos de proveedores en vivo para descubrimiento protegido estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de id. de modelo, caché TTL y fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para ampliación del catálogo de proveedores y puntos de unión del registro de proveedores de plugins para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ayudantes genéricos de capacidades HTTP/endpoint de proveedores, errores HTTP de proveedores y ayudantes de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Ayudantes de contrato acotados para configuración/selección de web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Ayudantes de registro/caché de proveedores de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Ayudantes acotados de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Ayudantes acotados de contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Ayudantes de registro/caché/tiempo de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de embeddings y ayudantes de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para imponer la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedores, ayudantes compartidos de obtención de uso y fetchers de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream, compatibilidad de llamadas a herramientas en texto plano y ayudantes compartidos de envoltorios para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Ayudantes públicos compartidos de envoltorios de stream de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de stream compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte nativo de proveedores, como fetch protegido, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y streams escribibles de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Ayudantes de parches de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Ayudantes de singletons/mapas/cachés locales al proceso |
    | `plugin-sdk/group-activation` | Ayudantes acotados de modo de activación de grupos y análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan una o más `windows` de cuota, cada una con
una etiqueta, porcentaje usado y hora de reinicio opcional. Los proveedores que exponen texto de saldo o
estado de cuenta en lugar de ventanas de cuota reiniciables deben devolver
`summary` con un array `windows` vacío en vez de fabricar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; usa `error` solo cuando el
endpoint de uso falló o no devolvió datos de uso aprovechables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ayudantes de registro de comandos, incluido formato dinámico de menús de argumentos, ayudantes de autorización del remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Ayudantes de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Ayudantes de perfiles/filtros de aprobación de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Ayudante compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Ayudantes más amplios de tiempo de ejecución del manejador de aprobación; prefiere los puntos de unión más acotados de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Ayudantes nativos de destino de aprobación, vinculación de cuentas, puerta de rutas, fallback de reenvío y supresión de prompts de exec nativo local |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, payloads de prompts de reacción, almacenes de destinos de reacción y exportación de compatibilidad para supresión de prompts de exec nativo local |
    | `plugin-sdk/approval-reply-runtime` | Ayudantes de payloads de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Ayudantes de payloads de aprobación de exec/plugin, ayudantes nativos de enrutamiento/tiempo de ejecución de aprobación y ayudantes estructurados de visualización de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Ayudantes acotados de reinicio de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Ayudantes acotados de pruebas de contrato de canales sin el barril amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico de menús de argumentos y ayudantes nativos de destinos de sesión |
    | `plugin-sdk/command-detection` | Ayudantes compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Normalización de cuerpos de comandos y ayudantes de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes acotados de recopilación de contratos de secretos para superficies de secretos de canales/plugins |
    | `plugin-sdk/secret-ref-runtime` | Ayudantes acotados de `coerceSecretRef` y tipado de SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/secret-provider-integration` | Manifiesto de integración de proveedores SecretRef solo de tipos y contratos de presets para plugins que publican presets de proveedores externos de secretos |
    | `plugin-sdk/security-runtime` | Ayudantes compartidos de confianza, control de DM, archivos/rutas limitados a la raíz, incluidas escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, ayudantes de almacén privado de archivos, protecciones de padres de symlinks, contenido externo, redacción de texto sensible, comparación de secretos en tiempo constante y ayudantes de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Ayudantes de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Ayudantes acotados de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF, error SSRF y ayudantes de política SSRF |
    | `plugin-sdk/secret-input` | Ayudantes de análisis de entradas secretas |
    | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes/destinos de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Ayudantes de tamaño/timeout del cuerpo de solicitud |
  </Accordion>

  <Accordion title="Subrutas de entorno de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de entorno de ejecución, registro, copia de seguridad e instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers acotados de entorno de ejecución, logger, tiempo de espera, reintento y backoff |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfil/valores predeterminados normalizados, análisis de URL de CDP y helpers de autenticación para control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Helpers genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por harness que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Helper reservado de Codex incluido para proyectar la configuración de servidor MCP del usuario en la configuración de hilo de Codex; no es para plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Helper privado de Codex incluido para cableado de espejo/entorno de ejecución de tareas nativas; no es para plugins de terceros |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de entorno de ejecución de canal |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidad con Matrix para paquetes de canal de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada obsoleta de compatibilidad con Mattermost para paquetes de canal de terceros antiguos; los plugins nuevos deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos, hooks, HTTP e interacción de plugins |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de Webhook/hooks internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/enlace diferidos del entorno de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/qa-live-transport-scenarios` | Ids compartidos de escenarios de QA de transporte en vivo, helpers de cobertura de referencia y helper de selección de escenarios |
    | `plugin-sdk/gateway-method-runtime` | Helper reservado de despacho de métodos de Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores del protocolo de Gateway, resolución de host LAN anunciado y helpers de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie enfocada de configuración solo de tipos para formas de configuración de plugins, como `OpenClawConfig` y tipos de configuración de canales/proveedores |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugins en tiempo de ejecución, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers transaccionales de mutación de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de sugerencias de metadatos de entrega de herramientas de mensaje |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantáneas de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y setters de instantáneas para pruebas |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram incluida no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin el barrel amplio de texto |
    | `plugin-sdk/approval-reaction-runtime` | Enlaces codificados de reacciones de aprobación, payloads de prompts de reacción, almacenes de destinos de reacción y exportación de compatibilidad para supresión de prompts de ejecución nativa local |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de exec/plugins, constructores de capacidades de aprobación, helpers de autenticación/perfil, helpers de enrutamiento/entorno de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de entorno de ejecución de entrada/respuesta, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta. El código nuevo de turnos de mensaje debe usar `createChannelHistoryWindow`; los helpers de mapa de nivel inferior siguen siendo solo exportaciones obsoletas de compatibilidad |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers acotados de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de flujo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lecturas acotadas de texto de transcripciones recientes de usuario/asistente por identidad de sesión, helpers heredados de ruta de almacén de sesiones/clave de sesión, lecturas de actualización y helpers de compatibilidad de transición para almacén completo/ruta de archivo |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripción, helpers de destino/lectura/escritura con ámbito, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripción |
    | `plugin-sdk/sqlite-runtime` | Helpers enfocados de esquema de agente, rutas y transacciones de SQLite para entorno de ejecución propio |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado de almacén de Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave en SQLite sidecar de Plugin, más configuración centralizada de pragma de conexión y mantenimiento WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Helpers de enlace de ruta/clave de sesión/cuenta, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de entorno de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con tiempo limitado y resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-plugin` | Define un plugin sencillo de herramienta de agente tipada y expone metadatos estáticos para la generación del manifiesto |
    | `plugin-sdk/tool-payload` | Extrae payloads normalizados desde objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y helpers de comandos SSH/OpenShell, incluida una precomprobación de comando exec con fallo rápido |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descargas temporales y espacios de trabajo temporales seguros privados |
    | `plugin-sdk/logging-core` | Logger de subsistemas y helpers de redacción |
    | `plugin-sdk/markdown-table-runtime` | Modo de tabla Markdown y helpers de conversión |
    | `plugin-sdk/model-session-runtime` | Helpers de sobrescritura de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración de proveedor Talk |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Helpers de análisis JSON que preservan literales enteros no seguros como cadenas |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada en disco |
    | `plugin-sdk/acp-runtime` | Helpers de entorno de ejecución/sesión de ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Registro ligero de backend ACP y helpers de despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de enlaces ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas acotadas de esquema de configuración de entorno de ejecución de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivos y tokens de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de canal pasivo, estado y helpers de proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuestas de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin confiable para harnesses de agente de bajo nivel: tipos de harness, helpers de dirección/aborto de ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de política de herramientas de plan de entorno de ejecución, clasificación de resultado terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; usa la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de entorno de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de deduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper de drenaje de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de disponibilidad de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Helpers de archivos de política de aprobación de exec sin el barrel amplio de infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de entorno de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de indicador de diagnóstico, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, helpers compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | fetch de entorno de ejecución consciente del despachador sin importaciones de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de datos de imagen en línea y helpers de detección de firmas sin la superficie amplia de entorno de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de entorno de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de enlace de conversación sin enrutamiento de enlaces configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/sqlite-runtime` | Helpers enfocados de esquema de agente, rutas y transacciones de SQLite sin controles de ciclo de vida de base de datos |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers acotados de coerción y normalización de registros primitivos/cadenas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombre de host y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agente, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación obsoleta de compatibilidad `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Ayudantes compartidos para obtener, transformar y almacenar medios, incluidos `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; prefiere los ayudantes de almacenamiento antes de leer búferes cuando una URL deba convertirse en medios de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización MIME acotada, asignación de extensiones de archivo, detección MIME y ayudantes de tipo de medio |
    | `plugin-sdk/media-store` | Ayudantes acotados de almacenamiento de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones de ayudantes de imagen, audio y extracción estructurada orientadas a proveedores |
    | `plugin-sdk/text-chunking` | Ayudantes de fragmentación y renderizado de texto y Markdown, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Ayudante de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones de ayudantes de directivas, registro, validación, generador TTS compatible con OpenAI y voz orientadas a proveedores |
    | `plugin-sdk/speech-core` | Exportaciones compartidas de tipos de proveedores de voz, registro, directivas, normalización y ayudantes de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, ayudantes de registro y ayudante compartido de sesión WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Ayudante de inicialización de perfil en tiempo real para inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, ayudantes de registro y ayudantes compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de ayudantes de recursos de imagen/URL de datos y el generador de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor, solicitud y resultado de generación musical |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación musical, ayudantes de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor, solicitud y resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, ayudantes de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, ayudantes de registro, descriptores de sesión y metadatos de enunciados |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y ayudantes de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Ayudantes compartidos para cargar medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` desde `zod` directamente |
    | `plugin-sdk/testing` | Barrel de compatibilidad obsoleto local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deben importar subrutas de prueba locales enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Ayudante mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes de ayudantes de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de tiempo de ejecución de agentes, locales del repositorio, para pruebas de autenticación, entrega, respaldo, enlaces de herramientas, superposición de prompts, esquema y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Ayudantes de prueba orientados a canales, locales del repositorio, para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, encadenamiento de configuración de envío, simulaciones de tiempo de ejecución, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Conjunto compartido local del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Ayudantes locales del repositorio para contratos de paquete de Plugin, registro, artefacto público, importación directa, API de tiempo de ejecución y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Ayudantes locales del repositorio para contratos de tiempo de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidades de medios, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y streaming |
    | `plugin-sdk/provider-http-test-mocks` | Simulaciones HTTP/autenticación Vitest opcionales, locales del repositorio, para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locales del repositorio para captura de tiempo de ejecución CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento de sistema, recarga de módulo, ruta de Plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Ayudantes enfocados locales del repositorio para simular integrados de Node dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie incluida de ayudantes memory-core para ayudantes de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Ayudantes ligeros de registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y ayudantes genéricos por lotes/remotos. `registerMemoryEmbeddingProvider` en esta superficie está obsoleto; usa la API genérica de proveedores de embeddings para nuevos proveedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Ayudantes de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Ayudantes de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para ayudantes de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para ayudantes de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Ayudantes compartidos de Markdown gestionado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de ayudantes incluidos">
    Las subrutas SDK reservadas de ayudantes incluidos son superficies acotadas específicas del propietario para
    código de plugins incluidos. Se registran en el inventario del SDK para que las compilaciones
    de paquetes y los alias se mantengan deterministas, pero no son API generales
    para crear plugins. Los nuevos contratos reutilizables de host deben usar subrutas genéricas del SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Ayudante incluido del Plugin Codex para proyectar la configuración de servidor MCP del usuario en la configuración de hilos del servidor de aplicación Codex |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante incluido del Plugin Codex para reflejar subagentes nativos del servidor de aplicación Codex en el estado de tareas de OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
