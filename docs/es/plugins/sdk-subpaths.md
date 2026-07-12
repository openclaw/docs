---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para importar un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de plugins
x-i18n:
    generated_at: "2026-07-12T14:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4ad11615c889a6a692c243f321612050388a647975b2075376e7c787df933ff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas específicas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso habitual agrupadas por
finalidad. Tres archivos definen la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila el proceso de construcción.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas internas o de
  prueba locales del repositorio. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, auxiliares reservados incluidos, fachadas incluidas compatibles y
  superficies públicas propiedad de plugins.

Los mantenedores auditan el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas auxiliares reservadas activas con `pnpm plugins:boundary-report:summary`;
las exportaciones auxiliares reservadas sin usar hacen que falle el informe de CI en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración como `createMigrationItem`, constantes de motivos, marcadores de estado de elementos, auxiliares de ocultación y `summarizeMigrationItems`           |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                              |
| `plugin-sdk/health`            | Tipos de registro, detección, reparación, selección, gravedad y hallazgos de comprobaciones de estado de Doctor para consumidores de estado incluidos                                                    |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod de `openclaw.json` raíz (`OpenClawSchema`); defina en su lugar esquemas locales del plugin y valídelos con `plugin-sdk/json-schema-runtime`                                        |

### Auxiliares obsoletos de compatibilidad y pruebas

Las subrutas obsoletas siguen exportándose para plugins antiguos, pero el código nuevo debe usar las
subrutas específicas del SDK que aparecen a continuación. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las
importaciones de producción incluidas que procedan de ella. Los barrels amplios como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` y
`plugin-sdk/text-runtime` son solo para compatibilidad, y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los barrels amplios de dominio
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de subrutas
específicas.

Las subrutas auxiliares de pruebas de OpenClaw basadas en Vitest son solo locales del repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` y `testing`. Las superficies auxiliares privadas incluidas
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo locales del repositorio.

### Subrutas auxiliares reservadas de plugins incluidos

`plugin-sdk/codex-mcp-projection` es la única subruta reservada: una superficie de
compatibilidad propiedad de un plugin para el plugin Codex incluido, no una API general del SDK.
Las importaciones de plugins entre propietarios están bloqueadas por las protecciones del contrato del paquete, y
CI falla cuando una subruta reservada deja de importarse.
`plugin-sdk/codex-native-task-runtime` es solo local del repositorio y no es una
exportación del paquete.

`src/plugin-sdk/entrypoints.ts` también registra las fachadas incluidas compatibles, puntos de entrada del SDK
respaldados por su plugin incluido hasta que los sustituyan contratos genéricos:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` y `plugin-sdk/zalouser`. Varios de ellos también están
obsoletos para código nuevo; consulte las notas de cada fila a continuación.

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Asistente de validación de JSON Schema con caché para esquemas propiedad del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Asistentes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos y generadores de estados de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Asistentes de configuración y control de acciones para varias cuentas, y asistentes de reserva para la cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, asistentes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Asistentes de búsqueda de cuentas y reserva predeterminada |
    | `plugin-sdk/account-helpers` | Asistentes específicos para listas de cuentas y acciones de cuenta |
    | `plugin-sdk/access-groups` | Asistentes para analizar listas de permitidos de grupos de acceso y generar diagnósticos de grupos con datos censurados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de generadores Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos con OpenClaw, solo para plugins incluidos que reciben mantenimiento |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat incluidos/oficiales, además de etiquetas y alias de formato para plugins que necesitan reconocer texto con prefijo de sobre sin codificar de forma fija su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para los esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Normalización obsoleta de nombres y descripciones de comandos de Telegram, y comprobaciones de duplicados y conflictos; use la gestión de configuración de comandos local del plugin en el código de plugins nuevos |
    | `plugin-sdk/command-gating` | Asistentes específicos para el control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Superficie de compatibilidad de bajo nivel para la entrada de canales. Las rutas de recepción nuevas deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Solucionador experimental de alto nivel para el entorno de ejecución de entrada de canales y generadores de datos de ruta para rutas migradas de recepción de canales. Se recomienda en lugar de ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada plugin. Consulte [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de los mensajes, además de opciones de la canalización de respuestas, confirmaciones, vista previa/transmisión en directo, asistentes del ciclo de vida, identidad saliente, planificación de cargas útiles, envíos duraderos y asistentes de contexto para el envío de mensajes. Consulte [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de despacho de respuestas. |
    | `plugin-sdk/inbound-envelope` | Asistentes compartidos para generar rutas y sobres entrantes |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de despacho, y `plugin-sdk/channel-outbound` para asistentes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto para el análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Asistentes compartidos para cargar contenido multimedia saliente y gestionar el estado del contenido multimedia alojado |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Asistentes específicos para la normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Asistentes del ciclo de vida y adaptadores para vinculaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Raíces y cargadores de cargas útiles multimedia del agente |
    | `plugin-sdk/conversation-runtime` | Módulo de exportación amplio obsoleto para vinculaciones de conversaciones/hilos, emparejamiento y asistentes de vinculaciones configuradas; se recomiendan subrutas específicas de vinculación, como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Asistentes para resolver políticas de grupo durante la ejecución |
    | `plugin-sdk/channel-status` | Asistentes compartidos para instantáneas y resúmenes del estado de los canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Asistentes de autorización para escrituras en la configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones preliminares compartidas de plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Asistentes para editar y leer la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Asistentes obsoletos para decisiones de acceso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Asistentes específicos para políticas de protección de mensajes directos antes del cifrado |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad supervisada por el propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada de compatibilidad obsoleta para la resolución de cuentas de Telegram, destinada a la compatibilidad supervisada por el propietario; los plugins nuevos deben usar asistentes inyectados del entorno de ejecución o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada de compatibilidad obsoleta de Zalo Personal para paquetes publicados de Lark/Zalo que aún importan la autorización de comandos del remitente; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Presentación y entrega semánticas de mensajes, y asistentes heredados para respuestas interactivas. Consulte [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Asistentes compartidos de entrada para la clasificación de eventos, creación de contexto, formato, raíces, antirrebote, coincidencia de menciones, políticas de menciones y registro de entradas |
    | `plugin-sdk/channel-inbound-debounce` | Asistentes específicos de antirrebote para entradas |
    | `plugin-sdk/channel-mention-gating` | Asistentes específicos para políticas de menciones, marcadores de menciones y texto de menciones, sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | Asistentes para acciones de mensajes de canal, además de asistentes obsoletos de esquemas nativos conservados para mantener la compatibilidad de los plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos basada en analizadores, conversión de identificadores de hilos en cadenas, claves de ruta deduplicadas/compactas, tipos de destinos analizados y asistentes para comparar rutas y destinos |
    | `plugin-sdk/channel-targets` | Asistentes para analizar destinos; los consumidores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canal |
    | `plugin-sdk/channel-feedback` | Conexión de comentarios/reacciones |
  </Accordion>

Las familias obsoletas de ayudantes de canal siguen disponibles únicamente por compatibilidad con plugins publicados. El plan de eliminación es el siguiente: mantenerlas durante el período de migración de plugins externos, mantener los plugins del repositorio e incluidos en `channel-inbound` y `channel-outbound`, y después eliminar las subrutas de compatibilidad en la próxima limpieza importante del SDK. Esto se aplica a las antiguas familias de mensajes/entorno de ejecución de canal, transmisión de canal, acceso directo a mensajes directos, fragmentación de ayudantes de entrada, opciones de respuesta y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para configuración, detección de catálogos y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible del entorno de ejecución de LM Studio para valores predeterminados del servidor local, detección de modelos, encabezados de solicitudes y auxiliares de modelos cargados |
    | `plugin-sdk/provider-setup` | Auxiliares seleccionados para configurar proveedores locales o autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares obsoletos de configuración autoalojada compatible con OpenAI; use `plugin-sdk/provider-setup` o auxiliares de configuración propios del plugin |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de la CLI y constantes del supervisor |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticación de proveedores en tiempo de ejecución: flujo OAuth de retorno local, intercambio de tokens, persistencia de la autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de devolución de llamada OAuth de proveedores, renderizado de páginas de devolución de llamada, auxiliares de PKCE/estado, análisis de entradas de autorización, auxiliares de caducidad de tokens y auxiliares de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación y escritura de perfiles mediante clave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Generador estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de búsqueda de variables de entorno para la autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importación de autenticación de OpenAI Codex y exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, generadores compartidos de políticas de reproducción, auxiliares de endpoints de proveedores y auxiliares compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares del catálogo activo de modelos de proveedores para la detección protegida al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para ampliar el catálogo de proveedores y puntos de integración del registro de proveedores de plugins para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidades HTTP/endpoints de proveedores, errores HTTP de proveedores y auxiliares de formularios multiparte para la transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares restringidos del contrato de configuración/selección para obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares restringidos de configuración/credenciales de búsqueda web para proveedores que no necesitan integración de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares restringidos del contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y definidores/obtenedores de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/caché/tiempo de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de incrustaciones y auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para aplicar la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas y diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedores, auxiliares compartidos de obtención de uso y recuperadores de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo, compatibilidad con llamadas a herramientas en texto sin formato y auxiliares compartidos de envoltorios de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartidos de envoltorios de flujo de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de flujo compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Auxiliares de modificación de configuración para la incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/caché locales del proceso |
    | `plugin-sdk/group-activation` | Auxiliares restringidos de análisis del modo y los comandos de activación de grupos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows`
de cuota, cada una con una etiqueta, el porcentaje utilizado y una hora de
restablecimiento opcional. Los proveedores que exponen texto sobre el saldo o el
estado de la cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con un array `windows` vacío, en vez de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` solo
cuando el endpoint de uso haya fallado o no haya devuelto datos de uso válidos.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia y obsoleta de autorización de comandos (`resolveControlCommandGate`, auxiliares del registro de comandos, incluido el formato de menús de argumentos dinámicos, y auxiliares de autorización de remitentes); use la autorización de entrada/tiempo de ejecución del canal o auxiliares de estado de comandos |
    | `plugin-sdk/command-status` | Generadores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfiles/filtros de aprobación de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidades/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Auxiliar determinista de localización persistente para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del controlador de aprobaciones en tiempo de ejecución; prefiera los puntos de integración más restringidos de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprobación, vinculación de cuentas, control de rutas, alternativa de reenvío y supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones de reacciones de aprobación codificadas, cargas útiles de solicitudes de reacción, almacenes de destinos de reacción, auxiliares de texto de indicaciones de reacción y exportación de compatibilidad para la supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas útiles de respuesta para aprobaciones de ejecución/plugins |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas útiles de aprobación de ejecución/plugins, generadores de capacidades de aprobación, auxiliares de autenticación/perfiles de aprobación, auxiliares de enrutamiento/tiempo de ejecución de aprobaciones nativas y auxiliares de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares restringidos y obsoletos para restablecer la desduplicación de respuestas entrantes |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato de menús de argumentos dinámicos y auxiliares nativos de destinos de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y auxiliares de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares de carga diferida del flujo de inicio de sesión para la autenticación de proveedores mediante emparejamiento por código de dispositivo en canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia y obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); prefiera las subrutas específicas siguientes |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones restringidas del contrato de secretos para superficies de secretos de canales/plugins que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Auxiliares restringidos de asignación de secretos TTS anidados de canales |
    | `plugin-sdk/secret-ref-runtime` | Tipado, resolución y búsqueda de rutas de destinos de planes restringidos de SecretRef para el análisis de contratos de secretos/configuración |
    | `plugin-sdk/secret-provider-integration` | Contratos de manifiestos y preajustes de integración de proveedores SecretRef solo de tipo para plugins que publican preajustes de proveedores de secretos externos |
    | `plugin-sdk/security-runtime` | Barrel amplio y obsoleto para confianza, control de mensajes directos, auxiliares de archivos/rutas restringidos a la raíz, incluidas escrituras solo de creación, sustitución atómica síncrona/asíncrona de archivos, escrituras temporales contiguas, alternativa de movimiento entre dispositivos, auxiliares de almacenes privados de archivos, protecciones de padres con enlaces simbólicos, contenido externo, censura de texto confidencial, comparación de secretos en tiempo constante y auxiliares de recopilación de secretos; prefiera las subrutas específicas de seguridad/SSRF/secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de hosts permitidos y políticas SSRF de redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares restringidos de despachadores fijados sin la amplia superficie del entorno de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de despachadores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes/destinos de Webhook y conversión de websockets/cuerpos sin procesar |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño/tiempo de espera del cuerpo de solicitudes |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ayudantes de entorno de ejecución, registro y copias de seguridad, advertencias sobre rutas de instalación de plugins y ayudantes de procesos |
    | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de ejecución, registro, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador compatible para perfiles y valores predeterminados normalizados, análisis de URL de CDP y ayudantes de autenticación para el control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Ayudantes genéricos del ciclo de vida de tareas y entrega de finalización para agentes respaldados por un entorno de ejecución que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Ayudante de Codex incluido y reservado para proyectar la configuración de servidores MCP del usuario en la configuración de hilos de Codex; no destinado a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante de Codex incluido y local al repositorio para el cableado nativo del reflejo de tareas y el entorno de ejecución; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y consulta del contexto del entorno de ejecución de canales |
    | `plugin-sdk/matrix` | Fachada de compatibilidad obsoleta de Matrix para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad obsoleta de Mattermost para paquetes de canales de terceros antiguos; los plugins nuevos deben importar directamente subrutas genéricas del SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Módulo de exportación general obsoleto para ayudantes de comandos, hooks, HTTP e interacción de plugins; se prefieren las subrutas específicas del entorno de ejecución de plugins |
    | `plugin-sdk/hook-runtime` | Módulo de exportación general obsoleto para ayudantes de Webhook y de la canalización interna de hooks; se prefieren las subrutas específicas de hooks y del entorno de ejecución de plugins |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación y vinculación diferidas del entorno de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Módulo de exportación general obsoleto para formato de CLI, espera, versión, invocación de argumentos y ayudantes de grupos de comandos diferidos; se prefieren las subrutas específicas de CLI y entorno de ejecución |
    | `plugin-sdk/qa-live-transport-scenarios` | Identificadores compartidos de escenarios de control de calidad de transporte en vivo, ayudantes de cobertura de referencia y ayudante de selección de escenarios |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatible para esquemas de configuración de texto a voz y ayudantes del entorno de ejecución |
    | `plugin-sdk/gateway-method-runtime` | Ayudante reservado de despacho de métodos del Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, ayudante de inicio de cliente listo para el bucle de eventos, RPC de CLI del Gateway, errores del protocolo del Gateway, resolución del host LAN anunciado y ayudantes de actualización parcial del estado de canales |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica solo de tipos para formas de configuración de plugins, como `OpenClawConfig`, y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Ayudantes de consulta de configuración de plugins en tiempo de ejecución, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Ayudantes de mutación transaccional de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas de sugerencias compartidas de metadatos de entrega de herramientas de mensajería |
    | `plugin-sdk/runtime-config-snapshot` | Ayudantes de instantáneas de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot`, y definidores de instantáneas de prueba |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin el módulo de exportación general de texto |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos del entorno de ejecución para entradas y respuestas, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho y finalización de respuestas, y de etiquetas de conversación |
    | `plugin-sdk/reply-history` | Ayudantes compartidos del historial de respuestas de ventana corta. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; los ayudantes de mapas de nivel inferior se mantienen únicamente como exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ayudantes de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), ayudantes de marcadores para valores transitorios de `sessionFile`, lecturas acotadas de texto reciente de transcripciones del usuario y el asistente por identidad de sesión, ayudantes de rutas del almacén de sesiones y claves de sesión, y lecturas de fecha de actualización, sin importaciones generales de escritura ni mantenimiento de configuración |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripciones, ayudantes con ámbito para destinos, lectura y escritura, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | Ayudantes específicos de esquema SQLite del agente, rutas y transacciones para el entorno de ejecución propio, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | Ayudantes de rutas, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con clave en SQLite complementario de plugins, más configuración centralizada de pragmas de conexión y mantenimiento de WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Ayudantes de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen del estado de canales y cuentas, valores predeterminados del estado del entorno de ejecución y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de identificadores legibles y cadenas |
    | `plugin-sdk/request-url` | Extracción de URL en forma de cadenas desde entradas similares a fetch o request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout y stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y CLI |
    | `plugin-sdk/tool-plugin` | Definición de un plugin sencillo y tipado de herramientas de agente, y exposición de metadatos estáticos para generar manifiestos |
    | `plugin-sdk/tool-payload` | Extracción de cargas útiles normalizadas desde objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de entorno aislado y ayudantes de comandos SSH/OpenShell, incluida la comprobación previa de comandos de ejecución con fallo inmediato |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas de descargas temporales y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Ayudantes de registro de subsistemas y ocultación de datos |
    | `plugin-sdk/markdown-table-runtime` | Ayudantes de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Ayudantes de anulación de modelos y sesiones, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Ayudantes de resolución de configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeños ayudantes de lectura y escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Ayudantes de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Ayudantes de entorno de ejecución y sesiones de ACP, y de despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Ayudantes ligeros de registro del backend de ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquemas de configuración del entorno de ejecución de agentes; importe las primitivas de esquemas desde una superficie mantenida y propiedad del plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de arranque de dispositivos y tokens de emparejamiento, incluido `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de ayudantes de canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuesta de comandos y proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes para enumerar comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes de registro, compilación y serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugins de confianza para entornos de agentes de bajo nivel: tipos de entorno, ayudantes para dirigir y abortar ejecuciones activas, ayudantes del puente de herramientas de OpenClaw, ayudantes de políticas de herramientas del plan de ejecución, clasificación de resultados del terminal, ayudantes de formato y detalle del progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de puntos de conexión propiedad del proveedor Z.AI; use la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Ayudante de bloqueo asíncrono local al proceso para pequeños archivos de estado del entorno de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Ayudante de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | Ayudante de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Ayudantes de caché de desduplicación en memoria y con respaldo persistente |
    | `plugin-sdk/delivery-queue-runtime` | Ayudante de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Ayudantes seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Ayudantes de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | Ayudante de aserción de valores obligatorios para invariantes demostrables del entorno de ejecución |
    | `plugin-sdk/number-runtime` | Ayudante de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Ayudantes seguros de tokens y UUID |
    | `plugin-sdk/system-event-runtime` | Ayudantes de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Ayudante de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | Ayudantes de archivos de políticas de aprobación de ejecución sin el módulo de exportación general del entorno de ejecución de infraestructura |
    | `plugin-sdk/infra-runtime` | Capa de compatibilidad obsoleta; use las subrutas específicas del entorno de ejecución indicadas anteriormente |
    | `plugin-sdk/collection-runtime` | Pequeños ayudantes de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de indicadores de diagnóstico, eventos y contexto de seguimiento |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, ayudantes compartidos de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Ayudantes de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y consultas fijadas |
    | `plugin-sdk/runtime-fetch` | Fetch del entorno de ejecución compatible con despachadores sin importaciones de proxy ni fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Ayudantes de saneamiento de URL de datos de imágenes en línea y detección de firmas sin la superficie general del entorno de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuestas sin la superficie general del entorno de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado de vinculación de la conversación actual sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad del contexto y filtrado de contexto complementario sin importaciones generales de configuración ni seguridad |
    | `plugin-sdk/string-coerce-runtime` | Ayudantes específicos de coerción y normalización primitivas de registros y cadenas sin importaciones de Markdown ni registro |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Módulo de exportación general obsoleto para ayudantes de directorios, identidad y espacios de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren las subrutas específicas de agentes y entorno de ejecución |
    | `plugin-sdk/directory-runtime` | Consulta y deduplicación de directorios respaldadas por la configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Módulo general de exportaciones de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se recomienda usar `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas del entorno de ejecución de capacidades, así como priorizar los auxiliares de almacenamiento frente a las lecturas de búfer cuando una URL deba convertirse en un medio de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos del almacén de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de conmutación por error para la generación de medios, selección de candidatos y mensajes sobre modelos ausentes |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones de auxiliares de imagen, audio y extracción estructurada orientados a proveedores |
    | `plugin-sdk/text-chunking` | Auxiliares de segmentación y renderizado de texto saliente y Markdown, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones de directivas, registro, validación, generador de TTS compatible con OpenAI y auxiliares de voz orientados a proveedores |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas, normalización y exportaciones de auxiliares de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de inicialización de perfiles en tiempo real para la inyección limitada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, auxiliares de registro y auxiliares compartidos del comportamiento de voz en tiempo real, incluido el seguimiento de la actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de auxiliares de recursos de imagen y URL de datos, y el generador de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes y auxiliares de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedores, solicitudes y resultados de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos obsoletos; se recomienda usar superficies de proveedores de música propiedad del plugin |
    | `plugin-sdk/video-generation` | Tipos de proveedores, solicitudes y resultados de generación de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartidos para cargar medios remotos y locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/testing` | Módulo de exportaciones de compatibilidad obsoleto y local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deben importar subrutas de prueba locales específicas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi`, local del repositorio, para pruebas unitarias de registro directo de plugins sin importar puentes de auxiliares de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Recursos de prueba locales del repositorio para contratos nativos de adaptadores del entorno de ejecución de agentes destinados a pruebas de autenticación, entrega, reserva, enlaces de herramientas, superposición de indicaciones, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de prueba orientados a canales y locales del repositorio para contratos genéricos de acciones, configuración y estado, aserciones de directorios, ciclo de vida del inicio de cuentas, propagación de configuración de envío, simulaciones del entorno de ejecución, incidencias de estado, entrega saliente y registro de enlaces |
    | `plugin-sdk/channel-target-testing` | Conjunto compartido y local del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares específicos y locales del repositorio para pruebas de contratos de canales, sin el módulo general de exportaciones de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales del repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API del entorno de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locales del repositorio para pruebas del almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales del repositorio para contratos de entorno de ejecución de proveedores, autenticación, detección, incorporación, catálogo, asistente, capacidades de medios, política de reproducción, audio en directo de STT en tiempo real, búsqueda y obtención web, y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Simulaciones opcionales y locales del repositorio de HTTP y autenticación de Vitest para pruebas de proveedores que utilizan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales del repositorio para adjuntar metadatos a recursos de prueba de cargas útiles de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locales del repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Recursos de prueba genéricos y locales del repositorio para captura del entorno de ejecución de la CLI, contexto de entorno aislado, escritura de Skills, mensajes de agentes, eventos del sistema, recarga de módulos, rutas de plugins incluidos, texto de terminal, segmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares específicos y locales del repositorio para simular módulos integrados de Node dentro de las factorías `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta del entorno de ejecución de indexación y búsqueda de memoria; se recomiendan las subrutas del host de memoria independientes del proveedor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares ligeros del registro de proveedores de incrustaciones de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de incrustaciones del host de memoria, acceso al registro, proveedor local y auxiliares genéricos para lotes y operaciones remotas. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; use la API genérica de proveedores de incrustaciones para los proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales obsoletos del host de memoria; se recomiendan las subrutas del host de memoria independientes del proveedor |
    | `plugin-sdk/memory-core-host-query` | Auxiliares obsoletos de consulta del host de memoria; se recomiendan las subrutas del host de memoria independientes del proveedor |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares del entorno de ejecución de la CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares del entorno de ejecución principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos y del entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias independiente del proveedor para los auxiliares del entorno de ejecución principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias independiente del proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown administrado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Fachada del entorno de ejecución de Active Memory para acceder al gestor de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares incluidos">
    Las subrutas del SDK reservadas para auxiliares incluidos son superficies
    específicas y limitadas de sus propietarios para el código de plugins incluidos.
    Se registran en el inventario del SDK para que las compilaciones de paquetes
    y la creación de alias sigan siendo deterministas, pero no son API generales
    para crear plugins. Los nuevos contratos reutilizables del host deben usar subrutas
    genéricas del SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y finalidad |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar del plugin Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación de paquete reservada) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del plugin Codex incluido para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local del repositorio, no es una exportación de paquete) |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
