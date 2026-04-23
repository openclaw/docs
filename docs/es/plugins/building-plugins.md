---
read_when:
    - Quieres crear un nuevo plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de plugins
    - Estás agregando un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Crear plugins
x-i18n:
    generated_at: "2026-04-23T05:16:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Crear plugins

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes,
generación de video, obtención web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas agregar tu plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) o npm, y los usuarios lo instalan con
`openclaw plugins install <package-name>`. OpenClaw prueba primero ClawHub y
recurre a npm automáticamente.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado

## ¿Qué tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Agrega un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de herramienta / hook" icon="wrench">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Si un plugin de canal es opcional y podría no estar instalado cuando se ejecuta la incorporación/configuración,
usa `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Produce un adaptador de configuración + par del asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras reales de configuración
hasta que el plugin esté instalado.

## Inicio rápido: plugin de herramienta

Esta guía crea un plugin mínimo que registra una herramienta de agente. Los plugins de canal
y proveedor tienen guías específicas enlazadas arriba.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo plugin necesita un manifiesto, incluso sin configuración. Consulta
    [Manifest](/es/plugins/manifest) para ver el esquema completo. Los fragmentos canónicos de publicación en ClawHub
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

    OpenClaw también consulta ClawHub antes que npm para especificaciones de paquete sin prefijo como
    `@myorg/openclaw-my-plugin`.

    **Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de plugins empaquetados; se descubren automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de plugins

Un solo plugin puede registrar cualquier cantidad de capacidades mediante el objeto `api`:

| Capacidad             | Método de registro                              | Guía detallada                                                                  |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                               |
| Backend de inferencia de CLI  | `api.registerCliBackend(...)`                    | [Backends de CLI](/es/gateway/cli-backends)                                           |
| Canal / mensajería    | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                                 |
| Voz (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión de medios    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes       | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de video       | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Obtención web              | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web             | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extensión Pi embebida  | `api.registerEmbeddedExtensionFactory(...)`      | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                          |
| Herramientas de agente            | `api.registerTool(...)`                          | A continuación                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Hooks de eventos            | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Rutas HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/es/plugins/architecture#gateway-http-routes)                          |
| Subcomandos de CLI        | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |

Para ver la API completa de registro, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Usa `api.registerEmbeddedExtensionFactory(...)` cuando un plugin necesite hooks del ejecutor embebido nativos de Pi
como la reescritura asíncrona de `tool_result` antes de que se emita el mensaje final
del resultado de la herramienta. Prefiere los hooks normales de plugins de OpenClaw cuando el
trabajo no necesite el tiempo de extensión de Pi.

Si tu plugin registra métodos RPC personalizados de gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos centrales (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven como
`operator.admin`, incluso si un plugin solicita un alcance más estrecho.

Semántica de protección de hooks que debes tener en cuenta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como ausencia de decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación del usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los controladores de menor prioridad.
- `before_install`: `{ block: false }` se trata como ausencia de decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como ausencia de decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos tipados de enrutamiento `replyToId` / `threadId` sobre claves de metadatos específicas del canal.

El comando `/approve` maneja tanto aprobaciones de exec como de plugins con un respaldo acotado: cuando no se encuentra un ID de aprobación de exec, OpenClaw reintenta el mismo ID mediante aprobaciones de plugins. El reenvío de aprobación de plugins se puede configurar de forma independiente mediante `approvals.plugin` en la configuración.

Si una lógica personalizada de aprobación necesita detectar ese mismo caso de respaldo acotado,
prefiere `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de expiración de aprobación.

Consulta [Semántica de decisiones de hooks del resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics) para más detalles.

## Registrar herramientas de agente

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

  // Herramienta opcional — el usuario debe agregarla a la lista permitida
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

- Los nombres de herramientas no deben entrar en conflicto con las herramientas centrales; los conflictos se omiten
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un plugin agregando el ID del plugin a `tools.allow`

## Convenciones de importación

Importa siempre desde rutas enfocadas `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Incorrecto: raíz monolítica (obsoleta, se eliminará)
import { ... } from "openclaw/plugin-sdk";
```

Para ver la referencia completa de subrutas, consulta [Resumen del SDK](/es/plugins/sdk-overview).

Dentro de tu plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
importaciones internas; nunca importes tu propio plugin a través de su ruta del SDK.

Para plugins de proveedor, mantén los auxiliares específicos del proveedor en esos
barrels de raíz del paquete, salvo que la separación sea realmente genérica. Ejemplos empaquetados actuales:

- Anthropic: envoltorios de streams de Claude y auxiliares de `service_tier` / beta
- OpenAI: constructores de proveedores, auxiliares de modelo predeterminado, proveedores en tiempo real
- OpenRouter: constructor de proveedor además de auxiliares de incorporación/configuración

Si un auxiliar solo es útil dentro de un paquete de proveedor empaquetado, mantenlo en esa
interfaz de raíz del paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Algunas interfaces auxiliares generadas `openclaw/plugin-sdk/<bundled-id>` todavía existen para
mantenimiento y compatibilidad de plugins empaquetados, por ejemplo
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trátalas como superficies
reservadas, no como el patrón predeterminado para nuevos plugins de terceros.

## Lista de comprobación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (plugins dentro del repositorio)</Check>

## Pruebas de lanzamiento beta

1. Vigila las etiquetas de lanzamientos de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen este aspecto: `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de lanzamientos.
2. Prueba tu plugin con la etiqueta beta tan pronto como aparezca. El margen antes del lanzamiento estable suele ser de solo unas horas.
3. Publica en el hilo de tu plugin en el canal de Discord `plugin-forum` después de probarlo con `all good` o indicando qué falló. Si todavía no tienes un hilo, crea uno.
4. Si algo falla, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PR, así que el título es la señal del lado del PR para los mantenedores y la automatización. Los bloqueadores con PR se fusionan; los bloqueadores sin PR podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa que todo va bien. Si pierdes la ventana, es probable que tu corrección llegue en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos
  </Card>
  <Card title="Resumen del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y de la API de registro
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto del plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema del manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Plugin Architecture](/es/plugins/architecture) — análisis detallado de la arquitectura interna
- [SDK Overview](/es/plugins/sdk-overview) — referencia del SDK de Plugin
- [Manifest](/es/plugins/manifest) — formato del manifiesto del plugin
- [Channel Plugins](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Provider Plugins](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
