---
read_when:
    - Estás agregando un asistente de configuración a un Plugin
    - Debes entender setup-entry.ts frente a index.ts
    - Estás definiendo esquemas de configuración de Plugin o metadatos openclaw de package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Instalación y configuración del Plugin
x-i18n:
    generated_at: "2026-05-11T20:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
**¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto: [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que indique al sistema de plugins qué proporciona tu plugin:

<Tabs>
  <Tab title="Plugin de canal">
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
  </Tab>
  <Tab title="Plugin de proveedor / base de ClawHub">
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

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera solo para configuración (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para superficies de configuración, selector, inicio rápido y estado.
</ParamField>
<ParamField path="providers" type="string[]">
  Ids de proveedor registrados por este plugin.
</ParamField>
<ParamField path="install" type="object">
  Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Indicadores de comportamiento de inicio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` son metadatos de paquete ligeros para el descubrimiento de canales y las superficies de configuración antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Id canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración cuando debe diferir de `label`.            |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completos. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.               |
| `docsLabel`                            | `string`   | Etiqueta de reemplazo usada para enlaces de documentación cuando debe diferir del id del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                   |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canal.                      |
| `preferOver`                           | `string[]` | Ids de plugin/canal de menor prioridad sobre los que este canal debe tener precedencia. |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de IU de canales.   |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace de documentación etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato de salida. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración de inicio rápido `allowFrom`. |
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

- `configured`: incluir el canal en superficies de listado configuradas/de estilo estado
- `setup`: incluir el canal en selectores interactivos de configuración
- `docs`: marcar el canal como público en superficies de documentación/navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` son metadatos de paquete, no metadatos de manifiesto.

| Campo                        | Tipo                                | Qué significa                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para flujos de instalación/actualización e instalación bajo demanda durante la incorporación. |
| `npmSpec`                    | `string`                            | Especificación canónica de npm para flujos alternativos de instalación/actualización. |
| `localPath`                  | `string`                            | Ruta de desarrollo local o instalación incluida.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias fuentes disponibles.            |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw con el formato `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Cadena de integridad esperada de la distribución npm, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamiento de incorporación">
    La incorporación interactiva también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu plugin expone opciones de autenticación de proveedor o metadatos de configuración/catálogo de canales antes de que se cargue el runtime, la incorporación puede mostrar esa opción, pedir una instalación de ClawHub, npm o local, instalar o habilitar el plugin y luego continuar con el flujo seleccionado. Las opciones de incorporación de ClawHub usan `clawhubSpec` y se prefieren cuando están presentes; las opciones npm requieren metadatos de catálogo confiables con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son fijaciones npm opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican para npm. Mantén los metadatos de "qué mostrar" en `openclaw.plugin.json` y los metadatos de "cómo instalarlo" en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si `minHostVersion` está definido, tanto la instalación como la carga del registro de manifiestos no incluidos lo aplican. Los hosts antiguos omiten plugins externos; las cadenas de versión inválidas se rechazan. Se asume que los plugins de código fuente incluidos tienen la misma versión que el checkout del host.
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
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para la recuperación limitada de plugins incluidos, de modo que la reinstalación/configuración pueda reparar restos conocidos de actualización, como una ruta de plugin incluido faltante o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el Gateway comience a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el Gateway necesita antes de comenzar a escuchar (registro de canal, rutas HTTP, métodos del Gateway). Si la entrada completa posee capacidades de inicio requeridas, conserva el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC del Gateway, mantenlos en un prefijo específico del plugin. Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven a `operator.admin`.

## Manifiesto del plugin

Cada plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo usa para validar la configuración sin ejecutar código del plugin.

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

Consulta [Manifiesto del plugin](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugin, usa el comando de ClawHub específico del paquete:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
El alias heredado de publicación solo para Skills es para Skills. Los paquetes de Plugin siempre deben usar `clawhub package publish`.
</Note>

## Entrada de setup

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de setup (incorporación, reparación de configuración, inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código de runtime pesado (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de setup.

Los canales incluidos en el workspace que mantienen exportaciones seguras para setup en módulos complementarios pueden usar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado de runtime en tiempo de setup siga siendo ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw usa setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de setup/incorporación.
    - El canal está habilitado, pero sin configurar.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto de Plugin de canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que el Gateway empiece a escuchar.
    - Cualquier método de Gateway necesario durante el arranque.

    Esos métodos de Gateway de arranque aún deben evitar espacios de nombres de administración central reservados como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones de runtime pesadas (criptografía, SDK).
    - Métodos de Gateway necesarios solo después del arranque.

  </Accordion>
</AccordionGroup>

### Importaciones acotadas de helpers de setup

Para rutas activas solo de setup, prefiere las interfaces acotadas de helpers de setup en lugar del paraguas más amplio `plugin-sdk/setup` cuando solo necesites parte de la superficie de setup:

| Ruta de importación                | Úsala para                                                                                | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime en tiempo de setup que siguen disponibles en `setupEntry` / arranque diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime`                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers de CLI/archivo/docs para setup/instalación                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa la interfaz más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas compartida completa de setup, incluidos helpers de parcheo de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de setup siguen siendo seguros de importar en rutas activas. Su búsqueda incluida de superficie de contrato de promoción de cuenta única es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficies de contrato incluidas antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos con ámbito de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o sobrescribir esa promoción mediante su superficie de contrato de setup:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promovidos

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del Plugin se valida contra el JSON Schema de tu manifiesto. Los usuarios configuran plugins mediante:

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

Para configuración específica del canal, usa en su lugar la sección de configuración de canal:

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

Usa `buildChannelConfigSchema` para convertir un esquema de Zod en el contenedor `ChannelConfigSchema` usado por artefactos de configuración propiedad del Plugin:

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

Si ya escribes el contrato como JSON Schema o TypeBox, usa el helper directo para que OpenClaw pueda omitir la conversión de Zod a JSON Schema en rutas de metadatos:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Para plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin: replica el JSON Schema generado en `openclaw.plugin.json#channelConfigs` para que las superficies de esquema de configuración, setup y UI puedan inspeccionar `channels.<id>` sin cargar código de runtime.

## Asistentes de setup

Los plugins de canal pueden proporcionar asistentes de setup interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en el `ChannelPlugin`:

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

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulta los paquetes de plugins incluidos (por ejemplo, el Plugin de Discord `src/channel.setup.ts`) para ver ejemplos completos.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartidos">
    Para prompts de lista de permitidos de DM que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los helpers de setup compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de setup de canal">
    Para bloques de estado de setup de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de escribir manualmente el mismo objeto `status` en cada Plugin.
  </Accordion>
  <Accordion title="Superficie opcional de setup de canal">
    Para superficies de setup opcionales que solo deben aparecer en determinados contextos, usa `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` también expone los constructores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de esa superficie de instalación opcional.

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutilizan un único mensaje de instalación requerida en `validateInput`, `applyAccountConfig` y `finalize`, y añaden un enlace a docs cuando `docsPath` está definido.

  </Accordion>
  <Accordion title="Helpers de setup respaldados por binarios">
    Para UI de setup respaldadas por binarios, prefiere los helpers delegados compartidos en lugar de copiar el mismo pegamento de binario/estado en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, sugerencias, puntuaciones y detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por ruta
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/es/clawhub), luego instala:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete sin prefijo se instalan desde npm durante el cambio de lanzamiento.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    Usa npm cuando un paquete aún no se haya movido a ClawHub, o cuando necesites una
    ruta directa de instalación de npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de plugins incluidos y se descubren automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalaciones desde npm, `openclaw plugins install` instala el paquete bajo `~/.openclaw/npm` con los scripts de ciclo de vida deshabilitados. Mantén los árboles de dependencias de los plugins en JS/TS puro y evita paquetes que requieran compilaciones con `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala dependencias de plugins. Los flujos de instalación de npm/git/ClawHub son responsables de la convergencia de dependencias; los plugins locales ya deben tener sus dependencias instaladas.
</Note>

Los metadatos de los paquetes incluidos son explícitos, no se infieren del JavaScript compilado al iniciar el Gateway. Las dependencias de runtime pertenecen al paquete del plugin que las posee; el inicio de OpenClaw empaquetado nunca repara ni refleja dependencias de plugins.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — guía paso a paso para empezar
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
