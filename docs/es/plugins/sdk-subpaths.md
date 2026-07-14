---
read_when:
    - Elegir la subruta correcta de plugin-sdk para importar un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-07-14T13:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c457526891ba2adcce0d11f86e3efe4ab39c36c4bb3c0d4f08decc6e021d821d
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins se expone como un conjunto de subrutas públicas específicas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso habitual agrupadas por
finalidad. Tres archivos definen la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario de puntos de entrada mantenido
  que compila el proceso de construcción.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas
  internas y de prueba locales del repositorio. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, auxiliares empaquetados reservados, fachadas empaquetadas compatibles y
  superficies públicas propiedad de plugins.

Los responsables de mantenimiento auditan el número de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas auxiliares reservadas activas con `pnpm plugins:boundary-report:summary`;
las exportaciones auxiliares reservadas sin usar hacen que el informe de CI falle, en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares para elementos del proveedor de migración, como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, auxiliares de ocultación de datos y `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registro, detección, reparación, selección, gravedad y tipos de hallazgos de comprobaciones de estado de Doctor para consumidores de estado empaquetados                                                                                |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod raíz `openclaw.json` (`OpenClawSchema`); en su lugar, defina esquemas locales del plugin y valídelos con `plugin-sdk/json-schema-runtime`                                                  |

### Auxiliares obsoletos de compatibilidad y pruebas

Las subrutas obsoletas siguen exportándose para plugins antiguos, pero el código nuevo debe usar las
subrutas específicas del SDK indicadas a continuación. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza las
importaciones de producción empaquetadas que procedan de ella. Los módulos de reexportación amplios, como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` y
`plugin-sdk/text-runtime`, son solo para compatibilidad, y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los módulos de reexportación
amplios de dominio `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de
subrutas específicas.

Las subrutas auxiliares de pruebas de OpenClaw respaldadas por Vitest son solo locales del repositorio y ya no
se exportan desde el paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` y `testing`. Las superficies auxiliares empaquetadas privadas
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo
locales del repositorio.

### Subrutas auxiliares reservadas de plugins empaquetados

`plugin-sdk/codex-mcp-projection` es la única subruta reservada: una superficie de
compatibilidad propiedad del plugin para el plugin Codex empaquetado, no una API general del SDK.
Las barreras de protección del contrato del paquete bloquean las importaciones entre plugins de distintos propietarios, y
CI falla cuando deja de importarse una subruta reservada.
`plugin-sdk/codex-native-task-runtime` es solo local del repositorio y no es una exportación
del paquete.

`src/plugin-sdk/entrypoints.ts` también realiza el seguimiento de las fachadas empaquetadas compatibles, puntos de
entrada del SDK respaldados por su plugin empaquetado hasta que los sustituyan contratos
genéricos: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` y `plugin-sdk/zalouser`. Varios de ellos también están
obsoletos para el código nuevo; consulte las notas de cada fila a continuación.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Asistente de validación de esquemas JSON almacenados en caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Asistentes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos y generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Asistentes de configuración multicuenta y de control de acciones, y asistentes de respaldo a la cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, asistentes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Asistentes de búsqueda de cuentas y de respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Asistentes específicos de listas y acciones de cuentas |
    | `plugin-sdk/access-groups` | Asistentes para analizar listas de permitidos de grupos de acceso y generar diagnósticos de grupo censurados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canales incluidos con OpenClaw, solo para plugins incluidos que reciben mantenimiento |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat incluidos/oficiales, además de etiquetas y alias de formateadores para plugins que necesiten reconocer texto con prefijos de envoltura sin codificar su propia tabla. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Normalización obsoleta de nombres y descripciones de comandos de Telegram, y comprobaciones de duplicados y conflictos; use la gestión local del plugin para la configuración de comandos en código de plugins nuevo |
    | `plugin-sdk/command-gating` | Asistentes específicos para el control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Superficie de compatibilidad de bajo nivel para la entrada de canales. Las nuevas rutas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de alto nivel para el entorno de ejecución de entrada de canales y generadores de datos de ruta para rutas migradas de recepción de canales. Se prefiere frente a componer listas de permitidos efectivas, listas de permitidos de comandos y proyecciones heredadas en cada plugin. Consulte la [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de los mensajes, además de opciones de canalización de respuestas, confirmaciones, vista previa/transmisión en directo, asistentes del ciclo de vida, identidad de salida, planificación de cargas útiles, envíos duraderos y asistentes de contexto para el envío de mensajes. Consulte la [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de distribución de respuestas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`, además de fachadas heredadas de distribución de respuestas. |
    | `plugin-sdk/inbound-envelope` | Asistentes compartidos para generar rutas de entrada y envolturas |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de distribución, y `plugin-sdk/channel-outbound` para asistentes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Asistentes compartidos para cargar medios de salida y gestionar el estado de medios alojados |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Asistentes específicos para normalizar encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Asistentes del ciclo de vida y adaptadores para la vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Raíces y cargadores de cargas útiles multimedia del agente |
    | `plugin-sdk/conversation-runtime` | Módulo de exportación general obsoleto para la vinculación de conversaciones e hilos, el emparejamiento y los asistentes de vinculaciones configuradas; se prefieren subrutas de vinculación específicas, como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Asistentes para resolver políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Asistentes compartidos para generar instantáneas y resúmenes del estado de los canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Asistentes de autorización para escribir la configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas del preámbulo de plugins de canales |
    | `plugin-sdk/allowlist-config-edit` | Asistentes para editar y leer la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Asistentes obsoletos para decisiones de acceso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Asistentes específicos de políticas de protección precriptográfica para mensajes directos |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad controlada por el propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada de compatibilidad obsoleta de Telegram para la resolución de cuentas, destinada a la compatibilidad controlada por el propietario; los plugins nuevos deben usar asistentes de entorno de ejecución inyectados o subrutas genéricas del SDK de canales |
    | `plugin-sdk/zalouser` | Fachada de compatibilidad obsoleta de Zalo Personal para paquetes publicados de Lark/Zalo que aún importan la autorización de comandos del remitente; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Asistentes de presentación semántica de mensajes, entrega y respuestas interactivas heredadas. Consulte [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Asistentes de entrada compartidos para la clasificación de eventos, generación de contexto, formato, raíces, antirrebote, coincidencia de menciones, políticas de menciones y registro de entradas |
    | `plugin-sdk/channel-inbound-debounce` | Asistentes específicos para el antirrebote de entradas |
    | `plugin-sdk/channel-mention-gating` | Asistentes específicos de políticas de menciones, marcadores de menciones y texto de menciones sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidad obsoletas. Use `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | Asistentes para acciones de mensajes de canales, además de asistentes obsoletos de esquemas nativos conservados para mantener la compatibilidad de los plugins |
    | `plugin-sdk/channel-route` | Normalización compartida de rutas, resolución de destinos basada en analizadores, conversión de identificadores de hilos a cadenas, claves de ruta deduplicadas/compactas, tipos de destinos analizados y asistentes de comparación de rutas y destinos |
    | `plugin-sdk/channel-targets` | Asistentes para analizar destinos; los consumidores que comparan rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canales |
    | `plugin-sdk/channel-feedback` | Integración de comentarios y reacciones |
  </Accordion>

Las familias obsoletas de funciones auxiliares de canales siguen disponibles únicamente por compatibilidad con plugins publicados. El plan de retirada es el siguiente: mantenerlas durante el periodo de migración de los plugins externos, mantener los plugins del repositorio/incluidos en `channel-inbound` y `channel-outbound` y, después, eliminar las subrutas de compatibilidad en la próxima limpieza principal del SDK. Esto se aplica a las familias antiguas de mensajes/entorno de ejecución de canales, transmisión de canales, acceso directo a mensajes privados, funciones auxiliares fragmentadas de entrada, opciones de respuesta y rutas de vinculación.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatible del proveedor LM Studio para la configuración, el descubrimiento del catálogo y la preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatible del entorno de ejecución de LM Studio para los valores predeterminados del servidor local, el descubrimiento de modelos, los encabezados de solicitudes y los auxiliares para modelos cargados |
    | `plugin-sdk/provider-setup` | Auxiliares seleccionados para configurar proveedores locales o autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares obsoletos de configuración autoalojada compatible con OpenAI; use `plugin-sdk/provider-setup` o auxiliares de configuración propios del plugin |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de la CLI y constantes del supervisor |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares del entorno de ejecución para la autenticación de proveedores: flujo de bucle invertido de OAuth, intercambio de tokens, persistencia de la autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de devolución de llamada OAuth de proveedores, representación de la página de devolución de llamada, auxiliares de PKCE/estado, análisis de la entrada de autorización, auxiliares de caducidad de tokens y auxiliares de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación y escritura de perfiles mediante claves de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares para buscar variables de entorno de autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares para importar la autenticación de OpenAI Codex y exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, auxiliares de puntos de conexión de proveedores y auxiliares compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares del catálogo de modelos de proveedores activos para el descubrimiento protegido al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Enlace del entorno de ejecución para ampliar el catálogo de proveedores y puntos de integración del registro de proveedores de plugins para pruebas de contratos |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidades HTTP y puntos de conexión de proveedores, errores HTTP de proveedores y auxiliares para formularios multiparte de transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares específicos de contratos de configuración y selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro y caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares específicos de configuración y credenciales de búsqueda web para proveedores que no necesitan conexiones de activación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares específicos de contratos de configuración y credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y descriptores de acceso de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro, caché y entorno de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Tipos generales de proveedores de incrustaciones y auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para garantizar la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza y diagnóstico de esquemas de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantáneas de uso de proveedores, auxiliares compartidos para obtener datos de uso y recuperadores de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos, compatibilidad con llamadas a herramientas en texto sin formato y auxiliares compartidos de envoltorios de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartidos de envoltorios de flujos de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de flujos compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativos de proveedores, como la obtención protegida, la extracción de texto de resultados de herramientas, las transformaciones de mensajes de transporte y los flujos de eventos de transporte con capacidad de escritura |
    | `plugin-sdk/provider-onboard` | Auxiliares para aplicar parches de configuración durante la incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de singletons, mapas y cachés locales del proceso |
    | `plugin-sdk/group-activation` | Auxiliares específicos del modo de activación de grupos y del análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje utilizado y una hora de restablecimiento opcional. Los proveedores que muestran texto sobre el saldo o
el estado de la cuenta en lugar de periodos de cuota restablecibles deben devolver
`summary` con una matriz `windows` vacía, en vez de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` únicamente cuando
el punto de conexión de uso haya fallado o no haya devuelto datos de uso aprovechables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia y obsoleta de autorización de comandos (`resolveControlCommandGate`, auxiliares del registro de comandos, incluido el formato dinámico del menú de argumentos, y auxiliares de autorización de remitentes); use la autorización de entrada o del entorno de ejecución del canal, o los auxiliares de estado de comandos |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos y ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfiles y filtros de aprobación de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidades y entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Auxiliar determinista de localizadores persistentes para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros para cargar adaptadores de aprobación nativos en puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del entorno de ejecución de controladores de aprobación; prefiera los puntos de integración más específicos de adaptadores o del Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destinos de aprobación nativos, vinculación de cuentas, puertas de rutas, alternativas de reenvío y supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reaction-runtime` | Vinculaciones codificadas de reacciones de aprobación, cargas de solicitudes de reacción, almacenes de destinos de reacción, auxiliares de texto de sugerencias de reacción y exportación de compatibilidad para la supresión local de solicitudes nativas de ejecución |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas de respuesta de aprobación de ejecución o plugins |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas de aprobación de ejecución o plugins, constructores de capacidades de aprobación, auxiliares de autenticación y perfiles de aprobación, auxiliares de enrutamiento y entorno de ejecución de aprobaciones nativas y auxiliares de presentación estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares obsoletos y específicos para restablecer la deduplicación de respuestas entrantes |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativos, formato dinámico del menú de argumentos y auxiliares nativos de destinos de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Auxiliares de normalización del cuerpo de comandos y de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares diferidos del flujo de inicio de sesión de autenticación de proveedores para el emparejamiento mediante código de dispositivo en canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia y obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); prefiera las subrutas específicas indicadas a continuación |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones específicas del contrato de secretos y constructores del registro de destinos para superficies de secretos de canales o plugins que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Auxiliares específicos de asignación de secretos TTS de canales anidados |
    | `plugin-sdk/secret-ref-runtime` | Tipado y resolución específicos de SecretRef, y búsqueda de rutas de destinos del plan para analizar contratos de secretos y configuraciones |
    | `plugin-sdk/secret-provider-integration` | Contratos de manifiestos y ajustes preestablecidos, solo de tipos, para integrar proveedores de SecretRef en plugins que publican ajustes preestablecidos de proveedores externos de secretos |
    | `plugin-sdk/security-runtime` | Módulo de exportación amplio y obsoleto para la confianza, el control de acceso a mensajes directos, auxiliares de archivos y rutas limitados a la raíz —incluidas escrituras de solo creación, sustitución atómica síncrona y asíncrona de archivos, escrituras temporales adyacentes, alternativa de traslado entre dispositivos, auxiliares de almacenes de archivos privados y protecciones de directorios principales con enlaces simbólicos—, contenido externo, ocultación de texto confidencial, comparación de secretos en tiempo constante y auxiliares de recopilación de secretos; prefiera las subrutas específicas de seguridad, SSRF y secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de listas de hosts permitidos y políticas SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares específicos de despachadores fijados sin la amplia superficie del entorno de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de despachadores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Auxiliares para analizar entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes y destinos de Webhook, y conversión de websockets sin procesar y cuerpos |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño y tiempo de espera del cuerpo de las solicitudes |
  </Accordion>

  <Accordion title="Subrutas de ejecución y almacenamiento">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilidades de ejecución, registro y copias de seguridad, advertencias sobre rutas de instalación de plugins y utilidades de procesos |
    | `plugin-sdk/runtime-env` | Utilidades específicas de entorno de ejecución, registro, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | Fachada compatible de configuración del navegador para perfiles y valores predeterminados normalizados, análisis de URL de CDP y utilidades de autenticación para el control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Utilidades genéricas de ciclo de vida de tareas y entrega de finalización para agentes respaldados por un entorno de ejecución que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Utilidad reservada del Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos de Codex; no destinada a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Utilidad del Codex incluido y local al repositorio para el cableado nativo de reflejo de tareas y ejecución; no es una exportación del paquete |
    | `plugin-sdk/channel-runtime-context` | Utilidades genéricas de registro y consulta del contexto de ejecución de canales |
    | `plugin-sdk/matrix` | Fachada de compatibilidad con Matrix obsoleta para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad con Mattermost obsoleta para paquetes de canales de terceros antiguos; los plugins nuevos deben importar directamente subrutas genéricas del SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Módulo de exportación general obsoleto para utilidades de comandos, enlaces, HTTP e interacción de plugins; se prefieren las subrutas específicas de ejecución de plugins |
    | `plugin-sdk/hook-runtime` | Módulo de exportación general obsoleto para utilidades de Webhook y de la canalización de enlaces internos; se prefieren las subrutas específicas de ejecución de enlaces y plugins |
    | `plugin-sdk/lazy-runtime` | Utilidades de importación y vinculación diferidas en tiempo de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Utilidades de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Módulo de exportación general obsoleto para utilidades de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos; se prefieren las subrutas específicas de CLI y ejecución |
    | `plugin-sdk/qa-live-transport-scenarios` | Identificadores compartidos de escenarios de control de calidad de transporte en vivo, utilidades de cobertura de referencia y utilidad de selección de escenarios |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatible para esquemas de configuración de texto a voz y utilidades de ejecución |
    | `plugin-sdk/gateway-method-runtime` | Utilidad reservada de despacho de métodos del Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, utilidad de inicio del cliente preparado para el bucle de eventos, RPC de la CLI del Gateway, errores del protocolo del Gateway, resolución del host de LAN anunciado y utilidades para aplicar parches al estado de los canales |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica y exclusiva de tipos para formas de configuración de plugins, como `OpenClawConfig`, y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Utilidades de configuración de plugins en tiempo de ejecución, como `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Utilidades transaccionales de modificación de la configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Cadenas compartidas de indicaciones de metadatos de entrega para herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Utilidades de instantáneas de la configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas de prueba |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias a archivos sin el módulo de exportación general de texto |
    | `plugin-sdk/reply-runtime` | Utilidades compartidas de ejecución de entradas y respuestas, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de despacho y finalización de respuestas, y de etiquetas de conversaciones |
    | `plugin-sdk/reply-history` | Utilidades compartidas del historial de respuestas de ventana corta. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; las utilidades de mapas de nivel inferior permanecen únicamente como exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilidades específicas de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Utilidades de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), utilidades de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), utilidades de marcadores para valores transitorios de `sessionFile`, lecturas acotadas de texto reciente de transcripciones del usuario y el asistente por identidad de sesión, utilidades de rutas del almacén de sesiones y claves de sesión, y lecturas de la fecha de actualización, sin importaciones generales de escritura o mantenimiento de la configuración |
    | `plugin-sdk/session-transcript-runtime` | Identidad de transcripciones, utilidades con ámbito para destinos, lectura y escritura, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | Utilidades específicas de esquema, rutas y transacciones de agentes en SQLite para ejecución propia, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | Utilidades de rutas, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Utilidades de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado con claves de SQLite auxiliar de plugins, además de configuración centralizada de pragmas de conexión y mantenimiento de WAL para bases de datos propiedad de plugins |
    | `plugin-sdk/routing` | Utilidades de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilidades compartidas de resumen del estado de canales y cuentas, valores predeterminados del estado de ejecución y utilidades de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Utilidades compartidas de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de slugs y cadenas |
    | `plugin-sdk/request-url` | Extracción de URL en forma de cadena desde entradas similares a fetch o solicitudes |
    | `plugin-sdk/run-command` | Ejecutor de comandos con tiempo limitado y resultados normalizados de stdout y stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y CLI |
    | `plugin-sdk/tool-plugin` | Definición de un plugin sencillo y tipado de herramientas de agente, y exposición de metadatos estáticos para la generación de manifiestos |
    | `plugin-sdk/tool-payload` | Extracción de cargas útiles normalizadas desde objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos del destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | Tipos de backend de entorno aislado y utilidades de comandos SSH y OpenShell, incluida la comprobación preliminar de comandos de ejecución con fallo inmediato |
    | `plugin-sdk/temp-path` | Utilidades compartidas de rutas de descargas temporales y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Utilidades de registro y censura de subsistemas |
    | `plugin-sdk/markdown-table-runtime` | Modo de tablas Markdown y utilidades de conversión |
    | `plugin-sdk/model-session-runtime` | Utilidades de sustitución de modelos y sesiones, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Utilidades de resolución de la configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeñas utilidades de lectura y escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Utilidades de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | Utilidades de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Utilidades de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Utilidades de ejecución, sesiones y despacho de respuestas de ACP |
    | `plugin-sdk/acp-runtime-backend` | Utilidades ligeras de registro del backend y despacho de respuestas de ACP para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquemas de configuración para la ejecución de agentes; importe las primitivas de esquemas desde una superficie mantenida y propiedad de un plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Utilidades de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Utilidades de arranque de dispositivos y tokens de emparejamiento, incluida `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de utilidades para canales pasivos, estados y proxies ambientales |
    | `plugin-sdk/models-provider-runtime` | Utilidades de respuestas de comandos y proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilidades de enumeración de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Utilidades de registro, creación y serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental para plugins de confianza destinada a entornos de ejecución de agentes de bajo nivel: tipos de entorno de ejecución, utilidades para dirigir y cancelar ejecuciones activas, utilidades del puente de herramientas de OpenClaw, utilidades de políticas de herramientas del plan de ejecución, clasificación de resultados terminales, utilidades de formato y detalle del progreso de herramientas, y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de puntos de conexión propiedad del proveedor Z.AI; use la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Utilidad de bloqueo asíncrono local al proceso para pequeños archivos de estado de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Utilidad de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | Utilidad de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Utilidades de caché de desduplicación en memoria y respaldada por almacenamiento persistente |
    | `plugin-sdk/delivery-queue-runtime` | Utilidad de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Utilidades seguras de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | Utilidades de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | Utilidad de aserción de valores obligatorios para invariantes de ejecución demostrables |
    | `plugin-sdk/number-runtime` | Utilidad de conversión numérica |
    | `plugin-sdk/secure-random-runtime` | Utilidades seguras de tokens y UUID |
    | `plugin-sdk/system-event-runtime` | Utilidades de colas de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Utilidad de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | Utilidades de archivos de políticas de aprobación de ejecución sin el módulo de exportación general de ejecución de infraestructura |
    | `plugin-sdk/infra-runtime` | Adaptador de compatibilidad obsoleto; use las subrutas específicas de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Pequeñas utilidades de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Utilidades de indicadores de diagnóstico, eventos y contexto de seguimiento |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, utilidades compartidas de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Utilidades de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y resolución fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de ejecución compatible con el despachador, sin importaciones de proxy ni fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Utilidades de saneamiento de URL de datos de imágenes insertadas y detección de firmas sin la superficie general de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuestas sin la superficie general de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado de vinculación de la conversación actual sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | Resolución de la visibilidad del contexto y filtrado de contexto complementario sin importaciones generales de configuración o seguridad |
    | `plugin-sdk/string-coerce-runtime` | Utilidades específicas de conversión y normalización primitivas de registros y cadenas sin importaciones de Markdown o registro |
    | `plugin-sdk/html-entity-runtime` | Decodificación en una sola pasada de entidades HTML5 terminadas en punto y coma sin utilidades generales de texto |
    | `plugin-sdk/text-utility-runtime` | Utilidades de bajo nivel para texto y rutas, incluido el escape de cinco entidades HTML |
    | `plugin-sdk/host-runtime` | Utilidades de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Utilidades de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Módulo de exportación general obsoleto para utilidades de directorios, identidad y espacios de trabajo de agentes, incluidas `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren las subrutas específicas de agentes y ejecución |
    | `plugin-sdk/directory-runtime` | Consulta y desduplicación de directorios respaldadas por la configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Módulo de exportación general de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se recomienda usar `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas del entorno de ejecución de capacidades, así como usar los auxiliares de almacenamiento antes de las lecturas de búfer cuando una URL deba convertirse en un recurso multimedia de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos del almacén de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de conmutación por error para la generación de medios, selección de candidatos y mensajes de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de proveedores para la comprensión de medios, además de exportaciones de auxiliares de imagen, audio y extracción estructurada orientados a proveedores |
    | `plugin-sdk/text-chunking` | Fragmentación de texto saliente y de intervalos conservando los desplazamientos, fragmentación y auxiliares de renderizado de Markdown, tokenización de etiquetas HTML que respeta las comillas, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones orientadas a proveedores para directivas, registro, validación, constructor de TTS compatible con OpenAI y auxiliares de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas, normalización y exportaciones de auxiliares de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de inicialización de perfiles en tiempo real para la inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real, auxiliares de registro y auxiliares compartidos de comportamiento de voz en tiempo real, incluido el seguimiento de la actividad de salida |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes, además de auxiliares de recursos de imagen y URL de datos, y el constructor de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes y auxiliares de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor, solicitud y resultado para la generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos obsoletos de generación de música, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos; se recomiendan las superficies de proveedores de música pertenecientes al Plugin |
    | `plugin-sdk/video-generation` | Tipos de proveedor, solicitud y resultado para la generación de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartidos de carga de medios remotos y locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/testing` | Módulo de exportación de compatibilidad obsoleto y local al repositorio para pruebas heredadas de OpenClaw. En su lugar, las nuevas pruebas del repositorio deben importar subrutas locales de prueba específicas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi`, local al repositorio, para pruebas unitarias de registro directo de plugins sin importar puentes de auxiliares de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Datos de prueba de contratos de adaptadores nativos del entorno de ejecución de agentes, locales al repositorio, para pruebas de autenticación, entrega, reserva, enlaces de herramientas, superposición de indicaciones, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de prueba orientados a canales y locales al repositorio para contratos genéricos de acciones, configuración y estado; aserciones de directorios; ciclo de vida del inicio de cuentas; propagación de la configuración de envío; simulaciones del entorno de ejecución; problemas de estado; entrega saliente; y registro de enlaces |
    | `plugin-sdk/channel-target-testing` | Conjunto compartido y local al repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares locales al repositorio para pruebas específicas de contratos de canales, sin el módulo de exportación general de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales al repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API del entorno de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares de prueba locales al repositorio para el almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales al repositorio para contratos de entorno de ejecución de proveedores, autenticación, detección, incorporación, catálogo, asistente, capacidades multimedia, política de reproducción, audio en directo para STT en tiempo real, búsqueda y obtención web, y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Simulaciones HTTP y de autenticación de Vitest, locales al repositorio y de activación voluntaria, para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales al repositorio para adjuntar metadatos a datos de prueba de cargas útiles de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares del ciclo de vida de SQLite, locales al repositorio, para pruebas propias |
    | `plugin-sdk/test-fixtures` | Datos de prueba locales al repositorio para captura genérica del entorno de ejecución de la CLI, contexto del entorno aislado, escritor de Skills, mensajes de agente, eventos del sistema, recarga de módulos, rutas de plugins integrados, texto de terminal, fragmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares locales al repositorio y específicos para simular módulos integrados de Node dentro de fábricas `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta del entorno de ejecución para indexación y búsqueda en memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares ligeros del registro de proveedores de incrustaciones de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de incrustaciones del host de memoria, acceso al registro, proveedor local y auxiliares genéricos remotos y por lotes. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; use la API genérica de proveedores de incrustaciones para los proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales obsoletos del host de memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta obsoletos del host de memoria; se recomiendan las subrutas neutrales respecto al proveedor del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares del entorno de ejecución de la CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principales del entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos y del entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los auxiliares principales del entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown administrado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Fachada del entorno de ejecución de Active Memory para acceder al administrador de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares integrados">
    Las subrutas del SDK de auxiliares integrados reservados son superficies específicas
    y delimitadas de cada propietario para el código de plugins integrados. Se registran
    en el inventario del SDK para que las compilaciones de paquetes y los alias sean
    deterministas, pero no son API generales para la creación de plugins. Los nuevos
    contratos reutilizables del host deben usar subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` y
    `plugin-sdk/plugin-config-runtime`.

    | Subruta | Propietario y finalidad |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar del Plugin Codex integrado para proyectar la configuración del servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación de paquete reservada) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del Plugin Codex integrado para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local al repositorio, no es una exportación de paquete) |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
