---
read_when:
    - Estás agregando un asistente de configuración a un Plugin
    - Debes entender setup-entry.ts frente a index.ts
    - Estás definiendo esquemas de configuración de plugins o metadatos openclaw de package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Instalación y configuración del Plugin
x-i18n:
    generated_at: "2026-05-02T05:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

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
  <Tab title="Plugin de proveedor / línea base de ClawHub">
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
  Metadatos del catálogo de canales para las superficies de configuración, selector, inicio rápido y estado.
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

| Campo                                  | Tipo       | Qué significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id canónico del canal.                                                        |
| `label`                                | `string`   | Etiqueta principal del canal.                                                 |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración cuando debe diferir de `label`.           |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completos. |
| `docsPath`                             | `string`   | Ruta de la documentación para enlaces de configuración y selección.           |
| `docsLabel`                            | `string`   | Reemplazo de etiqueta usado para enlaces de documentación cuando debe diferir del id del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                  |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                               |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canales.                   |
| `preferOver`                           | `string[]` | Ids de plugin/canal de menor prioridad a los que este canal debe superar.     |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de canales de la UI. |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostrar directamente la ruta de documentación en lugar de un enlace de documentación con etiqueta en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                    |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Habilita este canal en el flujo estándar de configuración de inicio rápido `allowFrom`. |
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

- `configured`: incluye el canal en superficies de listado de estilo configurado/estado
- `setup`: incluye el canal en selectores interactivos de configuración
- `docs`: marca el canal como visible públicamente en superficies de documentación/navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` son metadatos de paquete, no metadatos de manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.             |
| `localPath`                  | `string`             | Ruta de desarrollo local o instalación incluida.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                   |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Cadena de integridad npm dist esperada, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamiento de incorporación">
    La incorporación interactiva también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu plugin expone opciones de autenticación de proveedor o metadatos de configuración/catálogo de canal antes de que se cargue el runtime, la incorporación puede mostrar esa opción, solicitar instalación npm frente a local, instalar o habilitar el plugin y luego continuar el flujo seleccionado. Las opciones de incorporación de npm requieren metadatos de catálogo confiables con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son pins opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican. Mantén los metadatos de "qué mostrar" en `openclaw.plugin.json` y los metadatos de "cómo instalarlo" en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si `minHostVersion` está definido, tanto la instalación como la carga del registro de manifiestos no incluidos lo aplican. Los hosts más antiguos omiten plugins externos; las cadenas de versión no válidas se rechazan. Se asume que los plugins de origen incluidos comparten versión con el checkout del host.
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
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para recuperación limitada de plugins incluidos, de modo que reinstalar/configurar pueda reparar restos de actualización conocidos, como una ruta de plugin incluido faltante o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el gateway empieza a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registra todo lo que el gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP, métodos de gateway). Si la entrada completa posee capacidades de inicio requeridas, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC de gateway, mantenlos en un prefijo específico del plugin. Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven a `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo usa para validar la configuración sin ejecutar código del plugin.

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

Para paquetes de plugins, usa el comando de ClawHub específico del paquete:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
El alias de publicación heredado solo para skills es para Skills. Los paquetes de plugins siempre deben usar `clawhub package publish`.
</Note>

## Entrada de configuración

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de configuración, inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código de runtime pesado (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales del workspace incluidos que mantienen exportaciones seguras para configuración en módulos auxiliares pueden usar `defineBundledChannelSetupEntry(...)` desde `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado de runtime en tiempo de configuración pueda mantenerse ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw usa setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración/incorporación.
    - El canal está habilitado, pero no configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto Plugin del canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que el Gateway empiece a escuchar.
    - Cualquier método del Gateway necesario durante el arranque.

    Esos métodos de Gateway de arranque aun así deben evitar namespaces reservados de administración del núcleo como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones de runtime pesadas (criptografía, SDK).
    - Métodos del Gateway que solo se necesitan después del arranque.

  </Accordion>
</AccordionGroup>

### Importaciones estrechas de ayudantes de configuración

Para rutas activas exclusivas de configuración, prefiere las costuras estrechas de ayudantes de configuración en lugar del paraguas más amplio `plugin-sdk/setup` cuando solo necesitas parte de la superficie de configuración:

| Ruta de importación                | Úsala para                                                                                | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de runtime en tiempo de configuración que permanecen disponibles en `setupEntry` / arranque diferido del canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuentas conscientes del entorno                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ayudantes de configuración/instalación de CLI/archivo/documentación                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa la costura más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas compartida completa de configuración, incluidos ayudantes de parcheo de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parches de configuración siguen siendo seguros para la ruta activa al importar. Su búsqueda incluida de superficie de contrato de promoción de cuenta única es perezosa, por lo que importar `plugin-sdk/setup-runtime` no carga de forma ansiosa el descubrimiento de superficies de contrato incluidas antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal actualiza desde una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos con alcance de cuenta a `accounts.default`.

Los canales incluidos pueden estrechar o sobrescribir esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promovidos

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del Plugin se valida contra el JSON Schema en tu manifiesto. Los usuarios configuran plugins mediante:

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

### Creación de esquemas de configuración de canal

Usa `buildChannelConfigSchema` para convertir un esquema Zod en el wrapper `ChannelConfigSchema` usado por artefactos de configuración propiedad del Plugin:

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

Para plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin: refleja el JSON Schema generado en `openclaw.plugin.json#channelConfigs` para que el esquema de configuración, la configuración y las superficies de UI puedan inspeccionar `channels.<id>` sin cargar código de runtime.

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en el `ChannelPlugin`:

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
    Para prompts de lista permitida de MD que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de configuración de canal">
    Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` desde `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada Plugin.
  </Accordion>
  <Accordion title="Superficie opcional de configuración de canal">
    Para superficies de configuración opcionales que solo deben aparecer en ciertos contextos, usa `createOptionalChannelSetupSurface` desde `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` también expone los constructores de nivel más bajo `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de esa superficie opcional de instalación.

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras de configuración reales. Reutiliza un único mensaje de instalación requerida entre `validateInput`, `applyAccountConfig` y `finalize`, y agrega un enlace a la documentación cuando `docsPath` está definido.

  </Accordion>
  <Accordion title="Ayudantes de configuración respaldados por binarios">
    Para UI de configuración respaldadas por binarios, prefiere los ayudantes delegados compartidos en lugar de copiar el mismo pegamento de binario/estado en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, pistas, puntuaciones y detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar perezosamente a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/es/tools/clawhub) y luego instala:

<Tabs>
  <Tab title="Automático (ClawHub y luego npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw prueba ClawHub primero y recurre automáticamente a npm.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    Usa npm cuando un paquete aún no se haya movido a ClawHub, o cuando necesites una
    ruta directa de instalación con npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dentro del repositorio:** colócalos bajo el árbol del workspace de plugins incluidos y se descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalaciones provenientes de npm, `openclaw plugins install` instala el paquete bajo `~/.openclaw/npm` con los scripts de ciclo de vida deshabilitados. Mantén los árboles de dependencias de plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
El arranque del Gateway no instala dependencias de plugins. Los flujos de instalación de npm/git/ClawHub son responsables de la convergencia de dependencias; los plugins locales ya deben tener sus dependencias instaladas.
</Note>

Los metadatos del paquete incluido son explícitos, no se infieren del JavaScript compilado al iniciar el Gateway. Las dependencias en tiempo de ejecución pertenecen al paquete del plugin que las posee; el inicio del OpenClaw empaquetado nunca repara ni refleja dependencias de plugins.

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — guía paso a paso para empezar
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
