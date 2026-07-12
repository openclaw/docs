---
doc-schema-version: 1
read_when:
    - Quieres crear un nuevo plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de plugins
    - Estás eligiendo entre la documentación de canales, proveedores, backends de CLI, herramientas o hooks.
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-11T23:16:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los Plugins amplían OpenClaw sin modificar el núcleo. Un Plugin puede añadir un canal
de mensajería, un proveedor de modelos, un backend local de CLI, una herramienta de agente, un hook, un proveedor multimedia
u otra capacidad propia del Plugin.

No es necesario añadir un Plugin externo al repositorio de OpenClaw. Publica
el paquete en [ClawHub](/clawhub) y los usuarios podrán instalarlo con:

```bash
openclaw plugins install clawhub:<package-name>
```

Durante la transición del lanzamiento, las especificaciones de paquete sin prefijo se siguen instalando desde npm. Usa el
prefijo `clawhub:` cuando quieras que la resolución se haga mediante ClawHub.

## Requisitos

- Node 22.19+, Node 23.11+ o Node 24+, y `npm` o `pnpm`.
- Módulos ESM de TypeScript.
- Para trabajar con Plugins incluidos en el repositorio, clona el repositorio y ejecuta `pnpm install`.
  El desarrollo de Plugins desde un checkout del código fuente solo admite pnpm porque OpenClaw detecta
  los Plugins incluidos a partir de los paquetes del espacio de trabajo `extensions/*`.

## Elige la estructura del Plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw con una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos, contenido multimedia, búsqueda, obtención de datos, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecuta una CLI local de IA mediante la alternativa de modelo de OpenClaw.
  </Card>
  <Card title="Plugin de herramientas" icon="wrench" href="/es/plugins/tool-plugins">
    Registra herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Crea un Plugin de herramientas mínimo registrando una herramienta de agente obligatoria. Esta es la
estructura de Plugin útil más breve y abarca el paquete, el manifiesto, el punto de entrada y
la comprobación local.

<Steps>
  <Step title="Crear los metadatos del paquete">
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

    Los Plugins externos publicados deben dirigir las entradas de ejecución a archivos JavaScript
    compilados. Consulta [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el contrato completo
    de los puntos de entrada.

    Cada Plugin necesita un manifiesto, aunque no tenga configuración. Las herramientas de ejecución deben
    aparecer en `contracts.tools` para que OpenClaw pueda detectar su propietario sin
    cargar de forma anticipada el entorno de ejecución de cada Plugin. Define `activation.onStartup`
    de forma intencionada; este ejemplo se carga al iniciar el Gateway.

    Las superficies de Plugins en las que confía el host también están controladas por el manifiesto y requieren una
    declaración explícita para los Plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    necesita que cada entorno de ejecución de destino figure en `contracts.agentToolResultMiddleware`,
    y `api.registerTrustedToolPolicy(...)` necesita cada identificador de política en
    `contracts.trustedToolPolicies`. Estas declaraciones mantienen alineadas la
    inspección durante la instalación y el registro durante la ejecución.

    Para consultar todos los campos del manifiesto, consulta [Manifiesto del Plugin](/es/plugins/manifest).

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

    Usa `definePluginEntry` para los Plugins que no sean de canal. En su lugar, los Plugins de canal usan
    `defineChannelPluginEntry` desde `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Probar el entorno de ejecución">
    Para un Plugin instalado o externo, inspecciona el entorno de ejecución cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el Plugin registra un comando de CLI, ejecútalo también y confirma
    la salida; por ejemplo, `openclaw demo-plugin ping`.

    Para un Plugin incluido en este repositorio, OpenClaw detecta los paquetes de Plugins
    del checkout del código fuente en el espacio de trabajo `extensions/*`. Ejecuta la prueba específica
    más cercana:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un Plugin listo para distribuir como paquete, prueba la misma forma de instalación que recibirán los
    usuarios. Primero añade un paso de compilación, dirige las entradas de ejecución como
    `openclaw.extensions` a JavaScript compilado, como `./dist/index.js`, y asegúrate
    de que `npm pack` incluya esa salida `dist/`. Las entradas de código fuente TypeScript son
    solo para checkouts del código fuente y rutas de desarrollo local.

    Después, empaqueta el Plugin e instala el archivo tar con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm por Plugin administrado por OpenClaw, por lo que detecta
    errores en las dependencias de ejecución que las pruebas desde un checkout del código fuente pueden ocultar. Demuestra
    la estructura del paquete y sus dependencias, no la confianza oficial vinculada al catálogo.
    Las importaciones en tiempo de ejecución deben estar en `dependencies` u `optionalDependencies`;
    las dependencias que se dejen únicamente en `devDependencies` no se instalarán para el
    proyecto de ejecución administrado.

    No uses una instalación directa desde archivo o ruta como comprobación final del comportamiento oficial o
    privilegiado de un Plugin. El código fuente directo es útil para la depuración local, pero
    no demuestra la misma ruta de dependencias que las instalaciones desde npm o ClawHub. Si
    tu Plugin depende del estado de confianza oficial de los Plugins, añade una segunda comprobación
    mediante una instalación oficial respaldada por el catálogo o una ruta de paquete publicado que
    registre la confianza oficial. Consulta
    [Resolución de dependencias de Plugins](/es/plugins/dependency-resolution) para obtener
    información sobre la raíz de instalación y la propiedad de las dependencias.

  </Step>

  <Step title="Publicar">
    Valida el paquete antes de publicarlo:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los fragmentos canónicos de paquetes de ClawHub se encuentran en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instala el paquete publicado mediante ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registro de herramientas

Las herramientas pueden ser obligatorias u opcionales. Las herramientas obligatorias siempre están disponibles cuando el
Plugin está habilitado. Las herramientas opcionales requieren la aceptación explícita del usuario antes de que OpenClaw
cargue el entorno de ejecución del Plugin propietario.

Las fábricas de herramientas reciben un contexto de ejecución de confianza, incluido `deliveryContext`,
`nativeChannelId` para la conversación activa en la plataforma cuando esté disponible y
`requesterSenderId`.

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

Los usuarios dan su consentimiento mediante `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Usa
[solicitudes de permisos de Plugins](/es/plugins/plugin-permission-requests) cuando una herramienta
o un hook deban solicitar aprobación después de que el modelo los seleccione y antes de que
se ejecute la acción.

Usa herramientas opcionales para efectos secundarios, binarios poco habituales o capacidades que
no deban exponerse de forma predeterminada. Los nombres de las herramientas no deben entrar en conflicto con los nombres de las herramientas
del núcleo; los conflictos se omiten y se notifican en los diagnósticos de Plugins. Los
registros con formato incorrecto se omiten y se notifican de la misma manera: un
`name` no vacío ausente, un `execute` que no sea una función o un descriptor de herramienta sin un objeto
`parameters`.

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el entorno de ejecución. Usa `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo del turno
actual; puede incluir `provider`, `modelId` y `modelRef`. Trátalo como
metadatos informativos del entorno de ejecución, no como un límite de seguridad frente al operador
local, el código de Plugins instalado o un entorno de ejecución de OpenClaw modificado. Las herramientas locales
confidenciales deben seguir requiriendo una aceptación explícita del Plugin o del operador y
cerrarse de forma segura cuando los metadatos del modelo activo falten o no sean adecuados.

El manifiesto declara la propiedad y la detección; la ejecución sigue invocando la implementación
registrada de la herramienta activa. Mantén `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar el entorno de ejecución de ese Plugin hasta que la herramienta se incluya explícitamente en la lista de permitidas.

## Convenciones de importación

Importa desde subrutas específicas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

No importes desde el punto de exportación raíz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro del paquete de tu Plugin, usa archivos de exportación locales como `api.ts` y
`runtime-api.ts` para las importaciones internas. No importes tu propio Plugin a través de una
ruta del SDK. Los auxiliares específicos del proveedor deben permanecer en el paquete del proveedor, salvo que
la interfaz sea realmente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado. Mantenlos bajo un
prefijo específico del Plugin; los espacios de nombres administrativos del núcleo, como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*`, permanecen reservados
y se resuelven como `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para las rutas HTTP del Plugin
que declaren `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para consultar el mapa completo de importaciones, consulta [Descripción general del SDK de Plugins](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** contiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas se completan correctamente (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` se completa correctamente (Plugins dentro del repositorio)</Check>

## Pruebas con versiones beta

1. Supervisa las versiones publicadas de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Las etiquetas beta tienen un formato similar a `v2026.3.N-beta.1`. También puedes seguir a [@openclaw](https://x.com/openclaw) en X para recibir anuncios de nuevas versiones.
2. Prueba tu plugin con la etiqueta beta en cuanto aparezca. El plazo antes de la versión estable suele ser de solo unas horas.
3. Después de realizar las pruebas, publica en el hilo de tu plugin en el canal `plugin-forum` de Discord ([discord.gg/clawd](https://discord.gg/clawd)) indicando `all good` o qué ha fallado. Crea un hilo si aún no tienes uno.
4. Si algo falla, abre o actualiza una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Incluye un enlace a la incidencia en tu hilo.
5. Abre una PR dirigida a `main` con el título `fix(<plugin-id>): beta blocker - <summary>` e incluye un enlace a la incidencia tanto en la PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar las PR, por lo que el título sirve como señal de la PR para los responsables de mantenimiento y la automatización. Los bloqueos que tengan una PR se fusionan; los que no la tengan podrían publicarse de todos modos.
6. El silencio significa que todo funciona correctamente. Si no llegas a tiempo, normalmente la corrección se incorporará en el siguiente ciclo.

## Próximos pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos
  </Card>
  <Card title="Plugins de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registra un backend local de CLI de IA
  </Card>
  <Card title="Descripción general del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importaciones y de la API de registro
  </Card>
  <Card title="Ayudantes de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda y subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto del plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema del manifiesto
  </Card>
</CardGroup>

## Contenido relacionado

- [Hooks de plugins](/es/plugins/hooks)
- [Arquitectura de plugins](/es/plugins/architecture)
