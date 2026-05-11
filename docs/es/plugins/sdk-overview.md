---
read_when:
    - Es necesario saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-05-11T20:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia sobre **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa en su lugar el
  [SDK de apps de OpenClaw](/es/concepts/openclaw-sdk) y el paquete `@openclaw/sdk`.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Creación de plugins](/es/plugins/building-plugins), usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para plugins de proveedor, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA y [Hooks de plugins](/es/plugins/hooks) para plugins de herramientas o hooks de ciclo de vida.
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
retenidos de canales incluidos. Las exportaciones de compatibilidad obsoletas
permanecen en `plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquema
incluido es un patrón para plugins nuevos.

<Warning>
  No importes seams de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios
  barrels `api.ts` / `runtime-api.ts`; los consumidores del núcleo deben usar esos
  barrels locales del plugin o añadir un contrato SDK genérico y estrecho cuando una
  necesidad sea realmente transversal entre canales.

Un conjunto pequeño de seams auxiliares de plugins incluidos sigue apareciendo en el
mapa de exportación generado cuando tiene uso rastreado por propietarios. Existen solo
para mantenimiento de plugins incluidos y no son rutas de importación recomendadas
para nuevos plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso rastreado por
propietarios. No copies esas rutas de importación en plugins nuevos; usa en su lugar
helpers de runtime inyectados y subrutas genéricas del SDK de canal.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas estrechas agrupadas por área
(entrada de plugin, canal, proveedor, autenticación, runtime, capacidad, memoria y
helpers reservados de plugins incluidos). Para ver el catálogo completo, agrupado y
enlazado, consulta [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de entrypoints del compilador está en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones de paquetes se generan a
partir del subconjunto público tras restar las subrutas locales de prueba/internas del
repositorio enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecuta
`pnpm plugin-sdk:surface` para auditar el recuento de exportaciones públicas. Las
subrutas públicas obsoletas con suficiente antigüedad y sin uso en código de
producción de extensiones incluidas se rastrean en
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los barrels amplios de
reexportación obsoletos se rastrean en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor de agentes experimental de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia de CLI    |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                         | Qué registra                                     |
| ------------------------------ | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)             |

Los comandos de plugin pueden establecer `agentPromptGuidance` cuando el agente
necesita una pista breve de enrutamiento propiedad del comando. Mantén ese texto
sobre el propio comando; no añadas políticas específicas de proveedor o plugin a los
generadores de prompts del núcleo.

### Infraestructura

| Método                                         | Qué registra                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descubrimiento del Gateway local |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                     |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de funcionalidad de Node bajo `openclaw nodes` |
| `api.registerService(service)`                 | Servicio en segundo plano             |
| `api.registerInteractiveHandler(registration)` | Handler interactivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime para resultados de herramientas |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son los seams del SDK para plugins que necesitan participar en el
ciclo de vida del host en vez de limitarse a añadir un proveedor, canal o herramienta.
Son contratos genéricos; Plan Mode puede usarlos, pero también pueden hacerlo flujos
de aprobación, compuertas de política de workspace, monitores en segundo plano,
asistentes de configuración y plugins complementarios de UI.

| Método                                                                               | Contrato que posee                                                                                                                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del plugin, compatible con JSON, proyectado mediante sesiones del Gateway                                |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero exactamente una vez inyectado en el siguiente turno del agente para una sesión                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas previa al plugin, incluida/de confianza, que puede bloquear o reescribir parámetros de herramientas         |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                             |
| `api.registerCommand(...)`                                                           | Comandos de plugin con ámbito; los resultados de comando pueden establecer `continueAgent: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución de UI de control para superficies de sesión, herramienta, ejecución o configuración                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpieza para recursos de runtime propiedad del plugin en rutas de reset/eliminación/recarga                           |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneadas para estado de flujo de trabajo y monitores                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal por ejecución del plugin, limpiado en el ciclo de vida terminal de la ejecución                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos de programador propiedad del plugin; no programa trabajo ni crea registros de tareas            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos, mediada por el host y solo para incluidos, a la ruta de sesión directa saliente activa                |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron, solo para incluidos, más limpieza basada en etiquetas                            |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden despachar mediante el Gateway                                                    |

Usa los espacios de nombres agrupados para código de plugin nuevo:

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

Los métodos planos equivalentes siguen disponibles como aliases de compatibilidad
obsoletos para plugins existentes. No añadas código de plugin nuevo que llame
directamente a `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` o
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una utilidad de ámbito de sesión sobre el programador Cron del Gateway. Cron posee la temporización y crea el registro de tarea en segundo plano cuando se ejecuta el turno; el SDK de Plugin solo restringe la sesión de destino, la nomenclatura propiedad del plugin y la limpieza. Usa `api.runtime.tasks.managedFlows` dentro del turno programado cuando el trabajo en sí necesite estado duradero de Task Flow de varios pasos.

Los contratos dividen la autoridad intencionalmente:

- Los plugins externos pueden poseer extensiones de sesión, descriptores de interfaz de usuario, comandos, metadatos de herramientas, inyecciones del siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes que los hooks ordinarios `before_tool_call` y son solo empaquetadas porque participan en la política de seguridad del host.
- La propiedad de comandos reservados es solo empaquetada. Los plugins externos deben usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` desactiva los hooks que mutan prompts, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, los campos de prompt de `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de plugin             | Hooks usados                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de aprobación             | Extensión de sesión, continuación de comando, inyección del siguiente turno, descriptor de interfaz de usuario                            |
| Puerta de política de presupuesto/espacio de trabajo | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción a eventos de agente, propiedad/limpieza del programador de sesión, contribución al prompt de heartbeat, descriptor de interfaz de usuario |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de interfaz de usuario de Control                                          |

<Note>
  Los namespaces de administración central reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignarles un
  ámbito de método de gateway más limitado. Prefiere prefijos específicos del plugin para
  los métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins empaquetados pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Esta es la costura de confianza neutral al runtime
  para reductores de salida asíncronos como tokenjuice.

Los plugins empaquetados deben declarar `contracts.agentToolResultMiddleware` para cada
runtime de destino, por ejemplo `["pi", "codex"]`. Los plugins externos
no pueden registrar este middleware; conserva los hooks normales de plugins de OpenClaw para trabajos
que no necesiten temporización de resultado de herramienta previa al modelo. Se eliminó la antigua ruta de registro
de fábrica de extensiones incrustadas exclusiva de Pi.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el Gateway activo
en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el arranque del Gateway cuando el descubrimiento local está habilitado, pasa los
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

Los plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos o
autenticación. El descubrimiento es una pista de enrutamiento; la autenticación del Gateway y la fijación TLS siguen
poseyendo la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comando:

- `commands`: nombres de comando explícitos propiedad del registrador
- `descriptors`: descriptores de comando en tiempo de análisis usados para ayuda de CLI,
  enrutamiento y registro lazy de CLI de plugin
- `parentPath`: ruta opcional del comando padre para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, prefiere
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño wrapper alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de nodo explícitas propiedad del plugin.

Si quieres que un comando de plugin permanezca cargado de forma lazy en la ruta normal de CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites registro lazy de CLI raíz.
Esa ruta de compatibilidad eager sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para carga lazy en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin posea la configuración predeterminada para un backend
local de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo de proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue prevaleciendo. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv de ámbito de solicitud que pertenezcan al
  dialecto de CLI, como mapear niveles de pensamiento de OpenClaw a un flag nativo de esfuerzo.

Para una guía de autoría de extremo a extremo, consulta
[plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). El callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor de plan de vaciado de memoria                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                      |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                     |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas heredadas compatibles para plugins de memoria.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta
  `provider/model`, como `ollama/qwen3:8b`, sin heredar la cadena de fallback
  activa.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ids de adaptador de embedding (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el plugin).
- La configuración de usuario como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback` se resuelve contra esos ids de adaptador
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado   |
| `api.onConversationBindingResolved(handler)` | Callback de enlace de conversación |

Consulta [hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres de hooks comunes y semántica de guardas.

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier manejador reclama el despacho, se omiten los manejadores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como sin decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Conserva `metadata` para extras específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de arranque propiedad del gateway en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa cambios de ciclo de vida de cron propiedad del gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar programadores de activación externos, y conserva OpenClaw como la fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id de Plugin                                                                                   |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa de runtime en memoria cuando esté disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes de runtime](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del Plugin                                                        |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barrel locales para importaciones internas:

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

Las superficies públicas de Plugins integrados cargadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos públicos de entrada similares) prefieren la
instantánea activa de configuración de runtime cuando OpenClaw ya está en ejecución. Si todavía no
existe una instantánea de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de Plugins integrados empaquetados deben cargarse mediante los cargadores de fachadas
de Plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones
de manifiesto y sidecar de runtime que las instalaciones empaquetadas usan para el código propiedad del Plugin.

Los Plugins de proveedores pueden exponer un barrel de contrato local y reducido del Plugin cuando un
ayudante es intencionadamente específico del proveedor y todavía no pertenece a una subruta genérica
del SDK. Ejemplos integrados:

- **Anthropic**: superficie pública `api.ts` / `contract-api.ts` para ayudantes de streaming de
  encabezado beta de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  ayudantes de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  junto con ayudantes de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones de
  `openclaw/plugin-sdk/<other-plugin>`. Si un ayudante es realmente compartido, promuévelo
  a una subruta neutral del SDK como `openclaw/plugin-sdk/speech`, `.../provider-model-shared`
  u otra superficie orientada a capacidades en lugar de acoplar dos Plugins entre sí.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Ayudantes de runtime" icon="gears" href="/es/plugins/sdk-runtime">
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
  <Card title="Internos del Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
