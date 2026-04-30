---
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugin
    - Estás añadiendo un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-04-30T05:51:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes,
generación de video, recuperación web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas agregar tu plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) y los usuarios lo instalan con
`openclaw plugins install <package-name>`. OpenClaw prueba ClawHub primero y
recurre automáticamente a npm para los paquetes que todavía usan distribución por npm.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado

## ¿Qué tipo de plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Agrega un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/es/plugins/hooks">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Para un plugin de canal que no tenga garantizada su instalación cuando se ejecute la incorporación/configuración,
usa `createOptionalChannelSetupSurface(...)` desde
`openclaw/plugin-sdk/channel-setup`. Produce un par de adaptador de configuración + asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras reales de configuración
hasta que el plugin esté instalado.

## Inicio rápido: plugin de herramienta

Este tutorial crea un plugin mínimo que registra una herramienta de agente. Los plugins de canal
y de proveedor tienen guías dedicadas enlazadas arriba.

<Steps>
  <Step title="Create the package and manifest">
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

    Cada plugin necesita un manifiesto, incluso sin configuración, y cada plugin debería
    declarar `activation.onStartup` intencionalmente. Las herramientas registradas en tiempo de ejecución necesitan
    importación al iniciar, así que este ejemplo lo establece en `true`. Consulta
    [Manifiesto](/es/plugins/manifest) para ver el esquema completo. Los snippets canónicos de publicación de ClawHub
    están en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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
    Para ver todas las opciones de punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw también comprueba ClawHub antes que npm para especificaciones de paquete simples como
    `@myorg/openclaw-my-plugin`; npm sigue siendo una alternativa para los paquetes que
    aún no han migrado a ClawHub.

    **Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de plugins incluidos — se descubren automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de los plugins

Un solo plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad              | Método de registro                              | Guía detallada                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM) | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                           |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                    | [Backends CLI](/es/gateway/cli-backends)                                           |
| Canal / mensajería     | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                                |
| Voz (TTS/STT)          | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión multimedia | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recuperación web       | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de herramienta | `api.registerAgentToolResultMiddleware(...)`     | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                       |
| Herramientas de agente | `api.registerTool(...)`                          | Abajo                                                                           |
| Comandos personalizados | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                   |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/es/plugins/hooks)                                               |
| Hooks de eventos internos | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                   |
| Rutas HTTP             | `api.registerHttpRoute(...)`                     | [Internos](/es/plugins/architecture-internals#gateway-http-routes)                 |
| Subcomandos CLI        | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                   |

Para ver la API de registro completa, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Los plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
necesitan reescritura asíncrona de resultados de herramientas antes de que el modelo vea la salida. Declara los
runtimes de destino en `contracts.agentToolResultMiddleware`, por ejemplo
`["pi", "codex"]`. Este es un seam de confianza para plugins incluidos; los plugins
externos deberían preferir los hooks normales de plugin de OpenClaw salvo que OpenClaw desarrolle una
política de confianza explícita para esta capacidad.

Si tu plugin registra métodos RPC personalizados del gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven como
`operator.admin`, incluso si un plugin solicita un alcance más estrecho.

Semántica de guardas de hooks que conviene tener presente:

- `before_tool_call`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como ausencia de decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación al usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad.
- `before_install`: `{ block: false }` se trata como ausencia de decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como ausencia de decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento entrante de hilo/tema. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos de enrutamiento tipados `replyToId` / `threadId` frente a claves de metadatos específicas del canal.

El comando `/approve` maneja aprobaciones de exec y de plugins con una alternativa acotada: cuando no se encuentra un id de aprobación de exec, OpenClaw reintenta el mismo id a través de las aprobaciones de plugins. El reenvío de aprobaciones de plugins puede configurarse de forma independiente mediante `approvals.plugin` en la configuración.

Si la canalización personalizada de aprobaciones necesita detectar ese mismo caso de alternativa acotada,
prefiere `isApprovalNotFoundError` desde `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de expiración de aprobación.

Consulta [Hooks de plugin](/es/plugins/hooks) para ver ejemplos y la referencia de hooks.

## Registro de herramientas de agente

Las herramientas son funciones tipadas que el LLM puede llamar. Pueden ser obligatorias (siempre
disponibles) u opcionales (activadas por el usuario):

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

Los usuarios habilitan herramientas opcionales en la configuración:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Los nombres de herramientas no deben entrar en conflicto con herramientas del núcleo (los conflictos se omiten)
- Las herramientas con objetos de registro mal formados, incluida la ausencia de `parameters`, se omiten y se informan en los diagnósticos del plugin en lugar de interrumpir las ejecuciones de agentes
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un plugin agregando el id del plugin a `tools.allow`

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
importaciones internas; nunca importes tu propio Plugin a través de su ruta del SDK.

Para Plugins de proveedor, mantén los helpers específicos del proveedor en esos barrels
de la raíz del paquete, a menos que el seam sea realmente genérico. Ejemplos incluidos actuales:

- Anthropic: wrappers de transmisión de Claude y helpers de `service_tier` / beta
- OpenAI: constructores de proveedor, helpers de modelo predeterminado, proveedores en tiempo real
- OpenRouter: constructor de proveedor más helpers de onboarding/configuración

Si un helper solo es útil dentro de un paquete de proveedor incluido, mantenlo en ese
seam de la raíz del paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Todavía existen algunos seams de helpers generados de `openclaw/plugin-sdk/<bundled-id>` para
el mantenimiento de Plugins incluidos cuando tienen uso de propietario rastreado. Trátalos como
superficies reservadas, no como el patrón predeterminado para nuevos Plugins de terceros.

## Lista de verificación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins dentro del repositorio)</Check>

## Pruebas de la versión beta

1. Observa las etiquetas de lanzamiento de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta se ven como `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de lanzamientos.
2. Prueba tu Plugin con la etiqueta beta tan pronto como aparezca. La ventana antes de la versión estable suele ser de solo unas pocas horas.
3. Publica en el hilo de tu Plugin en el canal de Discord `plugin-forum` después de probar, con `all good` o indicando qué se rompió. Si aún no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para mantenedores y automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores observan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, tu corrección probablemente entrará en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos
  </Card>
  <Card title="Descripción general del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Mapa de importaciones y referencia de la API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto del Plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema del manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitectura de Plugins](/es/plugins/architecture) — análisis profundo de la arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
- [Manifiesto](/es/plugins/manifest) — formato del manifiesto del Plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de Plugins de proveedor
