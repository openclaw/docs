---
read_when:
    - Elegir la subruta adecuada de plugin-sdk para una importación de Plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones residen en cada lugar, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T07:51:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas acotadas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas por
propósito. El inventario generado del punto de entrada del compilador está en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete son el subconjunto público
después de restar las subrutas internas o de pruebas locales del repositorio listadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Los mantenedores pueden auditar
el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y las subrutas auxiliares
reservadas activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
reservadas sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK público como
deuda de compatibilidad inactiva.

Para la guía de creación de plugins, consulta [descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada de plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, auxiliares de censura y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Tipos de registro, detección, reparación, selección, gravedad y hallazgos de comprobaciones de estado de Doctor para consumidores de estado incluidos                                               |

### Auxiliares de compatibilidad y pruebas obsoletos

Las subrutas obsoletas siguen exportándose para plugins antiguos, pero el código nuevo debe usar las
subrutas específicas del SDK que aparecen abajo. La lista mantenida es
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

Estas subrutas son superficies de compatibilidad propiedad del plugin para su plugin incluido
propietario, no API generales del SDK: `plugin-sdk/codex-mcp-projection` y
`plugin-sdk/codex-native-task-runtime`. Las importaciones de extensiones entre propietarios están bloqueadas
por las salvaguardas del contrato del paquete.

<AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper de validación de JSON Schema en caché para esquemas propiedad del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, traductor de configuración, avisos de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración multi-cuenta y compuerta de acciones, helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta y fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers acotados de lista de cuentas y acciones de cuenta |
    | `plugin-sdk/access-groups` | Helpers de análisis de listas de permitidos de grupos de acceso y diagnósticos de grupos redactados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquema de configuración de canales, además de constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales OpenClaw empaquetados solo para plugins empaquetados mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Ids canónicos de canales de chat empaquetados/oficiales, además de etiquetas/alias de formateador para plugins que necesitan reconocer texto con prefijo de sobre sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales empaquetados |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato empaquetado |
    | `plugin-sdk/command-gating` | Helpers acotados de compuerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada de compatibilidad obsoleta para entrada de canal de bajo nivel. Las nuevas rutas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de runtime de entrada de canal de alto nivel y constructores de hechos de ruta para rutas de recepción de canal migradas. Prefiere esto en vez de ensamblar listas de permitidos efectivas, listas de permitidos de comandos y proyecciones heredadas en cada plugin. Consulta [API de entrada de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensajes, además de opciones de pipeline de respuesta, recibos, vista previa/transmisión en vivo, helpers de ciclo de vida, identidad saliente, planificación de payload, envíos duraderos y helpers de contexto de envío de mensajes. Consulta [API de salida de canal](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante y constructores de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-inbound` para ejecutores entrantes y predicados de despacho, y `plugin-sdk/channel-outbound` para helpers de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes y estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helpers acotados de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptadores de vínculos de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload de medios de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de conversación/vínculo de hilo, emparejamiento y vínculo configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de políticas de grupo en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas acotadas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso de grupo |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helpers acotados de política de guardia pre-criptográfica de DM directo |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad de propietario rastreada; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada de compatibilidad obsoleta de resolución de cuentas de Telegram para compatibilidad de propietario rastreada; los plugins nuevos deben usar helpers de runtime inyectados o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada de compatibilidad obsoleta de Zalo Personal para paquetes Lark/Zalo publicados que aún importan autorización de comandos de remitente; los plugins nuevos deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y helpers heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helpers entrantes compartidos para clasificación de eventos, construcción de contexto, formateo, raíces, debounce, coincidencia de menciones, política de menciones y registro entrante |
    | `plugin-sdk/channel-inbound-debounce` | Helpers acotados de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers acotados de política de menciones, marcador de mención y texto de mención sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensaje de canal, además de helpers obsoletos de esquema nativo conservados por compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Helpers compartidos de normalización de rutas, resolución de destinos dirigida por analizador, conversión de id de hilo a cadena, claves de ruta compactas/deduplicadas, tipos de destino analizado y comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Helpers de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

Las familias obsoletas de helpers de canal siguen disponibles solo por
compatibilidad con plugins publicados. El plan de eliminación es: mantenerlas
durante la ventana de migración de plugins externos, mantener los plugins del
repo/empaquetados en `channel-inbound` y `channel-outbound`, y luego eliminar
las subrutas de compatibilidad en la siguiente limpieza mayor del SDK. Esto se
aplica a las familias antiguas de mensajes/runtime de canal, transmisión de
canal, acceso de DM directo, fragmentos de helpers entrantes, opciones de
respuesta y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor de LM Studio compatible para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución de LM Studio compatible para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y ayudantes de modelos cargados |
    | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de vigilancia |
    | `plugin-sdk/provider-auth-runtime` | Ayudantes de resolución de claves API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de proveedor, renderizado de página de callback, ayudantes de PKCE/estado, análisis de entrada de autorización, ayudantes de caducidad de tokens y ayudantes de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Ayudantes de incorporación/escritura de perfiles de claves API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Ayudantes de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ayudantes de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedor y ayudantes compartidos de normalización de ids de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Ayudantes de catálogo de modelos de proveedores en vivo para descubrimiento protegido de estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de ids de modelo, caché TTL y fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para ampliación del catálogo de proveedores y puntos de integración del registro de plugins-proveedores para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ayudantes genéricos de HTTP/capacidades de endpoint de proveedor, errores HTTP de proveedor y ayudantes de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Ayudantes acotados de contrato de configuración/selección de web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Ayudantes de registro/caché de proveedores de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Ayudantes acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Ayudantes acotados de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Ayudantes de registro/caché/tiempo de ejecución de proveedores de web-search |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de embeddings y ayudantes de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para que se aplique la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedor, ayudantes compartidos de obtención de uso y fetchers de proveedor como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream, compatibilidad de llamadas a herramientas en texto sin formato y ayudantes compartidos de wrappers para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Ayudantes públicos compartidos de wrappers de stream de proveedor, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de stream compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Ayudantes nativos de transporte de proveedor, como fetch protegido, extracción de texto de resultados de herramienta, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Ayudantes de parches de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Ayudantes de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Ayudantes acotados de modo de activación de grupo y análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedor normalmente informan una o más `windows` de cuota, cada una con
una etiqueta, porcentaje usado y hora de restablecimiento opcional. Los proveedores que exponen texto de saldo o
estado de cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con un arreglo `windows` vacío en lugar de fabricar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` solo cuando el
endpoint de uso haya fallado o no haya devuelto datos de uso utilizables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ayudantes del registro de comandos, incluido el formato dinámico de menús de argumentos, ayudantes de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Ayudantes de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Ayudantes de perfiles/filtros de aprobación de exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidades/entrega de aprobación nativa |
    | `plugin-sdk/approval-gateway-runtime` | Ayudante compartido de resolución del Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canales calientes |
    | `plugin-sdk/approval-handler-runtime` | Ayudantes más amplios de tiempo de ejecución de manejadores de aprobación; prefiera los puntos de integración más acotados de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Ayudantes de destino de aprobación nativa, vinculación de cuentas, puerta de rutas, fallback de reenvío y supresión de prompts de exec nativa local |
    | `plugin-sdk/approval-reaction-runtime` | Enlaces codificados de reacciones de aprobación, cargas útiles de prompts de reacción, almacenes de destinos de reacción y exportación de compatibilidad para la supresión de prompts de exec nativa local |
    | `plugin-sdk/approval-reply-runtime` | Ayudantes de cargas útiles de respuestas de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Ayudantes de cargas útiles de aprobación de exec/plugin, ayudantes de enrutamiento/tiempo de ejecución de aprobación nativa y ayudantes de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Ayudantes acotados de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Ayudantes acotados de pruebas de contrato de canales sin el barril amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativa, formato dinámico de menús de argumentos y ayudantes nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Ayudantes compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canales calientes |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y ayudantes de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes acotados de recopilación de contratos de secretos para superficies de secretos de canales/plugins |
    | `plugin-sdk/secret-ref-runtime` | Ayudantes acotados de `coerceSecretRef` y tipado SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/secret-provider-integration` | Manifiesto de integración de proveedores SecretRef solo de tipos y contratos de presets para plugins que publican presets de proveedores de secretos externos |
    | `plugin-sdk/security-runtime` | Ayudantes compartidos de confianza, control de DM, archivos/rutas acotados a la raíz, incluidas escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, ayudantes de almacén privado de archivos, protecciones de padres de symlinks, contenido externo, censura de texto sensible, comparación de secretos en tiempo constante y ayudantes de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Ayudantes de lista de hosts permitidos y política SSRF de redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Ayudantes acotados de despachador fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Despachador fijado, fetch protegido contra SSRF, error SSRF y ayudantes de política SSRF |
    | `plugin-sdk/secret-input` | Ayudantes de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Ayudantes de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Ayudantes de tamaño/timeout del cuerpo de solicitud |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplios de tiempo de ejecución, registro, copia de seguridad e instalación de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares específicos de entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y retardo progresivo |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador admitida para perfiles/valores predeterminados normalizados, análisis de URL de CDP y auxiliares de autenticación de control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por harness que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex empaquetado reservado para proyectar la configuración de servidor MCP del usuario en la configuración de hilo de Codex; no es para plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex empaquetado privado para cableado de espejo/tiempo de ejecución de tareas nativas; no es para plugins de terceros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidad con Matrix para paquetes de canal de terceros antiguos; los plugins nuevos deberían importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada obsoleta de compatibilidad con Mattermost para paquetes de canal de terceros antiguos; los plugins nuevos deberían importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartidos de comandos/hooks/http/interactivos de plugins |
    | `plugin-sdk/hook-runtime` | Auxiliares compartidos de canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importación/vinculación diferida de tiempo de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Auxiliares de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/qa-live-transport-scenarios` | Ids compartidos de escenarios de QA de transporte en vivo, auxiliares de cobertura base y auxiliar de selección de escenarios |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de métodos de Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, auxiliar de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores de protocolo de Gateway y auxiliares de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie enfocada de configuración solo de tipos para formas de configuración de plugins, como `OpenClawConfig` y tipos de configuración de canal/proveedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de búsqueda de configuración de plugins en tiempo de ejecución, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutación transaccional de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de sugerencias de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de instantánea de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y setters de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie del contrato empaquetado de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivo sin el barrel amplio de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, cargas útiles de prompts de reacción, almacenes de destinos de reacción y exportación de compatibilidad para supresión de prompts de ejecución nativa local |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprobación de ejecución/plugins, constructores de capacidades de aprobación, auxiliares de autenticación/perfil, auxiliares de enrutamiento/tiempo de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Auxiliares compartidos de tiempo de ejecución entrante/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Auxiliares compartidos de historial de respuestas de ventana corta. El código nuevo de turnos de mensaje debería usar `createChannelHistoryWindow`; los auxiliares de mapa de menor nivel siguen siendo solo exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de flujo de trabajo de sesión (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lecturas acotadas de texto reciente de transcripción de usuario/asistente por identidad de sesión, auxiliares heredados de ruta de almacén de sesiones/clave de sesión, lecturas de updated-at y auxiliares de compatibilidad de transición únicamente para almacén completo/ruta de archivo |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripción, auxiliares de destino/lectura/escritura con ámbito, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripción |
    | `plugin-sdk/sqlite-runtime` | Auxiliares enfocados de esquema de agente, rutas y transacciones de SQLite para tiempo de ejecución de primera parte |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de ruta/carga/guardado de almacén de Cron |
    | `plugin-sdk/state-paths` | Auxiliares de rutas de directorios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave en SQLite sidecar de Plugin, más configuración centralizada de pragma de conexión y mantenimiento de WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Auxiliares de vinculación de ruta/clave de sesión/cuenta, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y auxiliares de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-plugin` | Define un plugin de herramienta de agente tipado simple y expone metadatos estáticos para la generación de manifiestos |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y auxiliares de comandos SSH/OpenShell, incluida la comprobación previa de comando exec con fallo rápido |
    | `plugin-sdk/temp-path` | Auxiliares compartidos de rutas de descarga temporal y espacios de trabajo temporales seguros privados |
    | `plugin-sdk/logging-core` | Auxiliares de registrador de subsistema y censura |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tabla Markdown y conversión |
    | `plugin-sdk/model-session-runtime` | Auxiliares de anulación de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolución de configuración de proveedor de Talk |
    | `plugin-sdk/json-store` | Auxiliares pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análisis de JSON que preservan literales enteros no seguros como cadenas |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueo de archivo reentrantes |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de tiempo de ejecución/sesión de ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares ligeros de registro de backend de ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculación de ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de tiempo de ejecución de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de arranque de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de canal pasivo, estado y auxiliar de proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/compilación/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugins de confianza para harnesses de agente de bajo nivel: tipos de harness, auxiliares de dirección/abortado de ejecuciones activas, auxiliares de puente de herramientas de OpenClaw, auxiliares de políticas de herramientas de planes de tiempo de ejecución, clasificación de resultados terminales, auxiliares de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; usa la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de caché de desduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de activación, evento y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Auxiliares de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera de disponibilidad de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de archivo de política de aprobación de ejecución sin el barrel amplio de infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Auxiliares pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de indicador de diagnóstico, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, auxiliares compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y auxiliares de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de datos de imagen en línea y auxiliares de detección de firmas sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculación configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de almacén de sesiones sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/sqlite-runtime` | Auxiliares enfocados de esquema de agente, rutas y transacciones de SQLite sin controles de ciclo de vida de base de datos |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares específicos de coerción y normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Auxiliares de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Auxiliares de directorio/identidad/espacio de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Ayudantes compartidos para obtener, transformar y almacenar medios, incluidos `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; prefiere los ayudantes de almacenamiento antes de leer búferes cuando una URL deba convertirse en medios de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización MIME específica, asignación de extensiones de archivo, detección MIME y ayudantes de tipo de medio |
    | `plugin-sdk/media-store` | Ayudantes específicos de almacenamiento de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios más exportaciones de ayudantes orientados al proveedor para imagen/audio/extracción estructurada |
    | `plugin-sdk/text-chunking` | Ayudantes para fragmentar/renderizar texto y markdown, conversión de tablas markdown, eliminación de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Ayudante para fragmentar texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz más exportaciones orientadas al proveedor para directivas, registro, validación, constructor TTS compatible con OpenAI y ayudantes de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directiva, normalización y exportaciones de ayudantes de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, ayudantes de registro y ayudante compartido de sesión WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Ayudante de arranque de perfil en tiempo real para inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, ayudantes de registro y ayudantes compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes más ayudantes de URL de datos/recursos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, ayudantes de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, ayudantes de registro, descriptores de sesión y metadatos de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y ayudantes de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Ayudantes compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` desde `zod` directamente |
    | `plugin-sdk/testing` | Módulo de reexportación de compatibilidad obsoleto local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deben importar subrutas locales de prueba enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Ayudante mínimo local del repositorio `createTestPluginApi` para pruebas unitarias de registro directo de plugins sin importar puentes de ayudantes de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato locales del repositorio para adaptador nativo de runtime de agente, para pruebas de autenticación, entrega, reserva, hook de herramientas, superposición de prompts, esquema y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Ayudantes de prueba locales del repositorio orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, encadenamiento de configuración de envío, mocks de runtime, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida local del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Ayudantes locales del repositorio para contratos de paquete de plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Ayudantes locales del repositorio para contratos de runtime de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación opt-in de Vitest locales del repositorio para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos locales del repositorio para captura de runtime CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento de sistema, recarga de módulos, ruta de plugin empaquetado, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Ayudantes específicos locales del repositorio para mocks de elementos incorporados de Node, para usar dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de ayudantes memory-core empaquetada para ayudantes de administrador/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Ayudantes ligeros de registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y ayudantes genéricos por lotes/remotos. `registerMemoryEmbeddingProvider` en esta superficie está obsoleto; usa la API genérica de proveedores de embeddings para proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Ayudantes de runtime CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Ayudantes de runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto del proveedor para ayudantes de runtime central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto del proveedor para ayudantes del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Ayudantes compartidos de markdown gestionado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memoria activa para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de ayudantes empaquetados">
    Las subrutas SDK reservadas de ayudantes empaquetados son superficies específicas
    y acotadas de propietario para código de plugins empaquetados. Se rastrean en
    el inventario del SDK para que las compilaciones de paquetes y los alias sigan
    siendo deterministas, pero no son API generales para creación de plugins. Los
    nuevos contratos de host reutilizables deben usar subrutas genéricas del SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Ayudante del plugin Codex empaquetado para proyectar la configuración de servidores MCP del usuario en la configuración de hilos del servidor de aplicación de Codex |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante del plugin Codex empaquetado para reflejar subagentes nativos del servidor de aplicación de Codex en el estado de tareas de OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
