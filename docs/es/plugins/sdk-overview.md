---
read_when:
    - Debe saber desde qué subruta del SDK importar
    - Quiere una referencia de todos los métodos de registro de `OpenClawPluginApi`
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugins
x-i18n:
    generated_at: "2026-07-12T14:45:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué se puede registrar**.

<Note>
  Esta página está dirigida a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca una guía práctica? Comience con [Creación de plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de entorno de ejecución de agentes](/es/plugins/sdk-agent-harness) para ejecutores nativos de agentes y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto agiliza el inicio y
evita problemas de dependencias circulares. Para los auxiliares de entrada y compilación específicos de canales,
prefiera `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y auxiliares compartidos como
`buildChannelConfigSchema`.

Para la configuración de canales, publique el esquema JSON propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
está destinada a las primitivas de esquema compartidas y al generador genérico. Los plugins
incluidos con OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
conservados de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna de las subrutas de esquemas incluidos es un
patrón para nuevos plugins.

<Warning>
  No importe puntos de integración auxiliares con nombres de proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios módulos de exportación
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deben usar esos módulos de exportación locales
  del plugin o añadir un contrato genérico y acotado del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de puntos de integración auxiliares para plugins incluidos sigue apareciendo en el mapa
de exportaciones generado cuando su uso por parte del propietario está registrado. Existen únicamente para el
mantenimiento de plugins incluidos y no son rutas de importación recomendadas para nuevos plugins
de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para usos registrados por parte del propietario. No
copie esas rutas de importación en nuevos plugins; use en su lugar auxiliares de entorno de ejecución inyectados y
subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas específicas agrupadas por área (entrada del
plugin, canal, proveedor, autenticación, entorno de ejecución, capacidad, memoria y auxiliares reservados
para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se generan a partir
del subconjunto público después de restar las subrutas internas o de pruebas locales del repositorio enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecute
`pnpm plugin-sdk:surface` para auditar la cantidad de exportaciones públicas. Las subrutas públicas
obsoletas con suficiente antigüedad y sin uso en el código de producción de las extensiones incluidas se
registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los módulos de exportación amplios
y obsoletos de reexportación se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La función de retorno `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                                     |
| `api.registerWorkerProvider(...)`                | Arrendamientos del ciclo de vida de trabajadores en la nube                                   |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para generación de texto y contenido multimedia                 |
| `api.registerAgentHarness(...)`                  | Ejecutor nativo de agentes [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot)         |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                                      |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                           |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                                          |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                                 |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real mediante streaming                                               |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real                                                         |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes, audio y vídeo                                                            |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                                |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                                        |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                                          |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                           |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención o extracción de contenido web                                          |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                                  |
| `api.registerCompactionProvider(...)`            | Backend conectable para la compactación de transcripciones                                    |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` cuando rechazan permanentemente un perfil. `provision` debe adoptar el mismo arrendamiento cuando se repita el identificador de la operación.
El núcleo conserva con el arrendamiento la configuración validada del perfil y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite que los proveedores encaminen las llamadas del ciclo de vida después de reiniciar un Gateway o eliminar un perfil con nombre. Los puntos de conexión SSH usan un `SecretRef` para `keyRef`, nunca material de clave insertado, e incluyen un `hostKey` procedente de una salida de aprovisionamiento de confianza con el formato exacto `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave recibida durante la primera conexión. Un proveedor que genere un `keyRef` dinámico puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando existe, ese solucionador es autoritativo, mientras que los proveedores que no lo tengan usan el solucionador genérico de secretos configurado.
Los proveedores con arrendamientos renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar una excepción ante errores transitorios o indeterminados; devuelva `unknown` únicamente cuando exista una ausencia confirmada de forma autoritativa. El núcleo marca como huérfano un registro local activo o considera la ausencia como la finalización del desmantelamiento después de una solicitud de destrucción conservada.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustaciones para generar vectores reutilizables. La búsqueda en memoria
puede consumir esta superficie genérica de proveedores. El punto de integración anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que aún exponen `batchEmbed(...)` durante la ejecución permanecen en
el contrato existente de procesamiento por lotes por archivo, salvo que su entorno de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta activación permite que el host de memoria envíe fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada a `batchEmbed(...)`,
hasta alcanzar los límites de lote del host. Los adaptadores por lotes que cargan archivos de solicitudes JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto el límite de tamaño de carga como el límite de cantidad
de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada, en el mismo orden que
`batch.chunks`; omita la opción cuando el proveedor espere lotes locales por archivo o
no pueda conservar el orden de entrada en un trabajo más amplio que abarque toda la fuente.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo contienen herramientas
con nombres de herramientas fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o para registrar herramientas de forma totalmente dinámica.

| Método                                 | Qué registra                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                                    |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                           |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden exponerlo como herramienta visible para el agente mientras el Node esté conectado |

Los comandos de plugins pueden establecer `agentPromptGuidance` cuando el agente necesite una indicación breve
de enrutamiento propiedad del comando. Mantenga ese texto centrado en el propio comando; no añada
políticas específicas de proveedores o plugins a los generadores de prompts del núcleo.

Las entradas de orientación pueden ser cadenas heredadas, que se aplican a todas las superficies de prompts, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Indicación global del comando.",
  { text: "Mostrar esto solo en el prompt principal de OpenClaw.", surfaces: ["openclaw_main"] },
];
```

Los valores estructurados de `surfaces` pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omita `surfaces` cuando la orientación deba aplicarse intencionadamente a todas las superficies. No
pase un arreglo `surfaces` vacío; se rechaza para que una pérdida accidental de alcance no
convierta el texto en un prompt global.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies de
prompts: solo la orientación cuyo alcance incluye explícitamente `codex_app_server` se promueve a
esa vía de mayor prioridad. La orientación mediante cadenas heredadas y la orientación estructurada sin alcance
siguen disponibles para las superficies de prompts que no son de Codex por motivos de compatibilidad.

Los comandos del host de Node se ejecutan en el host de Node conectado, no dentro del proceso del Gateway. Si `agentTool` está presente, el Node publica un descriptor después de conectarse correctamente al Gateway; el Gateway lo expone a las ejecuciones del agente solo mientras ese Node esté conectado y únicamente si el `command` del descriptor forma parte de la superficie de comandos aprobados del Node. Configure `agentTool.defaultPlatforms` para incluir un comando no peligroso en la lista de permitidos predeterminada de comandos del Node; de lo contrario, se requiere una configuración explícita de `gateway.nodes.allowCommands` o una política de invocación del Node. `agentTool.name` debe ser seguro para el proveedor: debe comenzar con una letra, usar únicamente letras, dígitos, guiones bajos o guiones, y no superar los 64 caracteres. Las herramientas del Node respaldadas por MCP pueden establecer metadatos `agentTool.mcp` para que las superficies de catálogo y búsqueda de herramientas puedan mostrar la identidad del servidor o herramienta MCP remotos, pero la ejecución sigue realizándose mediante el comando del Node anunciado.

### Infraestructura

| Método                                          | Qué registra                                                  |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                                |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                     |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                        |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descubrimiento del Gateway local                |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                          |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de funciones de Node en `openclaw nodes`                  |
| `api.registerService(service)`                  | Servicio en segundo plano                                     |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                       |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva del prompt relacionada con la memoria         |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda y lectura de memoria               |
| `api.registerHostedMediaResolver(resolver)`     | Solucionador de URL de contenido multimedia alojado para navegadores |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts y mensajes propiedad del Plugin |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el tiempo de ejecución del Plugin |
| `api.registerMigrationProvider(provider)`       | Importador para `openclaw migrate`                            |
| `api.registerAutoEnableProbe(probe)`            | Comprobación de configuración que puede habilitar automáticamente este Plugin |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio, recarga en caliente o ninguna acción para gestionar recargas |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a los Nodes emparejados      |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos o aprobación para comandos invocados por Nodes |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`       |

Los generadores de complementos de prompts de memoria reciben contexto opcional de `agentId`, `agentSessionKey` y `sandboxed`. Las llamadas `search` y `get` del complemento del corpus de memoria reciben contexto opcional de `agentId` y `sandboxed`. Los Plugins con almacenamiento propiedad del agente deben resolver dicho almacenamiento en cada llamada, en lugar de capturar una única ruta global durante el registro. Si se requiere un identificador de agente, pero falta en una operación multiagente, se debe producir un fallo seguro en lugar de elegir un agente arbitrario.

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para encaminar texto por la ruta entrante normal del agente de Telegram después de que el controlador se complete correctamente. OpenClaw conserva el botón de devolución de llamada cuando la política de entrada omite el texto o se produce un error de procesamiento, para que el usuario pueda volver a intentarlo cuando cambie la condición de bloqueo. Este campo de resultado es específico de Telegram; los demás canales conservan sus propios contratos de resultados interactivos.

### Hooks del host para Plugins de flujo de trabajo

Los hooks del host son las interfaces del SDK para los Plugins que necesitan participar en el ciclo de vida del host, en lugar de limitarse a añadir un proveedor, canal o herramienta. Son contratos genéricos; el modo Plan puede utilizarlos, al igual que los flujos de trabajo de aprobación, las puertas de políticas del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los Plugins complementarios de la interfaz de usuario.

| Método                                                                               | Contrato que controla                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión compatible con JSON y propiedad del Plugin, proyectado mediante sesiones del Gateway                                                       |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de ejecución exactamente una vez, inyectado en el siguiente turno del agente para una sesión                                               |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza previa a los Plugins, restringida por el manifiesto, que puede bloquear o reescribir parámetros de herramientas       |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                     |
| `api.registerCommand(...)`                                                           | Comandos de Plugin con ámbito; los resultados de los comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución a la interfaz de control para superficies de sesión, herramienta, ejecución, configuración o pestaña                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Devoluciones de llamada de limpieza para recursos en tiempo de ejecución propiedad del Plugin en rutas de restablecimiento, eliminación o recarga            |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores del flujo de trabajo                                                                         |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución, eliminado durante el ciclo de vida terminal de la ejecución                                                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del programador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                    |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host y disponible solo para Plugins incluidos, dirigida a la ruta activa de salida directa de la sesión          |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron y disponibles solo para Plugins incluidos, además de limpieza basada en etiquetas                          |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                |

Un descriptor `surface: "tab"` añade una pestaña de barra lateral a la interfaz de control. Los descriptores de pestaña de los Plugins activos se anuncian a los clientes del panel en el saludo del Gateway (`controlUiTabs`), por lo que la pestaña solo aparece mientras el Plugin está habilitado. Los Plugins incluidos pueden proporcionar una vista de panel de primera clase para su pestaña; otros Plugins pueden establecer `path` en una ruta HTTP del Plugin (consulte `api.registerHttpRoute(...)`) que el panel representa en un marco aislado. `icon` es una sugerencia del nombre de un icono del panel, `group` selecciona la sección de la barra lateral (`control` o `agent`), `order` ordena las pestañas de los Plugins y `requiredScopes` oculta la pestaña a las conexiones que no dispongan de esos ámbitos de operador:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Diario",
  description: "Su día como cronología, creada a partir de capturas de pantalla.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Utilice los espacios de nombres agrupados para el código nuevo de Plugins:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad obsoletos para los Plugins existentes. No añada código nuevo de Plugins que invoque directamente `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` ni `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una función práctica con ámbito de sesión sobre el programador Cron del Gateway. Cron controla la temporización y crea el registro de tarea en segundo plano cuando se ejecuta el turno; el SDK del Plugin solo restringe la sesión de destino, la nomenclatura propiedad del Plugin y la limpieza. Utilice `api.runtime.tasks.managedFlows` dentro del turno programado cuando el trabajo necesite un estado duradero de flujo de tareas de varios pasos.

Los contratos dividen la autoridad de forma intencionada:

- Los Plugins externos pueden controlar las extensiones de sesión, los descriptores de interfaz de usuario, los comandos, los metadatos de herramientas, las inyecciones del siguiente turno y los hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes de los hooks `before_tool_call` ordinarios y cuentan con la confianza del host. Las políticas incluidas se ejecutan primero; las políticas de Plugins instalados requieren habilitación explícita, además de sus identificadores locales en `contracts.trustedToolPolicies`, y se ejecutan después en el orden de carga de los Plugins. Los identificadores de políticas tienen el ámbito del Plugin que los registra.
- La propiedad de comandos reservados solo está disponible para Plugins incluidos. Los Plugins externos deben utilizar sus propios nombres de comandos o alias.
- `allowPromptInjection=false` deshabilita los hooks que modifican prompts, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, los campos de prompt del `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores ajenos al modo Plan:

| Arquetipo de Plugin              | Hooks utilizados                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación   | Extensión de sesión, continuación de comandos, inyección en el siguiente turno, descriptor de interfaz de usuario                                         |
| Control de política de presupuesto/espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                  |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida del entorno de ejecución, suscripción a eventos del agente, propiedad/limpieza del programador de sesiones, contribución al prompt de Heartbeat, descriptor de interfaz de usuario |
| Asistente de configuración o incorporación | Extensión de sesión, comandos con ámbito, descriptor de Control UI                                                                          |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un Plugin intenta asignar un
  ámbito de método de Gateway más restringido. Se recomienda usar prefijos específicos del Plugin para los
  métodos que pertenecen al Plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los Plugins incluidos y los Plugins instalados habilitados explícitamente con contratos
  de manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el entorno de ejecución
  devuelva ese resultado al modelo. Esta es la interfaz de confianza independiente del entorno de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los Plugins deben declarar `contracts.agentToolResultMiddleware` para cada entorno de ejecución de destino,
por ejemplo, `["openclaw", "codex"]`. Los Plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; se deben conservar
los hooks normales de Plugin de OpenClaw para el trabajo que no necesite temporización de resultados de herramientas
antes del modelo. Se ha eliminado la antigua
ruta de registro de fábrica de extensiones exclusiva del ejecutor integrado.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el
Gateway activo en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando el descubrimiento local está habilitado, proporciona los
puertos actuales del Gateway y datos de sugerencia TXT no secretos, y llama al controlador
`stop` devuelto durante el apagado del Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Los Plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen
siendo responsables de la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos que pertenecen al registrador
- `descriptors`: descriptores de comandos en tiempo de análisis utilizados para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del Plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para las funciones de nodos emparejados, se recomienda
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de Node que pertenecen explícitamente al Plugin.

Si se desea que un comando de Plugin permanezca con carga diferida en la ruta raíz normal de la CLI,
se deben proporcionar `descriptors` que abarquen cada raíz de comando de nivel superior expuesta por ese
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
        description: "Administrar cuentas, verificación, dispositivos y estado del perfil de Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Los comandos anidados reciben el comando principal resuelto como `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capturar o renderizar contenido del lienzo desde un Node emparejado",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` por sí solo únicamente cuando no se necesite el registro diferido de la CLI raíz.
Esa ruta de compatibilidad inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de la CLI

`api.registerCliBackend(...)` permite que un Plugin sea propietario de la configuración predeterminada de un
backend local de CLI de IA como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelos como `my-cli/gpt-5`.
- La `config` del backend usa la misma estructura que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del Plugin antes de ejecutar la CLI.
- Use `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, normalizar estructuras antiguas de indicadores).
- Use `resolveExecutionArgs` para reescrituras de argv con ámbito de solicitud que pertenezcan al
  dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a un indicador nativo de esfuerzo.
  El hook recibe `ctx.executionMode`; use `"side-question"` para añadir
  indicadores de aislamiento nativos del backend para llamadas efímeras de `/btw`. Si esos indicadores
  deshabilitan de forma fiable las herramientas nativas para una CLI que, de otro modo, las mantiene siempre activas, declare también
  `sideQuestionToolMode: "disabled"`.
- Los backends que pueden deshabilitar todas las herramientas nativas para una ejecución específica pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una tupla
  `ctx.toolAvailability.native` vacía más una lista de permitidos MCP exacta y aislada del host;
  `resolveExecutionArgs` debe aplicar ambas en el argv final, tanto nuevo como de reanudación.
  OpenClaw impide la ejecución si el backend no puede hacerlo.

Para consultar una guía de creación integral, véase
[Plugins de backend de la CLI](/es/plugins/cli-backend-plugins).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se vuelven a intentar sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Generador de sección del prompt de memoria                                                                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptador del entorno de ejecución de memoria                                                                                                                                                                                |

### Adaptadores obsoletos de embeddings de memoria

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para Plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los Plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core`, en lugar de acceder a la estructura privada de un
  Plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas para Plugins de memoria compatibles con sistemas heredados.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia `provider/model`
  exacta, como `ollama/qwen3:8b`, sin heredar la cadena de alternativas activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el período de migración,
  pero la inspección de Plugins informa de ello como deuda de compatibilidad para
  Plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                              |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado del ciclo de vida         |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversación |

Consulte [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y semántica de
protección.

### Semántica de decisión de los hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución del Plugin, no la superficie de políticas de instalación
del operador. Use `security.installPolicy` cuando una decisión de permitir/bloquear deba
abarcar las rutas de instalación o actualización de la CLI y las respaldadas por el Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera como no tomar ninguna decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera como no tomar ninguna decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador asume el despacho, se omiten los controladores de menor prioridad y la ruta de despacho predeterminada del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera como no tomar ninguna decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: use el campo tipado `threadId` cuando necesite enrutar hilos o temas entrantes. Reserve `metadata` para datos adicionales específicos del canal.
- `message_sending`: use los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad del Gateway, en lugar de depender de los hooks internos `gateway:startup`. Cron aún puede estar cargándose en este punto.
- `cron_reconciled`: reconstruya una proyección externa completa de Cron después del inicio o de una recarga del programador. Incluye `reason` y el estado efectivo `enabled`, incluido `enabled: false`, mientras que `ctx.getCron?.()` devuelve el programador reconciliado exacto. Pase `ctx.abortSignal` al trabajo de proyección duradera; se cancela cuando esa instantánea del programador queda reemplazada o el Gateway se cierra.
- `cron_changed`: observe los cambios del ciclo de vida de Cron propiedad del Gateway. Los eventos `scheduled` y `removed` son indicios de reconciliación posteriores a la confirmación, no un registro ordenado de cambios incrementales. El campo `event.nextRunAtMs` de un evento programado está ausente cuando el trabajo no tiene una próxima activación; un evento eliminado sigue incluyendo la instantánea del trabajo eliminado.

Los programadores externos de activaciones deben aplicar antirrebote o agrupar los eventos `cron_changed`,
y después volver a leer la vista duradera completa desde el último programador capturado por
`cron_reconciled`. No adopte el programador de un contexto `cron_changed`: un
indicio desacoplado de un programador anterior puede solaparse con una recarga posterior.

Use `cron_reconciled` como desencadenante de instantánea completa para el estado duradero cargado durante
el inicio del Gateway o el reemplazo del programador. No se reproduce en una recarga en caliente
exclusiva de un plugin. Los controladores de observación se ejecutan en paralelo y los
despachos que no esperan respuesta pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con reemplazo duradero, reintentos/espera incremental y
apagado limpio, consulte [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Identificador del plugin                                                                         |
| `api.name`               | `string`                  | Nombre para mostrar                                                                               |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                     |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                                 |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                         |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                             |
| `api.config`             | `OpenClawConfig`          | Instantánea de la configuración actual (instantánea activa del entorno de ejecución en memoria cuando esté disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin procedente de `plugins.entries.<id>.config`                   |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes del entorno de ejecución](/es/plugins/sdk-runtime)                                        |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la carga completa de la entrada |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                                   |

## Convención de módulos internos

Dentro del plugin, use archivos de barril locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones del entorno de ejecución solo para uso interno
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importe su propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enrute las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea de configuración activa del entorno de ejecución cuando OpenClaw ya está en ejecución. Si todavía no existe ninguna instantánea
del entorno de ejecución, recurren al archivo de configuración resuelto en el disco.
Las fachadas empaquetadas de plugins incluidos deben cargarse mediante los cargadores de fachadas de plugins
de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones del manifiesto
y de los archivos auxiliares del entorno de ejecución que las instalaciones empaquetadas usan para el código propiedad del plugin.

Los plugins de proveedores pueden exponer un barril de contrato local y limitado del plugin cuando un
ayudante es intencionadamente específico del proveedor y aún no corresponde a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para los ayudantes de
  encabezados beta y flujo `service_tier` de Claude.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  ayudantes de modelos predeterminados y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor
  junto con ayudantes de incorporación/configuración.

<Warning>
  El código de producción de las extensiones también debe evitar las importaciones
  `openclaw/plugin-sdk/<other-plugin>`. Si un ayudante es verdaderamente compartido, trasládelo a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins.
</Warning>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Ayudantes del entorno de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Configuración y ajustes" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Detalles internos de los plugins" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura detallada y modelo de capacidades.
  </Card>
</CardGroup>
