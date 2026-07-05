---
read_when:
    - Necesita la firma de tipo exacta de defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Quieres comprender el modo de registro (completo vs. configuración vs. metadatos de CLI)
    - Estás consultando las opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia para defineToolPlugin, definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada del Plugin
x-i18n:
    generated_at: "2026-07-05T01:58:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eea0981df2d977ac8eceb32a757db3e8edbb57b7a60889dd1dd6ec75e110a230
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada plugin exporta un objeto de entrada predeterminado. El SDK proporciona ayudantes para
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

`extensions` y `setupEntry` siguen siendo entradas de código fuente válidas para el desarrollo
en workspace y checkout de git. `runtimeExtensions` y `runtimeSetupEntry` se prefieren
cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la
compilación TypeScript en runtime. Las entradas de runtime explícitas son obligatorias: `runtimeSetupEntry`
requiere `setupEntry`, y los artefactos `runtimeExtensions` o `runtimeSetupEntry`
faltantes hacen fallar la instalación/discovery en lugar de volver silenciosamente al código fuente. Si
un paquete instalado solo declara una entrada de código fuente TypeScript, OpenClaw usará un
par compilado `dist/*.js` coincidente cuando exista, y luego recurrirá al código fuente
TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del plugin. Las entradas de runtime
y los pares JavaScript compilados inferidos no hacen válida una ruta de código fuente `extensions` o
`setupEntry` que escape.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de herramientas](/es/plugins/tool-plugins),
  [Plugins de canales](/es/plugins/sdk-channel-plugins) o
  [Plugins de proveedores](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## `defineToolPlugin`

**Importación:** `openclaw/plugin-sdk/tool-plugin`

Para plugins simples que solo agregan herramientas de agente. `defineToolPlugin` mantiene pequeño el
código fuente de autoría, infiere tipos de configuración y parámetros de herramientas a partir de esquemas
TypeBox, envuelve valores de retorno simples en el formato de resultado de herramienta de OpenClaw y
expone metadatos estáticos que `openclaw plugins build` escribe en el manifiesto del plugin.

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

- `configSchema` es opcional. Cuando se omite, OpenClaw usa un esquema estricto de objeto vacío
  y el manifiesto generado sigue incluyendo `configSchema`.
- `execute` devuelve una cadena simple o un valor serializable como JSON. El ayudante lo envuelve
  como un resultado de herramienta de texto con `details`.
- Para resultados de herramienta personalizados, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` y `jsonResult`.
- Los nombres de herramientas son estáticos. `openclaw plugins build` deriva `contracts.tools`
  de las herramientas declaradas, por lo que los autores no duplican nombres manualmente.
- La carga en runtime sigue siendo estricta. Los plugins instalados siguen necesitando
  `openclaw.plugin.json` y `openclaw.extensions` de `package.json`; OpenClaw no
  ejecuta código del plugin para inferir datos de manifiesto faltantes.

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedores, plugins de herramientas avanzados, plugins de hooks y cualquier cosa que
**no** sea un canal de mensajería.

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
- `kind` es para slots exclusivos: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoriza ese esquema en el primer acceso, por lo que los constructores de esquema
  costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico del canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una seam opcional de metadatos CLI de ayuda raíz
y condiciona `registerFull` según el modo de registro.

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

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de runtime
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura de metadatos
  CLI.
- `registerCliMetadata` se ejecuta durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` y
  `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para descriptores CLI propios del canal, para que la ayuda raíz
  siga sin activar, las instantáneas de discovery incluyan metadatos estáticos de comandos y
  el registro normal de comandos CLI siga siendo compatible con las cargas completas de plugins.
- El registro de discovery no activa, pero no está libre de importaciones. OpenClaw puede
  evaluar la entrada de plugin confiable y el módulo del plugin de canal para construir la
  instantánea, así que mantén las importaciones de nivel superior sin efectos secundarios y pon sockets,
  clientes, workers y servicios detrás de rutas solo para `"full"`.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoriza el esquema resuelto en el primer acceso.
- Para comandos CLI raíz propios del plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando permanezca con carga diferida sin desaparecer del árbol de análisis
  de la CLI raíz. Para comandos de características de nodos emparejados, prefiere
  `api.registerNodeCliFeature(...)` para que el comando quede bajo `openclaw nodes`.
  Para otros comandos anidados de plugins, agrega `parentPath` y registra comandos en
  el objeto `program` pasado al registrador; OpenClaw lo resuelve al comando
  padre antes de llamar al plugin. Para plugins de canales, prefiere
  registrar esos descriptores desde `registerCliMetadata(...)` y mantener
  `registerFull(...)` centrado en trabajo solo de runtime.
- Si `registerFull(...)` también registra métodos RPC de gateway, mantenlos en un
  prefijo específico del plugin. Los namespaces reservados de administración del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se convierten a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
cableado de runtime ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulta
[Configuración y ajuste](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas de ayudantes de configuración:

- `openclaw/plugin-sdk/setup-runtime` para ayudantes de configuración seguros para runtime, como
  `createSetupTranslator`, adaptadores de parches de configuración seguros para importación, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para ayudantes de CLI/archivo/docs de configuración/instalación

Mantén los SDK pesados, el registro CLI y los servicios de runtime de larga duración en la entrada
completa.

Los canales de workspace incluidos que dividen superficies de configuración y runtime pueden usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración conserve exportaciones de plugin/secrets seguras para configuración sin dejar de exponer un
setter de runtime:

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

Usa ese contrato incluido solo cuando los flujos de configuración realmente necesiten un setter de runtime
ligero o una superficie Gateway segura para configuración antes de que se cargue la entrada completa del canal.
`registerSetupRuntime` se ejecuta solo para cargas `"setup-runtime"`; mantenlo limitado a
rutas o métodos solo de configuración que deban existir antes de la activación completa diferida.

## Modo de registro

`api.registrationMode` indica a tu plugin cómo se cargó:

| Modo              | Cuándo                              | Qué registrar                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del Gateway            | Todo                                                                                                              |
| `"discovery"`     | Descubrimiento de capacidades de solo lectura    | Registro de canales más descriptores estáticos de CLI; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"setup-only"`    | Canal deshabilitado/sin configurar     | Solo registro de canales                                                                                               |
| `"setup-runtime"` | Flujo de configuración con runtime disponible | Registro de canales más solo el runtime ligero necesario antes de que se cargue la entrada completa                               |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos de CLI  | Solo descriptores de CLI                                                                                                    |

`defineChannelPluginEntry` maneja esta división automáticamente. Si usas
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
la entrada del plugin y el objeto de plugin de canal para que OpenClaw pueda registrar las
capacidades del canal y los descriptores estáticos de CLI. Trata la evaluación de módulos en descubrimiento como
confiable pero ligera: sin clientes de red, subprocesos, listeners, conexiones de base de datos,
workers en segundo plano, lecturas de credenciales ni otros efectos secundarios de runtime activos
en el nivel superior.

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en el runtime completo del canal incluido. Buenas opciones son
el registro de canales, rutas HTTP seguras para configuración, métodos de Gateway seguros para configuración y
helpers de configuración delegados. Los servicios pesados en segundo plano, registradores de CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para registradores de CLI específicamente:

- usa `descriptors` cuando el registrador posee uno o más comandos raíz y quieres que
  OpenClaw cargue de forma diferida el módulo de CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- mantén los nombres de comandos de los descriptores en letras, números, guion y guion bajo,
  comenzando con una letra o número; OpenClaw rechaza nombres de descriptores fuera
  de esa forma y elimina las secuencias de control de terminal de las descripciones antes de
  renderizar la ayuda
- usa solo `commands` únicamente para rutas de compatibilidad eager

## Formas de Plugin

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)           |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios, pero sin capacidades        |

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) - API de registro y referencia de subrutas
- [Helpers de runtime](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración y ajustes](/es/plugins/sdk-setup) - manifest, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - crear el objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
