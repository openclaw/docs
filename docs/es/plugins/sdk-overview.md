---
read_when:
    - Debes saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro de OpenClawPluginApi
    - Estás consultando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-05-07T13:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia para **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa en su lugar el
  [SDK de aplicaciones de OpenClaw](/es/concepts/openclaw-sdk) y el paquete `@openclaw/sdk`.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Crear plugins](/es/plugins/building-plugins), usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para plugins de proveedor, [Plugins de backend CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, y [Hooks de plugins](/es/plugins/hooks) para plugins de hooks de herramienta o de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para helpers de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; conserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y helpers compartidos como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propio del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el constructor genérico. Los plugins
incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
retenidos de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquema incluido es un
patrón para plugins nuevos.

<Warning>
  No importes interfaces de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels
  locales del plugin o añadir un contrato genérico y estrecho del SDK cuando la necesidad sea realmente
  multicanal.

Un pequeño conjunto de interfaces helper de plugins incluidos todavía aparece en el mapa de exportación
generado cuando tienen uso de propietario rastreado. Existen solo para el mantenimiento de plugins incluidos
y no se recomiendan como rutas de importación para nuevos plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso de propietario rastreado. No
copies esas rutas de importación en plugins nuevos; usa helpers de runtime inyectados y
subrutas genéricas del SDK de canal en su lugar.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y helpers reservados de plugins incluidos).
Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

La lista generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor de agente experimental de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia CLI       |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Texto a voz / síntesis STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz en tiempo real dúplex |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                         | Qué registra                                      |
| ------------------------------ | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)              |

Los comandos de plugin pueden establecer `agentPromptGuidance` cuando el agente necesita una pista de enrutamiento
breve y propiedad del comando. Mantén ese texto centrado en el comando en sí; no añadas
políticas específicas de proveedor o plugin a los constructores de prompts del núcleo.

### Infraestructura

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descubrimiento del Gateway local |
| `api.registerCli(registrar, opts?)`            | Subcomando CLI                            |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de característica Node bajo `openclaw nodes` |
| `api.registerService(service)`                 | Servicio en segundo plano                 |
| `api.registerInteractiveHandler(registration)` | Manejador interactivo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime para resultados de herramienta |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son las interfaces del SDK para plugins que necesitan participar en el ciclo de vida
del host en lugar de solo añadir un proveedor, canal o herramienta. Son
contratos genéricos; Plan Mode puede usarlos, pero también pueden hacerlo flujos de trabajo de aprobación,
controles de política de workspace, monitores en segundo plano, asistentes de configuración y plugins
complementarios de UI.

| Método                                                                   | Contrato que posee                                                                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sesión propiedad del plugin, compatible con JSON, proyectado mediante sesiones de Gateway                                 |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto duradero exactamente una vez inyectado en el siguiente turno de agente para una sesión                                     |
| `api.registerTrustedToolPolicy(...)`                                     | Política de herramienta previa al plugin incluida/de confianza que puede bloquear o reescribir parámetros de herramienta             |
| `api.registerToolMetadata(...)`                                          | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                              |
| `api.registerCommand(...)`                                               | Comandos de plugin con ámbito; los resultados de comando pueden establecer `continueAgent: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptores de contribución de Control UI para superficies de sesión, herramienta, ejecución o configuración                        |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpieza para recursos de runtime propiedad del plugin en rutas de restablecimiento/eliminación/recarga                |
| `api.registerAgentEventSubscription(...)`                                | Suscripciones a eventos saneadas para estado de flujo de trabajo y monitores                                                         |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporal de plugin por ejecución limpiado en el ciclo de vida terminal de la ejecución                                      |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de trabajos del programador de sesiones propiedad del plugin con limpieza determinista                                    |

Los contratos dividen la autoridad intencionalmente:

- Los plugins externos pueden poseer extensiones de sesión, descriptores de UI, comandos, metadatos de herramientas, inyecciones de siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes de los hooks ordinarios `before_tool_call` y son solo para plugins incluidos porque participan en la política de seguridad del host.
- La propiedad de comandos reservados es solo para plugins incluidos. Los plugins externos deberían usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` desactiva los hooks que mutan prompts, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, los campos de prompt de `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de plugin             | Hooks usados                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Flujo de trabajo de aprobación  | Extensión de sesión, continuación de comando, inyección de siguiente turno, descriptor de UI                                          |
| Control de política de presupuesto/workspace | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción a eventos de agente, propiedad/limpieza del programador de sesiones, contribución de prompt de Heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de Control UI                                                            |

<Note>
  Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
  ámbito de método de gateway más estrecho. Prefiere prefijos específicos del plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramienta">
  Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesitan reescribir un resultado de herramienta después de la ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Esta es la interfaz de confianza y neutral respecto al runtime
  para reductores de salida asíncronos como tokenjuice.

Los plugins incluidos deben declarar `contracts.agentToolResultMiddleware` para cada
runtime objetivo, por ejemplo `["pi", "codex"]`. Los plugins externos
no pueden registrar este middleware; mantén los hooks normales de plugins de OpenClaw para el trabajo
que no necesita temporización de resultados de herramientas antes del modelo. La antigua ruta de registro
de fábrica de extension embebida exclusiva de Pi se eliminó.
</Accordion>

### Registro de descubrimiento de Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el Gateway
activo en un transporte de descubrimiento local, como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando el descubrimiento local está habilitado, pasa los
puertos actuales del Gateway y datos de sugerencia TXT no secretos, y llama al manejador
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

Los plugins de descubrimiento de Gateway no deben tratar los valores TXT anunciados como secretos ni
autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación del Gateway y el anclaje TLS
siguen siendo responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de CLI,
  el enrutamiento y el registro perezoso de CLI de plugins
- `parentPath`: ruta de comando principal opcional para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, prefiere
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño envoltorio alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de nodo explícitamente propiedad de plugins.

Si quieres que un comando de Plugin siga cargándose de forma perezosa en la ruta normal de CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites el registro perezoso de CLI raíz.
Esa ruta de compatibilidad ansiosa sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga perezosa en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un Plugin sea propietario de la configuración predeterminada para un backend local de
CLI de IA, como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del Plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesita reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv con alcance de solicitud que pertenecen al
  dialecto de CLI, como asignar niveles de razonamiento de OpenClaw a un flag de esfuerzo
  nativo.

Para una guía de autoría de extremo a extremo, consulta
[plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor de plan de vaciado de memoria                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                      |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  Plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con legado.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`,
  como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` permite que el Plugin de memoria activo registre uno
  o más ids de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el Plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ids de adaptadores
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado     |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de enlace de conversación |

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y semántica de guardas.

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier manejador reclama el envío, se omiten los manejadores de menor prioridad y la ruta predeterminada de envío del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento de hilos/temas entrantes. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad del Gateway, en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa cambios del ciclo de vida de Cron propiedad del Gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar programadores de activación externos, y mantén OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                           |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del Plugin                                                                                         |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                   |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                                         |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                                     |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                             |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                                 |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuración actual (snapshot de runtime activo en memoria cuando está disponible)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del Plugin                                                       |

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
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren el
snapshot de configuración del runtime activo cuando OpenClaw ya se está ejecutando. Si todavía no existe
ningún snapshot de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas de plugins
de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten el manifiesto
y las comprobaciones de sidecar de runtime que las instalaciones empaquetadas usan para el código propiedad del Plugin.

Los plugins de proveedor pueden exponer un barrel de contrato local del plugin y limitado cuando un
ayudante es intencionalmente específico del proveedor y todavía no pertenece a una subruta
genérica del SDK. Ejemplos incluidos:

- **Anthropic**: separación pública `api.ts` / `contract-api.ts` para ayudantes de streaming
  del encabezado beta de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  ayudantes de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  además de ayudantes de incorporación/configuración.

<Warning>
  El código de producción de la extensión también debe evitar las importaciones
  `openclaw/plugin-sdk/<other-plugin>`. Si un ayudante es realmente compartido, promuévelo a una subruta
  neutral del SDK, como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Ayudantes de tiempo de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
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
  <Card title="Elementos internos del Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
