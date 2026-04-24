---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad retroactiva al SDK moderno de plugins
title: Migración del SDK de plugins
x-i18n:
    generated_at: "2026-04-24T09:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ha pasado de una capa amplia de compatibilidad retroactiva a una arquitectura moderna de plugins con importaciones enfocadas y documentadas. Si tu plugin se creó antes de la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El antiguo sistema de plugins proporcionaba dos superficies muy abiertas que permitían a los plugins importar cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de ayudantes. Se introdujo para mantener funcionando los plugins heredados basados en hooks mientras se construía la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a ayudantes del host, como el ejecutor de agentes embebido.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los nuevos plugins no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima versión principal las elimine.

OpenClaw no elimina ni reinterpreta comportamiento documentado de plugins en el mismo cambio que introduce un reemplazo. Los cambios de contrato incompatibles primero deben pasar por un adaptador de compatibilidad, diagnósticos, documentación y un período de obsolescencia.
Esto se aplica a importaciones del SDK, campos del manifiesto, APIs de configuración, hooks y comportamiento de registro en tiempo de ejecución.

<Warning>
  La capa de compatibilidad retroactiva se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Arranque lento** — importar un ayudante cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables frente a cuáles eran internas

El SDK moderno de plugins corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

Las costuras heredadas de conveniencia de proveedor para canales incluidos también han desaparecido. Importaciones como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, costuras auxiliares con marca de canal y `openclaw/plugin-sdk/telegram-core` eran atajos privados del mono-repo, no contratos estables de plugins. Usa en su lugar subrutas genéricas y estrechas del SDK. Dentro del workspace del plugin incluido, mantén los ayudantes controlados por el proveedor en el propio `api.ts` o `runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores incluidos:

- Anthropic mantiene ayudantes de streaming específicos de Claude en su propia costura `api.ts` / `contract-api.ts`
- OpenAI mantiene constructores de proveedor, ayudantes de modelos predeterminados y constructores de proveedor en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor del proveedor y ayudantes de incorporación/configuración en su propio `api.ts`

## Política de compatibilidad

Para plugins externos, el trabajo de compatibilidad sigue este orden:

1. añadir el nuevo contrato
2. mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la obsolescencia y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión principal

Si un campo del manifiesto sigue siendo aceptado, los autores de plugins pueden seguir usándolo hasta que la documentación y los diagnósticos indiquen lo contrario. El código nuevo debería preferir el reemplazo documentado, pero los plugins existentes no deberían romperse durante versiones menores normales.

## Cómo migrar

<Steps>
  <Step title="Migrar los controladores nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante `approvalCapability.nativeRuntime` más el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Sustituye `approvalCapability.handler.loadRuntime(...)` por `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` / `plugin.approvals` y llévala a `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público de plugins de canal; mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` permanece solo para flujos de inicio/cierre de sesión del canal; los hooks de autenticación de aprobación allí ya no son leídos por el núcleo
    - Registra objetos de tiempo de ejecución controlados por el canal, como clientes, tokens o apps de Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección controlados por el plugin desde controladores nativos de aprobación; el núcleo ahora controla los avisos de redirección a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una superficie real de `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver la distribución actual de capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat` no resueltos en Windows ahora fallan de forma cerrada a menos que pases explícitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadores de compatibilidad de confianza que
      // aceptan intencionalmente el fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionalmente del fallback por shell, no configures `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sustituir por importaciones enfocadas">
    Cada exportación de la superficie antigua se asigna a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad retroactiva)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas y enfocadas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para ayudantes del lado del host, usa el tiempo de ejecución del plugin inyectado en lugar de importar directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (tiempo de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros ayudantes heredados del puente:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ayudantes del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Tabla de rutas de importación comunes">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores enfocados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Prompts de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de tiempo de ejecución para configuración | Adaptadores de parches de configuración seguros para importación, ayudantes de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de configuración |
  | `plugin-sdk/setup-adapter-runtime` | Ayudantes de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes para múltiples cuentas | Ayudantes de lista/configuración/puerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Ayudantes de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuentas | Ayudantes de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Ayudantes de cuenta específicos | Ayudantes de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Ayudantes de ciclo de vida de estado de cuenta y flujo de borradores | `createAccountStatusSink`, ayudantes de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobres entrantes | Ayudantes compartidos de ruta + constructor de sobres |
  | `plugin-sdk/inbound-reply-dispatch` | Ayudantes de respuesta entrante | Ayudantes compartidos de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de objetivos de mensajería | Ayudantes de análisis/coincidencia de objetivos |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Ayudantes de tiempo de ejecución saliente | Ayudantes de identidad/envío saliente y planificación de payload |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de vinculación de hilos | Ayudantes de ciclo de vida y adaptador de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de payload de medios | Constructor de payload de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim obsoleto de compatibilidad | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes amplios de tiempo de ejecución | Ayudantes de tiempo de ejecución/logging/respaldo/instalación de plugins |
  | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de tiempo de ejecución | Logger/entorno de tiempo de ejecución, timeout, retry y backoff |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de tiempo de ejecución del plugin | Ayudantes de comandos/hooks/http/interactivos del plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de canalización de hooks | Ayudantes compartidos de canalización de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Ayudantes de tiempo de ejecución lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de proceso | Ayudantes compartidos de exec |
  | `plugin-sdk/cli-runtime` | Ayudantes de tiempo de ejecución de CLI | Formato de comandos, esperas, ayudantes de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway y ayudantes de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Ayudantes de configuración | Ayudantes de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram estables como fallback cuando la superficie de contrato incluida de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de prompts de aprobación | Payload de aprobación de exec/plugin, ayudantes de capacidad/perfil de aprobación, ayudantes nativos de enrutamiento/tiempo de ejecución de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobación | Ayudantes nativos de perfil/filtro de aprobación de exec |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobación | Ayudante compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptador de aprobación | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada rápidos de canal |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de controlador de aprobación | Ayudantes más amplios de tiempo de ejecución del controlador de aprobación; prefiere las costuras más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de objetivo de aprobación | Ayudantes nativos de vinculación de objetivo/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobación | Ayudantes de payload de respuesta de aprobación de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de tiempo de ejecución de canal | Ayudantes genéricos de registro/obtención/observación de contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, filtrado de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de políticas SSRF | Ayudantes de lista de permitidos de hosts y políticas de red privada |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de tiempo de ejecución SSRF | Dispatcher fijado, fetch protegido, ayudantes de políticas SSRF |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de filtrado de diagnósticos | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudantes de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch/proxy envueltos | `resolveFetch`, ayudantes de proxy |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Asignación de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrado de comandos y ayudantes de superficie de comandos | `resolveControlCommandGate`, ayudantes de autorización de remitente, ayudantes de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada secreta | Ayudantes de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitudes de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de protección de cuerpo de Webhook | Ayudantes de lectura/límite de cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuesta, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho de respuesta | Finalización, despacho de proveedor y ayudantes de etiqueta de conversación |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencia de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentación de respuestas | Ayudantes de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones | Ruta del almacén + ayudantes de updated-at |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudantes de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución, ayudantes de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de objetivos | Ayudantes compartidos de resolución de objetivos |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitud | Extraer URL de cadena de entradas tipo request |
  | `plugin-sdk/run-command` | Ayudantes de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramienta | Extraer payloads normalizados de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extraer campos canónicos de destino de envío de argumentos de herramienta |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Ayudantes de logging | Logger de subsistema y ayudantes de redacción |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes seleccionados de configuración de proveedores locales/autohospedados | Ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes enfocados de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos ayudantes de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de proveedor en tiempo de ejecución | Ayudantes de resolución de claves de API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de clave de API de proveedor | Ayudantes de incorporación/escritura de perfil con clave de API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Ayudantes de inicio de sesión interactivo de proveedor | Ayudantes compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedor | Selección de proveedor configurado o automática y combinación de configuración bruta de proveedor |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables de entorno de proveedor | Ayudantes de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelo/replay de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, ayudantes de endpoints de proveedor y ayudantes de normalización de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedor | Ayudantes genéricos HTTP/de capacidades de endpoints de proveedor, incluidos ayudantes de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de obtención web de proveedor | Ayudantes de registro/caché de proveedor de obtención web |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de búsqueda web de proveedor | Ayudantes específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contrato de búsqueda web de proveedor | Ayudantes específicos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
  | `plugin-sdk/provider-web-search` | Ayudantes de búsqueda web de proveedor | Ayudantes de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos, y ayudantes de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedor |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorio de flujos de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujos y ayudantes compartidos de envoltorio para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedor | Ayudantes nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de medios | Ayudantes de obtención/transformación/almacenamiento de medios además de constructores de payload de medios |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación de medios | Ayudantes compartidos de failover, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión de medios | Tipos de proveedor de comprensión de medios además de exportaciones de ayudantes de imagen/audio orientadas al proveedor |
  | `plugin-sdk/text-runtime` | Ayudantes compartidos de texto | Eliminación de texto visible para el asistente, ayudantes de renderizado/fragmentación/tablas en markdown, ayudantes de redacción, ayudantes de etiquetas de directiva, utilidades de texto seguro y ayudantes relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedor de voz además de ayudantes orientados al proveedor para directivas, registro y validación |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedor, ayudantes de registro y ayudante compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedor, ayudantes de registro/resolución y ayudantes de sesión puente |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, failover, autenticación y ayudantes de registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudantes de failover, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Ayudantes de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, ayudantes de failover, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuesta interactiva | Normalización/reducción de payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canal | Ayudantes de autorización para escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de plugins de canal |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canal | Ayudantes compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de lista de permitidos | Ayudantes de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Ayudantes de acceso a grupos | Ayudantes compartidos de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Ayudantes de DM directo | Ayudantes compartidos de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensiones | Primitivas auxiliares de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de objetivos de Webhook | Registro de objetivos de Webhook y ayudantes de instalación de rutas |
  | `plugin-sdk/webhook-path` | Ayudantes de rutas de Webhook | Ayudantes de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Ayudantes compartidos de medios web | Ayudantes de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de plugins |
  | `plugin-sdk/memory-core` | Ayudantes incluidos de memory-core | Superficie de ayudantes de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y ayudantes genéricos por lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de memoria | Ayudantes multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de memoria | Ayudantes de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de memoria | Ayudantes de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Ayudantes de diario de eventos del host de memoria | Ayudantes de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de memoria | Ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Ayudantes de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Ayudantes centrales de tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivos/tiempo de ejecución del host de memoria | Ayudantes de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de tiempo de ejecución central del host de memoria | Alias neutral respecto al proveedor para ayudantes centrales de tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos del host de memoria | Alias neutral respecto al proveedor para ayudantes de diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para ayudantes de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de markdown gestionado | Ayudantes compartidos de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada lazy de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para ayudantes de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Ayudantes incluidos de memory-lancedb | Superficie de ayudantes de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Ayudantes y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no la superficie completa del SDK. La lista completa de más de 200 puntos de entrada está en `scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas costuras auxiliares de plugins incluidos como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas siguen exportadas para mantenimiento y compatibilidad de plugins incluidos, pero se omiten intencionalmente de la tabla común de migración y no son el objetivo recomendado para código nuevo de plugins.

La misma regla se aplica a otras familias de ayudantes incluidos como:

- ayudantes de compatibilidad con navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de ayudantes/plugins incluidos como `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` actualmente expone la superficie específica de ayudantes de token `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con la tarea. Si no encuentras una exportación, revisa el origen en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                 | Qué ocurre                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución    |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins centrales ya han sido migrados. Los plugins externos deberían migrar antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Internos del Plugin](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto del Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
