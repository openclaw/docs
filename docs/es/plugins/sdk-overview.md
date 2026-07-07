---
read_when:
    - Debe saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Referencia de arquitectura del SDK, API de registro y mapa de importación
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-07-06T21:51:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2c03d5321285292bfcb2d241b158e59be1a43e5b75bf5ca92a57bf63d9a791f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa
  [integraciones de Gateway para aplicaciones externas](/es/gateway/external-apps) en su lugar.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Crear plugins](/es/plugins/building-plugins). Usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend CLI](/es/plugins/cli-backend-plugins) para backends de CLI de IA locales, [Plugins de arnés de agente](/es/plugins/sdk-agent-harness) para ejecutores de agente nativos y [Hooks de Plugin](/es/plugins/hooks) para hooks de herramientas o de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para ayudantes de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie general más amplia y los ayudantes compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el constructor genérico. Los plugins
incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas de canales incluidos
conservados. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquema incluido es un
patrón para plugins nuevos.

<Warning>
  No importes interfaces de conveniencia con marca de proveedor o canal (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deben usar esos barrels locales
  del plugin o añadir un contrato genérico estrecho del SDK cuando la necesidad sea realmente
  transversal a canales.

Un pequeño conjunto de interfaces auxiliares de plugins incluidos todavía aparece en el mapa de exportaciones
generado cuando tienen uso de propietario rastreado. Existen solo para el mantenimiento de plugins
incluidos y no se recomiendan como rutas de importación para nuevos plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso de propietario rastreado. No
copies esas rutas de importación en plugins nuevos; usa ayudantes de runtime inyectados y
subrutas genéricas del SDK de canales en su lugar.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y ayudantes reservados de plugins
incluidos). Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths).

El inventario de entrypoints del compilador vive en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquete se generan a partir
del subconjunto público después de restar las subrutas locales del repositorio para pruebas/internas listadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecuta
`pnpm plugin-sdk:surface` para auditar el recuento de exportaciones públicas. Las subrutas públicas
obsoletas que son lo suficientemente antiguas y no son usadas por código de producción de extensiones incluidas se
rastrean en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los barrels amplios
obsoletos de reexportación se rastrean en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                          |
| `api.registerModelCatalogProvider(...)`          | Filas de catálogo de modelos para generación de texto y medios                     |
| `api.registerAgentHarness(...)`                  | Ejecutor de agente nativo [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend de inferencia de CLI local                                                 |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de embeddings vectoriales                                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming                                         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz en tiempo real dúplex                                              |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video                                                     |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripción de reuniones en vivo o importada                           |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                             |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                               |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                                                                |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / extracción web                                            |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend conectable de Compaction de transcripciones                                |

Los proveedores de embeddings registrados con `api.registerEmbeddingProvider(...)` también deben
estar listados en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de embeddings para generación vectorial reutilizable. La búsqueda de memoria
puede consumir esta superficie genérica de proveedor. La interfaz anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es compatibilidad obsoleta mientras
migran los proveedores específicos de memoria existentes.

Los proveedores específicos de memoria que todavía exponen un `batchEmbed(...)` de runtime permanecen en
el contrato existente de procesamiento por lotes por archivo, a menos que su runtime establezca explícitamente
`sourceWideBatchEmbed: true`. Esa opción permite al host de memoria enviar fragmentos de
varios archivos de memoria sucios y fuentes habilitadas en una llamada `batchEmbed(...)` hasta
los límites de lote del host. Los adaptadores de lote que suben archivos de solicitudes JSONL también deben
dividir los trabajos del proveedor antes de su límite de tamaño de subida y de su límite de recuento de solicitudes.
El proveedor debe devolver un embedding por fragmento de entrada en el mismo orden que
`batch.chunks`; omite la marca cuando el proveedor espera lotes locales al archivo o
no puede preservar el orden de entrada en un trabajo más grande a nivel de fuente.

### Herramientas y comandos

Usa [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins simples solo de herramientas
con nombres de herramienta fijos. Usa `api.registerTool(...)` directamente para plugins mixtos
o registro de herramientas completamente dinámico.

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

Los comandos de plugin pueden establecer `agentPromptGuidance` cuando el agente necesita una pista de enrutamiento
breve propiedad del comando. Mantén ese texto centrado en el comando en sí; no añadas
política específica del proveedor o del plugin a los constructores de prompts del núcleo.

Las entradas de guía pueden ser cadenas heredadas, que se aplican a todas las superficies de prompt, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Las `surfaces` estructuradas pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` permanece como un alias obsoleto
de `openclaw_main`. Omite `surfaces` para guías intencionalmente aplicadas a todas las superficies. No
pases un array `surfaces` vacío; se rechaza para que una pérdida accidental de alcance no
se convierta en texto de prompt global.

Las instrucciones de desarrollador nativas del servidor de aplicaciones de Codex son más estrictas que otras superficies de
prompt: solo la guía con alcance explícito a `codex_app_server` se promueve a
ese carril de mayor prioridad. La guía de cadenas heredadas y la guía estructurada sin alcance
siguen disponibles para superficies de prompt que no son de Codex por compatibilidad.

### Infraestructura

| Método                                          | Qué registra                                                  |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                                |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP de Gateway                                      |
| `api.registerGatewayMethod(name, handler)`      | Método RPC de Gateway                                         |
| `api.registerGatewayDiscoveryService(service)`  | Anunciador de descubrimiento de Gateway local                 |
| `api.registerCli(registrar, opts?)`             | Subcomando de CLI                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de funcionalidad de Node bajo `openclaw nodes`            |
| `api.registerService(service)`                  | Servicio en segundo plano                                     |
| `api.registerInteractiveHandler(registration)`  | Manejador interactivo                                         |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas de runtime           |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva de prompt adyacente a memoria                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda/lectura de memoria                 |
| `api.registerHostedMediaResolver(resolver)`     | Resolver para URLs de medios alojados de estilo navegador     |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts/mensajes propiedad del plugin |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el runtime del plugin |
| `api.registerMigrationProvider(provider)`       | Importador para `openclaw migrate`                            |
| `api.registerAutoEnableProbe(probe)`            | Prueba de configuración que puede habilitar automáticamente este plugin |
| `api.registerReload(registration)`              | Política de prefijo de configuración para reinicio/recarga/noop al manejar recargas |
| `api.registerNodeHostCommand(command)`          | Manejador de comandos expuesto a nodos emparejados            |
| `api.registerNodeInvokePolicy(policy)`          | Política de allowlist/aprobación para comandos invocados por nodos |
| `api.registerSecurityAuditCollector(collector)` | Colector de hallazgos para `openclaw security audit`          |

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para enrutar texto por la ruta normal de agente entrante de Telegram después de que el controlador se complete correctamente. OpenClaw conserva el botón de devolución de llamada cuando la política entrante omite el texto o falla el procesamiento, de modo que el usuario pueda reintentar después de que cambie la condición de bloqueo. Este campo de resultado es específico de Telegram; otros canales conservan sus propios contratos de resultado interactivo.

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son los puntos de integración del SDK para plugins que necesitan participar en el ciclo de vida del host en lugar de solo agregar un proveedor, canal o herramienta. Son contratos genéricos; el Modo Plan puede usarlos, pero también los flujos de aprobación, las barreras de política de espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los plugins complementarios de UI.

| Método                                                                               | Contrato del que es responsable                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del plugin, compatible con JSON, proyectado mediante sesiones de Gateway                                                        |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de exactamente una vez inyectado en el siguiente turno del agente para una sesión                                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramienta de confianza previa al plugin, protegida por manifiesto, que puede bloquear o reescribir parámetros de herramienta                  |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                    |
| `api.registerCommand(...)`                                                           | Comandos de plugin con ámbito; los resultados de comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución de Control UI para superficies de sesión, herramienta, ejecución, configuración o pestaña                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpieza para recursos de runtime propiedad del plugin en rutas de restablecimiento, eliminación o recarga                                    |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones de eventos saneadas para estado de flujo de trabajo y monitores                                                                               |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal de plugin por ejecución, borrado en el ciclo de vida terminal de la ejecución                                                              |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para jobs del planificador propiedad del plugin; no programa trabajo ni crea registros de tareas                                     |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de adjuntos de archivo mediada por host, solo para plugins incluidos, a la ruta de sesión directa saliente activa                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron, solo para plugins incluidos, además de limpieza basada en etiquetas                                     |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden despachar mediante el Gateway                                                                            |

Un descriptor `surface: "tab"` agrega una pestaña de barra lateral a Control UI. Los descriptores de pestaña de los plugins activos se anuncian a los clientes del panel en el saludo del gateway (`controlUiTabs`), por lo que la pestaña aparece solo mientras el plugin está habilitado. Los plugins incluidos pueden enviar una vista de panel de primera clase para su pestaña; otros plugins pueden establecer `path` en una ruta HTTP del plugin (consulta `api.registerHttpRoute(...)`) que el panel renderiza en un marco aislado. `icon` es una sugerencia de nombre de icono del panel, `group` elige la sección de la barra lateral (`control` o `agent`), `order` ordena entre pestañas de plugins, y `requiredScopes` oculta la pestaña a conexiones que no tengan esos ámbitos de operador:

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

Usa los espacios de nombres agrupados para el código nuevo de plugins:

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

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad obsoletos para plugins existentes. No agregues código nuevo de plugin que llame directamente a `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` o `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una comodidad con ámbito de sesión sobre el planificador Cron del Gateway. Cron es responsable del temporizado y crea el registro de tarea en segundo plano cuando se ejecuta el turno; el SDK de Plugin solo restringe la sesión de destino, la nomenclatura propiedad del plugin y la limpieza. Usa `api.runtime.tasks.managedFlows` dentro del turno programado cuando el propio trabajo necesite estado duradero de Task Flow de varios pasos.

Los contratos dividen la autoridad intencionalmente:

- Los plugins externos pueden ser responsables de extensiones de sesión, descriptores de UI, comandos, metadatos de herramientas, inyecciones de siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes que los hooks ordinarios `before_tool_call` y son de confianza para el host. Las políticas incluidas se ejecutan primero; las políticas de plugins instalados requieren habilitación explícita más sus ids locales en `contracts.trustedToolPolicies`, y se ejecutan después en el orden de carga de plugins. Los ids de política tienen ámbito en el plugin que los registra.
- La propiedad de comandos reservados es solo para plugins incluidos. Los plugins externos deben usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` deshabilita hooks que mutan el prompt, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, campos de prompt de `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de plugin           | Hooks usados                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de aprobación           | Extensión de sesión, continuación de comando, inyección de siguiente turno, descriptor de UI                                            |
| Barrera de política de presupuesto/espacio de trabajo | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                                    |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción de eventos de agente, propiedad/limpieza del planificador de sesión, contribución de prompt de heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de Control UI                                                                       |

<Note>
  Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, aunque un plugin intente asignar un
  ámbito de método de gateway más estrecho. Prefiere prefijos específicos de plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultado de herramienta">
  Los plugins incluidos y los plugins instalados habilitados explícitamente con contratos de manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando necesiten reescribir un resultado de herramienta después de la ejecución y antes de que el runtime devuelva ese resultado al modelo. Este es el punto de integración de confianza y neutral respecto al runtime para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada runtime objetivo, por ejemplo `["openclaw", "codex"]`. Los plugins instalados sin ese contrato, o sin habilitación explícita, no pueden registrar este middleware; conserva los hooks normales de plugin de OpenClaw para trabajo que no necesite temporización de resultado de herramienta previa al modelo. Se eliminó la ruta antigua de registro de fábrica de extensiones solo para el runner integrado.
</Accordion>

### Registro de descubrimiento de Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el Gateway activo en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al servicio durante el arranque del Gateway cuando el descubrimiento local está habilitado, pasa los puertos actuales del Gateway y datos de sugerencia TXT no secretos, y llama al controlador `stop` devuelto durante el apagado del Gateway.

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

Los plugins de descubrimiento de Gateway no deben tratar los valores TXT anunciados como secretos ni como autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen siendo responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comando:

- `commands`: nombres de comando explícitos propiedad del registrador
- `descriptors`: descriptores de comando en tiempo de análisis usados para ayuda de CLI, enrutamiento y registro diferido de CLI de plugins
- `parentPath`: ruta opcional de comando padre para grupos de comandos anidados, como `["nodes"]`

Para características de nodos emparejados, prefiere `api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño wrapper alrededor de `api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como `openclaw nodes canvas` sean características de nodo explícitas propiedad del plugin.

Si quieres que un comando de plugin permanezca cargado de forma diferida en la ruta normal de CLI raíz, proporciona `descriptors` que cubran cada raíz de comando de nivel superior expuesta por ese registrador.

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo únicamente cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad anticipada sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada de un backend
local de CLI de IA como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo de proveedor en referencias de modelo como `my-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv con alcance de solicitud que pertenecen al
  dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a una flag nativa de esfuerzo.
  El hook recibe `ctx.executionMode`; usa `"side-question"` para agregar
  flags de aislamiento nativas del backend para llamadas efímeras de `/btw`. Si esas flags
  deshabilitan de forma fiable las herramientas nativas para una CLI que de otro modo siempre las tendría activadas, declara
  también `sideQuestionToolMode: "disabled"`.

Para una guía de autoría de extremo a extremo, consulta
[plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las callbacks de ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se reintentan sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plan de vaciado de memoria                                                                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                                                               |

### Adaptadores de embedding de memoria obsoletos

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que plugins complementarios consuman artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas heredadas compatibles para plugins de memoria.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de
  `provider/model`, como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embedding
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores específicos de memoria existentes siguen funcionando durante la ventana
  de migración, pero la inspección de plugins lo informa como deuda de compatibilidad para
  plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                        |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado    |
| `api.onConversationBindingResolved(handler)` | Callback de enlace de conversación |

Consulta [hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y
semántica de guardas.

### Semántica de decisión de hooks

`before_install` es un hook de ciclo de vida del runtime de plugins, no la superficie de
política de instalación del operador. Usa `security.installPolicy` cuando una decisión de permitir/bloquear deba
cubrir rutas de instalación o actualización respaldadas por CLI y Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, los handlers de menor prioridad se omiten.
- `before_tool_call`: devolver `{ block: false }` se trata como ninguna decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, los handlers de menor prioridad se omiten.
- `before_install`: devolver `{ block: false }` se trata como ninguna decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier handler reclama el despacho, los handlers de menor prioridad y la ruta predeterminada de despacho del modelo se omiten.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier handler lo establece, los handlers de menor prioridad se omiten.
- `message_sending`: devolver `{ cancel: false }` se trata como ninguna decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad del gateway, en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa los cambios de ciclo de vida de cron propiedad del gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar programadores de activación externos, y mantén OpenClaw como la fuente de verdad para comprobaciones de vencimiento y ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                         |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id de plugin                                                                                        |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                 |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                       |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                                   |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                           |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                               |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea de runtime activa en memoria cuando esté disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin de `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                          |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del plugin                                                       |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para importaciones internas:

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
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargados por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea de configuración del runtime activo cuando OpenClaw ya está en ejecución. Si aún no existe
una instantánea de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas de plugins
de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten el manifiesto
y las comprobaciones de sidecar de runtime que las instalaciones empaquetadas usan para el código propiedad del plugin.

Los plugins de proveedor pueden exponer un barrel de contrato estrecho y local al plugin cuando un
helper es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: unión pública `api.ts` / `contract-api.ts` para helpers de flujo de
  encabezado beta de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  helpers de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  más helpers de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones de
  `openclaw/plugin-sdk/<other-plugin>`. Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Ayudantes de runtime" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Configuración inicial y config" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de config.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Aspectos internos del Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
