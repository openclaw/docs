---
doc-schema-version: 1
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugin
    - Estás eligiendo entre documentación de canal, proveedor, backend de CLI, herramienta o hook
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-04T08:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los Plugins amplían OpenClaw sin cambiar el núcleo. Un Plugin puede añadir un
canal de mensajería, un proveedor de modelos, un backend de CLI local, una
herramienta de agente, un hook, un proveedor de medios u otra capacidad propiedad
del Plugin.

No necesitas añadir un Plugin externo al repositorio de OpenClaw. Publica el
paquete en [ClawHub](/es/clawhub) y los usuarios lo instalan con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquete sin prefijo siguen instalándose desde npm durante
la transición de lanzamiento. Usa el prefijo `clawhub:` cuando quieras la
resolución de ClawHub.

## Requisitos

- Usa Node 22.19+, Node 23.11+ o Node 24+, y un gestor de paquetes como `npm` o `pnpm`.
- Ten familiaridad con módulos TypeScript ESM.
- Para trabajar con Plugins incluidos dentro del repositorio, clona el repositorio y ejecuta `pnpm install`.
  El desarrollo de Plugins desde un checkout de código fuente solo usa pnpm porque OpenClaw carga los Plugins
  incluidos desde paquetes de workspace `extensions/*`.

## Elige la forma del Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos, medios, búsqueda, recuperación, voz o tiempo real.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecuta una CLI de IA local mediante el fallback de modelos de OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/es/plugins/tool-plugins">
    Registra herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Crea un Plugin de herramienta mínimo registrando una herramienta de agente
obligatoria. Esta es la forma de Plugin útil más corta y muestra el paquete, el
manifiesto, el punto de entrada y la prueba local.

<Steps>
  <Step title="Create package metadata">
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

    Los Plugins externos publicados deben apuntar sus entradas de runtime a archivos
    JavaScript compilados. Consulta [puntos de entrada del SDK](/es/plugins/sdk-entrypoints)
    para ver el contrato completo de puntos de entrada.

    Todo Plugin necesita un manifiesto, incluso cuando no tiene configuración. Las herramientas de runtime
    deben aparecer en `contracts.tools` para que OpenClaw pueda descubrir la propiedad sin
    cargar ansiosamente cada runtime de Plugin. Define `activation.onStartup`
    deliberadamente. Este ejemplo se inicia durante el arranque del Gateway.

    Las superficies de Plugin confiadas por el host también están controladas por manifiesto y requieren habilitación
    explícita para los Plugins instalados. Si un Plugin instalado registra
    `api.registerAgentToolResultMiddleware(...)`, declara cada runtime de destino en
    `contracts.agentToolResultMiddleware`. Si registra
    `api.registerTrustedToolPolicy(...)`, declara cada id de política en
    `contracts.trustedToolPolicies`. Estas declaraciones mantienen alineadas la
    inspección en tiempo de instalación y el registro en runtime.

    Para cada campo del manifiesto, consulta [manifiesto de Plugin](/es/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Usa `definePluginEntry` para Plugins que no sean de canal. Los Plugins de canal usan
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Para un Plugin instalado o externo, inspecciona el runtime cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el Plugin registra un comando de CLI, ejecuta también ese comando. Por ejemplo,
    un comando de demostración debe tener una prueba de ejecución como
    `openclaw demo-plugin ping`.

    Para un Plugin incluido en este repositorio, OpenClaw descubre los paquetes de
    Plugin de checkout de código fuente desde el workspace `extensions/*`. Ejecuta la prueba
    dirigida más cercana:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Valida el paquete antes de publicarlo:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los fragmentos canónicos de ClawHub viven en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Instala el paquete publicado mediante ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrar herramientas

Las herramientas pueden ser obligatorias u opcionales. Las herramientas obligatorias siempre están disponibles cuando el
Plugin está habilitado. Las herramientas opcionales requieren aceptación explícita del usuario.

```typescript
register(api) {
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

Cada herramienta registrada con `api.registerTool(...)` también debe declararse en el
manifiesto del Plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Los usuarios aceptan explícitamente con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Usa
[solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests) cuando una herramienta
o hook deba solicitar aprobación después de que el modelo la seleccione y antes de que
se ejecute la acción.

Usa herramientas opcionales para efectos secundarios, binarios inusuales o capacidades que
no deban exponerse de forma predeterminada. Los nombres de herramientas no deben entrar en conflicto con las herramientas del núcleo;
los conflictos se omiten y se informan en los diagnósticos del Plugin. Los registros
mal formados, incluidos los descriptores de herramientas sin `parameters`, se omiten y
se informan de la misma forma. Las herramientas registradas son funciones tipadas que el modelo puede invocar
después de que pasen las comprobaciones de política y allowlist.

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el runtime. Usa `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo del turno
actual. El objeto puede incluir `provider`, `modelId` y `modelRef`. Trátalo como
metadatos informativos de runtime, no como un límite de seguridad frente al operador local,
el código de Plugins instalado o un runtime de OpenClaw modificado. Las herramientas locales sensibles
deben seguir exigiendo aceptación explícita del Plugin u operador y fallar de forma cerrada
cuando los metadatos del modelo activo falten o no sean adecuados.

El manifiesto declara propiedad y descubrimiento; la ejecución sigue llamando a la implementación
viva de la herramienta registrada. Mantén `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar ese runtime de Plugin hasta que la herramienta se incluya explícitamente en la allowlist.

## Convenciones de importación

Importa desde subrutas enfocadas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

No importes desde el barrel raíz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro de tu paquete de Plugin, usa archivos barrel locales como `api.ts` y
`runtime-api.ts` para importaciones internas. No importes tu propio Plugin mediante una
ruta del SDK. Los helpers específicos de proveedor deben permanecer en el paquete del proveedor a menos que
la interfaz sea realmente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado. Mantenlos en un
prefijo específico del Plugin; los namespaces de administración del núcleo como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*` permanecen reservados
y resuelven a `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para rutas HTTP de Plugin
que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para ver el mapa de importación completo, consulta [resumen del SDK de Plugin](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** tiene metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins dentro del repositorio)</Check>

## Probar contra versiones beta

1. Vigila las etiquetas de lanzamientos de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen la forma `v2026.3.N-beta.1`. También puedes activar notificaciones para la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de lanzamientos.
2. Prueba tu Plugin contra la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal de Discord `plugin-forum` después de probar, con `all good` o con lo que se haya roto. Si aún no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para mantenedores y automatización. Los bloqueadores con PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, probablemente tu corrección aterrizará en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registra un backend de CLI de IA local
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/es/plugins/sdk-overview">
    Mapa de importación y referencia de la API de registro
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema del manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Hooks de Plugin](/es/plugins/hooks)
- [Arquitectura de Plugin](/es/plugins/architecture)
