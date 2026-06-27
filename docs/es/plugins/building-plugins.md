---
doc-schema-version: 1
read_when:
    - Quieres crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugin
    - Está eligiendo entre documentación de canal, proveedor, backend de CLI, herramienta o hook
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Crear plugins
x-i18n:
    generated_at: "2026-06-27T12:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los plugins extienden OpenClaw sin cambiar el núcleo. Un Plugin puede añadir un
canal de mensajería, un proveedor de modelos, un backend de CLI local, una
herramienta de agente, un hook, un proveedor de medios u otra capacidad
propiedad del Plugin.

No necesitas añadir un Plugin externo al repositorio de OpenClaw. Publica el
paquete en [ClawHub](/es/clawhub) y los usuarios lo instalan con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquete sin prefijo todavía se instalan desde npm
durante la transición de lanzamiento. Usa el prefijo `clawhub:` cuando quieras
la resolución de ClawHub.

## Requisitos

- Usa Node 22.19 o una versión más reciente y un gestor de paquetes como `npm` o `pnpm`.
- Familiarízate con los módulos ESM de TypeScript.
- Para trabajar con plugins incluidos en el repositorio, clona el repositorio y ejecuta `pnpm install`.
  El desarrollo de plugins desde un checkout del código fuente solo usa pnpm porque OpenClaw carga
  los plugins incluidos desde los paquetes de workspace `extensions/*`.

## Elige la forma del Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos, medios, búsqueda, obtención, voz o tiempo real.
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

    Los plugins externos publicados deben apuntar las entradas de runtime a archivos
    JavaScript compilados. Consulta [puntos de entrada del SDK](/es/plugins/sdk-entrypoints)
    para ver el contrato completo de puntos de entrada.

    Cada Plugin necesita un manifiesto, incluso cuando no tiene configuración.
    Las herramientas de runtime deben aparecer en `contracts.tools` para que
    OpenClaw pueda descubrir la propiedad sin cargar con anticipación cada
    runtime de Plugin. Configura `activation.onStartup` de forma intencional.
    Este ejemplo se inicia al arrancar el Gateway.

    Las superficies de Plugin confiadas por el host también están controladas
    por el manifiesto y requieren habilitación explícita para los plugins
    instalados. Si un Plugin instalado registra
    `api.registerAgentToolResultMiddleware(...)`, declara cada runtime de destino
    en `contracts.agentToolResultMiddleware`. Si registra
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

    Usa `definePluginEntry` para plugins que no sean de canal. Los plugins de
    canal usan `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Para un Plugin instalado o externo, inspecciona el runtime cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el Plugin registra un comando de CLI, ejecuta también ese comando. Por
    ejemplo, un comando de demostración debe tener una prueba de ejecución como
    `openclaw demo-plugin ping`.

    Para un Plugin incluido en este repositorio, OpenClaw descubre los paquetes
    de Plugin desde checkout de código fuente en el workspace `extensions/*`.
    Ejecuta la prueba dirigida más cercana:

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

    Los snippets canónicos de ClawHub viven en `docs/snippets/plugin-publish/`.

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

Las herramientas pueden ser obligatorias u opcionales. Las herramientas
obligatorias siempre están disponibles cuando el Plugin está habilitado. Las
herramientas opcionales requieren aceptación explícita del usuario.

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

Cada herramienta registrada con `api.registerTool(...)` también debe declararse
en el manifiesto del Plugin:

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

Las herramientas opcionales controlan si una herramienta se expone al modelo.
Usa [solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests)
cuando una herramienta o hook deba pedir aprobación después de que el modelo la
seleccione y antes de que se ejecute la acción.

Usa herramientas opcionales para efectos secundarios, binarios poco comunes o
capacidades que no deben exponerse de forma predeterminada. Los nombres de
herramientas no deben entrar en conflicto con las herramientas del núcleo; los
conflictos se omiten y se informan en los diagnósticos de Plugin. Los registros
malformados, incluidos los descriptores de herramienta sin `parameters`, se
omiten y se informan de la misma manera. Las herramientas registradas son
funciones tipadas que el modelo puede llamar después de que se superen las
comprobaciones de política y lista de permitidos.

Las fábricas de herramientas reciben un objeto de contexto suministrado por el
runtime. Usa `ctx.activeModel` cuando una herramienta necesite registrar,
mostrar o adaptarse al modelo activo del turno actual. El objeto puede incluir
`provider`, `modelId` y `modelRef`. Trátalo como metadatos informativos de
runtime, no como una frontera de seguridad contra el operador local, el código
de Plugin instalado o un runtime de OpenClaw modificado. Las herramientas
locales sensibles aun así deben requerir una aceptación explícita del Plugin o
del operador y fallar de forma cerrada cuando los metadatos del modelo activo
falten o no sean adecuados.

El manifiesto declara propiedad y descubrimiento; la ejecución todavía llama a
la implementación viva de la herramienta registrada. Mantén
`toolMetadata.<tool>.optional: true` alineado con
`api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar ese runtime de Plugin hasta que la herramienta se incluya explícitamente
en la lista de permitidos.

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
`runtime-api.ts` para las importaciones internas. No importes tu propio Plugin a
través de una ruta del SDK. Los helpers específicos del proveedor deben
permanecer en el paquete del proveedor a menos que la frontera sea realmente
genérica.

Los métodos RPC personalizados de Gateway son un punto de entrada avanzado.
Mantenlos con un prefijo específico del Plugin; los namespaces administrativos
del núcleo como `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` y
`update.*` permanecen reservados y se resuelven a `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para rutas HTTP de
Plugin que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para ver el mapa de importaciones completo, consulta [descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (plugins dentro del repositorio)</Check>

## Probar con versiones beta

1. Vigila las etiquetas de release de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta se ven como `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de releases.
2. Prueba tu Plugin contra la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal de Discord `plugin-forum` después de probar, ya sea con `all good` o con lo que se rompió. Si todavía no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Coloca el enlace del issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para los mantenedores y la automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, es probable que tu corrección entre en el siguiente ciclo.

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
    Mapa de importación y referencia de API de registro
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
