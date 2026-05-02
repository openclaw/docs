---
read_when:
    - Estás agregando un asistente de configuración a un Plugin
    - Debes entender setup-entry.ts en comparación con index.ts
    - Está definiendo esquemas de configuración de Plugin o metadatos openclaw de package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Instalación y configuración del Plugin
x-i18n:
    generated_at: "2026-05-02T21:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para empaquetado de Plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
**¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto: [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que indique al sistema de Plugins qué proporciona tu Plugin:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
Si publicas el Plugin externamente en ClawHub, esos campos `compat` y `build` son obligatorios. Los fragmentos canónicos de publicación están en `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera solo para configuración (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para configuración, selector, inicio rápido y superficies de estado.
</ParamField>
<ParamField path="providers" type="string[]">
  IDs de proveedores registrados por este Plugin.
</ParamField>
<ParamField path="install" type="object">
  Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Marcas de comportamiento de arranque.
</ParamField>

### `openclaw.channel`

`openclaw.channel` son metadatos de paquete ligeros para el descubrimiento de canales y las superficies de configuración antes de que se cargue el tiempo de ejecución.

| Campo                                  | Tipo       | Qué significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canónico del canal.                                                        |
| `label`                                | `string`   | Etiqueta principal del canal.                                                 |
| `selectionLabel`                       | `string`   | Etiqueta de selector/configuración cuando debe diferir de `label`.            |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completas. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.              |
| `docsLabel`                            | `string`   | Etiqueta alternativa usada para enlaces de documentación cuando debe diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                  |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                               |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canal.                     |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de menor prioridad que este canal debe superar.           |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de UI de canales.  |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace de documentación etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales anexadas al texto de selección.                    |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración de inicio rápido `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Exige vinculación explícita de cuenta incluso cuando solo existe una cuenta.  |
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
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para instalación/actualización y flujos de instalación bajo demanda durante la incorporación. |
| `npmSpec`                    | `string`                            | Especificación canónica de npm para flujos alternativos de instalación/actualización. |
| `localPath`                  | `string`                            | Ruta de desarrollo local o instalación incluida.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias fuentes disponibles.            |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw con el formato `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Cadena de integridad esperada de la distribución npm, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de Plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    La incorporación interactiva también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu Plugin expone opciones de autenticación de proveedores o metadatos de configuración/catálogo de canales antes de que se cargue el tiempo de ejecución, la incorporación puede mostrar esa opción, pedir instalación desde ClawHub, npm o local, instalar o habilitar el Plugin y luego continuar el flujo seleccionado. Las opciones de incorporación de ClawHub usan `clawhubSpec` y se prefieren cuando están presentes; las opciones npm requieren metadatos de catálogo de confianza con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son fijaciones npm opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican para npm. Mantén los metadatos de "qué mostrar" en `openclaw.plugin.json` y los metadatos de "cómo instalarlo" en `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Si `minHostVersion` está definido, tanto la instalación como la carga del registro de manifiestos no incluidos lo aplican. Los hosts antiguos omiten Plugins externos; las cadenas de versión no válidas se rechazan. Se asume que los Plugins de origen incluidos están coversionados con el checkout del host.
  </Accordion>
  <Accordion title="Pinned npm installs">
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

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para recuperación limitada de Plugins incluidos, de modo que la reinstalación/configuración pueda reparar restos conocidos de actualizaciones, como una ruta de Plugin incluido faltante o una entrada `channels.<id>` obsoleta para ese mismo Plugin. Si la configuración está rota por motivos no relacionados, la instalación sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Carga completa diferida

Los Plugins de canal pueden optar por la carga diferida con:

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de arranque previa a escuchar, incluso para canales ya configurados. La entrada completa se carga después de que el Gateway empieza a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registre todo lo que el Gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP, métodos del Gateway). Si la entrada completa posee capacidades de arranque requeridas, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC del Gateway, mantenlos en un prefijo específico del Plugin. Los espacios de nombres de administración central reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven a `operator.admin`.

## Manifiesto de Plugin

Todo Plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo usa para validar la configuración sin ejecutar código del Plugin.

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

Consulta [Manifiesto de Plugin](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de Plugins, usa el comando de ClawHub específico del paquete:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
El alias de publicación heredado solo para Skills es para Skills. Los paquetes de Plugin siempre deben usar `clawhub package publish`.
</Note>

## Entrada de configuración

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de configuración, inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código de ejecución pesado (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales del espacio de trabajo incluidos que mantienen exportaciones seguras para la configuración en módulos complementarios pueden usar `defineBundledChannelSetupEntry(...)` desde `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación opcional `runtime` para que el cableado de ejecución en tiempo de configuración pueda mantenerse ligero y explícito.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - El canal está deshabilitado, pero necesita superficies de configuración/incorporación.
    - El canal está habilitado, pero no configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - El objeto de Plugin del canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que el Gateway empiece a escuchar.
    - Cualquier método de Gateway necesario durante el inicio.

    Esos métodos de Gateway de inicio aun así deben evitar los espacios de nombres reservados de administración del núcleo, como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones de ejecución pesadas (criptografía, SDK).
    - Métodos de Gateway que solo se necesitan después del inicio.

  </Accordion>
</AccordionGroup>

### Importaciones acotadas de auxiliares de configuración

Para rutas activas solo de configuración, prefiere las costuras acotadas de auxiliares de configuración frente al paraguas más amplio `plugin-sdk/setup` cuando solo necesitas parte de la superficie de configuración:

| Ruta de importación                | Úsala para                                                                               | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | auxiliares de ejecución en tiempo de configuración que siguen disponibles en `setupEntry` / inicio diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuentas conscientes del entorno                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | auxiliares de configuración/instalación de CLI/archivo/documentación                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa la costura más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas completa de configuración compartida, incluidos auxiliares de parches de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de configuración siguen siendo seguros de importar en rutas activas. Su búsqueda incluida de superficie de contrato de promoción de cuenta única es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga con anticipación el descubrimiento incluido de superficie de contrato antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza de una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promocionados con alcance de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o reemplazar esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promocionada
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promocionada; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promocionados

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración de Plugin se valida frente al JSON Schema de tu manifiesto. Los usuarios configuran plugins mediante:

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

Si ya defines el contrato como JSON Schema o TypeBox, usa el auxiliar directo para que OpenClaw pueda omitir la conversión de Zod a JSON Schema en rutas de metadatos:

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

Para plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin: replica el JSON Schema generado en `openclaw.plugin.json#channelConfigs` para que el esquema de configuración, la configuración y las superficies de UI puedan inspeccionar `channels.<id>` sin cargar código de ejecución.

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

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

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulta los paquetes de Plugin incluidos (por ejemplo, el Plugin de Discord `src/channel.setup.ts`) para ver ejemplos completos.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Para avisos de lista de permitidos de DM que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los auxiliares de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    Para superficies de configuración opcionales que solo deben aparecer en determinados contextos, usa `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutiliza un mensaje de instalación requerida en `validateInput`, `applyAccountConfig` y `finalize`, y agrega un enlace a la documentación cuando `docsPath` está establecido.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Para UI de configuración respaldadas por binarios, prefiere los auxiliares delegados compartidos en lugar de copiar el mismo pegamento de binario/estado en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, sugerencias, puntuaciones y detección de binario
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/es/tools/clawhub) y luego instala:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete sin prefijo se instalan desde npm durante la transición de lanzamiento.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Usa npm cuando un paquete aún no se haya movido a ClawHub, o cuando necesites una
    ruta directa de instalación de npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins en el repositorio:** colócalos bajo el árbol del espacio de trabajo de plugins incluidos y se detectarán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalaciones desde npm, `openclaw plugins install` instala el paquete en `~/.openclaw/npm` con los scripts de ciclo de vida deshabilitados. Mantén los árboles de dependencias de los plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala dependencias de plugins. Los flujos de instalación npm/git/ClawHub son responsables de la convergencia de dependencias; los plugins locales ya deben tener sus dependencias instaladas.
</Note>

Los metadatos de paquetes incluidos son explícitos, no inferidos del JavaScript compilado al iniciar el Gateway. Las dependencias de tiempo de ejecución pertenecen al paquete del Plugin que las posee; el inicio de OpenClaw empaquetado nunca repara ni replica dependencias de plugins.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — guía de introducción paso a paso
- [Manifiesto del Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
