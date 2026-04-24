---
read_when:
    - Necesitas la firma de tipo exacta de definePluginEntry o defineChannelPluginEntry
    - Quieres entender el modo de registro (full vs setup vs metadatos de CLI)
    - Estás consultando opciones de puntos de entrada
sidebarTitle: Entry Points
summary: Referencia de `definePluginEntry`, `defineChannelPluginEntry` y `defineSetupPluginEntry`
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-24T05:41:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Todo Plugin exporta un objeto de entrada predeterminado. El SDK proporciona tres ayudantes para
crearlos.

Para Plugins instalados, `package.json` debe apuntar la carga de tiempo de ejecución al
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

`extensions` y `setupEntry` siguen siendo entradas de fuente válidas para desarrollo
de espacio de trabajo y checkout de git. `runtimeExtensions` y `runtimeSetupEntry` se prefieren
cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la compilación
en tiempo de ejecución de TypeScript. Si un paquete instalado solo declara una entrada de fuente TypeScript,
OpenClaw usará un par compilado `dist/*.js` coincidente cuando exista y luego
recaerá en la fuente TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del Plugin. Las entradas de tiempo de ejecución
y los pares inferidos de JavaScript compilado no hacen válida una ruta fuente de `extensions` o
`setupEntry` que se escape del paquete.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías detalladas.
</Tip>

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para Plugins de proveedor, Plugins de herramientas, Plugins de hooks y cualquier cosa que **no**
sea un canal de mensajería.

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
| `id`           | `string`                                                         | Sí          | —                    |
| `name`         | `string`                                                         | Sí          | —                    |
| `description`  | `string`                                                         | Sí          | —                    |
| `kind`         | `string`                                                         | No          | —                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | —                    |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para ranuras exclusivas: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoiza ese esquema en el primer acceso, así que los constructores de esquemas costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con conexión específica de canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una interfaz opcional de metadatos CLI de ayuda raíz y limita `registerFull` según el modo de registro.

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

| Campo                | Tipo                                                             | Obligatorio | Predeterminado       |
| -------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                 | `string`                                                         | Sí          | —                    |
| `name`               | `string`                                                         | Sí          | —                    |
| `description`        | `string`                                                         | Sí          | —                    |
| `plugin`             | `ChannelPlugin`                                                  | Sí          | —                    |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | No          | —                    |
| `registerCliMetadata`| `(api: OpenClawPluginApi) => void`                               | No          | —                    |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                               | No          | —                    |

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de tiempo de ejecución
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura
  de metadatos CLI.
- `registerCliMetadata` se ejecuta tanto durante `api.registrationMode === "cli-metadata"`
  como durante `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para descriptores CLI propiedad del canal para que la ayuda raíz
  siga sin activar la carga mientras el registro normal de comandos CLI sigue siendo compatible
  con cargas completas de Plugins.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración.
- Igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoiza el esquema resuelto en el primer acceso.
- Para comandos CLI raíz propiedad del Plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando siga cargándose de forma diferida sin desaparecer del
  árbol de análisis de la CLI raíz. Para Plugins de canal, prefiere registrar esos descriptores
  desde `registerCliMetadata(...)` y mantener `registerFull(...)` centrado en trabajo solo de tiempo de ejecución.
- Si `registerFull(...)` también registra métodos RPC de gateway, mantenlos en un
  prefijo específico del Plugin. Los espacios de nombres administrativos principales reservados (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
conexión de tiempo de ejecución ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulta
[Configuración y setup](/es/plugins/sdk-setup#setup-entry) para ver cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas de ayudantes
de configuración:

- `openclaw/plugin-sdk/setup-runtime` para ayudantes de configuración seguros en tiempo de ejecución como
  adaptadores de parche de configuración seguros para importación, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para ayudantes de CLI/archivo/documentación de configuración/instalación

Mantén SDK pesados, registro CLI y servicios duraderos de tiempo de ejecución en la
entrada completa.

Los canales incluidos del espacio de trabajo que dividen configuración y superficies de tiempo de ejecución pueden usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración mantenga exportaciones de plugin/secretos seguras para configuración mientras sigue exponiendo un
setter de tiempo de ejecución:

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

Usa ese contrato incluido solo cuando los flujos de configuración realmente necesiten un setter ligero
de tiempo de ejecución antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` indica a tu Plugin cómo fue cargado:

| Modo              | Cuándo                             | Qué registrar                                                                             |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del gateway          | Todo                                                                                      |
| `"setup-only"`    | Canal deshabilitado/sin configurar | Solo registro de canal                                                                    |
| `"setup-runtime"` | Flujo de configuración con tiempo de ejecución disponible | Registro de canal más solo el tiempo de ejecución ligero necesario antes de que cargue la entrada completa |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos CLI | Solo descriptores CLI                                                                  |

`defineChannelPluginEntry` gestiona esta división automáticamente. Si usas
`definePluginEntry` directamente para un canal, comprueba tú mismo el modo:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados solo de tiempo de ejecución
  api.registerService(/* ... */);
}
```

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en el tiempo de ejecución completo del canal incluido. Buenos candidatos son
el registro de canal, rutas HTTP seguras para configuración, métodos de gateway seguros para configuración y
ayudantes delegados de configuración. Los servicios pesados en segundo plano, registradores CLI y
arranque de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para los registradores CLI específicamente:

- usa `descriptors` cuando el registrador posea uno o más comandos raíz y
  quieras que OpenClaw cargue de forma diferida el módulo CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- usa solo `commands` para rutas compatibles de carga ansiosa

## Formas de Plugin

OpenClaw clasifica los Plugins cargados por su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (por ejemplo solo proveedor)  |
| **hybrid-capability** | Varios tipos de capacidad (por ejemplo proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) — API de registro y referencia de subrutas
- [Ayudantes de tiempo de ejecución](/es/plugins/sdk-runtime) — `api.runtime` y `createPluginRuntimeStore`
- [Configuración y setup](/es/plugins/sdk-setup) — manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — construir el objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — registro de proveedor y hooks
