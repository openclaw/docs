---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Resumen del Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

El Plugin SDK es el contrato tipado entre los plugins y el núcleo. Esta página es la referencia de **qué importar** y **qué puedes registrar**.

<Tip>
  ¿Buscas en cambio una guía práctica?

- ¿Tu primer Plugin? Empieza con [Crear plugins](/es/plugins/building-plugins).
- ¿Plugin de canal? Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
- ¿Plugin de proveedor? Consulta [Plugins de proveedor](/es/plugins/sdk-provider-plugins).
  </Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene un inicio rápido y evita problemas de dependencias circulares. Para helpers de entrada/compilación específicos de canal, prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para la superficie paraguas más amplia y helpers compartidos como `buildChannelConfigSchema`.

<Warning>
  No importes puntos de acceso de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barriles `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deben usar esos
  barriles locales del plugin o añadir un contrato genérico y acotado del SDK cuando la necesidad sea realmente
  entre canales.

Un pequeño conjunto de puntos de acceso helper para plugins incluidos (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` y similares) sigue apareciendo en el
mapa de exportación generado. Existen solo para el mantenimiento de plugins incluidos y no son
rutas de importación recomendadas para nuevos plugins de terceros.
</Warning>

## Referencia de subrutas

El Plugin SDK se expone como un conjunto de subrutas acotadas agrupadas por área (entrada de plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y
helpers reservados para plugins incluidos). Para el catálogo completo — agrupado y enlazado — consulta
[Subrutas del Plugin SDK](/es/plugins/sdk-subpaths).

La lista generada de más de 200 subrutas está en `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                           |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de bajo nivel de agentes |
| `api.registerCliBackend(...)`                    | Backend local de inferencia para CLI   |
| `api.registerChannel(...)`                       | Canal de mensajería                    |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video         |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                 |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                   |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                    |
| `api.registerWebFetchProvider(...)`              | Proveedor de web fetch / scraping      |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                           |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                          | Qué registra                            |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP de Gateway                |
| `api.registerGatewayMethod(name, handler)`      | Método RPC de Gateway                   |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante local de descubrimiento de Gateway |
| `api.registerCli(registrar, opts?)`             | Subcomando de CLI                       |
| `api.registerService(service)`                  | Servicio en segundo plano               |
| `api.registerInteractiveHandler(registration)`  | Manejador interactivo                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Fábrica de extensiones de runner embebido de Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Sección adicional de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus adicional de búsqueda/lectura de memoria |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre siguen siendo `operator.admin`, aunque un plugin intente asignar un
  alcance más estrecho a un método de Gateway. Prefiere prefijos específicos del plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar registerEmbeddedExtensionFactory">
  Usa `api.registerEmbeddedExtensionFactory(...)` cuando un plugin necesite temporización de eventos nativa de Pi
  durante ejecuciones embebidas de OpenClaw — por ejemplo, reescrituras asíncronas de `tool_result`
  que deban ocurrir antes de que se emita el mensaje final de resultado de herramienta.

Hoy en día este es un punto de acceso para plugins incluidos: solo los plugins incluidos pueden registrar uno,
y deben declarar `contracts.embeddedExtensionFactories: ["pi"]` en
`openclaw.plugin.json`. Mantén los hooks normales de plugin de OpenClaw para todo lo que
no requiera ese punto de acceso de nivel más bajo.
</Accordion>

### Registro de descubrimiento de Gateway

`api.registerGatewayDiscoveryService(...)` permite que un plugin anuncie el
Gateway activo en un transporte local de descubrimiento como mDNS/Bonjour. OpenClaw llama al
servicio durante el arranque de Gateway cuando el descubrimiento local está habilitado, pasa los
puertos actuales de Gateway y datos de pista TXT no secretos, y llama al manejador `stop`
devuelto durante el apagado de Gateway.

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
como autenticación. El descubrimiento es una pista de enrutamiento; la autenticación de Gateway y el pinning de TLS siguen
siendo los responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces explícitas de comandos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro perezoso de la CLI del plugin

Si quieres que un comando del plugin siga cargándose de forma perezosa en la ruta normal de la CLI raíz,
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

Usa `commands` por sí solo únicamente cuando no necesites registro perezoso en la CLI raíz.
Esa ruta compatible y ansiosa sigue siendo compatible, pero no instala
marcadores respaldados por descriptores para la carga perezosa en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada
para un backend local de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- El `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, normalizar formas antiguas de flags).

### Ranuras exclusivas

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar añadidos al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Constructor de secciones de prompt de memoria                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver de plan de vaciado de memoria                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                     |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                   |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que plugins complementarios consuman artefactos de memoria exportados a través de
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas compatibles con versiones anteriores para plugins de memoria.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ids de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un id personalizado definido por el plugin).
- La configuración del usuario como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback` se resuelve contra esos ids de adaptadores registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de enlace de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. En cuanto cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. En cuanto cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. En cuanto cualquier manejador reclama el despacho, los manejadores de menor prioridad y la ruta predeterminada de despacho del modelo se omiten.
- `message_sending`: devolver `{ cancel: true }` es terminal. En cuanto cualquier manejador lo establece, los manejadores de menor prioridad se omiten.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento de hilos/temas entrantes. Reserva `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad de Gateway en lugar de depender de hooks internos `gateway:startup`.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id del Plugin                                                                              |
| `api.name`               | `string`                  | Nombre para mostrar                                                                        |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                              |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                          |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                  |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                      |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de la configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver ruta relativa a la raíz del Plugin                                                |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barril locales para las importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas solo para runtime
  index.ts          # Punto de entrada del Plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Dirige las importaciones internas a través de `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea de configuración activa del runtime cuando OpenClaw ya está en ejecución. Si todavía no existe una
instantánea del runtime, recurren al archivo de configuración resuelto en disco.

Los plugins de proveedor pueden exponer un barril de contrato local y acotado del plugin cuando un
helper es intencionalmente específico del proveedor y aún no pertenece a una subruta genérica del SDK.
Ejemplos incluidos:

- **Anthropic**: punto de acceso público `api.ts` / `contract-api.ts` para helpers de
  encabezados beta de Claude y `service_tier` de streaming.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  helpers de modelos predeterminados y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor
  junto con helpers de incorporación/configuración.

<Warning>
  El código de producción de extensiones también debe evitar importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers de runtime" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Configuración y setup" icon="sliders" href="/es/plugins/sdk-setup">
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
