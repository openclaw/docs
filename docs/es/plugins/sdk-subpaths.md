---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se ubican dónde, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-05T11:32:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feb618466479488b576a6942ad4a21061a20e57870a2151b1cdcb868db9b80bb
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de Plugin se expone como un conjunto de subrutas públicas estrechas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas por
propósito. Tres archivos definen la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila la compilación.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas locales del repositorio
  de pruebas/internas. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas obsoletas,
  helpers empaquetados reservados, fachadas empaquetadas admitidas y
  superficies públicas propiedad de Plugins.

Los mantenedores auditan el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas activas de helpers reservados con `pnpm plugins:boundary-report:summary`;
las exportaciones de helpers reservados sin uso hacen fallar el informe de CI en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para la guía de creación de Plugins, consulta [Resumen del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers de elementos de proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, helpers de redacción y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Helpers de migración en tiempo de ejecución como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`            |
| `plugin-sdk/health`            | Registro, detección, reparación, selección, gravedad y tipos de hallazgos de comprobaciones de estado de Doctor para consumidores de estado empaquetados                                               |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`); define esquemas locales del Plugin en su lugar y valídalos con `plugin-sdk/json-schema-runtime`                 |

### Compatibilidad obsoleta y helpers de prueba

Las subrutas obsoletas permanecen exportadas para Plugins antiguos, pero el código nuevo debe usar las
subrutas enfocadas del SDK siguientes. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las importaciones de
producción empaquetadas desde ella. Los barrels amplios como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` y
`plugin-sdk/text-runtime` son solo de compatibilidad, y `plugin-sdk/zod` es una
reexportación de compatibilidad: importa `zod` directamente desde `zod`. Los barrels amplios de dominio
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de subrutas
enfocadas.

Las subrutas de helpers de prueba de OpenClaw respaldadas por Vitest son solo locales del repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` y `testing`. Las superficies privadas de helpers empaquetados
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo locales del repositorio.

### Subrutas de helpers de Plugins empaquetados reservadas

`plugin-sdk/codex-mcp-projection` es la única subruta reservada: una superficie de
compatibilidad propiedad de Plugin para el Plugin Codex empaquetado, no una API general del SDK.
Las importaciones de Plugins entre propietarios están bloqueadas por las protecciones del contrato del paquete, y
CI falla cuando una subruta reservada deja de importarse.
`plugin-sdk/codex-native-task-runtime` es solo local del repositorio y no es una exportación del paquete.

`src/plugin-sdk/entrypoints.ts` también rastrea fachadas empaquetadas admitidas, puntos de entrada del SDK
respaldados por su Plugin empaquetado hasta que contratos genéricos los reemplacen:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` y `plugin-sdk/zalouser`. Varias de estas también están
obsoletas para código nuevo; consulta las notas por fila a continuación.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Ayudante de validación de esquemas JSON en caché para esquemas propiedad del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, traductor de configuración, solicitudes de lista de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración multicuentas/puerta de acciones, ayudantes de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuenta + reserva predeterminada |
    | `plugin-sdk/account-helpers` | Ayudantes específicos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/access-groups` | Ayudantes de análisis de listas de permitidos de grupos de acceso y diagnósticos de grupos redactados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas del esquema de configuración de canal, además de constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos de OpenClaw solo para plugins incluidos mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Ids canónicos de canales de chat incluidos/oficiales, además de etiquetas/alias de formateador para plugins que necesitan reconocer texto con prefijo de envoltorio sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Normalización obsoleta de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos; usa gestión de configuración de comandos local del plugin en código de plugins nuevo |
    | `plugin-sdk/command-gating` | Ayudantes específicos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Superficie de compatibilidad de entrada de canal de bajo nivel. Las nuevas rutas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Solucionador experimental de runtime de entrada de canal de alto nivel y constructores de datos de ruta para rutas migradas de recepción de canales. Prefiere esto antes que ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada plugin. Consulta [API de entrada de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensajes, además de opciones de canalización de respuesta, confirmaciones, vista previa/transmisión en tiempo real, ayudantes de ciclo de vida, identidad saliente, planificación de carga útil, envíos duraderos y ayudantes de contexto de envío de mensajes. Consulta [API de salida de canal](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos de ruta entrante + constructor de envoltorios |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-inbound` para ejecutores entrantes y predicados de despacho, y `plugin-sdk/channel-outbound` para ayudantes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos de carga de medios salientes y estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Ayudantes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Ciclo de vida de enlaces de hilos y ayudantes de adaptador |
    | `plugin-sdk/agent-media-payload` | Raíces y cargadores de cargas útiles de medios de agentes |
    | `plugin-sdk/conversation-runtime` | Módulo de reexportación amplio obsoleto para conversación/enlace de hilos, emparejamiento y ayudantes de enlaces configurados; prefiere subrutas de enlace enfocadas, como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de políticas de grupo de runtime |
    | `plugin-sdk/channel-status` | Ayudantes compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Ayudantes obsoletos de decisión de acceso a grupos; usa `resolveChannelMessageIngress` desde `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Ayudantes específicos de política de guarda de DM directa anterior a cifrado |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad del propietario rastreada; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad del propietario rastreada; los plugins nuevos deben usar ayudantes de runtime inyectados o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada de compatibilidad obsoleta de Zalo Personal para paquetes Lark/Zalo publicados que aún importan autorización de comandos del remitente; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y ayudantes heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Ayudantes entrantes compartidos para clasificación de eventos, construcción de contexto, formateo, raíces, antirrebote, coincidencia de menciones, política de menciones y registro entrante |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes específicos de antirrebote entrante |
    | `plugin-sdk/channel-mention-gating` | Ayudantes específicos de política de menciones, marcador de mención y texto de mención sin la superficie más amplia de runtime entrante |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Ayudantes de acciones de mensajes de canal, además de ayudantes obsoletos de esquemas nativos conservados por compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos basada en analizador, conversión de id de hilo a cadena, claves de ruta de deduplicación/compactación, tipos de destino analizado y ayudantes de comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Ayudantes de análisis de destinos; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de comentarios/reacciones |
  </Accordion>

Las familias de asistentes de canal obsoletas permanecen disponibles solo por
compatibilidad con plugins publicados. El plan de eliminación es: conservarlas
durante la ventana de migración de plugins externos, mantener los plugins del
repositorio/incluidos en `channel-inbound` y `channel-outbound`, y luego eliminar
las subrutas de compatibilidad en la próxima limpieza mayor del SDK. Esto se
aplica a las familias antiguas de mensajes/tiempo de ejecución de canal,
streaming de canal, acceso a MD directo, fragmento de asistente entrante,
opciones de respuesta y ruta de emparejamiento.

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible del tiempo de ejecución de LM Studio para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y helpers de modelos cargados |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers obsoletos de configuración autohospedada compatible con OpenAI; usa `plugin-sdk/provider-setup` o helpers de configuración propiedad del plugin |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de tiempo de ejecución de autenticación de proveedor: flujo OAuth de loopback, intercambio de tokens, persistencia de autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de proveedor, renderizado de página de callback, helpers de PKCE/estado, análisis de entrada de autorización, helpers de expiración de tokens y helpers de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación/escritura de perfil de claves de API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, helpers de endpoints de proveedor y helpers compartidos de normalización de id. de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers de catálogo de modelos de proveedor en vivo para descubrimiento protegido estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de id. de modelo, caché TTL y fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución de aumento de catálogo de proveedor y uniones de registro de plugin-proveedor para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedor, errores HTTP de proveedor y helpers de formulario multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers de contrato acotados de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedor web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers acotados de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers acotados de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedor web-search |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedor de embeddings y helpers de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para que se aplique la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquema + diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantánea de uso de proveedor, helpers compartidos de obtención de uso y obtenedores de proveedor como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream, compatibilidad de llamadas a herramientas en texto plano y helpers compartidos de envoltorios de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Helpers públicos compartidos de envoltorios de stream de proveedor, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de stream compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo de proveedor como fetch protegido, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parches de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Helpers acotados de modo de activación de grupo y análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedor normalmente informan una o más `windows` de cuota, cada una con
una etiqueta, porcentaje usado y hora de restablecimiento opcional. Los proveedores que exponen texto de saldo o
estado de cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con un array `windows` vacío en vez de fabricar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; usa `error` solo cuando el
endpoint de uso falló o no devolvió datos de uso utilizables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia obsoleta de autorización de comandos (`resolveControlCommandGate`, helpers de registro de comandos incluido el formateo dinámico de menús de argumentos, helpers de autorización de remitentes); usa autorización de entrada/tiempo de ejecución de canal o helpers de estado de comandos |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprobación de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canales |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de tiempo de ejecución de manejadores de aprobación; prefiere las uniones más acotadas de adaptador/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprobación, vinculación de cuenta, puerta de ruta, fallback de reenvío y supresión de prompts de exec nativo local |
    | `plugin-sdk/approval-reaction-runtime` | Enlaces de reacción de aprobación codificados de forma fija, payloads de prompts de reacción, almacenes de destinos de reacción, helpers de texto de sugerencias de reacción y exportación de compatibilidad para la supresión de prompts de exec nativo local |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprobación de exec/plugin, constructores de capacidades de aprobación, helpers de autenticación/perfil de aprobación, helpers nativos de enrutamiento/tiempo de ejecución de aprobación y helpers estructurados de visualización de aprobación como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers obsoletos acotados de reinicio de deduplicación de respuestas entrantes |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formateo dinámico de menús de argumentos y helpers nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas calientes de canales |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo de comando y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helpers de flujo diferido de inicio de sesión de autenticación de proveedor para canal privado y emparejamiento de código de dispositivo de Web UI |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia obsoleta de contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destino de secretos); prefiere las subrutas enfocadas siguientes |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones acotadas de contrato de secretos para superficies de secretos de canal/plugin que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Helpers acotados de asignación de secretos TTS anidados de canal |
    | `plugin-sdk/secret-ref-runtime` | Helpers acotados de tipado de `coerceSecretRef` y SecretRef para análisis de contrato/configuración de secretos |
    | `plugin-sdk/secret-provider-integration` | Contratos solo de tipos de manifiesto y preajustes de integración de proveedor SecretRef para plugins que publican preajustes externos de proveedor de secretos |
    | `plugin-sdk/security-runtime` | Barrel amplio obsoleto para confianza, bloqueo de DM, helpers de archivos/rutas acotados a raíz incluidos escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, fallback de movimiento entre dispositivos, helpers de almacén de archivos privado, protecciones de padres de symlink, contenido externo, redacción de texto sensible, comparación de secretos en tiempo constante y helpers de recopilación de secretos; prefiere subrutas enfocadas de seguridad/SSRF/secreto |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers acotados de dispatcher fijado sin la amplia superficie de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido por SSRF, error SSRF y helpers de política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño de cuerpo de solicitud/timeout |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers de tiempo de ejecución, registro y copias de seguridad, advertencias de ruta de instalación de plugins y helpers de proceso |
    | `plugin-sdk/runtime-env` | Helpers acotados de entorno de tiempo de ejecución, registrador, timeout, reintento y backoff |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfiles/valores predeterminados normalizados, análisis de URL de CDP y helpers de autenticación para control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Helpers genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por arneses que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex empaquetado reservado para proyectar la configuración de servidores MCP de usuario en la configuración de hilos de Codex; no es para plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex empaquetado local del repositorio para cableado de espejo/tiempo de ejecución de tareas nativas; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canales |
    | `plugin-sdk/matrix` | Fachada de compatibilidad Matrix obsoleta para paquetes de canal de terceros antiguos; los nuevos plugins deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad Mattermost obsoleta para paquetes de canal de terceros antiguos; los nuevos plugins deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel amplio obsoleto para helpers de comandos/hooks/http/interactivos de plugins; prefiere subrutas enfocadas de tiempo de ejecución de plugins |
    | `plugin-sdk/hook-runtime` | Barrel amplio obsoleto para helpers de Webhook/canalización interna de hooks; prefiere subrutas enfocadas de hooks/tiempo de ejecución de plugins |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación diferida de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Barrel amplio obsoleto para helpers de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos; prefiere subrutas enfocadas de CLI/tiempo de ejecución |
    | `plugin-sdk/qa-live-transport-scenarios` | Ids compartidos de escenarios de QA de transporte en vivo, helpers de cobertura base y helper de selección de escenarios |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatible que expone escenarios de QA de plugins mediante la superficie de comandos de CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatible para esquemas de configuración de texto a voz y helpers de tiempo de ejecución |
    | `plugin-sdk/gateway-method-runtime` | Helper reservado de despacho de métodos de Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de inicio de cliente listo para bucle de eventos, RPC de CLI de Gateway, errores de protocolo de Gateway, resolución de host LAN anunciado y helpers de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie enfocada de configuración solo de tipos para formas de configuración de plugins como `OpenClawConfig` y tipos de configuración de canales/proveedores |
    | `plugin-sdk/plugin-config-runtime` | Helpers de búsqueda de configuración de plugins en tiempo de ejecución como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers transaccionales de mutación de configuración como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de sugerencias de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de instantánea de configuración del proceso actual como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y setters de instantáneas de prueba |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin el barrel amplio de texto |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta. El nuevo código de turnos de mensajes debe usar `createChannelHistoryWindow`; los helpers de mapa de nivel inferior siguen siendo solo exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers acotados de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lecturas acotadas de texto reciente de transcripción de usuario/asistente por identidad de sesión, helpers heredados de ruta de almacén de sesiones/clave de sesión, lecturas de updated-at y helpers de compatibilidad solo de transición de almacén completo/ruta de archivo, sin escrituras amplias de configuración ni importaciones de mantenimiento |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripción, helpers de destino/lectura/escritura con ámbito, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripción |
    | `plugin-sdk/sqlite-runtime` | Helpers enfocados de esquema de agente, rutas y transacciones de SQLite para tiempo de ejecución propio, sin controles del ciclo de vida de base de datos |
    | `plugin-sdk/cron-store-runtime` | Helpers de ruta/carga/guardado de almacén de Cron |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave en SQLite sidecar de Plugin, más configuración centralizada de pragma de conexión y mantenimiento WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Helpers de enlace de ruta/clave de sesión/cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-plugin` | Define un Plugin sencillo tipado de herramienta de agente y expone metadatos estáticos para generación de manifiestos |
    | `plugin-sdk/tool-payload` | Extrae cargas normalizadas desde objetos de resultado de herramienta |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y helpers de comandos SSH/OpenShell, incluida prevalidación de comandos exec con fallo rápido |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas de descarga temporal y espacios de trabajo temporales seguros privados |
    | `plugin-sdk/logging-core` | Helpers de registrador de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabla Markdown y conversión |
    | `plugin-sdk/model-session-runtime` | Helpers de anulación de modelo/sesión como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolución de configuración de proveedores de conversación |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Helpers de análisis JSON que conservan literales enteros no seguros como cadenas |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Helpers ligeros de registro de backend ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de enlaces ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquema de configuración de tiempo de ejecución de agente; importa primitivas de esquema desde una superficie mantenida y propiedad de un plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivo y tokens de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de canal pasivo, estado y helper de proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/compilación/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin confiable para arneses de agente de bajo nivel: tipos de arnés, helpers de guiar/abortar ejecución activa, helpers de puente de herramientas de OpenClaw, helpers de política de herramientas de plan de tiempo de ejecución, clasificación de resultado terminal, helpers de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; usa la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de caché de deduplicación en memoria y respaldada por persistencia |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vaciado de entregas pendientes salientes |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de activación, evento y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de disponibilidad de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Helpers de archivo de política de aprobaciones exec sin el barrel amplio de infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de bandera de diagnóstico, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, helpers compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y helpers de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del dispatcher sin importaciones de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de datos de imagen en línea y helpers de detección de firma sin la superficie amplia de tiempo de ejecución de medios |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de enlace de conversación sin enrutamiento de enlaces configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers acotados de coerción y normalización de registros/cadenas primitivas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Helpers de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Barrel amplio obsoleto para helpers de directorio/identidad/espacio de trabajo de agente, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; prefiere subrutas enfocadas de agente/tiempo de ejecución |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel multimedia amplio obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; prefiere `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas de tiempo de ejecución de capacidades, y prefiere los ayudantes de almacenamiento antes que las lecturas de búfer cuando una URL deba convertirse en contenido multimedia de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización MIME acotada, mapeo de extensiones de archivo, detección MIME y ayudantes de tipo de contenido multimedia |
    | `plugin-sdk/media-store` | Ayudantes acotados del almacén de contenido multimedia, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de conmutación por error para generación de contenido multimedia, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión multimedia, además de exportaciones de ayudantes de imagen/audio/extracción estructurada orientados al proveedor |
    | `plugin-sdk/text-chunking` | Ayudantes de fragmentación/renderizado de texto saliente y markdown, conversión de tablas markdown, eliminación de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones de directivas, registro, validación, constructor TTS compatible con OpenAI y ayudantes de voz orientados al proveedor |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directiva, normalización y exportaciones de ayudantes de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, ayudantes de registro y ayudante compartido de sesión WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Ayudante de arranque de perfil en tiempo real para inyección acotada de contexto `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, ayudantes de registro y ayudantes compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de ayudantes de recurso de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y ayudantes de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos obsoletos de generación de música, ayudantes de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo; prefiere superficies de proveedor de música propiedad del plugin |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, ayudantes de conmutación por error, búsqueda de proveedor y análisis de referencias de modelo |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, ayudantes de registro, descriptores de sesión y metadatos de enunciados |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y ayudantes de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Ayudantes compartidos de carga de contenido multimedia remoto/local |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` desde `zod` directamente |
    | `plugin-sdk/testing` | Barrel de compatibilidad obsoleto local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deben importar subrutas locales de prueba enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Ayudante mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes de ayudantes de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de tiempo de ejecución de agente, locales del repositorio, para pruebas de autenticación, entrega, fallback, hook de herramienta, superposición de prompt, esquema y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Ayudantes de prueba orientados a canales y locales del repositorio para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, encadenamiento de configuración de envío, mocks de tiempo de ejecución, incidencias de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida local del repositorio de casos de error de resolución de destino para pruebas de canal |
    | `plugin-sdk/channel-contract-testing` | Ayudantes acotados de pruebas de contrato de canal, locales del repositorio, sin el barrel amplio de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Ayudantes de contrato locales del repositorio para paquete de plugin, registro, artefacto público, importación directa, API de tiempo de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Ayudantes locales del repositorio para pruebas de almacén de estado de plugin, cola de ingreso y base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Ayudantes locales del repositorio para contratos de tiempo de ejecución de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad multimedia, política de reproducción, STT en tiempo real con audio en vivo, búsqueda/obtención web y flujo |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación opt-in de Vitest, locales del repositorio, para pruebas de proveedor que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Ayudantes locales del repositorio para adjuntar metadatos a fixtures de carga útil de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Ayudantes locales del repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos locales del repositorio para captura de tiempo de ejecución de CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento de sistema, recarga de módulo, ruta de plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Ayudantes enfocados locales del repositorio para mocks de módulos incorporados de Node que se usan dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta de tiempo de ejecución de índice/búsqueda de memoria; prefiere subrutas memory-host neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Ayudantes ligeros de registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y ayudantes genéricos por lote/remotos. `registerMemoryEmbeddingProvider` en esta superficie está obsoleto; usa la API genérica de proveedor de embeddings para nuevos proveedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales obsoletos del host de memoria; prefiere subrutas memory-host neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta obsoletos del host de memoria; prefiere subrutas memory-host neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Ayudantes de tiempo de ejecución CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Ayudantes de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivo/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para ayudantes de tiempo de ejecución principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para ayudantes de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Ayudantes compartidos de markdown administrado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de ayudantes incluidos">
    Las subrutas SDK reservadas de ayudantes incluidos son superficies acotadas y específicas del propietario para
    código de plugins incluidos. Se rastrean en el inventario del SDK para que las compilaciones
    de paquetes y los alias se mantengan deterministas, pero no son API generales
    de creación de plugins. Los nuevos contratos de host reutilizables deben usar subrutas genéricas del SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Ayudante del plugin Codex incluido para proyectar la configuración de servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones Codex (exportación de paquete reservada) |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante del plugin Codex incluido para reflejar subagentes nativos del servidor de aplicaciones Codex en el estado de tareas de OpenClaw (solo local del repositorio, no es una exportación de paquete) |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
