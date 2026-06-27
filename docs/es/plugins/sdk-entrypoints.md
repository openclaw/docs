---
read_when:
    - Necesita la firma de tipo exacta de defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Quieres entender el modo de registro (completo vs. configuración vs. metadatos de CLI)
    - Estás consultando las opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia para defineToolPlugin, definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-06-27T12:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada plugin exporta un objeto de entrada predeterminado. El SDK proporciona helpers para
crearlos.

Para los plugins instalados, `package.json` debe dirigir la carga en runtime al
JavaScript compilado cuando esté disponible:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` y `setupEntry` siguen siendo entradas de código fuente válidas para
el desarrollo en workspace y checkout de git. `runtimeExtensions` y
`runtimeSetupEntry` son preferidas cuando OpenClaw carga un paquete instalado y
permiten que los paquetes npm eviten la compilación de TypeScript en runtime. Las
entradas explícitas de runtime son obligatorias: `runtimeSetupEntry` requiere
`setupEntry`, y los artefactos `runtimeExtensions` o `runtimeSetupEntry`
faltantes hacen que la instalación o el descubrimiento fallen en lugar de volver
silenciosamente al código fuente. Si un paquete instalado solo declara una entrada
de código fuente TypeScript, OpenClaw usará un par `dist/*.js` compilado
correspondiente cuando exista, y luego volverá al código fuente TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del
plugin. Las entradas de runtime y los pares de JavaScript compilado inferidos no
hacen válida una ruta de código fuente `extensions` o `setupEntry` que se escape.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de herramientas](/es/plugins/tool-plugins),
  [Plugins de canal](/es/plugins/sdk-channel-plugins) o
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## `defineToolPlugin`

**Importación:** `openclaw/plugin-sdk/tool-plugin`

Para plugins simples que solo agregan herramientas de agente. `defineToolPlugin`
mantiene pequeño el código fuente de autoría, infiere los tipos de configuración
y de parámetros de herramientas a partir de esquemas TypeBox, envuelve valores de
retorno simples en el formato de resultado de herramienta de OpenClaw y expone
metadatos estáticos que `openclaw plugins build` escribe en el manifiesto del
plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` es opcional. Cuando se omite, OpenClaw usa un esquema estricto
  de objeto vacío y el manifiesto generado sigue incluyendo `configSchema`.
- `execute` devuelve una cadena simple o un valor serializable como JSON. El
  helper lo envuelve como un resultado de herramienta de texto con `details`.
- Los nombres de herramientas son estáticos. `openclaw plugins build` deriva
  `contracts.tools` de las herramientas declaradas, de modo que los autores no
  duplican nombres manualmente.
- La carga en runtime sigue siendo estricta. Los plugins instalados aún necesitan
  `openclaw.plugin.json` y `package.json` `openclaw.extensions`; OpenClaw no
  ejecuta código del plugin para inferir datos faltantes del manifiesto.

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedor, plugins de herramientas avanzados, plugins de hooks y
cualquier cosa que **no** sea un canal de mensajería.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obligatorio | Predeterminado       |
| -------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`           | `string`                                                         | Sí          | -                    |
| `name`         | `string`                                                         | Sí          | -                    |
| `description`  | `string`                                                         | Sí          | -                    |
| `kind`         | `string`                                                         | No          | -                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | -                    |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para ranuras exclusivas: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoiza ese esquema en el primer acceso, por lo que los
  constructores de esquemas costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico del canal. Llama
automáticamente a `api.registerChannel({ plugin })`, expone una costura opcional
de metadatos de CLI de ayuda raíz y controla `registerFull` según el modo de
registro.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obligatorio | Predeterminado       |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                  | `string`                                                         | Sí          | -                    |
| `name`                | `string`                                                         | Sí          | -                    |
| `description`         | `string`                                                         | Sí          | -                    |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | -                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | -                    |

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia
  de runtime (normalmente mediante `createPluginRuntimeStore`). Se omite durante
  la captura de metadatos de CLI.
- `registerCliMetadata` se ejecuta durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` y
  `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para descriptores de CLI propiedad del canal, de
  modo que la ayuda raíz no active nada, las instantáneas de descubrimiento
  incluyan metadatos estáticos de comandos y el registro normal de comandos de CLI
  siga siendo compatible con cargas completas del plugin.
- El registro de descubrimiento no activa nada, pero no está libre de importación.
  OpenClaw puede evaluar la entrada de plugin confiable y el módulo del plugin de
  canal para construir la instantánea, así que mantén las importaciones de nivel
  superior sin efectos secundarios y coloca sockets, clientes, workers y servicios
  detrás de rutas solo para `"full"`.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se
  omite durante la carga solo de setup.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida
  y OpenClaw memoiza el esquema resuelto en el primer acceso.
- Para comandos de CLI raíz propiedad del plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando permanezca cargado de forma diferida sin
  desaparecer del árbol de análisis de la CLI raíz. Para comandos de funcionalidades
  de nodos emparejados, prefiere `api.registerNodeCliFeature(...)` para que el
  comando quede bajo `openclaw nodes`. Para otros comandos anidados de plugin,
  agrega `parentPath` y registra comandos en el objeto `program` pasado al
  registrador; OpenClaw lo resuelve al comando padre antes de llamar al plugin.
  Para plugins de canal, prefiere registrar esos descriptores desde
  `registerCliMetadata(...)` y mantén `registerFull(...)` enfocado en trabajo
  solo de runtime.
- Si `registerFull(...)` también registra métodos RPC de gateway, mantenlos bajo
  un prefijo específico del plugin. Los espacios de nombres reservados de
  administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre se fuerzan a `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin cableado
de runtime ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está
deshabilitado, no configurado o cuando la carga diferida está habilitada. Consulta
[Setup y configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas
de helpers de setup:

- `openclaw/plugin-sdk/setup-runtime` para helpers de setup seguros en runtime,
  como `createSetupTranslator`, adaptadores de parches de setup seguros para
  importación, salida de notas de búsqueda, `promptResolvedAllowFrom`,
  `splitSetupEntries` y proxies de setup delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de setup de instalación
  opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de setup/instalación de
  CLI/archivo/docs

Mantén SDKs pesados, registro de CLI y servicios de runtime de larga duración en
la entrada completa.

Los canales de workspace incluidos que dividen superficies de setup y runtime
pueden usar `defineBundledChannelSetupEntry(...)` desde
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite
que la entrada de setup conserve exportaciones de plugin/secrets seguras para
setup mientras sigue exponiendo un setter de runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Usa ese contrato incluido solo cuando los flujos de setup realmente necesiten un
setter de runtime ligero o una superficie de gateway segura para setup antes de
que se cargue la entrada completa del canal. `registerSetupRuntime` se ejecuta
solo para cargas `"setup-runtime"`; mantenlo limitado a rutas o métodos solo de
configuración que deban existir antes de la activación completa diferida.

## Modo de registro

`api.registrationMode` indica a tu plugin cómo se cargó:

| Modo              | Cuándo                            | Qué registrar                                                                                                           |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del gateway         | Todo                                                                                                                    |
| `"discovery"`     | Descubrimiento de capacidades de solo lectura | Registro de canal más descriptores CLI estáticos; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"setup-only"`    | Canal deshabilitado/no configurado | Solo registro de canal                                                                                                  |
| `"setup-runtime"` | Flujo de configuración con runtime disponible | Registro de canal más solo el runtime ligero necesario antes de que se cargue la entrada completa                       |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos de CLI | Solo descriptores CLI                                                                                                   |

`defineChannelPluginEntry` gestiona esta división automáticamente. Si usas
`definePluginEntry` directamente para un canal, comprueba el modo tú mismo:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

El modo de descubrimiento crea una instantánea del registro sin activación. Aun así puede evaluar
la entrada del plugin y el objeto del plugin de canal para que OpenClaw pueda registrar las
capacidades de canal y los descriptores CLI estáticos. Trata la evaluación del módulo durante el descubrimiento como
confiable pero ligera: sin clientes de red, subprocesos, escuchas, conexiones de base de datos,
workers en segundo plano, lecturas de credenciales ni otros efectos secundarios de runtime activo
en el nivel superior.

Trata `"setup-runtime"` como la ventana donde las superficies de inicio solo de configuración deben
existir sin volver a entrar en el runtime completo del canal incluido. Buenas opciones son
el registro de canal, rutas HTTP seguras para configuración, métodos del gateway seguros para configuración y
ayudantes de configuración delegados. Los servicios pesados en segundo plano, registradores CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para los registradores CLI específicamente:

- usa `descriptors` cuando el registrador posee uno o más comandos raíz y quieres que OpenClaw cargue de forma diferida el módulo CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el registrador
- mantén los nombres de comandos de descriptor en letras, números, guion y guion bajo, empezando por una letra o un número; OpenClaw rechaza nombres de descriptor fuera de esa forma y elimina las secuencias de control de terminal de las descripciones antes de renderizar la ayuda
- usa solo `commands` únicamente para rutas de compatibilidad ansiosas

## Formas de plugin

OpenClaw clasifica los plugins cargados por su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)      |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) - API de registro y referencia de subrutas
- [Ayudantes de runtime](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración inicial y configuración](/es/plugins/sdk-setup) - manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
