---
read_when:
    - Se necesita la firma de tipo exacta de definePluginEntry o defineChannelPluginEntry
    - Quieres comprender el modo de registro (completo vs configuración vs metadatos de CLI)
    - Estás consultando las opciones del punto de entrada
sidebarTitle: Entry Points
summary: Referencia para definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada del Plugin
x-i18n:
    generated_at: "2026-05-02T05:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada Plugin exporta un objeto de entrada predeterminado. El SDK proporciona tres helpers para
crearlos.

Para Plugins instalados, `package.json` debe dirigir la carga en tiempo de ejecución al
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

`extensions` y `setupEntry` siguen siendo entradas de origen válidas para el desarrollo
en espacios de trabajo y checkouts de git. `runtimeExtensions` y `runtimeSetupEntry` son preferibles
cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la compilación
TypeScript en tiempo de ejecución. Las entradas de runtime explícitas son obligatorias: `runtimeSetupEntry`
requiere `setupEntry`, y los artefactos faltantes de `runtimeExtensions` o `runtimeSetupEntry`
hacen fallar la instalación o el descubrimiento en lugar de volver silenciosamente al origen. Si
un paquete instalado solo declara una entrada de origen TypeScript, OpenClaw usará un par
`dist/*.js` compilado coincidente cuando exista y luego volverá al origen TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del Plugin. Las entradas de runtime
y los pares JavaScript compilados inferidos no hacen válida una ruta de origen `extensions` o
`setupEntry` que escape del paquete.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para Plugins de proveedor, Plugins de herramientas, Plugins de hooks y cualquier cosa que **no** sea
un canal de mensajería.

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

| Campo          | Tipo                                                             | Obligatorio | Predeterminado             |
| -------------- | ---------------------------------------------------------------- | ----------- | -------------------------- |
| `id`           | `string`                                                         | Sí          | —                          |
| `name`         | `string`                                                         | Sí          | —                          |
| `description`  | `string`                                                         | Sí          | —                          |
| `kind`         | `string`                                                         | No          | —                          |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | —                          |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para ranuras exclusivas: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoriza ese esquema en el primer acceso, por lo que los builders de esquemas
  costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico del canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una interfaz opcional de metadatos de CLI para la ayuda raíz
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
| `id`                  | `string`                                                         | Sí          | —                          |
| `name`                | `string`                                                         | Sí          | —                          |
| `description`         | `string`                                                         | Sí          | —                          |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | —                          |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | —                          |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | —                          |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | —                          |

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de runtime
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura de metadatos
  de CLI.
- `registerCliMetadata` se ejecuta durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` y
  `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para descriptores de CLI propiedad del canal, de modo que la ayuda raíz
  no active el Plugin, las instantáneas de descubrimiento incluyan metadatos de comandos estáticos y
  el registro normal de comandos de CLI siga siendo compatible con cargas completas del Plugin.
- El registro de descubrimiento no activa, pero no está libre de importaciones. OpenClaw puede
  evaluar la entrada del Plugin confiable y el módulo del Plugin de canal para construir la
  instantánea, así que mantén las importaciones de nivel superior sin efectos secundarios y coloca sockets,
  clientes, workers y servicios detrás de rutas solo para `"full"`.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración inicial.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoriza el esquema resuelto en el primer acceso.
- Para comandos de CLI raíz propiedad del Plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando se mantenga con carga diferida sin desaparecer del
  árbol de análisis de la CLI raíz. Para Plugins de canal, prefiere registrar esos descriptores
  desde `registerCliMetadata(...)` y mantén `registerFull(...)` centrado en trabajo solo de runtime.
- Si `registerFull(...)` también registra métodos RPC de Gateway, mantenlos en un
  prefijo específico del Plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }`, sin
runtime ni cableado de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulta
[Configuración inicial y configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas de helpers de configuración inicial:

- `openclaw/plugin-sdk/setup-runtime` para helpers de configuración inicial seguros en runtime, como
  adaptadores de parches de configuración inicial seguros para importar, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración inicial delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración inicial de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de configuración inicial/instalación de CLI/archivo/docs

Mantén los SDK pesados, el registro de CLI y los servicios de runtime de larga duración en la entrada
completa.

Los canales empaquetados del espacio de trabajo que separan las superficies de configuración inicial y runtime pueden usar
`defineBundledChannelSetupEntry(...)` desde
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración inicial mantenga exportaciones de Plugin/secretos seguras para configuración inicial, sin dejar de exponer un
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
});
```

Usa ese contrato empaquetado solo cuando los flujos de configuración inicial realmente necesiten un setter de runtime
ligero antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` le dice a tu Plugin cómo se cargó:

| Modo              | Cuándo                                  | Qué registrar                                                                                                           |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del Gateway               | Todo                                                                                                                    |
| `"discovery"`     | Descubrimiento de capacidades de solo lectura | Registro del canal más descriptores de CLI estáticos; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"setup-only"`    | Canal deshabilitado/sin configurar      | Solo registro del canal                                                                                                 |
| `"setup-runtime"` | Flujo de configuración inicial con runtime disponible | Registro del canal más solo el runtime ligero necesario antes de que se cargue la entrada completa                       |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos de CLI | Solo descriptores de CLI                                                                                                |

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

El modo de descubrimiento construye una instantánea de registro que no activa. Aun así, puede evaluar
la entrada del Plugin y el objeto del Plugin de canal para que OpenClaw pueda registrar las
capacidades del canal y los descriptores de CLI estáticos. Trata la evaluación de módulos en descubrimiento como
confiable pero ligera: sin clientes de red, subprocesos, listeners, conexiones de base de datos,
workers en segundo plano, lecturas de credenciales ni otros efectos secundarios de runtime activos en el nivel superior.

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración inicial deben
existir sin volver a entrar en el runtime completo del canal empaquetado. Buenos usos son
el registro del canal, rutas HTTP seguras para configuración inicial, métodos de Gateway seguros para configuración inicial y
helpers de configuración inicial delegados. Los servicios pesados en segundo plano, registradores de CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para registradores de CLI específicamente:

- usa `descriptors` cuando el registrador sea propietario de uno o más comandos raíz y quieras
  que OpenClaw cargue de forma diferida el módulo de CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- mantén los nombres de comandos de descriptor con letras, números, guion y guion bajo,
  empezando por una letra o un número; OpenClaw rechaza nombres de descriptor fuera
  de esa forma y elimina secuencias de control de terminal de las descripciones antes de
  renderizar la ayuda
- usa solo `commands` únicamente para rutas de compatibilidad con carga inmediata

## Formas de Plugin

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)      |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios, pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) — API de registro y referencia de subrutas
- [Auxiliares de runtime](/es/plugins/sdk-runtime) — `api.runtime` y `createPluginRuntimeStore`
- [Configuración e instalación](/es/plugins/sdk-setup) — manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — registro de proveedores y hooks
