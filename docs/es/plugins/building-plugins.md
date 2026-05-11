---
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugins
    - Está añadiendo un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-05-11T20:42:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los plugins extienden OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de
imágenes, generación de video, obtención web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas agregar tu plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/clawhub) y los usuarios lo instalan con
`openclaw plugins install clawhub:<package-name>`. Las especificaciones de paquete simples aún
se instalan desde npm durante la transición de lanzamiento.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para plugins en el repositorio: repositorio clonado y `pnpm install` ejecutado. El desarrollo de
  plugins desde un checkout de código fuente es solo con pnpm porque OpenClaw carga los plugins
  incluidos desde los paquetes de espacio de trabajo `extensions/*`.

## ¿Qué tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Agrega un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Asigna una CLI de IA local al ejecutor de respaldo de texto de OpenClaw
  </Card>
  <Card title="Plugin de herramienta / hook" icon="wrench" href="/es/plugins/hooks">
    Registra herramientas de agente, hooks de eventos o servicios; continúa abajo
  </Card>
</CardGroup>

Para un plugin de canal cuya instalación no esté garantizada cuando se ejecuta la incorporación/configuración,
usa `createOptionalChannelSetupSurface(...)` desde
`openclaw/plugin-sdk/channel-setup`. Produce un par adaptador de configuración + asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras de configuración reales
hasta que el plugin esté instalado.

## Inicio rápido: plugin de herramienta

Este recorrido crea un plugin mínimo que registra una herramienta de agente. Los plugins de canal
y proveedor tienen guías dedicadas enlazadas arriba.

<Steps>
  <Step title="Crear el paquete y el manifiesto">
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
    deben listarse en `contracts.tools` para que OpenClaw pueda descubrir el
    plugin propietario sin cargar todos los entornos de ejecución de plugins. Los plugins también deberían declarar
    `activation.onStartup` de forma intencional. Este ejemplo lo establece en `true`. Consulta
    [Manifiesto](/es/plugins/manifest) para ver el esquema completo. Los fragmentos canónicos de publicación en ClawHub
    se encuentran en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escribir el punto de entrada">

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
    `defineChannelPluginEntry`; consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
    Para ver todas las opciones de punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Probar y publicar">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete simples como `@myorg/openclaw-my-plugin` se instalan desde npm durante
    la transición de lanzamiento. Usa `clawhub:` cuando quieras resolución de ClawHub.

    **Plugins en el repositorio:** colócalos bajo el árbol de espacio de trabajo de plugins incluidos; se descubren automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades del plugin

Un solo plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad              | Método de registro                              | Guía detallada                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM) | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                          |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`                    | [Plugins de backend de CLI](/es/plugins/cli-backend-plugins)                      |
| Canal / mensajería     | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                               |
| Voz (TTS/STT)          | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Obtención web          | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultados de herramientas | `api.registerAgentToolResultMiddleware(...)`     | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                      |
| Herramientas de agente | `api.registerTool(...)`                          | Abajo                                                                           |
| Comandos personalizados | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                  |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/es/plugins/hooks)                                              |
| Hooks de eventos internos | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                  |
| Rutas HTTP             | `api.registerHttpRoute(...)`                     | [Aspectos internos](/es/plugins/architecture-internals#gateway-http-routes)       |
| Subcomandos de CLI     | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                  |

Para ver la API de registro completa, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
necesitan reescritura asíncrona de resultados de herramientas antes de que el modelo vea la salida. Declara los
entornos de ejecución objetivo en `contracts.agentToolResultMiddleware`, por ejemplo
`["pi", "codex"]`. Esta es una interfaz de confianza para plugins incluidos; los
plugins externos deberían preferir los hooks normales de plugins de OpenClaw salvo que OpenClaw desarrolle una
política de confianza explícita para esta capacidad.

Si tu plugin registra métodos RPC personalizados del Gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven en
`operator.admin`, incluso si un plugin solicita un alcance más estrecho.

Semántica de guardas de hooks a tener en cuenta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como ninguna decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación al usuario mediante la superposición de aprobación de ejecución, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_install`: `{ block: false }` se trata como ninguna decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como ninguna decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento de hilos/temas entrantes. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos de enrutamiento tipados `replyToId` / `threadId` en lugar de claves de metadatos específicas del canal.

El comando `/approve` maneja tanto aprobaciones de ejecución como de plugins con respaldo acotado: cuando no se encuentra un id de aprobación de ejecución, OpenClaw reintenta el mismo id mediante las aprobaciones de plugins. El reenvío de aprobaciones de plugins puede configurarse de forma independiente mediante `approvals.plugin` en la configuración.

Si la canalización de aprobación personalizada necesita detectar ese mismo caso de respaldo acotado,
prefiere `isApprovalNotFoundError` desde `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de expiración de aprobación.

Consulta [Hooks de plugin](/es/plugins/hooks) para ver ejemplos y la referencia de hooks.

## Registrar herramientas de agente

Las herramientas son funciones tipadas que el LLM puede llamar. Pueden ser obligatorias (siempre
disponibles) u opcionales (activación por el usuario):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el entorno de ejecución. Usa
`ctx.activeModel` cuando una herramienta necesite registrar, mostrar o adaptarse al modelo
activo para el turno actual. El objeto puede incluir `provider`, `modelId` y
`modelRef`. Trátalo como metadatos informativos del entorno de ejecución, no como un límite de seguridad
frente al operador local, el código de Plugin instalado o un entorno de ejecución de
OpenClaw modificado. Para herramientas locales sensibles, mantén una aceptación explícita del Plugin o del operador
y falla de forma cerrada cuando los metadatos del modelo activo falten o no sean adecuados.

Cada herramienta registrada con `api.registerTool(...)` también debe declararse en el
manifiesto del Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw captura y almacena en caché el descriptor validado de la herramienta registrada,
por lo que los plugins no duplican `description` ni datos de esquema en el manifiesto. El
contrato del manifiesto solo declara propiedad y descubrimiento; la ejecución sigue llamando
a la implementación activa de la herramienta registrada.
Define `toolMetadata.<tool>.optional: true` para herramientas registradas con
`api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar cargar ese
entorno de ejecución de Plugin hasta que la herramienta se incluya explícitamente en la lista de permitidos.

Los usuarios habilitan herramientas opcionales en la configuración:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Los nombres de herramientas no deben entrar en conflicto con las herramientas principales (los conflictos se omiten)
- Las herramientas con objetos de registro mal formados, incluida la falta de `parameters`, se omiten y se reportan en los diagnósticos del Plugin en lugar de interrumpir las ejecuciones del agente
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un Plugin agregando el id del Plugin a `tools.allow`

## Registrar comandos de CLI

Los plugins pueden agregar grupos de comandos raíz de `openclaw` con `api.registerCli`. Proporciona
`descriptors` para cada raíz de comando de nivel superior para que OpenClaw pueda mostrar y enrutar
el comando sin cargar ansiosamente cada entorno de ejecución de Plugin.

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

Después de instalar, verifica el registro del entorno de ejecución y ejecuta el comando:

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

Dentro de tu Plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
importaciones internas; nunca importes tu propio Plugin mediante su ruta de SDK.

Para plugins de proveedor, mantén los helpers específicos del proveedor en esos barrels
de la raíz del paquete salvo que la interfaz sea verdaderamente genérica. Ejemplos incluidos actuales:

- Anthropic: envoltorios de flujo de Claude y helpers de `service_tier` / beta
- OpenAI: constructores de proveedor, helpers de modelo predeterminado, proveedores en tiempo real
- OpenRouter: constructor de proveedor más helpers de incorporación/configuración

Si un helper solo es útil dentro de un paquete de proveedor incluido, mantenlo en esa
interfaz de raíz de paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Algunas interfaces helper generadas `openclaw/plugin-sdk/<bundled-id>` todavía existen para
el mantenimiento de plugins incluidos cuando han rastreado uso del propietario. Trátalas como
superficies reservadas, no como el patrón predeterminado para nuevos plugins de terceros.

## Lista de verificación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (plugins dentro del repositorio)</Check>

## Pruebas de versiones beta

1. Vigila las etiquetas de lanzamiento de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta se ven como `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de lanzamiento.
2. Prueba tu Plugin contra la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal `plugin-forum` de Discord después de probar con `all good` o con lo que se haya roto. Si aún no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los contribuidores no pueden etiquetar PRs, así que el título es la señal del lado del PR para mantenedores y automatización. Los bloqueadores con PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa que todo está en verde. Si pierdes la ventana, es probable que tu corrección llegue en el siguiente ciclo.

## Próximos pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos
  </Card>
  <Card title="Plugins de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registra un backend local de CLI de IA
  </Card>
  <Card title="Descripción general del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Mapa de importación y referencia de API de registro
  </Card>
  <Card title="Helpers de entorno de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto de Plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema del manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitectura de Plugin](/es/plugins/architecture) - análisis profundo de la arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia del SDK de Plugin
- [Manifiesto](/es/plugins/manifest) - formato del manifiesto del Plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
