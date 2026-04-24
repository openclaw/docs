---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Resumen del SDK de Plugins
x-i18n:
    generated_at: "2026-04-24T05:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

El SDK de Plugins es el contrato tipado entre los Plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Tip>
  ¿Buscas en cambio una guía práctica?

- ¿Tu primer Plugin? Empieza con [Crear Plugins](/es/plugins/building-plugins).
- ¿Plugin de canal? Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
- ¿Plugin de proveedor? Consulta [Plugins de proveedor](/es/plugins/sdk-provider-plugins).
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
la superficie general más amplia y ayudantes compartidos como
`buildChannelConfigSchema`.

<Warning>
  No importes capas de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los Plugins incluidos componen subrutas genéricas del SDK dentro de sus propios archivos `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels locales
  del Plugin o añadir un contrato genérico y estrecho del SDK cuando una necesidad sea realmente
  transversal a varios canales.

Un pequeño conjunto de capas auxiliares de Plugins incluidos (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` y similares) sigue apareciendo en el
mapa de exportaciones generado. Existen solo para el mantenimiento de Plugins incluidos y
no son rutas de importación recomendadas para nuevos Plugins de terceros.
</Warning>

## Referencia de subrutas

El SDK de Plugins se expone como un conjunto de subrutas estrechas agrupadas por área (entrada de Plugin,
canal, proveedor, autenticación, runtime, capacidad, memoria y ayudantes reservados de Plugins incluidos). Para ver el catálogo completo, agrupado y enlazado, consulta
[Subrutas del SDK de Plugins](/es/plugins/sdk-subpaths).

La lista generada de más de 200 subrutas se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de bajo nivel del agente |
| `api.registerCliBackend(...)`                    | Backend local de inferencia por CLI   |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz en tiempo real dúplex |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/vídeo        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                          | Qué registra                          |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                        |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                |
| `api.registerCli(registrar, opts?)`             | Subcomando de CLI                     |
| `api.registerService(service)`                  | Servicio en segundo plano             |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo               |
| `api.registerEmbeddedExtensionFactory(factory)` | Factoría de extensión del runner integrado Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda/lectura de memoria |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, incluso si un Plugin intenta asignar un
  ámbito más estrecho al método del gateway. Prefiere prefijos específicos del Plugin para
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo usar registerEmbeddedExtensionFactory">
  Usa `api.registerEmbeddedExtensionFactory(...)` cuando un Plugin necesite
  temporización de eventos nativa de Pi durante ejecuciones integradas de OpenClaw; por ejemplo, reescrituras asíncronas de `tool_result`
  que deban ocurrir antes de que se emita el mensaje final de resultado de herramienta.

Actualmente esta es una capa reservada para Plugins incluidos: solo los Plugins incluidos pueden registrar una,
y deben declarar `contracts.embeddedExtensionFactories: ["pi"]` en
`openclaw.plugin.json`. Mantén los hooks normales de Plugins de OpenClaw para todo lo
que no requiera esa capa de nivel inferior.
</Accordion>

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces explícitas de comandos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro diferido de la CLI del Plugin

Si quieres que un comando del Plugin siga cargándose de forma diferida en la ruta normal de la CLI raíz,
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

Usa `commands` por sí solo solo cuando no necesites el registro diferido de la CLI raíz.
Esa ruta de compatibilidad de carga anticipada sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un Plugin sea propietario de la configuración predeterminada de un backend local
de CLI de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue prevaleciendo. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del Plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad tras la combinación
  (por ejemplo, normalizar formas antiguas de marcas).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar los añadidos al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad unificada de memoria                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                             |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para Plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que Plugins complementarios consuman artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un Plugin
  de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de memoria compatibles con versiones anteriores.
- `registerMemoryEmbeddingProvider` permite que el Plugin de memoria activo registre uno
  o más ids de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un id personalizado
  definido por el Plugin).
- La configuración del usuario como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback` se resuelve contra esos ids de adaptador registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado  |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de resolución de vinculación de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. En cuanto cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. En cuanto cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. En cuanto cualquier handler reclama el despacho, se omiten los handlers de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. En cuanto cualquier handler lo establece, se omiten los handlers de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.
- `message_received`: usa el campo tipado `threadId` cuando necesites el enrutamiento entrante de hilos/temas. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específica del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de arranque propiedad del gateway en lugar de depender de hooks internos `gateway:startup`.

### Campos del objeto API

| Campo                   | Tipo                      | Descripción                                                                                           |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Id del Plugin                                                                                         |
| `api.name`              | `string`                  | Nombre para mostrar                                                                                   |
| `api.version`           | `string?`                 | Versión del Plugin (opcional)                                                                         |
| `api.description`       | `string?`                 | Descripción del Plugin (opcional)                                                                     |
| `api.source`            | `string`                  | Ruta de origen del Plugin                                                                             |
| `api.rootDir`           | `string?`                 | Directorio raíz del Plugin (opcional)                                                                 |
| `api.config`            | `OpenClawConfig`          | Instantánea actual de configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`      | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                              |
| `api.runtime`           | `PluginRuntime`           | [Ayudantes de runtime](/es/plugins/sdk-runtime)                                                          |
| `api.logger`            | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`  | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de arranque/configuración previa a la entrada completa |
| `api.resolvePath(input)`| `(string) => string`      | Resuelve una ruta relativa a la raíz del Plugin                                                       |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barrel locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas solo para runtime
  index.ts          # Punto de entrada del Plugin
  setup-entry.ts    # Entrada ligera solo para configuración inicial (opcional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Encauza las importaciones internas a través de `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de Plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos similares de entrada pública) prefieren la
instantánea activa de configuración del runtime cuando OpenClaw ya está en ejecución. Si todavía no existe ninguna
instantánea de runtime, recurren a la configuración resuelta del archivo en disco.

Los Plugins de proveedor pueden exponer un barrel estrecho local del Plugin cuando un
helper sea intencionadamente específico del proveedor y todavía no pertenezca a una subruta genérica del SDK. Ejemplos incluidos:

- **Anthropic**: capa pública `api.ts` / `contract-api.ts` para Claude
  beta-header y ayudantes de flujo `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  ayudantes de modelos predeterminados y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor
  más ayudantes de incorporación/configuración.

<Warning>
  El código de producción de extensiones también debería evitar importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, súbelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos Plugins entre sí.
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
    Empaquetado, manifiestos y esquemas de configuración.
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
