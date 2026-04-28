---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Resumen del SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

El SDK de Plugin es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Tip>
  ¿Buscas una guía práctica en su lugar?

- ¿Primer plugin? Empieza con [Crear plugins](/es/plugins/building-plugins).
- ¿Plugin de canal? Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
- ¿Plugin de proveedor? Consulta [Plugins de proveedor](/es/plugins/sdk-provider-plugins).
- ¿Plugin de herramienta o hook de ciclo de vida? Consulta [Hooks de plugins](/es/plugins/hooks).
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
la superficie paraguas más amplia y helpers compartidos como
`buildChannelConfigSchema`.

Para la configuración de canal, publica el JSON Schema propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
es para primitivas de esquema compartidas y el builder genérico. Cualquier
exportación de esquema con nombre de canal incluido en esa subruta son exportaciones heredadas de compatibilidad, no un patrón para plugins nuevos.

<Warning>
  No importes seams de conveniencia con marca de proveedor o canal (por ejemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios barrels
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deberían usar esos barrels locales del plugin
  o agregar un contrato genérico estrecho del SDK cuando la necesidad sea realmente
  entre canales.

Un pequeño conjunto de seams helper de plugins incluidos (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` y similares) sigue apareciendo en el
mapa de exportaciones generado. Existen solo para mantenimiento de plugins incluidos y
no son rutas de importación recomendadas para nuevos plugins de terceros.
</Warning>

## Referencia de subrutas

El SDK de Plugin se expone como un conjunto de subrutas estrechas agrupadas por área (entrada
de plugin, canal, proveedor, autenticación, runtime, capacidad, memoria y helpers reservados
para plugins incluidos). Para el catálogo completo — agrupado y enlazado — consulta
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
| `api.registerCliBackend(...)`                    | Backend CLI local de inferencia       |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción realtime en streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz realtime dúplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                         | Qué registra                           |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descubrimiento local del Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                      |
| `api.registerService(service)`                 | Servicio en segundo plano              |
| `api.registerInteractiveHandler(registration)` | Controlador interactivo                |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultados de herramientas en runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Sección aditiva de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de búsqueda/lectura de memoria |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen en `operator.admin`, incluso si un plugin intenta asignar un
  alcance más estrecho a un método del gateway. Prefiere prefijos específicos del plugin para
  métodos propiedad del plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesitan reescribir el resultado de una herramienta después de su ejecución y antes de que el runtime
  devuelva ese resultado al modelo. Este es el seam confiable y neutral al runtime
  para reductores asíncronos de salida como tokenjuice.

Los plugins incluidos deben declarar `contracts.agentToolResultMiddleware` para cada
runtime objetivo, por ejemplo `["pi", "codex"]`. Los plugins externos
no pueden registrar este middleware; mantén los hooks normales de plugins de OpenClaw para trabajo
que no necesite el momento previo al modelo del resultado de herramienta. La ruta anterior de registro
de fábrica de extensiones embebidas solo de Pi ha sido eliminada.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite a un plugin anunciar el Gateway activo
en un transporte local de descubrimiento como mDNS/Bonjour. OpenClaw llama al
servicio durante el arranque del Gateway cuando el descubrimiento local está habilitado, pasa los
puertos actuales del Gateway y datos TXT de pista no secretos, y llama al controlador
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
como autenticación. El descubrimiento es una pista de enrutamiento; la autenticación del Gateway y el pinning TLS siguen siendo responsables de la confianza.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro perezoso de CLI de plugins

Si quieres que un comando de plugin siga cargándose perezosamente en la ruta normal de la CLI raíz,
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
        description: "Administra cuentas Matrix, verificación, dispositivos y estado del perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo solo cuando no necesites registro perezoso en la CLI raíz.
Esa ruta de compatibilidad eager sigue siendo compatible, pero no instala
placeholders respaldados por descriptores para carga perezosa en tiempo de análisis.

### Registro de backend CLI

`api.registerCliBackend(...)` permite a un plugin poseer la configuración predeterminada de un
backend CLI local de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- El `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas de flags antiguas).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). El callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad unificada de memoria                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Builder de sección de prompt de memoria                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del plan de vaciado de memoria                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria                                                                                                                       |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                   |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida de plugin de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al layout privado de un plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son APIs exclusivas compatibles con versiones heredadas de plugins de memoria.
- `registerMemoryEmbeddingProvider` permite al plugin de memoria activo registrar uno
  o más ids de adaptadores de embedding (por ejemplo `openai`, `gemini` o un id
  personalizado definido por plugin).
- La configuración del usuario como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback` se resuelve contra esos ids de adaptadores registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Callback de enlace de conversación |

Consulta [Hooks de plugins](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y
semántica de guards.

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como sobrescritura.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como sin decisión (igual que omitir `block`), no como sobrescritura.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que algún controlador reclama el dispatch, se omiten los controladores de menor prioridad y la ruta predeterminada de dispatch del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como sin decisión (igual que omitir `cancel`), no como sobrescritura.
- `message_received`: usa el campo tipado `threadId` cuando necesites enrutamiento de hilo/tema entrante. Mantén `metadata` para extras específicos del canal.
- `message_sending`: usa los campos tipados de enrutamiento `replyToId` / `threadId` antes de recurrir a `metadata` específico del canal.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio propiedad del gateway en lugar de depender de hooks internos `gateway:startup`.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id del plugin                                                                              |
| `api.name`               | `string`                  | Nombre visible                                                                             |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                              |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                          |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                  |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                      |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de configuración (instantánea activa en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                            |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas de runtime
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo de configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos públicos similares) prefieren la
instantánea activa de configuración del runtime cuando OpenClaw ya se está ejecutando. Si todavía no existe
una instantánea de runtime, recurren a la configuración resuelta en disco.

Los plugins de proveedor pueden exponer un barrel de contrato local y estrecho cuando un
helper es intencionalmente específico del proveedor y todavía no pertenece a una subruta genérica del SDK. Ejemplos incluidos:

- **Anthropic**: seam público `api.ts` / `contract-api.ts` para helpers de
  streaming de beta-header y `service_tier` de Claude.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de proveedor,
  helpers de modelo predeterminado y builders de proveedor realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el builder de proveedor
  más helpers de onboarding/configuración.

<Warning>
  El código de producción de extensiones también debería evitar importaciones de `openclaw/plugin-sdk/<other-plugin>`.
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
  <Card title="Configuración y config" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migrar desde superficies obsoletas.
  </Card>
  <Card title="Internos de plugins" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura profunda y modelo de capacidades.
  </Card>
</CardGroup>
