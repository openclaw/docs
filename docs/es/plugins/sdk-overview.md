---
read_when:
    - Debe saber desde qué subruta del SDK importar
    - Desea una referencia de todos los métodos de registro de OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T05:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de Plugin es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa en su lugar el
  [SDK de apps de OpenClaw](/es/concepts/openclaw-sdk) y el paquete `@openclaw/sdk`.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Crear plugins](/es/plugins/building-plugins), usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para plugins de proveedor y [Hooks de Plugin](/es/plugins/hooks) para plugins de herramientas o hooks de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene el inicio rápido y
evita problemas de dependencias circulares. Para los helpers de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; conserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y los helpers compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el constructor genérico. Los
plugins incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
de canales incluidos conservados. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquemas incluidos es un
patrón para nuevos plugins.

<Warning>
  No importes seams de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels locales del plugin
  o agregar un contrato genérico estrecho del SDK cuando una necesidad sea realmente
  transversal a canales.

Un conjunto pequeño de seams helper de plugins incluidos aún aparece en el mapa de exportaciones
generado cuando tienen uso rastreado por el propietario. Existen solo para el mantenimiento
de plugins incluidos y no se recomiendan como rutas de importación para nuevos plugins
de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como fachadas de compatibilidad obsoletas para uso rastreado por el propietario. No
copies esas rutas de importación en nuevos plugins; usa en su lugar helpers de runtime inyectados y
subrutas genéricas del SDK de canal.
</Warning>

## Referencia de subrutas

El SDK de Plugin se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de Plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y helpers reservados
de plugins incluidos). Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths).

La lista generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agente de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia de CLI    |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / extracción web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                         | Qué registra                                      |
| ------------------------------ | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta del agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`     | Comando personalizado (omite el LLM)              |

Los comandos de Plugin pueden definir `agentPromptGuidance` cuando el agente necesita una pista breve
de enrutamiento propiedad del comando. Mantén ese texto sobre el comando en sí; no agregues
política específica de proveedor o Plugin a los constructores de prompts del núcleo.

### Infraestructura

| Método                                         | Qué registra                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP de Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Método RPC de Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descubrimiento de Gateway local |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                     |
| `api.registerService(service)`                 | Servicio en segundo plano             |
| `api.registerInteractiveHandler(registration)` | Handler interactivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime de resultado de herramienta |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son los seams del SDK para plugins que necesitan participar en el ciclo de vida
del host en vez de solo agregar un proveedor, canal o herramienta. Son
contratos genéricos; el Modo Plan puede usarlos, pero también pueden hacerlo flujos de trabajo de aprobación,
gates de política de espacio de trabajo, monitores en segundo plano, asistentes de configuración y plugins
complementarios de UI.

| Método                                                                   | Contrato que posee                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sesión propiedad del plugin, compatible con JSON, proyectado mediante sesiones de Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto duradero exactamente una vez inyectado en el siguiente turno del agente para una sesión |
| `api.registerTrustedToolPolicy(...)`                                     | Política de herramienta previa al Plugin, incluida/de confianza, que puede bloquear o reescribir parámetros de herramienta |
| `api.registerToolMetadata(...)`                                          | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta |
| `api.registerCommand(...)`                                               | Comandos de Plugin con ámbito; los resultados de comando pueden definir `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptores de contribución de UI de control para superficies de sesión, herramienta, ejecución o configuración |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpieza para recursos de runtime propiedad del plugin en rutas de restablecimiento/eliminación/recarga |
| `api.registerAgentEventSubscription(...)`                                | Suscripciones a eventos saneados para estado de flujo de trabajo y monitores |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporal de Plugin por ejecución, limpiado en el ciclo de vida terminal de la ejecución |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de trabajos del programador de sesiones propiedad del plugin con limpieza determinista |

Los contratos dividen la autoridad intencionalmente:

- Los plugins externos pueden poseer extensiones de sesión, descriptores de UI, comandos, metadatos de herramientas, inyecciones del siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes de los hooks ordinarios `before_tool_call` y son solo para incluidos porque participan en la política de seguridad del host.
- La propiedad de comandos reservados es solo para incluidos. Los plugins externos deberían usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` deshabilita los hooks que mutan prompts, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  los campos de prompt del `before_agent_start` heredado y
  `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son Plan:

| Arquetipo de Plugin          | Hooks usados                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación | Extensión de sesión, continuación de comando, inyección del siguiente turno, descriptor de UI                                          |
| Gate de política de presupuesto/espacio de trabajo | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción a eventos del agente, propiedad/limpieza del programador de sesiones, contribución de prompt de heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de UI de control                                                       |

<Note>
  Los namespaces reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
  ámbito de método de gateway más estrecho. Prefiere prefijos específicos del plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultado de herramienta">
  Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesitan reescribir el resultado de una herramienta después de la ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Este es el seam de confianza, neutral respecto al runtime,
  para reductores de salida asíncronos como tokenjuice.

Los plugins incluidos deben declarar `contracts.agentToolResultMiddleware` para cada
runtime objetivo, por ejemplo `["pi", "codex"]`. Los plugins externos
no pueden registrar este middleware; conserva los hooks normales de Plugin de OpenClaw para trabajo
que no necesita temporización de resultado de herramienta previa al modelo. La antigua ruta de registro de factory
de extensión embebida solo para Pi se ha eliminado.
</Accordion>

### Registro de descubrimiento de Gateway

`api.registerGatewayDiscoveryService(...)` permite a un plugin anunciar el Gateway activo
en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio de Gateway cuando el descubrimiento local está habilitado, pasa los
puertos actuales de Gateway y datos de pista TXT no secretos, y llama al handler
`stop` devuelto durante el apagado de Gateway.

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
autenticación. El descubrimiento es una pista de enrutamiento; la autenticación de Gateway y la fijación de TLS siguen
siendo las responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comando explícitas propiedad del registrador
- `descriptors`: descriptores de comando en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro diferido de la CLI de plugins

Si quieres que un comando de Plugin permanezca cargado de forma diferida en la ruta normal de la CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites registro diferido de la CLI raíz.
Esa ruta de compatibilidad ansiosa sigue estando admitida, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un Plugin sea propietario de la configuración predeterminada de un backend
local de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del Plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). El callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor de plan de vaciado de memoria                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                  |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins acompañantes puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  Plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con versiones heredadas.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`
  como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` permite que el Plugin de memoria activo registre uno
  o más ids de adaptador de embeddings (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el Plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ids de adaptador
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado     |
| `api.onConversationBindingResolved(handler)` | Callback de vinculación de conversación |

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres de hooks comunes y
semántica de guardia.

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier handler reclama el despacho, se omiten los handlers de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de arranque propiedad de Gateway en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa los cambios del ciclo de vida de Cron propiedad de Gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar planificadores de activación externos, y mantén OpenClaw como la fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id del Plugin                                                                                                |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                          |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                                                |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                                            |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                                    |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuración actual (snapshot activo del runtime en memoria cuando está disponible)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                                   |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del Plugin                                                               |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barrel locales para imports internos:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Dirige los imports internos mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren el
snapshot de configuración del runtime activo cuando OpenClaw ya se está ejecutando. Si aún no existe
un snapshot de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas de plugins
de OpenClaw; los imports directos desde `dist/extensions/...` omiten los espejos de dependencias de runtime
por etapas que las instalaciones empaquetadas usan para dependencias propiedad del Plugin.

Los plugins de proveedor pueden exponer un barrel de contrato estrecho y local al Plugin cuando un
helper es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: punto de unión público `api.ts` / `contract-api.ts` para helpers de streaming de
  beta-header de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  helpers de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  más helpers de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es verdaderamente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins.
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
