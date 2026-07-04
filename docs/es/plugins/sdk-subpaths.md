---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditoría de subrutas de Plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del Plugin SDK: qué importaciones se encuentran dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-04T10:27:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas acotadas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas por
propósito. El inventario generado de puntos de entrada del compilador vive en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete son el subconjunto público
después de restar las subrutas locales de pruebas/internas del repositorio enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Los mantenedores pueden auditar
el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y las subrutas activas
reservadas de helpers con `pnpm plugins:boundary-report:summary`; las exportaciones reservadas
de helpers sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK público como
deuda de compatibilidad inactiva.

Para la guía de creación de plugins, consulta [Resumen del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers de elementos de proveedores de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, helpers de redacción y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Helpers de migración en tiempo de ejecución como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`            |
| `plugin-sdk/health`            | Tipos de registro, detección, reparación, selección, severidad y hallazgos de comprobaciones de salud de Doctor para consumidores de salud incluidos                                               |

### Compatibilidad obsoleta y helpers de prueba

Las subrutas obsoletas siguen exportándose para plugins más antiguos, pero el código nuevo debe usar las
subrutas enfocadas del SDK que aparecen abajo. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las importaciones de producción
incluidas desde ella. Los barrels amplios como `compat`, `config-types`,
`infra-runtime`, `text-runtime` y `zod` son solo de compatibilidad. Importa `zod`
directamente desde `zod`.

Las subrutas de helpers de prueba respaldadas por Vitest de OpenClaw son solo locales del repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` y `testing`.

### Subrutas reservadas de helpers de plugins incluidos

Estas subrutas son superficies de compatibilidad propiedad del plugin para su plugin incluido propietario,
no APIs generales del SDK: `plugin-sdk/codex-mcp-projection` y
`plugin-sdk/codex-native-task-runtime`. Las importaciones de extensiones entre propietarios quedan bloqueadas
por las protecciones del contrato del paquete.

  <AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper de validación de JSON Schema en caché para esquemas propiedad del Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, traductor de configuración, prompts de listas de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración multi-cuenta y compuerta de acciones, helpers de respaldo de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas y respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Helpers acotados de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/access-groups` | Helpers de análisis de listas de permitidos de grupos de acceso y diagnósticos de grupos redactados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas del esquema de configuración de canales, además de constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales de OpenClaw empaquetados solo para plugins empaquetados mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Ids canónicos de canales de chat empaquetados/oficiales, además de etiquetas/alias de formateador para plugins que necesitan reconocer texto con prefijo de sobre sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales empaquetados |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con respaldo de contrato empaquetado |
    | `plugin-sdk/command-gating` | Helpers acotados de compuerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidad de entrada de canal de bajo nivel. Las rutas de recepción nuevas deberían usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de entrada de canal de alto nivel y constructores de datos de ruta para rutas de recepción de canales migradas. Prefiere esto en lugar de ensamblar listas de permitidos efectivas, listas de permitidos de comandos y proyecciones heredadas en cada Plugin. Consulta [API de entrada de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensajes, además de opciones de canalización de respuestas, recibos, vista previa/transmisión en vivo, helpers de ciclo de vida, identidad saliente, planificación de payloads, envíos duraderos y helpers de contexto de envío de mensajes. Consulta [API de salida de canal](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante y constructor de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-inbound` para ejecutores entrantes y predicados de despacho, y `plugin-sdk/channel-outbound` para helpers de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes y estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helpers acotados de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida de vinculaciones de hilos y adaptadores |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payloads multimedia de agentes |
    | `plugin-sdk/conversation-runtime` | Helpers de conversación/vinculación de hilos, emparejamiento y vinculaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de políticas de grupo en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas acotadas de esquema de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso de grupo |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helpers acotados de política de protección de DM directo previa a criptografía |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad rastreada del propietario; los plugins nuevos deberían usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada de compatibilidad obsoleta de resolución de cuentas de Telegram para compatibilidad rastreada del propietario; los plugins nuevos deberían usar helpers de runtime inyectados o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada de compatibilidad obsoleta de Zalo Personal para paquetes Lark/Zalo publicados que aún importan autorización de comandos del remitente; los plugins nuevos deberían usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y helpers heredados de respuestas interactivas. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helpers compartidos entrantes para clasificación de eventos, construcción de contexto, formateo, raíces, debounce, coincidencia de menciones, política de menciones y registro entrante |
    | `plugin-sdk/channel-inbound-debounce` | Helpers acotados de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers acotados de política de menciones, marcador de mención y texto de mención sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensajes de canal, además de helpers obsoletos de esquemas nativos conservados por compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Helpers compartidos de normalización de rutas, resolución de destinos guiada por analizador, conversión de id de hilo a cadena, claves de ruta de deduplicación/compactas, tipos de destinos analizados y comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Helpers de análisis de destinos; los llamadores de comparación de rutas deberían usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de contrato de secretos, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destinos secretos |
  </Accordion>

Las familias obsoletas de helpers de canal siguen disponibles solo por compatibilidad
con plugins publicados. El plan de eliminación es: conservarlas durante la ventana
de migración de plugins externos, mantener los plugins del repositorio/integrados en `channel-inbound` y
`channel-outbound`, y luego eliminar las subrutas de compatibilidad en la siguiente limpieza mayor
del SDK. Esto se aplica a las antiguas familias de mensaje/runtime de canal, streaming
de canal, acceso directo a DM, fragmentación de helper de entrada, opciones de respuesta
y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor de LM Studio compatible para configuración, detección de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución de LM Studio compatible para valores predeterminados del servidor local, detección de modelos, encabezados de solicitud y ayudantes de modelos cargados |
    | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Ayudantes de resolución de claves de API en tiempo de ejecución para Plugins de proveedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de proveedor, renderizado de página de callback, ayudantes de PKCE/estado, análisis de entrada de autorización, ayudantes de expiración de tokens y ayudantes de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Ayudantes de incorporación/escritura de perfil con clave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Ayudantes de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ayudantes de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedor y ayudantes compartidos de normalización de ID de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Ayudantes de catálogo de modelos de proveedor en vivo para detección protegida estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de ID de modelo, caché TTL y fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución de ampliación del catálogo de proveedores y puntos de unión del registro de proveedores de Plugin para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ayudantes genéricos de HTTP/capacidades de endpoint de proveedor, errores HTTP de proveedor y ayudantes de formularios multiparte para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Ayudantes de contrato estrecho de configuración/selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Ayudantes de registro/caché de proveedor de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Ayudantes estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Ayudantes estrechos de contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Ayudantes de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedor de embeddings y ayudantes de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para que se aplique la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas + diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedor, ayudantes compartidos de obtención de uso y captadores de proveedor como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorio de stream, compatibilidad de llamadas a herramientas en texto sin formato y ayudantes compartidos de envoltorio de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Ayudantes públicos compartidos de envoltorio de stream de proveedor, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de stream compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte nativo de proveedor, como fetch protegido, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Ayudantes de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Ayudantes de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Ayudantes estrechos de modo de activación de grupo y análisis de comandos |
  </Accordion>

Las instantáneas de uso del proveedor normalmente informan una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje usado y una hora de restablecimiento opcional. Los proveedores que exponen texto de saldo o
estado de cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con un arreglo `windows` vacío, en vez de fabricar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; usa `error` solo cuando el
endpoint de uso falló o no devolvió datos de uso utilizables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ayudantes de registro de comandos, incluido el formato dinámico de menús de argumentos, ayudantes de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Ayudantes de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Ayudantes de perfil/filtro de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Ayudante compartido de resolución de Gateway de aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canales activos |
    | `plugin-sdk/approval-handler-runtime` | Ayudantes más amplios de tiempo de ejecución de manejadores de aprobación; prefiere los puntos de unión más estrechos de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Ayudantes nativos de destino de aprobación, vinculación de cuenta, puerta de ruta, fallback de reenvío y supresión de prompt de ejecución nativa local |
    | `plugin-sdk/approval-reaction-runtime` | Enlaces de reacción de aprobación codificados, payloads de prompt de reacción, almacenes de destino de reacción, ayudantes de texto de pistas de reacción y exportación de compatibilidad para supresión de prompt de ejecución nativa local |
    | `plugin-sdk/approval-reply-runtime` | Ayudantes de payload de respuesta de aprobación de ejecución/Plugin |
    | `plugin-sdk/approval-runtime` | Ayudantes de payload de aprobación de ejecución/Plugin, ayudantes nativos de enrutamiento/tiempo de ejecución de aprobación y ayudantes de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Ayudantes estrechos de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Ayudantes estrechos de prueba de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico de menús de argumentos y ayudantes nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Ayudantes compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas de canal activas |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y ayudantes de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Ayudantes diferidos de flujo de inicio de sesión de autenticación de proveedor para canal privado y emparejamiento con código de dispositivo de la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes estrechos de recopilación de contrato de secretos para superficies de secretos de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Ayudantes estrechos de tipado de `coerceSecretRef` y SecretRef para análisis de contrato de secretos/configuración |
    | `plugin-sdk/secret-provider-integration` | Contratos de manifiesto y presets de integración de proveedor SecretRef solo de tipos para plugins que publican presets externos de proveedor de secretos |
    | `plugin-sdk/security-runtime` | Ayudantes compartidos de confianza, puerta de DM, archivos/rutas acotados a la raíz, incluidas escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, ayudantes de almacén de archivos privados, protecciones de padres de symlink, contenido externo, censura de texto sensible, comparación de secretos en tiempo constante y ayudantes de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Ayudantes de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Ayudantes estrechos de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF, error SSRF y ayudantes de política SSRF |
    | `plugin-sdk/secret-input` | Ayudantes de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Ayudantes de solicitud/destino de Webhook y coerción sin procesar de websocket/cuerpo |
    | `plugin-sdk/webhook-request-guards` | Ayudantes de tamaño/timeout de cuerpo de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ayudantes amplios de tiempo de ejecución, registro, copia de seguridad e instalación de plugins |
    | `plugin-sdk/runtime-env` | Ayudantes específicos para entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfil/valores predeterminados normalizados, análisis de URL de CDP y ayudantes de autenticación de control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Ayudantes genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por arneses que usan un alcance de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Ayudante Codex incluido reservado para proyectar la configuración de servidor MCP del usuario en la configuración de hilo de Codex; no es para plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante Codex incluido privado para cableado nativo de espejo/tiempo de ejecución de tareas; no es para plugins de terceros |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidad Matrix obsoleta para paquetes de canal de terceros más antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad Mattermost obsoleta para paquetes de canal de terceros más antiguos; los plugins nuevos deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de comandos/hooks/http/interactivos de plugins |
    | `plugin-sdk/hook-runtime` | Ayudantes compartidos de canalización de Webhook/interna de hooks |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación/enlace diferidos de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Ayudantes de formato, espera, versión, invocación de argumentos y grupo de comandos diferidos de CLI |
    | `plugin-sdk/qa-live-transport-scenarios` | Ids compartidos de escenarios de QA de transporte en vivo, ayudantes de cobertura base y ayudante de selección de escenarios |
    | `plugin-sdk/gateway-method-runtime` | Ayudante reservado de despacho de métodos de Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, ayudante de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores de protocolo de Gateway, resolución de host LAN anunciado y ayudantes de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie enfocada de configuración solo de tipos para formas de configuración de plugins como `OpenClawConfig` y tipos de configuración de canal/proveedor |
    | `plugin-sdk/plugin-config-runtime` | Ayudantes de búsqueda de configuración de plugins en tiempo de ejecución como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Ayudantes transaccionales de mutación de configuración como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de indicios de metadatos de entrega de herramientas de mensaje |
    | `plugin-sdk/runtime-config-snapshot` | Ayudantes de instantánea de configuración del proceso actual como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivos sin el barril de texto amplio |
    | `plugin-sdk/approval-reaction-runtime` | Enlaces codificados de reacciones de aprobación, cargas de prompts de reacción, almacenes de destinos de reacción, ayudantes de texto de indicios de reacción y exportación de compatibilidad para supresión local de prompts de ejecución nativa |
    | `plugin-sdk/approval-runtime` | Ayudantes de aprobación de ejecución/plugin, constructores de capacidades de aprobación, ayudantes de autenticación/perfil, ayudantes de enrutamiento/tiempo de ejecución nativos y formato de rutas de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos de tiempo de ejecución de entradas/respuestas, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Ayudantes compartidos de historial de respuestas de ventana corta. El código nuevo de turno de mensaje debe usar `createChannelHistoryWindow`; los ayudantes de mapa de nivel inferior permanecen solo como exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes de flujo de trabajo de sesión (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lecturas acotadas de texto de transcripción reciente de usuario/asistente por identidad de sesión, ayudantes heredados de ruta de almacén de sesión/clave de sesión, lecturas de actualizado-en y ayudantes de compatibilidad de almacén completo/ruta de archivo solo de transición |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripción, ayudantes con alcance de destino/lectura/escritura, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripción |
    | `plugin-sdk/sqlite-runtime` | Ayudantes enfocados de esquema de agente, ruta y transacciones SQLite para tiempo de ejecución de primera parte |
    | `plugin-sdk/cron-store-runtime` | Ayudantes de ruta/carga/guardado de almacén Cron |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave SQLite auxiliar de Plugin, además de configuración centralizada de pragma de conexión y mantenimiento WAL para bases de datos propiedad del Plugin |
    | `plugin-sdk/routing` | Ayudantes de ruta/clave de sesión/vinculación de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de slug/cadena |
    | `plugin-sdk/request-url` | Extraer URL de cadena desde entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con temporizador y resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramienta/CLI |
    | `plugin-sdk/tool-plugin` | Definir un Plugin sencillo de herramienta de agente tipado y exponer metadatos estáticos para generación de manifiestos |
    | `plugin-sdk/tool-payload` | Extraer cargas normalizadas desde objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y ayudantes de comandos SSH/OpenShell, incluida comprobación previa de comando exec de fallo rápido |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas de descarga temporal y espacios de trabajo temporales seguros privados |
    | `plugin-sdk/logging-core` | Registrador de subsistema y ayudantes de redacción |
    | `plugin-sdk/markdown-table-runtime` | Modo de tabla Markdown y ayudantes de conversión |
    | `plugin-sdk/model-session-runtime` | Ayudantes de sobrescritura de modelo/sesión como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Ayudantes de resolución de configuración de proveedor Talk |
    | `plugin-sdk/json-store` | Ayudantes pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Ayudantes de análisis JSON que preservan literales enteros no seguros como cadenas |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Ayudantes de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Ayudantes ligeros de registro de backend ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de tiempo de ejecución de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de arranque de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de canal pasivo, estado y ayudante de proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de Plugin de confianza para arneses de agente de bajo nivel: tipos de arnés, ayudantes para dirigir/anular ejecuciones activas, ayudantes de puente de herramientas de OpenClaw, ayudantes de política de herramientas de plan de tiempo de ejecución, clasificación de resultado terminal, ayudantes de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoint propiedad del proveedor Z.AI; usa la API pública del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Ayudante de bloqueo asíncrono local al proceso para archivos pequeños de estado en tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Ayudante de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Ayudante de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Ayudantes de caché de deduplicación en memoria y respaldada por persistencia |
    | `plugin-sdk/delivery-queue-runtime` | Ayudante de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Ayudantes seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Ayudantes de activación, evento y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Ayudante de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Ayudantes de token/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Ayudantes de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Ayudante de espera de preparación de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Ayudantes de archivo de política de aprobaciones de ejecución sin el barril amplio infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Ayudantes pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de bandera diagnóstica, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, ayudantes compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y ayudantes de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de datos de imagen inline y ayudantes de detección de firma sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculación configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesión sin importaciones amplias de escrituras/mantenimiento de configuración |
    | `plugin-sdk/sqlite-runtime` | Ayudantes enfocados de esquema de agente, ruta y transacciones SQLite sin controles de ciclo de vida de base de datos |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Ayudantes específicos de coerción y normalización de registros primitivos/cadenas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de nombre de host y host SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Ayudantes de directorio/identidad/espacio de trabajo de agente, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener, transformar y almacenar medios, incluidos `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; prefiere los helpers de almacenamiento antes de las lecturas de búfer cuando una URL deba convertirse en medios de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización MIME específica, asignación de extensiones de archivo, detección MIME y helpers de tipo de medio |
    | `plugin-sdk/media-store` | Helpers específicos de almacenamiento de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones de helpers orientados al proveedor para imagen, audio y extracción estructurada |
    | `plugin-sdk/text-chunking` | Helpers de fragmentación y renderizado de texto y markdown, conversión de tablas markdown, eliminación de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones de directivas, registro, validación, constructor de TTS compatible con OpenAI y helpers de voz orientados al proveedor |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper de arranque de perfil en tiempo real para inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, helpers de registro y helpers compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de helpers de URL de datos/recursos de imagen y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, helpers de registro, descriptores de sesión y metadatos de enunciados |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` desde `zod` directamente |
    | `plugin-sdk/testing` | Módulo agregador de compatibilidad obsoleto local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deberían importar subrutas locales de prueba enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes de helpers de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativos locales del repositorio para contratos de adaptador de runtime de agentes para pruebas de autenticación, entrega, fallback, hook de herramienta, superposición de prompt, esquema y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Helpers de prueba orientados a canales locales del repositorio para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de arranque de cuenta, threading de configuración de envío, mocks de runtime, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida local del repositorio de casos de error de resolución de destino para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Helpers locales del repositorio para contratos de paquete de plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers locales del repositorio para contratos de runtime de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de repetición, STT en tiempo real con audio en vivo, búsqueda/obtención web y stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación de Vitest opcionales locales del repositorio para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures locales genéricos del repositorio para captura de runtime de CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento del sistema, recarga de módulo, ruta de plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers específicos locales del repositorio para mocks de elementos integrados de Node para usar dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie incluida de helpers memory-core para helpers de administrador/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helpers ligeros de registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos. `registerMemoryEmbeddingProvider` en esta superficie está obsoleto; usa la API genérica de proveedor de embeddings para nuevos proveedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivo/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto del proveedor para helpers de runtime central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto del proveedor para helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown gestionado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Las subrutas de SDK reservadas para helpers incluidos son superficies específicas
    y estrechas de propietario para código de plugins incluidos. Se rastrean en el
    inventario del SDK para que las compilaciones de paquetes y los alias sigan
    siendo deterministas, pero no son API generales para la creación de plugins.
    Los nuevos contratos de host reutilizables deberían usar subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del plugin Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del plugin Codex incluido para reflejar subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
