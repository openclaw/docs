---
read_when:
    - Necesita la firma de tipo exacta de defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Quiere comprender el modo de registro (completo, configuración o metadatos de la CLI)
    - Está consultando las opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia de defineToolPlugin, definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-07-19T02:18:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada plugin exporta un objeto de entrada predeterminado. El SDK proporciona una función auxiliar para
cada forma de entrada: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **¿Busca una guía paso a paso?** Consulte [Plugins de herramientas](/es/plugins/tool-plugins),
  [Plugins de canales](/es/plugins/sdk-channel-plugins) o
  [Plugins de proveedores](/es/plugins/sdk-provider-plugins) para obtener guías detalladas.
</Tip>

## Entradas del paquete

Los plugins instalados dirigen los campos `package.json` `openclaw` tanto a las entradas de
origen como a las compiladas:

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

- `extensions` y `setupEntry` son entradas de origen, utilizadas para el desarrollo en espacios de trabajo y
  checkouts de git.
- `runtimeExtensions` y `runtimeSetupEntry` son las opciones preferidas para los paquetes
  instalados: permiten que los paquetes npm omitan la compilación de TypeScript durante la ejecución.
- `runtimeExtensions`, cuando está presente, debe coincidir con `extensions` en la longitud del arreglo
  (las entradas se emparejan por posición). `runtimeSetupEntry` requiere `setupEntry`.
- Si se declara un artefacto `runtimeExtensions`/`runtimeSetupEntry` pero
  no está presente, la instalación o el descubrimiento fallan con un error de empaquetado; OpenClaw no
  recurre silenciosamente al código fuente. La alternativa de código fuente (descrita a continuación) solo se aplica cuando no se
  declara ninguna entrada de ejecución.
- Si un paquete instalado declara únicamente una entrada de origen de TypeScript, OpenClaw
  busca una entrada compilada `dist/*.js` (o `.mjs`/`.cjs`) correspondiente y la utiliza;
  de lo contrario, recurre al código fuente de TypeScript.
- Todas las rutas de entrada deben permanecer dentro del directorio del paquete del plugin. Las entradas de
  ejecución y las entradas homólogas de JS compilado inferidas no hacen que una ruta de origen `extensions` o
  `setupEntry` que escape del directorio sea válida.

## `defineToolPlugin`

**Importación:** `openclaw/plugin-sdk/tool-plugin`

Para plugins que solo añaden herramientas de agente. Mantiene reducido el código fuente, infiere los tipos de configuración
y de parámetros de herramientas a partir de esquemas de TypeBox, envuelve los valores de retorno simples en
el formato de resultados de herramientas de OpenClaw y expone metadatos estáticos que
`openclaw plugins build` escribe en el manifiesto del plugin (`contracts.tools`,
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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` es opcional; si se omite, se utiliza un esquema estricto de objeto vacío
  (el manifiesto generado sigue incluyendo `configSchema`).
- `execute` devuelve una cadena simple o un valor serializable como JSON; la función auxiliar
  lo envuelve como un resultado de herramienta de texto con `details` establecido en el valor de retorno original
  (sin convertirlo en cadena).
- `outputSchema` describe opcionalmente ese valor `details` original para el modo Código
  y la búsqueda de herramientas. Las llamadas al catálogo rechazan los esquemas no válidos antes de la ejecución
  y validan el valor final antes de devolverlo.
- Para resultados de herramientas personalizados, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` y `jsonResult`.
- Los nombres de herramientas son estáticos, por lo que `openclaw plugins build` deriva
  `contracts.tools` de las herramientas declaradas sin duplicar manualmente los nombres.
- La carga durante la ejecución sigue siendo estricta: los plugins instalados aún necesitan
  `openclaw.plugin.json` y `package.json` `openclaw.extensions`. OpenClaw
  nunca ejecuta código del plugin para inferir datos ausentes del manifiesto.

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedores, plugins de herramientas avanzadas, plugins de hooks y cualquier elemento que
**no** sea un canal de mensajería.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Campo                     | Tipo                                                             | Obligatorio | Valor predeterminado |
| ------------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                      | `string`                                                         | Sí          | -                    |
| `name`                    | `string`                                                         | Sí          | -                    |
| `description`             | `string`                                                         | Sí          | -                    |
| `kind`                    | `string` (obsoleto, véase más adelante)                          | No          | -                    |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | No          | -                    |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | No          | -                    |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | No          | -                    |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sí          | -                    |

- `id` debe coincidir con el manifiesto `openclaw.plugin.json`.
- Los catálogos de sesiones externas utilizan
  `openclaw/plugin-sdk/session-catalog` y
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  El núcleo es responsable de los métodos del Gateway `sessions.catalog.*`; los proveedores devuelven proyecciones del host,
  de la sesión y de la transcripción normalizada sin registrar RPC. Un
  proveedor de listas debe llamar al callback opcional `onHost(host)` a medida que se resuelve cada host;
  el arreglo de hosts devuelto sigue siendo obligatorio como instantánea final de
  compatibilidad.
- `kind` está obsoleto: declare una ranura exclusiva (`"memory"` o
  `"context-engine"`) en el campo `kind` del manifiesto `openclaw.plugin.json`
  en su lugar. El `kind` de la entrada de ejecución se mantiene únicamente como alternativa de compatibilidad para
  plugins antiguos.
- `configSchema` puede ser una función para la evaluación diferida. OpenClaw resuelve y
  memoriza el esquema en el primer acceso, de modo que los generadores de esquemas costosos solo se ejecutan
  una vez.
- Un descriptor `nodeHostCommands` puede definir `isAvailable({ config, env })`.
  Devolver `false` omite ese comando y su capacidad de la declaración del Gateway
  del nodo sin interfaz gráfica. OpenClaw lo evalúa con la configuración de inicio local del nodo;
  los controladores de comandos deben seguir validando la disponibilidad cuando
  se invoquen.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con la integración específica del canal: llama automáticamente a
`api.registerChannel({ plugin })`, expone una interfaz opcional de metadatos de CLI para la ayuda
raíz y condiciona `registerFull` al modo de registro.

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

| Campo                 | Tipo                                                             | Obligatorio | Valor predeterminado |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                  | `string`                                                         | Sí          | -                    |
| `name`                | `string`                                                         | Sí          | -                    |
| `description`         | `string`                                                         | Sí          | -                    |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | -                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | -                    |

Los callbacks se ejecutan según el modo de registro (tabla completa en
[Modo de registro](#registration-mode)):

- `setRuntime` se ejecuta en todos los modos excepto `"cli-metadata"` y
  `"tool-discovery"`. Almacene aquí la referencia al entorno de ejecución, normalmente mediante
  `createPluginRuntimeStore`.
- `registerCliMetadata` se ejecuta para `"cli-metadata"`, `"discovery"` y
  `"full"`. Utilícelo como ubicación canónica para los descriptores de CLI pertenecientes al canal,
  de modo que la ayuda raíz no produzca activación, las instantáneas de descubrimiento incluyan metadatos estáticos
  de comandos y el registro normal de la CLI siga siendo compatible con las cargas completas
  del plugin.
- `registerFull` se ejecuta únicamente para `"full"` y `"tool-discovery"`. Para
  `"tool-discovery"`, se ejecuta _en lugar del_ registro del canal: OpenClaw
  omite por completo `registerChannel`/`setRuntime` y solo llama a
  `registerFull`, por lo que cualquier registro de proveedor o herramienta que el canal necesite para
  el descubrimiento o la ejecución independiente de herramientas debe residir allí, no detrás de la configuración normal
  del canal.
- El registro de descubrimiento no produce activación, pero sí realiza importaciones: OpenClaw puede
  evaluar la entrada del plugin de confianza y el módulo del plugin del canal para crear la
  instantánea. Mantenga las importaciones de nivel superior sin efectos secundarios y coloque sockets,
  clientes, workers y servicios detrás de rutas exclusivas de `"full"`.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida; OpenClaw
  memoriza el esquema resuelto en el primer acceso.

Registro de la CLI:

- Use `api.registerCli(..., { descriptors: [...] })` para los comandos raíz de la
  CLI propiedad del plugin que se quiera cargar de forma diferida sin que
  desaparezcan del árbol de análisis de la CLI raíz. Los nombres de los
  descriptores deben contener letras, números, guiones y guiones bajos, y
  comenzar por una letra o un número; OpenClaw rechaza otros formatos y
  elimina las secuencias de control de terminal de las descripciones antes
  de mostrar la ayuda. Incluya cada raíz de comando de nivel superior que
  exponga el registrador. `commands` por sí solo permanece en la
  ruta de compatibilidad de carga inmediata.
- Use `api.registerNodeCliFeature(...)` para los comandos de funciones de
  nodos emparejados, de modo que se ubiquen bajo `openclaw nodes`
  (equivalente a `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Para otros comandos de plugin anidados, añada `parentPath` y registre los comandos
  en el objeto `program` que se pasa al registrador; OpenClaw lo resuelve como
  el comando principal antes de llamar al plugin.
- Para los plugins de canal, registre los descriptores de la CLI desde `registerCliMetadata`
  y mantenga `registerFull` centrado únicamente en el trabajo de runtime.
- Si `registerFull` también registra métodos RPC del Gateway, manténgalos bajo un
  prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se convierten en
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve únicamente `{ plugin }`, sin
conexiones con el runtime ni con la CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga este archivo en lugar del punto de entrada completo cuando un canal está deshabilitado,
no está configurado o está habilitada la carga diferida. Consulte
[Configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo es importante.

Combine `defineSetupPluginEntry(...)` con las familias específicas de asistentes de configuración:

| Importación                         | Uso                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Asistentes de configuración seguros para el runtime: `createSetupTranslator`, adaptadores de parches de configuración seguros para importar, salida de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
| `openclaw/plugin-sdk/channel-setup` | Superficies de configuración de instalación opcional                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Asistentes de CLI, archivos y documentación para configuración e instalación                                                                                                      |

Mantenga los SDK pesados, el registro de la CLI y los servicios de runtime de larga duración en el
punto de entrada completo.

Los canales incluidos en el espacio de trabajo que separen las superficies de configuración y runtime pueden usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Esto permite que el punto de entrada de
configuración conserve las exportaciones del plugin y de secretos seguras para la configuración, a la vez que expone un
definidor de runtime:

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
        /* ruta segura para la configuración */
      },
    });
  },
});
```

Úselo solo cuando un flujo de configuración necesite realmente un definidor de runtime ligero o una
superficie segura del Gateway para la configuración antes de que se cargue el punto de entrada completo del canal.
`registerSetupRuntime` se ejecuta únicamente para cargas de `"setup-runtime"`; limítelo
a rutas o métodos exclusivos de configuración que deban existir antes de la
activación completa diferida.

## Modo de registro

`api.registrationMode` indica al plugin cómo se cargó:

| Modo               | Cuándo                                               | Qué registrar                                                                                                             |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Inicio normal del Gateway                            | Todo                                                                                                                      |
| `"discovery"`      | Detección de capacidades de solo lectura             | Registro del canal y descriptores estáticos de la CLI; el código del punto de entrada puede cargarse, pero debe omitir sockets, procesos de trabajo, clientes y servicios |
| `"tool-discovery"` | Carga limitada para enumerar o ejecutar herramientas de plugins específicos | Solo el registro de capacidades y herramientas; sin activación del canal                                                   |
| `"setup-only"`     | Canal deshabilitado o sin configurar                 | Solo el registro del canal                                                                                                |
| `"setup-runtime"`  | Flujo de configuración con el runtime disponible     | Registro del canal y únicamente el runtime ligero necesario antes de cargar el punto de entrada completo                  |
| `"cli-metadata"`   | Captura de ayuda raíz o metadatos de la CLI          | Solo descriptores de la CLI                                                                                               |

`defineChannelPluginEntry` gestiona esta separación automáticamente. Si se usa
`definePluginEntry` directamente para un canal, compruebe el modo y recuerde que
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
    // Registre solo las superficies de capacidades (proveedores/herramientas), sin canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados exclusivos del runtime
  api.registerService(/* ... */);
}
```

Los servicios de larga duración pueden emitir pequeños eventos de invalidación o del ciclo de vida mediante
su contexto de servicio:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw asigna a esto el espacio de nombres `plugin.<plugin-id>.changed`. Los nombres de eventos constan de un
segmento en minúsculas, las cargas útiles deben ser JSON acotado y el ámbito debe ser
`operator.read`, `operator.write` o `operator.admin`. El emisor existe únicamente
durante la vida útil del servicio y se revoca después de detenerlo o si falla el inicio. Se deben preferir
cargas útiles de versión o invalidación en lugar de registros completos, para que los clientes autorizados vuelvan a leer
el estado canónico mediante los métodos del Gateway con ámbito del plugin.

El modo de detección crea una instantánea del registro sin activación. Aun así, puede
evaluar el punto de entrada del plugin y el objeto del plugin de canal para que OpenClaw pueda
registrar las capacidades del canal y los descriptores estáticos de la CLI. La evaluación de módulos
durante la detección debe tratarse como fiable pero ligera: sin clientes de red,
subprocesos, escuchas, conexiones de base de datos, procesos de trabajo en segundo plano,
lecturas de credenciales ni otros efectos secundarios activos del runtime en el nivel superior.

Considere `"setup-runtime"` como la ventana en la que deben existir las superficies de inicio exclusivas de la configuración
sin volver a entrar en el runtime completo del canal incluido. Son opciones adecuadas
el registro del canal, las rutas HTTP seguras para la configuración, los métodos del Gateway seguros para la configuración
y los asistentes de configuración delegados. Los servicios pesados en segundo plano, los registradores de la CLI y
la inicialización de SDK de proveedores o clientes siguen perteneciendo a `"full"`.

## Formatos de plugins

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Formato               | Descripción                                              |
| --------------------- | -------------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)            |
| **hybrid-capability** | Varios tipos de capacidades (p. ej., proveedor + voz)    |
| **hook-only**         | Solo hooks, sin capacidades                              |
| **non-capability**    | Herramientas, comandos o servicios, pero sin capacidades |

Use `openclaw plugins inspect <id>` para ver el formato de un plugin.

## Contenido relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia de la API de registro y las subrutas
- [Asistentes del runtime](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración](/es/plugins/sdk-setup) - manifiesto, punto de entrada de configuración y carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
