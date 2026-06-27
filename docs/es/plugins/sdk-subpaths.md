---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para una importación de Plugin
    - Auditando subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones viven dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T12:30:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de Plugin se expone como un conjunto de subrutas públicas estrechas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas
por propósito. El inventario generado de puntos de entrada del compilador está en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete son el subconjunto público
después de restar las subrutas locales de pruebas/internas del repositorio enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Los mantenedores pueden auditar
el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y las subrutas auxiliares
reservadas activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
reservadas sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK público como
deuda de compatibilidad latente.

Para la guía de creación de Plugins, consulta [descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración, como `createMigrationItem`, constantes de motivo, marcadores de estado de elemento, auxiliares de censura y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Registro de comprobaciones de estado de Doctor, detección, reparación, selección, gravedad y tipos de hallazgo para consumidores de estado incluidos                                               |

### Compatibilidad y auxiliares de prueba en desuso

Las subrutas en desuso permanecen exportadas para Plugins antiguos, pero el código nuevo debe usar las
subrutas enfocadas del SDK que aparecen abajo. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las importaciones de producción
incluidas desde ella. Los barrels amplios como `compat`, `config-types`,
`infra-runtime`, `text-runtime` y `zod` son solo de compatibilidad. Importa `zod`
directamente desde `zod`.

Las subrutas de auxiliares de prueba respaldadas por Vitest de OpenClaw son solo locales del repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` y `testing`.

### Subrutas auxiliares reservadas de Plugins incluidos

Estas subrutas son superficies de compatibilidad propiedad del Plugin para su Plugin incluido propietario,
no API generales del SDK: `plugin-sdk/codex-mcp-projection` y
`plugin-sdk/codex-native-task-runtime`. Las barreras de contrato del paquete bloquean
las importaciones de extensiones entre propietarios.

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Ayudante de validación de JSON Schema en caché para esquemas propiedad del Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, traductor de configuración, avisos de listas de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración/puerta de acción multicuenta, ayudantes de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas y reserva predeterminada |
    | `plugin-sdk/account-helpers` | Ayudantes acotados de lista de cuentas/acción de cuenta |
    | `plugin-sdk/access-groups` | Ayudantes de análisis de listas de permitidos de grupos de acceso y diagnósticos redactados de grupos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquema de configuración de canal, además de constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canal de OpenClaw incluidos solo para plugins incluidos mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Ids canónicos de canales de chat incluidos/oficiales, además de etiquetas/alias de formateador para plugins que necesitan reconocer texto con prefijo de sobre sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Ayudantes de normalización/validación de comandos personalizados de Telegram con reserva de contrato incluido |
    | `plugin-sdk/command-gating` | Ayudantes acotados de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidad de entrada de canal de bajo nivel. Las rutas nuevas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver experimental de runtime de entrada de canal de alto nivel y constructores de hechos de ruta para rutas migradas de recepción de canal. Prefiere esto antes que ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada Plugin. Consulta [API de entrada de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensajes, además de opciones de canalización de respuestas, recibos, vista previa/transmisión en vivo, ayudantes de ciclo de vida, identidad saliente, planificación de cargas útiles, envíos duraderos y ayudantes de contexto de envío de mensajes. Consulta [API de salida de canal](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos de ruta de entrada y construcción de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de despacho, y `plugin-sdk/channel-outbound` para ayudantes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos de carga de medios salientes y estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Ayudantes acotados de normalización de sondeos |
    | `plugin-sdk/thread-bindings-runtime` | Ayudantes de ciclo de vida y adaptador para enlaces de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil de medios de agente |
    | `plugin-sdk/conversation-runtime` | Ayudantes de conversación/enlace de hilos, emparejamiento y enlace configurado |
    | `plugin-sdk/runtime-config-snapshot` | Ayudante de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de políticas de grupo en runtime |
    | `plugin-sdk/channel-status` | Ayudantes compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas acotadas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes de edición/lectura de configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Ayudantes compartidos de decisión de acceso de grupos |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Ayudantes acotados de política de guardia de DM directo previa al cifrado |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad rastreada del propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad rastreada del propietario; los plugins nuevos deben usar ayudantes de runtime inyectados o subrutas genéricas del SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes publicados de Lark/Zalo que aún importan autorización de comandos del remitente; los plugins nuevos deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y ayudantes heredados de respuestas interactivas. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Ayudantes compartidos de entrada para clasificación de eventos, construcción de contexto, formateo, raíces, debounce, coincidencia de menciones, política de menciones y registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes acotados de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Ayudantes acotados de política de menciones, marcador de menciones y texto de menciones sin la superficie más amplia del runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Ayudantes de acciones de mensaje de canal, además de ayudantes de esquema nativo obsoletos conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Normalización de rutas compartida, resolución de destinos basada en analizadores, conversión de id de hilo a cadena, claves de ruta deduplicadas/compactas, tipos de destino analizado y ayudantes de comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Ayudantes de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes acotados de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

Las familias obsoletas de ayudantes de canal siguen disponibles solo para
compatibilidad con plugins publicados. El plan de eliminación es: mantenerlas
durante la ventana de migración de plugins externos, mantener los plugins del
repositorio/incluidos en `channel-inbound` y `channel-outbound`, y luego eliminar
las subrutas de compatibilidad en la siguiente limpieza mayor del SDK. Esto se
aplica a las familias antiguas de mensaje/runtime de canal, streaming de canal,
acceso direct-DM, fragmentación de ayudantes de entrada, opciones de respuesta
y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor LM Studio compatible para configuración, detección de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución LM Studio compatible para valores predeterminados del servidor local, detección de modelos, encabezados de solicitud y funciones auxiliares de modelos cargados |
    | `plugin-sdk/provider-setup` | Funciones auxiliares seleccionadas para configurar proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Funciones auxiliares enfocadas para configurar proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Funciones auxiliares de resolución de claves de API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de proveedor, renderizado de página de callback, funciones auxiliares de PKCE/estado, análisis de entrada de autorización, funciones auxiliares de vencimiento de tokens y funciones auxiliares de anulación |
    | `plugin-sdk/provider-auth-api-key` | Funciones auxiliares de incorporación/escritura de perfiles con clave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Funciones auxiliares de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, funciones auxiliares de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, funciones auxiliares de endpoints de proveedor y funciones auxiliares compartidas de normalización de id. de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Funciones auxiliares de catálogo de modelos de proveedor en vivo para detección protegida de estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de id. de modelo, caché TTL y fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para aumento de catálogo de proveedor y puntos de integración del registro de proveedores de plugins para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Funciones auxiliares genéricas de capacidad HTTP/endpoint de proveedor, errores HTTP de proveedor y funciones auxiliares de formulario multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Funciones auxiliares de contrato de configuración/selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Funciones auxiliares de registro/caché de proveedor de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Funciones auxiliares específicas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Funciones auxiliares específicas de contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Funciones auxiliares de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedor de embeddings y funciones auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para hacer cumplir la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedor, funciones auxiliares compartidas de obtención de uso y obtenedores de proveedor como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream, compatibilidad de llamadas a herramientas en texto plano y funciones auxiliares compartidas de envoltorios Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Funciones auxiliares públicas compartidas de envoltorios de stream de proveedor, incluidas `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de stream compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Funciones auxiliares de transporte nativo de proveedor, como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Funciones auxiliares de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Funciones auxiliares de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Funciones auxiliares específicas de modo de activación de grupo y análisis de comandos |
  </Accordion>

Las instantáneas de uso del proveedor normalmente informan una o más `windows` de cuota, cada una con
una etiqueta, porcentaje usado y hora de restablecimiento opcional. Los proveedores que exponen texto de saldo o
estado de cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con un array `windows` vacío en vez de fabricar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; usa `error` solo cuando el
endpoint de uso falló o no devolvió datos de uso aprovechables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, funciones auxiliares del registro de comandos, incluido el formateo dinámico de menús de argumentos, funciones auxiliares de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolución de aprobadores y funciones auxiliares de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Funciones auxiliares nativas de perfil/filtro de aprobación de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Función auxiliar compartida de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Funciones auxiliares ligeras de carga de adaptadores nativos de aprobación para puntos de entrada de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Funciones auxiliares más amplias de tiempo de ejecución del manejador de aprobación; prefiere los puntos de integración más específicos de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Funciones auxiliares nativas de destino de aprobación, vinculación de cuenta, puerta de ruta, fallback de reenvío y supresión de prompt local de ejecución nativa |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones fijas de reacciones de aprobación, cargas de prompt de reacción, almacenes de destinos de reacción y exportación de compatibilidad para la supresión de prompt local de ejecución nativa |
    | `plugin-sdk/approval-reply-runtime` | Funciones auxiliares de carga de respuesta de aprobación de ejecución/Plugin |
    | `plugin-sdk/approval-runtime` | Funciones auxiliares de carga de aprobación de ejecución/Plugin, funciones auxiliares nativas de enrutamiento/tiempo de ejecución de aprobación y funciones auxiliares de visualización estructurada de aprobación, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Funciones auxiliares específicas de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Funciones auxiliares específicas de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formateo dinámico de menús de argumentos y funciones auxiliares nativas de destino de sesión |
    | `plugin-sdk/command-detection` | Funciones auxiliares compartidas de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comando para rutas activas de canal |
    | `plugin-sdk/command-surface` | Normalización de cuerpo de comando y funciones auxiliares de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Funciones auxiliares específicas de recopilación de contrato de secretos para superficies de secreto de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Funciones auxiliares específicas de tipado `coerceSecretRef` y SecretRef para análisis de contrato de secretos/configuración |
    | `plugin-sdk/secret-provider-integration` | Manifiesto de integración de proveedor SecretRef solo de tipos y contratos de preajustes para plugins que publican preajustes externos de proveedor de secretos |
    | `plugin-sdk/security-runtime` | Funciones auxiliares compartidas de confianza, control de DM, archivos/rutas limitados a la raíz, incluidas escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, funciones auxiliares privadas de almacén de archivos, guardas de padres de symlink, contenido externo, redacción de texto sensible, comparación de secretos en tiempo constante y funciones auxiliares de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Funciones auxiliares de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Funciones auxiliares específicas de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF, error SSRF y funciones auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Funciones auxiliares de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Funciones auxiliares de solicitud/destino de Webhook y coerción sin procesar de websocket/cuerpo |
    | `plugin-sdk/webhook-request-guards` | Funciones auxiliares de tamaño/timeout del cuerpo de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución, registro, copias de seguridad e instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers específicos de entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfil/valores predeterminados normalizados, análisis de URL de CDP y helpers de autenticación de control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Helpers genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por arnés que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Helper reservado de Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos de Codex; no para plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Helper privado de Codex incluido para el cableado de reflejo/tiempo de ejecución de tareas nativas; no para plugins de terceros |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canales |
    | `plugin-sdk/matrix` | Fachada de compatibilidad de Matrix obsoleta para paquetes de canales de terceros más antiguos; los nuevos plugins deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad de Mattermost obsoleta para paquetes de canales de terceros más antiguos; los nuevos plugins deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactivos para plugins |
    | `plugin-sdk/hook-runtime` | Helpers compartidos de canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación diferida de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/qa-live-transport-scenarios` | Ids compartidos de escenarios de QA de transporte en vivo, helpers de cobertura de referencia y helper de selección de escenarios |
    | `plugin-sdk/gateway-method-runtime` | Helper reservado de despacho de métodos de Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores de protocolo de Gateway y helpers de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie de configuración enfocada solo en tipos para formas de configuración de plugins como `OpenClawConfig` y tipos de configuración de canales/proveedores |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugins en tiempo de ejecución como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers transaccionales de mutación de configuración como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de sugerencias de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantáneas de configuración del proceso actual como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y establecedores de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram incluida no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivos sin el barrel amplio de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, cargas útiles de prompts de reacción, almacenes de destinos de reacción y exportación de compatibilidad para supresión de prompts de ejecución nativa local |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de ejecución/plugins, constructores de capacidades de aprobación, helpers de autenticación/perfil, helpers de enrutamiento/tiempo de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta. El código de nuevos turnos de mensajes debe usar `createChannelHistoryWindow`; los helpers de mapas de nivel inferior siguen siendo solo exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers específicos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lecturas acotadas de texto reciente de transcripciones de usuario/asistente por identidad de sesión, helpers heredados de ruta de almacén de sesiones/clave de sesión, lecturas de actualizado-en y helpers de compatibilidad de transición únicamente para almacén completo/ruta de archivo |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripción, helpers de destino/lectura/escritura con ámbito, publicación de actualizaciones, bloqueos de escritura y claves de coincidencias de memoria de transcripción |
    | `plugin-sdk/sqlite-runtime` | Helpers enfocados de esquema de agente, rutas y transacciones de SQLite para tiempo de ejecución de primera parte |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado de almacén de Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave en SQLite sidecar de Plugin, además de configuración centralizada de pragma de conexión y mantenimiento de WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Helpers de vinculación de ruta/clave de sesión/cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extraer URL de cadena desde entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-plugin` | Definir un Plugin simple y tipado de herramienta de agente y exponer metadatos estáticos para generación de manifiestos |
    | `plugin-sdk/tool-payload` | Extraer cargas útiles normalizadas desde objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío desde argumentos de herramienta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y helpers de comandos SSH/OpenShell, incluida precomprobación de comandos de ejecución con fallo rápido |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descargas temporales y espacios de trabajo temporales seguros privados |
    | `plugin-sdk/logging-core` | Registrador de subsistemas y helpers de censura |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tablas Markdown y conversión |
    | `plugin-sdk/model-session-runtime` | Helpers de sobrescritura de modelo/sesión como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración de proveedores de Talk |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Helpers de análisis JSON que preservan literales enteros no seguros como cadenas |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión de ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Helpers ligeros de registro de backend de ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de tiempo de ejecución de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivos y tokens de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de comando/proveedor de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugins de confianza para arneses de agentes de bajo nivel: tipos de arnés, helpers de dirección/anulación de ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de política de herramientas de plan de tiempo de ejecución, clasificación de resultado terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; usa la API pública del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de deduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de activación, evento y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | Helpers de archivos de políticas de aprobación de ejecución sin el barrel amplio de infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Helpers de caché pequeña acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de banderas de diagnóstico, eventos y contexto de trazas |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, helpers compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de datos de imágenes incrustadas y helpers de detección de firmas sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculaciones configuradas ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/sqlite-runtime` | Helpers enfocados de esquema de agente, rutas y transacciones de SQLite sin controles de ciclo de vida de base de datos |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers específicos de coerción y normalización de registros primitivos/cadenas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/espacio de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de obtención, transformación y almacenamiento de medios, incluidos `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; prefiere los helpers de almacenamiento antes de las lecturas de búfer cuando una URL deba convertirse en medios de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización MIME acotada, asignación de extensiones de archivo, detección MIME y helpers de tipo de medio |
    | `plugin-sdk/media-store` | Helpers acotados de almacenamiento de medios como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios más exportaciones de helpers orientados a proveedores para imagen/audio/extracción estructurada |
    | `plugin-sdk/text-chunking` | Helpers de fragmentación/renderizado de texto y markdown, conversión de tablas markdown, eliminación de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más exportaciones orientadas a proveedores de directivas, registro, validación, constructor TTS compatible con OpenAI y helpers de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper de inicialización de perfil en tiempo real para inyección acotada de contexto `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real, helpers de registro y helpers compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes más helpers de recursos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedor de origen de transcripciones, helpers de registro, descriptores de sesión y metadatos de enunciados |
    | `plugin-sdk/webhook-targets` | Helpers de registro de destinos Webhook e instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` directamente desde `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilidad obsoleto local del repositorio para pruebas heredadas de OpenClaw. Las pruebas nuevas del repositorio deben importar subrutas locales de prueba enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo local del repositorio `createTestPluginApi` para pruebas unitarias de registro directo de plugins sin importar puentes de helpers de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locales del repositorio de contrato del adaptador nativo de tiempo de ejecución de agentes para pruebas de autenticación, entrega, fallback, hooks de herramientas, superposición de prompts, esquema y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Helpers de prueba locales del repositorio orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorios, ciclo de vida de inicio de cuenta, encadenamiento de configuración de envío, mocks de runtime, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida local del repositorio de casos de error de resolución de destino para pruebas de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers locales del repositorio para contratos de paquete de plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers locales del repositorio para contratos de runtime de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación de Vitest opcionales locales del repositorio para pruebas de proveedor que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures locales genéricas del repositorio para captura de runtime de CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento del sistema, recarga de módulo, ruta de plugin incluido, texto de terminal, fragmentación, token de autenticación y caso tipado |
    | `plugin-sdk/test-node-mocks` | Helpers locales enfocados del repositorio para mocks de componentes integrados de Node para usar dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de helpers memory-core incluidos para helpers de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helpers ligeros de registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor de base de host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings de host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos. `registerMemoryEmbeddingProvider` en esta superficie está obsoleto; usa la API genérica de proveedor de embeddings para proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD de host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento de host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales de host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos de host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central de host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime de host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto del proveedor para helpers de runtime central de host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto del proveedor para helpers de diario de eventos de host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown gestionado para plugins adyacentes a la memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memoria activa para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Las subrutas del SDK de helpers incluidos reservadas son superficies acotadas
    específicas del propietario para código de plugins incluidos. Se rastrean en
    el inventario del SDK para que las compilaciones de paquetes y los alias se
    mantengan deterministas, pero no son APIs generales de creación de plugins.
    Los nuevos contratos de host reutilizables deben usar subrutas genéricas del SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del plugin Codex incluido para proyectar la configuración de servidores MCP del usuario en la configuración de hilo del servidor de aplicaciones de Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del plugin Codex incluido para reflejar subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
