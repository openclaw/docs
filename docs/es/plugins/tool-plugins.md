---
read_when:
    - Quieres crear un Plugin simple de OpenClaw que solo agregue herramientas de agente
    - Quieres usar defineToolPlugin en lugar de escribir a mano los metadatos del manifiesto del plugin
    - Necesitas estructurar, generar, validar, probar o publicar un plugin solo de herramientas
sidebarTitle: Tool Plugins
summary: Crear herramientas de agente tipadas simples con defineToolPlugin y openclaw plugins init/build/validate
title: Plugins de herramientas
x-i18n:
    generated_at: "2026-06-27T12:31:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Los plugins de herramientas agregan herramientas invocables por agentes a OpenClaw sin agregar un canal,
proveedor de modelos, hook, servicio ni backend de configuración. Usa `defineToolPlugin` cuando el
plugin posee una lista fija de herramientas y quieres que OpenClaw genere los metadatos
del manifiesto que mantienen esas herramientas detectables sin cargar código de runtime.

El flujo recomendado es:

1. Crea el esqueleto de un paquete con `openclaw plugins init`.
2. Escribe herramientas con `defineToolPlugin`.
3. Compila JavaScript.
4. Genera los metadatos de `openclaw.plugin.json` y `package.json` con
   `openclaw plugins build`.
5. Valida los metadatos generados antes de publicar o instalar.

Para plugins de proveedor, canal, hook, servicio o capacidades mixtas, empieza con
[Crear plugins](/es/plugins/building-plugins), [Plugins de canal](/es/plugins/sdk-channel-plugins),
o [Plugins de proveedor](/es/plugins/sdk-provider-plugins).

## Requisitos

- Node >= 22.
- Salida de paquete TypeScript ESM.
- `typebox` para esquemas de configuración y parámetros de herramientas.
- `openclaw >=2026.5.17`, la primera versión de OpenClaw que exporta
  `openclaw/plugin-sdk/tool-plugin`.
- Una raíz de paquete que pueda distribuir `dist/`, `openclaw.plugin.json` y
  `package.json`.

El plugin generado importa `typebox` en runtime, así que mantén `typebox` en
`dependencies`, no solo en `devDependencies`.

## Inicio rápido

Crea un nuevo paquete de plugin:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

El esqueleto crea:

- `src/index.ts`: una entrada `defineToolPlugin` con una herramienta `echo`.
- `src/index.test.ts`: una pequeña prueba de metadatos.
- `tsconfig.json`: salida TypeScript NodeNext a `dist/`.
- `package.json`: scripts, dependencias de runtime y
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: metadatos de manifiesto generados para la herramienta inicial.

Salida de validación esperada:

```text
Plugin stock-quotes is valid.
```

## Escribir una herramienta

`defineToolPlugin` recibe la identidad del plugin, un esquema de configuración opcional y una
lista estática de herramientas. Los tipos de parámetros y configuración se infieren de los
esquemas TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Los nombres de herramientas son la API estable. Elige nombres que sean únicos, en minúsculas y
lo bastante específicos para evitar colisiones con herramientas del núcleo u otros plugins.

## Herramientas opcionales y de fábrica

Configura `optional: true` cuando los usuarios deban permitir explícitamente la herramienta antes de que
se envíe a un modelo:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` escribe la entrada de manifiesto `toolMetadata.<tool>.optional`
correspondiente, para que OpenClaw pueda detectar la herramienta sin cargar código de
runtime del plugin.

Usa `factory` cuando una herramienta necesita el contexto de herramienta de runtime antes de poder
crearse. La fábrica mantiene los metadatos estáticos mientras permite que la herramienta se excluya de una
ejecución específica, inspeccione el estado del sandbox o vincule helpers de runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Las fábricas siguen siendo para nombres de herramientas fijos. Usa `definePluginEntry` directamente cuando
el plugin calcule nombres de herramientas dinámicamente o combine herramientas con hooks,
servicios, proveedores, comandos u otras superficies de runtime.

## Valores de retorno

`defineToolPlugin` envuelve valores de retorno simples en el formato de resultado de herramienta
de OpenClaw:

- Devuelve una cadena cuando el modelo deba ver ese texto exacto.
- Devuelve un valor compatible con JSON cuando quieras que el modelo vea JSON formateado
  y que OpenClaw mantenga el valor original en `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Usa una herramienta de fábrica cuando necesites devolver un `AgentToolResult` personalizado o reutilizar
una implementación existente de `api.registerTool`. Usa `definePluginEntry` en lugar de
`defineToolPlugin` cuando necesites herramientas totalmente dinámicas o capacidades de plugin
mixtas.

## Configuración

`configSchema` es opcional. Si lo omites, OpenClaw usa un esquema estricto de objeto vacío
y el manifiesto generado sigue incluyendo `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Cuando incluyes `configSchema`, el segundo argumento de `execute` se tipa a partir del
esquema:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw lee la configuración del plugin desde la entrada del plugin en la configuración del Gateway. No
codifiques secretos en el código fuente ni en ejemplos de documentación. Usa configuración, variables de
entorno o SecretRefs según el modelo de seguridad del plugin.

## Metadatos generados

OpenClaw detecta plugins instalados a partir de metadatos fríos. Debe poder leer
el manifiesto del plugin antes de importar el código de runtime del plugin. Por eso, `defineToolPlugin`
expone metadatos estáticos, y `openclaw plugins build` escribe esos
metadatos en el paquete.

Ejecuta el generador después de cambiar el id, nombre, descripción, esquema de configuración,
activación o nombres de herramientas del plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Para un plugin de una sola herramienta, el manifiesto generado se ve así:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` es el contrato de detección importante. Indica a OpenClaw qué
plugin posee cada herramienta sin cargar el runtime de todos los plugins instalados. Si el
manifiesto está obsoleto, la herramienta puede faltar en la detección o se puede atribuir al plugin
incorrecto un error de registro.

## Metadatos del paquete

Para el flujo sencillo de plugin de herramientas, `openclaw plugins build` alinea
`package.json` con la única entrada de runtime seleccionada:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Usa JavaScript compilado como `./dist/index.js` para paquetes instalados. Las entradas de
código fuente son útiles en el desarrollo dentro del workspace, pero los paquetes publicados no deben
depender de la carga de runtime de TypeScript.

## Validar en CI

Usa `plugins build --check` para hacer fallar CI cuando los metadatos generados estén obsoletos sin
reescribir archivos:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` comprueba que:

- `openclaw.plugin.json` exista y pase el cargador de manifiestos normal.
- La entrada actual exporte metadatos de `defineToolPlugin`.
- Los campos del manifiesto generado coincidan con los metadatos de la entrada.
- `contracts.tools` coincida con los nombres de herramientas declarados.
- `package.json` apunte `openclaw.extensions` a la entrada de runtime seleccionada.

## Instalar e inspeccionar localmente

Desde un checkout separado de OpenClaw o una CLI instalada, instala la ruta del paquete:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para una prueba de humo empaquetada, empaqueta primero e instala el tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Después de la instalación, inicia o reinicia el Gateway y pide al agente que use la
herramienta. Si estás depurando la visibilidad de herramientas, inspecciona el runtime del plugin y el
catálogo efectivo de herramientas antes de cambiar el código.

## Publicar

Publica a través de ClawHub cuando el paquete esté listo:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Instala con un localizador explícito de ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Las especificaciones simples de paquetes npm siguen siendo compatibles durante la transición de lanzamiento, pero ClawHub
es la superficie preferida de detección y distribución para los plugins de OpenClaw.

## Solución de problemas

### `plugin entry not found: ./dist/index.js`

El archivo de entrada seleccionado no existe. Ejecuta `npm run build` y luego vuelve a ejecutar
`openclaw plugins build --entry ./dist/index.js` o
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

La entrada no exportó un valor creado por `defineToolPlugin`. Comprueba que la
exportación predeterminada del módulo sea el resultado de `defineToolPlugin(...)`, o pasa la
entrada correcta con `--entry`.

### `openclaw.plugin.json generated metadata is stale`

El manifiesto ya no coincide con los metadatos de la entrada. Ejecuta:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Confirma tanto los cambios de `openclaw.plugin.json` como los de `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Los metadatos del paquete apuntan a una entrada de runtime diferente. Ejecuta
`openclaw plugins build --entry ./dist/index.js` para que el generador alinee los
metadatos del paquete con la entrada que quieres distribuir.

### `Cannot find package 'typebox'`

El plugin compilado importa `typebox` en runtime. Mantén `typebox` en
`dependencies`, reinstala las dependencias del paquete, recompila y vuelve a ejecutar la validación.

### La herramienta no aparece después de instalar

Comprueba estos puntos en orden:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` tiene `contracts.tools` con los nombres de herramientas esperados.
4. `package.json` tiene `openclaw.extensions: ["./dist/index.js"]`.
5. El Gateway se reinició o recargó después de instalar el plugin.

## Ver también

- [Crear plugins](/es/plugins/building-plugins)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Manifiesto de plugin](/es/plugins/manifest)
- [CLI de plugins](/es/cli/plugins)
- [Publicación en ClawHub](/es/clawhub/publishing)
