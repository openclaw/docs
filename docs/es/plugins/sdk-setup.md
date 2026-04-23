---
read_when:
    - Está agregando un asistente de configuración inicial a un Plugin
    - Necesita comprender `setup-entry.ts` frente a `index.ts`
    - Está definiendo esquemas de configuración del Plugin o metadatos `openclaw` en `package.json`
sidebarTitle: Setup and Config
summary: Asistentes de configuración, `setup-entry.ts`, esquemas de configuración y metadatos de `package.json`
title: Configuración inicial y configuración del Plugin
x-i18n:
    generated_at: "2026-04-23T05:18:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuración inicial y configuración del Plugin

Referencia para el empaquetado del plugin (metadatos de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de configuración inicial y esquemas de configuración.

<Tip>
  **¿Busca una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Su `package.json` necesita un campo `openclaw` que indique al sistema de plugins qué
proporciona su plugin:

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

**Plugin de proveedor / referencia base para publicación en ClawHub:**

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

Si publica el plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos canónicos para publicación están en
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Field        | Type       | Description                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                                                                |
| `setupEntry` | `string`   | Punto de entrada ligero solo para configuración inicial (opcional)                                                                                     |
| `channel`    | `object`   | Metadatos del catálogo de canales para superficies de configuración inicial, selector, inicio rápido y estado                                                 |
| `providers`  | `string[]` | ID de proveedores registrados por este plugin                                                                                      |
| `install`    | `object`   | Pistas de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento de inicio                                                                                                      |

### `openclaw.channel`

`openclaw.channel` son metadatos baratos del paquete para descubrimiento de canales y
superficies de configuración inicial antes de cargar el tiempo de ejecución.

| Field                                  | Type       | What it means                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                        |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración inicial cuando debe diferir de `label`.                        |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completos.       |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.                                      |
| `docsLabel`                            | `string`   | Etiqueta de anulación usada para enlaces de documentación cuando debe diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción breve para incorporación/catálogo.                                         |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                               |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canales.                                   |
| `preferOver`                           | `string[]` | ID de plugin/canal de menor prioridad a los que este canal debe superar.                |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de UI de canales.                      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección.                          |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de la documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales agregadas al texto de selección.                               |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato saliente.      |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación.   |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración rápida `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesión al resolver objetivos de anuncio para este canal.       |

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
      "blurb": "Integración de chat autohospedada basada en Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guía:",
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

- `configured`: incluye el canal en superficies de listado de tipo configurado/estado
- `setup`: incluye el canal en selectores interactivos de configuración/configuración inicial
- `docs`: marca el canal como orientado al público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiera
`exposure`.

### `openclaw.install`

`openclaw.install` son metadatos del paquete, no metadatos del manifiesto.

| Field                        | Type                 | What it means                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación canónica de npm para flujos de instalación/actualización.                                     |
| `localPath`                  | `string`             | Ruta de instalación local de desarrollo o incluida.                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                                |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z`.                        |
| `expectedIntegrity`          | `string`             | Cadena de integridad esperada de distribución npm, normalmente `sha512-...`, para instalaciones fijadas.   |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

La incorporación interactiva también usa `openclaw.install` para superficies
de instalación bajo demanda. Si su plugin expone opciones de autenticación de proveedor o metadatos
de configuración/catálogo de canales antes de que se cargue el tiempo de ejecución, la incorporación puede mostrar esa elección, solicitar instalación npm o local, instalar o habilitar el plugin y luego continuar con el flujo seleccionado. Las opciones de incorporación con npm requieren metadatos de catálogo de confianza con una versión exacta en `npmSpec` y `expectedIntegrity`; no se ofrecen nombres de paquete sin fijar ni dist-tags
para instalaciones automáticas durante la incorporación. Mantenga los metadatos de "qué mostrar" en
`openclaw.plugin.json` y los metadatos de "cómo instalarlo" en
`package.json`.

Si `minHostVersion` está definido, tanto la carga del registro de instalación como del manifiesto
lo hacen cumplir. Los hosts más antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.

Para instalaciones npm fijadas, mantenga la versión exacta en `npmSpec` y agregue la
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
solo para recuperación limitada de plugins incluidos, de modo que la reinstalación/configuración inicial pueda reparar restos conocidos de actualizaciones, como una ruta faltante de plugin incluido o una entrada obsoleta `channels.<id>`
para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación
sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio
previa a escucha, incluso para canales ya configurados. La entrada completa se carga después de que el
Gateway comienza a escuchar.

<Warning>
  Habilite la carga diferida solo cuando su `setupEntry` registre todo lo que el
  Gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP,
  métodos del Gateway). Si la entrada completa posee capacidades de inicio requeridas, mantenga
  el comportamiento predeterminado.
</Warning>

Si su entrada de configuración inicial/completa registra métodos RPC del Gateway, manténgalos en un
prefijo específico del plugin. Los espacios de nombres reservados de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre resuelven
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

Para plugins de canal, agregue `kind` y `channels`:

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

Consulte [Manifiesto de plugin](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugins, use el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para Skills es para Skills. Los paquetes de plugins
siempre deben usar `clawhub package publish`.

## Entrada de configuración inicial

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que
OpenClaw carga cuando solo necesita superficies de configuración inicial (incorporación, reparación de configuración,
inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado del tiempo de ejecución (bibliotecas criptográficas, registros de CLI,
servicios en segundo plano) durante los flujos de configuración inicial.

Los canales incluidos del espacio de trabajo que mantienen exportaciones seguras para configuración inicial en módulos auxiliares
pueden usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en lugar de
`defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación opcional
`runtime`, para que la conexión del tiempo de ejecución durante la configuración inicial siga siendo ligera y explícita.

**Cuándo usa OpenClaw `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de configuración inicial/incorporación
- El canal está habilitado pero sin configurar
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto del plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP requerida antes de que el Gateway comience a escuchar
- Cualquier método del Gateway necesario durante el inicio

Esos métodos del Gateway durante el inicio deben seguir evitando espacios de nombres reservados de administración del núcleo
como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Importaciones pesadas del tiempo de ejecución (crypto, SDK)
- Métodos del Gateway necesarios solo después del inicio

### Importaciones auxiliares estrechas para configuración inicial

Para rutas rápidas solo de configuración inicial, prefiera las vías auxiliares estrechas de configuración inicial frente a la vía más amplia
`plugin-sdk/setup` cuando solo necesite parte de la superficie de configuración inicial:

| Import path                        | Use it for                                                                                | Key exports                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes del tiempo de ejecución durante la configuración inicial que siguen disponibles en `setupEntry` / inicio diferido del canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuenta con reconocimiento del entorno                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ayudantes de configuración/instalación para CLI/archivos/documentación                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Use la vía más amplia `plugin-sdk/setup` cuando quiera el conjunto completo compartido
de herramientas de configuración inicial, incluidos los ayudantes de parcheo de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parcheo de configuración inicial siguen siendo seguros para importaciones en rutas críticas. Su búsqueda perezosa de la superficie de contrato incluida
para promoción de cuenta única significa que importar
`plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficies de contrato incluidas antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de cuenta única a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores
promocionados con alcance de cuenta a `accounts.default`.

Los canales incluidos pueden restringir o anular esa promoción mediante su superficie
de contrato de configuración inicial:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la
  cuenta promocionada
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promocionada; las claves compartidas de política/entrega permanecen en la raíz del
  canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promocionados

Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre,
o si `defaultAccount` apunta a una clave existente no canónica
como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada
`accounts.default`.

## Esquema de configuración

La configuración del plugin se valida con el esquema JSON Schema de su manifiesto. Los usuarios
configuran los plugins mediante:

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

Su plugin recibe esta configuración como `api.pluginConfig` durante el registro.

Para configuración específica de canal, use en su lugar la sección de configuración del canal:

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

### Creación de esquemas de configuración de canal

Use `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un
esquema Zod en el contenedor `ChannelConfigSchema` que valida OpenClaw:

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

## Asistentes de configuración inicial

Los plugins de canal pueden proporcionar asistentes interactivos de configuración inicial para `openclaw onboard`.
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
Consulte los paquetes de plugins incluidos (por ejemplo, el plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para solicitudes de lista de permitidos de mensajes directos que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiera los ayudantes compartidos de configuración inicial
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de configuración inicial del canal que solo varían en etiquetas, puntuaciones y líneas adicionales opcionales,
prefiera `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de construir manualmente el mismo objeto `status` en
cada plugin.

Para superficies opcionales de configuración inicial que solo deben aparecer en ciertos contextos, use
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
`createOptionalChannelSetupWizard(...)` cuando solo necesita una mitad de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutiliza un mensaje de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y agrega un enlace a la documentación cuando `docsPath` está
establecido.

Para interfaces de configuración inicial respaldadas por binarios, prefiera los ayudantes delegados compartidos en lugar de
copiar la misma lógica de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían en etiquetas,
  pistas, puntuaciones y detección de binarios
- `createCliPathTextInput(...)` para entradas de texto respaldadas por ruta
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma perezosa a
  un asistente completo más pesado
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publique en [ClawHub](/es/tools/clawhub) o npm, luego instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero ClawHub y recurre automáticamente a npm. También puede
forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una anulación equivalente `npm:`. Use la especificación normal del paquete npm cuando
quiera la ruta npm después del respaldo de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colóquelos bajo el árbol del espacio de trabajo de plugins incluidos y se
descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones desde npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantenga el árbol de dependencias del plugin
  en JS/TS puro y evite paquetes que requieran compilaciones en `postinstall`.
</Info>

Los plugins incluidos propiedad de OpenClaw son la única excepción de reparación en el inicio: cuando una
instalación empaquetada detecta uno habilitado mediante la configuración del plugin, configuración heredada del canal o
su manifiesto incluido habilitado por defecto, el inicio instala las dependencias de tiempo de ejecución faltantes
de ese plugin antes de importarlo. Los plugins de terceros no deben depender de
instalaciones en el inicio; siga usando el instalador explícito de plugins.

## Relacionado

- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Manifiesto de plugin](/es/plugins/manifest) -- referencia completa del esquema del manifiesto
- [Creación de plugins](/es/plugins/building-plugins) -- guía paso a paso para comenzar
