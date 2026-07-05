---
doc-schema-version: 1
read_when:
    - Quiere crear un nuevo Plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de plugins
    - Estás eligiendo entre la documentación de canales, proveedores, backend de CLI, herramientas o hooks.
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Crear plugins
x-i18n:
    generated_at: "2026-07-05T11:27:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71634f848091562bb2c1f5d3aa92a2b623beac190e3bd0b56cc01a1e333143b4
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins extienden OpenClaw sin cambiar el núcleo. Un plugin puede agregar un canal
de mensajería, proveedor de modelos, backend de CLI local, herramienta de agente, hook, proveedor multimedia
u otra capacidad propiedad del plugin.

No necesitas agregar un plugin externo al repositorio de OpenClaw. Publica
el paquete en [ClawHub](/clawhub) y los usuarios lo instalan con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquetes simples todavía se instalan desde npm durante la transición de lanzamiento. Usa el
prefijo `clawhub:` cuando quieras la resolución de ClawHub.

## Requisitos

- Node 22.19+, Node 23.11+ o Node 24+, y `npm` o `pnpm`.
- Módulos ESM de TypeScript.
- Para el trabajo en plugins incluidos en el repositorio, clona el repositorio y ejecuta `pnpm install`.
  El desarrollo de plugins desde una copia del código fuente solo usa pnpm porque OpenClaw descubre
  plugins incluidos desde paquetes de espacio de trabajo `extensions/*`.

## Elige la forma del plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Agrega un proveedor de modelos, multimedia, búsqueda, obtención, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecuta una CLI de IA local mediante la reserva de modelos de OpenClaw.
  </Card>
  <Card title="Plugin de herramienta" icon="wrench" href="/es/plugins/tool-plugins">
    Registra herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Crea un plugin de herramienta mínimo registrando una herramienta de agente obligatoria. Esta es la
forma de plugin útil más breve y cubre el paquete, el manifiesto, el punto de entrada y
la prueba local.

<Steps>
  <Step title="Crear metadatos del paquete">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Los plugins externos publicados deben apuntar las entradas de runtime a archivos JavaScript
    compilados. Consulta [puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para ver el contrato completo de
    punto de entrada.

    Todo plugin necesita un manifiesto, incluso sin configuración. Las herramientas de runtime deben
    aparecer en `contracts.tools` para que OpenClaw pueda descubrir la propiedad sin
    cargar con antelación el runtime de todos los plugins. Define `activation.onStartup`
    de forma intencionada; este ejemplo se carga al iniciar el Gateway.

    Las superficies de plugin en las que confía el host también están controladas por manifiesto y requieren una
    declaración explícita para los plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    necesita que cada runtime objetivo esté listado en `contracts.agentToolResultMiddleware`,
    y `api.registerTrustedToolPolicy(...)` necesita cada id de política en
    `contracts.trustedToolPolicies`. Estas declaraciones mantienen alineadas la
    inspección en el momento de instalación y el registro en runtime.

    Para cada campo del manifiesto, consulta [manifiesto de Plugin](/es/plugins/manifest).

  </Step>

  <Step title="Registrar la herramienta">
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

    Usa `definePluginEntry` para plugins que no sean de canal. Los plugins de canal usan
    `defineChannelPluginEntry` desde `openclaw/plugin-sdk/core` en su lugar.

  </Step>

  <Step title="Probar el runtime">
    Para un plugin instalado o externo, inspecciona el runtime cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el plugin registra un comando de CLI, ejecuta también ese comando y confirma
    la salida, por ejemplo `openclaw demo-plugin ping`.

    Para un plugin incluido en este repositorio, OpenClaw descubre los paquetes de plugin
    de la copia del código fuente desde el espacio de trabajo `extensions/*`. Ejecuta la prueba específica
    más cercana:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un plugin listo para empaquetar, prueba la misma forma de instalación que recibirán
    los usuarios. Primero agrega un paso de compilación, apunta entradas de runtime como
    `openclaw.extensions` a JavaScript compilado como `./dist/index.js`, y asegúrate
    de que `npm pack` incluya esa salida `dist/`. Las entradas de código fuente TypeScript son
    solo para copias del código fuente y rutas de desarrollo local.

    Luego empaqueta el plugin e instala el tarball con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm administrado por plugin de OpenClaw, por lo que detecta
    errores de dependencias de runtime que las pruebas desde una copia del código fuente pueden ocultar. Prueba
    la forma del paquete y las dependencias, no la confianza oficial vinculada al catálogo.
    Las importaciones de runtime deben estar en `dependencies` u `optionalDependencies`;
    las dependencias que queden solo en `devDependencies` no se instalarán para el
    proyecto de runtime administrado.

    No uses una instalación directa de archivo/ruta como prueba final para comportamiento de plugin oficial o
    privilegiado. Las fuentes directas son útiles para la depuración local, pero
    no prueban la misma ruta de dependencias que las instalaciones desde npm o ClawHub. Si
    tu plugin depende del estado de plugin oficial de confianza, agrega una segunda prueba
    mediante una instalación oficial respaldada por catálogo o una ruta de paquete publicado que
    registre la confianza oficial. Consulta
    [resolución de dependencias de Plugin](/es/plugins/dependency-resolution) para
    detalles de raíz de instalación y propiedad de dependencias.

  </Step>

  <Step title="Publicar">
    Valida el paquete antes de publicar:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los fragmentos canónicos de paquetes de ClawHub están en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instala el paquete publicado mediante ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrar herramientas

Las herramientas pueden ser obligatorias u opcionales. Las herramientas obligatorias siempre están disponibles cuando el
plugin está habilitado. Las herramientas opcionales necesitan la aceptación explícita del usuario antes de que OpenClaw
cargue el runtime del plugin propietario.

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

Toda herramienta registrada con `api.registerTool(...)` también debe declararse en el
manifiesto del plugin:

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

Los usuarios aceptan con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Usa
[solicitudes de permisos de plugin](/es/plugins/plugin-permission-requests) cuando una herramienta
o hook deba pedir aprobación después de que el modelo la seleccione y antes de que se
ejecute la acción.

Usa herramientas opcionales para efectos secundarios, binarios inusuales o capacidades que
no deberían exponerse de forma predeterminada. Los nombres de herramientas no deben entrar en conflicto con los nombres de herramientas del núcleo;
los conflictos se omiten y se informan en los diagnósticos del plugin. Los registros
mal formados se omiten y se informan del mismo modo: un `name` no vacío faltante,
un `execute` que no sea función o un descriptor de herramienta sin un objeto `parameters`.

Las fábricas de herramientas reciben un objeto de contexto suministrado por el runtime. Usa `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo para el turno
actual; puede incluir `provider`, `modelId` y `modelRef`. Trátalo como
metadatos informativos de runtime, no como un límite de seguridad frente al operador
local, el código de plugin instalado o un runtime de OpenClaw modificado. Las herramientas locales
sensibles aun así deben requerir una aceptación explícita del plugin u operador y
fallar de forma cerrada cuando los metadatos del modelo activo falten o no sean adecuados.

El manifiesto declara la propiedad y el descubrimiento; la ejecución sigue llamando a la implementación
registrada de la herramienta en vivo. Mantén `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar ese runtime de plugin hasta que la herramienta se incluya explícitamente en la lista de permitidas.

## Convenciones de importación

Importa desde subrutas específicas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

No importes desde el barrel raíz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro de tu paquete de plugin, usa archivos barrel locales como `api.ts` y
`runtime-api.ts` para importaciones internas. No importes tu propio plugin mediante una
ruta del SDK. Los helpers específicos de proveedor deben permanecer en el paquete de proveedor a menos que
la unión sea realmente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado. Mantenlos con un
prefijo específico del plugin; los espacios de nombres de administración del núcleo como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*` permanecen reservados
y se resuelven a `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para rutas HTTP de plugin
que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para el mapa completo de importaciones, consulta [descripción general del SDK de Plugin](/es/plugins/sdk-overview).

## Lista de verificación previa al envío

<Check>**package.json** tiene metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (plugins en el repositorio)</Check>

## Probar con versiones beta

1. Mira las versiones de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Las etiquetas beta tienen el formato `v2026.3.N-beta.1`. También puedes seguir a [@openclaw](https://x.com/openclaw) en X para anuncios de versiones.
2. Prueba tu plugin con la etiqueta beta en cuanto aparezca. La ventana antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu plugin en el canal de Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) después de probarlo, con `all good` o con lo que se rompió. Crea un hilo si todavía no tienes uno.
4. Si algo se rompe, abre o actualiza un issue titulado `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Enlaza el issue en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza el issue tanto en el PR como en tu hilo de Discord. Los contribuidores no pueden etiquetar PRs, así que el título es la señal del lado del PR para los mantenedores y la automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos.
6. El silencio equivale a verde. Perder la ventana normalmente significa que tu corrección llega en el siguiente ciclo.

## Próximos pasos

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registra un backend CLI de IA local
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y la API de registro
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
