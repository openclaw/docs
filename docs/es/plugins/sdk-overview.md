---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia para todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Referencia de mapa de importación, API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-07-05T20:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aead8f60f1faf47f8a9bbdc6a889f5f3df7a264c6941119ece26bd26a55d25bf
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa
  [Integraciones del Gateway para apps externas](/es/gateway/external-apps) en su lugar.
</Note>

<Tip>
¿Buscas una guía práctica en su lugar? Empieza con [Creación de plugins](/es/plugins/building-plugins). Usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de arnés de agente](/es/plugins/sdk-agent-harness) para ejecutores nativos de agentes y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para helpers de entrada/compilación
específicos de canal, prefiere `openclaw/plugin-sdk/channel-core`; reserva
`openclaw/plugin-sdk/core` para la superficie paraguas más amplia y helpers
compartidos como `buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el generador genérico. Los plugins
incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para esquemas
conservados de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquemas incluidos es un
patrón para plugins nuevos.

<Warning>
  No importes puntos de integración de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deben usar esos barrels locales
  del plugin o añadir un contrato genérico estrecho del SDK cuando una necesidad sea
  realmente transversal entre canales.

Un conjunto pequeño de puntos de integración auxiliares de plugins incluidos todavía aparece en el mapa de exportación
generado cuando tienen uso rastreado por el propietario. Existen solo para el
mantenimiento de plugins incluidos y no se recomiendan como rutas de importación para plugins
nuevos de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso rastreado por el propietario. No
copies esas rutas de importación en plugins nuevos; usa helpers de runtime inyectados y
subrutas genéricas del SDK de canal en su lugar.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y helpers reservados de
plugins incluidos). Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador reside en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se generan a partir
del subconjunto público después de restar las subrutas internas/de prueba locales del repo listadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecuta
`pnpm plugin-sdk:surface` para auditar el recuento de exportaciones públicas. Las subrutas públicas
obsoletas que tienen suficiente antigüedad y no se usan en código de producción de extensiones incluidas se
rastrean en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los barrels amplios
de reexportación obsoleta se rastrean en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                         |
| `api.registerModelCatalogProvider(...)`          | Filas de catálogo de modelos para generación de texto y medios                    |
| `api.registerAgentHarness(...)`                  | Ejecutor nativo de agente [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend local de inferencia de CLI                                                |
| `api.registerChannel(...)`                       | Canal de mensajería                                                               |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de embeddings vectoriales                                  |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                     |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming                                        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz en tiempo real dúplex                                             |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video                                                    |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripción de reuniones en vivo o importada                          |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                            |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                              |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                                                               |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web                                             |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                      |
| `api.registerCompactionProvider(...)`            | Backend enchufable de compactación de transcripciones                             |

Los proveedores de embeddings registrados con `api.registerEmbeddingProvider(...)` también deben
listarse en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de embeddings para generación vectorial reutilizable. La búsqueda de memoria
puede consumir esta superficie genérica de proveedor. El punto de integración anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que todavía exponen un `batchEmbed(...)` de runtime permanecen en
el contrato existente de procesamiento por lotes por archivo, salvo que su runtime establezca explícitamente
`sourceWideBatchEmbed: true`. Esa opción permite que el host de memoria envíe fragmentos de
varios archivos de memoria sucios y fuentes habilitadas en una sola llamada `batchEmbed(...)` hasta
los límites de lote del host. Los adaptadores de lotes que suben archivos de solicitud JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto su límite de tamaño de subida como su límite de
número de solicitudes. El proveedor debe devolver un embedding por cada fragmento de entrada en el mismo orden que
`batch.chunks`; omite la marca cuando el proveedor espera lotes locales al archivo o
no puede conservar el orden de entrada en un trabajo más grande que abarca toda la fuente.

### Herramientas y comandos

Usa [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins simples solo de herramientas
con nombres de herramienta fijos. Usa `api.registerTool(...)` directamente para plugins mixtos
o registro de herramientas completamente dinámico.

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

Los comandos de plugin pueden definir `agentPromptGuidance` cuando el agente necesita una pista breve
de enrutamiento propiedad del comando. Mantén ese texto sobre el comando en sí; no añadas
política específica de proveedor o plugin a los constructores de prompts del núcleo.

Las entradas de orientación pueden ser cadenas heredadas, que se aplican a todas las superficies de prompt, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Las `surfaces` estructuradas pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omite `surfaces` para orientación intencional en todas las superficies. No
pases un arreglo `surfaces` vacío; se rechaza para que una pérdida accidental de alcance no
se convierta en texto global de prompt.

Las instrucciones de desarrollador del servidor de apps nativo de Codex son más estrictas que otras superficies de prompt:
solo la orientación explícitamente delimitada a `codex_app_server` se promueve a
ese carril de mayor prioridad. La orientación de cadenas heredadas y la orientación estructurada sin alcance
siguen disponibles para superficies de prompt no Codex por compatibilidad.

### Infraestructura

| Método                                          | Qué registra                                                 |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                               |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                    |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                       |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descubrimiento del Gateway local               |
| `api.registerCli(registrar, opts?)`             | Subcomando de CLI                                            |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de función de Node bajo `openclaw nodes`                 |
| `api.registerService(service)`                  | Servicio en segundo plano                                    |
| `api.registerInteractiveHandler(registration)`  | Manejador interactivo                                        |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en runtime          |
| `api.registerMemoryPromptSupplement(builder)`   | Sección de prompt aditiva adyacente a memoria                |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda/lectura de memoria                |
| `api.registerHostedMediaResolver(resolver)`     | Resolvedor para URL de medios alojados estilo navegador      |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts/mensajes propiedad del plugin |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el runtime del plugin |
| `api.registerMigrationProvider(provider)`       | Importador para `openclaw migrate`                           |
| `api.registerAutoEnableProbe(probe)`            | Sonda de configuración que puede habilitar automáticamente este plugin |
| `api.registerReload(registration)`              | Política de prefijo de configuración restart/hot/noop para gestionar recargas |
| `api.registerNodeHostCommand(command)`          | Manejador de comandos expuesto a nodos emparejados           |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista permitida/aprobación para comandos invocados por nodos |
| `api.registerSecurityAuditCollector(collector)` | Recolector de hallazgos para `openclaw security audit`       |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son los puntos de integración del SDK para plugins que necesitan participar en el ciclo de vida del host en lugar de solo añadir un proveedor, canal o herramienta. Son contratos genéricos; Plan Mode puede usarlos, pero también pueden hacerlo los flujos de aprobación, las puertas de política del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los plugins complementarios de UI.

| Método                                                                               | Contrato que gestiona                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON y proyectado mediante sesiones de Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de ejecución exactamente una vez, inyectado en el siguiente turno del agente para una sesión                                                                   |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramienta de confianza previa al Plugin, controlada por manifiesto, que puede bloquear o reescribir parámetros de herramienta                                      |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                                          |
| `api.registerCommand(...)`                                                           | Comandos de Plugin con ámbito; los resultados de comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución de Control UI para superficies de sesión, herramienta, ejecución, configuración o pestaña                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpieza para recursos de runtime propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                                         |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones de eventos saneadas para estado de flujo de trabajo y monitores                                                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal de Plugin por ejecución, eliminado en el ciclo de vida terminal de la ejecución                                                                                  |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del planificador propiedad del Plugin; no programa trabajo ni crea registros de tarea                                                        |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de adjuntos de archivo mediada por host, solo para plugins incluidos, hacia la ruta de sesión directa saliente activa                                                    |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron, solo para plugins incluidos, además de limpieza basada en etiquetas                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden despachar mediante el Gateway                                                                                                 |

Un descriptor `surface: "tab"` añade una pestaña de barra lateral a Control UI. Los descriptores de pestaña de plugins activos se anuncian a los clientes del panel en el hello de gateway (`controlUiTabs`), por lo que la pestaña aparece solo mientras el plugin está habilitado. Los plugins incluidos pueden distribuir una vista de panel de primera clase para su pestaña; otros plugins pueden establecer `path` en una ruta HTTP de Plugin (consulta `api.registerHttpRoute(...)`) que el panel renderiza en un marco aislado. `icon` es una sugerencia de nombre de icono del panel, `group` elige la sección de la barra lateral (`control` o `agent`), `order` ordena entre pestañas de Plugin y `requiredScopes` oculta la pestaña a conexiones que no tengan esos ámbitos de operador:

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

Usa los espacios de nombres agrupados para código nuevo de Plugin:

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

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad obsoletos para plugins existentes. No añadas código nuevo de Plugin que llame directamente a `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` o `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una comodidad con ámbito de sesión sobre el planificador Cron de Gateway. Cron gestiona el tiempo y crea el registro de tarea en segundo plano cuando se ejecuta el turno; el SDK de Plugin solo restringe la sesión de destino, la nomenclatura propiedad del Plugin y la limpieza. Usa `api.runtime.tasks.managedFlows` dentro del turno programado cuando el trabajo en sí necesite estado duradero de Task Flow de varios pasos.

Los contratos separan intencionalmente la autoridad:

- Los plugins externos pueden gestionar extensiones de sesión, descriptores de UI, comandos, metadatos de herramientas, inyecciones de siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes que los hooks ordinarios `before_tool_call` y son de confianza del host. Las políticas incluidas se ejecutan primero; las políticas de plugins instalados requieren habilitación explícita más sus ids locales en `contracts.trustedToolPolicies`, y se ejecutan después en el orden de carga de plugins. Los ids de política tienen ámbito del Plugin que los registra.
- La propiedad de comandos reservados es solo para plugins incluidos. Los plugins externos deben usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` deshabilita hooks que mutan prompts, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, campos de prompt del `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de Plugin                   | Hooks usados                                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de aprobación                   | Extensión de sesión, continuación de comando, inyección de siguiente turno, descriptor de UI                                            |
| Puerta de política de presupuesto/espacio de trabajo | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción a eventos de agente, propiedad/limpieza del planificador de sesión, contribución de prompt de Heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de Control UI                                                                   |

<Note>
  Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un ámbito de método de gateway
  más restringido. Prefiere prefijos específicos del Plugin para los métodos
  propiedad del Plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultado de herramienta">
  Los plugins incluidos y los plugins instalados habilitados explícitamente con contratos de manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando necesitan reescribir un resultado de herramienta después de la ejecución y antes de que el runtime devuelva ese resultado al modelo. Este es el punto de integración de confianza y neutral respecto al runtime para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada runtime de destino, por ejemplo `["openclaw", "codex"]`. Los plugins instalados sin ese contrato, o sin habilitación explícita, no pueden registrar este middleware; conserva los hooks normales de Plugin de OpenClaw para trabajo que no necesite temporización de resultado de herramienta previa al modelo. Se ha eliminado la antigua ruta de registro de fábrica de extensión exclusiva del ejecutor embebido.
</Accordion>

### Registro de descubrimiento de Gateway

`api.registerGatewayDiscoveryService(...)` permite a un plugin anunciar el Gateway activo en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al servicio durante el arranque de Gateway cuando el descubrimiento local está habilitado, pasa los puertos actuales de Gateway y datos de sugerencia TXT no secretos, y llama al manejador `stop` devuelto durante el apagado de Gateway.

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

Los plugins de descubrimiento de Gateway no deben tratar los valores TXT anunciados como secretos ni autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación de Gateway y la fijación de TLS siguen gestionando la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comando explícitos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de CLI,
  el enrutamiento y el registro diferido de CLI de Plugin
- `parentPath`: ruta opcional de comando padre para grupos de comandos anidados, como
  `["nodes"]`

Para funcionalidades de nodo emparejado, prefiere `api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño envoltorio alrededor de `api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como `openclaw nodes canvas` sean funcionalidades de nodo explícitas propiedad del Plugin.

Si quieres que un comando de Plugin permanezca cargado de forma diferida en la ruta normal de la CLI raíz, proporciona `descriptors` que cubran cada raíz de comando de nivel superior expuesta por ese registrador.

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

Los comandos anidados reciben el comando padre resuelto como `program`:

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo únicamente cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro del backend de CLI

`api.registerCliBackend(...)` permite que un plugin sea dueño de la configuración predeterminada para un backend
de CLI de IA local, como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo de proveedor en referencias de modelo como `my-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv con alcance de solicitud que pertenezcan al
  dialecto de la CLI, como mapear los niveles de razonamiento de OpenClaw a un flag de esfuerzo nativo.
  El hook recibe `ctx.executionMode`; usa `"side-question"` para añadir
  flags de aislamiento nativos del backend para llamadas efímeras de `/btw`. Si esos flags
  deshabilitan de forma fiable las herramientas nativas para una CLI que de otro modo siempre las tiene activadas, declara también
  `sideQuestionToolMode: "disabled"`.

Para una guía de autoría de extremo a extremo, consulta
[plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las callbacks de ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se reintentan sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                                                                            |

### Adaptadores de embeddings de memoria obsoletos

| Método                                         | Qué registra                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con legado.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`,
  como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante la ventana de migración,
  pero la inspección de plugins informa esto como deuda de compatibilidad para
  plugins no integrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado  |
| `api.onConversationBindingResolved(handler)` | Callback de vinculación de conversación |

Consulta [hooks de plugins](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y
semántica de guardas.

### Semántica de decisión de hooks

`before_install` es un hook de ciclo de vida del runtime de plugins, no la superficie de
política de instalación del operador. Usa `security.installPolicy` cuando una decisión de permitir/bloquear deba
cubrir rutas de instalación o actualización respaldadas por CLI y Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier handler reclama el envío, se omiten los handlers de menor prioridad y la ruta predeterminada de envío al modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como sin decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento de hilos/temas entrantes. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específica del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad de Gateway en lugar de depender de hooks internos de `gateway:startup`.
- `cron_changed`: observa cambios de ciclo de vida de cron propiedad de Gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar programadores de activación externos, y mantén OpenClaw como la fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                               |
| `api.name`               | `string`                  | Nombre visible                                                                              |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                               |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                           |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                   |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                       |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuración actual (snapshot activo en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                             |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins integrados cargados por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren el
snapshot activo de configuración del runtime cuando OpenClaw ya está en ejecución. Si aún no existe ningún snapshot
de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de plugins integrados empaquetados deben cargarse mediante los cargadores de fachadas de plugins de OpenClaw;
las importaciones directas desde `dist/extensions/...` omiten el manifiesto
y las comprobaciones de sidecar de runtime que las instalaciones empaquetadas usan para código propiedad del plugin.

Los plugins de proveedores pueden exponer un barrel de contrato estrecho y local al plugin cuando un
helper es intencionadamente específico del proveedor y todavía no pertenece a una subruta genérica del SDK.
Ejemplos integrados:

- **Anthropic**: unión pública `api.ts` / `contract-api.ts` para helpers de streaming de
  encabezado beta de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  helpers de modelos predeterminados y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  más helpers de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper se comparte de verdad, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Testing" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
