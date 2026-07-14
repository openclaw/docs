---
doc-schema-version: 1
read_when:
    - Quiere crear un nuevo plugin de OpenClaw
    - Necesita una guía de inicio rápido para el desarrollo de plugins
    - Está eligiendo entre la documentación de canales, proveedores, backends de CLI, herramientas o hooks
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-14T13:50:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los plugins amplían OpenClaw sin modificar el núcleo. Un plugin puede añadir un
canal de mensajería, un proveedor de modelos, un backend de CLI local, una herramienta
del agente, un hook, un proveedor multimedia u otra capacidad propia del plugin.

No es necesario añadir un plugin externo al repositorio de OpenClaw. Publique
el paquete en [ClawHub](/clawhub) y los usuarios podrán instalarlo con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquetes sin prefijo siguen instalándose desde npm durante la transición del lanzamiento. Use el
prefijo `clawhub:` cuando quiera que la resolución se realice mediante ClawHub.

## Requisitos

- Node 22.22.3+, Node 24.15+ o Node 25.9+, y `npm` o `pnpm`.
- Módulos ESM de TypeScript.
- Para trabajar con plugins incluidos en el repositorio, clone el repositorio y ejecute `pnpm install`.
  El desarrollo de plugins desde una copia del código fuente solo admite pnpm porque OpenClaw descubre
  los plugins incluidos en los paquetes del espacio de trabajo `extensions/*`.

## Elegir la estructura del plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecte OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añada un proveedor de modelos, contenido multimedia, búsqueda, obtención de datos, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecute una CLI de IA local mediante la alternativa de modelos de OpenClaw.
  </Card>
  <Card title="Plugin de herramientas" icon="wrench" href="/es/plugins/tool-plugins">
    Registre herramientas del agente.
  </Card>
</CardGroup>

## Inicio rápido

Cree un plugin de herramientas mínimo registrando una herramienta obligatoria del agente. Esta es la
estructura de plugin útil más sencilla y abarca el paquete, el manifiesto, el punto de entrada y
la verificación local.

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

    Los plugins externos publicados deben dirigir las entradas de ejecución a archivos JavaScript
    compilados. Consulte [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el contrato completo
    de los puntos de entrada.

    Todos los plugins necesitan un manifiesto, incluso si no tienen configuración. Las herramientas de ejecución deben
    aparecer en `contracts.tools` para que OpenClaw pueda descubrir su propietario sin
    cargar de forma anticipada la ejecución de cada plugin. Configure `activation.onStartup`
    deliberadamente; este ejemplo se carga al iniciar el Gateway.

    Las superficies de plugins en las que confía el host también están condicionadas por el manifiesto y requieren una
    declaración explícita para los plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    necesita que cada ejecución de destino figure en `contracts.agentToolResultMiddleware`,
    y `api.registerTrustedToolPolicy(...)` necesita cada identificador de política en
    `contracts.trustedToolPolicies`. Estas declaraciones mantienen alineadas la
    inspección durante la instalación y el registro en tiempo de ejecución.

    Para consultar todos los campos del manifiesto, consulte [Manifiesto del plugin](/es/plugins/manifest).

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

    Use `definePluginEntry` para los plugins que no sean de canal. Los plugins de canal usan
    en su lugar `defineChannelPluginEntry` de `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Probar la ejecución">
    Para un plugin instalado o externo, inspeccione la ejecución cargada:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el plugin registra un comando de CLI, ejecute también ese comando y confirme
    la salida; por ejemplo, `openclaw demo-plugin ping`.

    Para un plugin incluido en este repositorio, OpenClaw descubre los paquetes de plugins
    de la copia del código fuente en el espacio de trabajo `extensions/*`. Ejecute la prueba específica
    más cercana:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un plugin listo para empaquetar, pruebe la misma modalidad de instalación que
    recibirán los usuarios. Primero añada un paso de compilación, dirija las entradas de ejecución como
    `openclaw.extensions` al JavaScript compilado, como `./dist/index.js`, y asegúrese de
    que `npm pack` incluya esa salida `dist/`. Las entradas de código fuente de TypeScript son
    únicamente para copias del código fuente y rutas de desarrollo local.

    Después, empaquete el plugin e instale el archivo tar con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm por plugin administrado por OpenClaw, por lo que detecta
    errores en las dependencias de ejecución que las pruebas desde una copia del código fuente pueden ocultar. Esto verifica
    la estructura del paquete y sus dependencias, no la confianza oficial vinculada al catálogo.
    Las importaciones de ejecución deben estar en `dependencies` o `optionalDependencies`;
    las dependencias que solo estén en `devDependencies` no se instalarán en el
    proyecto de ejecución administrado.

    No utilice una instalación directa desde un archivo o una ruta como verificación final del comportamiento
    oficial o privilegiado del plugin. El código fuente directo resulta útil para la depuración local, pero
    no verifica la misma ruta de dependencias que las instalaciones desde npm o ClawHub. Si
    el plugin depende del estado de confianza de los plugins oficiales, añada una segunda verificación
    mediante una instalación oficial respaldada por el catálogo o una ruta de paquete publicado que
    registre la confianza oficial. Consulte
    [Resolución de dependencias de plugins](/es/plugins/dependency-resolution) para conocer
    los detalles de la raíz de instalación y la propiedad de las dependencias.

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

## Registrar herramientas

Las herramientas pueden ser obligatorias u opcionales. Las herramientas obligatorias siempre están disponibles cuando el
plugin está habilitado. Las herramientas opcionales necesitan la aceptación explícita del usuario antes de que OpenClaw
cargue la ejecución del plugin propietario.

Las fábricas de herramientas reciben un contexto de ejecución de confianza, incluidos `deliveryContext`,
`nativeChannelId` para la conversación activa de la plataforma cuando esté disponible, y
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

Todas las herramientas registradas con `api.registerTool(...)` también deben declararse en el
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

Los usuarios las habilitan con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Use
[solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests) cuando una herramienta
o un hook deban solicitar aprobación después de que el modelo los seleccione y antes de que se
ejecute la acción.

Use herramientas opcionales para efectos secundarios, binarios poco habituales o capacidades que
no deban exponerse de forma predeterminada. Los nombres de las herramientas no deben entrar en conflicto con los nombres de las herramientas
del núcleo; los conflictos se omiten y se notifican en el diagnóstico del plugin. Los
registros mal formados se omiten y se notifican de la misma manera: un
`name` no vacío ausente, un `execute` que no sea una función o un descriptor de herramienta sin un objeto `parameters`.

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el entorno de ejecución. Use `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo durante el turno
actual; puede incluir `provider`, `modelId` y `modelRef`. Trátelo como
metadatos informativos del entorno de ejecución, no como una frontera de seguridad frente al
operador local, el código de plugins instalado o un entorno de ejecución de OpenClaw modificado. Las herramientas
locales sensibles deben seguir requiriendo la habilitación explícita del plugin o del operador y
denegar la operación de forma predeterminada cuando falten los metadatos del modelo activo o no sean adecuados.

El manifiesto declara la propiedad y el descubrimiento; la ejecución sigue invocando la
implementación registrada y activa de la herramienta. Mantenga `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar la ejecución de ese plugin hasta que la herramienta se incluya explícitamente en la lista de permitidas.

## Convenciones de importación

Importe desde subrutas específicas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

No importe desde el barrel raíz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro del paquete del plugin, use archivos barrel locales como `api.ts` y
`runtime-api.ts` para las importaciones internas. No importe el propio plugin mediante una
ruta del SDK. Los auxiliares específicos de un proveedor deben permanecer en el paquete del proveedor, salvo que
la interfaz sea verdaderamente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado. Manténgalos bajo un
prefijo específico del plugin; los espacios de nombres administrativos del núcleo como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*` permanecen reservados
y se resuelven como `operator.admin`. El
puente `openclaw/plugin-sdk/gateway-method-runtime` está reservado para las rutas HTTP
de plugins que declaren `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para consultar el mapa completo de importaciones, consulte [Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** contiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas de `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas se superan (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` se supera (plugins del repositorio)</Check>

## Probar con versiones beta

1. Supervise las versiones de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Las etiquetas beta tienen el formato `v2026.3.N-beta.1`. También puede seguir a [@openclaw](https://x.com/openclaw) en X para recibir anuncios de versiones.
2. Pruebe su plugin con la etiqueta beta en cuanto aparezca. El plazo antes de la versión estable suele ser de solo unas horas.
3. Después de realizar las pruebas, publique en el hilo de su plugin en el canal de Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) e indique `all good` o qué ha dejado de funcionar. Cree un hilo si aún no tiene uno.
4. Si algo deja de funcionar, abra o actualice una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplique la etiqueta `beta-blocker`. Enlace la incidencia en su hilo.
5. Abra una PR para `main` titulada `fix(<plugin-id>): beta blocker - <summary>` y enlace la incidencia tanto en la PR como en su hilo de Discord. Los colaboradores no pueden etiquetar las PR, por lo que el título es la señal del lado de la PR para los mantenedores y la automatización. Los bloqueos con una PR se fusionan; los que no tengan una podrían publicarse de todos modos.
6. El silencio significa que todo está correcto. Perder el plazo suele significar que la corrección se incorporará en el siguiente ciclo.

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
    Referencia del mapa de importaciones y de la API de registro
  </Card>
  <Card title="Ayudantes de entorno de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
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
