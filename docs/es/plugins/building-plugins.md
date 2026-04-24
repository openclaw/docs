---
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas un inicio rápido para el desarrollo de Plugins
    - Estás añadiendo un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Building plugins
x-i18n:
    generated_at: "2026-04-24T05:39:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Los Plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes,
generación de video, recuperación web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas añadir tu Plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) o en npm y los usuarios lo instalarán con
`openclaw plugins install <package-name>`. OpenClaw prueba primero ClawHub y
recurre a npm automáticamente.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para Plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado

## ¿Qué tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de herramientas / hooks" icon="wrench">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Para un Plugin de canal que no esté garantizado que esté instalado cuando se ejecutan onboarding/setup,
usa `createOptionalChannelSetupSurface(...)` desde
`openclaw/plugin-sdk/channel-setup`. Produce un adaptador de configuración + pareja de asistente
que anuncia el requisito de instalación y falla de forma cerrada en las escrituras reales de configuración
hasta que el Plugin esté instalado.

## Inicio rápido: Plugin de herramientas

Este recorrido crea un Plugin mínimo que registra una herramienta de agente. Los
Plugins de canal y proveedor tienen guías específicas enlazadas arriba.

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
      "description": "Añade una herramienta personalizada a OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin necesita un manifiesto, incluso sin configuración. Consulta
    [Manifest](/es/plugins/manifest) para ver el esquema completo. Los fragmentos canónicos de publicación en ClawHub
    viven en `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` es para Plugins que no son de canal. Para canales, usa
    `defineChannelPluginEntry`; consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
    Para ver todas las opciones del punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Prueba y publica">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw también comprueba ClawHub antes que npm para especificaciones simples
    como `@myorg/openclaw-my-plugin`.

    **Plugins dentro del repositorio:** colócalos bajo el árbol de espacios de trabajo de Plugins incluidos; se detectan automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades del Plugin

Un solo Plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad             | Método de registro                               | Guía detallada                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                               |
| Backend de inferencia de CLI  | `api.registerCliBackend(...)`                    | [Backends de CLI](/es/gateway/cli-backends)                                           |
| Canal / mensajería    | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                                 |
| Voz (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión multimedia    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes       | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de video       | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recuperación web              | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web             | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extensión Pi embebida  | `api.registerEmbeddedExtensionFactory(...)`      | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                          |
| Herramientas de agente            | `api.registerTool(...)`                          | Más abajo                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Hooks de eventos            | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Rutas HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/es/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos CLI        | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |

Para ver la API completa de registro, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Usa `api.registerEmbeddedExtensionFactory(...)` cuando un Plugin necesite
hooks nativos de Pi del runner embebido, como reescritura asíncrona de `tool_result` antes de que se emita el mensaje final del resultado de la herramienta. Prefiere hooks normales de Plugin de OpenClaw cuando el
trabajo no necesite la sincronización de una extensión Pi.

Si tu Plugin registra métodos RPC personalizados del gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven a
`operator.admin`, incluso si un Plugin pide un alcance más limitado.

Semántica de guard de hooks que conviene tener en cuenta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como sin decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación del usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_install`: `{ block: false }` se trata como sin decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como sin decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento entrante por hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos tipados de enrutamiento `replyToId` / `threadId` frente a claves de metadata específicas del canal.

El comando `/approve` maneja tanto aprobaciones de exec como de Plugins con un respaldo limitado: cuando no se encuentra un id de aprobación de exec, OpenClaw reintenta el mismo id mediante aprobaciones de Plugins. El reenvío de aprobación de Plugins puede configurarse de forma independiente mediante `approvals.plugin` en la configuración.

Si una lógica personalizada de aprobaciones necesita detectar ese mismo caso de respaldo limitado,
prefiere `isApprovalNotFoundError` desde `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de caducidad de aprobación.

Consulta [Semántica de decisiones de hooks en el resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics) para más detalles.

## Registro de herramientas de agente

Las herramientas son funciones tipadas que el LLM puede llamar. Pueden ser obligatorias (siempre
disponibles) u opcionales (adhesión del usuario):

```typescript
register(api) {
  // Herramienta obligatoria — siempre disponible
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Herramienta opcional — el usuario debe añadirla a la lista de permitidos
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

Los usuarios habilitan herramientas opcionales en la configuración:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Los nombres de herramientas no deben entrar en conflicto con herramientas del núcleo (los conflictos se omiten)
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un Plugin añadiendo el id del Plugin a `tools.allow`

## Convenciones de importación

Importa siempre desde rutas específicas `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Mal: raíz monolítica (obsoleta, se eliminará)
import { ... } from "openclaw/plugin-sdk";
```

Para la referencia completa de subrutas, consulta [Resumen del SDK](/es/plugins/sdk-overview).

Dentro de tu Plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
importaciones internas; nunca importes tu propio Plugin a través de su ruta SDK.

Para Plugins de proveedor, mantén helpers específicos del proveedor en esos
barrels de la raíz del paquete a menos que la interfaz sea realmente genérica. Ejemplos incluidos actualmente:

- Anthropic: wrappers de stream de Claude y helpers de `service_tier` / beta
- OpenAI: constructores de proveedor, helpers de modelo predeterminado, proveedores en tiempo real
- OpenRouter: constructor de proveedor más helpers de onboarding/configuración

Si un helper solo es útil dentro de un paquete de proveedor incluido concreto, mantenlo en esa interfaz
de raíz del paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Algunas interfaces helper generadas `openclaw/plugin-sdk/<bundled-id>` siguen existiendo para
mantenimiento y compatibilidad de Plugins incluidos, por ejemplo
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trátalas como superficies
reservadas, no como el patrón predeterminado para nuevos Plugins de terceros.

## Lista de comprobación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins dentro del repositorio)</Check>

## Pruebas de versión beta

1. Vigila las etiquetas de publicación de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen este aspecto: `v2026.3.N-beta.1`. También puedes activar notificaciones para la cuenta oficial de X de OpenClaw [@openclaw](https://x.com/openclaw) para avisos de publicaciones.
2. Prueba tu Plugin con la etiqueta beta en cuanto aparezca. La ventana antes de estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal de Discord `plugin-forum` después de probarlo con `all good` o indicando qué se rompió. Si todavía no tienes hilo, crea uno.
4. Si algo se rompe, abre o actualiza una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace de la incidencia en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza la incidencia tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para responsables y automatización. Los bloqueos con PR se fusionan; los bloqueos sin uno podrían publicarse igualmente. Los responsables vigilan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, tu corrección probablemente entre en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos
  </Card>
  <Card title="Resumen del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y de la API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
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

- [Arquitectura de Plugin](/es/plugins/architecture) — análisis en profundidad de la arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
- [Manifest](/es/plugins/manifest) — formato del manifiesto de Plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de Plugins de proveedor
