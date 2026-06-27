---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T12:27:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de Plugin es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia sobre **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa
  [Integraciones de Gateway para aplicaciones externas](/es/gateway/external-apps) en su lugar.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Crear plugins](/es/plugins/building-plugins), usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para plugins de proveedor, [Plugins de backend CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA y [Hooks de Plugin](/es/plugins/hooks) para plugins de herramienta o de hook de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para helpers de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie general más amplia y helpers compartidos como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el generador genérico. Los plugins
incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
retenidos de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna de las subrutas de esquema incluido es un
patrón para plugins nuevos.

<Warning>
  No importes seams de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels locales
  del plugin o añadir un contrato genérico estrecho del SDK cuando la necesidad sea realmente
  transversal a canales.

Un conjunto pequeño de seams de helpers de plugins incluidos aún aparece en el mapa de exportación generado
cuando tienen uso de propietario rastreado. Existen solo para el mantenimiento de plugins incluidos
y no se recomiendan como rutas de importación para nuevos plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso de propietario rastreado. No
copies esas rutas de importación en plugins nuevos; usa helpers de runtime inyectados y
subrutas genéricas del SDK de canal en su lugar.
</Warning>

## Referencia de subrutas

El SDK de Plugin se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de plugin,
canal, proveedor, autenticación, runtime, capability, memoria y helpers reservados
de plugins incluidos). Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador vive en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se generan a partir
del subconjunto público tras restar las subrutas locales de pruebas/internas del repo listadas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecuta
`pnpm plugin-sdk:surface` para auditar el recuento de exportaciones públicas. Las subrutas públicas
obsoletas que son lo bastante antiguas y no usadas por código de producción de extensiones incluidas se
rastrean en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los barrels amplios
obsoletos de reexportación se rastrean en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capability

| Método                                           | Qué registra                                      |
| ------------------------------------------------ | ------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                         |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agente de bajo nivel     |
| `api.registerCliBackend(...)`                    | Backend local de inferencia CLI                   |
| `api.registerChannel(...)`                       | Canal de mensajería                               |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de embeddings vectoriales  |
| `api.registerSpeechProvider(...)`                | Texto a voz / síntesis STT                        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real             |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video                    |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                            |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                              |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                               |
| `api.registerWebFetchProvider(...)`              | Proveedor de captura / scraping web               |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                      |

Los proveedores de embeddings registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de embeddings para generación vectorial reutilizable. La búsqueda de memoria
puede consumir esta superficie genérica de proveedor. El seam anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es compatibilidad obsoleta mientras migran
los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que aún exponen un runtime `batchEmbed(...)` permanecen en
el contrato existente de procesamiento por lotes por archivo, a menos que su runtime establezca explícitamente
`sourceWideBatchEmbed: true`. Esa opción permite que el host de memoria envíe fragmentos de
varios archivos de memoria sucios y fuentes habilitadas en una llamada `batchEmbed(...)`
hasta los límites de lote del host. Los adaptadores de lotes que suben archivos de solicitud JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto su límite de tamaño de subida como
su límite de cantidad de solicitudes. El proveedor debe devolver un embedding por cada fragmento de entrada
en el mismo orden que `batch.chunks`; omite la marca cuando el proveedor espera lotes locales al archivo o
no puede preservar el orden de entrada en un trabajo más grande a nivel de fuente.

### Herramientas y comandos

Usa [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins simples solo de herramientas
con nombres de herramientas fijos. Usa `api.registerTool(...)` directamente para plugins mixtos
o registro de herramientas completamente dinámico.

| Método                          | Qué registra                                       |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)               |

Los comandos de plugin pueden establecer `agentPromptGuidance` cuando el agente necesita una pista breve
de enrutamiento propiedad del comando. Mantén ese texto sobre el comando en sí; no añadas
política específica de proveedor o plugin a los generadores de prompts del núcleo.

Las entradas de guía pueden ser cadenas heredadas, que se aplican a toda superficie de prompt, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Las `surfaces` estructuradas pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omite `surfaces` para guía intencional de todas las superficies. No
pases un arreglo `surfaces` vacío; se rechaza para que una pérdida accidental de alcance no
se convierta en texto global de prompt.

Las instrucciones de desarrollador nativas del servidor de aplicaciones de Codex son más estrictas que otras superficies de prompt:
solo la guía con alcance explícito a `codex_app_server` se promueve a
ese carril de mayor prioridad. La guía heredada en forma de cadena y la guía estructurada sin alcance
siguen disponibles para superficies de prompt no Codex por compatibilidad.

### Infraestructura

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                                    |
| `api.registerHttpRoute(params)`                | Endpoint HTTP de Gateway                          |
| `api.registerGatewayMethod(name, handler)`     | Método RPC de Gateway                             |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descubrimiento local de Gateway     |
| `api.registerCli(registrar, opts?)`            | Subcomando CLI                                    |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de función de Node bajo `openclaw nodes`      |
| `api.registerService(service)`                 | Servicio en segundo plano                         |
| `api.registerInteractiveHandler(registration)` | Manejador interactivo                             |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime para resultado de herramienta |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria     |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria     |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son los seams del SDK para plugins que necesitan participar en el ciclo de vida
del host en lugar de solo añadir un proveedor, canal o herramienta. Son
contratos genéricos; Plan Mode puede usarlos, pero también flujos de aprobación,
compuertas de política de workspace, monitores en segundo plano, asistentes de configuración y plugins
complementarios de UI.

| Método                                                                               | Contrato que controla                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON, proyectado a través de sesiones del Gateway                           |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de exactamente una vez inyectado en el siguiente turno del agente para una sesión                                |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramienta confiable previa al plugin, controlada por manifiesto, que puede bloquear o reescribir parámetros de herramientas |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                            |
| `api.registerCommand(...)`                                                           | Comandos de plugin con ámbito; los resultados de comandos pueden establecer `continueAgent: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución de la interfaz de control para superficies de sesión, herramienta, ejecución o configuración          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpieza para recursos de runtime propiedad del plugin en rutas de restablecimiento/eliminación/recarga              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para estado de flujo de trabajo y monitores                                                       |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal de plugin por ejecución que se limpia en el ciclo de vida terminal de la ejecución                                 |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del programador propiedad del plugin; no programa trabajo ni crea registros de tareas          |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host, solo para plugins incluidos, a la ruta activa de sesión saliente directa         |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron, solo para plugins incluidos, además de limpieza basada en etiquetas             |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden despachar a través del Gateway                                                  |

Usa los espacios de nombres agrupados para el nuevo código de plugins:

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
obsoletos para plugins existentes. No agregues nuevo código de plugin que llame
directamente a `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` o
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una comodidad con ámbito de sesión sobre el
programador Cron del Gateway. Cron controla los tiempos y crea el registro de
tarea en segundo plano cuando se ejecuta el turno; el Plugin SDK solo restringe
la sesión de destino, los nombres propiedad del plugin y la limpieza. Usa
`api.runtime.tasks.managedFlows` dentro del turno programado cuando el trabajo
en sí necesita estado duradero de TaskFlow de varios pasos.

Los contratos separan la autoridad de forma intencional:

- Los plugins externos pueden controlar extensiones de sesión, descriptores de
  UI, comandos, metadatos de herramientas, inyecciones de siguiente turno y
  hooks normales.
- Las políticas de herramientas confiables se ejecutan antes que los hooks
  ordinarios `before_tool_call` y son confiables para el host. Las políticas
  incluidas se ejecutan primero; las políticas de plugins instalados requieren
  habilitación explícita más sus id locales en
  `contracts.trustedToolPolicies`, y luego se ejecutan en orden de carga de
  plugins. Los id de política tienen ámbito del plugin que los registra.
- La propiedad de comandos reservados es solo para plugins incluidos. Los
  plugins externos deberían usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` deshabilita hooks que mutan el prompt, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt del `before_agent_start` heredado y
  `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de plugin            | Hooks usados                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de aprobación            | Extensión de sesión, continuación de comando, inyección de siguiente turno, descriptor de UI                                        |
| Puerta de política de presupuesto/espacio de trabajo | Política de herramienta confiable, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida del runtime, suscripción a eventos del agente, propiedad/limpieza del programador de sesión, contribución al prompt de Heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de la interfaz de control                                               |

<Note>
  Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
  ámbito de método de gateway más estrecho. Prefiere prefijos específicos del plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultado de herramienta">
  Los plugins incluidos y los plugins instalados habilitados explícitamente con
  contratos de manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesitan reescribir el resultado de una herramienta después de la ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Esta es la integración confiable e independiente del runtime
  para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada
runtime objetivo, por ejemplo `["openclaw", "codex"]`. Los plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; conserva
los hooks normales de plugins de OpenClaw para trabajo que no necesita sincronización
de resultado de herramienta previa al modelo. Se eliminó la antigua ruta de registro
de fábrica de extensión exclusiva del ejecutor incrustado.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el
Gateway activo en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando el descubrimiento local está habilitado, pasa los
puertos actuales del Gateway y datos de pista TXT no secretos, y llama al manejador
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

Los plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos ni
autenticación. El descubrimiento es una pista de enrutamiento; la autenticación del Gateway y la fijación
TLS siguen siendo responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comando:

- `commands`: nombres de comando explícitos propiedad del registrador
- `descriptors`: descriptores de comando en tiempo de análisis usados para la ayuda de CLI,
  el enrutamiento y el registro diferido de CLI de plugins
- `parentPath`: ruta de comando padre opcional para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, prefiere
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño wrapper alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de nodo explícitas propiedad del plugin.

Si quieres que un comando de plugin permanezca con carga diferida en la ruta CLI raíz normal,
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

Usa `commands` por sí solo únicamente cuando no necesites registro diferido de CLI raíz.
Esa ruta de compatibilidad ansiosa sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para carga diferida en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin controle la configuración predeterminada para un backend
local de CLI de IA como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo de proveedor en referencias de modelo como `my-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesita reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv con ámbito de solicitud que pertenecen
  al dialecto de CLI, como mapear niveles de pensamiento de OpenClaw a un flag nativo de esfuerzo.
  El hook recibe `ctx.executionMode`; usa `"side-question"` para agregar
  flags de aislamiento nativos del backend para llamadas efímeras `/btw`. Si esos flags
  deshabilitan de forma fiable herramientas nativas para una CLI que de otro modo siempre está activa, declara
  también `sideQuestionToolMode: "disabled"`.

Para una guía de autoría de extremo a extremo, consulta
[plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se reintentan sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor de plan de vaciado de memoria                                                                                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                                                                                   |

### Adaptadores de embeddings de memoria obsoletos

| Método                                         | Qué registra                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para Plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  Plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de Plugins de memoria compatibles con legado.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`,
  como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores específicos de memoria existentes siguen funcionando durante la ventana
  de migración, pero la inspección de plugins informa esto como deuda de compatibilidad para
  plugins no integrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado     |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de enlace de conversación |

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres de hooks comunes y semántica de protección.

### Semántica de decisiones de hooks

`before_install` es un hook de ciclo de vida del runtime de Plugin, no la superficie
de política de instalación del operador. Usa `security.installPolicy` cuando una decisión de permitir/bloquear deba
cubrir rutas de instalación o actualización respaldadas por CLI y Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, los controladores de menor prioridad se omiten.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, los controladores de menor prioridad se omiten.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador reclama el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho al modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, los controladores de menor prioridad se omiten.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de arranque propiedad del Gateway en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa los cambios del ciclo de vida de Cron propiedad del Gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar planificadores externos de activación, y mantén OpenClaw como la fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id. de Plugin                                                                               |
| `api.name`               | `string`                  | Nombre visible                                                                              |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                               |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                           |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                   |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                       |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa del runtime en memoria cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes de runtime](/es/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del Plugin                                               |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barrel locales para las importaciones internas:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de Plugins integrados cargados por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea de configuración activa del runtime cuando OpenClaw ya está en ejecución. Si aún no existe
una instantánea de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de Plugins integrados empaquetados deben cargarse mediante los cargadores de fachada
de Plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten el manifiesto
y las comprobaciones de sidecar de runtime que las instalaciones empaquetadas usan para el código propiedad del Plugin.

Los Plugins de proveedor pueden exponer un barrel de contrato estrecho y local al Plugin cuando un
ayudante es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplos integrados:

- **Anthropic**: superficie pública `api.ts` / `contract-api.ts` para ayudantes de streaming de
  encabezado beta de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  ayudantes de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  más ayudantes de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un ayudante es realmente compartido, promuévelo a una subruta neutral del SDK
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
  <Card title="Configuración e instalación" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Internos de Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
