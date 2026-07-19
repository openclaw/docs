---
read_when:
    - Quiere crear un Plugin sencillo de OpenClaw que solo añada herramientas de agente
    - Quieres usar defineToolPlugin en lugar de escribir manualmente los metadatos del manifiesto del plugin
    - Necesita crear la estructura, generar, validar, probar o publicar un plugin que solo incluya herramientas
sidebarTitle: Tool Plugins
summary: Crea herramientas de agente sencillas y tipadas con defineToolPlugin y openclaw plugins init/build/validate
title: Plugins de herramientas
x-i18n:
    generated_at: "2026-07-19T02:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6363ccc810e969e1efa2aa0b4208f27244f01db196713fc2dc25cf106b86429
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crea un plugin que solo añade herramientas invocables por el agente: sin
canal, proveedor de modelos, hook, servicio ni backend de configuración. Genera los
metadatos del manifiesto que OpenClaw necesita para descubrir herramientas sin cargar el código
de ejecución del plugin.

Para plugins de proveedor, canal, hook, servicio o capacidades mixtas, comience con
[Creación de plugins](/es/plugins/building-plugins), [Plugins de canal](/es/plugins/sdk-channel-plugins)
o [Plugins de proveedor](/es/plugins/sdk-provider-plugins).

## Requisitos

- Node 22.22.3+, Node 24.15+ o Node 25.9+.
- Salida de paquete ESM de TypeScript.
- `typebox` en `dependencies` (no solo `devDependencies`; el plugin generado
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

`plugins init` genera la estructura inicial:

| Archivo                | Propósito                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | Entrada `defineToolPlugin` con una herramienta `echo`              |
| `src/index.test.ts`    | Prueba de metadatos que verifica la lista de herramientas          |
| `tsconfig.json`        | Salida TypeScript NodeNext en `dist/`                              |
| `vitest.config.ts`     | Configuración de Vitest para `src/**/*.test.ts`                    |
| `package.json`         | Scripts, dependencias de ejecución, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Metadatos de manifiesto generados para la herramienta inicial      |

`npm run plugin:build` ejecuta `npm run build` (tsc) y después
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
vuelve a compilar y ejecuta `openclaw plugins validate --entry ./dist/index.js`.
Una validación correcta muestra:

```text
El plugin stock-quotes es válido.
```

Opciones de `openclaw plugins init <id>`:

| Indicador            | Valor predeterminado | Efecto                                      |
| -------------------- | -------------------- | ------------------------------------------- |
| `--directory <path>` | `<id>`             | Directorio de salida                        |
| `--name <name>`      | `<id>` en formato de título | Nombre para mostrar                         |
| `--type <type>`      | `tool`             | Tipo de estructura inicial: `tool` o `provider` |
| `--force`            | desactivado          | Sobrescribe un directorio de salida existente |

## Escribir una herramienta

`defineToolPlugin` recibe la identidad del plugin, un esquema de configuración opcional y una
lista estática de herramientas. Los tipos de parámetros y configuración se infieren de los
esquemas de TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Obtener instantáneas de cotizaciones bursátiles.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Clave de la API de cotizaciones." })),
    baseUrl: Type.Optional(Type.String({ description: "URL base de la API de cotizaciones." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Cotización bursátil",
      description: "Obtener una instantánea de una cotización bursátil.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Símbolo bursátil, por ejemplo OPEN." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
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

Los nombres de las herramientas son la API estable. Elija nombres únicos, en minúsculas y
lo bastante específicos como para evitar colisiones con herramientas principales u otros plugins.

## Herramientas opcionales y de fábrica

Establezca `optional: true` cuando los usuarios deban incluir explícitamente la herramienta en la lista de permitidas antes de
enviarla a un modelo. `openclaw plugins build` escribe la entrada de manifiesto
`toolMetadata.<tool>.optional` correspondiente, de modo que OpenClaw pueda determinar que la
herramienta es opcional sin cargar el código de ejecución del plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Ejecutar un flujo de trabajo externo.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Use `factory` cuando una herramienta necesite el contexto de herramientas del entorno de ejecución antes de poder
crearse, ya sea para excluirse de una ejecución concreta, inspeccionar el estado del sandbox o vincular
funciones auxiliares del entorno de ejecución. Los metadatos permanecen estáticos aunque la herramienta concreta se cree
durante la ejecución.

```typescript
tool({
  name: "local_workflow",
  description: "Ejecutar un flujo de trabajo local fuera de sesiones aisladas en sandbox.",
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

Las fábricas siguen declarando de antemano un nombre de herramienta fijo. Use `definePluginEntry`
directamente cuando el plugin calcule dinámicamente los nombres de las herramientas o combine herramientas
con hooks, servicios, proveedores o comandos.

## Valores devueltos

`defineToolPlugin` envuelve los valores devueltos sin procesar en el formato de resultados de herramientas
de OpenClaw:

- Devuelva una cadena cuando el modelo deba ver exactamente ese texto.
- Devuelva un valor compatible con JSON cuando se quiera que el modelo vea JSON con formato
  y que OpenClaw conserve el valor original en `details`.

```typescript
tool({
  name: "echo_text",
  description: "Repetir el texto de entrada.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Repetir la entrada como JSON estructurado.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Use una herramienta de fábrica cuando necesite un `AgentToolResult` personalizado o quiera reutilizar una
implementación existente de `api.registerTool`.

## Contratos de salida

Añada `outputSchema` cuando una herramienta devuelva datos estables compatibles con JSON. Describe
el valor original almacenado en `AgentToolResult.details`, no el texto con formato
en `content`:

```typescript
tool({
  name: "shipment_list",
  description: "Enumerar envíos.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[Modo de código](/tools/code-mode) y [Búsqueda de herramientas](/es/tools/tool-search) convierten este
esquema en una indicación de salida acotada con estilo de TypeScript. Esto permite que un modelo invoque y
transforme un resultado conocido en un solo programa, en lugar de dedicar otro turno del modelo
a observar su estructura.

OpenClaw compila el esquema antes de ejecutar una llamada al catálogo y luego valida el
valor final de `details` después de los hooks de herramientas antes de devolverlo a través del puente.
Un esquema no válido impide ejecutar la herramienta; una discrepancia en el resultado hace fallar la
llamada completada. Incluya todas las variantes de resultado que no generen excepciones, incluidas las variantes de error
estructuradas, u omita el esquema cuando el resultado no sea estable. No incluya secretos
ni valores confidenciales en las descripciones del esquema, ya que los metadatos de salida de confianza pueden
quedar visibles para el modelo.
Use `{ additionalProperties: false }` en las capas de objetos cuando quiera una
indicación de salida compacta y completa; los esquemas abiertos o truncados siguen disponibles mediante
`tools.describe(...)`, pero no se anuncian como contratos completos de índice rápido.

Las herramientas de fábrica declaran `outputSchema` en el `AnyAgentTool` concreto que
devuelven. La declaración estática `tool({ factory })` no acepta un esquema de salida
separado porque podría divergir de la herramienta del entorno de ejecución.

## Configuración

`configSchema` es opcional. Si se omite, OpenClaw aplica un esquema estricto de objeto vacío;
el manifiesto generado sigue incluyendo `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Añade herramientas que no necesitan configuración.",
  tools: () => [],
});
```

Con un `configSchema`, el segundo argumento `execute` obtiene su tipo a partir de él:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Añade herramientas configuradas.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Comprobar si la configuración está disponible.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw lee la configuración del plugin desde la entrada del plugin en la configuración del Gateway. No
codifique secretos directamente en el código fuente ni en los ejemplos de documentación; use la configuración, variables de
entorno o SecretRefs según el modelo de seguridad del plugin.

## Metadatos generados

OpenClaw debe leer el manifiesto del plugin antes de importar el código de ejecución del plugin.
`defineToolPlugin` expone metadatos estáticos para ello y
`openclaw plugins build` los escribe en el paquete. Vuelva a ejecutar el generador después de
cambiar el identificador, el nombre, la descripción, el esquema de configuración, la activación o los nombres de las herramientas
del plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifiesto generado para un plugin con una herramienta:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Obtener instantáneas de cotizaciones bursátiles.",
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

`contracts.tools` es el contrato de descubrimiento importante: indica a OpenClaw qué
plugin posee cada herramienta sin cargar el entorno de ejecución de todos los plugins instalados. Un
manifiesto obsoleto puede hacer que una herramienta no aparezca en el descubrimiento o que un error de registro
se atribuya al plugin equivocado.

## Metadatos del paquete

`openclaw plugins build` también alinea `package.json` con la entrada del entorno de ejecución
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

Distribuya JavaScript compilado (`./dist/index.js`), no una entrada de código fuente TypeScript.
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

- `openclaw.plugin.json` exista y pase el cargador normal de manifiestos.
- La entrada actual exporte los metadatos `defineToolPlugin`.
- Los campos del manifiesto generado coincidan con los metadatos de la entrada.
- `contracts.tools` coincida con los nombres de herramientas declarados.
- `package.json` dirija `openclaw.extensions` a la entrada del entorno de ejecución seleccionada.

## Instalar e inspeccionar localmente

Desde otro checkout de OpenClaw o una CLI instalada, instale la ruta del paquete:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para realizar una prueba rápida del paquete, primero empaquételo e instale el archivo tar:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Después de la instalación, reinicie o vuelva a cargar el Gateway y pida al agente que use la
herramienta. Si la herramienta no está visible, inspeccione el entorno de ejecución del plugin y el catálogo
de herramientas efectivo antes de cambiar el código (consulte [Solución de problemas](#troubleshooting)).

## Publicación

Publique mediante ClawHub cuando el paquete esté listo. `clawhub package publish`
acepta una fuente: una carpeta local, un repositorio de GitHub (`owner/repo[@ref]`) o una
URL de un archivo tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Instale con un localizador explícito de ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Las especificaciones simples de paquetes npm aún se instalan desde npm durante la transición del lanzamiento, pero
ClawHub es la superficie preferida de descubrimiento y distribución para los
plugins de OpenClaw. Consulte [Publicación en ClawHub](/es/clawhub/publishing) para obtener información sobre el ámbito del propietario y
la revisión de la versión.

## Solución de problemas

### `plugin entry not found: ./dist/index.js`

El archivo de entrada seleccionado no existe. Ejecute `npm run build` y, a continuación, vuelva a ejecutar
`openclaw plugins build --entry ./dist/index.js` o
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

La entrada no exportó un valor creado por `defineToolPlugin`. Confirme que la
exportación predeterminada del módulo sea el resultado de `defineToolPlugin(...)`, o proporcione la
entrada correcta mediante `--entry`.

### `openclaw.plugin.json generated metadata is stale`

El manifiesto ya no coincide con los metadatos de la entrada. Ejecute:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Confirme los cambios de `openclaw.plugin.json` y `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Los metadatos del paquete apuntan a una entrada de entorno de ejecución diferente. Ejecute
`openclaw plugins build --entry ./dist/index.js` para que el generador alinee los
metadatos del paquete con la entrada que se pretende publicar.

### `Cannot find package 'typebox'`

El plugin compilado importa `typebox` durante la ejecución. Manténgalo en `dependencies`,
vuelva a instalar, compile de nuevo y repita la validación.

### La herramienta no aparece después de la instalación

Compruebe lo siguiente en este orden:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contiene `contracts.tools` con los nombres de herramienta esperados.
4. `package.json` contiene `openclaw.extensions: ["./dist/index.js"]`.
5. El Gateway se reinició o volvió a cargar después de instalar el plugin.

## Véase también

- [Creación de plugins](/es/plugins/building-plugins)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Manifiesto de plugin](/es/plugins/manifest)
- [CLI de plugins](/es/cli/plugins)
- [Publicación en ClawHub](/es/clawhub/publishing)
