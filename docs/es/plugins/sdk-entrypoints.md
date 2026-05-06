---
read_when:
    - Necesitas la firma de tipo exacta de definePluginEntry o defineChannelPluginEntry
    - Quieres entender el modo de registro (completo frente a configuración frente a metadatos de CLI)
    - Estás consultando opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia para definePluginEntry, defineChannelPluginEntry y defineSetupPluginEntry
title: Puntos de entrada del Plugin
x-i18n:
    generated_at: "2026-05-06T05:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Cada plugin exporta un objeto de entrada predeterminado. El SDK proporciona tres funciones auxiliares para crearlos.

Para los plugins instalados, `package.json` debería apuntar la carga en tiempo de ejecución al JavaScript compilado cuando esté disponible:

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

`extensions` y `setupEntry` siguen siendo entradas de código fuente válidas para el desarrollo en el espacio de trabajo y en checkouts de git. `runtimeExtensions` y `runtimeSetupEntry` se prefieren cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la compilación de TypeScript en tiempo de ejecución. Las entradas de tiempo de ejecución explícitas son obligatorias: `runtimeSetupEntry` requiere `setupEntry`, y los artefactos faltantes de `runtimeExtensions` o `runtimeSetupEntry` hacen que la instalación/detección falle en lugar de volver silenciosamente al código fuente. Si un paquete instalado solo declara una entrada de código fuente TypeScript, OpenClaw usará un par `dist/*.js` compilado coincidente cuando exista y luego volverá al código fuente TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del plugin. Las entradas de tiempo de ejecución y los pares de JavaScript compilado inferidos no hacen válida una ruta de código fuente `extensions` o `setupEntry` que escape del directorio.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedor, plugins de herramientas, plugins de hooks y cualquier cosa que **no** sea
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

| Campo          | Tipo                                                             | Obligatorio | Valor predeterminado             |
| -------------- | ---------------------------------------------------------------- | ----------- | -------------------------------- |
| `id`           | `string`                                                         | Sí          | -                                |
| `name`         | `string`                                                         | Sí          | -                                |
| `description`  | `string`                                                         | Sí          | -                                |
| `kind`         | `string`                                                         | No          | -                                |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío          |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | -                                |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para espacios exclusivos: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoriza ese esquema en el primer acceso, por lo que los constructores de esquemas
  costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico de canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una costura opcional de metadatos CLI para la ayuda raíz
y controla `registerFull` según el modo de registro.

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

| Campo                 | Tipo                                                             | Obligatorio | Valor predeterminado             |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------------------- |
| `id`                  | `string`                                                         | Sí          | -                                |
| `name`                | `string`                                                         | Sí          | -                                |
| `description`         | `string`                                                         | Sí          | -                                |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | -                                |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío          |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | -                                |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | -                                |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | -                                |

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de tiempo de ejecución
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura de metadatos CLI.
- `registerCliMetadata` se ejecuta durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` y
  `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para los descriptores CLI propiedad del canal, de modo que la ayuda raíz
  siga sin activar nada, las instantáneas de detección incluyan metadatos estáticos de comandos y
  el registro normal de comandos CLI siga siendo compatible con las cargas completas del plugin.
- El registro de detección no activa nada, pero no está libre de importaciones. OpenClaw puede
  evaluar la entrada del plugin de confianza y el módulo del plugin de canal para construir la
  instantánea, así que mantén las importaciones de nivel superior sin efectos secundarios y coloca sockets,
  clientes, workers y servicios detrás de rutas solo para `"full"`.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoriza el esquema resuelto en el primer acceso.
- Para comandos CLI raíz propiedad del plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando permanezca con carga diferida sin desaparecer del
  árbol de análisis CLI raíz. Para plugins de canal, prefiere registrar esos descriptores
  desde `registerCliMetadata(...)` y mantener `registerFull(...)` centrado en trabajo solo de tiempo de ejecución.
- Si `registerFull(...)` también registra métodos RPC de Gateway, mantenlos en un
  prefijo específico del plugin. Los espacios de nombres de administración del núcleo reservados (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
cableado de tiempo de ejecución ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar, o cuando la carga diferida está habilitada. Consulta
[Configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas de funciones auxiliares
de configuración:

- `openclaw/plugin-sdk/setup-runtime` para funciones auxiliares de configuración seguras en tiempo de ejecución, como
  adaptadores de parches de configuración seguros de importar, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para funciones auxiliares de configuración/instalación de CLI/archivo/docs

Mantén los SDK pesados, el registro CLI y los servicios de tiempo de ejecución de larga duración en la entrada completa.

Los canales incluidos en el espacio de trabajo que separan superficies de configuración y tiempo de ejecución pueden usar
`defineBundledChannelSetupEntry(...)` desde
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración conserve exportaciones de plugin/secretos seguras para configuración mientras sigue exponiendo un
establecedor de tiempo de ejecución:

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

Usa ese contrato incluido solo cuando los flujos de configuración realmente necesiten un establecedor de tiempo de ejecución
ligero antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` indica a tu plugin cómo se cargó:

| Modo              | Cuándo                            | Qué registrar                                                                                                           |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal de Gateway          | Todo                                                                                                                    |
| `"discovery"`     | Detección de capacidades de solo lectura | Registro de canal más descriptores CLI estáticos; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"setup-only"`    | Canal deshabilitado/sin configurar | Solo registro de canal                                                                                                  |
| `"setup-runtime"` | Flujo de configuración con tiempo de ejecución disponible | Registro de canal más solo el tiempo de ejecución ligero necesario antes de que se cargue la entrada completa           |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos CLI | Solo descriptores CLI                                                                                                   |

`defineChannelPluginEntry` gestiona esta separación automáticamente. Si usas
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

El modo de detección construye una instantánea de registro que no activa nada. Aun así puede evaluar
la entrada del plugin y el objeto del plugin de canal para que OpenClaw pueda registrar capacidades de canal
y descriptores CLI estáticos. Trata la evaluación de módulos en detección como
confiable pero ligera: sin clientes de red, subprocesos, listeners, conexiones de base de datos,
workers en segundo plano, lecturas de credenciales ni otros efectos secundarios de tiempo de ejecución en vivo
en el nivel superior.

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en el tiempo de ejecución completo del canal incluido. Buenos candidatos son
el registro de canal, rutas HTTP seguras para configuración, métodos Gateway seguros para configuración y
funciones auxiliares de configuración delegadas. Los servicios pesados en segundo plano, registradores CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para registradores CLI específicamente:

- usa `descriptors` cuando el registrador posee uno o más comandos raíz y quieres
  que OpenClaw cargue de forma diferida el módulo CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- limita los nombres de comandos de descriptor a letras, números, guion y guion bajo,
  empezando por una letra o un número; OpenClaw rechaza nombres de descriptor fuera
  de esa forma y elimina las secuencias de control de terminal de las descripciones antes de
  renderizar la ayuda
- usa solo `commands` únicamente para rutas de compatibilidad ansiosa

## Formas de plugin

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)      |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios, pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) - API de registro y referencia de subrutas
- [Ayudantes de tiempo de ejecución](/es/plugins/sdk-runtime) - `api.runtime` y `createPluginRuntimeStore`
- [Configuración](/es/plugins/sdk-setup) - manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - registro de proveedores y hooks
