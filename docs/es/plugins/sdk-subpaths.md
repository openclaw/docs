---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de Plugin
    - Auditoría de subrutas de Plugin incluido y superficies auxiliares
summary: 'Catálogo de subrutas del SDK de Plugin: dónde se ubica cada importación, agrupado por área'
title: Subrutas del SDK de Plugin
x-i18n:
    generated_at: "2026-05-11T20:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

El SDK de Plugin se expone como un conjunto de subrutas públicas estrechas bajo
`openclaw/plugin-sdk/`. Esta página cataloga las subrutas de uso común agrupadas por
propósito. El inventario generado de puntos de entrada del compilador reside en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete son el subconjunto público
después de restar las subrutas locales del repositorio para pruebas/internas listadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Los mantenedores pueden auditar
el recuento de exportaciones públicas con `pnpm plugin-sdk:surface` y las subrutas auxiliares
reservadas activas con `pnpm plugins:boundary-report:summary`; las exportaciones auxiliares
reservadas sin uso hacen fallar el informe de CI en lugar de permanecer en el SDK público como
deuda de compatibilidad inactiva.

Para la guía de creación de plugins, consulta [Descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Entrada de Plugin

| Subruta                        | Exportaciones clave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de elementos del proveedor de migración como `createMigrationItem`, constantes de motivo, marcadores de estado de elemento, auxiliares de redacción y `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Auxiliares de migración en tiempo de ejecución como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` y `writeMigrationReport`                                              |

### Compatibilidad y auxiliares de prueba obsoletos

Estas subrutas siguen siendo exportaciones del paquete para plugins antiguos y suites de pruebas de OpenClaw,
pero el código nuevo no debe añadir importaciones desde ellas: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` y `zod`. Importa `zod` directamente desde `zod` en el código nuevo de plugins.
`plugin-test-runtime` sigue siendo una subruta auxiliar de prueba enfocada y activa.

### Subrutas públicas obsoletas sin uso

Estas subrutas públicas existieron durante al menos un mes y actualmente no tienen
importaciones de producción de extensiones incluidas. Siguen siendo importables por compatibilidad,
pero el código nuevo de plugins debe usar subrutas del SDK enfocadas y consumidas activamente en su lugar:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` y `zalouser`.

### Subrutas públicas obsoletas de uso poco frecuente

Las subrutas públicas utilizadas actualmente por solo uno o dos propietarios de plugins incluidos también
están obsoletas para el código nuevo de plugins. Siguen siendo exportaciones del paquete por compatibilidad,
pero el código nuevo debe preferir puntos de integración del SDK compartidos activamente o APIs de paquetes
propiedad del plugin. Los mantenedores rastrean el conjunto exacto en
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` y el presupuesto actual
con `pnpm plugin-sdk:surface`.

### Barrels amplios obsoletos

Estos barrels amplios de reexportación siguen siendo compilables para el código fuente de OpenClaw y
las comprobaciones de compatibilidad, pero el código nuevo debe preferir subrutas enfocadas del SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` y
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
y `text-runtime` siguen siendo exportaciones del paquete solo por compatibilidad con versiones anteriores; usa
subrutas enfocadas de canal/tiempo de ejecución, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` y `logging-core` en su lugar.

  <AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper de validación de JSON Schema en caché para esquemas propiedad del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, más `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de allowlist, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración y puertas de acción multi-cuenta, helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de id de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta + fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers acotados de lista de cuentas/acción de cuenta |
    | `plugin-sdk/access-groups` | Helpers de análisis de allowlist de grupos de acceso y diagnósticos de grupo redactados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helpers heredados de pipeline de respuesta. El código nuevo de pipeline de respuesta de canal debe usar `createChannelMessageReplyPipeline` y `resolveChannelMessageSourceReplyDeliveryMode` desde `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartidas de esquema de configuración de canal, más constructores Zod y JSON/TypeBox directos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuración de canal incluidos de OpenClaw solo para plugins incluidos mantenidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidad obsoleto para esquemas de configuración de canales incluidos |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato incluido |
    | `plugin-sdk/command-gating` | Helpers acotados de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidad de entrada de canal de bajo nivel. Las rutas nuevas de recepción deben usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor runtime experimental de entrada de canal de alto nivel y constructores de hechos de ruta para rutas migradas de recepción de canal. Prefiere esto en lugar de ensamblar allowlists efectivas, allowlists de comandos y proyecciones heredadas en cada plugin. Consulta [API de entrada de canal](/es/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` y helpers heredados del ciclo de vida de flujos de borrador. El código nuevo de finalización de vistas previas debe usar `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helpers económicos del contrato de ciclo de vida de mensajes, como `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivación de capacidad durable-final, helpers de prueba de capacidad para capacidades de envío/recibo/efecto secundario, `MessageReceiveContext`, pruebas de política de ack de recepción, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, pruebas de capacidad de vista previa en vivo y finalizador en vivo, estado de recuperación durable, `RenderedMessageBatch`, tipos de recibo de mensaje y helpers de id de recibo. Consulta [API de mensajes de canal](/es/plugins/sdk-channel-message). Las fachadas heredadas de despacho de respuestas son solo compatibilidad obsoleta. |
    | `plugin-sdk/channel-message-runtime` | Helpers de entrega runtime que pueden cargar la entrega saliente, incluidos `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` y `withDurableMessageSendContext`. Los puentes obsoletos de despacho de respuestas siguen siendo importables solo para despachadores de compatibilidad. Úsalo desde módulos runtime de monitor/envío, no desde archivos activos de arranque de plugin. |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante + constructores de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers heredados compartidos de registrar y despachar entradas entrantes, predicados de despacho visible/final y compatibilidad obsoleta `deliverDurableInboundReplyPayload` para despachadores de canal preparados. El código nuevo de recepción/despacho de canal debe importar helpers runtime de ciclo de vida desde `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-send-deps` | Búsqueda ligera de dependencias de envío saliente para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de identidad saliente, delegado de envío, sesión, formato y planificación de payload. Los helpers de entrega directa como `deliverOutboundPayloads` son sustrato de compatibilidad obsoleto; usa `plugin-sdk/channel-message-runtime` para rutas de envío nuevas. |
    | `plugin-sdk/poll-runtime` | Helpers acotados de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida de vinculaciones de hilo y adaptadores |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload multimedia de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de vinculación de conversación/hilo, emparejamiento y vinculaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución runtime de políticas de grupo |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas acotadas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones compartidas de preámbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de allowlist |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso de grupo |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autorización/guardas de DM directo |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidad de Discord para `@openclaw/discord@2026.3.13` publicado y compatibilidad rastreada del propietario; los plugins nuevos deben usar subrutas genéricas del SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidad de resolución de cuentas de Telegram para compatibilidad rastreada del propietario; los plugins nuevos deben usar helpers runtime inyectados o subrutas genéricas del SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidad de Zalo Personal para paquetes Lark/Zalo publicados que todavía importan autorización de comandos de remitente; los plugins nuevos deben usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y helpers heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, helpers de política de menciones y helpers de sobre |
    | `plugin-sdk/channel-inbound-debounce` | Helpers acotados de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Helpers acotados de política de menciones, marcador de mención y texto de mención sin la superficie runtime entrante más amplia |
    | `plugin-sdk/channel-envelope` | Helpers acotados de formato de sobre entrante |
    | `plugin-sdk/channel-location` | Helpers de contexto y formato de ubicación de canal |
    | `plugin-sdk/channel-logging` | Helpers de registro de canal para descartes entrantes y fallos de escritura/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Helpers de acciones de mensaje de canal, más helpers obsoletos de esquema nativo conservados para compatibilidad de plugins |
    | `plugin-sdk/channel-route` | Helpers compartidos de normalización de rutas, resolución de destinos guiada por analizador, conversión de id de hilo a string, claves de ruta de deduplicación/compactación, tipos de destino analizado y comparación de ruta/destino |
    | `plugin-sdk/channel-targets` | Helpers de análisis de destino; los llamadores de comparación de rutas deben usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de contrato de secretos, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de proveedor LM Studio compatible para configuración, descubrimiento de catálogo y preparación de modelos en tiempo de ejecución |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tiempo de ejecución LM Studio compatible para valores predeterminados del servidor local, descubrimiento de modelos, encabezados de solicitud y ayudantes de modelos cargados |
    | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados de configuración de proveedores autoalojados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Ayudantes de resolución de claves de API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Ayudantes de incorporación/escritura de perfiles de clave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-env-vars` | Ayudantes de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, exportación de compatibilidad obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, ayudantes de endpoints de proveedor y ayudantes compartidos de normalización de id. de modelo |
    | `plugin-sdk/provider-catalog-runtime` | Hook de tiempo de ejecución para ampliación del catálogo de proveedor y seams de registro plugin-proveedor para pruebas de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ayudantes genéricos de capacidades HTTP/endpoint de proveedor, errores HTTP de proveedor y ayudantes de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Ayudantes específicos de contrato de configuración/selección de web-fetch, como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Ayudantes de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Ayudantes específicos de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Ayudantes específicos de contrato de configuración/credenciales de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Ayudantes de registro/caché/tiempo de ejecución de proveedores web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, y limpieza + diagnósticos de esquemas de Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream y ayudantes compartidos de envoltorios Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte nativo de proveedores, como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Ayudantes de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Ayudantes de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Ayudantes específicos de modo de activación de grupo y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ayudantes de registro de comandos que incluyen formato dinámico de menús de argumentos, ayudantes de autorización de remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda, como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Ayudantes de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Ayudantes de perfil/filtro de aprobación de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Ayudante compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes ligeros de carga de adaptadores nativos de aprobación para entrypoints de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Ayudantes más amplios de tiempo de ejecución de manejadores de aprobación; prefiere los seams más específicos de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Ayudantes nativos de destino de aprobación + vinculación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Ayudantes de payload de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/approval-runtime` | Ayudantes de payload de aprobación de exec/plugin, ayudantes nativos de enrutamiento/tiempo de ejecución de aprobación y ayudantes de visualización estructurada de aprobación, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Ayudantes específicos de restablecimiento de deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Ayudantes específicos de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico de menús de argumentos y ayudantes nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Ayudantes compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas activas de canal |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y ayudantes de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes específicos de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Ayudantes específicos de `coerceSecretRef` y tipado de SecretRef para análisis de contrato de secretos/configuración |
    | `plugin-sdk/security-runtime` | Ayudantes compartidos de confianza, bloqueo de DM, archivos/rutas acotados a la raíz, incluidas escrituras solo de creación, reemplazo atómico de archivos síncrono/asíncrono, escrituras temporales hermanas, alternativa para movimientos entre dispositivos, ayudantes de almacén de archivos privados, guardas de padres de symlinks, contenido externo, redacción de texto confidencial, comparación de secretos en tiempo constante y ayudantes de recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Ayudantes de lista de hosts permitidos y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Ayudantes específicos de dispatcher fijado sin la superficie amplia de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Ayudantes de dispatcher fijado, fetch protegido contra SSRF, error SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Ayudantes de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Ayudantes de solicitud/destino de Webhook y coerción de websocket/cuerpo sin procesar |
    | `plugin-sdk/webhook-request-guards` | Ayudantes de tamaño/timeout del cuerpo de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ayudantes amplios de tiempo de ejecución, registro, respaldo e instalación de plugins |
    | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y espera exponencial |
    | `plugin-sdk/browser-config` | Fachada de configuración de navegador admitida para perfil/valores predeterminados normalizados, análisis de URL CDP y ayudantes de autenticación de control del navegador |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidad con Matrix obsoleta para paquetes de canal de terceros antiguos; los plugins nuevos deben importar `plugin-sdk/run-command` directamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidad con Mattermost obsoleta para paquetes de canal de terceros antiguos; los plugins nuevos deben importar subrutas genéricas del SDK directamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de comandos, hooks, HTTP e interactividad de plugins |
    | `plugin-sdk/hook-runtime` | Ayudantes compartidos para la canalización de webhooks/hooks internos |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación/vinculación diferida de tiempo de ejecución, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Ayudantes de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, ayudante de inicio de cliente listo para bucle de eventos, RPC de CLI de gateway, errores de protocolo de gateway y ayudantes de parches de estado de canal |
    | `plugin-sdk/config-contracts` | Superficie de configuración enfocada y solo de tipos para formas de configuración de plugins, como `OpenClawConfig` y tipos de configuración de canal/proveedor |
    | `plugin-sdk/plugin-config-runtime` | Ayudantes de búsqueda de configuración de plugins en tiempo de ejecución, como `requireRuntimeConfig`, `resolvePluginConfigObject` y `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Ayudantes de mutación transaccional de configuración, como `mutateConfigFile`, `replaceConfigFile` y `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Ayudantes de instantánea de configuración del proceso actual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` y establecedores de instantáneas de prueba |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram incluida no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autovínculos de referencias a archivos sin el barrel amplio de texto |
    | `plugin-sdk/approval-runtime` | Ayudantes de aprobación de ejecución/plugin, constructores de capacidades de aprobación, ayudantes de autenticación/perfil, ayudantes de enrutamiento/tiempo de ejecución nativos y formato de ruta de visualización de aprobación estructurada |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos de tiempo de ejecución de entrada/respuesta, fragmentación, despacho, heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho/finalización de respuestas y etiquetas de conversación |
    | `plugin-sdk/reply-history` | Ayudantes y marcadores compartidos de historial de respuestas de ventana corta, como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes de ruta de almacén de sesiones, clave de sesión, fecha de actualización y mutación de almacén |
    | `plugin-sdk/cron-store-runtime` | Ayudantes de ruta/carga/guardado del almacén de Cron |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Ayudantes de ruta, clave de sesión y vinculación de cuenta, como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena desde entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con límite de tiempo y resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío desde argumentos de herramienta |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas de descarga temporal y espacios de trabajo temporales privados seguros |
    | `plugin-sdk/logging-core` | Ayudantes de registrador de subsistema y censura |
    | `plugin-sdk/markdown-table-runtime` | Ayudantes de modo y conversión de tablas Markdown |
    | `plugin-sdk/model-session-runtime` | Ayudantes de sobrescritura de modelo/sesión, como `applyModelOverrideToSessionEntry` y `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Ayudantes de resolución de configuración de proveedores de Talk |
    | `plugin-sdk/json-store` | Ayudantes pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de deduplicación respaldada en disco |
    | `plugin-sdk/acp-runtime` | Ayudantes de tiempo de ejecución/sesión de ACP y despacho de respuestas |
    | `plugin-sdk/acp-runtime-backend` | Ayudantes ligeros de registro de backend ACP y despacho de respuestas para plugins cargados al inicio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculación ACP de solo lectura sin importaciones de inicio de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de esquema de configuración de tiempo de ejecución de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de inicialización de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de ayudantes de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuesta de comando/proveedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para arneses de agente de bajo nivel: tipos de arnés, ayudantes de dirección/aborto de ejecución activa, ayudantes de puente de herramientas de OpenClaw, ayudantes de política de herramientas de plan de tiempo de ejecución, clasificación de resultados de terminal, ayudantes de formato/detalle de progreso de herramientas y utilidades de resultado de intento |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detección de endpoints propiedad del proveedor Z.AI; usa la API pública del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Ayudante de bloqueo asíncrono local al proceso para archivos pequeños de estado de tiempo de ejecución |
    | `plugin-sdk/channel-activity-runtime` | Ayudante de telemetría de actividad de canal |
    | `plugin-sdk/concurrency-runtime` | Ayudante de concurrencia acotada de tareas asíncronas |
    | `plugin-sdk/dedupe-runtime` | Ayudantes de caché de deduplicación en memoria |
    | `plugin-sdk/delivery-queue-runtime` | Ayudante de vaciado de entregas salientes pendientes |
    | `plugin-sdk/file-access-runtime` | Ayudantes de rutas seguras de archivo local y fuente multimedia |
    | `plugin-sdk/heartbeat-runtime` | Ayudantes de activación, evento y visibilidad de Heartbeat |
    | `plugin-sdk/number-runtime` | Ayudante de coerción numérica |
    | `plugin-sdk/secure-random-runtime` | Ayudantes de tokens/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Ayudantes de cola de eventos del sistema |
    | `plugin-sdk/transport-ready-runtime` | Ayudante de espera de disponibilidad de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidad obsoleto; usa las subrutas enfocadas de tiempo de ejecución anteriores |
    | `plugin-sdk/collection-runtime` | Ayudantes de caché pequeña acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de bandera de diagnóstico, evento y contexto de traza |
    | `plugin-sdk/error-runtime` | Ayudantes de grafo de errores, formato y clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch envuelto, proxy, opción EnvHttpProxyAgent y ayudantes de búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del despachador sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpo de respuesta sin la superficie amplia de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculación configurado ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones sin importaciones amplias de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Ayudantes específicos de coerción y normalización de cadenas/registros primitivos sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de nombre de host y host SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Ayudantes de directorio/identidad/espacio de trabajo de agente, incluidas las exportaciones de compatibilidad `resolveAgentDir`, `resolveDefaultAgentDir` y la obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener, transformar y almacenar medios, sondeo de dimensiones de video respaldado por ffprobe y constructores de cargas útiles de medios |
    | `plugin-sdk/media-mime` | Normalización limitada de MIME, asignación de extensiones de archivo, detección de MIME y helpers de tipo de medio |
    | `plugin-sdk/media-store` | Helpers limitados de almacenamiento de medios, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de conmutación por error para generación de medios, selección de candidatos y mensajería de modelos faltantes |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios, además de exportaciones de helpers orientadas a proveedores para imagen/audio/extracción estructurada |
    | `plugin-sdk/text-chunking` | Helpers de fragmentación/renderizado de texto y markdown, conversión de tablas markdown, eliminación de etiquetas de directiva y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz, además de exportaciones orientadas a proveedores para directivas, registro, validación, constructor TTS compatible con OpenAI y helpers de voz |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva, normalización y exportaciones de helpers de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, helpers de registro y helper compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes, además de helpers de recursos de imagen/URL de datos y el constructor de proveedor de imágenes compatible con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, conmutación por error, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de conmutación por error, búsqueda de proveedores y análisis de referencias de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidad obsoleto; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | Reexportación de compatibilidad obsoleta; importa `zod` desde `zod` directamente |
    | `plugin-sdk/testing` | Módulo de reexportación de compatibilidad obsoleto y local del repositorio para pruebas heredadas de OpenClaw. Las nuevas pruebas del repositorio deberían importar subrutas de prueba locales enfocadas, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo local del repositorio `createTestPluginApi` para pruebas unitarias de registro directo de Plugin sin importar puentes de helpers de prueba del repositorio |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locales del repositorio para contratos de adaptador nativo de runtime de agente para pruebas de autenticación, entrega, reserva, hook de herramientas, superposición de prompts, esquema y proyección de transcripción |
    | `plugin-sdk/channel-test-helpers` | Helpers de prueba locales del repositorio orientados a canales para contratos genéricos de acciones/configuración/estado, aserciones de directorio, ciclo de vida de inicio de cuenta, encadenamiento de configuración de envío, mocks de runtime, incidencias de estado, entrega saliente y registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suite compartida local del repositorio de casos de error de resolución de destinos para pruebas de canales |
    | `plugin-sdk/plugin-test-contracts` | Helpers locales del repositorio para contratos de paquete de Plugin, registro, artefacto público, importación directa, API de runtime y efectos secundarios de importación |
    | `plugin-sdk/provider-test-contracts` | Helpers locales del repositorio para contratos de runtime de proveedor, autenticación, descubrimiento, incorporación, catálogo, asistente, capacidad de medios, política de reproducción, audio en vivo STT en tiempo real, búsqueda/obtención web y flujo |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticación opcionales locales del repositorio para Vitest en pruebas de proveedores que ejercitan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos locales del repositorio para captura de runtime CLI, contexto de sandbox, escritor de Skills, mensaje de agente, evento del sistema, recarga de módulo, ruta de Plugin incluido, texto de terminal, fragmentación, token de autenticación y casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers enfocados locales del repositorio para mocks de componentes integrados de Node, para usar dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie de helpers memory-core incluida para helpers de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor de base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers del runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para helpers del runtime central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para helpers del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown gestionado para Plugins relacionados con memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidad obsoleto; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subrutas reservadas de helpers incluidos">
    Actualmente no hay subrutas SDK reservadas de helpers incluidos. Los
    helpers específicos del propietario viven dentro del paquete de Plugin propietario,
    mientras que los contratos de host reutilizables usan subrutas SDK genéricas como
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de Plugins](/es/plugins/building-plugins)
