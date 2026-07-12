---
read_when:
    - Debes saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro de OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de plugins
x-i18n:
    generated_at: "2026-07-11T23:26:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia sobre **qué importar** y **qué puede registrar**.

<Note>
  Esta página está dirigida a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca una guía práctica? Comience con [Creación de plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [plugins de entorno de ejecución de agentes](/es/plugins/sdk-agent-harness) para ejecutores nativos de agentes y [hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene rápido el inicio y
evita problemas de dependencias circulares. Para los auxiliares de entrada y compilación específicos de canales,
prefiera `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y los auxiliares compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canales, publique el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para las primitivas compartidas del esquema y el constructor genérico. Los plugins
incluidos con OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
conservados de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna de las subrutas de esquemas incluidos es un
patrón para plugins nuevos.

<Warning>
  No importe interfaces auxiliares con marcas de proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios módulos de exportación `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deben usar esos módulos de exportación locales del plugin
  o añadir un contrato genérico y específico del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de interfaces auxiliares para plugins incluidos aún aparece en el mapa de exportaciones
generado cuando tiene un uso registrado por parte de sus propietarios. Existen únicamente para el
mantenimiento de plugins incluidos y no se recomiendan como rutas de importación para nuevos
plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para usos registrados por parte de sus propietarios. No
copie esas rutas de importación en plugins nuevos; use en su lugar auxiliares inyectados en tiempo de ejecución y
subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas específicas agrupadas por área (entrada del
plugin, canal, proveedor, autenticación, tiempo de ejecución, capacidad, memoria y auxiliares
reservados para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se generan a partir
del subconjunto público después de restar las subrutas internas o de prueba locales del repositorio indicadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecute
`pnpm plugin-sdk:surface` para auditar la cantidad de exportaciones públicas. Las
subrutas públicas obsoletas que tienen suficiente antigüedad y no se usan en el código de producción de las extensiones incluidas se
registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los módulos de exportación amplios
y obsoletos de reexportación se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La función de retorno `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                                              |
| `api.registerWorkerProvider(...)`                | Arrendamientos del ciclo de vida de trabajadores en la nube                                            |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para la generación de texto y contenido multimedia                       |
| `api.registerAgentHarness(...)`                  | Ejecutor nativo de agentes [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot)                  |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                                               |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                                    |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                                                    |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                                          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real mediante transmisión continua                                             |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real                                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes, audio y vídeo                                                                     |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                                         |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                                                 |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                                                   |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                                    |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención y extracción de contenido web                                                    |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                                           |
| `api.registerCompactionProvider(...)`            | Backend conectable de Compaction de transcripciones                                                     |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` cuando un perfil se rechaza de forma permanente. `provision` debe adoptar el mismo arrendamiento cuando se repita el identificador de operación.
El núcleo conserva con el arrendamiento la configuración validada del perfil y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite que los proveedores enruten las llamadas del ciclo de vida después de reiniciar el Gateway o eliminar un perfil con nombre. Los puntos de conexión SSH usan un `SecretRef` para `keyRef`, nunca material de clave insertado directamente, e incluyen un `hostKey` procedente de resultados de aprovisionamiento de confianza con el formato exacto `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave obtenida de la primera conexión. Un proveedor que genere un `keyRef` dinámico puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando está presente, ese resolvedor es la autoridad, mientras que los proveedores que no lo tengan usan el resolvedor genérico de secretos configurado.
Los proveedores con arrendamientos renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar un error ante fallos transitorios o indeterminados; solo debe devolver `unknown` cuando la ausencia sea definitiva. El núcleo marca como huérfano un registro local activo o considera la ausencia como la finalización del desmontaje después de una solicitud de destrucción conservada.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustaciones para la generación reutilizable de vectores. La búsqueda en memoria
puede utilizar esta superficie genérica de proveedores. La interfaz anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que todavía exponen un `batchEmbed(...)` en tiempo de ejecución mantienen
el contrato existente de procesamiento por lotes por archivo, a menos que su tiempo de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta habilitación permite que el host de memoria envíe fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada a `batchEmbed(...)`,
hasta los límites de lote del host. Los adaptadores de lotes que cargan archivos de solicitudes JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto el límite de tamaño de carga como
el límite de cantidad de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada en el mismo orden que
`batch.chunks`; omita la opción cuando el proveedor espere lotes locales por archivo o
no pueda conservar el orden de entrada en un trabajo más amplio que abarque toda la fuente.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo proporcionan herramientas
con nombres de herramientas fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o para el registro completamente dinámico de herramientas.

| Método                                 | Qué registra                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                                                                                       |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                                                                              |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden exponerlo como una herramienta visible para el agente mientras el Node está conectado                       |

Los comandos de los plugins pueden establecer `agentPromptGuidance` cuando el agente necesite una breve
indicación de enrutamiento propiedad del comando. Mantenga ese texto centrado en el propio comando; no añada
políticas específicas de proveedores o plugins a los constructores de prompts del núcleo.

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
de `openclaw_main`. Omita `surfaces` para aplicar intencionadamente la orientación a todas las superficies. No
pase un arreglo `surfaces` vacío; se rechaza para evitar que una pérdida accidental del ámbito
convierta el texto en contenido global del prompt.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies de
prompts: solo la orientación cuyo ámbito incluya explícitamente `codex_app_server` se promueve a
ese canal de mayor prioridad. La orientación mediante cadenas heredadas y la orientación estructurada sin ámbito
siguen estando disponibles para superficies de prompts que no sean de Codex por motivos de compatibilidad.

Los comandos del host Node se ejecutan en el host Node conectado, no dentro del
proceso del Gateway. Si `agentTool` está presente, el Node publica un descriptor
después de conectarse correctamente al Gateway; el Gateway lo expone a las
ejecuciones del agente solo mientras ese Node esté conectado y únicamente si el
`command` del descriptor forma parte de la superficie de comandos aprobados del
Node. Configure `agentTool.defaultPlatforms` para incluir un comando no peligroso
en la lista de permitidos predeterminada de comandos del Node; de lo contrario,
se requiere una configuración explícita de `gateway.nodes.allowCommands` o una
política de invocación de Node. `agentTool.name` debe ser seguro para el
proveedor: debe comenzar con una letra, usar únicamente letras, dígitos, guiones
bajos o guiones, y no superar los 64 caracteres. Las herramientas del Node
respaldadas por MCP pueden establecer metadatos `agentTool.mcp` para que las
superficies de catálogo y búsqueda de herramientas puedan mostrar la identidad
del servidor o la herramienta MCP remotos, pero la ejecución sigue realizándose
mediante el comando del Node anunciado.

### Infraestructura

| Método                                          | Qué registra                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de eventos                                                               |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                                     |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                                        |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descubrimiento del Gateway local                                |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                                          |
| `api.registerNodeCliFeature(registrar, opts?)`  | Funcionalidad de la CLI del Node bajo `openclaw nodes`                        |
| `api.registerService(service)`                  | Servicio en segundo plano                                                     |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                                       |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución               |
| `api.registerMemoryPromptSupplement(builder)`   | Sección adicional del prompt relacionada con la memoria                       |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus adicional de búsqueda y lectura de memoria                             |
| `api.registerHostedMediaResolver(resolver)`     | Resolutor de URL de contenido multimedia alojado al estilo de un navegador    |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto para compatibilidad de prompts y mensajes del Plugin    |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el runtime del Plugin |
| `api.registerMigrationProvider(provider)`       | Importador para `openclaw migrate`                                            |
| `api.registerAutoEnableProbe(probe)`            | Sondeo de configuración que puede habilitar automáticamente este Plugin       |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio, recarga en caliente o sin operación para gestionar recargas |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a los Nodes emparejados                      |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos o aprobación para comandos invocados por Nodes |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`                       |

Los constructores de suplementos del prompt de memoria reciben el contexto
opcional `agentId`, `agentSessionKey` y `sandboxed`. Las llamadas `search` y
`get` de suplementos del corpus de memoria reciben el contexto opcional
`agentId` y `sandboxed`. Los Plugins con almacenamiento propiedad del agente
deben resolver dicho almacenamiento en cada llamada, en lugar de capturar una
única ruta global durante el registro. Si se requiere un identificador de agente
pero falta en una operación multiagente, se debe denegar la operación de forma
segura en lugar de elegir un agente arbitrario.

Los controladores interactivos de Telegram pueden devolver `{ submitText }`
para dirigir el texto por la ruta normal de entrada del agente de Telegram
después de que el controlador finalice correctamente. OpenClaw conserva el botón
de devolución de llamada cuando la política de entrada omite el texto o falla el
procesamiento, para que el usuario pueda volver a intentarlo cuando cambie la
condición de bloqueo. Este campo de resultado es específico de Telegram; los
demás canales conservan sus propios contratos de resultados interactivos.

### Hooks del host para Plugins de flujo de trabajo

Los hooks del host son los puntos de integración del SDK para los Plugins que
necesitan participar en el ciclo de vida del host, en lugar de limitarse a añadir
un proveedor, canal o herramienta. Son contratos genéricos; el modo de
planificación puede utilizarlos, al igual que los flujos de aprobación, las
puertas de políticas del espacio de trabajo, los monitores en segundo plano, los
asistentes de configuración y los Plugins complementarios de la interfaz de
usuario.

| Método                                                                               | Contrato que controla                                                                                                                                          |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON y proyectado mediante las sesiones del Gateway                                                     |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto persistente y de ejecución exactamente una vez que se inyecta en el siguiente turno del agente para una sesión                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza, condicionada por el manifiesto y anterior a los Plugins, que puede bloquear o reescribir parámetros de herramientas     |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin modificar la implementación de la herramienta                                                      |
| `api.registerCommand(...)`                                                           | Comandos del Plugin con ámbito definido; los resultados de los comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribuciones a la interfaz de control para superficies de sesión, herramienta, ejecución, ajustes o pestañas                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Funciones de limpieza para recursos del runtime propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                        |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores de los flujos de trabajo                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución que se elimina al finalizar el ciclo de vida de la ejecución                                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para tareas del programador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host y exclusiva de Plugins incluidos, a la ruta activa de salida directa de la sesión                              |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados, respaldados por Cron y exclusivos de Plugins incluidos, además de limpieza basada en etiquetas                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                  |

Un descriptor `surface: "tab"` añade una pestaña a la barra lateral de la
interfaz de control. Los descriptores de pestañas de los Plugins activos se
anuncian a los clientes del panel en el saludo del Gateway (`controlUiTabs`), por
lo que la pestaña solo aparece mientras el Plugin está habilitado. Los Plugins
incluidos pueden proporcionar una vista de panel de primera clase para su
pestaña; otros Plugins pueden establecer `path` en una ruta HTTP del Plugin
(consulte `api.registerHttpRoute(...)`) que el panel representa en un marco
aislado. `icon` es una sugerencia de nombre de icono del panel, `group` selecciona
la sección de la barra lateral (`control` o `agent`), `order` determina el orden
entre las pestañas de los Plugins y `requiredScopes` oculta la pestaña en las
conexiones que carecen de esos ámbitos de operador:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
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

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad
obsoletos para los Plugins existentes. No añada código nuevo de Plugins que
llame directamente a `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn` o `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una función práctica con ámbito de sesión basada
en el programador Cron del Gateway. Cron controla la temporización y crea el
registro de la tarea en segundo plano cuando se ejecuta el turno; el SDK del
Plugin solo limita la sesión de destino, la nomenclatura propiedad del Plugin y
la limpieza. Utilice `api.runtime.tasks.managedFlows` dentro del turno programado
cuando el trabajo en sí necesite un estado persistente de flujo de tareas de
varios pasos.

Los contratos separan la autoridad de forma intencionada:

- Los Plugins externos pueden controlar las extensiones de sesión, los
  descriptores de la interfaz de usuario, los comandos, los metadatos de las
  herramientas, las inyecciones del turno siguiente y los hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes que los hooks
  `before_tool_call` normales y son de confianza para el host. Las políticas
  incluidas se ejecutan primero; las políticas de Plugins instalados requieren
  una habilitación explícita y sus identificadores locales en
  `contracts.trustedToolPolicies`, y se ejecutan a continuación según el orden
  de carga de los Plugins. Los identificadores de políticas están circunscritos
  al Plugin que los registra.
- La propiedad de los comandos reservados es exclusiva de los componentes
  incluidos. Los Plugins externos deben utilizar sus propios nombres de comandos
  o alias.
- `allowPromptInjection=false` deshabilita los hooks que modifican el prompt,
  incluidos `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, los campos de prompt del
  `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores ajenos al modo de planificación:

| Arquetipo de plugin                | Hooks utilizados                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación     | Extensión de sesión, continuación de comandos, inyección en el siguiente turno, descriptor de interfaz de usuario                                    |
| Control de política de presupuesto/espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                 |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida del entorno de ejecución, suscripción a eventos del agente, propiedad/limpieza del planificador de sesiones, contribución al prompt de Heartbeat, descriptor de interfaz de usuario |
| Asistente de configuración o incorporación | Extensión de sesión, comandos con ámbito, descriptor de la interfaz de usuario de control                                                  |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
  ámbito más restringido al método del Gateway. Se prefieren prefijos específicos del plugin para
  los métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins incluidos y los plugins instalados habilitados explícitamente cuyos
  contratos de manifiesto coincidan pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de su ejecución y antes de que el entorno de ejecución
  devuelva ese resultado al modelo. Este es el punto de integración de confianza e independiente del entorno de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada entorno de ejecución de destino,
por ejemplo `["openclaw", "codex"]`. Los plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; conserva
los hooks normales de los plugins de OpenClaw para tareas que no necesiten procesar el resultado
de una herramienta antes de enviarlo al modelo. Se ha eliminado la antigua
ruta de registro de fábricas de extensiones exclusiva del ejecutor integrado.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el
Gateway activo mediante un transporte de descubrimiento local, como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando el descubrimiento local está habilitado, proporciona los
puertos actuales del Gateway y los datos de indicación TXT no secretos, y llama al controlador
`stop` devuelto durante el cierre del Gateway.

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

Los plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. El descubrimiento es una indicación de enrutamiento; la autenticación del Gateway y la fijación de TLS
siguen siendo responsables de la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos propiedad del registrador
- `descriptors`: descriptores de comandos usados durante el análisis para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, se prefiere
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor de
`api.registerCli(..., { parentPath: ["nodes"] })` y explicita que comandos como
`openclaw nodes canvas` son funciones de nodo propiedad del plugin.

Si quieres que un comando de plugin mantenga la carga diferida en la ruta raíz normal de la CLI,
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
        description: "Capturar o renderizar contenido del lienzo desde un nodo emparejado",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo únicamente cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad con carga inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida durante el análisis.

### Registro de backends de la CLI

`api.registerCliBackend(...)` permite que un plugin controle la configuración predeterminada de un
backend local de CLI de IA, como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelos como `my-cli/gpt-5`.
- La `config` del backend usa la misma estructura que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, para normalizar formatos antiguos de indicadores).
- Usa `resolveExecutionArgs` para reescrituras de argv con ámbito de solicitud que pertenezcan al
  dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a un indicador de esfuerzo
  nativo. El hook recibe `ctx.executionMode`; usa `"side-question"` para añadir
  indicadores de aislamiento nativos del backend en llamadas efímeras de `/btw`. Si esos indicadores
  deshabilitan de forma fiable las herramientas nativas para una CLI que, de otro modo, siempre las tendría activadas, declara también
  `sideQuestionToolMode: "disabled"`.
- Los backends que puedan deshabilitar todas las herramientas nativas para una ejecución específica pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una tupla
  `ctx.toolAvailability.native` vacía junto con una lista exacta de permitidos de MCP aislada del host;
  `resolveExecutionArgs` debe aplicar ambas en el argv final de una ejecución nueva o reanudada.
  OpenClaw produce un fallo seguro si el backend no puede hacerlo.

Para consultar una guía de creación integral, consulta
[plugins de backend de la CLI](/es/plugins/cli-backend-plugins).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se reintentan sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Constructor de la sección de memoria del prompt                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de volcado de memoria                                                                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adaptador del entorno de ejecución de memoria                                                                                                                                                                          |

### Adaptadores obsoletos de embeddings de memoria

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder a la estructura privada de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas para plugins de memoria compatibles con sistemas heredados.
- `MemoryFlushPlan.model` puede fijar el turno de volcado a una referencia exacta de `provider/model`,
  como `ollama/qwen3:8b`, sin heredar la cadena de alternativas activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el período de migración,
  pero la inspección de plugins lo notifica como deuda de compatibilidad para
  los plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                                  |
| -------------------------------------------- | ----------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida con tipos           |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversación |

Consulta [Hooks de plugins](/es/plugins/hooks) para ver ejemplos, nombres habituales de hooks y la semántica
de las protecciones.

### Semántica de decisión de los hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución del plugin, no la
superficie de políticas de instalación del operador. Usa `security.installPolicy` cuando una decisión de
permitir/bloquear deba abarcar las rutas de instalación o actualización de la CLI y las respaldadas por el Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una sobrescritura.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una sobrescritura.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador asume el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho al modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera que no hay decisión (igual que omitir `cancel`), no una sobrescritura.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutar hilos o temas entrantes. Reserva `metadata` para datos adicionales específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específica del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio que pertenece al Gateway, en lugar de depender de hooks internos `gateway:startup`. Cron podría seguir cargándose en este punto.
- `cron_reconciled`: reconstruye una proyección externa completa de Cron después del inicio o de una recarga del planificador. Incluye `reason` y el estado efectivo `enabled`, incluso `enabled: false`, mientras que `ctx.getCron?.()` devuelve el planificador reconciliado exacto. Pasa `ctx.abortSignal` al trabajo de proyección persistente; se cancela cuando esa instantánea del planificador se sustituye o se cierra el Gateway.
- `cron_changed`: observa los cambios del ciclo de vida de Cron que pertenece al Gateway. Los eventos `scheduled` y `removed` son indicios de reconciliación posteriores a la confirmación, no un registro ordenado de diferencias. El campo `event.nextRunAtMs` de un evento programado no está presente cuando la tarea no tiene una próxima activación; un evento eliminado sigue incluyendo la instantánea de la tarea eliminada.

Los planificadores de activación externos deben aplicar antirrebote o agrupar los eventos `cron_changed`
y después volver a leer la vista persistente completa desde el último planificador capturado por
`cron_reconciled`. No adoptes el planificador de un contexto `cron_changed`: un
indicio desacoplado de un planificador anterior puede solaparse con una recarga posterior.

Usa `cron_reconciled` como desencadenante de instantánea completa para el estado persistente cargado al
iniciar el Gateway o sustituir el planificador. No se reproduce durante una recarga en caliente
exclusiva de un Plugin. Los controladores de observación se ejecutan en paralelo y los
despachos sin espera pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantén OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con sustitución persistente, reintentos/espera incremental y
cierre ordenado, consulta [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto de la API

| Campo                    | Tipo                      | Descripción                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Identificador del Plugin                                                                         |
| `api.name`               | `string`                  | Nombre para mostrar                                                                              |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                                    |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                                |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                        |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea de la configuración actual (instantánea activa del entorno de ejecución en memoria, cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin procedente de `plugins.entries.<id>.config`                  |
| `api.runtime`            | `PluginRuntime`           | [Utilidades del entorno de ejecución](/es/plugins/sdk-runtime)                                      |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la carga completa de la entrada |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del Plugin                                                  |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos de exportación agrupada locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones del entorno de ejecución solo para uso interno
  index.ts          # Punto de entrada del Plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de los Plugins incluidos cargados mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) usan preferentemente la
instantánea de configuración activa del entorno de ejecución cuando OpenClaw ya está en ejecución. Si todavía no existe una
instantánea del entorno de ejecución, recurren al archivo de configuración resuelto en disco.
Las fachadas empaquetadas de Plugins incluidos deben cargarse mediante los cargadores de fachadas de
Plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones del manifiesto
y del archivo auxiliar del entorno de ejecución que las instalaciones empaquetadas usan para el código que pertenece al Plugin.

Los Plugins de proveedor pueden exponer un archivo restringido de contrato local del Plugin cuando una
utilidad es deliberadamente específica del proveedor y todavía no corresponde a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para las utilidades de
  encabezados beta de Claude y del flujo `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  utilidades del modelo predeterminado y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor,
  además de utilidades de incorporación/configuración.

<Warning>
  El código de producción de las extensiones también debe evitar importaciones
  `openclaw/plugin-sdk/<other-plugin>`. Si una utilidad es realmente compartida, promuévela a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos Plugins.
</Warning>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Utilidades del entorno de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Configuración inicial y configuración" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Componentes internos del Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura detallada y modelo de capacidades.
  </Card>
</CardGroup>
