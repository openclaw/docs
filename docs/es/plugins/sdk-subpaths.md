---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para importar un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-16T11:57:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas específicas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso habitual agrupadas por
finalidad. Tres archivos definen la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila la compilación.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas internas y de pruebas
  locales del repositorio. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, auxiliares agrupados reservados, fachadas agrupadas compatibles y
  superficies públicas propiedad de plugins.

Los responsables de mantenimiento auditan el número de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas auxiliares reservadas activas con `pnpm plugins:boundary-report:summary`;
las exportaciones auxiliares reservadas sin utilizar hacen que falle el informe de CI, en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares de elementos de proveedores de migración, como `createMigrationItem`, constantes de motivos, marcadores de estado de elementos, auxiliares de censura y `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registro, detección, reparación, selección, gravedad y tipos de hallazgos de comprobaciones de estado de Doctor para consumidores de estado agrupados                                                                                |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod raíz `openclaw.json` (`OpenClawSchema`); en su lugar, defina esquemas locales del plugin y valídelos con `plugin-sdk/json-schema-runtime`                                                  |

### Auxiliares obsoletos de compatibilidad y pruebas

Las subrutas obsoletas se siguen exportando para plugins antiguos, pero el código nuevo debe usar las
subrutas específicas del SDK que aparecen a continuación. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las
importaciones de producción agrupadas que contiene. Los barrels generales, como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` y
`plugin-sdk/text-runtime`, son solo para compatibilidad, y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los barrels generales
de dominio `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de subrutas
específicas.

Las subrutas auxiliares de pruebas de OpenClaw respaldadas por Vitest son solo locales del repositorio y ya no
son exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` y `testing`. Las superficies auxiliares agrupadas privadas
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo locales
del repositorio.

### Subrutas auxiliares reservadas de plugins agrupados

`plugin-sdk/codex-mcp-projection` es la única subruta reservada: una superficie de
compatibilidad propiedad del plugin para el plugin Codex agrupado, no una API general del SDK.
Las barreras de protección del contrato del paquete bloquean las importaciones entre plugins de distintos propietarios, y
CI falla cuando deja de importarse una subruta reservada.
`plugin-sdk/codex-native-task-runtime` es solo local del repositorio y no es una
exportación del paquete.

`src/plugin-sdk/entrypoints.ts` también hace un seguimiento de las fachadas agrupadas compatibles, puntos de entrada
del SDK respaldados por su plugin agrupado hasta que los sustituyan contratos genéricos:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` y `plugin-sdk/zalouser`. Varios de ellos también están
obsoletos para el código nuevo; consulte las notas de cada fila a continuación.

  <AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Asistente de validación de esquemas JSON en caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Asistentes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos y generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Asistentes de configuración multicuenta y de puerta de acciones, y asistentes de reserva de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, asistentes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Asistentes de búsqueda de cuentas y reserva predeterminada |
    | `plugin-sdk/account-helpers` | Asistentes específicos para listas y acciones de cuentas |
    | `plugin-sdk/access-groups` | Análisis de listas de permitidos de grupos de acceso y asistentes de diagnóstico de grupos con datos ocultos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos con OpenClaw, solo para plugins incluidos y mantenidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat incluidos/oficiales, además de etiquetas y alias de formateadores para plugins que necesiten reconocer texto con prefijo de envoltura sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para los esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Normalización obsoleta de nombres y descripciones de comandos de Telegram, y comprobaciones de duplicados y conflictos; use la gestión local del plugin para la configuración de comandos en el código de plugins nuevo |
    | `plugin-sdk/command-gating` | Asistentes específicos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Solucionador experimental de alto nivel para el entorno de ejecución de entrada de canales y generadores de datos de rutas para las rutas migradas de recepción de canales. Se recomienda en lugar de ensamblar listas de permitidos efectivas, listas de permitidos de comandos y proyecciones heredadas en cada plugin. Consulte [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de mensajes, además de opciones de la canalización de respuestas, confirmaciones, vista previa en directo/transmisión, asistentes del ciclo de vida, identidad de salida, planificación de cargas útiles, envíos duraderos y asistentes de contexto para el envío de mensajes. Consulte [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Asistentes compartidos para generar rutas de entrada y envolturas |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de despacho, y `plugin-sdk/channel-outbound` para asistentes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Asistentes compartidos de carga de contenido multimedia de salida y de estado de contenido multimedia alojado |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Asistentes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Asistentes del ciclo de vida y adaptadores de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Raíces y cargadores de cargas útiles multimedia del agente |
    | `plugin-sdk/conversation-runtime` | Módulo de exportación general obsoleto para la vinculación de conversaciones/hilos, el emparejamiento y los asistentes de vinculaciones configuradas; se recomiendan subrutas de vinculación específicas como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Asistentes de resolución de políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Asistentes compartidos de instantáneas y resúmenes del estado de los canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Asistentes de autorización para escribir la configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas del preámbulo de plugins de canales |
    | `plugin-sdk/allowlist-config-edit` | Asistentes de edición y lectura de la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Asistentes obsoletos de decisión de acceso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Asistentes específicos de políticas de protección para mensajes directos antes del cifrado |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad con Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad registrada del propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad con la resolución de cuentas de Telegram para la compatibilidad registrada del propietario; los plugins nuevos deben usar asistentes inyectados del entorno de ejecución o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad con Zalo Personal para paquetes publicados de Lark/Zalo que aún importan autorización de comandos del remitente; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Asistentes de presentación semántica de mensajes, entrega y respuestas interactivas heredadas. Consulte [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Asistentes compartidos de entrada para la clasificación de eventos, generación de contexto, formato, raíces, antirrebote, coincidencia de menciones, políticas de menciones y registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Asistentes específicos de antirrebote de entrada |
    | `plugin-sdk/channel-mention-gating` | Asistentes específicos de políticas, marcadores y texto de menciones sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | Asistentes de acciones de mensajes de canales, además de asistentes obsoletos de esquemas nativos conservados por compatibilidad con plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos basada en analizadores, conversión de identificadores de hilos en cadenas, claves de rutas compactas y de deduplicación, tipos de destinos analizados y asistentes de comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Asistentes de análisis de destinos; los consumidores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canales |
    | `plugin-sdk/channel-feedback` | Conexión de comentarios/reacciones |
  </Accordion>

Las familias obsoletas de helpers de canal siguen disponibles únicamente por compatibilidad con plugins publicados. El plan de eliminación es el siguiente: mantenerlas durante el periodo de migración de plugins externos, mantener los plugins del repositorio/incluidos en `channel-inbound` y `channel-outbound`, y después eliminar las subrutas de compatibilidad en la próxima limpieza importante del SDK. Esto se aplica a las antiguas familias de mensajes/entorno de ejecución del canal, streaming del canal, acceso directo a mensajes directos, bifurcaciones de helpers de entrada, opciones de respuesta y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para la configuración, la detección del catálogo y la preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible del entorno de ejecución de LM Studio para los valores predeterminados del servidor local, la detección de modelos, los encabezados de solicitud y los auxiliares de modelos cargados |
    | `plugin-sdk/provider-setup` | Auxiliares seleccionados de configuración de proveedores locales o autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares obsoletos de configuración autoalojada compatible con OpenAI; use `plugin-sdk/provider-setup` o auxiliares de configuración propiedad del plugin |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de la CLI y constantes del supervisor |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares del entorno de ejecución para la autenticación de proveedores: flujo de retorno OAuth, intercambio de tokens, persistencia de la autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de devolución de llamada OAuth de proveedores, renderización de la página de devolución de llamada, auxiliares de PKCE/estado, análisis de entradas de autorización, auxiliares de caducidad de tokens y auxiliares de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación y escritura de perfiles mediante claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Generador estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de búsqueda de variables de entorno para la autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, generadores compartidos de políticas de repetición, auxiliares de endpoints de proveedores y auxiliares compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares del catálogo activo de modelos de proveedores para la detección protegida al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché con TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Enlace del entorno de ejecución para ampliar el catálogo de proveedores y puntos de integración del registro de proveedores de plugins para pruebas de contratos |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidades HTTP/endpoints de proveedores, errores HTTP de proveedores y auxiliares de formularios multiparte para la transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares específicos del contrato de configuración/selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan conexiones de activación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares específicos del contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores/obtenedores de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/caché/entorno de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de incrustaciones y auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para garantizar la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas y diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedores, auxiliares compartidos de obtención de uso y funciones de obtención de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos, compatibilidad con llamadas a herramientas en texto sin formato y auxiliares compartidos de envoltorios de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartidos de envoltorios de flujos, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de flujos compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativos de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos grabables de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de parches de configuración para la incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de instancias únicas/mapas/cachés locales del proceso |
    | `plugin-sdk/group-activation` | Auxiliares específicos del modo de activación de grupos y del análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje utilizado y una hora de restablecimiento opcional. Los proveedores que exponen texto sobre el saldo o
el estado de la cuenta en lugar de periodos de cuota restablecibles deben devolver
`summary` con una matriz `windows` vacía, en vez de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` solo cuando el
endpoint de uso haya fallado o no haya devuelto datos de uso aprovechables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia y obsoleta de autorización de comandos (`resolveControlCommandGate`, auxiliares del registro de comandos, incluido el formato de menús de argumentos dinámicos, y auxiliares de autorización de remitentes); use la autorización de entrada/entorno de ejecución del canal o los auxiliares de estado de comandos |
    | `plugin-sdk/command-status` | Generadores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfiles/filtros de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidades/entrega de aprobación nativa |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Auxiliar determinista de localizadores duraderos para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del entorno de ejecución de controladores de aprobación; prefiera los puntos de integración más específicos de adaptadores/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprobación nativa, vinculación de cuentas, puerta de rutas, alternativa de reenvío y supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, cargas útiles de solicitudes de reacción, almacenes de destinos de reacción, auxiliares de texto de indicaciones de reacción y exportación de compatibilidad para la supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas útiles de respuestas de aprobación de ejecución/plugins |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas útiles de aprobación de ejecución/plugins, generadores de capacidades de aprobación, auxiliares de autenticación/perfiles de aprobación, auxiliares de enrutamiento/entorno de ejecución de aprobación nativa y auxiliares de presentación estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares específicos y obsoletos para restablecer la deduplicación de respuestas entrantes |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativos, formato de menús de argumentos dinámicos y auxiliares nativos de destinos de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y auxiliares de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares de carga diferida para el flujo de inicio de sesión de autenticación de proveedores destinado al emparejamiento mediante código de dispositivo en canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia y obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); prefiera las subrutas específicas que aparecen a continuación |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones específicas del contrato de secretos y generadores del registro de destinos para superficies de secretos de canales/plugins que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Auxiliares específicos de asignación anidada de secretos TTS de canales |
    | `plugin-sdk/secret-ref-runtime` | Tipado y resolución específicos de SecretRef, y búsqueda de rutas de destinos del plan para el análisis de contratos de secretos/configuración |
    | `plugin-sdk/secret-provider-integration` | Contratos de manifiestos y preajustes, solo de tipos, para la integración de proveedores SecretRef destinados a plugins que publican preajustes de proveedores de secretos externos |
    | `plugin-sdk/security-runtime` | Módulo de exportación amplio y obsoleto para confianza, control de acceso de mensajes directos, auxiliares de archivos/rutas limitados a la raíz —incluidas escrituras exclusivas para creación, sustitución atómica síncrona/asíncrona de archivos, escrituras temporales adyacentes, alternativa de traslado entre dispositivos, auxiliares de almacenes de archivos privados, protecciones de directorios padre con enlaces simbólicos, contenido externo, ocultación de texto confidencial, comparación de secretos en tiempo constante y auxiliares de recopilación de secretos—; prefiera subrutas específicas de seguridad/SSRF/secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de listas de hosts permitidos y políticas SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares específicos de distribuidores fijados sin la amplia superficie del entorno de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de distribuidores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes/destinos de Webhook y conversión de websockets sin procesar/cuerpos |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño/tiempo de espera del cuerpo de las solicitudes y `runDetachedWebhookWork` para el procesamiento supervisado posterior a la confirmación |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Ayudantes de runtime, registro, copias de seguridad y procesos, y advertencias sobre rutas de instalación de plugins |
    | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de runtime, registrador, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | Fachada de configuración del navegador compatible para perfiles y valores predeterminados normalizados, análisis de URL de CDP y ayudantes de autenticación para el control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Ayudantes genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por un arnés que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Ayudante de Codex incluido y reservado para proyectar la configuración de servidores MCP del usuario en la configuración de hilos de Codex; no está destinado a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante de Codex incluido y local al repositorio para el reflejo nativo de tareas y la conexión del runtime; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y consulta del contexto de runtime del canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidad con Matrix obsoleta para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad con Mattermost obsoleta para paquetes de canales de terceros antiguos; los plugins nuevos deben importar directamente subrutas genéricas del SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Exportación agrupada amplia obsoleta para ayudantes de comandos, hooks, HTTP e interacción de plugins; se prefieren subrutas específicas del runtime de plugins |
    | `plugin-sdk/hook-runtime` | Exportación agrupada amplia obsoleta para ayudantes de Webhook y de canalización de hooks internos; se prefieren subrutas específicas de hooks y del runtime de plugins |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación y vinculación diferidas del runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/node-host` | Ayudantes de resolución de ejecutables del host Node y reanudación de PTY |
    | `plugin-sdk/cli-runtime` | Exportación agrupada amplia obsoleta para formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos; se prefieren subrutas específicas de CLI y runtime |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatible para esquemas de configuración y ayudantes de runtime de texto a voz |
    | `plugin-sdk/gateway-method-runtime` | Ayudante reservado para el envío de métodos del Gateway en rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, ayudante de inicio del cliente preparado para el bucle de eventos, RPC de la CLI del Gateway, errores del protocolo del Gateway, resolución del host LAN anunciado y ayudantes de parcheo del estado del canal |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica, solo de tipos, para formas de configuración de plugins como `OpenClawConfig` y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Ayudantes de configuración de plugins en runtime, como `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Ayudantes de mutación transaccional de la configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de indicación de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Ayudantes de instantáneas de la configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas de prueba |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin la exportación agrupada amplia de texto |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos de runtime de entrada y respuesta, fragmentación, envío, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de envío y finalización de respuestas, y de etiquetas de conversaciones |
    | `plugin-sdk/reply-history` | Ayudantes compartidos del historial de respuestas de intervalo corto. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; los ayudantes de mapas de nivel inferior siguen siendo únicamente exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ayudantes de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), ayudantes de marcadores para valores transitorios de `sessionFile`, lecturas acotadas del texto reciente de transcripciones de usuario y asistente por identidad de sesión, ayudantes de rutas del almacén de sesiones y claves de sesión, y lecturas de la fecha de actualización, sin importaciones amplias de escritura o mantenimiento de configuración |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripciones, ayudantes con ámbito de destino, lectura y escritura, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | Ayudantes específicos de esquema, rutas y transacciones de agentes de SQLite para el runtime propio, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | Ayudantes de rutas, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con claves de SQLite complementario para plugins, además de ayudantes centralizados para pragmas de conexión, mantenimiento verificado de WAL y migración atómica de esquemas STRICT en bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Ayudantes de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen del estado de canales y cuentas, valores predeterminados del estado del runtime y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de slugs y cadenas |
    | `plugin-sdk/request-url` | Extracción de URL de cadena de entradas similares a fetch o solicitudes |
    | `plugin-sdk/run-command` | Ejecutor de comandos cronometrado con resultados normalizados de stdout y stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y CLI |
    | `plugin-sdk/tool-plugin` | Definición de un plugin sencillo y tipado de herramientas de agente y exposición de metadatos estáticos para generar manifiestos |
    | `plugin-sdk/tool-payload` | Extracción de cargas normalizadas de objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos de destino de envío de los argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend del entorno aislado y ayudantes de comandos SSH y OpenShell, incluida la comprobación previa de comandos de ejecución con fallo inmediato |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas de descargas temporales y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Ayudantes de registrador de subsistemas y ocultación |
    | `plugin-sdk/markdown-table-runtime` | Ayudantes de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Ayudantes de anulación de modelos y sesiones, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Ayudantes de resolución de la configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeños ayudantes de lectura y escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Ayudantes de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Ayudantes de runtime, sesiones y envío de respuestas de ACP |
    | `plugin-sdk/acp-runtime-backend` | Ayudantes ligeros de registro de backends y envío de respuestas de ACP para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquemas de configuración del runtime de agentes; importe las primitivas de esquema desde una superficie mantenida propiedad del plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de arranque de dispositivos y tokens de emparejamiento, incluido `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de ayuda para canales pasivos, estados y proxies ambientales |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuestas de comandos y proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes para enumerar comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes nativos de registro, compilación y serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental para plugins de confianza destinada a arneses de agentes de bajo nivel: tipos de arnés, ayudantes para dirigir o abortar ejecuciones activas, ayudantes del puente de herramientas de OpenClaw, ayudantes de políticas de herramientas del plan de runtime, clasificación de resultados de terminal, ayudantes de formato y detalle del progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; use la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Ayudante de bloqueo asíncrono local al proceso para archivos pequeños de estado del runtime |
    | `plugin-sdk/channel-activity-runtime` | Ayudante de telemetría de actividad del canal |
    | `plugin-sdk/concurrency-runtime` | Ayudante de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Ayudantes de caché de desduplicación en memoria y respaldada por almacenamiento persistente |
    | `plugin-sdk/delivery-queue-runtime` | Ayudante de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Ayudantes de rutas seguras de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Ayudantes de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | Ayudante de aserción de valores obligatorios para invariantes demostrables del runtime |
    | `plugin-sdk/number-runtime` | Ayudante de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Ayudantes seguros de tokens y UUID |
    | `plugin-sdk/system-event-runtime` | Ayudantes de colas de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Ayudante de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | Ayudantes de archivos de políticas de aprobación de ejecución sin la exportación agrupada amplia del runtime de infraestructura |
    | `plugin-sdk/infra-runtime` | Capa de compatibilidad obsoleta; use las subrutas específicas del runtime indicadas anteriormente |
    | `plugin-sdk/collection-runtime` | Pequeños ayudantes de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de indicadores de diagnóstico, eventos y contexto de seguimiento |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, ayudantes compartidos de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Ayudantes de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y consultas fijadas |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatible con el despachador, sin importaciones de proxy ni de fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Ayudantes de saneamiento de URL de datos de imágenes insertadas y detección de firmas, sin la superficie amplia del runtime multimedia |
    | `plugin-sdk/response-limit-runtime` | Lectores de cuerpos de respuesta limitados por bytes, inactividad y plazo, sin la superficie amplia del runtime multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado de vinculación de la conversación actual sin enrutamiento configurado de vinculaciones ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | Resolución de la visibilidad del contexto y filtrado de contexto complementario sin importaciones amplias de configuración o seguridad |
    | `plugin-sdk/string-coerce-runtime` | Primitivas específicas de coerción y normalización de registros y cadenas, sin importaciones de Markdown o registro |
    | `plugin-sdk/html-entity-runtime` | Decodificación en una sola pasada de entidades HTML5 terminadas en punto y coma, sin utilidades amplias de texto |
    | `plugin-sdk/text-utility-runtime` | Ayudantes de bajo nivel para texto y rutas, incluido el escape de cinco entidades HTML |
    | `plugin-sdk/widget-html` | Detección de documentos completos, validación de tamaño y errores de entrada de herramientas para widgets HTML autocontenidos |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Exportación agrupada amplia obsoleta para ayudantes de directorios, identidades y espacios de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren subrutas específicas de agentes y runtime |
    | `plugin-sdk/directory-runtime` | Consulta y desduplicación de directorios respaldadas por la configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplio de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se recomienda usar `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas de tiempo de ejecución de capacidades, así como los auxiliares de almacenamiento antes de leer búferes cuando una URL deba convertirse en contenido multimedia de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos del almacén de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de conmutación por error para la generación de medios, selección de candidatos y mensajes sobre modelos ausentes |
    | `plugin-sdk/media-understanding` | Tipos de proveedores para la comprensión de medios, además de exportaciones de auxiliares orientados a proveedores para imágenes, audio y extracción estructurada |
    | `plugin-sdk/text-chunking` | Fragmentación de texto saliente y de rangos con conservación de desplazamientos, fragmentación de Markdown y auxiliares de renderizado, tokenización de etiquetas HTML que tiene en cuenta las comillas, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones orientadas a proveedores de directivas, registro, validación, constructor de TTS compatible con OpenAI y auxiliares de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas, normalización y exportaciones de auxiliares de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de arranque de perfiles en tiempo real para la inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, auxiliares de registro y auxiliares compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de la actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de auxiliares de recursos de imagen y URL de datos, y el constructor de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos, conmutación por error, autenticación y auxiliares de registro para la generación de imágenes |
    | `plugin-sdk/music-generation` | Tipos de proveedores, solicitudes y resultados de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos obsoletos de generación de música, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos; se recomienda usar las superficies de proveedores de música propias de los plugins |
    | `plugin-sdk/video-generation` | Tipos de proveedores, solicitudes y resultados de generación de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartidos para cargar medios remotos y locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes a auxiliares de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Datos de prueba locales del repositorio para contratos de adaptadores nativos del tiempo de ejecución de agentes en pruebas de autenticación, entrega, respaldo, enlaces de herramientas, superposición de prompts, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de prueba locales del repositorio orientados a canales para contratos genéricos de acciones, configuración y estado; aserciones de directorios; ciclo de vida de inicio de cuentas; propagación de la configuración de envío; simulaciones del tiempo de ejecución; incidencias de estado; entrega saliente; y registro de enlaces |
    | `plugin-sdk/channel-target-testing` | Conjunto local compartido del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares locales específicos del repositorio para pruebas de contratos de canales sin el barrel amplio de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales del repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API de tiempo de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locales del repositorio para pruebas del almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales del repositorio para contratos de tiempo de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidades multimedia, política de reproducción, audio en directo para STT en tiempo real, búsqueda y obtención web, y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Simulaciones HTTP y de autenticación de Vitest, opcionales y locales del repositorio, para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales del repositorio para adjuntar metadatos a datos de prueba de cargas de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locales del repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Datos de prueba locales del repositorio para captura genérica del tiempo de ejecución de la CLI, contexto de sandbox, escritura de Skills, mensajes de agentes, eventos del sistema, recarga de módulos, rutas de plugins incluidos, texto de terminal, fragmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares locales específicos del repositorio para simular elementos integrados de Node dentro de fábricas `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta del tiempo de ejecución de indexación y búsqueda de memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares ligeros del registro de proveedores de embeddings de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y auxiliares genéricos por lotes y remotos. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; para proveedores nuevos, use la API genérica de proveedores de embeddings. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales obsoletos del host de memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta obsoletos del host de memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares del tiempo de ejecución de la CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principales del tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos y tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los auxiliares principales del tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown administrado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Fachada del tiempo de ejecución de Active Memory para acceder al administrador de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares incluidos">
    Las subrutas reservadas del SDK para auxiliares incluidos son superficies
    específicas y limitadas de cada propietario para el código de plugins
    incluidos. Se registran en el inventario del SDK para que las compilaciones
    de paquetes y los alias sean deterministas, pero no son API generales para
    crear plugins. Los nuevos contratos de host reutilizables deben usar
    subrutas genéricas del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y finalidad |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar del plugin Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación reservada del paquete) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del plugin Codex incluido para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local del repositorio, no es una exportación del paquete) |

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
