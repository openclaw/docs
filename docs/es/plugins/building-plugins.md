---
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugin
    - Estás agregando un nuevo canal, proveedor, herramienta u otra funcionalidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-05-02T20:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de
imágenes, generación de video, obtención web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas añadir tu plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) y los usuarios lo instalan con
`openclaw plugins install clawhub:<package-name>`. Las especificaciones de paquete sin prefijo todavía
se instalan desde npm durante la transición de lanzamiento.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado. El desarrollo de plugins
  desde un checkout de código fuente es solo con pnpm porque OpenClaw carga plugins incluidos
  desde los paquetes de workspace `extensions/*`.

## ¿Qué tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw con una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de herramienta / hook" icon="wrench" href="/es/plugins/hooks">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Para un plugin de canal que no tiene garantía de estar instalado cuando se ejecuta la incorporación/configuración,
usa `createOptionalChannelSetupSurface(...)` desde
`openclaw/plugin-sdk/channel-setup`. Produce un par de adaptador de configuración + asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras de configuración reales
hasta que el plugin esté instalado.

## Inicio rápido: plugin de herramienta

Este recorrido crea un plugin mínimo que registra una herramienta de agente. Los plugins de canal
y proveedor tienen guías dedicadas enlazadas arriba.

<Steps>
  <Step title="Crea el paquete y el manifiesto">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo plugin necesita un manifiesto, incluso sin configuración. Las herramientas registradas en tiempo de ejecución
    deben listarse en `contracts.tools` para que OpenClaw pueda descubrir el plugin
    propietario sin cargar todos los runtimes de plugins. Los plugins también deberían declarar
    `activation.onStartup` de forma intencional. Este ejemplo lo establece en `true`. Consulta
    [Manifiesto](/es/plugins/manifest) para ver el esquema completo. Los fragmentos canónicos de publicación en ClawHub
    están en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escribe el punto de entrada">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` es para plugins que no son de canal. Para canales, usa
    `defineChannelPluginEntry` — consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
    Para las opciones completas del punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Prueba y publica">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete sin prefijo como `@myorg/openclaw-my-plugin` se instalan desde npm durante
    la transición de lanzamiento. Usa `clawhub:` cuando quieras resolución de ClawHub.

    **Plugins dentro del repositorio:** colócalos bajo el árbol de workspace de plugins incluidos — se descubren automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de plugin

Un solo plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad              | Método de registro                              | Guía detallada                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM) | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                               |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`                    | [Backends de CLI](/es/gateway/cli-backends)                                           |
| Canal / mensajería     | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                                 |
| Voz (TTS/STT)          | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Obtención web          | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultados de herramientas | `api.registerAgentToolResultMiddleware(...)`     | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                          |
| Herramientas de agente | `api.registerTool(...)`                          | Abajo                                                                           |
| Comandos personalizados | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/es/plugins/hooks)                                                  |
| Hooks de eventos internos | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Rutas HTTP             | `api.registerHttpRoute(...)`                     | [Internos](/es/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos de CLI     | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |

Para la API de registro completa, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
necesitan reescritura asíncrona de resultados de herramientas antes de que el modelo vea la salida. Declara los
runtimes objetivo en `contracts.agentToolResultMiddleware`, por ejemplo
`["pi", "codex"]`. Esta es una interfaz de confianza para plugins incluidos; los plugins
externos deberían preferir los hooks normales de plugins de OpenClaw salvo que OpenClaw añada una
política de confianza explícita para esta capacidad.

Si tu plugin registra métodos RPC personalizados de gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven como
`operator.admin`, incluso si un plugin pide un ámbito más estrecho.

Semántica de guardas de hooks que conviene recordar:

- `before_tool_call`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como ausencia de decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación al usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_install`: `{ block: false }` se trata como ausencia de decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como ausencia de decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos de enrutamiento tipados `replyToId` / `threadId` en lugar de claves de metadatos específicas del canal.

El comando `/approve` maneja aprobaciones de exec y de plugins con fallback acotado: cuando no se encuentra un id de aprobación de exec, OpenClaw reintenta el mismo id mediante aprobaciones de plugins. El reenvío de aprobaciones de plugins puede configurarse de forma independiente mediante `approvals.plugin` en la configuración.

Si la fontanería de aprobaciones personalizada necesita detectar ese mismo caso de fallback acotado,
prefiere `isApprovalNotFoundError` desde `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de expiración de aprobación.

Consulta [Hooks de plugin](/es/plugins/hooks) para ver ejemplos y la referencia de hooks.

## Registro de herramientas de agente

Las herramientas son funciones tipadas que el LLM puede llamar. Pueden ser obligatorias (siempre
disponibles) u opcionales (activación voluntaria por parte del usuario):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda herramienta registrada con `api.registerTool(...)` también debe declararse en el
manifiesto del plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw captura y almacena en caché el descriptor validado de la herramienta registrada,
por lo que los plugins no duplican la `description` ni los datos de esquema en el manifiesto. El
contrato del manifiesto solo declara la propiedad y el descubrimiento; la ejecución sigue llamando
a la implementación viva de la herramienta registrada.

Los usuarios habilitan herramientas opcionales en la configuración:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Los nombres de herramientas no deben entrar en conflicto con las herramientas principales (los conflictos se omiten)
- Las herramientas con objetos de registro mal formados, incluida la falta de `parameters`, se omiten y se informan en los diagnósticos del plugin en lugar de interrumpir las ejecuciones del agente
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un plugin agregando el id del plugin a `tools.allow`

## Registrar comandos de CLI

Los plugins pueden agregar grupos de comandos raíz `openclaw` con `api.registerCli`. Proporciona
`descriptors` para cada raíz de comando de nivel superior para que OpenClaw pueda mostrar y enrutar
el comando sin cargar ansiosamente cada runtime de plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Después de la instalación, verifica el registro del runtime y ejecuta el comando:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Convenciones de importación

Importa siempre desde rutas enfocadas `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para la referencia completa de subrutas, consulta [Descripción general del SDK](/es/plugins/sdk-overview).

Dentro de tu plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
importaciones internas; nunca importes tu propio plugin a través de su ruta del SDK.

Para plugins de proveedor, mantén los helpers específicos del proveedor en esos barrels
de raíz de paquete, a menos que la conexión sea realmente genérica. Ejemplos empaquetados actuales:

- Anthropic: wrappers de stream de Claude y helpers de `service_tier` / beta
- OpenAI: constructores de proveedor, helpers de modelo predeterminado, proveedores realtime
- OpenRouter: constructor de proveedor más helpers de incorporación/configuración

Si un helper solo es útil dentro de un paquete de proveedor empaquetado, mantenlo en esa
conexión de raíz de paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Algunas conexiones helper generadas `openclaw/plugin-sdk/<bundled-id>` todavía existen para
el mantenimiento de plugins empaquetados cuando tienen uso de propietario rastreado. Trátalas como
superficies reservadas, no como el patrón predeterminado para nuevos plugins de terceros.

## Lista de comprobación previa al envío

<Check>**package.json** tiene metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (plugins dentro del repositorio)</Check>

## Pruebas de versión beta

1. Vigila las etiquetas de lanzamiento de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta se ven como `v2026.3.N-beta.1`. También puedes activar notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de lanzamiento.
2. Prueba tu plugin con la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu plugin en el canal de Discord `plugin-forum` después de probar, con `all good` o indicando qué se rompió. Si todavía no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para mantenedores y automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, es probable que tu corrección llegue en el siguiente ciclo.

## Próximos pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos
  </Card>
  <Card title="Descripción general del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y la API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto de plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema de manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — análisis profundo de la arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del SDK de plugins
- [Manifiesto](/es/plugins/manifest) — formato del manifiesto de plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
