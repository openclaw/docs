---
read_when:
    - Necesitas la firma de tipo exacta de defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Quieres entender el modo de registro (completo vs configuración vs metadatos de CLI)
    - Estás consultando las opciones del punto de entrada
sidebarTitle: Entry Points
summary: Referencia para defineToolPlugin, definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-07-05T11:32:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc86fe21ccd7705aabf1873ac025c5ff7b6345da2edf2689b07d0f5e4b56e8fe
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada Plugin exporta un objeto de entrada predeterminado. El SDK proporciona un helper para
cada forma de entrada: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de herramientas](/es/plugins/tool-plugins),
  [Plugins de canal](/es/plugins/sdk-channel-plugins) o
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## Entradas de paquete

Los plugins instalados apuntan los campos `openclaw` de `package.json` tanto a las entradas de código fuente como a
las entradas compiladas:

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

- `extensions` y `setupEntry` son entradas de código fuente, usadas para el desarrollo en espacios de trabajo y checkouts de git.
- `runtimeExtensions` y `runtimeSetupEntry` son preferidas para paquetes instalados:
  permiten que los paquetes de npm omitan la compilación de TypeScript en tiempo de ejecución.
- `runtimeExtensions`, cuando está presente, debe coincidir con `extensions` en la longitud del arreglo
  (las entradas se emparejan por posición). `runtimeSetupEntry` requiere `setupEntry`.
- Si se declara un artefacto `runtimeExtensions`/`runtimeSetupEntry` pero
  falta, la instalación/detección falla con un error de empaquetado; OpenClaw no
  recurre silenciosamente al código fuente. La alternativa de código fuente (abajo) solo se aplica cuando no se declara
  ninguna entrada de tiempo de ejecución.
- Si un paquete instalado declara solo una entrada de código fuente TypeScript, OpenClaw
  busca un par `dist/*.js` (o `.mjs`/`.cjs`) compilado que coincida y lo usa;
  de lo contrario, recurre al código fuente TypeScript.
- Todas las rutas de entrada deben permanecer dentro del directorio del paquete del Plugin. Las entradas de tiempo de ejecución
  y los pares JS compilados inferidos no hacen válida una ruta de código fuente `extensions` o
  `setupEntry` que se escape.

## `defineToolPlugin`

**Importación:** `openclaw/plugin-sdk/tool-plugin`

Para plugins que solo agregan herramientas de agente. Mantiene el código fuente pequeño, infiere los tipos de configuración
y parámetros de herramientas a partir de esquemas TypeBox, envuelve los valores de retorno simples en
el formato de resultado de herramienta de OpenClaw y expone metadatos estáticos que
`openclaw plugins build` escribe en el manifiesto del Plugin (`contracts.tools`,
`configSchema`).

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

- `configSchema` es opcional; omitirlo usa un esquema estricto de objeto vacío
  (el manifiesto generado sigue incluyendo `configSchema`).
- `execute` devuelve una cadena simple o un valor serializable como JSON; el helper
  lo envuelve como un resultado de herramienta de texto con `details` establecido en el valor de retorno original
  (sin convertir a cadena).
- Para resultados de herramienta personalizados, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` y `jsonResult`.
- Los nombres de herramientas son estáticos, por lo que `openclaw plugins build` deriva
  `contracts.tools` de las herramientas declaradas sin nombres duplicados a mano.
- La carga en tiempo de ejecución sigue siendo estricta: los plugins instalados aún necesitan
  `openclaw.plugin.json` y `openclaw.extensions` de `package.json`. OpenClaw
  nunca ejecuta código del Plugin para inferir datos de manifiesto faltantes.

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedor, plugins de herramientas avanzados, plugins de hooks y cualquier cosa que
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

| Campo                     | Tipo                                                             | Obligatorio | Predeterminado             |
| ------------------------- | ---------------------------------------------------------------- | ----------- | -------------------------- |
| `id`                      | `string`                                                         | Sí          | -                          |
| `name`                    | `string`                                                         | Sí          | -                          |
| `description`             | `string`                                                         | Sí          | -                          |
| `kind`                    | `string` (obsoleto, consulta abajo)                              | No          | -                          |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | No          | -                          |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | No          | -                          |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | No          | -                          |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sí          | -                          |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` está obsoleto: declara un slot exclusivo (`"memory"` o
  `"context-engine"`) en el campo `kind` del manifiesto `openclaw.plugin.json`
  en su lugar. El `kind` de la entrada de tiempo de ejecución permanece solo como alternativa de compatibilidad para
  plugins antiguos.
- `configSchema` puede ser una función para evaluación diferida. OpenClaw resuelve y
  memoiza el esquema en el primer acceso, por lo que los constructores de esquemas costosos solo se ejecutan
  una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico del canal: llama automáticamente a
`api.registerChannel({ plugin })`, expone una costura opcional de metadatos de CLI de ayuda raíz
y limita `registerFull` según el modo de registro.

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

| Campo                 | Tipo                                                             | Obligatorio | Predeterminado             |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------------- |
| `id`                  | `string`                                                         | Sí          | -                          |
| `name`                | `string`                                                         | Sí          | -                          |
| `description`         | `string`                                                         | Sí          | -                          |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | -                          |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | -                          |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | -                          |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | -                          |

Los callbacks se ejecutan por modo de registro (tabla completa en
[Modo de registro](#registration-mode)):

- `setRuntime` se ejecuta en todos los modos excepto `"cli-metadata"` y
  `"tool-discovery"`. Almacena aquí la referencia del runtime, normalmente mediante
  `createPluginRuntimeStore`.
- `registerCliMetadata` se ejecuta para `"cli-metadata"`, `"discovery"` y
  `"full"`. Úsalo como el lugar canónico para descriptores de CLI propiedad del canal
  de modo que la ayuda raíz siga sin activarse, las instantáneas de detección incluyan metadatos estáticos
  de comandos y el registro normal de CLI siga siendo compatible con cargas completas del Plugin.
- `registerFull` se ejecuta solo para `"full"` y `"tool-discovery"`. Para
  `"tool-discovery"` se ejecuta _en lugar de_ el registro del canal: OpenClaw
  omite `registerChannel`/`setRuntime` por completo y llama solo a
  `registerFull`, por lo que cualquier registro de proveedor/herramienta que tu canal necesite para
  la detección o ejecución independiente de herramientas debe estar allí, no detrás de la configuración normal
  del canal.
- El registro de detección no activa, pero no evita importaciones: OpenClaw puede
  evaluar la entrada del Plugin de confianza y el módulo del Plugin de canal para crear la
  instantánea. Mantén las importaciones de nivel superior libres de efectos secundarios y coloca sockets,
  clientes, workers y servicios detrás de rutas solo para `"full"`.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida; OpenClaw
  memoiza el esquema resuelto en el primer acceso.

Registro de CLI:

- Usa `api.registerCli(..., { descriptors: [...] })` para comandos CLI raíz propiedad del Plugin
  que quieres cargar de forma diferida sin que desaparezcan del árbol de análisis de la CLI raíz.
  Los nombres de descriptor deben coincidir con letras, números, guion y
  guion bajo, empezando por una letra o número; OpenClaw rechaza otras
  formas y elimina secuencias de control de terminal de las descripciones antes de
  renderizar la ayuda. Cubre cada raíz de comando de nivel superior que expone el registrador.
  `commands` por sí solo permanece en la ruta de compatibilidad eager.
- Usa `api.registerNodeCliFeature(...)` para comandos de función de nodo emparejado de modo que
  terminen bajo `openclaw nodes` (equivalente a
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Para otros comandos anidados de Plugin, agrega `parentPath` y registra comandos
  en el objeto `program` pasado al registrador; OpenClaw lo resuelve en
  el comando padre antes de llamar al Plugin.
- Para plugins de canal, registra descriptores de CLI desde `registerCliMetadata`
  y mantén `registerFull` enfocado en trabajo solo de runtime.
- Si `registerFull` también registra métodos RPC de Gateway, mantenlos en un
  prefijo específico del Plugin. Los espacios de nombres reservados de administración del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
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
[Configuración y Setup](/es/plugins/sdk-setup#setup-entry) para saber cuándo esto importa.

Combina `defineSetupPluginEntry(...)` con las familias estrechas de helpers de setup:

| Importación                         | Usar para                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Ayudantes de configuración seguros para runtime: `createSetupTranslator`, adaptadores de parches de configuración seguros para importar, salida de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
| `openclaw/plugin-sdk/channel-setup` | Superficies de configuración de instalación opcional                                                                                                                                  |
| `openclaw/plugin-sdk/setup-tools`   | Ayudantes de CLI de configuración/instalación, archivo y documentación                                                                                                                |

Mantén los SDK pesados, el registro de CLI y los servicios de runtime de larga duración en la
entrada completa.

Los canales del espacio de trabajo incluidos que dividen las superficies de configuración y runtime pueden usar
`defineBundledChannelSetupEntry(...)` desde
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Permite que la entrada de configuración
conserve exportaciones de plugin/secretos seguras para la configuración y siga exponiendo un setter de runtime:

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

Usa esto solo cuando un flujo de configuración realmente necesite un setter de runtime ligero o una
superficie Gateway segura para la configuración antes de que se cargue la entrada completa del canal.
`registerSetupRuntime` se ejecuta solo para cargas `"setup-runtime"`; mantenlo
limitado a rutas solo de configuración o métodos que deban existir antes de la
activación completa diferida.

## Modo de registro

`api.registrationMode` le indica a tu plugin cómo se cargó:

| Modo               | Cuándo                                                       | Qué registrar                                                                                                           |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Inicio normal del Gateway                                    | Todo                                                                                                                    |
| `"discovery"`      | Descubrimiento de capacidades de solo lectura                | Registro del canal más descriptores CLI estáticos; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"tool-discovery"` | Carga acotada para listar o ejecutar herramientas de plugins específicos | Solo registro de capacidades/herramientas; sin activación de canal                                                      |
| `"setup-only"`     | Canal deshabilitado/no configurado                           | Solo registro del canal                                                                                                 |
| `"setup-runtime"`  | Flujo de configuración con runtime disponible                | Registro del canal más solo el runtime ligero necesario antes de que se cargue la entrada completa                      |
| `"cli-metadata"`   | Ayuda raíz / captura de metadatos de CLI                     | Solo descriptores de CLI                                                                                                |

`defineChannelPluginEntry` gestiona esta división automáticamente. Si usas
`definePluginEntry` directamente para un canal, comprueba el modo tú mismo y recuerda que
`"tool-discovery"` omite el registro del canal:

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

  if (api.registrationMode === "tool-discovery") {
    // Register capability-only surfaces (providers/tools), no channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

El modo de descubrimiento construye una instantánea del registro sin activación. Aun así, puede
evaluar la entrada del plugin y el objeto del plugin de canal para que OpenClaw pueda
registrar capacidades de canal y descriptores CLI estáticos. Trata la evaluación del módulo
en descubrimiento como confiable pero ligera: sin clientes de red,
subprocesos, listeners, conexiones de base de datos, workers en segundo plano,
lecturas de credenciales ni otros efectos secundarios de runtime en vivo en el nivel superior.

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en el runtime completo del canal incluido. Buenos encajes son
el registro de canal, rutas HTTP seguras para la configuración, métodos Gateway seguros para la configuración
y ayudantes de configuración delegados. Los servicios pesados en segundo plano, registradores de CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

## Formas de plugin

OpenClaw clasifica los plugins cargados por su comportamiento de registro:

| Forma                 | Descripción                                          |
| --------------------- | ---------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)        |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz)  |
| **hook-only**         | Solo hooks, sin capacidades                          |
| **non-capability**    | Herramientas/comandos/servicios, pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) - API de registro y referencia de subrutas
- [Ayudantes de Runtime](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración y Configuración](/es/plugins/sdk-setup) - manifiesto, entrada de configuración, carga diferida
- [Plugins de Canal](/es/plugins/sdk-channel-plugins) - creación del objeto `ChannelPlugin`
- [Plugins de Proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
