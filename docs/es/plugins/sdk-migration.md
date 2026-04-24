---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un Plugin a la arquitectura moderna de Plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad hacia atrás al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T05:41:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ha pasado de una capa amplia de compatibilidad hacia atrás a una arquitectura moderna de Plugins
con importaciones específicas y documentadas. Si tu Plugin se creó antes de la
nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema antiguo de Plugins proporcionaba dos superficies muy abiertas que permitían a los Plugins importar
cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba docenas de
  ayudas. Se introdujo para mantener en funcionamiento Plugins antiguos basados en hooks mientras se construía la
  nueva arquitectura de Plugins.
- **`openclaw/extension-api`** — un puente que daba a los Plugins acceso directo a
  ayudas del lado del host, como el ejecutor embebido del agente.

Ambas superficies están ahora **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los Plugins
nuevos no deben usarlas, y los Plugins existentes deben migrar antes de que la próxima
versión principal las elimine.

OpenClaw no elimina ni reinterpreta el comportamiento documentado de Plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato deben pasar primero
por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia.
Eso se aplica a importaciones del SDK, campos de manifiesto, APIs de configuración, hooks y comportamiento de registro en tiempo de ejecución.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una futura versión principal.
  Los Plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar una sola ayuda cargaba docenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de distinguir qué exportaciones eran estables frente a internas

El SDK moderno de Plugin soluciona esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También han desaparecido los seams heredados de conveniencia de proveedor para canales integrados. Importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seams auxiliares con marca de canal y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables de Plugin. Usa subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo del Plugin integrado, mantén las ayudas propiedad del proveedor en el propio
`api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores integrados:

- Anthropic mantiene ayudas específicas de stream de Claude en su propio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedor, ayudas de modelos predeterminados y constructores
  de proveedores en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y ayudas de incorporación/configuración en su propio
  `api.ts`

## Política de compatibilidad

Para Plugins externos, el trabajo de compatibilidad sigue este orden:

1. añadir el nuevo contrato
2. mantener el comportamiento antiguo conectado a través de un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la obsolescencia y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión principal

Si un campo de manifiesto sigue aceptándose, los autores de Plugins pueden seguir usándolo hasta
que la documentación y los diagnósticos indiquen lo contrario. El código nuevo debe preferir el
reemplazo documentado, pero los Plugins existentes no deben romperse durante versiones menores
normales.

## Cómo migrar

<Steps>
  <Step title="Migrar controladores nativos de aprobación a hechos de capacidad">
    Los Plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto de entorno de ejecución.

    Cambios clave:

    - Reemplazar `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mover la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` /
      `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de Plugin de canal; mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` se mantiene solo para flujos de login/logout del canal; los
      hooks de autenticación de aprobación ahí ya no son leídos por el núcleo
    - Registrar objetos de entorno de ejecución propiedad del canal como clientes, tokens o apps
      Bolt mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde controladores nativos de aprobación;
      el núcleo ahora es propietario de los avisos de entregado-en-otro-lugar basados en resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una
      superficie real de `createPluginRuntime().channel`. Se rechazan los stubs parciales.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de capacidad
    de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de respaldo del envoltorio de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los envoltorios de Windows
    `.cmd`/`.bat` no resueltos ahora fallan en modo cerrado a menos que pases
    explícitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadores de compatibilidad de confianza que
      // aceptan intencionalmente el respaldo mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si quien llama no depende intencionalmente del respaldo de shell, no establezcas
    `allowShellFallback` y gestiona el error lanzado en su lugar.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie antigua corresponde a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad hacia atrás)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas y específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para ayudas del lado del host, usa el entorno de ejecución del Plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (entorno de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otras ayudas heredadas del puente:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ayudas del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

  <Accordion title="Tabla común de rutas de importación">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Ayudante canónico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación general heredada para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema raíz de configuración | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Ayudante de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Ayudantes compartidos del asistente de configuración | Prompts de allowlist, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Ayudantes de entorno de ejecución en tiempo de configuración | Adaptadores de parche de configuración seguros para importación, ayudas lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Ayudantes de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Ayudantes de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Ayudantes de múltiples cuentas | Ayudantes de lista/configuración/controles de acciones de cuenta |
  | `plugin-sdk/account-id` | Ayudantes de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Ayudantes de búsqueda de cuenta | Ayudantes de búsqueda de cuenta + respaldo predeterminado |
  | `plugin-sdk/account-helpers` | Ayudantes específicos de cuenta | Ayudantes de lista de cuenta/acción de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de mensajes directos | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Ayudantes de configuración de comandos de Telegram | Normalización de nombres de comando, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/MD | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Ayudantes de estado de cuenta y ciclo de vida de borradores | `createAccountStatusSink`, ayudas de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Ayudantes de sobre entrante | Ayudantes compartidos de construcción de ruta + sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Ayudantes de respuesta entrante | Ayudantes compartidos de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Ayudantes de análisis/coincidencia de destino |
  | `plugin-sdk/outbound-media` | Ayudantes de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Ayudantes de entorno de ejecución saliente | Ayudantes de identidad saliente/delegado de envío y planificación de carga útil |
  | `plugin-sdk/thread-bindings-runtime` | Ayudantes de enlaces de hilos | Ayudantes de ciclo de vida y adaptador de enlaces de hilos |
  | `plugin-sdk/agent-media-payload` | Ayudantes heredados de carga útil de medios | Constructor de carga útil de medios de agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Shim obsoleto de compatibilidad | Solo utilidades heredadas de entorno de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Ayudantes generales de entorno de ejecución | Ayudantes de runtime/logging/backup/instalación de Plugin |
  | `plugin-sdk/runtime-env` | Ayudantes específicos de entorno de ejecución | Logger/runtime env, timeout, retry y backoff helpers |
  | `plugin-sdk/plugin-runtime` | Ayudantes compartidos de entorno de ejecución de Plugin | Ayudantes de comandos/hooks/http/interactivos del Plugin |
  | `plugin-sdk/hook-runtime` | Ayudantes de canalización de hooks | Ayudantes compartidos de canalización de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Ayudantes de entorno de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Ayudantes de procesos | Ayudantes compartidos de exec |
  | `plugin-sdk/cli-runtime` | Ayudantes de entorno de ejecución de CLI | Formato de comandos, esperas, ayudas de versión |
  | `plugin-sdk/gateway-runtime` | Ayudantes de Gateway | Cliente de Gateway y ayudas de parche de estado de canal |
  | `plugin-sdk/config-runtime` | Ayudantes de configuración | Ayudantes de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Ayudantes de comandos de Telegram | Ayudantes de validación de comandos de Telegram con respaldo estable cuando la superficie contractual integrada de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Ayudantes de prompts de aprobación | Carga útil de aprobación exec/plugin, ayudas de capacidad/perfil de aprobación, ayudas de enrutamiento/runtime de aprobación nativa |
  | `plugin-sdk/approval-auth-runtime` | Ayudantes de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Ayudantes de cliente de aprobación | Ayudantes nativos de perfil/filtro de aprobación de exec |
  | `plugin-sdk/approval-delivery-runtime` | Ayudantes de entrega de aprobación | Adaptadores nativos de capacidad/entrega de aprobación |
  | `plugin-sdk/approval-gateway-runtime` | Ayudantes de Gateway de aprobación | Ayudante compartido de resolución de gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Ayudantes de adaptador de aprobación | Ayudantes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canal |
  | `plugin-sdk/approval-handler-runtime` | Ayudantes de controlador de aprobación | Ayudantes más amplios de entorno de ejecución del controlador de aprobación; prefiere los seams más específicos de adaptador/gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Ayudantes de destino de aprobación | Ayudantes de enlace nativo de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Ayudantes de respuesta de aprobación | Ayudantes de carga útil de respuesta de aprobación exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Ayudantes de contexto de entorno de ejecución de canal | Ayudantes genéricos de register/get/watch del contexto de entorno de ejecución de canal |
  | `plugin-sdk/security-runtime` | Ayudantes de seguridad | Ayudantes compartidos de confianza, control de MD, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Ayudantes de política SSRF | Ayudantes de allowlist de host y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Ayudantes de entorno de ejecución SSRF | Dispatcher fijado, fetch protegido, ayudas de política SSRF |
  | `plugin-sdk/collection-runtime` | Ayudantes de caché limitada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Ayudantes de control de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Ayudantes de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, ayudas de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Ayudantes de fetch/proxy envueltos | `resolveFetch`, ayudas de proxy |
  | `plugin-sdk/host-runtime` | Ayudantes de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Ayudantes de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Control de comandos y ayudas de superficie de comandos | `resolveControlCommandGate`, ayudas de autorización de remitente, ayudas de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada secreta | Ayudantes de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Ayudantes de solicitud de webhook | Utilidades de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Ayudantes de guardias de cuerpo de webhook | Ayudantes de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Entorno de ejecución compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuesta, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Ayudantes específicos de despacho de respuesta | Ayudantes de finalización + despacho de proveedor |
  | `plugin-sdk/reply-history` | Ayudantes de historial de respuesta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencia de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Ayudantes de fragmentos de respuesta | Ayudantes de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Ayudantes de almacén de sesiones | Ruta del almacén + ayudas updated-at |
  | `plugin-sdk/state-paths` | Ayudantes de rutas de estado | Ayudantes de directorio de estado y OAuth |
  | `plugin-sdk/routing` | Ayudantes de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ayudas de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Ayudantes de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime, ayudas de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Ayudantes de resolución de destino | Ayudantes compartidos de resolución de destino |
  | `plugin-sdk/string-normalization-runtime` | Ayudantes de normalización de cadenas | Ayudantes de normalización de slug/cadena |
  | `plugin-sdk/request-url` | Ayudantes de URL de solicitud | Extraer URL string de entradas tipo request |
  | `plugin-sdk/run-command` | Ayudantes de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramienta | Extraer cargas útiles normalizadas de objetos de resultado de herramienta |
  | `plugin-sdk/tool-send` | Extracción de envío de herramienta | Extraer campos canónicos de destino de envío desde args de herramienta |
  | `plugin-sdk/temp-path` | Ayudantes de rutas temporales | Ayudantes compartidos de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Ayudantes de logging | Logger de subsistema y ayudas de redacción |
  | `plugin-sdk/markdown-table-runtime` | Ayudantes de tablas Markdown | Ayudantes de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensaje | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Ayudantes curados de configuración de proveedores locales/autohospedados | Ayudantes de descubrimiento/configuración de proveedor autohospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Ayudantes específicos de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos ayudantes de descubrimiento/configuración de proveedor autohospedado |
  | `plugin-sdk/provider-auth-runtime` | Ayudantes de autenticación de proveedor en entorno de ejecución | Ayudantes de resolución de clave API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Ayudantes de configuración de clave API de proveedor | Ayudantes de incorporación/escritura de perfiles de clave API |
  | `plugin-sdk/provider-auth-result` | Ayudantes de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Ayudantes de inicio de sesión interactivo de proveedor | Ayudantes compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Ayudantes de selección de proveedor | Selección de proveedor configurado o automático y combinación de configuración bruta de proveedor |
  | `plugin-sdk/provider-env-vars` | Ayudantes de variables env de proveedor | Ayudantes de búsqueda de variables env de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Ayudantes compartidos de modelo/reproducción de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de reproducción, ayudas de endpoint de proveedor y ayudas de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Ayudantes compartidos de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedor | Ayudantes de configuración de incorporación |
  | `plugin-sdk/provider-http` | Ayudantes HTTP de proveedor | Ayudantes genéricos de HTTP/capacidades de endpoint de proveedor, incluidos ayudantes de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Ayudantes de web-fetch de proveedor | Ayudantes de registro/caché de proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Ayudantes de configuración de web-search de proveedor | Ayudantes específicos de configuración/credenciales de web-search para proveedores que no necesitan cableado de habilitación de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Ayudantes de contrato de web-search de proveedor | Ayudantes específicos de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Ayudantes de web-search de proveedor | Ayudantes de registro/caché/runtime de proveedor de web-search |
  | `plugin-sdk/provider-tools` | Ayudantes de compatibilidad de herramientas/esquemas de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos, y ayudantes de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Ayudantes de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros ayudantes de uso de proveedor |
  | `plugin-sdk/provider-stream` | Ayudantes de envoltorios de stream de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorio de stream y ayudas compartidas de envoltorio para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Ayudantes de transporte de proveedor | Ayudantes nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Ayudantes compartidos de medios | Ayudantes de obtención/transformación/almacenamiento de medios más constructores de carga útil de medios |
  | `plugin-sdk/media-generation-runtime` | Ayudantes compartidos de generación de medios | Ayudantes compartidos de failover, selección de candidatos y mensajería de modelo ausente para generación de imagen/video/música |
  | `plugin-sdk/media-understanding` | Ayudantes de comprensión de medios | Tipos de proveedor de comprensión de medios más exportaciones de ayudas de imagen/audio orientadas a proveedor |
  | `plugin-sdk/text-runtime` | Ayudantes compartidos de texto | Eliminación de texto visible para el asistente, ayudantes de render/fragmentación/tablas de markdown, ayudantes de redacción, ayudantes de etiquetas de directiva, utilidades de texto seguro y ayudas relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Ayudantes de fragmentación de texto | Ayudante de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Ayudantes de voz | Tipos de proveedor de voz más ayudas de directivas, registro y validación orientadas a proveedor |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Ayudantes de transcripción en tiempo real | Tipos de proveedor, ayudas de registro y ayudante compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Ayudantes de voz en tiempo real | Tipos de proveedor, ayudas de registro/resolución y ayudas de sesión bridge |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, failover, autenticación y ayudas de registro |
  | `plugin-sdk/music-generation` | Ayudantes de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, ayudas de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Ayudantes de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, ayudas de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Ayudantes de respuesta interactiva | Normalización/reducción de carga útil de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Ayudantes de escritura de configuración de canal | Ayudantes de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Ayudantes de estado de canal | Ayudantes compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Ayudantes de configuración de allowlist | Ayudantes de edición/lectura de configuración de allowlist |
  | `plugin-sdk/group-access` | Ayudantes de acceso a grupo | Ayudantes compartidos de decisión de acceso a grupo |
  | `plugin-sdk/direct-dm` | Ayudantes de MD directos | Ayudantes compartidos de autenticación/guardias de MD directos |
  | `plugin-sdk/extension-shared` | Ayudantes compartidos de extensiones | Primitivas auxiliares de canal pasivo/estado y proxy ambiental |
  | `plugin-sdk/webhook-targets` | Ayudantes de destinos de webhook | Registro de destinos de webhook y ayudas de instalación de rutas |
  | `plugin-sdk/webhook-path` | Ayudantes de rutas de webhook | Ayudantes de normalización de rutas de webhook |
  | `plugin-sdk/web-media` | Ayudantes compartidos de medios web | Ayudantes de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Ayudantes integrados de memory-core | Superficie de ayudas de gestor/configuración/archivo/CLI de Memory |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de entorno de ejecución del motor de Memory | Fachada de entorno de ejecución de índice/búsqueda de Memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de Memory | Exportaciones del motor base del host de Memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de Memory | Contratos de embeddings de Memory, acceso al registro, proveedor local y ayudantes genéricos de lote/remotos; los proveedores remotos concretos viven en sus Plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de Memory | Exportaciones del motor QMD del host de Memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de Memory | Exportaciones del motor de almacenamiento del host de Memory |
  | `plugin-sdk/memory-core-host-multimodal` | Ayudantes multimodales del host de Memory | Ayudantes multimodales del host de Memory |
  | `plugin-sdk/memory-core-host-query` | Ayudantes de consulta del host de Memory | Ayudantes de consulta del host de Memory |
  | `plugin-sdk/memory-core-host-secret` | Ayudantes de secretos del host de Memory | Ayudantes de secretos del host de Memory |
  | `plugin-sdk/memory-core-host-events` | Ayudantes de diario de eventos del host de Memory | Ayudantes de diario de eventos del host de Memory |
  | `plugin-sdk/memory-core-host-status` | Ayudantes de estado del host de Memory | Ayudantes de estado del host de Memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Entorno de ejecución de CLI del host de Memory | Ayudantes de entorno de ejecución de CLI del host de Memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Entorno de ejecución central del host de Memory | Ayudantes de entorno de ejecución central del host de Memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Ayudantes de archivo/runtime del host de Memory | Ayudantes de archivo/runtime del host de Memory |
  | `plugin-sdk/memory-host-core` | Alias de entorno de ejecución central del host de Memory | Alias neutral respecto al proveedor para ayudas de entorno de ejecución central del host de Memory |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos del host de Memory | Alias neutral respecto al proveedor para ayudas de diario de eventos del host de Memory |
  | `plugin-sdk/memory-host-files` | Alias de archivo/runtime del host de Memory | Alias neutral respecto al proveedor para ayudas de archivo/runtime del host de Memory |
  | `plugin-sdk/memory-host-markdown` | Ayudantes de markdown gestionado | Ayudantes compartidos de markdown gestionado para Plugins adyacentes a Memory |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de memoria activa | Fachada diferida del entorno de ejecución del gestor de búsqueda de memoria activa |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de Memory | Alias neutral respecto al proveedor para ayudas de estado del host de Memory |
  | `plugin-sdk/memory-lancedb` | Ayudantes integrados de memory-lancedb | Superficie de ayudas de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de pruebas | Ayudantes y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada vive en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista sigue incluyendo algunos seams auxiliares de Plugins integrados como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de Plugins integrados, pero se omiten
intencionalmente de la tabla común de migración y no son el objetivo recomendado para
código nuevo de Plugin.

La misma regla se aplica a otras familias de ayudas integradas como:

- ayudas de compatibilidad del navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de ayudantes/Plugins integrados como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie específica de ayudante de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que se ajuste al trabajo. Si no puedes encontrar una exportación,
consulta el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución  |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los Plugins que sigan usándolas fallarán |

Todos los Plugins principales ya se han migrado. Los Plugins externos deben migrarse
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Getting Started](/es/plugins/building-plugins) — crea tu primer Plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — crear Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crear Plugins de proveedor
- [Internos de Plugin](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
