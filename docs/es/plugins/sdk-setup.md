---
read_when:
    - Estás agregando un asistente de configuración a un plugin
    - Necesitas entender `setup-entry.ts` frente a `index.ts`
    - Estás definiendo esquemas de configuración de plugins o metadata `openclaw` en `package.json`
sidebarTitle: Setup and Config
summary: Asistentes de configuración, `setup-entry.ts`, esquemas de configuración y metadata de `package.json`
title: Configuración y setup de plugins
x-i18n:
    generated_at: "2026-04-21T05:17:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuración y setup de plugins

Referencia para empaquetado de plugins (metadata de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de setup y esquemas de configuración.

<Tip>
  **¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Channel Plugins](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Provider Plugins](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata del paquete

Tu `package.json` necesita un campo `openclaw` que le diga al sistema de plugins qué
proporciona tu plugin:

**Plugin de canal:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin de proveedor / línea base de publicación en ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Si publicas el plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos canónicos de publicación viven en
`docs/snippets/plugin-publish/`.

### Campos de `openclaw`

| Campo        | Tipo       | Descripción                                                                                           |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                        |
| `setupEntry` | `string`   | Entrada ligera solo para setup (opcional)                                                             |
| `channel`    | `object`   | Metadata del catálogo de canales para superficies de setup, selector, inicio rápido y estado          |
| `providers`  | `string[]` | IDs de proveedores registrados por este plugin                                                        |
| `install`    | `object`   | Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Banderas de comportamiento al inicio                                                                  |

### `openclaw.channel`

`openclaw.channel` es metadata barata del paquete para descubrimiento de canales y superficies de setup
antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canónico del canal.                                                        |
| `label`                                | `string`   | Etiqueta principal del canal.                                                 |
| `selectionLabel`                       | `string`   | Etiqueta del selector/setup cuando deba diferir de `label`.                   |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más ricos. |
| `docsPath`                             | `string`   | Ruta de docs para enlaces de setup y selección.                               |
| `docsLabel`                            | `string`   | Etiqueta de sobrescritura usada para enlaces a docs cuando deba diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción corta de incorporación/catálogo.                                  |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                               |
| `aliases`                              | `string[]` | Alias adicionales de búsqueda para la selección de canales.                   |
| `preferOver`                           | `string[]` | IDs de plugin/canal de menor prioridad sobre los que este canal debe prevalecer. |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos UI de canales.           |
| `selectionDocsPrefix`                  | `string`   | Texto prefijo antes de los enlaces a docs en superficies de selección.        |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de docs directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Strings cortos adicionales anexados en el texto de selección.                 |
| `markdownCapable`                      | `boolean`  | Marca el canal como capaz de usar markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para setup, listas configuradas y superficies de docs. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de setup rápido `allowFrom`.          |
| `forceAccountBinding`                  | `boolean`  | Requiere binding explícito de cuenta incluso cuando solo existe una cuenta.   |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesión al resolver destinos de anuncios para este canal. |

Ejemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` admite:

- `configured`: incluir el canal en superficies de listado de configurados/estado
- `setup`: incluir el canal en selectores interactivos de setup/configuración
- `docs`: marcar el canal como orientado al público en superficies de docs/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere
`exposure`.

### `openclaw.install`

`openclaw.install` es metadata del paquete, no metadata del manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.            |
| `localPath`                  | `string`             | Ruta de instalación local de desarrollo o incluida.                              |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                  |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z`.                  |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que flujos de reinstalación de bundled-plugin recuperen fallos específicos de configuración obsoleta. |

Si se establece `minHostVersion`, tanto la instalación como la carga del registro de manifiestos la hacen cumplir.
Los hosts más antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.

`allowInvalidConfigRecovery` no es un bypass general para configuraciones rotas. Es
solo para recuperación acotada de bundled-plugin, de modo que la reinstalación/setup pueda reparar restos conocidos de actualizaciones, como una ruta faltante de bundled plugin o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está rota por razones no relacionadas, la instalación sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.

### Carga completa diferida

Los plugins de canal pueden optar por la carga diferida con:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio
previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el
gateway empieza a escuchar.

<Warning>
  Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el
  gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP,
  métodos del gateway). Si la entrada completa posee capacidades de inicio requeridas, mantén
  el comportamiento predeterminado.
</Warning>

Si tu entrada de setup/completa registra métodos RPC del gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos centrales reservados (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven
a `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete.
OpenClaw usa esto para validar la configuración sin ejecutar código del plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Para plugins de canal, agrega `kind` y `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Incluso los plugins sin configuración deben incluir un esquema. Un esquema vacío es válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulta [Plugin Manifest](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para Skills es para Skills. Los paquetes de plugins deben
usar siempre `clawhub package publish`.

## Entrada de setup

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que
OpenClaw carga cuando solo necesita superficies de setup (incorporación, reparación de configuración,
inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de runtime (bibliotecas criptográficas, registros de CLI,
servicios en segundo plano) durante los flujos de setup.

Los canales bundled del espacio de trabajo que mantengan exportaciones seguras para setup en módulos sidecar pueden
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en lugar de
`defineSetupPluginEntry(...)`. Ese contrato bundled también admite un export opcional
`runtime` para que el cableado de runtime en tiempo de setup siga siendo ligero y explícito.

**Cuándo OpenClaw usa `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de setup/incorporación
- El canal está habilitado pero no configurado
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP requerida antes de que el gateway empiece a escuchar
- Cualquier método del gateway necesario durante el inicio

Esos métodos del gateway de inicio deben seguir evitando espacios de nombres
administrativos centrales reservados como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Importaciones pesadas de runtime (crypto, SDKs)
- Métodos del gateway necesarios solo después del inicio

### Importaciones reducidas de helpers de setup

Para rutas activas solo de setup, prefiere las costuras reducidas de helpers de setup frente a la
interfaz más amplia `plugin-sdk/setup` cuando solo necesites una parte de la superficie de setup:

| Ruta de importación                 | Úsala para                                                                               | Exports clave                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime en tiempo de setup que siguen disponibles en `setupEntry` / inicio diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de setup de cuenta conscientes del entorno                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers de CLI/archivo/docs para setup/instalación                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Usa la costura más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas compartida completa de setup, incluidos helpers de parche de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de setup siguen siendo seguros para rutas activas al importarse. Su
búsqueda de superficie de contrato bundled de promoción de cuenta única es diferida, así que importar
`plugin-sdk/setup-runtime` no carga con avidez el descubrimiento de superficie de contrato bundled antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza de una configuración superior de cuenta única a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores
promovidos con alcance de cuenta a `accounts.default`.

Los canales bundled pueden reducir o sobrescribir esa promoción mediante su superficie de contrato de setup:

- `singleAccountKeysToMove`: claves superiores adicionales que deben moverse a la
  cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promovidos

Matrix es el ejemplo bundled actual. Si ya existe exactamente una cuenta Matrix con nombre,
o si `defaultAccount` apunta a una clave no canónica existente como `Ops`,
la promoción conserva esa cuenta en lugar de crear una nueva entrada
`accounts.default`.

## Esquema de configuración

La configuración del plugin se valida contra el JSON Schema de tu manifiesto. Los usuarios
configuran plugins mediante:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Tu plugin recibe esta configuración como `api.pluginConfig` durante el registro.

Para configuración específica del canal, usa en su lugar la sección de configuración del canal:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Crear esquemas de configuración de canal

Usa `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un
esquema Zod en el contenedor `ChannelConfigSchema` que OpenClaw valida:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Asistentes de setup

Los plugins de canal pueden proporcionar asistentes de setup interactivos para `openclaw onboard`.
El asistente es un objeto `ChannelSetupWizard` en el `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más.
Consulta paquetes de plugins bundled (por ejemplo el plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para prompts de allowlist de DM que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiere los helpers compartidos de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de setup de canal que solo varían por etiquetas, puntuaciones y líneas
adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de construir a mano el mismo objeto `status` en
cada plugin.

Para superficies de setup opcionales que solo deban aparecer en ciertos contextos, usa
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` también expone los constructores de nivel inferior
`createOptionalChannelSetupAdapter(...)` y
`createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutiliza un mensaje único de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y agrega un enlace a docs cuando `docsPath` está
configurado.

Para UIs de setup respaldadas por binarios, prefiere los helpers delegados compartidos en lugar de
copiar el mismo pegamento de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas,
  sugerencias, puntuaciones y detección de binarios
- `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita delegar de forma diferida a un asistente completo más pesado
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión `textInputs[*].shouldPrompt`

## Publicar e instalar

**Plugins externos:** publícalos en [ClawHub](/es/tools/clawhub) o npm, luego instálalos:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero con ClawHub y recurre automáticamente a npm. También puedes
forzar explícitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una sobrescritura equivalente `npm:`. Usa la especificación normal del paquete npm cuando
quieras la ruta de npm después del fallback de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colócalos bajo el árbol de espacios de trabajo de plugins bundled y se descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones obtenidas desde npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantén los árboles de dependencias del plugin en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

Los plugins bundled propiedad de OpenClaw son la única excepción de reparación al inicio: cuando una
instalación empaquetada ve uno habilitado por configuración de plugin, configuración de canal heredada o
su manifiesto bundled habilitado por defecto, el inicio instala las dependencias
de runtime faltantes de ese plugin antes de importarlo. Los plugins de terceros no deben depender de instalaciones al inicio; sigue usando el instalador explícito de plugins.

## Relacionado

- [SDK Entry Points](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Plugin Manifest](/es/plugins/manifest) -- referencia completa del esquema de manifiesto
- [Building Plugins](/es/plugins/building-plugins) -- guía paso a paso para empezar
