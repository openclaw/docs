---
doc-schema-version: 1
read_when:
    - Quieres crear un nuevo plugin de OpenClaw
    - Necesita una guía de inicio rápido para el desarrollo de plugins
    - Está eligiendo entre documentación de canales, proveedores, backends de CLI, herramientas o hooks
sidebarTitle: Getting Started
summary: Crea tu primer plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-12T14:37:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Los plugins amplían OpenClaw sin modificar el núcleo. Un plugin puede añadir un
canal de mensajería, un proveedor de modelos, un backend de CLI local, una
herramienta de agente, un hook, un proveedor multimedia u otra capacidad
propiedad del plugin.

No es necesario añadir un plugin externo al repositorio de OpenClaw. Publique
el paquete en [ClawHub](/clawhub) y los usuarios podrán instalarlo con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquete sin prefijo siguen instalándose desde npm
durante la transición del lanzamiento. Use el prefijo `clawhub:` cuando quiera
que la resolución se realice mediante ClawHub.

## Requisitos

- Node 22.19+, Node 23.11+ o Node 24+, y `npm` o `pnpm`.
- Módulos ESM de TypeScript.
- Para trabajar con plugins incluidos en el repositorio, clone el repositorio y
  ejecute `pnpm install`. El desarrollo de plugins desde una copia del código
  fuente solo admite pnpm porque OpenClaw descubre los plugins incluidos a
  partir de los paquetes del espacio de trabajo `extensions/*`.

## Elija el tipo de plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecte OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añada un proveedor de modelos, contenido multimedia, búsqueda, obtención, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecute una CLI de IA local mediante la reserva de modelos de OpenClaw.
  </Card>
  <Card title="Plugin de herramientas" icon="wrench" href="/es/plugins/tool-plugins">
    Registre herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Cree un plugin de herramientas mínimo registrando una herramienta de agente
obligatoria. Este es el tipo de plugin útil más sencillo y abarca el paquete,
el manifiesto, el punto de entrada y la comprobación local.

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

    Los plugins externos publicados deben dirigir las entradas de ejecución a
    archivos JavaScript compilados. Consulte
    [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el
    contrato completo de los puntos de entrada.

    Cada plugin necesita un manifiesto, incluso si no tiene configuración. Las
    herramientas en tiempo de ejecución deben aparecer en `contracts.tools`
    para que OpenClaw pueda descubrir su propiedad sin cargar anticipadamente
    el entorno de ejecución de cada plugin. Configure
    `activation.onStartup` de forma intencionada; este ejemplo se carga al
    iniciar el Gateway.

    Las superficies de plugins en las que confía el host también están
    restringidas por el manifiesto y requieren una declaración explícita para
    los plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    necesita que cada entorno de ejecución de destino figure en
    `contracts.agentToolResultMiddleware`, y
    `api.registerTrustedToolPolicy(...)` necesita que cada identificador de
    política figure en `contracts.trustedToolPolicies`. Estas declaraciones
    mantienen alineadas la inspección durante la instalación y el registro en
    tiempo de ejecución.

    Para consultar todos los campos del manifiesto, consulte
    [Manifiesto de plugins](/es/plugins/manifest).

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

    Use `definePluginEntry` para los plugins que no sean de canal. Los plugins
    de canal usan en su lugar `defineChannelPluginEntry` de
    `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Probar el entorno de ejecución">
    Para un plugin instalado o externo, inspeccione el entorno de ejecución
    cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el plugin registra un comando de CLI, ejecute también ese comando y
    confirme la salida; por ejemplo, `openclaw demo-plugin ping`.

    Para un plugin incluido en este repositorio, OpenClaw descubre los paquetes
    de plugins de la copia del código fuente desde el espacio de trabajo
    `extensions/*`. Ejecute la prueba específica más cercana:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un plugin listo para empaquetar, pruebe el mismo tipo de
    instalación que recibirán los usuarios. Primero añada un paso de
    compilación, dirija las entradas de ejecución como `openclaw.extensions` a
    JavaScript compilado, por ejemplo `./dist/index.js`, y asegúrese de que
    `npm pack` incluya esa salida `dist/`. Las entradas de código fuente
    TypeScript son exclusivamente para copias del código fuente y rutas de
    desarrollo local.

    Después, empaquete el plugin e instale el archivo tar con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm administrado por OpenClaw para cada plugin,
    por lo que detecta errores de dependencias en tiempo de ejecución que las
    pruebas desde una copia del código fuente pueden ocultar. Demuestra la
    estructura del paquete y de sus dependencias, no la confianza oficial
    vinculada al catálogo. Las importaciones en tiempo de ejecución deben estar
    en `dependencies` u `optionalDependencies`; las dependencias que solo estén
    en `devDependencies` no se instalarán en el proyecto de ejecución
    administrado.

    No use una instalación directa desde un archivo o una ruta como
    comprobación final del comportamiento oficial o privilegiado de un plugin.
    El código fuente directo resulta útil para la depuración local, pero no
    demuestra la misma ruta de dependencias que las instalaciones desde npm o
    ClawHub. Si el plugin depende del estado de confianza de un plugin oficial,
    añada una segunda comprobación mediante una instalación oficial respaldada
    por el catálogo o una ruta de paquete publicado que registre la confianza
    oficial. Consulte
    [Resolución de dependencias de plugins](/es/plugins/dependency-resolution)
    para obtener detalles sobre la raíz de instalación y la propiedad de las
    dependencias.

  </Step>

  <Step title="Publicar">
    Valide el paquete antes de publicarlo:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los fragmentos canónicos de paquetes de ClawHub se encuentran en
    `docs/snippets/plugin-publish/`.

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

Las herramientas pueden ser obligatorias u opcionales. Las herramientas
obligatorias siempre están disponibles cuando el plugin está habilitado. Las
herramientas opcionales requieren la aceptación explícita del usuario antes de
que OpenClaw cargue el entorno de ejecución del plugin propietario.

Las fábricas de herramientas reciben contexto de ejecución de confianza,
incluidos `deliveryContext`, `nativeChannelId` para la conversación activa de
la plataforma cuando esté disponible y `requesterSenderId`.

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

Cada herramienta registrada con `api.registerTool(...)` también debe
declararse en el manifiesto del plugin:

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

Los usuarios las habilitan mediante `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo.
Use las [solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests)
cuando una herramienta o un hook deban solicitar aprobación después de que el
modelo los seleccione y antes de ejecutar la acción.

Use herramientas opcionales para efectos secundarios, binarios poco habituales
o capacidades que no deban exponerse de forma predeterminada. Los nombres de
las herramientas no deben entrar en conflicto con los nombres de las
herramientas del núcleo; los conflictos se omiten y se notifican en los
diagnósticos del plugin. Los registros con formato incorrecto se omiten y se
notifican del mismo modo: un `name` ausente o vacío, un `execute` que no sea una
función o un descriptor de herramienta sin un objeto `parameters`.

Las fábricas de herramientas reciben un objeto de contexto proporcionado por el
entorno de ejecución. Use `ctx.activeModel` cuando una herramienta necesite
registrar, mostrar o adaptarse al modelo activo durante el turno actual; puede
incluir `provider`, `modelId` y `modelRef`. Trátelo como metadatos informativos
del entorno de ejecución, no como un límite de seguridad frente al operador
local, el código de los plugins instalados o un entorno de ejecución de
OpenClaw modificado. Las herramientas locales sensibles deben seguir
requiriendo la habilitación explícita por parte del plugin o del operador y
deben denegar la operación de forma segura cuando falten los metadatos del
modelo activo o no sean adecuados.

El manifiesto declara la propiedad y el descubrimiento; la ejecución sigue
invocando la implementación de la herramienta registrada en vivo. Mantenga
`toolMetadata.<tool>.optional: true` alineado con
`api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar el entorno de ejecución de ese plugin hasta que la herramienta se
incluya explícitamente en la lista de permitidas.

## Convenciones de importación

Importe desde subrutas específicas del SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

No importe desde el módulo raíz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro del paquete del plugin, use archivos de exportación locales como
`api.ts` y `runtime-api.ts` para las importaciones internas. No importe el
propio plugin mediante una ruta del SDK. Los auxiliares específicos de un
proveedor deben permanecer en el paquete del proveedor, salvo que la interfaz
sea realmente genérica.

Los métodos RPC personalizados del Gateway son un punto de entrada avanzado.
Manténgalos bajo un prefijo específico del plugin; los espacios de nombres de
administración del núcleo como `config.*`, `exec.approvals.*`,
`operator.admin.*`, `wizard.*` y `update.*` permanecen reservados y se
resuelven como `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para las rutas HTTP
de plugins que declaren
`contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para consultar el mapa completo de importaciones, consulte
[Descripción general del SDK de plugins](/es/plugins/sdk-overview).

## Lista de comprobación previa al envío

<Check>**package.json** contiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas se superan (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` se supera (plugins del repositorio)</Check>

## Pruebas con versiones beta

1. Sigue los lanzamientos de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Las etiquetas beta tienen el formato `v2026.3.N-beta.1`. También puedes seguir a [@openclaw](https://x.com/openclaw) en X para recibir anuncios de lanzamientos.
2. Prueba tu plugin con la etiqueta beta en cuanto aparezca. El plazo antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu plugin en el canal de Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) después de realizar las pruebas, indicando `all good` o qué falló. Crea un hilo si aún no tienes uno.
4. Si algo falla, abre o actualiza una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Enlaza la incidencia en tu hilo.
5. Abre una PR hacia `main` titulada `fix(<plugin-id>): beta blocker - <summary>` y enlaza la incidencia tanto en la PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar las PR, por lo que el título es la señal del lado de la PR para los mantenedores y la automatización. Los bloqueos con una PR se fusionan; los que no tengan una podrían incluirse en el lanzamiento de todos modos.
6. El silencio significa que todo está correcto. Perder el plazo suele significar que tu corrección se incorporará en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canales" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedores" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos
  </Card>
  <Card title="Plugins de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Registra un backend local de CLI de IA
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

## Relacionado

- [Hooks de plugins](/es/plugins/hooks)
- [Arquitectura de plugins](/es/plugins/architecture)
