---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para importar un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de plugins: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de plugins
x-i18n:
    generated_at: "2026-07-19T02:06:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3fa26ace32ca7e555508ec3869e67bd6ae2e5b3b2bfd0edb050e6d1ebfb61824
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas específicas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso habitual agrupadas por
finalidad. Tres archivos definen la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila la compilación.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas locales del repositorio
  para pruebas y uso interno. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, auxiliares incluidos reservados, fachadas incluidas compatibles y
  superficies públicas propiedad de plugins.

Los responsables de mantenimiento auditan el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas auxiliares reservadas activas con `pnpm plugins:boundary-report:summary`;
las exportaciones auxiliares reservadas sin usar provocan un error en el informe de la Pipeline de CI, en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración, como `createMigrationItem`, constantes de motivos, marcadores de estado de elementos, auxiliares de censura y `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Tipos de registro, detección, reparación, selección, gravedad y hallazgo de comprobaciones de estado de Doctor para consumidores de estado incluidos                                                                                |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod raíz `openclaw.json` (`OpenClawSchema`); defina en su lugar esquemas locales del plugin y valídelos con `plugin-sdk/json-schema-runtime`                                                  |

### Auxiliares obsoletos de compatibilidad y pruebas

Las subrutas obsoletas siguen exportándose para plugins antiguos, pero el código nuevo debe usar las
subrutas específicas del SDK que aparecen a continuación. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la Pipeline de CI rechaza las
importaciones de producción incluidas procedentes de ella. Los módulos de barril amplios, como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` y
`plugin-sdk/text-runtime`, son solo para compatibilidad, y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los módulos de barril
amplios de dominio `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
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
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` y `testing`. Las superficies auxiliares incluidas privadas
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo locales
del repositorio.

### Subrutas auxiliares reservadas de plugins incluidos

`plugin-sdk/codex-mcp-projection` es la única subruta reservada: una superficie de
compatibilidad propiedad del plugin Codex incluido, no una API general del SDK.
Las importaciones entre plugins de distintos propietarios están bloqueadas por las protecciones del contrato del paquete, y
la Pipeline de CI falla cuando deja de importarse una subruta reservada.
`plugin-sdk/codex-native-task-runtime` es solo local del repositorio y no es una exportación
del paquete.

`src/plugin-sdk/entrypoints.ts` también realiza un seguimiento de las fachadas incluidas compatibles, puntos de entrada
del SDK respaldados por su plugin incluido hasta que contratos genéricos los
reemplacen: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` y `plugin-sdk/zalouser`. Varias de ellas también están
obsoletas para el código nuevo; consulte las notas de cada fila a continuación.

  <AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Ayudante de validación de JSON Schema con caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos y generadores de estados de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración multicuenta y de control de acciones, y ayudantes de respaldo de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas y respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Ayudantes específicos para listas de cuentas y acciones de cuenta |
    | `plugin-sdk/access-groups` | Ayudantes para analizar listas de permitidos de grupos de acceso y generar diagnósticos de grupos con datos ocultos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de generadores de Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos con OpenClaw, solo para plugins incluidos que reciben mantenimiento |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat incluidos/oficiales, además de etiquetas y alias del formateador para plugins que necesitan reconocer texto con prefijo de sobre sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Normalización obsoleta de nombres y descripciones de comandos de Telegram y comprobaciones de duplicados y conflictos; en el código de plugins nuevo, use la gestión de configuración de comandos local del plugin |
    | `plugin-sdk/command-gating` | Ayudantes específicos del control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de alto nivel del entorno de ejecución para la entrada de canales, resolutor de políticas de menciones implícitas y generadores de datos de rutas para las rutas migradas de recepción de canales. Se recomienda usarlo en lugar de crear listas de permitidos efectivas, listas de permitidos de comandos y proyecciones heredadas en cada plugin. Consulte [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de los mensajes, además de opciones de la pipeline de respuestas, confirmaciones de recepción, vista previa en directo y transmisión, ayudantes del ciclo de vida, identidad saliente, planificación de cargas útiles, envíos persistentes y ayudantes de contexto para el envío de mensajes. Consulte [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos para generar rutas entrantes y sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores entrantes y predicados de envío, y `plugin-sdk/channel-outbound` para ayudantes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos para cargar contenido multimedia saliente y gestionar el estado del contenido multimedia alojado |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Ayudantes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Ayudantes del ciclo de vida y adaptadores de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Raíces y cargadores de cargas útiles multimedia de agentes |
    | `plugin-sdk/conversation-runtime` | Módulo de exportación general obsoleto para la vinculación de conversaciones e hilos, el emparejamiento y los ayudantes de vinculaciones configuradas; se recomiendan subrutas de vinculación específicas como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Ayudantes para resolver políticas de grupos en el entorno de ejecución |
    | `plugin-sdk/channel-status` | Ayudantes compartidos para instantáneas y resúmenes del estado de los canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización para escribir la configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas del preámbulo de plugins de canales |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes para editar y leer la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Ayudantes obsoletos para decisiones de acceso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Ayudantes específicos de políticas de protección previa al cifrado para mensajes directos |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad con Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad supervisada por el propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad con la resolución de cuentas de Telegram para la compatibilidad supervisada por el propietario; los plugins nuevos deben usar ayudantes inyectados del entorno de ejecución o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad con Zalo Personal para los paquetes publicados de Lark/Zalo que todavía importan la autorización de comandos del remitente; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Ayudantes para la presentación semántica y la entrega de mensajes, y para respuestas interactivas heredadas. Consulte [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Resuelva mediante el Gateway las opciones de `ask_user` creadas por el entorno de ejecución desde los controladores de interacción de canales |
    | `plugin-sdk/channel-inbound` | Ayudantes compartidos de entrada para la clasificación de eventos, creación de contexto, formato, raíces, eliminación de rebotes, coincidencia de menciones, políticas de menciones y registro de entradas |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes específicos para eliminar rebotes de entrada |
    | `plugin-sdk/channel-mention-gating` | Ayudantes específicos para políticas de menciones, marcadores de menciones y texto de menciones, sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | Ayudantes de acciones de mensajes de canales, además de ayudantes obsoletos de esquemas nativos que se conservan por compatibilidad con plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos mediante analizadores, conversión de identificadores de hilos a cadenas, claves de rutas compactas y de deduplicación, tipos de destinos analizados y ayudantes para comparar rutas y destinos |
    | `plugin-sdk/channel-targets` | Ayudantes para analizar destinos; los consumidores que comparan rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canales |
    | `plugin-sdk/channel-feedback` | Conexión de comentarios y reacciones |
  </Accordion>

Las familias obsoletas de utilidades de canal siguen disponibles únicamente por compatibilidad con los plugins publicados. El plan de retirada es el siguiente: mantenerlas durante el periodo de migración de los plugins externos, mantener los plugins del repositorio/incluidos en `channel-inbound` y `channel-outbound`, y después eliminar las subrutas de compatibilidad en la próxima limpieza importante del SDK. Esto se aplica a las antiguas familias de mensajes/entorno de ejecución de canal, transmisión de canal, acceso directo a mensajes directos, utilidades de entrada fragmentadas, opciones de respuesta y rutas de emparejamiento.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para la configuración, la detección del catálogo y la preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible del entorno de ejecución de LM Studio para los valores predeterminados del servidor local, la detección de modelos, los encabezados de solicitud y los asistentes para modelos cargados |
    | `plugin-sdk/provider-setup` | Asistentes seleccionados para la configuración de proveedores locales o autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Asistentes obsoletos de configuración autoalojada compatible con OpenAI; use `plugin-sdk/provider-setup` o asistentes de configuración pertenecientes al plugin |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de la CLI y constantes del supervisor |
    | `plugin-sdk/provider-auth-runtime` | Asistentes del entorno de ejecución para la autenticación de proveedores: flujo de bucle invertido de OAuth, intercambio de tokens, persistencia de autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de devolución de llamada de OAuth para proveedores, representación de la página de devolución de llamada, asistentes de PKCE/estado, análisis de entradas de autorización, asistentes de caducidad de tokens y asistentes de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Asistentes de incorporación y escritura de perfiles mediante claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Generador estándar de resultados de autenticación de OAuth |
    | `plugin-sdk/provider-env-vars` | Asistentes de búsqueda de variables de entorno para la autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, asistentes de importación de autenticación de OpenAI Codex y exportación obsoleta de compatibilidad `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, generadores compartidos de políticas de repetición, asistentes para puntos de conexión de proveedores y asistentes compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Asistentes de catálogo de modelos de proveedores en vivo para la detección protegida al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché con TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Enlace del entorno de ejecución para ampliar el catálogo de proveedores y puntos de integración del registro de proveedores de plugins para pruebas de contratos |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Asistentes genéricos de capacidades HTTP y de puntos de conexión para proveedores, errores HTTP de proveedores y asistentes de formularios multiparte para la transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Asistentes específicos del contrato de configuración y selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Asistentes de registro y caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Asistentes específicos de configuración y credenciales de búsqueda web para proveedores que no necesitan conexiones de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Asistentes específicos del contrato de configuración y credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores y captadores de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Asistentes de registro, caché y entorno de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de incrustaciones y asistentes de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para garantizar el cumplimiento de la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza de esquemas y diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedores, asistentes compartidos para obtener el uso y captadores de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de contenedores de flujos, compatibilidad con llamadas a herramientas en texto sin formato y asistentes compartidos de contenedores de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Asistentes públicos compartidos de contenedores de flujos de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, y utilidades de flujos compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Asistentes de transporte nativo de proveedores, como obtención protegida, extracción del texto de los resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Asistentes para aplicar parches a la configuración de incorporación |
    | `plugin-sdk/global-singleton` | Asistentes de instancias únicas, mapas y cachés locales del proceso |
    | `plugin-sdk/group-activation` | Asistentes específicos del modo de activación de grupos y del análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje utilizado y una hora de restablecimiento opcional. Los proveedores que exponen texto sobre el saldo o
el estado de la cuenta en lugar de intervalos de cuota restablecibles deben devolver
`summary` con una matriz `windows` vacía, en vez de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` solo cuando el
punto de conexión de uso haya fallado o no haya devuelto datos de uso válidos.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia obsoleta de autorización de comandos (`resolveControlCommandGate`, asistentes del registro de comandos, incluido el formato de menús de argumentos dinámicos, y asistentes de autorización de remitentes); use la autorización de entrada o del entorno de ejecución del canal, o asistentes de estado de comandos |
    | `plugin-sdk/command-status` | Generadores de mensajes de comandos y ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Asistentes de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Asistentes de perfiles y filtros para la aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidades y entrega de aprobaciones nativas |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Asistente determinista de localizadores duraderos para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Asistentes ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Asistentes más amplios del entorno de ejecución para controladores de aprobación; prefiera los puntos de integración más específicos del adaptador o Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Asistentes para el destino de aprobación nativa, la vinculación de cuentas, la barrera de rutas, la alternativa de reenvío y la supresión local de solicitudes de ejecución nativa |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, cargas útiles de solicitudes de reacción, almacenes de destinos de reacciones, asistentes de texto de indicaciones de reacciones y exportación de compatibilidad para la supresión local de solicitudes de ejecución nativa |
    | `plugin-sdk/approval-reply-runtime` | Asistentes de cargas útiles de respuestas de aprobación de ejecución o plugins |
    | `plugin-sdk/approval-runtime` | Asistentes de cargas útiles de aprobación de ejecución o plugins, generadores de capacidades de aprobación, asistentes de autenticación y perfiles de aprobación, asistentes de enrutamiento y entorno de ejecución de aprobaciones nativas, y asistentes de visualización estructurada de aprobaciones como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Asistentes específicos obsoletos para restablecer la deduplicación de respuestas entrantes |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativos, formato de menús de argumentos dinámicos y asistentes de destinos de sesiones nativas |
    | `plugin-sdk/command-detection` | Asistentes compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Asistentes de normalización del cuerpo de comandos y de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Asistentes de carga diferida para el flujo de inicio de sesión de autenticación de proveedores mediante el emparejamiento por código de dispositivo en canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); prefiera las subrutas específicas que aparecen a continuación |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones específicas del contrato de secretos y generadores del registro de destinos para superficies de secretos de canales o plugins que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Asistentes específicos de asignación de secretos TTS de canales anidados |
    | `plugin-sdk/secret-ref-runtime` | Tipado y resolución específicos de SecretRef, y búsqueda de rutas de destinos de planes para el análisis del contrato de secretos y la configuración |
    | `plugin-sdk/secret-provider-integration` | Contratos solo de tipos del manifiesto y de ajustes preestablecidos de integración de proveedores de SecretRef para plugins que publican ajustes preestablecidos de proveedores de secretos externos |
    | `plugin-sdk/security-runtime` | Módulo de exportación amplio obsoleto para la confianza, el control de acceso a mensajes directos, los asistentes de archivos y rutas restringidos a la raíz —incluidas las escrituras de solo creación, el reemplazo atómico síncrono y asíncrono de archivos, las escrituras temporales adyacentes, la alternativa de movimiento entre dispositivos—, los asistentes de almacenes de archivos privados, las protecciones de directorios superiores con enlaces simbólicos, el contenido externo, la censura de texto confidencial, la comparación de secretos en tiempo constante y los asistentes de recopilación de secretos; prefiera subrutas específicas de seguridad, SSRF y secretos |
    | `plugin-sdk/ssrf-policy` | Asistentes de listas de hosts permitidos y políticas SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Asistentes específicos de despachadores fijados sin la amplia superficie del entorno de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Asistentes de despachadores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Asistentes de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Asistentes de solicitudes y destinos de Webhook, y coerción de websockets y cuerpos sin procesar |
    | `plugin-sdk/webhook-request-guards` | Asistentes de tamaño y tiempo de espera del cuerpo de solicitudes, y `runDetachedWebhookWork` para el procesamiento supervisado posterior a la confirmación |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Ayudantes de runtime, registro, copias de seguridad y procesos, y advertencias sobre rutas de instalación de plugins |
    | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de runtime, registrador, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | Fachada compatible de configuración del navegador para perfiles y valores predeterminados normalizados, análisis de URL de CDP y ayudantes de autenticación para el control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Ayudantes genéricos de ciclo de vida de tareas y entrega de finalización para agentes respaldados por un arnés que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Ayudante de Codex integrado reservado para proyectar la configuración de servidores MCP del usuario en la configuración de hilos de Codex; no destinado a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Ayudante de Codex integrado y local al repositorio para el cableado nativo del reflejo de tareas y el runtime; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y búsqueda del contexto de runtime de canales |
    | `plugin-sdk/matrix` | Fachada de compatibilidad obsoleta de Matrix para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad obsoleta de Mattermost para paquetes de canales de terceros antiguos; los plugins nuevos deben importar directamente subrutas genéricas del SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel amplio obsoleto para ayudantes de comandos, hooks, HTTP e interacción de plugins; se prefieren subrutas específicas del runtime de plugins |
    | `plugin-sdk/hook-runtime` | Barrel amplio obsoleto para ayudantes del pipeline de webhooks y hooks internos; se prefieren subrutas específicas del runtime de hooks y plugins |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación y vinculación diferidas del runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/node-host` | Ayudantes de resolución de ejecutables del host Node y reanudación de PTY |
    | `plugin-sdk/cli-runtime` | Barrel amplio obsoleto para formato de CLI, espera, versión, invocación de argumentos y ayudantes diferidos de grupos de comandos; se prefieren subrutas específicas de CLI y runtime |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatible para esquemas de configuración de texto a voz y ayudantes de runtime |
    | `plugin-sdk/gateway-method-runtime` | Ayudante reservado de despacho de métodos del Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, ayudante de inicio del cliente preparado para el bucle de eventos, RPC de la CLI del Gateway, errores del protocolo del Gateway, resolución del host LAN anunciado y ayudantes de parcheo del estado de canales |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica solo de tipos para formas de configuración de plugins, como `OpenClawConfig`, y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Ayudantes de configuración de plugins en runtime, como `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Ayudantes de mutación transaccional de la configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de indicaciones de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Ayudantes de instantáneas de la configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas para pruebas |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin el barrel amplio de texto |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos de runtime de entrada y respuesta, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho y finalización de respuestas, y de etiquetas de conversaciones |
    | `plugin-sdk/reply-history` | Ayudantes compartidos para el historial de respuestas de corta duración. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; los ayudantes de mapas de nivel inferior siguen siendo únicamente exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes del flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ayudantes de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), ayudantes de marcadores para valores transitorios de `sessionFile`, lecturas acotadas del texto reciente de transcripciones de usuario y asistente por identidad de sesión, ayudantes de ruta del almacén de sesiones y clave de sesión, y lecturas de la fecha de actualización, sin importaciones amplias de escritura o mantenimiento de configuración |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripciones, cursores sin procesar y visibles acotados, ayudantes con ámbito de destino, lectura y escritura, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | Ayudantes específicos de esquema, ruta y transacciones de agentes en SQLite para el runtime propio, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | Ayudantes de ruta, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | Contratos con ámbito de plugin para estado con claves, BLOB y concesiones cooperativas de SQLite, además de ayudantes para pragmas de conexión, mantenimiento WAL verificado y migración atómica de esquemas STRICT. Las devoluciones de llamada de las concesiones reciben una señal de cancelación, y los errores tipados distinguen entre tiempo de espera agotado, cancelación, pérdida de propiedad, entrada no válida y fallo de almacenamiento |
    | `plugin-sdk/routing` | Ayudantes de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen del estado de canales y cuentas, valores predeterminados del estado del runtime y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de slugs y cadenas |
    | `plugin-sdk/request-url` | Extracción de URL de cadena a partir de entradas similares a fetch o request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout y stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y CLI |
    | `plugin-sdk/tool-plugin` | Definición de un plugin sencillo y tipado de herramientas de agente y exposición de metadatos estáticos para generar manifiestos |
    | `plugin-sdk/tool-payload` | Extracción de cargas útiles normalizadas de objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos del destino de envío a partir de argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox y ayudantes de comandos SSH y OpenShell, incluida la comprobación previa de comandos de ejecución con fallo inmediato |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas de descargas temporales y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Ayudantes de registrador de subsistemas y censura |
    | `plugin-sdk/markdown-table-runtime` | Ayudantes de modo y conversión de tablas de Markdown |
    | `plugin-sdk/model-session-runtime` | Ayudantes de sobrescritura de modelos y sesiones, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Ayudantes de resolución de la configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeños ayudantes de lectura y escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Ayudantes de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante, además de la recuperación segura para Doctor de archivos auxiliares de bloqueo retirados que estén definitivamente obsoletos y sin cambios |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de desduplicación respaldada por disco |
    | `plugin-sdk/ingress-effect-once` | Protección duradera de reclamación y confirmación para efectos secundarios de entrada no idempotentes |
    | `plugin-sdk/acp-runtime` | Ayudantes de runtime y sesión de ACP y de despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Ayudantes ligeros de registro del backend de ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas del esquema de configuración del runtime de agentes; importe las primitivas del esquema desde una superficie mantenida propiedad de un plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de arranque de dispositivos y tokens de emparejamiento, incluido `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas de ayudantes compartidos para canales pasivos, estado y proxies ambientales |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuesta de comandos y proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes para enumerar comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes de registro, creación y serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental para plugins de confianza destinada a arneses de agente de bajo nivel: tipos de arnés, ayudantes para dirigir y cancelar ejecuciones activas, ayudantes de puente de herramientas de OpenClaw, ayudantes de políticas de herramientas del plan de runtime, clasificación de resultados terminales, ayudantes de formato y detalle del progreso de herramientas, y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; use la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Ayudante de bloqueo asíncrono local al proceso para archivos pequeños de estado del runtime |
    | `plugin-sdk/channel-activity-runtime` | Ayudante de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | Ayudante de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Ayudantes de caché de desduplicación en memoria y con respaldo persistente |
    | `plugin-sdk/delivery-queue-runtime` | Ayudante de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Ayudantes seguros de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Ayudantes de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | Ayudante de aserción de valores obligatorios para invariantes demostrables del runtime |
    | `plugin-sdk/number-runtime` | Ayudante de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Ayudantes seguros de tokens y UUID |
    | `plugin-sdk/system-event-runtime` | Ayudantes de colas de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Ayudante de espera de preparación del transporte |
    | `plugin-sdk/exec-approvals-runtime` | Ayudantes de archivos de políticas de aprobación de ejecución sin el barrel amplio de runtime de infraestructura |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; use las subrutas específicas del runtime indicadas anteriormente |
    | `plugin-sdk/collection-runtime` | Pequeños ayudantes de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de indicadores, eventos y contexto de trazas de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, ayudantes compartidos de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Ayudantes de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y búsquedas fijadas |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatible con Dispatcher sin importaciones de proxy ni fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Ayudantes de saneamiento de URL de datos de imágenes insertadas y detección de firmas sin la superficie amplia del runtime multimedia |
    | `plugin-sdk/response-limit-runtime` | Lectores del cuerpo de respuestas limitados por bytes, inactividad y fecha límite sin la superficie amplia del runtime multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversaciones sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad del contexto y filtrado de contexto complementario sin importaciones amplias de configuración o seguridad |
    | `plugin-sdk/string-coerce-runtime` | Ayudantes específicos de coerción y normalización primitivas de registros y cadenas sin importaciones de Markdown o registro |
    | `plugin-sdk/html-entity-runtime` | Decodificación en una sola pasada de entidades HTML5 terminadas en punto y coma sin utilidades amplias de texto |
    | `plugin-sdk/text-utility-runtime` | Ayudantes de bajo nivel para texto y rutas, incluido el escape de las cinco entidades HTML |
    | `plugin-sdk/widget-html` | Detección de documentos completos, validación de tamaño y errores de entrada de herramientas para widgets HTML autocontenidos |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Barrel amplio obsoleto para ayudantes de directorios, identidad y espacios de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren subrutas específicas de agentes y runtime |
    | `plugin-sdk/directory-runtime` | Consulta y desduplicación de directorios respaldadas por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplio de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se prefieren `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas del entorno de ejecución de capacidades, así como los auxiliares de almacenamiento antes de leer búferes cuando una URL deba convertirse en un medio de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos del almacén de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de conmutación por error para la generación de medios, selección de candidatos y mensajes sobre modelos ausentes |
    | `plugin-sdk/media-understanding` | Tipos de proveedores para la comprensión de medios, además de exportaciones de auxiliares de imagen, audio y extracción estructurada orientadas a proveedores |
    | `plugin-sdk/text-chunking` | Fragmentación de texto saliente y de rangos con conservación de desplazamientos, auxiliares de fragmentación y renderizado de Markdown, tokenización de etiquetas HTML que tiene en cuenta las comillas, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones orientadas a proveedores para directivas, registro, validación, constructor de TTS compatible con OpenAI y auxiliares de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas, normalización y exportaciones de auxiliares de voz |
    | `plugin-sdk/speech-settings` | Primitivas ligeras de resolución y normalización de la configuración de TTS sin registros de proveedores ni entorno de ejecución de síntesis |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de inicialización de perfiles en tiempo real para la inyección limitada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, auxiliares de registro, puertas compartidas de energía de audio e inicio del habla y auxiliares de comportamiento de voz en tiempo real, incluidos el arnés de sesiones independiente del transporte y el seguimiento de la actividad de salida |
    | `plugin-sdk/meeting-runtime` | Entorno de ejecución de sesiones de reuniones en el navegador, motores y transportes de audio en tiempo real, `MeetingPlatformAdapter`, control del navegador y de Node, consulta al agente, delegación de llamadas de voz, comprobaciones de configuración y auxiliares de comandos de SoX |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de auxiliares de recursos de imagen y URL de datos y el constructor de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes y auxiliares de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedores, solicitudes y resultados de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos obsoletos de generación de música, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos; se prefieren las superficies de proveedores de música propiedad de los plugins |
    | `plugin-sdk/video-generation` | Tipos de proveedores, solicitudes y resultados de generación de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartidos para cargar medios remotos y locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes de auxiliares de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Accesorios de contratos locales del repositorio para adaptadores nativos del entorno de ejecución de agentes destinados a pruebas de autenticación, entrega, reserva, enlaces de herramientas, superposición de prompts, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de prueba locales del repositorio orientados a canales para contratos genéricos de acciones, configuración y estado; aserciones de directorios; ciclo de vida de inicio de cuentas; propagación de la configuración de envío; simulaciones del entorno de ejecución; incidencias de estado; entrega saliente; y registro de enlaces |
    | `plugin-sdk/channel-target-testing` | Conjunto local del repositorio de casos de error compartidos para la resolución de destinos en pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares específicos locales del repositorio para pruebas de contratos de canales sin el barrel amplio de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales del repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API del entorno de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locales del repositorio para pruebas del almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales del repositorio para contratos del entorno de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidades multimedia, políticas de repetición, audio en directo de STT en tiempo real, búsqueda y obtención web y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Simulaciones HTTP y de autenticación de Vitest locales del repositorio y opcionales para pruebas de proveedores que utilizan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales del repositorio para adjuntar metadatos a accesorios de cargas útiles de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locales del repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Accesorios locales del repositorio para captura genérica del entorno de ejecución de la CLI, contexto del entorno aislado, escritor de Skills, mensajes de agentes, eventos del sistema, recarga de módulos, rutas de plugins incluidos, texto de terminal, fragmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares específicos locales del repositorio para simular componentes integrados de Node dentro de fábricas `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta del entorno de ejecución para indexación y búsqueda de memoria; se prefieren las subrutas de alojamiento de memoria neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares ligeros del registro de proveedores de incrustaciones de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base de alojamiento de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de incrustaciones del alojamiento de memoria, acceso al registro, proveedor local y auxiliares genéricos para lotes y operaciones remotas. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; use la API genérica de proveedores de incrustaciones para proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales obsoletos del alojamiento de memoria; se prefieren las subrutas de alojamiento de memoria neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta obsoletos del alojamiento de memoria; se prefieren las subrutas de alojamiento de memoria neutrales respecto al proveedor |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares del entorno de ejecución de la CLI del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principales del entorno de ejecución del alojamiento de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos y del entorno de ejecución del alojamiento de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los auxiliares principales del entorno de ejecución del alojamiento de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los auxiliares del diario de eventos del alojamiento de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown administrado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Fachada del entorno de ejecución de Active Memory para acceder al gestor de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares incluidos">
    Las subrutas reservadas del SDK para auxiliares incluidos son superficies específicas y limitadas de cada propietario destinadas al
    código de los plugins incluidos. Se registran en el inventario del SDK para que las compilaciones de
    paquetes y la creación de alias sean deterministas, pero no son API generales para la
    creación de plugins. Los nuevos contratos reutilizables del host deben usar subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y propósito |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar del plugin Codex incluido para proyectar la configuración de servidores MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación reservada del paquete) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del plugin Codex incluido para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local del repositorio, no es una exportación del paquete) |

  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
