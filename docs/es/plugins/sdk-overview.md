---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Resumen del SDK de Plugin
x-i18n:
    generated_at: "2026-04-23T05:17:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Resumen del SDK de Plugin

El SDK de plugins es el contrato tipado entre los plugins y el core. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Tip>
  **¿Buscas una guía práctica?**
  - ¿Primer plugin? Empieza con [Getting Started](/es/plugins/building-plugins)
  - ¿Plugin de canal? Consulta [Channel Plugins](/es/plugins/sdk-channel-plugins)
  - ¿Plugin de proveedor? Consulta [Provider Plugins](/es/plugins/sdk-provider-plugins)
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para auxiliares de entrada/construcción específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y auxiliares compartidos como
`buildChannelConfigSchema`.

No agregues ni dependas de interfaces de conveniencia con nombre de proveedor como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ni
interfaces auxiliares con marca de canal. Los plugins empaquetados deben componer subrutas genéricas
del SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el core
debe usar esos barrels locales del plugin o agregar un contrato genérico y estrecho del SDK
cuando la necesidad sea realmente transversal a varios canales.

El mapa de exportaciones generado todavía contiene un pequeño conjunto de interfaces auxiliares
de plugins empaquetados como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para mantenimiento y compatibilidad de plugins empaquetados; se
omiten intencionalmente de la tabla común de abajo y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas más usadas, agrupadas por propósito. La lista completa generada de
más de 200 subrutas está en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas auxiliares reservadas de plugins empaquetados siguen apareciendo en esa lista generada.
Trátalas como superficies de detalle de implementación/compatibilidad a menos que una página de documentación
promocione explícitamente una como pública.

### Entrada de plugin

| Subruta                    | Exportaciones clave                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación raíz del esquema Zod de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartidos del asistente de configuración, indicaciones de lista permitida, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuración multicuenta/puerta de acciones, auxiliares de respaldo de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Búsqueda de cuenta + auxiliares de respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Auxiliares limitados de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalización/validación de comandos personalizados de Telegram con respaldo de contrato empaquetado |
    | `plugin-sdk/command-gating` | Auxiliares limitados de puertas de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, auxiliares de ciclo de vida/finalización de borradores de stream |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartidos de ruta entrante + constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Auxiliares compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidad saliente, delegado de envío y planificación de cargas |
    | `plugin-sdk/poll-runtime` | Auxiliares limitados de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida y adaptador de vinculaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga de medios del agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de vinculación de conversación/hilo, emparejamiento y vinculaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de instantánea de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolución de políticas de grupo en runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas limitadas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas de plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edición/lectura de configuración de lista permitida |
    | `plugin-sdk/group-access` | Auxiliares compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Auxiliares compartidos de autenticación/protección de DM directos |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y auxiliares heredados de respuesta interactiva. Consulta [Message Presentation](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, auxiliares de política de menciones y auxiliares de sobre |
    | `plugin-sdk/channel-mention-gating` | Auxiliares limitados de política de menciones sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-location` | Auxiliares de contexto y formato de ubicación del canal |
    | `plugin-sdk/channel-logging` | Auxiliares de registro de canal para descartes entrantes y fallos de escritura/acuse de recibo |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Auxiliares de acciones de mensajes de canal, además de auxiliares de esquema nativo obsoletos mantenidos para compatibilidad de plugins |
    | `plugin-sdk/channel-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexión de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares limitados de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino secreto |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares curados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados de backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de runtime de resolución de API key para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación/escritura de perfiles de API key como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, auxiliares de endpoint de proveedor y auxiliares de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidades HTTP/endpoint de proveedor, incluidos auxiliares de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares limitados de contrato de configuración/selección de obtención web como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/caché de proveedores de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares limitados de configuración/credenciales de búsqueda web para proveedores que no necesitan la conexión de habilitación del plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares limitados de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/caché/runtime de proveedores de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnóstico de esquemas Gemini, y auxiliares de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorio de stream y auxiliares compartidos de envoltorios de Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Auxiliares de parche de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, auxiliares de autorización de remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolución de aprobadores y auxiliares de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprobación de exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de entrega/capacidad de aprobación nativa |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartido de resolución de gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal activos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios de runtime de controladores de aprobación; prefiere las interfaces más limitadas de adaptador/gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprobación + vinculación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de carga de respuesta de aprobación de exec/plugin |
    | `plugin-sdk/command-auth-native` | Autenticación de comandos nativos + auxiliares nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Auxiliares de normalización del cuerpo del comando y de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares limitados de recopilación de contratos secretos para superficies secretas de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares limitados de tipado `coerceSecretRef` y SecretRef para análisis de contrato secreto/configuración |
    | `plugin-sdk/security-runtime` | Auxiliares compartidos de confianza, puertas DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista permitida de hosts y política SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares limitados de dispatcher fijado sin la amplia superficie de runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño del cuerpo de la solicitud/tiempo de espera |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplios de runtime/registro/copias de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares limitados de entorno de runtime, logger, tiempo de espera, reintento y backoff |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartidos de comandos/hooks/HTTP/interactivos de plugins |
    | `plugin-sdk/hook-runtime` | Auxiliares compartidos del pipeline de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importación/vinculación diferida del runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Auxiliares de formato, espera y versión de CLI |
    | `plugin-sdk/gateway-runtime` | Auxiliares de cliente de Gateway y parche de estado de canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carga/escritura de configuración y auxiliares de búsqueda de configuración de plugins |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato empaquetada de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autovínculos de referencias de archivos sin el barrel más amplio `text-runtime` |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprobación de exec/plugin, constructores de capacidad de aprobación, auxiliares de autenticación/perfil, auxiliares nativos de enrutamiento/runtime |
    | `plugin-sdk/reply-runtime` | Auxiliares compartidos de runtime de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares limitados de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Auxiliares compartidos de historial de respuestas de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares limitados de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de ruta de almacenamiento de sesión + `updated-at` |
    | `plugin-sdk/state-paths` | Auxiliares de ruta de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de ruta/clave de sesión/vinculación de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartidos de resumen de estado de canal/cuenta, valores predeterminados del estado de runtime y auxiliares de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extraer URL de tipo cadena de entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extraer cargas normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Auxiliares compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Auxiliares de logger de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tablas Markdown |
    | `plugin-sdk/json-store` | Auxiliares pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares reentrantes de bloqueo de archivos |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas limitadas de esquema de configuración de runtime de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap del dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas de canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de respuesta de proveedor/comando `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin confiable para harnesses de agente de bajo nivel: tipos de harness, auxiliares de redirección/abortado de ejecución activa, auxiliares de puente de herramientas de OpenClaw y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detección de endpoints de Z.A.I |
    | `plugin-sdk/infra-runtime` | Auxiliares de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Auxiliares pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de indicadores y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, auxiliares compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime consciente del dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la amplia superficie de runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de la conversación sin enrutamiento de vinculaciones configuradas ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de lectura del almacenamiento de sesiones sin amplias importaciones de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad del contexto y filtrado de contexto suplementario sin amplias importaciones de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares limitados de coerción y normalización de registros primitivos/cadenas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Auxiliares de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Auxiliares de directorio/identidad/espacio de trabajo de agentes |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartidos de obtención/transformación/almacenamiento de medios además de constructores de cargas de medios |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de failover de generación de medios, selección de candidatos y mensajería de modelos faltantes |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión de medios además de exportaciones auxiliares de imagen/audio orientadas al proveedor |
    | `plugin-sdk/text-runtime` | Auxiliares compartidos de texto/Markdown/registro como eliminación de texto visible para el asistente, auxiliares de renderizado/fragmentación/tablas Markdown, auxiliares de redacción, auxiliares de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz además de auxiliares orientados al proveedor para directivas, registro y validación |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directivas y auxiliares de normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, failover, autenticación y auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, auxiliares de failover, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, auxiliares de failover, búsqueda de proveedores y análisis de referencias de modelos |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Auxiliares de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Auxiliares compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de plugins |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar empaquetada de memory-core para auxiliares de administrador/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y auxiliares genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consultas del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime core del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para auxiliares de runtime core del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para auxiliares de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown gestionado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acceso al administrador de búsquedas |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar empaquetada de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas reservadas de auxiliares empaquetados">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de soporte del plugin empaquetado de navegador (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie auxiliar/runtime empaquetada de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie auxiliar/runtime empaquetada de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie auxiliar empaquetada de IRC |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces de compatibilidad/auxiliares de canales empaquetados |
    | Auxiliares específicos de autenticación/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces auxiliares de funciones/plugins empaquetados; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agente de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia de CLI    |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes/audio/video      |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                          | Qué registra                            |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP de Gateway                |
| `api.registerGatewayMethod(name, handler)`      | Método RPC de Gateway                   |
| `api.registerCli(registrar, opts?)`             | Subcomando de CLI                       |
| `api.registerService(service)`                  | Servicio en segundo plano               |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                 |
| `api.registerEmbeddedExtensionFactory(factory)` | Fábrica de extensiones del ejecutor embebido de Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda/lectura de memoria |

Los espacios de nombres administrativos centrales reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
alcance más estrecho a un método de gateway. Prefiere prefijos específicos del plugin para
métodos propiedad del plugin.

Usa `api.registerEmbeddedExtensionFactory(...)` cuando un plugin necesite sincronización de eventos nativa de Pi
durante ejecuciones embebidas de OpenClaw, por ejemplo reescrituras asíncronas de `tool_result`
que deben ocurrir antes de que se emita el mensaje final del resultado de la herramienta.
Hoy esta es una interfaz de plugin empaquetado: solo los plugins empaquetados pueden registrar una, y
deben declarar `contracts.embeddedExtensionFactories: ["pi"]` en
`openclaw.plugin.json`. Mantén los hooks normales de plugins de OpenClaw para todo lo
que no requiera esa interfaz de nivel más bajo.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro diferido de la CLI del plugin

Si quieres que un comando de plugin permanezca cargado de forma diferida en la ruta normal de la CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad eager sigue siendo compatible, pero no instala
marcadores respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada para un backend local
de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección del prompt de memoria                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                       |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida de plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que plugins complementarios consuman artefactos de memoria exportados a través de
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con implementaciones heredadas.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ID de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un ID personalizado definido por el plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ID de adaptadores registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador reclama el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específica del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad del gateway en lugar de depender de hooks internos `gateway:startup`.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                |
| `api.name`               | `string`                  | Nombre para mostrar                                                                          |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                            |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                    |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                      |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/es/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la carga completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                              |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones de runtime solo internas
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo de configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Encamina las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins empaquetados cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) ahora prefieren la
instantánea activa de configuración del runtime cuando OpenClaw ya se está ejecutando. Si aún no existe
ninguna instantánea de runtime, recurren al archivo de configuración resuelto en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local y limitado del plugin cuando un
auxiliar es intencionalmente específico del proveedor y todavía no pertenece a una subruta genérica del SDK.
Ejemplo empaquetado actual: el proveedor Anthropic mantiene sus auxiliares de stream de Claude
en su propia interfaz pública `api.ts` / `contract-api.ts` en lugar de promover la lógica de encabezados beta de Anthropic y `service_tier` a un contrato genérico
`plugin-sdk/*`.

Otros ejemplos empaquetados actuales:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedores,
  auxiliares de modelo predeterminado y constructores de proveedores en tiempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor además de
  auxiliares de incorporación/configuración

<Warning>
  El código de producción de extensiones también debe evitar importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un auxiliar es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Entry Points](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Runtime Helpers](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Setup and Config](/es/plugins/sdk-setup) — empaquetado, manifiestos, esquemas de configuración
- [Testing](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [SDK Migration](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Plugin Internals](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
