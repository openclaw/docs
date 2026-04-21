---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Visión general del Plugin SDK
x-i18n:
    generated_at: "2026-04-21T05:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visión general del Plugin SDK

El Plugin SDK es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia para **qué importar** y **qué puedes registrar**.

<Tip>
  **¿Buscas una guía práctica?**
  - ¿Primer plugin? Empieza con [Primeros pasos](/es/plugins/building-plugins)
  - ¿Plugin de canal? Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  - ¿Plugin de proveedor? Consulta [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para helpers de entrada/construcción específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; deja `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y los helpers compartidos, como
`buildChannelConfigSchema`.

No añadas ni dependas de seams de conveniencia con nombre de proveedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni
seams de helpers con marca de canal. Los plugins integrados deben componer subrutas
genéricas del SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el núcleo
debe usar esos barrels locales del plugin o añadir un contrato genérico y estrecho del SDK
cuando la necesidad sea realmente transversal entre canales.

El mapa de exportación generado todavía contiene un pequeño conjunto de seams helper
de plugins integrados, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para mantenimiento y compatibilidad de plugins integrados; se
omiten intencionadamente de la tabla común de abajo y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas más usadas, agrupadas por propósito. La lista completa generada de
más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas helper reservadas para plugins integrados siguen apareciendo en esa lista generada.
Trátalas como superficies de detalle de implementación/compatibilidad salvo que una página de documentación
promueva explícitamente una como pública.

### Entrada de plugin

| Subruta                    | Exportaciones clave                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                     |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                        |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de listas de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración y puertas de acción multiaccount, helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de account-id |
    | `plugin-sdk/account-resolution` | Búsqueda de cuentas + helpers de fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers estrechos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato integrado |
    | `plugin-sdk/command-gating` | Helpers estrechos de puerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de enrutamiento entrante y constructor de envoltura |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos de registro y despacho entrantes |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de objetivos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Helpers de identidad saliente, delegado de envío y planificación de carga útil |
    | `plugin-sdk/poll-runtime` | Helpers estrechos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptador de bindings de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil de medios del agente |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversación/hilo, emparejamiento y binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración en runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de política de grupos en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estrechas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización para escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de auth/guard para DM directo |
    | `plugin-sdk/interactive-runtime` | Helpers de normalización/reducción de carga útil de respuestas interactivas |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce de entrada, coincidencia de menciones, helpers de política de menciones y helpers de envoltura |
    | `plugin-sdk/channel-mention-gating` | Helpers estrechos de política de menciones sin la superficie más amplia del runtime de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto y formato de ubicación del canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada y fallos de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de objetivos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexión de feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helpers estrechos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de configuración seleccionados para proveedores locales/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores self-hosted compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados de backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves API en runtime para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de incorporación de claves API/escritura de perfil como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de auth de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de replay, helpers de endpoints de proveedor y helpers de normalización de model-id como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoints de proveedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estrechos de contrato de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estrechos de configuración/credenciales de web-search para proveedores que no necesitan conexión de activación de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estrechos de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/runtime de proveedores de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini, y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltura de stream y helpers compartidos de wrappers Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Helpers de parcheo de configuración de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de auth y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolución de aprobadores y helpers de auth de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprobaciones de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución del gateway de aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal en caliente |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios del runtime de manejo de aprobaciones; prefiere los seams más estrechos de adapter/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de objetivo de aprobación + binding de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga útil de respuesta para aprobaciones de exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers nativos de auth de comandos + objetivo de sesión nativo |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Helpers de normalización de command-body y superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estrechos de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estrechos de `coerceSecretRef` y tipado de SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, restricción de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de política SSRF para lista de permitidos de hosts y red privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estrechos de pinned-dispatcher sin la amplia superficie de runtime de infra |
    | `plugin-sdk/ssrf-runtime` | Helpers de pinned-dispatcher, fetch protegido contra SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entradas secretas |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/objetivo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño del cuerpo de la solicitud/timeout |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de runtime/logging/copias de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers estrechos de entorno de runtime, logger, timeout, retry y backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos/hooks/http/interactivos de plugins |
    | `plugin-sdk/hook-runtime` | Helpers compartidos del pipeline de hooks webhook/internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/binding lazy de runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato CLI, espera y versión |
    | `plugin-sdk/gateway-runtime` | Helpers del cliente Gateway y de parcheo de estado de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato integrada de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autolinks de referencias de archivos sin el amplio barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpers de aprobaciones de exec/plugin, constructores de capacidad de aprobación, helpers de auth/perfil, helpers nativos de enrutamiento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de runtime de entrada/respuesta, fragmentación, despacho, heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estrechos de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial corto de respuestas como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estrechos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta del almacén de sesiones + updated-at |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorio de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de ruta/clave de sesión/binding de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y helpers de metadatos de problemas |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de objetivos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extrae URLs de cadena de entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae cargas útiles normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tablas Markdown |
    | `plugin-sdk/json-store` | Pequeños helpers de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de bloqueo de archivos |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de bindings ACP de solo lectura sin importaciones de arranque del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estrechas de esquema de configuración de runtime de agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivos y tokens de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas compartidas de helpers de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta de comando `/models`/proveedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/construcción/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para harnesses de agente de bajo nivel: tipos de harness, helpers de steer/abort de ejecuciones activas, helpers de puente de herramientas de OpenClaw y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoints Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de eventos del sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Pequeños helpers de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flags y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime con reconocimiento de dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la amplia superficie de runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual del binding de conversación sin enrutamiento de bindings configurados ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Helpers de lectura del almacén de sesiones sin amplias importaciones de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad del contexto y filtrado de contexto complementario sin amplias importaciones de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Helpers estrechos de coerción y normalización de registros/cadenas primitivas sin importaciones de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de retry y ejecutor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de fetch/transformación/almacenamiento de medios más constructores de cargas útiles de medios |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de failover de generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios más exportaciones helper orientadas al proveedor para imágenes/audio |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/Markdown/logging como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de redacción, helpers de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más helpers orientados al proveedor de directivas, registro y validación |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directivas y helpers de normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real y helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, failover, auth y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, helpers de failover, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de failover, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de objetivos Webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de Memory">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper integrada de memory-core para helpers de gestor/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de Memory, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de Memory |
    | `plugin-sdk/memory-core-host-query` | Helpers de consultas del host de Memory |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de Memory |
    | `plugin-sdk/memory-core-host-events` | Helpers del diario de eventos del host de Memory |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI del host de Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrales de runtime del host de Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de Memory |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los helpers centrales de runtime del host de Memory |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los helpers del diario de eventos del host de Memory |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para los helpers de archivos/runtime del host de Memory |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de markdown administrado para plugins adyacentes a Memory |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al gestor de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para los helpers de estado del host de Memory |
    | `plugin-sdk/memory-lancedb` | Superficie helper integrada de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas helper reservadas para integrados">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de soporte del Plugin de navegador integrado (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime integrada de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime integrada de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper integrada de IRC |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams integrados de compatibilidad/helpers de canal |
    | Helpers específicos de auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams helper integrados de funcionalidades/plugins; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                           |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agente de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend CLI local de inferencia        |
| `api.registerChannel(...)`                       | Canal de mensajería                    |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones dúplex de voz en tiempo real  |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                 |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                   |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                    |
| `api.registerWebFetchProvider(...)`              | Proveedor de web fetch / scraping      |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                           |

### Herramientas y comandos

| Método                          | Qué registra                                 |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta del agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)         |

### Infraestructura

| Método                                         | Qué registra                            |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de eventos                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                  |
| `api.registerCli(registrar, opts?)`            | Subcomando CLI                          |
| `api.registerService(service)`                 | Servicio en segundo plano               |
| `api.registerInteractiveHandler(registration)` | Manejador interactivo                   |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva del prompt adyacente a Memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de Memory |

Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
alcance más estrecho a un método del gateway. Prefiere prefijos específicos del plugin para
métodos propiedad del plugin.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro lazy de la CLI del plugin

Si quieres que un comando del plugin permanezca con carga lazy en la ruta normal de la CLI raíz,
proporciona `descriptors` que cubran cada raíz de comando de nivel superior expuesta por ese
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo solo cuando no necesites registro lazy de la CLI raíz.
Esa ruta de compatibilidad eager sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptors para carga lazy en tiempo de análisis.

### Registro de backend CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada de un backend
CLI local de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesita reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). La callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad unificada de Memory                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Constructor de secciones del prompt de Memory                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del plan de vaciado de Memory                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de Memory                                                                                                                       |

### Adaptadores de embeddings de Memory

| Método                                         | Qué registra                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de Memory para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida de plugins de Memory.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos exportados de Memory mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al layout privado de un
  plugin específico de Memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son APIs exclusivas de plugins de Memory compatibles con sistemas heredados.
- `registerMemoryEmbeddingProvider` permite que el plugin activo de Memory registre uno
  o más ids de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ids registrados
  de adaptadores.

### Eventos y ciclo de vida

| Método                                       | Qué hace                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. En cuanto cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. En cuanto cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. En cuanto cualquier manejador reclama el despacho, se omiten los manejadores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. En cuanto cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                               |
| `api.name`               | `string`                  | Nombre para mostrar                                                                         |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                               |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                           |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                   |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                       |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo actual de carga; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve rutas relativas a la raíz del plugin                                               |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas solo de runtime
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo de configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas a través de `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins integrados cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos públicos de entrada similares) ahora prefieren la
instantánea activa de configuración del runtime cuando OpenClaw ya se está ejecutando. Si aún no existe
ninguna instantánea de runtime, recurren al archivo de configuración resuelto en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local y estrecho del plugin cuando un
helper es intencionalmente específico del proveedor y todavía no pertenece a una subruta genérica del SDK.
Ejemplo actual integrado: el proveedor Anthropic mantiene sus helpers de stream de Claude en su propia
superficie pública `api.ts` / `contract-api.ts` en lugar de promover la lógica de encabezados beta de Anthropic y `service_tier` a un contrato genérico `plugin-sdk/*`.

Otros ejemplos actuales integrados:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedor,
  helpers de modelo predeterminado y constructores de proveedores en tiempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor más
  helpers de onboarding/configuración

<Warning>
  El código de producción de extensiones también debe evitar importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Puntos de entrada](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Helpers de runtime](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Configuración y setup](/es/plugins/sdk-setup) — empaquetado, manifiestos, esquemas de configuración
- [Pruebas](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [Migración del SDK](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Internals de plugins](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
