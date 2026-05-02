---
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugins
    - Estás agregando un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-05-02T05:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e05c82cd810ed400a293cf0c336efeb6e5a6e081b144eb89150407754a98bc19
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins extiende OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación
de imágenes, generación de video, obtención web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas añadir tu Plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) y los usuarios lo instalan con
`openclaw plugins install <package-name>`. OpenClaw prueba ClawHub primero y
recurre automáticamente a npm para los paquetes que todavía usan distribución por npm.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para Plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado. El desarrollo de Plugins desde un checkout de código fuente es solo con pnpm porque OpenClaw carga los Plugins incluidos desde los paquetes de workspace `extensions/*`.

## ¿Qué tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de herramienta / hook" icon="wrench" href="/es/plugins/hooks">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Para un Plugin de canal que no tiene garantizado estar instalado cuando se ejecuta el onboarding/setup,
usa `createOptionalChannelSetupSurface(...)` desde
`openclaw/plugin-sdk/channel-setup`. Produce un par de adaptador de configuración + asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras reales de configuración
hasta que el Plugin esté instalado.

## Inicio rápido: Plugin de herramienta

Este recorrido crea un Plugin mínimo que registra una herramienta de agente. Los Plugins de canal
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

    Todo Plugin necesita un manifiesto, incluso sin configuración, y todo Plugin debería
    declarar `activation.onStartup` de forma intencional. Las herramientas registradas en tiempo de ejecución necesitan
    importación al inicio, por lo que este ejemplo lo establece en `true`. Consulta
    [Manifiesto](/es/plugins/manifest) para ver el esquema completo. Los snippets canónicos de publicación en ClawHub
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

    `definePluginEntry` es para Plugins que no son de canal. Para canales, usa
    `defineChannelPluginEntry` — consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
    Para ver todas las opciones del punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Prueba y publica">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw también comprueba ClawHub antes de npm para especificaciones de paquete simples como
    `@myorg/openclaw-my-plugin`; npm sigue siendo un fallback para paquetes que
    todavía no han migrado a ClawHub.

    **Plugins dentro del repositorio:** colócalos bajo el árbol de workspace de Plugins incluidos — se descubren automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de Plugin

Un solo Plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad              | Método de registro                              | Guía detallada                                                                  |
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
| Middleware de resultado de herramienta | `api.registerAgentToolResultMiddleware(...)`     | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                          |
| Herramientas de agente | `api.registerTool(...)`                          | Abajo                                                                           |
| Comandos personalizados | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Hooks de Plugin        | `api.on(...)`                                    | [Hooks de Plugin](/es/plugins/hooks)                                                  |
| Hooks de eventos internos | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Rutas HTTP             | `api.registerHttpRoute(...)`                     | [Internos](/es/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos de CLI     | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |

Para ver toda la API de registro, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Los Plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
necesitan reescritura asíncrona de resultados de herramientas antes de que el modelo vea la salida. Declara los
runtimes objetivo en `contracts.agentToolResultMiddleware`, por ejemplo
`["pi", "codex"]`. Esta es una interfaz de confianza para Plugins incluidos; los Plugins externos
deberían preferir los hooks normales de Plugins de OpenClaw salvo que OpenClaw incorpore una
política de confianza explícita para esta capacidad.

Si tu Plugin registra métodos RPC personalizados de Gateway, mantenlos con un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven como
`operator.admin`, incluso si un Plugin solicita un ámbito más estrecho.

Semántica de guardas de hooks que debes tener presente:

- `before_tool_call`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` se trata como ninguna decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita aprobación al usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_install`: `{ block: false }` se trata como ninguna decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` se trata como ninguna decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento de hilo/tema entrante. Mantén `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos de enrutamiento tipados `replyToId` / `threadId` en lugar de claves de metadatos específicas del canal.

El comando `/approve` maneja tanto aprobaciones de exec como de Plugin con fallback acotado: cuando no se encuentra un id de aprobación de exec, OpenClaw reintenta el mismo id mediante aprobaciones de Plugin. El reenvío de aprobaciones de Plugin puede configurarse de forma independiente mediante `approvals.plugin` en la configuración.

Si la plomería personalizada de aprobaciones necesita detectar ese mismo caso de fallback acotado,
prefiere `isApprovalNotFoundError` desde `openclaw/plugin-sdk/error-runtime`
en lugar de comparar manualmente cadenas de expiración de aprobación.

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos y la referencia de hooks.

## Registro de herramientas de agente

Las herramientas son funciones tipadas que el LLM puede llamar. Pueden ser obligatorias (siempre
disponibles) u opcionales (activación por parte del usuario):

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

- Los nombres de herramientas no deben entrar en conflicto con las herramientas del núcleo (los conflictos se omiten)
- Las herramientas con objetos de registro mal formados, incluido `parameters` ausente, se omiten y se informan en los diagnósticos del Plugin en lugar de romper las ejecuciones de agentes
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un Plugin añadiendo el id del Plugin a `tools.allow`

## Registro de comandos de CLI

Los Plugins pueden añadir grupos de comandos raíz de `openclaw` con `api.registerCli`. Proporciona
`descriptors` para cada raíz de comando de nivel superior para que OpenClaw pueda mostrar y enrutar
el comando sin cargar con anticipación todos los runtimes de Plugins.

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

Después de la instalación, verifica el registro en runtime y ejecuta el comando:

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

Para ver la referencia completa de subrutas, consulta [Descripción general del SDK](/es/plugins/sdk-overview).

Dentro de tu Plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
las importaciones internas; nunca importes tu propio Plugin mediante su ruta de SDK.

Para Plugins de proveedor, mantén los asistentes específicos del proveedor en esos
barrels de la raíz del paquete, a menos que el punto de integración sea verdaderamente genérico. Ejemplos incluidos actuales:

- Anthropic: envoltorios de streaming de Claude y asistentes de `service_tier` / beta
- OpenAI: constructores de proveedor, asistentes de modelo predeterminado, proveedores realtime
- OpenRouter: constructor de proveedor más asistentes de incorporación/configuración

Si un asistente solo es útil dentro de un paquete de proveedor incluido, mantenlo en ese
punto de integración de la raíz del paquete en lugar de promoverlo a `openclaw/plugin-sdk/*`.

Aún existen algunos puntos de integración auxiliares generados `openclaw/plugin-sdk/<bundled-id>` para
el mantenimiento de Plugins incluidos cuando tienen uso registrado por propietarios. Trátalos como
superficies reservadas, no como el patrón predeterminado para nuevos Plugins de terceros.

## Lista de verificación previa al envío

<Check>**package.json** tiene metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins dentro del repositorio)</Check>

## Pruebas de versión beta

1. Vigila las etiquetas de lanzamiento de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen el formato `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de X de OpenClaw [@openclaw](https://x.com/openclaw) para anuncios de lanzamientos.
2. Prueba tu Plugin con la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal de Discord `plugin-forum` después de probar, con `all good` o indicando qué se rompió. Si aún no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Incluye el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para los mantenedores y la automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa que está todo verde. Si pierdes la ventana, es probable que tu corrección llegue en el siguiente ciclo.

## Próximos pasos

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
  <Card title="Asistentes de runtime" icon="settings" href="/es/plugins/sdk-runtime">
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

- [Arquitectura de Plugin](/es/plugins/architecture) — análisis profundo de la arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
- [Manifiesto](/es/plugins/manifest) — formato del manifiesto de Plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de Plugins de proveedor
