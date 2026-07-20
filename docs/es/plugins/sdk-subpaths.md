---
read_when:
    - Elegir la subruta de plugin-sdk adecuada para la importación de un plugin
    - Auditoría de subrutas de plugins incluidos y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de plugins: qué importaciones se encuentran en cada lugar, agrupadas por área'
title: Subrutas del SDK de plugins
x-i18n:
    generated_at: "2026-07-20T00:56:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de plugins contiene subrutas públicas específicas y ayudantes integrados exclusivos del repositorio
en `openclaw/plugin-sdk/`. Esta página cataloga ambos y etiqueta
explícitamente las entradas locales privadas. Tres archivos definen el límite:

- `scripts/lib/plugin-sdk-entrypoints.json`: el inventario mantenido de puntos de entrada
  que compila la compilación.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subrutas locales del repositorio
  para pruebas/uso interno. Las exportaciones del paquete son el inventario menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadatos de clasificación para subrutas
  obsoletas, ayudantes integrados reservados, fachadas integradas compatibles y
  superficies públicas propiedad de plugins.

Los mantenedores auditan el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y
las subrutas activas de ayudantes reservados con `pnpm plugins:boundary-report:summary`;
las exportaciones de ayudantes reservados sin usar hacen que falle el informe de CI, en lugar de permanecer en el
SDK público como deuda de compatibilidad inactiva.

Para consultar la guía de creación de plugins, véase [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Entrada del plugin

| Subruta                        | Exportaciones principales                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Local privada después de julio de 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Local privada después de julio de 2026; ayudantes de elementos del proveedor de migración, como `createMigrationItem`, constantes de motivos, marcadores de estado de elementos, ayudantes de censura y `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Local privada después de julio de 2026; ayudantes de migración en tiempo de ejecución, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`              |
| `plugin-sdk/health`            | Registro, detección, reparación, selección, gravedad y tipos de hallazgos de comprobaciones de estado de Doctor para consumidores de estado integrados                                                                                |

### Compatibilidad y ayudantes locales privados

Solo permanecen exportadas las subrutas obsoletas del periodo posterior. Los alias de julio de 2026 y
las subrutas sin usar se eliminaron, mientras que los ayudantes exclusivos de componentes integrados se retiraron del
paquete público y se etiquetan a continuación como locales privados. La lista mantenida es
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI rechaza los componentes integrados.
`plugin-sdk/text-runtime` son solo para compatibilidad y `plugin-sdk/zod` es una
reexportación de compatibilidad: importe `zod` directamente desde `zod`. Los barrels amplios
de dominio `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` y
`plugin-sdk/security-runtime` también están obsoletos en favor de
subrutas específicas.

Las subrutas de ayudantes de prueba de OpenClaw respaldadas por Vitest son solo locales del repositorio y ya no
son exportaciones del paquete: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` y `testing`. Las superficies privadas de ayudantes integrados
`ssrf-runtime-internal` y `codex-native-task-runtime` también son solo
locales del repositorio.

### Subrutas de ayudantes de plugins integrados

Los módulos de ayudantes exclusivos de componentes integrados son locales privados tras la revisión de julio de 2026. Las barreras del contrato del paquete bloquean las importaciones entre propietarios. `src/plugin-sdk/entrypoints.ts` realiza por separado el seguimiento de las fachadas integradas compatibles que siguen siendo públicas, puntos de entrada del SDK
respaldados por su plugin integrado hasta que los contratos genéricos sustituyan a
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
obsoletos para código nuevo; consulte las notas de cada fila a continuación.

<AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Local privada después de julio de 2026; ayudante de validación de esquemas JSON en caché para esquemas propiedad de plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, traductor de configuración, solicitudes de listas de permitidos, generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración y compuerta de acciones para varias cuentas, ayudantes de respaldo de la cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de identificadores de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas y respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Ayudantes específicos para listas de cuentas y acciones de cuenta |
    | `plugin-sdk/access-groups` | Local privada después de julio de 2026; análisis de listas de permitidos de grupos de acceso y ayudantes de diagnóstico de grupos con datos censurados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquemas de configuración de canales, además de Zod y generadores directos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Local privada después de julio de 2026; esquemas integrados de configuración de canales de OpenClaw únicamente para plugins integrados mantenidos |
    | `plugin-sdk/chat-channel-ids` | Local privada después de julio de 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identificadores canónicos de canales de chat integrados/oficiales, además de etiquetas/alias del formateador para plugins que necesiten reconocer texto con prefijo de sobre sin codificar su propia tabla. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolutor experimental de alto nivel del entorno de ejecución de entrada de canales, resolutor de políticas de menciones implícitas y generadores de datos de ruta para rutas migradas de recepción de canales. Se recomienda usarlo en lugar de ensamblar listas de permitidos efectivas, listas de comandos permitidos y proyecciones heredadas en cada plugin. Véase [API de entrada de canales](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos del ciclo de vida de mensajes, además de opciones del pipeline de respuestas, confirmaciones, vista previa en directo/transmisión, ayudantes del ciclo de vida, identidad saliente, planificación de cargas útiles, envíos duraderos y ayudantes de contexto de envío de mensajes. Véase [API de salida de canales](/es/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidad obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos para crear rutas y sobres de entrada |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-inbound` para ejecutores de entrada y predicados de despacho, y `plugin-sdk/channel-outbound` para ayudantes de entrega de mensajes. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análisis de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Local privada después de julio de 2026; ayudantes compartidos para cargar medios salientes y gestionar el estado de medios alojados |
    | `plugin-sdk/poll-runtime` | Local privada después de julio de 2026; ayudantes específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Local privada después de julio de 2026; ayudantes del ciclo de vida y adaptadores de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Fachada de compatibilidad obsoleta para raíces y cargadores de cargas útiles multimedia del agente. Los nuevos plugins de canales usan la planificación tipada de cargas útiles salientes de `plugin-sdk/channel-outbound`; la carga de medios locales proporcionados por el operador sigue usando la fachada conservada hasta que exista una interfaz pública específica para raíces locales. |
    | `plugin-sdk/conversation-runtime` | Barrel amplio obsoleto para vinculación de conversaciones/hilos, emparejamiento y ayudantes de vinculaciones configuradas; se recomiendan subrutas de vinculación específicas, como `plugin-sdk/thread-bindings-runtime` y `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de políticas de grupos en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Ayudantes compartidos para instantáneas/resúmenes del estado de canales |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquemas de configuración de canales |
    | `plugin-sdk/channel-config-writes` | Local privada después de julio de 2026; ayudantes de autorización para escribir la configuración de canales |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas del preámbulo de plugins de canales |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes para editar/leer la configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Ayudantes obsoletos para decisiones de acceso de grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Local privada después de julio de 2026; ayudantes específicos de políticas de protección previa al cifrado para mensajes directos |
    | `plugin-sdk/discord` | Fachada de compatibilidad obsoleta de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad registrada del propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canales |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad para la resolución de cuentas de Telegram destinada a la compatibilidad registrada del propietario; los plugins nuevos deben usar ayudantes inyectados del entorno de ejecución o subrutas genéricas del SDK de canales |
    | `plugin-sdk/interactive-runtime` | Ayudantes para la presentación semántica y entrega de mensajes, y para respuestas interactivas heredadas. Véase [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Resuelve las opciones `ask_user` creadas por el entorno de ejecución mediante el Gateway desde los controladores de interacción de canales |
    | `plugin-sdk/channel-inbound` | Ayudantes compartidos de entrada para clasificación de eventos, creación de contexto, formato, raíces, antirrebote, coincidencia de menciones, políticas de menciones y registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Ayudantes específicos de antirrebote de entrada |
    | `plugin-sdk/channel-mention-gating` | Local privada después de julio de 2026; ayudantes específicos para políticas de menciones, marcadores de menciones y texto de menciones sin la superficie más amplia del entorno de ejecución de entrada |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidad obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuestas |
    | `plugin-sdk/channel-actions` | Ayudantes para acciones de mensajes de canales, además de ayudantes obsoletos de esquemas nativos conservados para la compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Local privada después de julio de 2026; normalización compartida de rutas, resolución de destinos basada en analizadores, conversión de identificadores de hilos a cadenas, claves de rutas compactas/de desduplicación, tipos de destinos analizados y ayudantes de comparación de rutas/destinos |
    | `plugin-sdk/channel-targets` | Local privada después de julio de 2026; ayudantes de análisis de destinos; los consumidores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canales |
    | `plugin-sdk/channel-feedback` | Conexión de comentarios/reacciones |
  </Accordion>

Las subrutas de compatibilidad de canales del periodo posterior permanecen públicas solo hasta sus
fechas de registro. Se han eliminado los alias de julio, como el acceso a mensajes directos, las opciones de respuesta, las rutas
de emparejamiento y las divisiones del entorno de ejecución de canales; los ayudantes exclusivos de componentes integrados
son locales privados.

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Local privada después de julio de 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Local privada después de julio de 2026; auxiliares seleccionados para configurar proveedores locales o autoalojados |
    | `plugin-sdk/cli-backend` | Local privada después de julio de 2026; valores predeterminados del backend de la CLI + constantes del supervisor |
    | `plugin-sdk/provider-auth-runtime` | Local privada después de julio de 2026; auxiliares del entorno de ejecución para la autenticación de proveedores: flujo de bucle invertido de OAuth, intercambio de tokens, persistencia de la autenticación y resolución de claves de API |
    | `plugin-sdk/provider-oauth-runtime` | Local privada después de julio de 2026; tipos genéricos de devolución de llamada de OAuth para proveedores, renderizado de la página de devolución de llamada, auxiliares de PKCE/estado, análisis de la entrada de autorización, auxiliares de caducidad de tokens y auxiliares de cancelación |
    | `plugin-sdk/provider-auth-api-key` | Local privada después de julio de 2026; auxiliares de incorporación con claves de API y escritura de perfiles, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Local privada después de julio de 2026; generador estándar de resultados de autenticación de OAuth |
    | `plugin-sdk/provider-env-vars` | Local privada después de julio de 2026; auxiliares de búsqueda de variables de entorno para la autenticación de proveedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importación de autenticación de OpenAI Codex, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | Local privada después de julio de 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, generadores compartidos de políticas de repetición, auxiliares de endpoints de proveedores y auxiliares compartidos de normalización de identificadores de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Local privada después de julio de 2026; auxiliares del catálogo de modelos de proveedores en vivo para el descubrimiento protegido al estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrado de identificadores de modelos, caché con TTL y alternativa estática |
    | `plugin-sdk/provider-catalog-runtime` | Enlace del entorno de ejecución para ampliar el catálogo de proveedores y puntos de integración del registro de proveedores de plugins para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | Local privada después de julio de 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Local privada después de julio de 2026; auxiliares genéricos de capacidades HTTP/endpoints de proveedores, errores HTTP de proveedores y auxiliares de formularios multiparte para la transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Local privada después de julio de 2026; auxiliares específicos del contrato de configuración/selección de obtención web, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Local privada después de julio de 2026; auxiliares de registro/caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Local privada después de julio de 2026; auxiliares específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan la conexión de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Local privada después de julio de 2026; auxiliares específicos del contrato de configuración/credenciales de búsqueda web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y definidores/obtenedores de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Local privada después de julio de 2026; auxiliares de registro/caché/entorno de ejecución de proveedores de búsqueda web |
    | `plugin-sdk/embedding-providers` | Local privada después de julio de 2026; tipos generales de proveedores de incrustaciones y auxiliares de lectura, incluidos `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` y `listEmbeddingProviders(...)`; los plugins registran proveedores mediante `api.registerEmbeddingProvider(...)` para hacer cumplir la propiedad del manifiesto |
    | `plugin-sdk/provider-tools` | Local privada después de julio de 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza de esquemas + diagnóstico de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Local privada después de julio de 2026; tipos de instantáneas de uso de proveedores, auxiliares compartidos para obtener el uso y recuperadores de proveedores, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Local privada después de julio de 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos, compatibilidad con llamadas a herramientas en texto sin formato y auxiliares compartidos de envoltorios para Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Local privada después de julio de 2026; auxiliares públicos compartidos de envoltorios de flujos de proveedores, incluidos `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, y utilidades de flujos compatibles con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Local privada después de julio de 2026; auxiliares de transporte nativo de proveedores, como obtención protegida, extracción de texto de resultados de herramientas, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Local privada después de julio de 2026; auxiliares de aplicación de parches a la configuración de incorporación |
    | `plugin-sdk/global-singleton` | Local privada después de julio de 2026; auxiliares de singleton/mapa/caché locales del proceso |
    | `plugin-sdk/group-activation` | Local privada después de julio de 2026; auxiliares específicos del modo de activación de grupos y del análisis de comandos |
  </Accordion>

Las instantáneas de uso de proveedores normalmente informan de una o más `windows` de cuota, cada una con
una etiqueta, el porcentaje utilizado y una hora de restablecimiento opcional. Los proveedores que muestran texto de saldo o
estado de la cuenta en lugar de ventanas de cuota restablecibles deben devolver
`summary` con una matriz `windows` vacía, en vez de inventar porcentajes.
OpenClaw muestra ese texto de resumen en la salida de estado; se debe usar `error` solo cuando el
endpoint de uso haya fallado o no haya devuelto datos de uso utilizables.

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie amplia obsoleta de autorización de comandos (`resolveControlCommandGate`, auxiliares del registro de comandos, incluido el formato de menús de argumentos dinámicos, y auxiliares de autorización de remitentes); se debe usar la autorización de entrada/entorno de ejecución del canal o los auxiliares de estado de comandos |
    | `plugin-sdk/command-status` | Generadores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfiles/filtros de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidades/entrega de aprobaciones nativas |
    | `plugin-sdk/approval-gateway-runtime` | Resolutor compartido del Gateway de aprobaciones |
    | `plugin-sdk/approval-reference-runtime` | Local privada después de julio de 2026; auxiliar determinista de localizadores duraderos para devoluciones de llamada de aprobación limitadas por el transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores de aprobaciones nativas para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del entorno de ejecución de controladores de aprobaciones; se deben preferir los puntos de integración más específicos de adaptadores/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprobaciones nativas, vinculación de cuentas, control de rutas, alternativa de reenvío y supresión local de solicitudes de ejecución nativa |
    | `plugin-sdk/approval-reaction-runtime` | Local privada después de julio de 2026; vinculaciones codificadas de reacciones de aprobación, cargas útiles de solicitudes de reacción, almacenes de destinos de reacciones, auxiliares de texto de indicaciones de reacción y exportación de compatibilidad para la supresión local de solicitudes de ejecución nativa |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas útiles de respuestas de aprobación de ejecución/plugins |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas útiles de aprobación de ejecución/plugins, generadores de capacidades de aprobación, auxiliares de autenticación/perfiles de aprobación, auxiliares de enrutamiento/entorno de ejecución de aprobaciones nativas y auxiliares de visualización estructurada de aprobaciones, como `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativos, formato de menús de argumentos dinámicos y auxiliares de destinos de sesiones nativas |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canales |
    | `plugin-sdk/command-surface` | Local privada después de julio de 2026; auxiliares de normalización del cuerpo de comandos y de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Local privada después de julio de 2026; auxiliares de carga diferida del flujo de inicio de sesión de autenticación de proveedores para el emparejamiento mediante código de dispositivo de canales privados y la interfaz web |
    | `plugin-sdk/channel-secret-runtime` | Superficie amplia obsoleta del contrato de secretos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de secretos); se deben preferir las subrutas específicas siguientes |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportaciones específicas del contrato de secretos y generadores del registro de destinos para superficies de secretos de canales/plugins no relacionadas con TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Local privada después de julio de 2026; auxiliares específicos de asignación de secretos TTS anidados de canales |
    | `plugin-sdk/secret-ref-runtime` | Tipado, resolución y búsqueda de rutas de destinos de planes específicos de SecretRef para el análisis del contrato de secretos/configuración |
    | `plugin-sdk/security-runtime` | Barrel amplio obsoleto para confianza, control de mensajes directos, auxiliares de archivos/rutas limitados a la raíz —incluidas escrituras de solo creación, sustitución atómica síncrona/asíncrona de archivos, escrituras temporales contiguas, alternativa de movimiento entre dispositivos, auxiliares de almacenes de archivos privados y protecciones de directorios superiores con enlaces simbólicos—, contenido externo, ocultación de texto confidencial, comparación de secretos en tiempo constante y auxiliares de recopilación de secretos; se deben preferir las subrutas específicas de seguridad/SSRF/secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de listas de hosts permitidos y políticas SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Local privada después de julio de 2026; auxiliares específicos de despachadores fijados sin la amplia superficie del entorno de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de despachadores fijados, obtención protegida contra SSRF, errores SSRF y políticas SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entradas de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitudes/destinos de Webhook y conversión de cuerpos/websockets sin procesar |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño/tiempo de espera de cuerpos de solicitudes y `runDetachedWebhookWork` para el procesamiento supervisado posterior a la confirmación |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilidades de entorno de ejecución, registro y copias de seguridad, advertencias sobre rutas de instalación de plugins y utilidades de procesos |
    | `plugin-sdk/runtime-env` | Utilidades específicas de entorno de ejecución, entorno, registro, tiempo de espera, reintentos y espera exponencial |
    | `plugin-sdk/browser-config` | De uso local y privado después de julio de 2026; fachada compatible de configuración del navegador para perfiles y valores predeterminados normalizados, análisis de URL de CDP y utilidades de autenticación del control del navegador |
    | `plugin-sdk/agent-harness-task-runtime` | De uso local y privado después de julio de 2026; utilidades genéricas de ciclo de vida de tareas y entrega de finalización para agentes respaldados por arneses que usan un ámbito de tarea emitido por el host |
    | `plugin-sdk/codex-mcp-projection` | De uso local y privado después de julio de 2026; utilidad reservada del Codex incluido para proyectar la configuración de servidores MCP del usuario en la configuración de hilos de Codex; no destinada a plugins de terceros |
    | `plugin-sdk/codex-native-task-runtime` | Utilidad del Codex incluido, local al repositorio, para el reflejo nativo de tareas y la conexión del entorno de ejecución; no es una exportación de paquete |
    | `plugin-sdk/channel-runtime-context` | Utilidades genéricas de registro y búsqueda del contexto del entorno de ejecución de canales |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidad con Matrix para paquetes de canales de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Módulo de exportación general obsoleto para utilidades de comandos, hooks, HTTP e interacción de plugins; se prefieren las subrutas específicas del entorno de ejecución de plugins |
    | `plugin-sdk/hook-runtime` | Módulo de exportación general obsoleto para utilidades del pipeline de webhooks y hooks internos; se prefieren las subrutas específicas de hooks y del entorno de ejecución de plugins |
    | `plugin-sdk/lazy-runtime` | Utilidades de importación y vinculación diferidas del entorno de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | De uso local y privado después de julio de 2026; utilidades de ejecución de procesos |
    | `plugin-sdk/node-host` | De uso local y privado después de julio de 2026; utilidades de resolución de ejecutables del host Node y reanudación de PTY |
    | `plugin-sdk/cli-runtime` | De uso local y privado después de julio de 2026; módulo de exportación general obsoleto para formato de CLI, espera, versión, invocación de argumentos y utilidades de grupos de comandos diferidos; se prefieren las subrutas específicas de CLI y entorno de ejecución |
    | `plugin-sdk/qa-runner-runtime` | De uso local y privado después de julio de 2026; fachada compatible que expone escenarios de control de calidad de plugins mediante la superficie de comandos de la CLI |
    | `plugin-sdk/tts-runtime` | De uso local y privado después de julio de 2026; fachada compatible para esquemas de configuración de texto a voz y utilidades del entorno de ejecución |
    | `plugin-sdk/gateway-method-runtime` | Utilidad reservada de despacho de métodos del Gateway para rutas HTTP de plugins que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente del Gateway, utilidad de inicio del cliente preparado para el bucle de eventos, RPC de CLI del Gateway, errores del protocolo del Gateway, resolución del host LAN anunciado y utilidades de parches del estado de canales |
    | `plugin-sdk/config-contracts` | Superficie de configuración específica y solo de tipos para estructuras de configuración de plugins, como `OpenClawConfig`, y tipos de configuración de canales y proveedores |
    | `plugin-sdk/plugin-config-runtime` | Fachada de compatibilidad obsoleta para utilidades de configuración de plugins del entorno de ejecución; los plugins nuevos usan `api.pluginConfig`, junto con contratos de configuración, instantáneas y utilidades de modificación específicos |
    | `plugin-sdk/config-mutation` | Utilidades de modificación transaccional de la configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | De uso local y privado después de julio de 2026; cadenas de sugerencias compartidas de metadatos de entrega de herramientas de mensajes |
    | `plugin-sdk/runtime-config-snapshot` | Utilidades de instantáneas de la configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y definidores de instantáneas de prueba |
    | `plugin-sdk/text-autolink-runtime` | De uso local y privado después de julio de 2026; detección de enlaces automáticos de referencias a archivos sin el módulo de exportación general de texto |
    | `plugin-sdk/reply-runtime` | Utilidades compartidas del entorno de ejecución para entradas y respuestas, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de despacho y finalización de respuestas y de etiquetas de conversaciones |
    | `plugin-sdk/reply-history` | Utilidades compartidas del historial de respuestas de ventana corta. El código nuevo de turnos de mensajes debe usar `createChannelHistoryWindow`; las utilidades de mapas de nivel inferior solo permanecen como exportaciones de compatibilidad obsoletas |
    | `plugin-sdk/reply-reference` | De uso local y privado después de julio de 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilidades específicas de fragmentación de texto y Markdown |
    | `plugin-sdk/session-store-runtime` | Utilidades de flujo de trabajo de sesiones (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), utilidades de reparación y ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), utilidades de marcadores para valores transitorios de `sessionFile`, lecturas acotadas del texto reciente de transcripciones de usuario y asistente según la identidad de sesión, utilidades de rutas del almacén de sesiones y claves de sesión, y lecturas de la fecha de actualización, sin importaciones generales de escritura o mantenimiento de la configuración |
    | `plugin-sdk/session-transcript-runtime` | De uso local y privado después de julio de 2026; identidad de transcripciones, cursores sin procesar y visibles acotados, utilidades de destino, lectura y escritura con ámbito, proyección de entradas de mensajes visibles, publicación de actualizaciones, bloqueos de escritura y claves de aciertos de memoria de transcripciones |
    | `plugin-sdk/sqlite-runtime` | De uso local y privado después de julio de 2026; utilidades específicas de esquema, rutas y transacciones de agentes en SQLite para el entorno de ejecución propio, sin controles del ciclo de vida de la base de datos |
    | `plugin-sdk/cron-store-runtime` | De uso local y privado después de julio de 2026; utilidades de rutas, carga y guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Utilidades de rutas de directorios de estado y OAuth |
    | `plugin-sdk/plugin-state-runtime` | De uso local y privado después de julio de 2026; contratos de estado con claves, BLOB y concesiones cooperativas de SQLite con ámbito de plugin, además de pragma de conexión, mantenimiento verificado de WAL y utilidades de migración atómica de esquemas STRICT. Las devoluciones de llamada de concesiones reciben una señal de cancelación y los errores tipados distinguen entre tiempo de espera agotado, cancelación, pérdida de propiedad, entrada no válida y fallo de almacenamiento |
    | `plugin-sdk/routing` | Utilidades de vinculación de rutas, claves de sesión y cuentas, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilidades compartidas de resumen del estado de canales y cuentas, valores predeterminados del estado del entorno de ejecución y utilidades de metadatos de problemas |
    | `plugin-sdk/target-resolver-runtime` | De uso local y privado después de julio de 2026; utilidades compartidas de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | De uso local y privado después de julio de 2026; utilidades de normalización de slugs y cadenas |
    | `plugin-sdk/request-url` | De uso local y privado después de julio de 2026; extracción de URL de cadena desde entradas similares a fetch o solicitudes |
    | `plugin-sdk/run-command` | Ejecutor temporizado de comandos con resultados normalizados de stdout y stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas y CLI |
    | `plugin-sdk/tool-plugin` | Define un plugin sencillo y tipado de herramientas de agente y expone metadatos estáticos para la generación de manifiestos |
    | `plugin-sdk/tool-payload` | De uso local y privado después de julio de 2026; extracción de cargas normalizadas desde objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extracción de campos canónicos de destino de envío desde argumentos de herramientas |
    | `plugin-sdk/sandbox` | De uso local y privado después de julio de 2026; tipos de backend de sandbox y utilidades de comandos SSH/OpenShell, incluida la comprobación preliminar de comandos de ejecución con interrupción inmediata |
    | `plugin-sdk/temp-path` | Utilidades compartidas de rutas de descargas temporales y espacios de trabajo temporales privados y seguros |
    | `plugin-sdk/logging-core` | Utilidades de registro y censura de subsistemas |
    | `plugin-sdk/markdown-table-runtime` | De uso local y privado después de julio de 2026; utilidades de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Utilidades de anulación de modelos y sesiones, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | De uso local y privado después de julio de 2026; utilidades de resolución de la configuración del proveedor de conversación |
    | `plugin-sdk/json-store` | Pequeñas utilidades de lectura y escritura de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | De uso local y privado después de julio de 2026; utilidades de análisis de JSON que conservan como cadenas los literales enteros no seguros |
    | `plugin-sdk/file-lock` | De uso local y privado después de julio de 2026; utilidades reentrantes de bloqueo de archivos, además de recuperación segura para Doctor de archivos auxiliares de bloqueo retirados que estén definitivamente obsoletos y sin cambios |
    | `plugin-sdk/persistent-dedupe` | Utilidades de caché de desduplicación respaldada por disco |
    | `plugin-sdk/ingress-effect-once` | Protección duradera de reclamación y confirmación para efectos secundarios de entrada no idempotentes |
    | `plugin-sdk/acp-runtime` | De uso local y privado después de julio de 2026; utilidades de sesiones, entorno de ejecución y despacho de respuestas de ACP |
    | `plugin-sdk/acp-runtime-backend` | De uso local y privado después de julio de 2026; utilidades ligeras de registro de backends y despacho de respuestas de ACP para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | De uso local y privado después de julio de 2026; resolución de vinculaciones de ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas del esquema de configuración del entorno de ejecución de agentes; importe las primitivas del esquema desde una superficie mantenida y propiedad del plugin |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | De uso local y privado después de julio de 2026; utilidades de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Utilidades de arranque de dispositivos y tokens de emparejamiento, incluida `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas de utilidades compartidas para canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Utilidades de respuestas de comandos y proveedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilidades de enumeración de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Utilidades de registro, compilación y serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental para plugins de confianza destinada a arneses de agentes de bajo nivel: tipos de arnés, utilidades de orientación y cancelación de ejecuciones activas, utilidades del puente de herramientas de OpenClaw, utilidades de políticas de herramientas del plan del entorno de ejecución, clasificación de resultados del terminal, utilidades de formato y detalle del progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/async-lock-runtime` | De uso local y privado después de julio de 2026; utilidad de bloqueo asíncrono local al proceso para archivos pequeños de estado del entorno de ejecución |
    | `plugin-sdk/channel-activity-runtime` | De uso local y privado después de julio de 2026; utilidad de telemetría de actividad de canales |
    | `plugin-sdk/concurrency-runtime` | De uso local y privado después de julio de 2026; utilidad de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Utilidades de caché de desduplicación en memoria y con respaldo persistente |
    | `plugin-sdk/delivery-queue-runtime` | De uso local y privado después de julio de 2026; utilidad de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | De uso local y privado después de julio de 2026; utilidades seguras de rutas de archivos locales y fuentes multimedia |
    | `plugin-sdk/heartbeat-runtime` | De uso local y privado después de julio de 2026; utilidades de activación, eventos y visibilidad de Heartbeat |
    | `plugin-sdk/expect-runtime` | De uso local y privado después de julio de 2026; utilidad de aserción de valores obligatorios para invariantes demostrables del entorno de ejecución |
    | `plugin-sdk/number-runtime` | De uso local y privado después de julio de 2026; utilidad de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | De uso local y privado después de julio de 2026; utilidades seguras de tokens y UUID |
    | `plugin-sdk/system-event-runtime` | De uso local y privado después de julio de 2026; utilidades de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | De uso local y privado después de julio de 2026; utilidad de espera de disponibilidad del transporte |
    | `plugin-sdk/exec-approvals-runtime` | De uso local y privado después de julio de 2026; utilidades de archivos de políticas de aprobación de ejecución sin el módulo de exportación general del entorno de ejecución de infraestructura |
    | `plugin-sdk/infra-runtime` | Capa de compatibilidad obsoleta; use las subrutas específicas del entorno de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Pequeñas utilidades de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Utilidades de indicadores de diagnóstico, eventos y contexto de seguimiento |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, utilidades compartidas de clasificación de errores, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | De uso local y privado después de julio de 2026; utilidades de fetch encapsulado, proxy, opciones de EnvHttpProxyAgent y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | De uso local y privado después de julio de 2026; fetch del entorno de ejecución compatible con el despachador, sin importaciones de proxy ni fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | De uso local y privado después de julio de 2026; utilidades de saneamiento de URL de datos de imágenes en línea y detección de firmas, sin la superficie general del entorno de ejecución multimedia |
    | `plugin-sdk/response-limit-runtime` | De uso local y privado después de julio de 2026; lectores de cuerpos de respuesta acotados por bytes, inactividad y plazo, sin la superficie general del entorno de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | De uso local y privado después de julio de 2026; estado de vinculación de la conversación actual, sin enrutamiento de vinculaciones configurado ni almacenes de emparejamiento |
    | `plugin-sdk/context-visibility-runtime` | De uso local y privado después de julio de 2026; resolución de la visibilidad del contexto y filtrado de contexto complementario, sin importaciones generales de configuración o seguridad |
    | `plugin-sdk/string-coerce-runtime` | Utilidades específicas y primitivas de coerción y normalización de registros y cadenas, sin importaciones de Markdown o registro |
    | `plugin-sdk/html-entity-runtime` | De uso local y privado después de julio de 2026; decodificación en una sola pasada de entidades HTML5 terminadas en punto y coma, sin utilidades generales de texto |
    | `plugin-sdk/text-utility-runtime` | Privado y local después de julio de 2026; utilidades de bajo nivel para texto y rutas, incluido el escape de cinco entidades HTML |
    | `plugin-sdk/widget-html` | Detección de documentos completos, validación de tamaño y errores de entrada de herramientas para widgets HTML autocontenidos |
    | `plugin-sdk/host-runtime` | Privado y local después de julio de 2026; utilidades de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Privado y local después de julio de 2026; utilidades de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Barrel amplio obsoleto para utilidades de directorio, identidad y espacio de trabajo de agentes, incluidos `resolveAgentDir`, `resolveDefaultAgentDir` y la exportación de compatibilidad obsoleta `resolveOpenClawAgentDir`; se prefieren las subrutas específicas de agente y entorno de ejecución |
    | `plugin-sdk/directory-runtime` | Consulta y deduplicación de directorios respaldadas por la configuración |
    | `plugin-sdk/keyed-async-queue` | Privado y local después de julio de 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplio de medios obsoleto que incluye `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` y el obsoleto `fetchRemoteMedia`; se prefieren `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` y las subrutas del entorno de ejecución de capacidades, así como los auxiliares de almacenamiento antes de leer búferes cuando una URL deba convertirse en contenido multimedia de OpenClaw |
    | `plugin-sdk/media-mime` | Normalización específica de MIME, asignación de extensiones de archivo, detección de MIME y auxiliares de tipos de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos del almacén de medios, como `saveMediaBuffer` y `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Local privado después de julio de 2026; auxiliares compartidos para la conmutación por error en la generación de medios, la selección de candidatos y los mensajes sobre modelos ausentes |
    | `plugin-sdk/media-understanding` | Fachada de compatibilidad obsoleta para tipos y auxiliares de proveedores de comprensión de medios; los proveedores nuevos se registran mediante la API de plugins inyectada y mantienen los auxiliares de solicitudes bajo la propiedad del plugin |
    | `plugin-sdk/text-chunking` | Fragmentación de texto saliente y de intervalos que conserva los desplazamientos, auxiliares de fragmentación y renderizado de Markdown, tokenización de etiquetas HTML con reconocimiento de citas, conversión de tablas Markdown, eliminación de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/speech` | Local privado después de julio de 2026; tipos de proveedores de voz y exportaciones orientadas a proveedores para directivas, registro, validación, constructor de TTS compatible con OpenAI y auxiliares de voz |
    | `plugin-sdk/speech-core` | Local privado después de julio de 2026; tipos compartidos de proveedores de voz y exportaciones de registro, directivas, normalización y auxiliares de voz |
    | `plugin-sdk/speech-settings` | Primitivas ligeras de resolución y normalización de la configuración de TTS sin registros de proveedores ni entorno de ejecución de síntesis |
    | `plugin-sdk/realtime-transcription` | Local privado después de julio de 2026; tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesiones WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Local privado después de julio de 2026; auxiliar de inicialización de perfiles en tiempo real para la inyección limitada de contexto de `IDENTITY.md`, `USER.md` y `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Local privado después de julio de 2026; tipos de proveedores de voz en tiempo real, auxiliares de registro, compuertas compartidas de energía de audio e inicio del habla y auxiliares de comportamiento de voz en tiempo real, incluido el arnés de sesiones independiente del transporte y el seguimiento de la actividad de salida |
    | `plugin-sdk/meeting-runtime` | Entorno de ejecución de sesiones de reuniones en el navegador, motores y transportes de audio en tiempo real, `MeetingPlatformAdapter`, control de navegador/Node, consulta al agente, delegación de llamadas de voz, comprobaciones de configuración y auxiliares de comandos de SoX |
    | `plugin-sdk/image-generation` | Local privado después de julio de 2026; tipos de proveedores de generación de imágenes, auxiliares de recursos de imagen y URL de datos y constructor de proveedores de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Local privado después de julio de 2026; tipos compartidos de generación de imágenes y auxiliares de conmutación por error, autenticación y registro |
    | `plugin-sdk/music-generation` | Local privado después de julio de 2026; tipos de proveedor, solicitud y resultado de generación de música |
    | `plugin-sdk/video-generation` | Local privado después de julio de 2026; tipos de proveedor, solicitud y resultado de generación de vídeo |
    | `plugin-sdk/video-generation-core` | Local privado después de julio de 2026; tipos compartidos de generación de vídeo, auxiliares de conmutación por error, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/transcripts` | Local privado después de julio de 2026; tipos compartidos de proveedores de fuentes de transcripciones, auxiliares de registro, descriptores de sesiones y metadatos de intervenciones |
    | `plugin-sdk/webhook-targets` | Local privado después de julio de 2026; registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/web-media` | Auxiliares compartidos para cargar medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importe `zod` directamente desde `zod` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi`, local al repositorio, para pruebas unitarias de registro directo de plugins sin importar puentes de auxiliares de pruebas del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locales al repositorio de contratos de adaptadores nativos del entorno de ejecución de agentes para pruebas de autenticación, entrega, reserva, hooks de herramientas, superposición de prompts, esquemas y proyección de transcripciones |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de pruebas orientados a canales y locales al repositorio para contratos genéricos de acciones/configuración/estado, aserciones de directorios, ciclo de vida del inicio de cuentas, propagación de la configuración de envío, simulaciones del entorno de ejecución, problemas de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Conjunto compartido y local al repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/channel-contract-testing` | Auxiliares específicos y locales al repositorio para pruebas de contratos de canales sin el barrel amplio de pruebas |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locales al repositorio para contratos de paquetes de plugins, registro, artefactos públicos, importación directa, API del entorno de ejecución y efectos secundarios de importación |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locales al repositorio para pruebas del almacén de estado de plugins, la cola de entrada y la base de datos de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locales al repositorio para contratos del entorno de ejecución de proveedores, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidades multimedia, política de repetición, audio en directo de STT en tiempo real, búsqueda/obtención web y transmisión |
    | `plugin-sdk/provider-http-test-mocks` | Local privado después de julio de 2026; simulaciones HTTP/de autenticación opcionales de Vitest, locales al repositorio, para pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locales al repositorio para adjuntar metadatos a fixtures de cargas útiles de respuesta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locales al repositorio para el ciclo de vida de SQLite en pruebas propias |
    | `plugin-sdk/test-fixtures` | Fixtures locales al repositorio para captura genérica del entorno de ejecución de la CLI, contexto de sandbox, escritor de Skills, mensajes de agentes, eventos del sistema, recarga de módulos, rutas de plugins incluidos, texto de terminal, fragmentación, tokens de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares específicos y locales al repositorio para simular elementos integrados de Node dentro de fábricas `vi.mock("node:*")` de Vitest |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones principales |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Local privado después de julio de 2026; auxiliares ligeros del registro de proveedores de incrustaciones de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Local privado después de julio de 2026; contratos de incrustaciones del host de memoria, acceso al registro, proveedor local y auxiliares genéricos remotos/por lotes. `registerMemoryEmbeddingProvider` está obsoleto en esta superficie; use la API genérica de proveedores de incrustaciones para proveedores nuevos. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Local privado después de julio de 2026; exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Local privado después de julio de 2026; exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Local privado después de julio de 2026; auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Local privado después de julio de 2026; auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Local privado después de julio de 2026; auxiliares del entorno de ejecución de la CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Local privado después de julio de 2026; auxiliares principales del entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Local privado después de julio de 2026; auxiliares de archivos/entorno de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Fachada de compatibilidad obsoleta para auxiliares del host de memoria independientes del proveedor. Los plugins de memoria nuevos usan capacidades de memoria inyectadas y prompts preparados por el host; los plugins complementarios siguen usando la fachada conservada para descubrir artefactos públicos hasta que exista una interfaz de lectura específica. |
    | `plugin-sdk/memory-host-events` | Local privado después de julio de 2026; alias independiente del proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Local privado después de julio de 2026; auxiliares compartidos de Markdown gestionado para plugins relacionados con la memoria |
    | `plugin-sdk/memory-host-search` | Local privado después de julio de 2026; fachada del entorno de ejecución de Active Memory para acceder al gestor de búsquedas |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares incluidos">
    Las subrutas reservadas del SDK para auxiliares incluidos son superficies específicas y limitadas de sus propietarios destinadas al
    código de plugins incluidos. Se registran en el inventario del SDK para que las compilaciones de
    paquetes y los alias sigan siendo deterministas, pero no son API generales para
    crear plugins. Los contratos reutilizables nuevos del host deben usar subrutas genéricas del SDK,
    como `plugin-sdk/gateway-runtime` y `plugin-sdk/ssrf-runtime`.

    | Subruta | Propietario y finalidad |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Local privado después de julio de 2026; auxiliar del plugin Codex incluido para proyectar la configuración de servidores MCP del usuario en la configuración de hilos del servidor de aplicaciones de Codex (exportación reservada del paquete) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar del plugin Codex incluido para reflejar los subagentes nativos del servidor de aplicaciones de Codex en el estado de tareas de OpenClaw (solo local al repositorio, no es una exportación del paquete) |

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
