---
read_when:
    - Necesita la firma de tipo exacta de defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Quieres comprender el modo de registro (completo frente a configuración frente a metadatos de la CLI)
    - Estás consultando las opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia para defineToolPlugin, definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-07-12T14:42:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
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

Los plugins instalados hacen que los campos `openclaw` de `package.json` apunten tanto a las entradas
de origen como a las compiladas:

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

- `extensions` y `setupEntry` son entradas de origen que se utilizan para el desarrollo
  en espacios de trabajo y repositorios git.
- `runtimeExtensions` y `runtimeSetupEntry` son las opciones preferidas para los paquetes
  instalados: permiten que los paquetes npm omitan la compilación de TypeScript en tiempo de ejecución.
- Cuando está presente, `runtimeExtensions` debe coincidir con `extensions` en la longitud del arreglo
  (las entradas se emparejan por posición). `runtimeSetupEntry` requiere `setupEntry`.
- Si se declara un artefacto `runtimeExtensions`/`runtimeSetupEntry` pero
  no existe, la instalación o detección falla con un error de empaquetado; OpenClaw no
  recurre silenciosamente al código fuente. La alternativa de usar el código fuente (descrita a continuación) solo se aplica cuando no
  se declara ninguna entrada de tiempo de ejecución.
- Si un paquete instalado solo declara una entrada de origen TypeScript, OpenClaw
  busca una entrada compilada equivalente `dist/*.js` (o `.mjs`/`.cjs`) y la utiliza;
  de lo contrario, recurre al código fuente TypeScript.
- Todas las rutas de entrada deben permanecer dentro del directorio del paquete del plugin. Las entradas
  de tiempo de ejecución y los archivos JavaScript compilados equivalentes que se infieran no hacen válida una ruta
  de origen `extensions` o `setupEntry` que salga del directorio.

## `defineToolPlugin`

**Importación:** `openclaw/plugin-sdk/tool-plugin`

Para plugins que solo añaden herramientas de agentes. Mantiene el código fuente reducido, infiere los tipos de configuración
y de parámetros de herramientas a partir de esquemas TypeBox, envuelve los valores de retorno simples en
el formato de resultados de herramientas de OpenClaw y expone metadatos estáticos que
`openclaw plugins build` escribe en el manifiesto del plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Cotizaciones bursátiles",
  description: "Obtiene cotizaciones bursátiles.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Clave de API." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Cotización",
      description: "Obtiene una cotización.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Símbolo bursátil." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` es opcional; si se omite, se utiliza un esquema estricto de objeto vacío
  (el manifiesto generado sigue incluyendo `configSchema`).
- `execute` devuelve una cadena simple o un valor serializable como JSON; la función auxiliar
  lo envuelve como un resultado de herramienta de texto, con `details` establecido en el valor de retorno
  original (sin convertirlo en cadena).
- Para resultados de herramientas personalizados, `openclaw/plugin-sdk/tool-results` exporta
  `textResult` y `jsonResult`.
- Los nombres de las herramientas son estáticos, por lo que `openclaw plugins build` deriva
  `contracts.tools` de las herramientas declaradas sin duplicar manualmente los nombres.
- La carga en tiempo de ejecución sigue siendo estricta: los plugins instalados aún necesitan
  `openclaw.plugin.json` y `openclaw.extensions` de `package.json`. OpenClaw
  nunca ejecuta código del plugin para inferir datos faltantes del manifiesto.

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedores, plugins de herramientas avanzados, plugins de hooks y cualquier elemento que
**no** sea un canal de mensajería.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "Mi plugin",
  description: "Resumen breve",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Campo                     | Tipo                                                             | Obligatorio | Valor predeterminado       |
| ------------------------- | ---------------------------------------------------------------- | ----------- | -------------------------- |
| `id`                      | `string`                                                         | Sí          | -                          |
| `name`                    | `string`                                                         | Sí          | -                          |
| `description`             | `string`                                                         | Sí          | -                          |
| `kind`                    | `string` (obsoleto, consulte más adelante)                       | No          | -                          |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | No          | -                          |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | No          | -                          |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | No          | -                          |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sí          | -                          |

- `id` debe coincidir con el manifiesto `openclaw.plugin.json`.
- Los catálogos de sesiones externos utilizan
  `openclaw/plugin-sdk/session-catalog` y
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  El núcleo controla los métodos `sessions.catalog.*` del Gateway; los proveedores devuelven proyecciones
  del host, la sesión y la transcripción normalizada sin registrar RPC.
- `kind` está obsoleto: en su lugar, declare un espacio exclusivo (`"memory"` o
  `"context-engine"`) en el campo `kind` del manifiesto `openclaw.plugin.json`.
  El `kind` de la entrada de tiempo de ejecución solo se conserva como alternativa de compatibilidad para
  plugins anteriores.
- `configSchema` puede ser una función para evaluarla de forma diferida. OpenClaw resuelve y
  memoriza el esquema en el primer acceso, de modo que los generadores de esquemas costosos solo se ejecutan
  una vez.
- Un descriptor `nodeHostCommands` puede definir `isAvailable({ config, env })`.
  Si devuelve `false`, ese comando y su capacidad se omiten de la declaración del Gateway
  del nodo sin interfaz gráfica. OpenClaw lo evalúa con la configuración de inicio local
  del nodo; los controladores de comandos deben seguir validando la disponibilidad cuando
  se invoquen.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con la integración específica del canal: llama automáticamente
a `api.registerChannel({ plugin })`, expone una interfaz opcional de metadatos de la CLI
para la ayuda raíz y condiciona `registerFull` al modo de registro.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "Mi canal",
  description: "Resumen breve",
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

| Campo                 | Tipo                                                             | Obligatorio | Valor predeterminado       |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------------- |
| `id`                  | `string`                                                         | Sí          | -                          |
| `name`                | `string`                                                         | Sí          | -                          |
| `description`         | `string`                                                         | Sí          | -                          |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | -                          |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | -                          |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | -                          |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | -                          |

Las devoluciones de llamada se ejecutan según el modo de registro (la tabla completa se encuentra en
[Modo de registro](#registration-mode)):

- `setRuntime` se ejecuta en todos los modos excepto `"cli-metadata"` y
  `"tool-discovery"`. Almacene aquí la referencia al entorno de ejecución, normalmente mediante
  `createPluginRuntimeStore`.
- `registerCliMetadata` se ejecuta para `"cli-metadata"`, `"discovery"` y
  `"full"`. Utilícelo como ubicación canónica para los descriptores de la CLI propios del canal,
  de modo que la ayuda raíz no active el plugin, las instantáneas de detección incluyan metadatos
  estáticos de los comandos y el registro normal de la CLI siga siendo compatible con las cargas
  completas del plugin.
- `registerFull` solo se ejecuta para `"full"` y `"tool-discovery"`. En
  `"tool-discovery"` se ejecuta _en lugar del_ registro del canal: OpenClaw
  omite por completo `registerChannel`/`setRuntime` y solo llama a
  `registerFull`, por lo que cualquier registro de proveedores o herramientas que el canal necesite para
  la detección o ejecución independiente de herramientas debe estar allí, no detrás de la configuración normal
  del canal.
- El registro de detección no activa el plugin, pero no evita las importaciones: OpenClaw puede
  evaluar la entrada del plugin de confianza y el módulo del plugin del canal para generar la
  instantánea. Mantenga las importaciones de nivel superior sin efectos secundarios y coloque los sockets,
  clientes, procesos de trabajo y servicios detrás de rutas exclusivas de `"full"`.
- Al igual que `definePluginEntry`, `configSchema` puede ser una función generadora diferida; OpenClaw
  memoriza el esquema resuelto en el primer acceso.

Registro de la CLI:

- Utilice `api.registerCli(..., { descriptors: [...] })` para los comandos raíz de la
  CLI propios del plugin que quiera cargar de forma diferida sin que desaparezcan del árbol de análisis
  de la CLI raíz. Los nombres de los descriptores deben contener letras, números, guiones y
  guiones bajos, y comenzar por una letra o un número; OpenClaw rechaza otras
  formas y elimina las secuencias de control del terminal de las descripciones antes de
  mostrar la ayuda. Incluya cada raíz de comando de nivel superior que exponga el registrador.
  `commands` por sí solo permanece en la ruta de compatibilidad de carga inmediata.
- Utilice `api.registerNodeCliFeature(...)` para los comandos de funciones de nodos emparejados, de modo que
  aparezcan en `openclaw nodes` (equivale a
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Para otros comandos de plugins anidados, añada `parentPath` y registre los comandos
  en el objeto `program` que se pasa al registrador; OpenClaw lo resuelve como
  el comando principal antes de llamar al plugin.
- Para los plugins de canales, registre los descriptores de la CLI desde `registerCliMetadata`
  y mantenga `registerFull` centrado en las tareas exclusivas del tiempo de ejecución.
- Si `registerFull` también registra métodos RPC del Gateway, manténgalos en un
  prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se convierten en
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve únicamente `{ plugin }`, sin
integración con el entorno de ejecución ni la CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esta entrada en lugar de la entrada completa cuando un canal está deshabilitado,
no está configurado o cuando la carga diferida está habilitada. Consulte
[Configuración inicial y configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo es relevante.

Combine `defineSetupPluginEntry(...)` con las familias de funciones auxiliares específicas para la configuración inicial:

| Importación                          | Se usa para                                                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime`  | Utilidades de configuración seguras para el entorno de ejecución: `createSetupTranslator`, adaptadores de parches de configuración seguros para importación, salida de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
| `openclaw/plugin-sdk/channel-setup`  | Superficies de configuración de instalación opcional                                                                                                                                                          |
| `openclaw/plugin-sdk/setup-tools`    | Utilidades de configuración/instalación para la CLI, archivos y documentación                                                                                                                                 |

Mantenga los SDK pesados, el registro de la CLI y los servicios de entorno de ejecución de larga duración en la entrada completa.

Los canales incluidos en el espacio de trabajo que separan las superficies de configuración y de entorno de ejecución pueden usar en su lugar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract`. Esto permite que la entrada de configuración conserve las exportaciones del plugin y de secretos que son seguras para la configuración, a la vez que expone un establecedor del entorno de ejecución:

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

Use esto solo cuando un flujo de configuración realmente necesite un establecedor ligero del entorno de ejecución o una superficie del Gateway segura para la configuración antes de que se cargue la entrada completa del canal. `registerSetupRuntime` se ejecuta solo para cargas `"setup-runtime"`; limítelo a rutas o métodos exclusivos de configuración que deban existir antes de la activación completa diferida.

## Modo de registro

`api.registrationMode` indica al plugin cómo se cargó:

| Modo               | Cuándo                                                     | Qué registrar                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Inicio normal del Gateway                                  | Todo                                                                                                                                                             |
| `"discovery"`      | Descubrimiento de capacidades de solo lectura              | Registro del canal más descriptores estáticos de la CLI; el código de entrada puede cargarse, pero debe omitir sockets, procesos de trabajo, clientes y servicios |
| `"tool-discovery"` | Carga limitada para enumerar o ejecutar herramientas de plugins específicos | Solo registro de capacidades/herramientas; sin activación del canal                                                                                               |
| `"setup-only"`     | Canal deshabilitado o sin configurar                       | Solo registro del canal                                                                                                                                          |
| `"setup-runtime"`  | Flujo de configuración con entorno de ejecución disponible | Registro del canal más únicamente el entorno de ejecución ligero necesario antes de cargar la entrada completa                                                   |
| `"cli-metadata"`   | Captura de la ayuda raíz o los metadatos de la CLI         | Solo descriptores de la CLI                                                                                                                                       |

`defineChannelPluginEntry` gestiona esta separación automáticamente. Si usa `definePluginEntry` directamente para un canal, compruebe el modo y recuerde que `"tool-discovery"` omite el registro del canal:

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
    // Registre superficies exclusivas de capacidades (proveedores/herramientas), sin canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados exclusivos del entorno de ejecución
  api.registerService(/* ... */);
}
```

El modo de descubrimiento crea una instantánea del registro que no activa nada. Aun así, puede evaluar la entrada del plugin y el objeto del plugin de canal para que OpenClaw pueda registrar las capacidades del canal y los descriptores estáticos de la CLI. Considere la evaluación de módulos durante el descubrimiento como fiable, pero ligera: no debe haber clientes de red, subprocesos, receptores, conexiones a bases de datos, procesos de trabajo en segundo plano, lecturas de credenciales ni otros efectos secundarios del entorno de ejecución activo en el nivel superior.

Considere `"setup-runtime"` como el intervalo en el que deben existir las superficies de inicio exclusivas de la configuración sin volver a entrar en el entorno de ejecución completo del canal incluido. Algunos usos adecuados son el registro del canal, las rutas HTTP seguras para la configuración, los métodos del Gateway seguros para la configuración y las utilidades de configuración delegadas. Los servicios pesados en segundo plano, los registradores de la CLI y la inicialización de SDK de proveedores o clientes siguen correspondiendo a `"full"`.

## Formas de los plugins

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                  | Descripción                                              |
| ---------------------- | -------------------------------------------------------- |
| **plain-capability**   | Un tipo de capacidad (p. ej., solo proveedor)            |
| **hybrid-capability**  | Varios tipos de capacidades (p. ej., proveedor + voz)    |
| **hook-only**          | Solo hooks, sin capacidades                              |
| **non-capability**     | Herramientas/comandos/servicios, pero sin capacidades    |

Use `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Temas relacionados

- [Descripción general del SDK](/es/plugins/sdk-overview) - API de registro y referencia de subrutas
- [Utilidades del entorno de ejecución](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración y ajustes](/es/plugins/sdk-setup) - manifiesto, entrada de configuración y carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
