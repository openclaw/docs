---
read_when:
    - Debe saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro de OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de Plugin es el contrato tipado entre plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Note>
  Esta página es para autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes a través del Gateway, usa en su lugar el
  [SDK de OpenClaw App](/es/concepts/openclaw-sdk) y el paquete `@openclaw/sdk`.
</Note>

<Tip>
¿Buscas una guía práctica? Empieza con [Crear plugins](/es/plugins/building-plugins), usa [Plugins de canal](/es/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para plugins de proveedor y [Hooks de Plugin](/es/plugins/hooks) para plugins de hooks de herramienta o de ciclo de vida.
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene el arranque rápido y
evita problemas de dependencias circulares. Para helpers de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie general más amplia y helpers compartidos como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el constructor genérico. Los plugins
incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para esquemas
retenidos de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna subruta de esquema incluido es un
patrón para plugins nuevos.

<Warning>
  No importes costuras de conveniencia con marca de proveedor o canal (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels locales
  del Plugin o añadir un contrato genérico estrecho del SDK cuando la necesidad sea realmente
  multicanal.

Un pequeño conjunto de costuras auxiliares de plugins incluidos todavía aparece en el mapa de exportación
generado cuando tienen uso rastreado por el propietario. Existen solo para el mantenimiento de plugins
incluidos y no son rutas de importación recomendadas para nuevos plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para uso rastreado por el propietario. No copies
esas rutas de importación en plugins nuevos; usa helpers de runtime inyectados y
subrutas genéricas del SDK de canal en su lugar.
</Warning>

## Referencia de subrutas

El SDK de Plugin se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de Plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y helpers reservados
para plugins incluidos). Para el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths).

La lista generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

El callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor de agente experimental de bajo nivel |
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

| Método                         | Qué registra                                  |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (requerida o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

Los comandos de Plugin pueden establecer `agentPromptGuidance` cuando el agente necesita una
pista breve de enrutamiento propiedad del comando. Mantén ese texto centrado en el propio comando; no añadas
política específica de proveedor o Plugin a los constructores de prompts del núcleo.

### Infraestructura

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Anunciador local de descubrimiento del Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                         |
| `api.registerService(service)`                 | Servicio en segundo plano                 |
| `api.registerInteractiveHandler(registration)` | Manejador interactivo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime para resultados de herramientas |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria |

### Hooks de host para plugins de flujo de trabajo

Los hooks de host son las costuras del SDK para plugins que necesitan participar en el ciclo de vida del host
en lugar de solo añadir un proveedor, canal o herramienta. Son
contratos genéricos; Plan Mode puede usarlos, pero también pueden hacerlo flujos de aprobación,
compuertas de política de workspace, monitores en segundo plano, asistentes de configuración y plugins complementarios de UI.

| Método                                                                   | Contrato que posee                                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sesión propiedad del Plugin, compatible con JSON, proyectado mediante sesiones del Gateway                              |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto duradero exactamente una vez inyectado en el siguiente turno del agente para una sesión                                  |
| `api.registerTrustedToolPolicy(...)`                                     | Política de herramientas pre-Plugin incluida/de confianza que puede bloquear o reescribir parámetros de herramientas              |
| `api.registerToolMetadata(...)`                                          | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                           |
| `api.registerCommand(...)`                                               | Comandos de Plugin con ámbito; los resultados de comandos pueden establecer `continueAgent: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptores de contribución de Control UI para superficies de sesión, herramienta, ejecución o ajustes                           |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpieza para recursos de runtime propiedad del Plugin en rutas de restablecimiento/eliminación/recarga             |
| `api.registerAgentEventSubscription(...)`                                | Suscripciones saneadas a eventos para estado de flujo de trabajo y monitores                                                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporal de Plugin por ejecución que se limpia en el ciclo de vida terminal de la ejecución                                |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de trabajos del programador de sesiones propiedad del Plugin con limpieza determinista                                  |

Los contratos dividen la autoridad intencionalmente:

- Los plugins externos pueden poseer extensiones de sesión, descriptores de UI, comandos, metadatos de herramientas, inyecciones de siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes de los hooks ordinarios `before_tool_call` y son solo para incluidos porque participan en la política de seguridad del host.
- La propiedad de comandos reservados es solo para incluidos. Los plugins externos deberían usar sus propios nombres de comando o alias.
- `allowPromptInjection=false` desactiva hooks que mutan prompts, incluidos `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, campos de prompt de `before_agent_start` heredado y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de Plugin          | Hooks usados                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de aprobación          | Extensión de sesión, continuación de comando, inyección de siguiente turno, descriptor de UI                                           |
| Compuerta de política de presupuesto/workspace | Política de herramienta de confianza, metadatos de herramienta, proyección de sesión                                      |
| Monitor de ciclo de vida en segundo plano | Limpieza de ciclo de vida de runtime, suscripción a eventos de agente, propiedad/limpieza del programador de sesiones, contribución al prompt de heartbeat, descriptor de UI |
| Asistente de configuración u onboarding | Extensión de sesión, comandos con ámbito, descriptor de Control UI                                                        |

<Note>
  Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un Plugin intenta asignar un
  ámbito más estrecho de método de Gateway. Prefiere prefijos específicos de Plugin para
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesitan reescribir un resultado de herramienta después de la ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Esta es la costura de confianza y neutral respecto al runtime
  para reductores de salida asíncronos como tokenjuice.

Los plugins incluidos deben declarar `contracts.agentToolResultMiddleware` para cada
runtime objetivo, por ejemplo `["pi", "codex"]`. Los plugins externos
no pueden registrar este middleware; conserva los hooks normales de OpenClaw Plugin para trabajo
que no necesite temporización de resultado de herramienta previa al modelo. La antigua ruta de registro de fábrica de
extensión integrada solo de Pi se ha eliminado.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el Gateway activo
en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el arranque del Gateway cuando el descubrimiento local está habilitado, pasa los
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

Los plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos ni
autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS
siguen siendo responsables de la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro diferido de la CLI del plugin

Si quieres que un comando de plugin permanezca cargado de forma diferida en la ruta normal de la CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de la CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada de un backend local
de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo de proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración de usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).
- Usa `resolveExecutionArgs` para reescrituras de argv con alcance de solicitud que pertenezcan
  al dialecto de la CLI, como asignar los niveles de pensamiento de OpenClaw a un flag nativo de esfuerzo.

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). El callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plan de vaciado de memoria                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                                    |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con legado.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`
  como `ollama/qwen3:8b`, sin heredar la cadena de fallback activa.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ids de adaptador de embeddings (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el plugin).
- La configuración de usuario como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback` se resuelve contra esos ids de adaptador
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado          |
| `api.onConversationBindingResolved(handler)` | Callback de enlace de conversación |

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos, nombres de hooks comunes y semánticas de protección.

### Semántica de decisiones de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier manejador reclama el despacho, los manejadores de menor prioridad y la ruta predeterminada de despacho del modelo se omiten.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento entrante por hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de arranque propiedad del gateway en lugar de depender de hooks internos `gateway:startup`.
- `cron_changed`: observa los cambios de ciclo de vida de Cron propiedad del gateway. Usa `event.job?.state?.nextRunAtMs` y `ctx.getCron?.()` al sincronizar programadores de activación externos, y mantén OpenClaw como la fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                                   |
| `api.name`               | `string`                  | Nombre visible                                                                                |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuración actual (snapshot de runtime en memoria activo cuando esté disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del plugin                                                        |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```
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

Las superficies públicas de plugins incluidos cargadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren el
snapshot de configuración de runtime activo cuando OpenClaw ya se está ejecutando. Si todavía no existe ningún snapshot
de runtime, recurren al archivo de configuración resuelto en disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas de plugins de
OpenClaw; las importaciones directas desde `dist/extensions/...` omiten el manifiesto
y las comprobaciones de sidecar de runtime que las instalaciones empaquetadas usan para código propiedad del plugin.

Los plugins de proveedor pueden exponer un barrel de contrato estrecho y local al plugin cuando un
helper es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: superficie pública `api.ts` / `contract-api.ts` para helpers de streaming de
  beta-header de Claude y `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedor,
  helpers de modelo predeterminado y constructores de proveedor en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedor
  junto con helpers de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
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
  <Card title="Aspectos internos de Plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura detallada y modelo de capacidades.
  </Card>
</CardGroup>
