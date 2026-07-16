---
read_when:
    - Quieres crear un Plugin sencillo de OpenClaw que solo añada herramientas de agente
    - Se desea usar defineToolPlugin en lugar de escribir manualmente los metadatos del manifiesto del plugin
    - Necesita estructurar, generar, validar, probar o publicar un plugin que solo incluya herramientas
sidebarTitle: Tool Plugins
summary: Crea herramientas de agente sencillas y tipadas con defineToolPlugin y openclaw plugins init/build/validate
title: Plugins de herramientas
x-i18n:
    generated_at: "2026-07-16T11:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crea un plugin que solo añade herramientas invocables por el agente: sin
canal, proveedor de modelos, hook, servicio ni backend de configuración. Genera los
metadatos del manifiesto que OpenClaw necesita para descubrir herramientas sin cargar el código
de ejecución del plugin.

Para plugins de proveedor, canal, hook, servicio o capacidades mixtas, consulte
[Creación de plugins](/es/plugins/building-plugins), [Plugins de canal](/es/plugins/sdk-channel-plugins)
o [Plugins de proveedor](/es/plugins/sdk-provider-plugins).

## Requisitos

- Node 22.22.3+, Node 24.15+ o Node 25.9+.
- Salida de paquete TypeScript ESM.
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

`plugins init` genera:

| Archivo                | Propósito                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | Entrada `defineToolPlugin` con una herramienta `echo`             |
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
| `--name <name>`      | `<id>` con mayúsculas de título | Nombre para mostrar                         |
| `--type <type>`      | `tool`             | Tipo de estructura: `tool` o `provider` |
| `--force`            | desactivado          | Sobrescribir un directorio de salida existente |

## Escribir una herramienta

`defineToolPlugin` recibe la identidad del plugin, un esquema de configuración opcional y una
lista estática de herramientas. Los tipos de parámetros y configuración se infieren de los
esquemas de TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Cotizaciones bursátiles",
  description: "Obtiene instantáneas de cotizaciones bursátiles.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Clave de la API de cotizaciones." })),
    baseUrl: Type.Optional(Type.String({ description: "URL base de la API de cotizaciones." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Cotización bursátil",
      description: "Obtiene una instantánea de una cotización bursátil.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Símbolo bursátil, por ejemplo OPEN." }),
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

Los nombres de las herramientas son la API estable. Elija nombres únicos, en minúsculas y
lo bastante específicos para evitar colisiones con las herramientas del núcleo u otros plugins.

## Herramientas opcionales y de fábrica

Establezca `optional: true` cuando los usuarios deban incluir explícitamente la herramienta en la lista de permitidas antes de
enviarla a un modelo. `openclaw plugins build` escribe la entrada de manifiesto
`toolMetadata.<tool>.optional` correspondiente para que OpenClaw pueda determinar que la
herramienta es opcional sin cargar el código de ejecución del plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Ejecuta un flujo de trabajo externo.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Utilice `factory` cuando una herramienta necesite el contexto de herramientas de ejecución antes de poder
crearse: para excluirse de una ejecución concreta, inspeccionar el estado del entorno aislado o vincular
funciones auxiliares de ejecución. Los metadatos permanecen estáticos aunque la herramienta concreta se cree
durante la ejecución.

```typescript
tool({
  name: "local_workflow",
  description: "Ejecuta un flujo de trabajo local fuera de las sesiones aisladas.",
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

Las fábricas siguen declarando de antemano un nombre fijo para la herramienta. Utilice `definePluginEntry`
directamente cuando el plugin calcule dinámicamente los nombres de las herramientas o combine herramientas
con hooks, servicios, proveedores o comandos.

## Valores devueltos

`defineToolPlugin` encapsula los valores devueltos sin formato en el formato de resultados de herramientas
de OpenClaw:

- Devuelva una cadena cuando el modelo deba ver exactamente ese texto.
- Devuelva un valor compatible con JSON cuando quiera que el modelo vea JSON con formato
  y que OpenClaw conserve el valor original en `details`.

```typescript
tool({
  name: "echo_text",
  description: "Repite el texto de entrada.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Repite la entrada como JSON estructurado.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Utilice una herramienta de fábrica cuando necesite un `AgentToolResult` personalizado o quiera reutilizar una
implementación existente de `api.registerTool`.

## Configuración

`configSchema` es opcional. Si se omite, OpenClaw aplica un esquema estricto de objeto vacío;
el manifiesto generado sigue incluyendo `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Herramientas sin configuración",
  description: "Añade herramientas que no necesitan configuración.",
  tools: () => [],
});
```

Con un `configSchema`, el tipo del segundo argumento `execute` se deriva de este:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Herramientas configuradas",
  description: "Añade herramientas configuradas.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Comprueba si la configuración está disponible.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw lee la configuración del plugin desde la entrada del plugin en la configuración del Gateway. No
codifique secretos directamente en el código fuente ni en los ejemplos de la documentación; utilice la configuración, variables
de entorno o SecretRefs según el modelo de seguridad del plugin.

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
  "name": "Cotizaciones bursátiles",
  "description": "Obtiene instantáneas de cotizaciones bursátiles.",
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
manifiesto obsoleto puede hacer que una herramienta no aparezca durante el descubrimiento o que un error
de registro se atribuya al plugin equivocado.

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

Distribuya JavaScript compilado (`./dist/index.js`), no una entrada de código fuente TypeScript.
Las entradas de código fuente solo funcionan para el desarrollo local dentro del espacio de trabajo.

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

- `openclaw.plugin.json` existe y supera el cargador de manifiestos normal.
- La entrada actual exporta metadatos de `defineToolPlugin`.
- Los campos del manifiesto generado coinciden con los metadatos de la entrada.
- `contracts.tools` coincide con los nombres de herramientas declarados.
- `package.json` dirige `openclaw.extensions` a la entrada de ejecución seleccionada.

## Instalar e inspeccionar localmente

Desde otro checkout de OpenClaw o una CLI instalada, instale la ruta del paquete:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Para realizar una prueba de humo del paquete, primero empaquételo e instale el archivo tar:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Después de instalarlo, reinicie o recargue el Gateway y solicite al agente que utilice la
herramienta. Si la herramienta no está visible, inspeccione el entorno de ejecución del plugin y el catálogo efectivo
de herramientas antes de cambiar el código (consulte [Solución de problemas](#troubleshooting)).

## Publicar

Publique mediante ClawHub cuando el paquete esté listo. `clawhub package publish`
acepta un origen: una carpeta local, un repositorio de GitHub (`owner/repo[@ref]`) o una
URL de archivo tar.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Instale con un localizador explícito de ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Las especificaciones simples de paquetes npm siguen instalándose desde npm durante la transición del lanzamiento, pero
ClawHub es la superficie preferida de descubrimiento y distribución de plugins de OpenClaw.
Consulte [Publicación en ClawHub](/es/clawhub/publishing) para obtener información sobre el ámbito del propietario y
la revisión de la versión.

## Solución de problemas

### `plugin entry not found: ./dist/index.js`

El archivo de entrada seleccionado no existe. Ejecute `npm run build` y, a continuación, vuelva a ejecutar
`openclaw plugins build --entry ./dist/index.js` o
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

La entrada no exportó un valor creado por `defineToolPlugin`. Confirme que la
exportación predeterminada del módulo sea el resultado de `defineToolPlugin(...)` o indique la
entrada correcta con `--entry`.

### `openclaw.plugin.json generated metadata is stale`

El manifiesto ya no coincide con los metadatos de la entrada. Ejecute:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Confirme los cambios de `openclaw.plugin.json` y `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Los metadatos del paquete apuntan a una entrada de ejecución diferente. Ejecute
`openclaw plugins build --entry ./dist/index.js` para que el generador alinee
los metadatos del paquete con la entrada que pretende distribuir.

### `Cannot find package 'typebox'`

El plugin compilado importa `typebox` durante la ejecución. Manténgalo en `dependencies`,
vuelva a instalar, compile de nuevo y repita la validación.

### La herramienta no aparece después de la instalación

Compruebe lo siguiente en este orden:

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
