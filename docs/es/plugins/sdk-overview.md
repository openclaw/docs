---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia para todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Descripción general del SDK de Plugin

El SDK de Plugin es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia para **qué importar** y **qué puedes registrar**.

<Tip>
  **¿Buscas una guía práctica?**
  - ¿Tu primer plugin? Empieza con [Getting Started](/es/plugins/building-plugins)
  - ¿Un plugin de canal? Consulta [Channel Plugins](/es/plugins/sdk-channel-plugins)
  - ¿Un plugin de proveedor? Consulta [Provider Plugins](/es/plugins/sdk-provider-plugins)
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene un inicio rápido y
evita problemas de dependencias circulares. Para los ayudantes de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y los ayudantes compartidos como
`buildChannelConfigSchema`.

No agregues ni dependas de superficies de conveniencia con nombre de proveedor como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
superficies auxiliares de marca de canal. Los plugins incluidos deben componer subrutas genéricas del
SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el núcleo
debe usar esos barrels locales del plugin o agregar un contrato estrecho y genérico del SDK
cuando la necesidad sea realmente entre canales.

El mapa de exportaciones generado todavía contiene un pequeño conjunto de superficies auxiliares de plugins incluidos
como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para el mantenimiento y la compatibilidad de plugins incluidos; se
omiten intencionalmente de la tabla común de abajo y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas más usadas habitualmente, agrupadas por propósito. La lista completa generada de
más de 200 subrutas se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas auxiliares reservadas para plugins incluidos siguen apareciendo en esa lista generada.
Trátalas como superficies de detalle de implementación/compatibilidad, a menos que una página de documentación
promocione explícitamente una como pública.

### Entrada de Plugin

| Subruta                    | Exportaciones clave                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración, prompts de listas de permitidos, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Ayudantes de configuración/mecanismos de control de acciones para múltiples cuentas, ayudantes de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ayudantes de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas + fallback predeterminado |
    | `plugin-sdk/account-helpers` | Ayudantes específicos para lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Ayudantes de normalización/validación de comandos personalizados de Telegram con fallback de contrato incluido |
    | `plugin-sdk/command-gating` | Ayudantes específicos de control de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Ayudantes compartidos para rutas entrantes + construcción de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Ayudantes compartidos para registrar y despachar entradas |
    | `plugin-sdk/messaging-targets` | Ayudantes para analizar/hacer coincidir destinos |
    | `plugin-sdk/outbound-media` | Ayudantes compartidos para cargar medios salientes |
    | `plugin-sdk/outbound-runtime` | Ayudantes para identidad saliente/envío delegado |
    | `plugin-sdk/poll-runtime` | Ayudantes específicos para normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Ayudantes de ciclo de vida y adaptadores para asociaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload de medios del agente |
    | `plugin-sdk/conversation-runtime` | Ayudantes de asociación de conversación/hilo, emparejamiento y asociaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Ayudante de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Ayudantes de resolución de políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Ayudantes compartidos para instantáneas/resúmenes de estado del canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Ayudantes de autorización para escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Ayudantes para leer/editar configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Ayudantes compartidos para decisiones de acceso a grupos |
    | `plugin-sdk/direct-dm` | Ayudantes compartidos para autenticación/protección de mensajes directos |
    | `plugin-sdk/interactive-runtime` | Ayudantes para normalización/reducción de payloads de respuestas interactivas |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, ayudantes de políticas de menciones y ayudantes de sobres |
    | `plugin-sdk/channel-mention-gating` | Ayudantes específicos de políticas de menciones sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-location` | Ayudantes de contexto y formato de ubicación de canal |
    | `plugin-sdk/channel-logging` | Ayudantes de registro de canal para descartes entrantes y fallos de escritura/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultados de respuesta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Ayudantes para analizar/hacer coincidir destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes específicos de contratos de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Ayudantes seleccionados para la configuración de proveedores locales/autoalojados |
    | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos para la configuración de proveedores autoalojados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Ayudantes de resolución de claves API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Ayudantes de incorporación/escritura de perfiles de claves API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Ayudantes compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Ayudantes de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de reproducción, ayudantes de endpoints de proveedores y ayudantes de normalización de ID de modelos como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ayudantes genéricos de capacidades HTTP/endpoints de proveedores |
    | `plugin-sdk/provider-web-fetch-contract` | Ayudantes específicos de contratos de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Ayudantes de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Ayudantes específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de activación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Ayudantes específicos de contratos de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Ayudantes de registro/caché/runtime de proveedores de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y ayudantes de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de streams y ayudantes compartidos de envoltorios para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte nativo de proveedores como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte grabables |
    | `plugin-sdk/provider-onboard` | Ayudantes de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Ayudantes de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ayudantes de registro de comandos, ayudantes de autorización de remitentes |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Ayudantes de resolución de aprobadores y autorización de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Ayudantes de perfiles/filtros de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Ayudante compartido de resolución del Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canales críticos |
    | `plugin-sdk/approval-handler-runtime` | Ayudantes más amplios del runtime de controladores de aprobación; prefiere las superficies más específicas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Ayudantes nativos de destino de aprobación + asociación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Ayudantes de payloads de respuesta para aprobaciones de ejecución/plugin |
    | `plugin-sdk/command-auth-native` | Ayudantes nativos de autenticación de comandos + destino de sesión nativa |
    | `plugin-sdk/command-detection` | Ayudantes compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Ayudantes de normalización del cuerpo de comandos y de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Ayudantes específicos de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Ayudantes específicos de tipado de `coerceSecretRef` y SecretRef para el análisis de contratos de secretos/configuración |
    | `plugin-sdk/security-runtime` | Ayudantes compartidos de confianza, control de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Ayudantes de lista de permitidos de hosts y políticas SSRF de red privada |
    | `plugin-sdk/ssrf-dispatcher` | Ayudantes específicos de dispatcher fijado sin la amplia superficie del runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fijado, fetch protegido contra SSRF y ayudantes de políticas SSRF |
    | `plugin-sdk/secret-input` | Ayudantes de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes/destinos de Webhook |
    | `plugin-sdk/webhook-request-guards` | Ayudantes de tamaño del cuerpo de la solicitud/tiempo de espera |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Amplios ayudantes de runtime/registro/copias de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de runtime, logger, tiempo de espera, reintento y retroceso |
    | `plugin-sdk/channel-runtime-context` | Ayudantes genéricos de registro y búsqueda del contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de comandos/hooks/HTTP/interactividad de plugins |
    | `plugin-sdk/hook-runtime` | Ayudantes compartidos del pipeline de hooks Webhook/internos |
    | `plugin-sdk/lazy-runtime` | Ayudantes de importación/asociación de runtime perezoso como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Ayudantes de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Ayudantes de formato, espera y versión de CLI |
    | `plugin-sdk/gateway-runtime` | Ayudantes del cliente Gateway y de parcheo de estado de canales |
    | `plugin-sdk/config-runtime` | Ayudantes de carga/escritura de configuración |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de enlaces automáticos de referencias de archivos sin el amplio barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Ayudantes de aprobaciones de ejecución/plugin, constructores de capacidades de aprobación, ayudantes de autenticación/perfiles, ayudantes nativos de enrutamiento/runtime |
    | `plugin-sdk/reply-runtime` | Ayudantes compartidos de runtime de entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Ayudantes compartidos de historial de respuestas en ventanas cortas como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Ayudantes específicos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Ayudantes de ruta del almacén de sesiones + `updated-at` |
    | `plugin-sdk/state-paths` | Ayudantes de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Ayudantes de enrutamiento/claves de sesión/asociación de cuentas como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Ayudantes compartidos de resumen de estado de canales/cuentas, valores predeterminados del estado de runtime y ayudantes de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Ayudantes compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de slugs/cadenas |
    | `plugin-sdk/request-url` | Extrae URL en cadena de entradas tipo fetch/solicitud |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae payloads normalizados de objetos de resultados de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Ayudantes compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Logger del subsistema y ayudantes de redacción |
    | `plugin-sdk/markdown-table-runtime` | Ayudantes de modo de tablas Markdown |
    | `plugin-sdk/json-store` | Pequeños ayudantes de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Ayudantes de bloqueo de archivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Ayudantes de caché de desduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Ayudantes de runtime/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de asociaciones ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas del esquema de configuración del runtime del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Ayudantes de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Ayudantes de bootstrap del dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas para canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Ayudantes de respuestas del comando `/models`/proveedor |
    | `plugin-sdk/skill-commands-runtime` | Ayudantes de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Ayudantes nativos de registro/compilación/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para harnesses de agentes de bajo nivel: tipos de harness, ayudantes de dirección/aborto de ejecuciones activas, ayudantes del puente de herramientas de OpenClaw y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Ayudantes de detección de endpoints Z.AI |
    | `plugin-sdk/infra-runtime` | Ayudantes de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequeños ayudantes de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Ayudantes de indicadores y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, ayudantes compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Ayudantes de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime consciente del dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la amplia superficie del runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de asociación de conversación sin enrutamiento de asociaciones configuradas ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Ayudantes de lectura del almacén de sesiones sin amplias importaciones de escrituras/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin amplias importaciones de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Ayudantes específicos de coerción y normalización de registros/cadenas primitivas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Ayudantes de normalización de hostnames y hosts SCP |
    | `plugin-sdk/retry-runtime` | Ayudantes de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Ayudantes de directorio/identidad/espacio de trabajo del agente |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Ayudantes compartidos de obtención/transformación/almacenamiento de medios, además de constructores de payloads de medios |
    | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de failover de generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión de medios, además de exportaciones auxiliares para proveedores de imagen/audio |
    | `plugin-sdk/text-runtime` | Ayudantes compartidos de texto/Markdown/registro como eliminación de texto visible para el asistente, ayudantes de renderizado/fragmentación/tablas Markdown, ayudantes de redacción, ayudantes de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Ayudante de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de ayudantes para proveedores de directivas, registro y validación |
    | `plugin-sdk/speech-core` | Ayudantes compartidos de tipos, registro, directivas y normalización para proveedores de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real y ayudantes de registro |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real y ayudantes de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Ayudantes compartidos de tipos, failover, autenticación y registro para generación de imágenes |
    | `plugin-sdk/music-generation` | Tipos de proveedores/solicitudes/resultados de generación de música |
    | `plugin-sdk/music-generation-core` | Ayudantes compartidos de tipos, failover, búsqueda de proveedores y análisis de referencias de modelos para generación de música |
    | `plugin-sdk/video-generation` | Tipos de proveedores/solicitudes/resultados de generación de video |
    | `plugin-sdk/video-generation-core` | Ayudantes compartidos de tipos, failover, búsqueda de proveedores y análisis de referencias de modelos para generación de video |
    | `plugin-sdk/webhook-targets` | Registro de destinos Webhook y ayudantes de instalación de rutas |
    | `plugin-sdk/webhook-path` | Ayudantes de normalización de rutas Webhook |
    | `plugin-sdk/web-media` | Ayudantes compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar incluida `memory-core` para ayudantes de manager/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada del runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y ayudantes genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Ayudantes del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Ayudantes del runtime de CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Ayudantes del runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los ayudantes del runtime central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los ayudantes del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para los ayudantes de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Ayudantes compartidos de Markdown gestionado para plugins relacionados con memoria |
    | `plugin-sdk/memory-host-search` | Fachada del runtime de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para los ayudantes de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar incluida `memory-lancedb` |
  </Accordion>

  <Accordion title="Subrutas auxiliares incluidas reservadas">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Ayudantes de compatibilidad para el plugin Browser incluido (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie auxiliar/runtime de Matrix incluida |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie auxiliar/runtime de LINE incluida |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie auxiliar de IRC incluida |
    | Ayudantes específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Superficies de compatibilidad/ayudantes de canales incluidos |
    | Ayudantes específicos de autenticación/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Superficies auxiliares para funciones/plugins incluidos; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                              |
| ------------------------------------------------ | ----------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                 |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agentes de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia de CLI        |
| `api.registerChannel(...)`                       | Canal de mensajería                       |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT             |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                    |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                      |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                       |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web     |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                              |

### Herramientas y comandos

| Método                          | Qué registra                                 |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)         |

### Infraestructura

| Método                                         | Qué registra                           |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de eventos                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                 |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                      |
| `api.registerService(service)`                 | Servicio en segundo plano              |
| `api.registerInteractiveHandler(registration)` | Controlador interactivo                |
| `api.registerMemoryPromptSupplement(builder)`  | Sección adicional del prompt relacionada con memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de búsqueda/lectura de memoria |

Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen en `operator.admin`, incluso si un plugin intenta asignar un
alcance más limitado a un método del Gateway. Prefiere prefijos específicos del plugin para
métodos propiedad del plugin.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro perezoso de CLI del plugin

Si quieres que un comando del plugin siga cargándose de forma perezosa en la ruta normal de la CLI raíz,
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
        description: "Administra cuentas de Matrix, verificación, dispositivos y estado del perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo solo cuando no necesites el registro perezoso en la CLI raíz.
Esa ruta compatible y anticipada sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga perezosa en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin posea la configuración predeterminada de un
backend local de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelos como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las incorporaciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Constructor de secciones de prompt de memoria                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador del runtime de memoria                                                                                                                      |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                     |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios consuman artefactos de memoria exportados a través de
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con sistemas heredados.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ID de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un ID personalizado
  definido por un plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ID de adaptadores
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida   |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de asociación de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador reclama el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como sin decisión (igual que omitir `cancel`), no como una anulación.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                  |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                |
| `api.name`               | `string`                  | Nombre para mostrar                                                                          |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                            |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                    |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de la configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                      |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes de runtime](/es/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                              |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas de runtime únicamente
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde el código de producción. Dirige las importaciones internas a través de `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada pública similares) ahora prefieren la
instantánea activa de configuración del runtime cuando OpenClaw ya se está ejecutando. Si aún no existe una
instantánea del runtime, recurren a la configuración resuelta en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local del plugin cuando un
ayudante es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplo incluido actual: el proveedor Anthropic mantiene sus ayudantes de stream de Claude
en su propia superficie pública `api.ts` / `contract-api.ts` en lugar de
promover la lógica de encabezados beta de Anthropic y `service_tier` a un contrato genérico
`plugin-sdk/*`.

Otros ejemplos incluidos actuales:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedores,
  ayudantes de modelos predeterminados y constructores de proveedores en tiempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor, además de
  ayudantes de incorporación/configuración

<Warning>
  El código de producción de extensiones también debe evitar las importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un ayudante realmente es compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Puntos de entrada](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Ayudantes de runtime](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Configuración y config](/es/plugins/sdk-setup) — empaquetado, manifiestos, esquemas de configuración
- [Pruebas](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [Migración del SDK](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Elementos internos de plugins](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
