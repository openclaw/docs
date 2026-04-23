---
read_when:
    - Estás añadiendo un asistente de configuración a un Plugin
    - Necesitas entender `setup-entry.ts` frente a `index.ts`
    - Estás definiendo esquemas de configuración de Plugin o metadatos `openclaw` de package.json
sidebarTitle: Setup and Config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración y setup de Plugin
x-i18n:
    generated_at: "2026-04-23T14:05:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuración y setup de Plugin

Referencia para empaquetado de plugins (metadatos de `package.json`), manifests
(`openclaw.plugin.json`), entradas de setup y esquemas de configuración.

<Tip>
  **¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que le indique al sistema de plugins qué proporciona tu plugin:

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

**Plugin de proveedor / referencia base de publicación en ClawHub:**

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

Si publicas el plugin externamente en ClawHub, esos campos `compat` y `build` son obligatorios. Los fragmentos canónicos de publicación están en `docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descripción                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                                               |
| `setupEntry` | `string`   | Entrada ligera solo para setup (opcional)                                                                                    |
| `channel`    | `object`   | Metadatos del catálogo de canales para setup, selector, inicio rápido y superficies de estado                               |
| `providers`  | `string[]` | IDs de proveedor registrados por este plugin                                                                                 |
| `install`    | `object`   | Pistas de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento de inicio                                                                                      |

### `openclaw.channel`

`openclaw.channel` es metadato barato de paquete para el descubrimiento de canales y superficies de setup antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta del selector/setup cuando debe diferir de `label`.                    |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más ricos. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de setup y selección.                       |
| `docsLabel`                            | `string`   | Anula la etiqueta usada para enlaces de documentación cuando deba diferir del ID del canal. |
| `blurb`                                | `string`   | Breve descripción para onboarding/catálogo.                                    |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canales.                    |
| `preferOver`                           | `string[]` | IDs de plugin/canal de menor prioridad a los que este canal debe superar.      |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos de UI de canales.         |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces a documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostrar la ruta de documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para setup, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de setup rápido `allowFrom`.           |
| `forceAccountBinding`                  | `boolean`  | Requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesión al resolver destinos de anuncio para este canal. |

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

- `configured`: incluir el canal en superficies de listado de estilo configurado/estado
- `setup`: incluir el canal en selectores interactivos de setup/configuración
- `docs`: marcar el canal como público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.

### `openclaw.install`

`openclaw.install` es metadato de paquete, no metadato de manifest.

| Campo                        | Tipo                 | Qué significa                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.             |
| `localPath`                  | `string`             | Ruta local de desarrollo o instalación incluida.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                   |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw en el formato `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | Cadena de integridad esperada de npm dist, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins incluidos recuperen ciertos fallos de configuración obsoleta. |

El onboarding interactivo también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu plugin expone opciones de autenticación de proveedor o metadatos de setup/catálogo de canales antes de que se cargue el runtime, el onboarding puede mostrar esa opción, pedir npm frente a local, instalar o habilitar el plugin y luego continuar con el flujo seleccionado. Las opciones de onboarding con npm requieren metadatos de catálogo de confianza con un `npmSpec` del registro; las versiones exactas y `expectedIntegrity` son fijaciones opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican. Mantén el metadato de “qué mostrar” en `openclaw.plugin.json` y el metadato de “cómo instalarlo” en `package.json`.

Si se establece `minHostVersion`, tanto la instalación como la carga del registro de manifests lo aplican. Los hosts más antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.

Para instalaciones npm fijadas, conserva la versión exacta en `npmSpec` y añade la integridad esperada del artefacto:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para recuperación limitada de plugins incluidos, de modo que la reinstalación/setup pueda reparar restos conocidos de actualizaciones, como una ruta faltante de plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación sigue fallando en modo cerrado y le indica al operador que ejecute `openclaw doctor --fix`.

### Carga completa diferida

Los plugins de canal pueden optar por carga diferida con:

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a listen, incluso para canales ya configurados. La entrada completa se carga después de que el gateway empiece a escuchar.

<Warning>
  Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP, métodos del gateway). Si la entrada completa posee capacidades de inicio necesarias, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de setup/completa registra métodos RPC del gateway, mantenlos en un prefijo específico del plugin. Los espacios de nombres administrativos centrales reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre resuelven a `operator.admin`.

## Manifest del Plugin

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

Para plugins de canal, añade `kind` y `channels`:

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

Consulta [Manifest del Plugin](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para skills es para Skills. Los paquetes de plugins siempre deben usar `clawhub package publish`.

## Entrada de setup

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de setup (onboarding, reparación de configuración, inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de runtime (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de setup.

Los canales incluidos del espacio de trabajo que mantienen exportaciones seguras para setup en módulos auxiliares pueden usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación opcional `runtime` para que el cableado de runtime en tiempo de setup siga siendo ligero y explícito.

**Cuándo OpenClaw usa `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de setup/onboarding
- El canal está habilitado pero no configurado
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto del Plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP requerida antes de que el gateway empiece a escuchar
- Cualquier método del gateway necesario durante el inicio

Esos métodos de gateway de inicio deben seguir evitando espacios de nombres administrativos centrales reservados como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Importaciones pesadas de runtime (crypto, SDK)
- Métodos del gateway necesarios solo después del inicio

### Importaciones acotadas de ayudantes de setup

Para rutas calientes solo de setup, prefiere los puntos de acceso estrechos de ayudantes de setup frente al paraguas más amplio `plugin-sdk/setup` cuando solo necesites parte de la superficie de setup:

| Ruta de importación                | Úsala para                                                                               | Exportaciones clave                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de runtime en tiempo de setup que siguen disponibles en `setupEntry` / inicio diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de setup de cuenta con reconocimiento de entorno                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                           |
| `plugin-sdk/setup-tools`           | ayudantes de CLI/instalación/archivo/documentación para setup                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Usa el punto de acceso más amplio `plugin-sdk/setup` cuando quieras la caja de herramientas completa de setup compartido, incluidos ayudantes de parcheo de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parcheo de setup siguen siendo seguros para rutas calientes al importar. Su búsqueda de superficie de contrato incluida para promoción de cuenta única es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficie de contrato incluida antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos con ámbito de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o anular esa promoción a través de su superficie de contrato de setup:

- `singleAccountKeysToMove`: claves superiores adicionales que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elegir qué cuenta existente recibe los valores promovidos

Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.

## Esquema de configuración

La configuración del Plugin se valida frente al esquema JSON de tu manifest. Los usuarios configuran plugins mediante:

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

Para configuración específica de canal, usa en su lugar la sección de configuración del canal:

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

### Construcción de esquemas de configuración de canal

Usa `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un esquema Zod en el envoltorio `ChannelConfigSchema` que OpenClaw valida:

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

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`.
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

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más.
Consulta paquetes de plugins incluidos (por ejemplo el Plugin de Discord `src/channel.setup.ts`) para ver ejemplos completos.

Para prompts de lista de permitidos de MD que solo necesiten el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes compartidos de setup de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de setup de canal que solo varían por etiquetas, puntuaciones y líneas extra opcionales, prefiere `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de construir a mano el mismo objeto `status` en cada plugin.

Para superficies de setup opcionales que solo deben aparecer en ciertos contextos, usa `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Devuelve { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` también expone los constructores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla en modo cerrado en escrituras reales de configuración. Reutiliza un único mensaje de instalación requerida en `validateInput`, `applyAccountConfig` y `finalize`, y añade un enlace a la documentación cuando `docsPath` está establecido.

Para IU de setup respaldadas por binarios, prefiere los ayudantes compartidos delegados en lugar de copiar el mismo pegamento de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, sugerencias, puntuaciones y detección de binarios
- `createCliPathTextInput(...)` para entradas de texto respaldadas por ruta
- `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita delegar de forma diferida a un asistente completo más pesado
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publícalos en [ClawHub](/es/tools/clawhub) o npm, luego instálalos:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero ClawHub y recurre automáticamente a npm. También puedes forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una anulación equivalente `npm:`. Usa la especificación normal del paquete npm cuando quieras la ruta npm tras el fallback de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de plugins incluidos y se detectarán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones desde npm, `openclaw plugins install` ejecuta `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantén los árboles de dependencias del plugin en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

Los plugins incluidos propiedad de OpenClaw son la única excepción de reparación al inicio: cuando una instalación empaquetada detecta uno habilitado por configuración de plugin, configuración heredada de canal o su manifest incluido habilitado por defecto, el inicio instala las dependencias de runtime que falten de ese plugin antes de importarlo. Los plugins de terceros no deben depender de instalaciones al inicio; sigue usando el instalador explícito de plugins.

## Relacionado

- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Manifest del Plugin](/es/plugins/manifest) -- referencia completa del esquema del manifest
- [Creación de plugins](/es/plugins/building-plugins) -- guía paso a paso para empezar
