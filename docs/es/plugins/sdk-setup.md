---
read_when:
    - Estás agregando un asistente de setup a un Plugin
    - Necesitas entender `setup-entry.ts` frente a `index.ts`
    - Estás definiendo esquemas de configuración de Plugin o metadatos `openclaw` en `package.json`
sidebarTitle: Setup and config
summary: Asistentes de configuración, `setup-entry.ts`, esquemas de configuración y metadatos de `package.json`
title: Configuración y setup de Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referencia para empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de setup y esquemas de configuración.

<Tip>
**¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto: [Plugins de channel](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y [Plugins de provider](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que le diga al sistema de plugins qué proporciona tu plugin:

<Tabs>
  <Tab title="Plugin de channel">
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
          "blurb": "Descripción breve del canal."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin de provider / línea base de ClawHub">
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
  </Tab>
</Tabs>

<Note>
Si publicas el plugin externamente en ClawHub, esos campos `compat` y `build` son obligatorios. Los fragmentos canónicos de publicación están en `docs/snippets/plugin-publish/`.
</Note>

### Campos `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera solo para setup (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de channel para superficies de setup, selector, inicio rápido y estado.
</ParamField>
<ParamField path="providers" type="string[]">
  Ids de provider registrados por este plugin.
</ParamField>
<ParamField path="install" type="object">
  Pistas de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags de comportamiento de inicio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` es metadato barato del paquete para descubrimiento de channel y superficies de setup antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Id canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta de selector/setup cuando debe diferir de `label`.                     |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más ricos. |
| `docsPath`                             | `string`   | Ruta de docs para enlaces de setup y selección.                                |
| `docsLabel`                            | `string`   | Sobrescritura de etiqueta usada para enlaces de docs cuando deba diferir del id del canal. |
| `blurb`                                | `string`   | Descripción breve de onboarding/catálogo.                                      |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                |
| `aliases`                              | `string[]` | Alias adicionales de búsqueda para selección de canal.                         |
| `preferOver`                           | `string[]` | Ids de plugin/canal de menor prioridad a los que este canal debe superar.      |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos de IU de canales.         |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de enlaces de docs en superficies de selección.         |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de docs directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para superficies de setup, listas de configurados y docs. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de setup `allowFrom` de inicio rápido. |
| `forceAccountBinding`                  | `boolean`  | Requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere búsqueda de sesión al resolver destinos de anuncios para este canal.  |

Ejemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (autohospedado)",
      "detailLabel": "Bot de My Channel",
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

- `configured`: incluir el canal en superficies de listado tipo configurado/estado
- `setup`: incluir el canal en selectores interactivos de setup/configuración
- `docs`: marcar el canal como orientado al público en superficies de docs/navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` es metadato del paquete, no metadato del manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.            |
| `localPath`                  | `string`             | Ruta de instalación local de desarrollo o incluida.                              |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                  |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con forma `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Cadena de integridad esperada de npm dist, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins incluidos recuperen fallos concretos de configuración obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamiento de onboarding">
    El onboarding interactivo también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu plugin expone opciones de autenticación de provider o metadatos de setup/catálogo de channel antes de que se cargue el runtime, el onboarding puede mostrar esa elección, solicitar npm frente a instalación local, instalar o habilitar el plugin y luego continuar el flujo seleccionado. Las elecciones de onboarding con npm requieren metadatos confiables de catálogo con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son fijaciones opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización la aplican. Mantén los metadatos de “qué mostrar” en `openclaw.plugin.json` y los metadatos de “cómo instalarlo” en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si `minHostVersion` está configurado, tanto la instalación como la carga del registro de manifiestos lo aplican. Los hosts antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.
  </Accordion>
  <Accordion title="Instalaciones npm fijadas">
    Para instalaciones npm fijadas, mantén la versión exacta en `npmSpec` y añade la integridad esperada del artefacto:

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

  </Accordion>
  <Accordion title="Alcance de allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para recuperación restringida de plugins incluidos, de modo que la reinstalación/setup pueda reparar restos conocidos de actualizaciones, como una ruta faltante de plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo plugin. Si la configuración está rota por razones no relacionadas, la instalación sigue fallando de forma cerrada y le indica al operador que ejecute `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Carga completa diferida

Los plugins de channel pueden optar por carga diferida con:

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a escuchar, incluso para canales ya configurados. La entrada completa se carga después de que el gateway empieza a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el gateway necesita antes de empezar a escuchar (registro de channel, rutas HTTP, métodos del gateway). Si la entrada completa es dueña de capacidades de inicio requeridas, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de setup/completa registra métodos RPC del gateway, mantenlos en un prefijo específico del plugin. Los espacios de nombres reservados de administración del core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del core y siempre se resuelven a `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo usa para validar configuración sin ejecutar código del plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Agrega capacidades de My Plugin a OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secreto de verificación de Webhook"
      }
    }
  }
}
```

Para plugins de channel, añade `kind` y `channels`:

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

Consulta [Manifiesto del plugin](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
El alias heredado de publicación solo para skills es para Skills. Los paquetes de plugins siempre deben usar `clawhub package publish`.
</Note>

## Entrada de setup

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de setup (onboarding, reparación de configuración, inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de runtime (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de setup.

Los canales de espacio de trabajo incluidos que mantienen exportaciones seguras para setup en módulos sidecar pueden usar `defineBundledChannelSetupEntry(...)` desde `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado de runtime en tiempo de setup siga siendo ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw usa setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado pero necesita superficies de setup/onboarding.
    - El canal está habilitado pero sin configurar.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).
  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto plugin del channel (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que el gateway empiece a escuchar.
    - Cualquier método del gateway necesario durante el inicio.

    Esos métodos del gateway de inicio deben seguir evitando espacios de nombres administrativos reservados del core como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones pesadas de runtime (crypto, SDK).
    - Métodos del gateway necesarios solo después del inicio.
  </Accordion>
</AccordionGroup>

### Importaciones reducidas de helpers de setup

Para rutas activas solo de setup, prefiere las uniones estrechas de helpers de setup sobre el paraguas más amplio `plugin-sdk/setup` cuando solo necesites parte de la superficie de setup:

| Ruta de importación                 | Úsala para                                                                               | Exportaciones clave                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helpers de runtime en tiempo de setup que siguen disponibles en `setupEntry` / inicio diferido de channel | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptadores de setup de cuenta con reconocimiento del entorno                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`            | helpers de CLI/instalación/archivo/docs para setup                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Usa la unión más amplia `plugin-sdk/setup` cuando quieras toda la caja de herramientas compartida de setup, incluidos helpers de parche de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de setup siguen siendo seguros para importar en rutas activas. Su búsqueda de superficie de contrato incluida para promoción de cuenta única es perezosa, así que importar `plugin-sdk/setup-runtime` no carga ansiosamente el descubrimiento de superficie de contrato incluida antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del channel

Cuando un channel se actualiza desde una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos con alcance de cuenta a `accounts.default`.

Los canales incluidos pueden restringir o sobrescribir esa promoción a través de su superficie de contrato de setup:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega se mantienen en la raíz del channel
- `resolveSingleAccountPromotionTarget(...)`: elegir qué cuenta existente recibe los valores promovidos

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción preserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del plugin se valida contra el JSON Schema de tu manifiesto. Los usuarios configuran plugins mediante:

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

Para configuración específica del channel, usa en su lugar la sección de configuración del channel:

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

### Construir esquemas de configuración de channel

Usa `buildChannelConfigSchema` para convertir un esquema Zod en el contenedor `ChannelConfigSchema` usado por artefactos de configuración propiedad del plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Para plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del plugin: refleja el JSON Schema generado en `openclaw.plugin.json#channelConfigs` para que la configuración, el setup y las superficies de UI puedan inspeccionar `channels.<id>` sin cargar código de runtime.

## Asistentes de setup

Los plugins de channel pueden proporcionar asistentes de setup interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Conectado",
    unconfiguredLabel: "Sin configurar",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token del bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "¿Usar MY_CHANNEL_BOT_TOKEN del entorno?",
      keepPrompt: "¿Mantener el token actual?",
      inputPrompt: "Introduce tu token de bot:",
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

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulta los paquetes de plugins incluidos (por ejemplo el plugin de Discord `src/channel.setup.ts`) para ver ejemplos completos.

<AccordionGroup>
  <Accordion title="Prompts compartidos de allowFrom">
    Para prompts de lista de permitidos DM que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los helpers compartidos de setup de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de setup de channel">
    Para bloques de estado de setup de channel que solo varían por etiquetas, puntuaciones y líneas extra opcionales, prefiere `createStandardChannelSetupStatus(...)` desde `openclaw/plugin-sdk/setup` en lugar de escribir a mano el mismo objeto `status` en cada plugin.
  </Accordion>
  <Accordion title="Superficie opcional de setup de channel">
    Para superficies opcionales de setup que solo deben aparecer en ciertos contextos, usa `createOptionalChannelSetupSurface` desde `openclaw/plugin-sdk/channel-setup`:

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

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutilizan un único mensaje de instalación requerida en `validateInput`, `applyAccountConfig` y `finalize`, y agregan un enlace a docs cuando `docsPath` está configurado.

  </Accordion>
  <Accordion title="Helpers de setup respaldados por binarios">
    Para IU de setup respaldadas por binarios, prefiere los helpers compartidos delegados en lugar de copiar el mismo pegamento de binario/estado en cada channel:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, pistas, puntuaciones y detección de binario
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por ruta
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar perezosamente a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publícalos en [ClawHub](/es/tools/clawhub) o npm, y luego instala:

<Tabs>
  <Tab title="Auto (ClawHub y luego npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw intenta primero ClawHub y recurre a npm automáticamente.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    No hay una sobrescritura `npm:` equivalente. Usa la especificación normal del paquete npm cuando quieras la ruta npm después del respaldo de ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dentro del repo:** colócalos bajo el árbol de espacio de trabajo de plugins incluidos y se descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalaciones obtenidas desde npm, `openclaw plugins install` ejecuta `npm install --ignore-scripts` local al proyecto (sin scripts de ciclo de vida), ignorando la configuración heredada de instalación global de npm. Mantén los árboles de dependencias de plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
Los plugins incluidos propiedad de OpenClaw son la única excepción de reparación en el inicio: cuando una instalación empaquetada ve uno habilitado por configuración de plugin, configuración heredada de channel o su manifiesto incluido con habilitación predeterminada, el inicio instala las dependencias de runtime faltantes de ese plugin antes de importarlo. Los plugins de terceros no deben depender de instalaciones en el inicio; sigue usando el instalador explícito de plugins.
</Note>

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — guía paso a paso para empezar
- [Manifiesto del plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
