---
read_when:
    - Quieres crear un Plugin sencillo de OpenClaw que solo añada herramientas para agentes.
    - Quieres usar defineToolPlugin en lugar de escribir manualmente los metadatos del manifiesto del Plugin
    - Necesitas crear la estructura, generar, validar, probar o publicar un plugin que solo incluya herramientas.
sidebarTitle: Tool Plugins
summary: Crea herramientas de agente sencillas y tipadas con defineToolPlugin y openclaw plugins init/build/validate
title: Plugins de herramientas
x-i18n:
    generated_at: "2026-07-11T23:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crea un Plugin que solo añade herramientas invocables por el agente: sin
canal, proveedor de modelos, hook, servicio ni backend de configuración. Genera los
metadatos del manifiesto que OpenClaw necesita para detectar herramientas sin cargar el
código de ejecución del Plugin.

Para Plugins de proveedor, canal, hook, servicio o capacidades mixtas, comienza con
[Creación de Plugins](/es/plugins/building-plugins), [Plugins de canal](/es/plugins/sdk-channel-plugins)
o [Plugins de proveedor](/es/plugins/sdk-provider-plugins).

## Requisitos

- Node 22.19+, Node 23.11+ o Node 24+.
- Salida de paquete TypeScript ESM.
- `typebox` en `dependencies` (no solo en `devDependencies`; el Plugin generado
  lo importa durante la ejecución).
- `openclaw >=2026.5.17`, la primera versión que exporta
  `openclaw/plugin-sdk/tool-plugin`.
- Una raíz de paquete que distribuya `dist/`, `openclaw.plugin.json` y
  `package.json`.

## Inicio rápido

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` genera la estructura de:

| Archivo                | Propósito                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | Entrada de `defineToolPlugin` con una herramienta `echo`           |
| `src/index.test.ts`    | Prueba de metadatos que verifica la lista de herramientas           |
| `tsconfig.json`        | Salida TypeScript NodeNext en `dist/`                               |
| `vitest.config.ts`     | Configuración de Vitest para `src/**/*.test.ts`                     |
| `package.json`         | Scripts, dependencias de ejecución, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Metadatos de manifiesto generados para la herramienta inicial       |

`npm run plugin:build` ejecuta `npm run build` (tsc) y después
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
vuelve a compilar y ejecuta `openclaw plugins validate --entry ./dist/index.js`.
Una validación correcta muestra:

```text
Plugin stock-quotes is valid.
```

Opciones de `openclaw plugins init <id>`:

| Indicador            | Valor predeterminado | Efecto                                      |
| -------------------- | -------------------- | ------------------------------------------- |
| `--directory <path>` | `<id>`               | Directorio de salida                        |
| `--name <name>`      | `<id>` con mayúsculas de título | Nombre para mostrar               |
| `--type <type>`      | `tool`               | Tipo de estructura: `tool` o `provider`     |
| `--force`            | desactivado          | Sobrescribe un directorio de salida existente |

## Escribir una herramienta

`defineToolPlugin` recibe la identidad del Plugin, un esquema de configuración opcional y una
lista estática de herramientas. Los tipos de parámetros y configuración se infieren de los
esquemas de TypeBox.

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

Los nombres de las herramientas constituyen la API estable. Elige nombres únicos, en minúsculas y
lo suficientemente específicos para evitar colisiones con herramientas del núcleo u otros Plugins.

## Herramientas opcionales y de fábrica

Establece `optional: true` cuando los usuarios deban incluir explícitamente la herramienta en la
lista de permitidas antes de enviarla a un modelo. `openclaw plugins build` escribe la entrada de
manifiesto `toolMetadata.<tool>.optional` correspondiente, para que OpenClaw pueda saber que la
herramienta es opcional sin cargar el código de ejecución del Plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Usa `factory` cuando una herramienta necesite el contexto de herramientas de ejecución antes de poder
crearse: para excluirse de una ejecución concreta, inspeccionar el estado del entorno aislado o vincular
ayudantes de ejecución. Los metadatos permanecen estáticos aunque la herramienta concreta se cree
durante la ejecución.

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

Las fábricas siguen declarando de antemano un nombre fijo para la herramienta. Usa `definePluginEntry`
directamente cuando el Plugin calcule dinámicamente los nombres de las herramientas o combine herramientas
con hooks, servicios, proveedores o comandos.

## Valores devueltos

`defineToolPlugin` encapsula los valores devueltos simples en el formato de resultados de herramientas
de OpenClaw:

- Devuelve una cadena cuando el modelo deba ver exactamente ese texto.
- Devuelve un valor compatible con JSON cuando quieras que el modelo vea JSON con formato
  y que OpenClaw conserve el valor original en `details`.

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

Usa una herramienta de fábrica cuando necesites un `AgentToolResult` personalizado o quieras reutilizar una
implementación existente de `api.registerTool`.

## Configuración

`configSchema` es opcional. Omítelo y OpenClaw aplicará un esquema estricto de objeto vacío;
el manifiesto generado seguirá incluyendo `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Con un `configSchema`, el segundo argumento de `execute` obtiene su tipo a partir de él:

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

OpenClaw lee la configuración del Plugin desde su entrada en la configuración del Gateway. No
incorpores secretos directamente en el código fuente ni en ejemplos de documentación; usa la configuración,
variables de entorno o SecretRefs según el modelo de seguridad del Plugin.

## Metadatos generados

OpenClaw debe leer el manifiesto del Plugin antes de importar su código de ejecución.
`defineToolPlugin` expone metadatos estáticos para ello y
`openclaw plugins build` los escribe en el paquete. Vuelve a ejecutar el generador después de
cambiar el identificador, nombre, descripción, esquema de configuración, activación o nombres de
herramientas del Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifiesto generado para un Plugin con una herramienta:

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

`contracts.tools` es el contrato de detección importante: indica a OpenClaw qué
Plugin es propietario de cada herramienta sin cargar el entorno de ejecución de todos los Plugins instalados. Un
manifiesto obsoleto puede hacer que una herramienta no aparezca en la detección o que un error de registro
se atribuya al Plugin equivocado.

## Metadatos del paquete

`openclaw plugins build` también alinea `package.json` con la entrada de ejecución
seleccionada:

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

Distribuye JavaScript compilado (`./dist/index.js`), no una entrada de código fuente TypeScript.
Las entradas de código fuente solo funcionan para el desarrollo local en el espacio de trabajo.

## Validar en CI

`plugins build --check` falla sin reescribir archivos cuando los metadatos generados
están obsoletos:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` comprueba que:

- `openclaw.plugin.json` exista y supere el cargador de manifiestos normal.
- La entrada actual exporte metadatos de `defineToolPlugin`.
- Los campos del manifiesto generado coincidan con los metadatos de la entrada.
- `contracts.tools` coincida con los nombres de herramientas declarados.
- `package.json` dirija `openclaw.extensions` a la entrada de ejecución seleccionada.

## Instalar e inspeccionar localmente

Desde otro repositorio de OpenClaw o una CLI instalada, instala la ruta del paquete:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para una prueba rápida del paquete, empaquétalo primero e instala el archivo tar:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Después de instalarlo, reinicia o vuelve a cargar el Gateway y pide al agente que use la
herramienta. Si la herramienta no está visible, inspecciona el entorno de ejecución del Plugin y el catálogo de
herramientas efectivo antes de cambiar el código (consulta [Solución de problemas](#troubleshooting)).

## Publicar

Publica mediante ClawHub cuando el paquete esté listo. `clawhub package publish`
acepta un origen: una carpeta local, un repositorio de GitHub (`owner/repo[@ref]`) o una
URL de archivo tar.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Instálalo con un localizador explícito de ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Las especificaciones simples de paquetes npm siguen instalándose desde npm durante la transición del lanzamiento, pero
ClawHub es la superficie preferida para detectar y distribuir Plugins de OpenClaw.
Consulta [Publicación en ClawHub](/es/clawhub/publishing) para obtener información sobre el ámbito del propietario y
la revisión de versiones.

## Solución de problemas

### `plugin entry not found: ./dist/index.js`

El archivo de entrada seleccionado no existe. Ejecuta `npm run build` y, a continuación, vuelve a ejecutar
`openclaw plugins build --entry ./dist/index.js` o
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

La entrada no exportó un valor creado por `defineToolPlugin`. Confirma que la
exportación predeterminada del módulo sea el resultado de `defineToolPlugin(...)` o proporciona la
entrada correcta con `--entry`.

### `openclaw.plugin.json generated metadata is stale`

El manifiesto ya no coincide con los metadatos de la entrada. Ejecuta:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Confirma tanto los cambios de `openclaw.plugin.json` como los de `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Los metadatos del paquete apuntan a una entrada de ejecución diferente. Ejecuta
`openclaw plugins build --entry ./dist/index.js` para que el generador alinee los
metadatos del paquete con la entrada que pretendes distribuir.

### `Cannot find package 'typebox'`

El Plugin compilado importa `typebox` durante la ejecución. Mantenlo en `dependencies`,
reinstala, vuelve a compilar y ejecuta de nuevo la validación.

### La herramienta no aparece después de la instalación

Comprueba lo siguiente en orden:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` tiene `contracts.tools` con los nombres de herramientas esperados.
4. `package.json` tiene `openclaw.extensions: ["./dist/index.js"]`.
5. El Gateway se reinició o se recargó después de instalar el plugin.

## Véase también

- [Creación de plugins](/es/plugins/building-plugins)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Manifiesto del plugin](/es/plugins/manifest)
- [CLI de plugins](/es/cli/plugins)
- [Publicación en ClawHub](/es/clawhub/publishing)
