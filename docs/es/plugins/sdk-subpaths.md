---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para la importación de un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de plugins: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de plugins
x-i18n:
    generated_at: "2026-07-21T09:01:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b39919e7e12be394ed8f384dcd99bec5ce801e32d9de2ed1e9add7c2d644932
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins contiene subrutas públicas específicas y asistentes incluidos de uso exclusivo del repositorio
en `openclaw/plugin-sdk/`. Esta página cataloga ambos y etiqueta
explícitamente las entradas privadas locales. Tres archivos definen el límite:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila la compilación.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas internas
  excluidas del SDK tipado y documentado. Las entradas de producción siguen disponibles
  como exportaciones del entorno de ejecución del host solo para JavaScript para plugins oficiales
  publicados por separado; las entradas exclusivas para pruebas permanecen sin exportar.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, asistentes incluidos reservados, fachadas incluidas compatibles y
  superficies públicas propiedad de plugins.

Los responsables de mantenimiento auditan el número de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas activas de asistentes reservados con `pnpm plugins:boundary-report:summary`;
las exportaciones de asistentes reservados sin usar hacen que falle el informe de la Pipeline de CI, en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Privada local después de julio de 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Privada local después de julio de 2026; asistentes de elementos del proveedor de migración, como `createMigrationItem`, constantes de motivo, marcadores de estado de elementos, asistentes de ocultación y `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Privada local después de julio de 2026; asistentes de migración del entorno de ejecución, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`              |
| `plugin-sdk/health`            | Tipos de registro, detección, reparación, selección, gravedad y hallazgo de comprobaciones de estado de Doctor para consumidores de estado incluidos                                                                                |

### Compatibilidad y asistentes privados locales

Solo permanecen exportadas las subrutas obsoletas del periodo posterior. Los alias de julio de 2026 y
las subrutas sin usar se eliminaron, mientras que los asistentes exclusivos de componentes incluidos se retiraron del
paquete público y se etiquetan a continuación como privados locales. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rechaza los componentes incluidos
`plugin-sdk/text-runtime` son solo de compatibilidad y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los barrels amplios de dominio
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de
subrutas específicas.

Las subrutas de asistentes de prueba de OpenClaw respaldadas por Vitest son solo locales al repositorio y ya no son
exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` y `testing`. Las superficies privadas de asistentes incluidos
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo locales
al repositorio.

### Subrutas de asistentes de plugins incluidos

Los módulos de asistentes exclusivos de plugins incluidos son privados locales después de la revisión de julio de 2026. Las protecciones del contrato del paquete bloquean las importaciones entre propietarios. `src/plugin-sdk/entrypoints.ts` registra por separado las fachadas incluidas compatibles que siguen siendo públicas, puntos de entrada del SDK
respaldados por su plugin incluido hasta que los contratos genéricos sustituyan
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
obsoletos para el código nuevo; véanse las notas de cada fila a continuación.

<AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Privada local después de julio de 2026; asistente de validación de esquemas JSON en caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Asistentes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos y generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Asistentes de configuración y control de acciones para varias cuentas, asistentes de reserva para la cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, asistentes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Asistentes de búsqueda de cuentas y reserva predeterminada |
    | `plugin-sdk/account-helpers` | Asistentes específicos de listas de cuentas y acciones de cuenta |
    | `plugin-sdk/access-groups` | Privada local después de julio de 2026; asistentes de análisis de listas de permitidos de grupos de acceso y diagnóstico ocultado de grupos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Privada local después de julio de 2026; esquemas de configuración de canales de OpenClaw incluidos, solo para plugins incluidos mantenidos |
    | `plugin-sdk/chat-channel-ids` | Privada local después de julio de 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat incluidos/oficiales, además de etiquetas/alias de formateadores para plugins que necesitan reconocer texto con prefijo de envoltura sin codificar de forma fija su propia tabla. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de alto nivel del entorno de ejecución de entrada de canales, resolutor de políticas de menciones implícitas y generadores de datos de rutas para rutas migradas de recepción de canales. Se recomienda usarlo en lugar de ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada plugin. Véase [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de mensajes, además de opciones de la Pipeline de respuestas, confirmaciones, vista previa en vivo/transmisión, asistentes del ciclo de vida, identidad de salida, planificación de cargas útiles, envíos duraderos y asistentes de contexto de envío de mensajes. Véase [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Asistentes compartidos para generar rutas de entrada y envolturas |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de despacho, y `plugin-sdk/channel-outbound` para asistentes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Privada local después de julio de 2026; asistentes compartidos de carga de contenido multimedia de salida y estado de contenido multimedia alojado |
    | `plugin-sdk/poll-runtime` | Privada local después de julio de 2026; asistentes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Privada local después de julio de 2026; asistentes del ciclo de vida y adaptadores de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Fachada de compatibilidad obsoleta para raíces y cargadores de cargas útiles multimedia del agente. Los plugins de canales nuevos usan la planificación tipada de cargas útiles de salida de `plugin-sdk/channel-outbound`; la carga de contenido multimedia local proporcionado por el operador sigue usando la fachada conservada hasta que exista una interfaz pública específica para raíces locales. |
    | `plugin-sdk/conversation-runtime` | Barrel amplio obsoleto para vinculación de conversaciones/hilos, emparejamiento y asistentes de vinculaciones configuradas; se prefieren subrutas de vinculación específicas como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Asistentes de resolución de políticas de grupos del entorno de ejecución |
    | `plugin-sdk/channel-status` | Asistentes compartidos de instantáneas y resúmenes del estado de los canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Privada local después de julio de 2026; asistentes de autorización para la escritura de configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas del preámbulo de plugins de canales |
    | `plugin-sdk/allowlist-config-edit` | Asistentes de edición y lectura de la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Asistentes obsoletos para decisiones de acceso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Privada local después de julio de 2026; asistentes específicos de políticas de protección de mensajes directos antes del cifrado |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad con Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad registrada del propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad para la resolución de cuentas de Telegram destinada a la compatibilidad registrada del propietario; los plugins nuevos deben usar asistentes inyectados del entorno de ejecución o subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Presentación semántica, entrega y asistentes heredados de respuestas interactivas de mensajes. Véase [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Resuelve las opciones `ask_user` creadas por el entorno de ejecución mediante el Gateway desde los controladores de interacción de canales |
    | `plugin-sdk/channel-inbound` | Asistentes compartidos de entrada para clasificación de eventos, creación de contexto, formato, raíces, antirrebote, coincidencia de menciones, política de menciones y registro de entradas |
    | `plugin-sdk/channel-inbound-debounce` | Asistentes específicos de antirrebote de entrada |
    | `plugin-sdk/channel-mention-gating` | Privada local después de julio de 2026; asistentes específicos de políticas de menciones, marcadores de menciones y texto de menciones sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | Asistentes de acciones de mensajes de canales, además de asistentes obsoletos de esquemas nativos conservados para la compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Privada local después de julio de 2026; normalización compartida de rutas, resolución de destinos basada en analizadores, conversión de identificadores de hilos en cadenas, claves de rutas deduplicadas/compactas, tipos de destinos analizados y asistentes de comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Privada local después de julio de 2026; asistentes de análisis de destinos; los invocadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canales |
    | `plugin-sdk/channel-feedback` | Conexión de comentarios/reacciones |
  </Accordion>

Las subrutas de compatibilidad de canales del periodo posterior permanecen públicas solo hasta sus
fechas de registro. Se han eliminado los alias de julio, como el acceso directo a mensajes directos, las opciones de respuesta, las rutas
de emparejamiento y las divisiones del entorno de ejecución de canales; los asistentes exclusivos de componentes incluidos
son privados locales.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Local privado después de julio de 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Local privado después de julio de 2026; auxiliares seleccionados para configurar proveedores locales o autoalojados |
    | `plugin-sdk/cli-backend` | Local privado después de julio de 2026; valores predeterminados del backend de la CLI y constantes del monitor de vigilancia |
    | `plugin-sdk/provider-auth-runtime` | Local privado después de julio de 2026; auxiliares de ejecución para la autenticación de proveedores: flujo de bucle invertido de OAuth, intercambio de tokens, persistencia de la autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Local privado después de julio de 2026; tipos genéricos de devolución de llamada de OAuth para proveedores, representación de la página de devolución de llamada, auxiliares de PKCE/estado, análisis de entradas de autorización, auxiliares de expiración de tokens y auxiliares de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Local privado después de julio de 2026; auxiliares de incorporación mediante claves de API y escritura de perfiles, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Local privado después de julio de 2026; generador estándar de resultados de autenticación de OAuth |
    | `plugin-sdk/provider-env-vars` | Local privado después de julio de 2026; auxiliares de búsqueda de variables de entorno para la autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | Local privado después de julio de 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, generadores compartidos de políticas de repetición, auxiliares de endpoints de proveedores y auxiliares compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Local privado después de julio de 2026; auxiliares del catálogo de modelos de proveedores en vivo para el descubrimiento protegido al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Enlace de ejecución para ampliar el catálogo de proveedores e interfaces del registro de proveedores de plugins para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | Local privado después de julio de 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Local privado después de julio de 2026; auxiliares genéricos de capacidades HTTP/endpoints de proveedores, errores HTTP de proveedores y auxiliares de formularios multiparte para la transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Local privado después de julio de 2026; auxiliares específicos del contrato de configuración/selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Local privado después de julio de 2026; auxiliares de registro/caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Local privado después de julio de 2026; auxiliares específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan conexiones de activación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Local privado después de julio de 2026; auxiliares específicos del contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores/obtenedores de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Local privado después de julio de 2026; auxiliares de registro/caché/ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Local privado después de julio de 2026; tipos generales de proveedores de incrustaciones y auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para garantizar la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | Local privado después de julio de 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` y limpieza de esquemas y diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Local privado después de julio de 2026; tipos de instantáneas de uso de proveedores, auxiliares compartidos de obtención de uso y recuperadores de proveedores como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Local privado después de julio de 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos, compatibilidad de llamadas a herramientas mediante texto sin formato y auxiliares compartidos de envoltorios de Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Local privado después de julio de 2026; auxiliares públicos compartidos de envoltorios de flujos de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` y utilidades de flujos compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Local privado después de julio de 2026; auxiliares de transporte nativo de proveedores, como la obtención protegida, la extracción de texto de resultados de herramientas, las transformaciones de mensajes de transporte y los flujos escribibles de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Local privado después de julio de 2026; auxiliares de parcheo de la configuración de incorporación |
    | `plugin-sdk/global-singleton` | Local privado después de julio de 2026; auxiliares de singleton/mapa/caché locales del proceso |
    | `plugin-sdk/group-activation` | Local privado después de julio de 2026; auxiliares específicos de análisis de comandos y del modo de activación de grupos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje utilizado y una hora de restablecimiento opcional. Los proveedores que exponen el saldo o
texto del estado de la cuenta en lugar de intervalos de cuota restablecibles deben devolver
`summary` con una matriz `windows` vacía, en lugar de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; use `error` solo cuando el
endpoint de uso haya fallado o no haya devuelto datos de uso aprovechables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia y obsoleta de autorización de comandos (`resolveControlCommandGate`, auxiliares del registro de comandos, incluido el formato de menús de argumentos dinámicos, y auxiliares de autorización de remitentes); use la autorización de entrada/ejecución del canal o los auxiliares de estado de comandos |
    | `plugin-sdk/command-status` | Generadores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfiles/filtros de aprobación de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Local privado después de julio de 2026; auxiliar determinista de localizadores persistentes para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores nativos de aprobación para puntos de entrada activos de canales |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares de ejecución más amplios para controladores de aprobación; prefiera las interfaces más específicas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprobación, vinculación de cuentas, control de rutas, alternativa de reenvío y supresión de solicitudes locales nativas de ejecución |
    | `plugin-sdk/approval-reaction-runtime` | Local privado después de julio de 2026; vinculaciones codificadas de reacciones de aprobación, cargas útiles de solicitudes de reacción, almacenes de destinos de reacción, auxiliares de texto de indicaciones de reacción y exportación de compatibilidad para la supresión de solicitudes locales nativas de ejecución |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas útiles de respuestas de aprobación de ejecución/plugins |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas útiles de aprobación de ejecución/plugins, generadores de capacidades de aprobación, auxiliares de autenticación/perfiles de aprobación, auxiliares nativos de enrutamiento/ejecución de aprobaciones y auxiliares de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato de menús de argumentos dinámicos y auxiliares nativos de destinos de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas activas de canales |
    | `plugin-sdk/command-surface` | Local privado después de julio de 2026; auxiliares de normalización del cuerpo de comandos y de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Local privado después de julio de 2026; auxiliares de flujo diferido de inicio de sesión para la autenticación de proveedores mediante emparejamiento por código de dispositivo en canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia y obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); prefiera las subrutas específicas que aparecen a continuación |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones específicas del contrato de secretos y generadores del registro de destinos para superficies de secretos de canales/plugins que no sean TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Local privado después de julio de 2026; auxiliares específicos de asignación de secretos TTS de canales anidados |
    | `plugin-sdk/secret-ref-runtime` | Tipado, resolución y búsqueda de rutas de destinos del plan de SecretRef específicos para el análisis de contratos de secretos/configuraciones |
    | `plugin-sdk/security-runtime` | Barrel amplio y obsoleto para confianza, control de mensajes directos, auxiliares de archivos/rutas limitados a la raíz —incluidas escrituras de solo creación, sustitución atómica síncrona/asíncrona de archivos, escrituras temporales hermanas, alternativa de movimiento entre dispositivos, auxiliares privados de almacenamiento de archivos y protecciones de padres de enlaces simbólicos—, contenido externo, censura de texto confidencial, comparación de secretos en tiempo constante y auxiliares de recopilación de secretos; prefiera las subrutas específicas de seguridad/SSRF/secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de listas de hosts permitidos y políticas SSRF de redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Local privado después de julio de 2026; auxiliares específicos de despachadores fijados sin la amplia superficie de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de despachadores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes/destinos de Webhook y conversión de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño/tiempo de espera del cuerpo de las solicitudes y `runDetachedWebhookWork` para el procesamiento supervisado posterior a la confirmación |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilidades de entorno de ejecución, registro y copias de seguridad, advertencias sobre rutas de instalación de plugins y utilidades de procesos |
    | `plugin-sdk/runtime-env` | Utilidades específicas de entorno de ejecución, entorno, registro, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | Local privado después de julio de 2026; fachada compatible de configuración del navegador para perfiles y valores predeterminados normalizados, análisis de URL de CDP y utilidades de autenticación para el control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Local privado después de julio de 2026; utilidades genéricas de ciclo de vida de tareas y entrega de finalización para agentes respaldados por un arnés que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | Local privado después de julio de 2026; utilidad reservada de Codex incluida para proyectar la configuración de servidores MCP del usuario en la configuración de hilos de Codex; no destinada a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Utilidad de Codex incluida y local al repositorio para el cableado nativo del espejo de tareas y el entorno de ejecución; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Utilidades genéricas de registro y búsqueda del contexto del entorno de ejecución del canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidad obsoleta de Matrix para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Módulo de exportación general obsoleto para utilidades de comandos, hooks, HTTP e interacción de plugins; se prefieren subrutas específicas del entorno de ejecución de plugins |
    | `plugin-sdk/hook-runtime` | Módulo de exportación general obsoleto para utilidades del pipeline de webhooks y hooks internos; se prefieren subrutas específicas de hooks y del entorno de ejecución de plugins |
    | `plugin-sdk/lazy-runtime` | Utilidades de importación y vinculación diferidas del entorno de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Local privado después de julio de 2026; utilidades de ejecución de procesos |
    | `plugin-sdk/node-host` | Local privado después de julio de 2026; utilidades de resolución de ejecutables del host Node y reanudación de PTY |
    | `plugin-sdk/cli-runtime` | Local privado después de julio de 2026; módulo de exportación general obsoleto para utilidades de formato de la CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos; se prefieren subrutas específicas de la CLI y el entorno de ejecución |
    | `plugin-sdk/qa-runner-runtime` | Local privado después de julio de 2026; fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | Local privado después de julio de 2026; fachada compatible para esquemas de configuración de texto a voz y utilidades del entorno de ejecución |
    | `plugin-sdk/gateway-method-runtime` | Utilidad reservada de despacho de métodos del Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, utilidad de inicio del cliente cuando el bucle de eventos está listo, RPC de la CLI del Gateway, errores del protocolo del Gateway, resolución del host de LAN anunciado y utilidades de parcheo del estado de canales |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica y solo de tipos para estructuras de configuración de plugins, como `OpenClawConfig`, y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Fachada de compatibilidad obsoleta para utilidades de configuración de plugins en tiempo de ejecución; los plugins nuevos usan `api.pluginConfig` junto con contratos de configuración específicos, instantáneas y utilidades de mutación |
    | `plugin-sdk/config-mutation` | Utilidades transaccionales de mutación de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Local privado después de julio de 2026; cadenas compartidas de indicaciones de metadatos de entrega para herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Utilidades de instantáneas de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas para pruebas |
    | `plugin-sdk/text-autolink-runtime` | Local privado después de julio de 2026; detección de enlaces automáticos para referencias a archivos sin el módulo de exportación general de texto |
    | `plugin-sdk/reply-runtime` | Utilidades compartidas del entorno de ejecución para mensajes entrantes y respuestas, fragmentación, despacho, heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de despacho y finalización de respuestas, y de etiquetas de conversación |
    | `plugin-sdk/reply-history` | Utilidades compartidas para el historial de respuestas de ventana corta. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; las utilidades de mapas de nivel inferior siguen siendo únicamente exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | Local privado después de julio de 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilidades específicas de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Utilidades de flujos de trabajo de sesión (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), utilidades de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), utilidades de marcadores para valores transitorios `sessionFile`, lecturas limitadas del texto reciente de transcripciones del usuario y del asistente por identidad de sesión, utilidades de rutas del almacén de sesiones y claves de sesión, y lecturas de la fecha de actualización, sin importaciones generales de escritura o mantenimiento de configuración |
    | `plugin-sdk/session-transcript-runtime` | Local privado después de julio de 2026; identidad de transcripciones, cursores sin procesar y visibles limitados, utilidades con ámbito para destinos, lectura y escritura, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | Local privado después de julio de 2026; utilidades específicas de esquemas de agentes SQLite, rutas y transacciones para el entorno de ejecución propio, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | Local privado después de julio de 2026; utilidades de rutas, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Utilidades de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | Local privado después de julio de 2026; contratos de estado con claves y ámbito de plugin, BLOB y concesiones cooperativas de SQLite, además de pragma de conexión, mantenimiento verificado de WAL y utilidades de migración atómica de esquemas STRICT. Las devoluciones de llamada de concesión reciben una señal de cancelación y los errores tipados distinguen entre tiempo de espera agotado, cancelación, pérdida de propiedad, entrada no válida y fallo de almacenamiento |
    | `plugin-sdk/routing` | Utilidades de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilidades compartidas de resumen del estado de canales y cuentas, valores predeterminados del estado del entorno de ejecución y utilidades de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Local privado después de julio de 2026; utilidades compartidas de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Local privado después de julio de 2026; utilidades de normalización de identificadores legibles y cadenas |
    | `plugin-sdk/request-url` | Local privado después de julio de 2026; extracción de URL de cadena desde entradas similares a fetch o request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con límite de tiempo y resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y de la CLI |
    | `plugin-sdk/tool-plugin` | Define un plugin sencillo y tipado de herramientas de agente y expone metadatos estáticos para generar manifiestos |
    | `plugin-sdk/tool-payload` | Local privado después de julio de 2026; extracción de cargas útiles normalizadas desde objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos del destino de envío desde los argumentos de herramientas |
    | `plugin-sdk/sandbox` | De uso local privado después de julio de 2026; tipos de backend de Sandbox y utilidades de comandos SSH/OpenShell, incluida la comprobación previa de comandos de ejecución con fallo inmediato |
    | `plugin-sdk/temp-path` | Utilidades compartidas para rutas temporales de descarga y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Registrador del subsistema y utilidades de censura |
    | `plugin-sdk/markdown-table-runtime` | De uso local privado después de julio de 2026; modo de tablas Markdown y utilidades de conversión |
    | `plugin-sdk/model-session-runtime` | Utilidades de sobrescritura de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | De uso local privado después de julio de 2026; utilidades de resolución de la configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeñas utilidades de lectura/escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | De uso local privado después de julio de 2026; utilidades de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | De uso local privado después de julio de 2026; utilidades reentrantes de bloqueo de archivos y recuperación segura para Doctor de archivos auxiliares de bloqueo retirados que estén definitivamente obsoletos y sin cambios |
    | `plugin-sdk/persistent-dedupe` | Utilidades de caché de deduplicación respaldada por disco |
    | `plugin-sdk/ingress-effect-once` | Protección duradera de reclamación/confirmación para efectos secundarios de entrada no idempotentes |
    | `plugin-sdk/acp-runtime` | De uso local privado después de julio de 2026; utilidades de entorno de ejecución/sesión de ACP y distribución de respuestas |
    | `plugin-sdk/acp-runtime-backend` | De uso local privado después de julio de 2026; utilidades ligeras de registro de backends de ACP y distribución de respuestas para plugins cargados durante el inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | De uso local privado después de julio de 2026; resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas del esquema de configuración del entorno de ejecución del agente; importe las primitivas del esquema desde una superficie mantenida y propiedad de un plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | De uso local privado después de julio de 2026; utilidades de resolución de coincidencias con nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Utilidades de arranque de dispositivos y tokens de emparejamiento, incluida `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas de canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Utilidades de respuestas de comandos/proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilidades para enumerar comandos de Skills |
    | `plugin-sdk/native-command-registry` | Utilidades de registro, compilación y serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental para plugins de confianza destinada a infraestructuras de agentes de bajo nivel: tipos de infraestructura, utilidades para orientar/abortar ejecuciones activas, utilidades del puente de herramientas de OpenClaw, utilidades de políticas de herramientas del plan de ejecución, clasificación de resultados del terminal, utilidades de formato/detalle del progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/async-lock-runtime` | De uso local privado después de julio de 2026; utilidad de bloqueo asíncrono local al proceso para archivos pequeños de estado de ejecución |
    | `plugin-sdk/channel-activity-runtime` | De uso local privado después de julio de 2026; utilidad de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | De uso local privado después de julio de 2026; utilidad de concurrencia limitada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Utilidades de caché de deduplicación en memoria y con respaldo persistente |
    | `plugin-sdk/delivery-queue-runtime` | De uso local privado después de julio de 2026; utilidad de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | De uso local privado después de julio de 2026; utilidades seguras para rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | De uso local privado después de julio de 2026; utilidades de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | De uso local privado después de julio de 2026; utilidad de aserción de valores obligatorios para invariantes demostrables del entorno de ejecución |
    | `plugin-sdk/number-runtime` | De uso local privado después de julio de 2026; utilidad de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | De uso local privado después de julio de 2026; utilidades seguras de tokens/UUID |
    | `plugin-sdk/system-event-runtime` | De uso local privado después de julio de 2026; utilidades de la cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | De uso local privado después de julio de 2026; utilidad de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | De uso local privado después de julio de 2026; utilidades de archivos de políticas de aprobación de ejecución sin el amplio módulo de exportación de la infraestructura de ejecución |
    | `plugin-sdk/infra-runtime` | Capa de compatibilidad obsoleta; use las subrutas específicas del entorno de ejecución indicadas anteriormente |
    | `plugin-sdk/collection-runtime` | Pequeñas utilidades de caché limitada |
    | `plugin-sdk/diagnostic-runtime` | Utilidades de indicadores de diagnóstico, eventos y contexto de seguimiento |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, utilidades compartidas de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | De uso local privado después de julio de 2026; utilidades de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y búsquedas fijadas |
    | `plugin-sdk/runtime-fetch` | De uso local privado después de julio de 2026; fetch del entorno de ejecución compatible con el despachador, sin importaciones de proxy ni de fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | De uso local privado después de julio de 2026; utilidades de saneamiento de URL de datos de imágenes en línea y detección de firmas sin la amplia superficie multimedia del entorno de ejecución |
    | `plugin-sdk/response-limit-runtime` | De uso local privado después de julio de 2026; lectores del cuerpo de respuestas limitados por bytes, inactividad y plazo, sin la amplia superficie multimedia del entorno de ejecución |
    | `plugin-sdk/session-binding-runtime` | De uso local privado después de julio de 2026; estado actual de vinculación de conversaciones sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | De uso local privado después de julio de 2026; resolución de la visibilidad del contexto y filtrado del contexto complementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Utilidades específicas de coerción y normalización primitivas de registros/cadenas sin importaciones de Markdown/registro |
    | `plugin-sdk/html-entity-runtime` | De uso local privado después de julio de 2026; decodificación en una sola pasada de entidades HTML5 terminadas en punto y coma, sin utilidades de texto amplias |
    | `plugin-sdk/text-utility-runtime` | Privado y local después de julio de 2026; utilidades de bajo nivel para texto y rutas, incluido el escape de HTML de cinco entidades |
    | `plugin-sdk/widget-html` | Detección de documentos completos, validación de tamaño y errores de entrada de herramientas para widgets HTML autocontenidos |
    | `plugin-sdk/host-runtime` | Privado y local después de julio de 2026; utilidades de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Privado y local después de julio de 2026; utilidades para la configuración y la ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Barrel amplio obsoleto para utilidades de directorio, identidad y espacio de trabajo del agente, incluidas `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren las subrutas específicas de agente y entorno de ejecución |
    | `plugin-sdk/directory-runtime` | Consulta y deduplicación de directorios respaldadas por la configuración |
    | `plugin-sdk/keyed-async-queue` | Privado y local después de julio de 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplio de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se recomienda usar `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas del entorno de ejecución de capacidades, así como usar los auxiliares de almacenamiento antes de leer búferes cuando una URL deba convertirse en contenido multimedia de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos de almacenamiento de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Local privado después de julio de 2026; auxiliares compartidos de conmutación por error para la generación de medios, selección de candidatos y mensajes sobre modelos ausentes |
    | `plugin-sdk/media-understanding` | Fachada de compatibilidad obsoleta para tipos de proveedores y auxiliares de comprensión de medios; los nuevos proveedores se registran mediante la API de plugins inyectada y mantienen los auxiliares de solicitudes bajo la propiedad del plugin |
    | `plugin-sdk/text-chunking` | Fragmentación de texto saliente y de rangos que conserva los desplazamientos, fragmentación de Markdown y auxiliares de renderizado, tokenización de etiquetas HTML que reconoce citas, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Local privado después de julio de 2026; tipos de proveedores de voz, además de exportaciones de directivas orientadas a proveedores, registro, validación, constructor de TTS compatible con OpenAI y auxiliares de voz |
    | `plugin-sdk/speech-core` | Local privado después de julio de 2026; tipos compartidos de proveedores de voz y exportaciones de registro, directivas, normalización y auxiliares de voz |
    | `plugin-sdk/speech-settings` | Primitivas ligeras de resolución y normalización de la configuración de TTS sin registros de proveedores ni entorno de ejecución de síntesis |
    | `plugin-sdk/realtime-transcription` | Local privado después de julio de 2026; tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Local privado después de julio de 2026; auxiliar de inicialización de perfiles en tiempo real para la inyección acotada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Local privado después de julio de 2026; tipos de proveedores de voz en tiempo real, auxiliares de registro, umbrales compartidos de energía de audio e inicio del habla, y auxiliares de comportamiento de voz en tiempo real, incluidos el arnés de sesiones independiente del transporte y el seguimiento de la actividad de salida |
    | `plugin-sdk/meeting-runtime` | Entorno de ejecución de sesiones de reuniones en el navegador, motores y transportes de audio en tiempo real, `MeetingPlatformAdapter`, control de navegador/Node, consulta al agente, delegación de llamadas de voz, comprobaciones de configuración y auxiliares de comandos de SoX |
    | `plugin-sdk/image-generation` | Local privado después de julio de 2026; tipos de proveedores de generación de imágenes, auxiliares de recursos de imagen y URL de datos, y constructor de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Local privado después de julio de 2026; tipos compartidos de generación de imágenes y auxiliares de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Local privado después de julio de 2026; tipos de proveedor, solicitud y resultado de generación de música |
    | `plugin-sdk/video-generation` | Local privado después de julio de 2026; tipos de proveedor, solicitud y resultado de generación de vídeo |
    | `plugin-sdk/video-generation-core` | Local privado después de julio de 2026; tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Local privado después de julio de 2026; tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Local privado después de julio de 2026; registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/web-media` | Auxiliares compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local del repositorio para pruebas unitarias de registro directo de plugins sin importar puentes de auxiliares de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Accesorios de contratos del adaptador del entorno de ejecución nativo de agentes, locales del repositorio, para pruebas de autenticación, entrega, reserva, enlaces de herramientas, superposición de prompts, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de prueba orientados a canales, locales del repositorio, para contratos genéricos de acciones/configuración/estado, aserciones de directorios, ciclo de vida de inicio de cuentas, propagación de la configuración de envío, simulaciones del entorno de ejecución, problemas de estado, entrega saliente y registro de enlaces |
    | `plugin-sdk/channel-target-testing` | Conjunto compartido local del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares específicos locales del repositorio para pruebas de contratos de canales sin el barrel amplio de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales del repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API del entorno de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locales del repositorio para pruebas del almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales del repositorio para contratos de entorno de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad multimedia, política de reproducción, audio en directo de STT en tiempo real, búsqueda/obtención web y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Local privado después de julio de 2026; simulaciones HTTP/de autenticación de Vitest, opcionales y locales del repositorio, para pruebas de proveedores que utilizan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales del repositorio para adjuntar metadatos a accesorios de cargas útiles de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locales del repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Accesorios locales del repositorio para captura genérica del entorno de ejecución de la CLI, contexto de entorno aislado, escritor de Skills, mensajes de agentes, eventos del sistema, recarga de módulos, rutas de plugins incluidos, texto del terminal, fragmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares específicos locales del repositorio para simular componentes integrados de Node dentro de fábricas `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Local privado después de julio de 2026; auxiliares ligeros del registro de proveedores de incrustaciones de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Local privado después de julio de 2026; contratos de incrustaciones del host de memoria, acceso al registro, proveedor local y auxiliares genéricos por lotes/remotos. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; use la API genérica de proveedores de incrustaciones para los nuevos proveedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Local privado después de julio de 2026; exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Local privado después de julio de 2026; exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Local privado después de julio de 2026; auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Local privado después de julio de 2026; auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Local privado después de julio de 2026; auxiliares del entorno de ejecución de la CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Local privado después de julio de 2026; auxiliares del entorno de ejecución principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Local privado después de julio de 2026; auxiliares de archivos/entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Fachada de compatibilidad obsoleta para auxiliares del host de memoria independientes del proveedor. Los nuevos plugins de memoria usan capacidades de memoria inyectadas y prompts preparados por el host; los plugins complementarios siguen usando la fachada conservada para el descubrimiento de artefactos públicos hasta que exista una interfaz de lectura específica. |
    | `plugin-sdk/memory-host-events` | Local privado después de julio de 2026; alias independiente del proveedor para auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Local privado después de julio de 2026; auxiliares compartidos de Markdown administrado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Local privado después de julio de 2026; fachada del entorno de ejecución de Active Memory para acceder al gestor de búsquedas |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares incluidos">
    Las subrutas del SDK reservadas para auxiliares incluidos son superficies específicas y limitadas de cada propietario para
    el código de los plugins incluidos. Se registran en el inventario del SDK para que las compilaciones de
    paquetes y los alias sigan siendo deterministas, pero no son API generales para
    crear plugins. Los nuevos contratos reutilizables del host deben usar subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime` y `plugin-sdk/ssrf-runtime`.

    | Subruta | Propietario y finalidad |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Local privado después de julio de 2026; auxiliar del plugin Codex incluido para proyectar la configuración del servidor MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación de paquete reservada) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del plugin Codex incluido para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local del repositorio, no es una exportación de paquete) |

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
