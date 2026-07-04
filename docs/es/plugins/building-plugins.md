---
doc-schema-version: 1
read_when:
    - Quieres crear un nuevo plugin de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugin
    - Estás eligiendo entre documentación de canal, proveedor, backend de CLI, herramienta o hook
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Creación de plugins
x-i18n:
    generated_at: "2026-07-04T15:08:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins extiende OpenClaw sin cambiar el núcleo. Un Plugin puede añadir un canal
de mensajería, un proveedor de modelos, un backend de CLI local, una herramienta
de agente, un hook, un proveedor de medios u otra capacidad propiedad del Plugin.

No necesitas añadir un Plugin externo al repositorio de OpenClaw. Publica
el paquete en [ClawHub](/es/clawhub) y los usuarios lo instalan con:

```bash
openclaw plugins install clawhub:<package-name>
```

Las especificaciones de paquete sin prefijo todavía se instalan desde npm durante la transición de lanzamiento. Usa el
prefijo `clawhub:` cuando quieras resolución de ClawHub.

## Requisitos

- Usa Node 22.19+, Node 23.11+ o Node 24+ y un gestor de paquetes como `npm` o `pnpm`.
- Familiarízate con los módulos TypeScript ESM.
- Para trabajar con Plugins incluidos en el repositorio, clona el repositorio y ejecuta `pnpm install`.
  El desarrollo de Plugins desde un checkout de código fuente solo admite pnpm porque OpenClaw carga los Plugins
  incluidos desde los paquetes de workspace `extensions/*`.

## Elegir la forma del Plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería.
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos, medios, búsqueda, fetch, voz o tiempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/es/plugins/cli-backend-plugins">
    Ejecuta una CLI de IA local mediante la reserva de modelos de OpenClaw.
  </Card>
  <Card title="Plugin de herramienta" icon="wrench" href="/es/plugins/tool-plugins">
    Registra herramientas de agente.
  </Card>
</CardGroup>

## Inicio rápido

Crea un Plugin de herramienta mínimo registrando una herramienta de agente requerida. Esta es la
forma de Plugin útil más corta y muestra el paquete, el manifiesto, el punto de entrada y
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

    Los Plugins externos publicados deben apuntar las entradas de runtime a archivos JavaScript
    compilados. Consulta [puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para ver el contrato completo de
    puntos de entrada.

    Todo Plugin necesita un manifiesto, incluso cuando no tiene configuración. Las herramientas de runtime
    deben aparecer en `contracts.tools` para que OpenClaw pueda descubrir la propiedad sin
    cargar con anticipación todos los runtimes de Plugins. Configura `activation.onStartup`
    de forma intencional. Este ejemplo se inicia al arrancar el Gateway.

    Las superficies de Plugin de confianza del host también están controladas por el manifiesto y requieren
    habilitación explícita para los Plugins instalados. Si un Plugin instalado registra
    `api.registerAgentToolResultMiddleware(...)`, declara cada runtime de destino en
    `contracts.agentToolResultMiddleware`. Si registra
    `api.registerTrustedToolPolicy(...)`, declara cada id de política en
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

    Usa `definePluginEntry` para Plugins que no son de canal. Los Plugins de canal usan
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Probar el runtime">
    Para un Plugin instalado o externo, inspecciona el runtime cargado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si el Plugin registra un comando de CLI, ejecuta también ese comando. Por ejemplo,
    un comando de demostración debería tener una prueba de ejecución como
    `openclaw demo-plugin ping`.

    Para un Plugin incluido en este repositorio, OpenClaw descubre paquetes de Plugins
    desde checkout de código fuente en el workspace `extensions/*`. Ejecuta la prueba dirigida
    más cercana:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Probar la instalación del paquete">
    Antes de publicar un Plugin listo para empaquetar, prueba la misma forma de instalación que recibirán
    los usuarios. Primero añade un paso de compilación, apunta entradas de runtime como
    `openclaw.extensions` a JavaScript compilado como `./dist/index.js` y asegúrate de que
    `npm pack` incluya esa salida `dist/`. Las entradas de código fuente TypeScript son
    solo para checkouts de código fuente y rutas de desarrollo local.

    Luego empaqueta el Plugin e instala el tarball con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa el proyecto npm administrado por OpenClaw por Plugin, por lo que detecta
    errores de dependencias de runtime que las pruebas desde checkout de código fuente pueden ocultar. Prueba
    la forma del paquete y sus dependencias, no la confianza oficial vinculada al catálogo.
    Las importaciones de runtime deben estar en `dependencies` u `optionalDependencies`;
    las dependencias que queden solo en `devDependencies` no se instalarán para el
    proyecto de runtime administrado.

    No uses una instalación sin procesar desde archivo/ruta como prueba final para comportamiento de Plugins
    oficiales o privilegiados. Las fuentes sin procesar son útiles para depuración local, pero
    no prueban la misma ruta de dependencias que las instalaciones desde npm o ClawHub. Si
    tu Plugin depende de un estado de Plugin oficial de confianza, añade una segunda prueba
    mediante una instalación oficial respaldada por catálogo o una ruta de paquete publicado que
    registre la confianza oficial. Consulta
    [resolución de dependencias de Plugins](/es/plugins/dependency-resolution) para obtener
    detalles sobre raíz de instalación y propiedad de dependencias.

  </Step>

  <Step title="Publicar">
    Valida el paquete antes de publicar:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Los snippets canónicos de ClawHub están en `docs/snippets/plugin-publish/`.

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

Las herramientas pueden ser requeridas u opcionales. Las herramientas requeridas siempre están disponibles cuando el
Plugin está habilitado. Las herramientas opcionales requieren que el usuario las habilite.

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

Los usuarios la habilitan con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Las herramientas opcionales controlan si una herramienta se expone al modelo. Usa
[solicitudes de permisos de Plugins](/es/plugins/plugin-permission-requests) cuando una herramienta
o hook deba pedir aprobación después de que el modelo la seleccione y antes de que se
ejecute la acción.

Usa herramientas opcionales para efectos secundarios, binarios inusuales o capacidades que
no deberían exponerse de forma predeterminada. Los nombres de herramientas no deben entrar en conflicto con las herramientas principales;
los conflictos se omiten y se informan en los diagnósticos del Plugin. Los registros
malformados, incluidos descriptores de herramientas sin `parameters`, se omiten y se
informan del mismo modo. Las herramientas registradas son funciones tipadas que el modelo puede llamar
después de que pasen las comprobaciones de política y lista de permitidos.

Las fábricas de herramientas reciben un objeto de contexto suministrado por el runtime. Usa `ctx.activeModel`
cuando una herramienta necesite registrar, mostrar o adaptarse al modelo activo para el turno
actual. El objeto puede incluir `provider`, `modelId` y `modelRef`. Trátalo como
metadatos informativos de runtime, no como una frontera de seguridad frente al operador
local, el código de Plugins instalados o un runtime de OpenClaw modificado. Las herramientas locales
sensibles aún deberían requerir la habilitación explícita del Plugin o del operador y fallar de forma cerrada
cuando los metadatos del modelo activo falten o no sean adecuados.

El manifiesto declara propiedad y descubrimiento; la ejecución todavía llama a la implementación
registrada en vivo de la herramienta. Mantén `toolMetadata.<tool>.optional: true`
alineado con `api.registerTool(..., { optional: true })` para que OpenClaw pueda evitar
cargar ese runtime de Plugin hasta que la herramienta se incluya explícitamente en la lista de permitidos.

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
ruta del SDK. Los helpers específicos de proveedor deben permanecer en el paquete del proveedor salvo que
la superficie sea verdaderamente genérica.

Los métodos RPC personalizados de Gateway son un punto de entrada avanzado. Mantenlos bajo un
prefijo específico del Plugin; los espacios de nombres de administración principal como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` y `update.*` permanecen reservados
y se resuelven a `operator.admin`. El puente
`openclaw/plugin-sdk/gateway-method-runtime` está reservado para rutas HTTP de Plugins
que declaran `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para ver el mapa completo de importaciones, consulta [visión general del SDK de Plugins](/es/plugins/sdk-overview).

## Lista de verificación previa al envío

<Check>**package.json** tiene los metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas enfocadas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins en el repositorio)</Check>

## Probar contra versiones beta

1. Vigila las etiquetas de lanzamiento de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen un formato como `v2026.3.N-beta.1`. También puedes activar las notificaciones de la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para recibir anuncios de lanzamientos.
2. Prueba tu plugin con la etiqueta beta en cuanto aparezca. El intervalo antes de la versión estable suele ser de solo unas horas.
3. Publica en el hilo de tu plugin en el canal `plugin-forum` de Discord después de probarlo, ya sea con `all good` o con lo que se rompió. Si todavía no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace de la incidencia en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza la incidencia tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PRs, así que el título es la señal del lado del PR para los mantenedores y la automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse de todos modos. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa que todo está en verde. Si pierdes el intervalo, es probable que tu corrección aterrice en el siguiente ciclo.

## Siguientes pasos

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
    Referencia del mapa de importación y de la API de registro
  </Card>
  <Card title="Ayudantes de runtime" icon="settings" href="/es/plugins/sdk-runtime">
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

- [Hooks de Plugin](/es/plugins/hooks)
- [Arquitectura de Plugin](/es/plugins/architecture)
