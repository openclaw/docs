---
read_when:
    - Estás añadiendo un asistente de configuración a un Plugin
    - Necesitas entender `setup-entry.ts` frente a `index.ts`
    - Estás definiendo esquemas de configuración de Plugins o metadatos `openclaw` de `package.json`
sidebarTitle: Setup and Config
summary: Asistentes de configuración, `setup-entry.ts`, esquemas de configuración y metadatos de `package.json`
title: Configuración y setup de Plugin
x-i18n:
    generated_at: "2026-04-24T05:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referencia para empaquetado de Plugins (metadatos de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
  **¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que indique al sistema de Plugins qué
proporciona tu Plugin:

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

**Plugin de proveedor / base de publicación en ClawHub:**

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

Si publicas el Plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos canónicos de publicación están en
`docs/snippets/plugin-publish/`.

### Campos de `openclaw`

| Campo        | Tipo       | Descripción                                                                                                              |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                                           |
| `setupEntry` | `string`   | Entrada ligera solo de configuración (opcional)                                                                          |
| `channel`    | `object`   | Metadatos del catálogo de canales para superficies de configuración, selector, inicio rápido y estado                   |
| `providers`  | `string[]` | ID de proveedores registrados por este Plugin                                                                            |
| `install`    | `object`   | Pistas de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento de arranque                                                                                |

### `openclaw.channel`

`openclaw.channel` es metadato barato de paquete para descubrimiento de canales y superficies de configuración
antes de que se cargue el tiempo de ejecución.

| Campo                                 | Tipo       | Qué significa                                                                |
| ------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                  | `string`   | ID canónico del canal.                                                       |
| `label`                               | `string`   | Etiqueta principal del canal.                                                |
| `selectionLabel`                      | `string`   | Etiqueta de selector/configuración cuando deba diferir de `label`.           |
| `detailLabel`                         | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más ricos. |
| `docsPath`                            | `string`   | Ruta de documentación para enlaces de configuración y selección.             |
| `docsLabel`                           | `string`   | Sobrescribe la etiqueta usada para enlaces de documentación cuando deba diferir del id del canal. |
| `blurb`                               | `string`   | Descripción corta de incorporación/catálogo.                                 |
| `order`                               | `number`   | Orden de clasificación en catálogos de canales.                              |
| `aliases`                             | `string[]` | Alias de búsqueda adicionales para selección de canales.                     |
| `preferOver`                          | `string[]` | ID de Plugin/canal de menor prioridad sobre los que este canal debe prevalecer. |
| `systemImage`                         | `string`   | Nombre opcional de icono/system-image para catálogos UI de canales.          |
| `selectionDocsPrefix`                 | `string`   | Texto prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`              | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                     | `string[]` | Cadenas cortas adicionales agregadas al texto de selección.                  |
| `markdownCapable`                     | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato saliente. |
| `exposure`                            | `object`   | Controles de visibilidad del canal para superficies de configuración, listas configuradas y documentación. |
| `quickstartAllowFrom`                 | `boolean`  | Incluye este canal en el flujo estándar de configuración rápida `allowFrom`. |
| `forceAccountBinding`                 | `boolean`  | Requiere binding explícito de cuenta incluso cuando solo exista una cuenta.  |
| `preferSessionLookupForAnnounceTarget`| `boolean`  | Prefiere la búsqueda de sesión al resolver destinos de anuncio para este canal. |

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
- `setup`: incluir el canal en selectores interactivos de configuración/configure
- `docs`: marcar el canal como orientado al público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere
`exposure`.

### `openclaw.install`

`openclaw.install` son metadatos de paquete, no metadatos de manifiesto.

| Campo                       | Tipo                 | Qué significa                                                                     |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                   | `string`             | Especificación npm canónica para flujos de instalación/actualización.             |
| `localPath`                 | `string`             | Ruta local de desarrollo o instalación incluida.                                  |
| `defaultChoice`             | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                   |
| `minHostVersion`            | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z`.                   |
| `expectedIntegrity`         | `string`             | Cadena esperada de integridad npm dist, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery`| `boolean`            | Permite que los flujos de reinstalación de Plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

La incorporación interactiva también usa `openclaw.install` para superficies
de instalación bajo demanda. Si tu Plugin expone opciones de autenticación de proveedor o metadatos
de configuración/catálogo de canal antes de que se cargue el tiempo de ejecución, la incorporación puede mostrar esa opción, solicitar npm frente a instalación local, instalar o habilitar el Plugin y luego continuar con el flujo seleccionado. Las opciones de incorporación npm requieren metadatos de catálogo fiables con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son fijaciones opcionales. Si
`expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican. Mantén los metadatos de “qué mostrar” en `openclaw.plugin.json` y los metadatos de “cómo instalarlo” en `package.json`.

Si `minHostVersion` está establecido, tanto la instalación como la carga del registro de manifiestos lo aplican. Los hosts antiguos omiten el Plugin; las cadenas de versión no válidas se rechazan.

Para instalaciones npm fijadas, conserva la versión exacta en `npmSpec` y añade la
integridad esperada del artefacto:

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

`allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es
solo para recuperación limitada de Plugins incluidos, de modo que la reinstalación/configuración pueda reparar restos conocidos de actualizaciones, como una ruta faltante de Plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo Plugin. Si la configuración está rota por motivos no relacionados, la instalación sigue fallando de forma segura y le dice al operador que ejecute `openclaw doctor --fix`.

### Carga completa diferida

Los Plugins de canal pueden optar por carga diferida con:

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase
de arranque previa al listen, incluso para canales ya configurados. La entrada completa se carga después de que el
gateway empiece a escuchar.

<Warning>
  Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el
  gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP,
  métodos de gateway). Si la entrada completa gestiona capacidades necesarias de arranque, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada setup/full registra métodos RPC de gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres administrativos principales reservados (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del core y siempre se resuelven
a `operator.admin`.

## Manifiesto del Plugin

Todo Plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete.
OpenClaw lo usa para validar la configuración sin ejecutar el código del Plugin.

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

Para Plugins de canal, añade `kind` y `channels`:

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

Incluso los Plugins sin configuración deben incluir un esquema. Un esquema vacío es válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulta [Manifiesto de Plugin](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de Plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo de Skills es para Skills. Los paquetes de Plugins deben
usar siempre `clawhub package publish`.

## Entrada de configuración

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que
OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de configuración,
inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de tiempo de ejecución (bibliotecas criptográficas, registros CLI,
servicios en segundo plano) durante los flujos de configuración.

Los canales incluidos del espacio de trabajo que mantienen exportaciones seguras para configuración en módulos laterales
pueden usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en lugar de
`defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación opcional
`runtime` para que la conexión de tiempo de ejecución en tiempo de configuración siga siendo ligera y explícita.

**Cuándo OpenClaw usa `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de configuración/incorporación
- El canal está habilitado pero sin configurar
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto Plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP requerida antes de que el gateway escuche
- Cualquier método de gateway necesario durante el arranque

Esos métodos de gateway de arranque deben seguir evitando espacios de nombres administrativos principales reservados
como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros CLI
- Servicios en segundo plano
- Importaciones pesadas de tiempo de ejecución (crypto, SDK)
- Métodos de gateway necesarios solo después del arranque

### Importaciones estrechas de ayudantes de configuración

Para rutas de configuración exclusivas en caliente, prefiere las interfaces estrechas de ayudantes de configuración frente a la superficie más amplia
de `plugin-sdk/setup` cuando solo necesites una parte de la superficie de configuración:

| Ruta de importación                 | Úsala para                                                                              | Exportaciones clave                                                                                                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de tiempo de ejecución en tiempo de configuración que sigan disponibles en `setupEntry` / arranque diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuenta sensibles al entorno                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | ayudantes CLI/archivo/documentación de configuración/instalación                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Usa la interfaz más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas completa de configuración compartida,
incluidos ayudantes de parcheo de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de configuración siguen siendo seguros para la ruta caliente al importarlos. Su búsqueda de superficie contractual
de promoción de cuenta única incluida es diferida, por lo que importar
`plugin-sdk/setup-runtime` no carga ansiosamente el descubrimiento de superficie contractual incluida
antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de cuenta única a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos
de alcance de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o sobrescribir esa promoción mediante su superficie contractual
de configuración:

- `singleAccountKeysToMove`: claves de nivel superior adicionales que deben moverse a la
  cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promovidos

Matrix es el ejemplo actual incluido. Si ya existe exactamente una cuenta Matrix con nombre,
o si `defaultAccount` apunta a una clave no canónica existente como `Ops`,
la promoción conserva esa cuenta en lugar de crear una nueva entrada
`accounts.default`.

## Esquema de configuración

La configuración del Plugin se valida con el JSON Schema de tu manifiesto. Los usuarios
configuran Plugins mediante:

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

Tu Plugin recibe esta configuración como `api.pluginConfig` durante el registro.

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

### Construir esquemas de configuración de canal

Usa `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un
esquema Zod al contenedor `ChannelConfigSchema` que valida OpenClaw:

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

Los Plugins de canal pueden proporcionar asistentes interactivos de configuración para `openclaw onboard`.
El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

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
Consulta los paquetes de Plugins incluidos (por ejemplo el Plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para prompts de lista de permitidos de mensajes directos que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes compartidos de configuración
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de recrear a mano el mismo objeto `status` en
cada Plugin.

Para superficies opcionales de configuración que solo deban aparecer en ciertos contextos, usa
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` también expone los constructores de nivel inferior
`createOptionalChannelSetupAdapter(...)` y
`createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla de forma segura en escrituras reales de configuración. Reutiliza un mismo mensaje de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y agrega un enlace de documentación cuando `docsPath` está
establecido.

Para interfaces de configuración respaldadas por binarios, prefiere los ayudantes compartidos delegados en lugar de
copiar el mismo pegamento de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas,
  sugerencias, puntuaciones y detección binaria
- `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a
  un asistente completo más pesado
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publícalos en [ClawHub](/es/tools/clawhub) o npm, luego instálalos:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prueba primero ClawHub y recurre automáticamente a npm. También puedes
forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una sobrescritura `npm:` equivalente. Usa la especificación normal del paquete npm cuando
quieras la ruta npm tras el respaldo de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colócalos bajo el árbol de espacio de trabajo de Plugins incluidos y se
descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones obtenidas desde npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantén los árboles de
  dependencias del Plugin en JS/TS puro y evita paquetes que requieran compilaciones en `postinstall`.
</Info>

Los Plugins incluidos propiedad de OpenClaw son la única excepción de reparación al arranque: cuando una
instalación empaquetada detecta uno habilitado por configuración del Plugin, configuración heredada del canal o
su manifiesto incluido habilitado por defecto, el arranque instala las dependencias
de tiempo de ejecución faltantes de ese Plugin antes de importarlo. Los Plugins de terceros no deben confiar
en instalaciones durante el arranque; sigue usando el instalador explícito de Plugins.

## Relacionado

- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Manifiesto de Plugin](/es/plugins/manifest) -- referencia completa del esquema de manifiesto
- [Crear Plugins](/es/plugins/building-plugins) -- guía paso a paso para comenzar
