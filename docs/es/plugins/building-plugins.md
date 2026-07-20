---
doc-schema-version: 1
read_when:
    - Quiere crear un nuevo plugin de OpenClaw
    - Necesita una guía de inicio rápido para el desarrollo de plugins
    - Está eligiendo entre la documentación de canales, proveedores, backends de la CLI, herramientas o hooks
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en cuestión de minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-20T00:51:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b2dbf37b2b1c62dd0079ad1db5f8a09b1572b5a6fcc61ae798a7f053dcc1aff1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los Plugins amplían OpenClaw sin modificar el núcleo. Un Plugin puede añadir un canal
de mensajería, un proveedor de modelos, un backend de CLI local, una herramienta de agente, un hook, un proveedor multimedia
u otra capacidad perteneciente al Plugin.

No es necesario añadir un Plugin externo al repositorio de OpenClaw. Publique
el paquete en [ClawHub](/es/clawhub) y los usuarios podrán instalarlo con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquetes sin prefijo siguen instalándose desde npm durante la transición de lanzamiento. Use el
prefijo `clawhub:` cuando quiera usar la resolución de ClawHub.

## Requisitos

- Node 22.22.3+, Node 24.15+ o Node 25.9+, y `npm` o `pnpm`.
- Módulos ESM de TypeScript.
- Para trabajar en Plugins incluidos en el repositorio, clone el repositorio y ejecute `pnpm install`.
  El desarrollo de Plugins desde el código fuente usa exclusivamente pnpm porque OpenClaw descubre
  los Plugins incluidos a partir de los paquetes del espacio de trabajo `extensions/*`.

## Elegir la estructura del Plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecte OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añada un proveedor de modelos, multimedia, búsqueda, recuperación, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecute una CLI de IA local mediante la alternativa de modelos de OpenClaw.
  </Card>
  <Card title="Plugin de herramientas" icon="wrench" href="/es/plugins/tool-plugins">
    Registre herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Cree un Plugin de herramientas mínimo registrando una herramienta de agente obligatoria. Esta es la
estructura de Plugin útil más sencilla y abarca el paquete, el manifiesto, el punto de entrada y
la prueba local.

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

    Los Plugins externos publicados deben dirigir las entradas del entorno de ejecución a archivos JavaScript
    compilados. Consulte [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para ver el contrato completo de los
    puntos de entrada.

    Todos los Plugins necesitan un manifiesto, incluso si no tienen configuración. Las herramientas del entorno de ejecución deben
    aparecer en `contracts.tools` para que OpenClaw pueda descubrir su propietario sin
    cargar por adelantado el entorno de ejecución de cada Plugin. Configure `activation.onStartup`
    de forma deliberada; este ejemplo se carga al iniciar el Gateway.

    Las superficies de Plugins en las que confía el host también están restringidas por el manifiesto y requieren una
    declaración explícita para los Plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    necesita que cada entorno de ejecución de destino figure en `contracts.agentToolResultMiddleware`,
    y `api.registerTrustedToolPolicy(...)` necesita cada identificador de política en
    `contracts.trustedToolPolicies`. Estas declaraciones mantienen alineadas la
    inspección durante la instalación y el registro en el entorno de ejecución.

    Para consultar todos los campos del manifiesto, consulte [Manifiesto del Plugin](/es/plugins/manifest).

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
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
            };
          },
        });
      },
    });
    ```

    Use `definePluginEntry` para los Plugins que no sean de canal. Los Plugins de canal usan
    en su lugar `defineChannelPluginEntry` de `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Probar el entorno de ejecución">
    Para un Plugin instalado o externo, inspeccione el entorno de ejecución cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el Plugin registra un comando de CLI, ejecute también ese comando y confirme
    la salida, por ejemplo, `openclaw demo-plugin ping`.

    Para un Plugin incluido en este repositorio, OpenClaw descubre los paquetes de Plugins
    del código fuente en el espacio de trabajo `extensions/*`. Ejecute la prueba específica más
    cercana:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un Plugin listo para empaquetar, pruebe la misma forma de instalación que
    recibirán los usuarios. Primero añada un paso de compilación, dirija entradas del entorno de ejecución como
    `openclaw.extensions` a JavaScript compilado como `./dist/index.js` y asegúrese de
    que `npm pack` incluya esa salida `dist/`. Las entradas de código fuente TypeScript son
    exclusivamente para repositorios de código fuente y rutas de desarrollo local.

    Después, empaquete el Plugin e instale el archivo tar con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm administrado por OpenClaw para cada Plugin, por lo que detecta
    errores en las dependencias del entorno de ejecución que las pruebas del código fuente pueden ocultar. Demuestra
    la estructura del paquete y sus dependencias, no la confianza oficial vinculada al catálogo.
    Las importaciones del entorno de ejecución deben estar en `dependencies` o `optionalDependencies`;
    las dependencias que solo estén en `devDependencies` no se instalarán para el
    proyecto administrado del entorno de ejecución.

    No use una instalación directa desde un archivo o una ruta como prueba final del comportamiento
    oficial o con privilegios de un Plugin. El código fuente directo es útil para la depuración local, pero
    no demuestra la misma ruta de dependencias que las instalaciones desde npm o ClawHub. Si
    su Plugin depende del estado de confianza de un Plugin oficial, añada una segunda prueba
    mediante una instalación oficial respaldada por un catálogo o una ruta de paquete publicado que
    registre la confianza oficial. Consulte
    [Resolución de dependencias de Plugins](/es/plugins/dependency-resolution) para obtener
    información sobre la raíz de instalación y la propiedad de las dependencias.

  </Step>

  <Step title="Publicar">
    Valide el paquete antes de publicarlo:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los fragmentos canónicos de paquetes de ClawHub se encuentran en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instale el paquete publicado mediante ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registro de herramientas

Las herramientas pueden ser obligatorias u opcionales. Las herramientas obligatorias siempre están disponibles cuando el
Plugin está habilitado. Las herramientas opcionales necesitan la aceptación explícita del usuario antes de que OpenClaw
cargue el entorno de ejecución del Plugin propietario.

Las fábricas de herramientas reciben un contexto de entorno de ejecución de confianza, incluido `deliveryContext`,
`nativeChannelId` para la conversación activa de la plataforma cuando esté disponible y
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` es opcional. Describe el valor estructurado `details` que usan
[Modo de código](/es/tools/code-mode) y [Búsqueda de herramientas](/es/tools/tool-search). Las llamadas al catálogo
rechazan los esquemas no válidos antes de la ejecución y validan el valor final después de
los hooks de herramientas. Omítalo para herramientas que no tengan un resultado JSON estable. Consulte
[Plugins de herramientas](/es/plugins/tool-plugins#output-contracts) para ver el contrato completo.

Todas las herramientas registradas con `api.registerTool(...)` también deben declararse en el
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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Use
[solicitudes de permisos del Plugin](/es/plugins/plugin-permission-requests) cuando una herramienta
o un hook deban solicitar aprobación después de que el modelo los seleccione y antes de que se
ejecute la acción.

Use herramientas opcionales para efectos secundarios, binarios poco habituales o capacidades que
no deban exponerse de forma predeterminada. Los nombres de las herramientas no deben entrar en conflicto con los nombres
de las herramientas del núcleo; los conflictos se omiten y se notifican en los diagnósticos del Plugin. Los
registros con formato incorrecto se omiten y se notifican del mismo modo: un
`name` no vacío ausente, un `execute` que no sea una función o un descriptor de herramienta sin un objeto `parameters`.

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el entorno de ejecución. Use `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo del turno
actual; puede incluir `provider`, `modelId` y `modelRef`. Trátelo como
metadatos informativos del entorno de ejecución, no como un límite de seguridad frente al operador
local, el código de Plugins instalado o un entorno de ejecución de OpenClaw modificado. Las herramientas
locales sensibles deben seguir requiriendo la aceptación explícita del Plugin o del operador y
cerrarse de forma segura cuando los metadatos del modelo activo falten o no sean adecuados.

El manifiesto declara la propiedad y el descubrimiento; la ejecución sigue llamando a la
implementación registrada activa de la herramienta. Mantenga `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar el entorno de ejecución de ese Plugin hasta que la herramienta se incluya explícitamente en la lista de permitidas.

## Convenciones de importación

Importe desde subrutas específicas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Dentro del paquete del Plugin, use archivos de barril locales como `api.ts` y
`runtime-api.ts` para las importaciones internas. No importe su propio Plugin mediante una
ruta del SDK. Los asistentes específicos del proveedor deben permanecer en el paquete del proveedor, salvo que
la interfaz sea verdaderamente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado. Manténgalos en un
prefijo específico del Plugin; los espacios de nombres administrativos del núcleo como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*` permanecen reservados
y se resuelven como `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para las rutas HTTP del Plugin
que declaren `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para consultar el mapa completo de importaciones, consulte [Descripción general del SDK de Plugins](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** contiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas se superan (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` se supera (Plugins del repositorio)</Check>

## Pruebas con versiones beta

1. Siga los lanzamientos de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Las etiquetas beta tienen el formato `v2026.3.N-beta.1`. También puede seguir a [@openclaw](https://x.com/openclaw) en X para recibir anuncios de lanzamientos.
2. Pruebe su plugin con la etiqueta beta en cuanto aparezca. El intervalo antes de la versión estable suele ser de solo unas horas.
3. Después de realizar las pruebas, publique en el hilo de su plugin en el canal de Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) e indique `all good` o qué ha fallado. Cree un hilo si aún no tiene uno.
4. Si algo falla, abra o actualice una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplique la etiqueta `beta-blocker`. Enlace la incidencia en su hilo.
5. Abra un PR en `main` con el título `fix(<plugin-id>): beta blocker - <summary>` y enlace la incidencia tanto en el PR como en su hilo de Discord. Los colaboradores no pueden etiquetar los PR, por lo que el título es la señal del PR para los mantenedores y la automatización. Los bloqueos que tengan un PR se fusionarán; los que no lo tengan podrían incluirse en el lanzamiento de todos modos.
6. El silencio significa que todo está correcto. Si no se llega a tiempo, normalmente la corrección se incluirá en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canales" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Cree un plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedores" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Cree un plugin de proveedor de modelos
  </Card>
  <Card title="Plugins de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registre un backend local de CLI de IA
  </Card>
  <Card title="Descripción general del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importaciones y la API de registro
  </Card>
  <Card title="Utilidades del entorno de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
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
