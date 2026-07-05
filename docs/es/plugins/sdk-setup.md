---
read_when:
    - Estás agregando un asistente de configuración a un plugin
    - Necesitas entender setup-entry.ts frente a index.ts
    - Estás definiendo esquemas de configuración de plugins o metadatos openclaw de package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración e instalación de Plugin
x-i18n:
    generated_at: "2026-07-05T11:34:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
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
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
Publicar externamente en ClawHub requiere `compat` y `build`. Los fragmentos canónicos de publicación están en `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete). Entradas de origen válidas para desarrollo en workspace y checkout de git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Pares JavaScript compilados para `extensions`, preferidos cuando OpenClaw carga un paquete npm instalado. Consulta [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el orden de resolución de origen/compilado.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera solo para configuración (opcional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Par JavaScript compilado para `setupEntry`. Requiere que `setupEntry` también esté definido.
</ParamField>
<ParamField path="plugin" type="object">
  Identidad de Plugin de respaldo `{ id, label }`, usada cuando un Plugin no tiene metadatos de canal/proveedor de los que derivar un id o una etiqueta.
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para superficies de configuración, selector, inicio rápido y estado.
</ParamField>
<ParamField path="install" type="object">
  Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Indicadores de comportamiento de inicio.
</ParamField>
<ParamField path="compat" type="object">
  Rango de versiones de `pluginApi` que admite este Plugin. Requerido para publicaciones externas en ClawHub.
</ParamField>

<Note>
Los id de proveedores (`providers: string[]`) son metadatos de manifiesto, no metadatos de paquete. Decláralos en `openclaw.plugin.json`, no aquí; consulta [Manifiesto de Plugin](/es/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` son metadatos de paquete ligeros para descubrimiento de canales y superficies de configuración antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Id canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración cuando debe diferir de `label`.            |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más ricos. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.               |
| `docsLabel`                            | `string`   | Etiqueta alternativa usada para enlaces de documentación cuando debe diferir del id del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                   |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para selección de canal.                         |
| `preferOver`                           | `string[]` | Id de Plugin/canal de menor prioridad a los que este canal debe superar.       |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de interfaz de canales. |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra directamente la ruta de documentación en lugar de un enlace de documentación etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales anexadas en el texto de selección.                  |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo de configuración estándar de inicio rápido `allowFrom`. |
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

- `configured`: incluye el canal en superficies de listado configuradas/de estilo de estado
- `setup`: incluye el canal en selectores interactivos de configuración/configurar
- `docs`: marca el canal como público en superficies de documentación/navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` son metadatos de paquete, no metadatos de manifiesto.

| Campo                        | Tipo                                | Qué significa                                                                    |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para flujos de instalación/actualización e instalación bajo demanda durante la incorporación. |
| `npmSpec`                    | `string`                            | Especificación npm canónica para flujos de respaldo de instalación/actualización. |
| `localPath`                  | `string`                            | Ruta de desarrollo local o instalación incluida.                                 |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias fuentes disponibles.           |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw, `>=x.y.z` o `>=x.y.z-prerelease`.         |
| `expectedIntegrity`          | `string`                            | Cadena esperada de integridad de distribución npm, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de Plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm específicos de plataforma requeridos y verificados durante la instalación npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    La incorporación interactiva usa `openclaw.install` para superficies de instalación bajo demanda: si tu Plugin expone opciones de autenticación de proveedor o metadatos de configuración/catálogo de canal antes de que se cargue el runtime, la incorporación puede solicitar instalación desde ClawHub, npm o local, instalar o habilitar el Plugin y luego continuar el flujo seleccionado. Las opciones de ClawHub usan `clawhubSpec` y se prefieren cuando están presentes; las opciones npm requieren metadatos de catálogo de confianza con un `npmSpec` de registro (las versiones exactas y `expectedIntegrity` son fijaciones opcionales, aplicadas en instalación/actualización cuando se definen). Mantén "qué mostrar" en `openclaw.plugin.json` y "cómo instalarlo" en `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Si se define `minHostVersion`, tanto la instalación como la carga no incluida del registro de manifiestos la aplican. Los hosts más antiguos omiten Plugins externos; las cadenas de versión no válidas se rechazan. Se asume que los Plugins de origen incluidos tienen la misma versión que el checkout del host.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Para instalaciones npm fijadas, mantén la versión exacta en `npmSpec` y agrega la integridad esperada del artefacto:

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
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es una recuperación estrecha solo para Plugins incluidos, que permite que la reinstalación/configuración repare restos conocidos de actualizaciones, como una ruta faltante de Plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo Plugin. Si la configuración está rota por razones no relacionadas, la instalación sigue fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el gateway empieza a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registra todo lo que el gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP, métodos de gateway). Si la entrada completa posee capacidades de inicio requeridas, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC de gateway, mantenlos en un prefijo específico del Plugin. Los espacios de nombres reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se normalizan a `operator.admin`.

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

Para Plugins de canal, agrega `channels` (y los Plugins de proveedor agregan `providers`):

```json
{
  "id": "my-channel",
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

Consulta [manifiesto de Plugin](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Skills y los paquetes de Plugin usan comandos de publicación de ClawHub separados. Para paquetes de Plugin, usa el comando específico del paquete:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` es un comando diferente para publicar una carpeta de Skills, no un paquete de Plugin. Consulta [Publicar en ClawHub](/es/clawhub/publishing).
</Note>

## Entrada de configuración

`setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de configuración, inspección de canal deshabilitado):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código de runtime pesado (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales incluidos en el workspace que mantienen exportaciones seguras para configuración en módulos auxiliares pueden usar `defineBundledChannelSetupEntry(...)` desde `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado de runtime en tiempo de configuración pueda mantenerse ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw usa setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración/incorporación.
    - El canal está habilitado, pero no configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto Plugin de canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que Gateway escuche.
    - Cualquier método de Gateway necesario durante el inicio.

    Esos métodos de Gateway de inicio aún deben evitar espacios de nombres administrativos reservados del núcleo, como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones de runtime pesadas (criptografía, SDKs).
    - Métodos de Gateway que solo se necesitan después del inicio.

  </Accordion>
</AccordionGroup>

### Importaciones estrechas de ayudantes de configuración

Para rutas activas solo de configuración, prefiere las superficies estrechas de ayudantes de configuración en lugar del paraguas más amplio `plugin-sdk/setup` cuando solo necesitas parte de la superficie de configuración:

| Ruta de importación                | Úsala para                                                                                | Exportaciones clave                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de runtime en tiempo de configuración que permanecen disponibles en `setupEntry` / inicio diferido de canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias de compatibilidad obsoleto; usa `plugin-sdk/setup-runtime`                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | ayudantes de CLI/archivo/docs para configuración/instalación                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Usa la superficie más amplia `plugin-sdk/setup` cuando quieras el conjunto completo de herramientas compartidas de configuración, incluidos ayudantes de parches de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Usa `createSetupTranslator(...)` para texto fijo del asistente de configuración. Sigue la configuración regional del asistente de CLI (`OPENCLAW_LOCALE`, luego las variables regionales del sistema) y recurre al inglés. Mantén el texto de configuración específico del Plugin en código propiedad del Plugin y usa claves de catálogo compartidas solo para etiquetas de configuración comunes, texto de estado y texto de configuración de Plugins oficiales incluidos.

Los adaptadores de parches de configuración siguen siendo seguros de importar en rutas activas. La búsqueda de superficie de contrato de promoción de cuenta única incluida es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficies de contrato incluidas antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal actualiza una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado mueve los valores promovidos con ámbito de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o sobrescribir esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promovidos

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta de Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del Plugin se valida contra el esquema JSON de tu manifiesto. Los usuarios configuran Plugins mediante:

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

### Crear esquemas de configuración de canal

Usa `buildChannelConfigSchema` para convertir un esquema de Zod en el contenedor `ChannelConfigSchema` que usan los artefactos de configuración propiedad del Plugin:

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

Si ya escribes el contrato como JSON Schema o TypeBox, usa el ayudante directo para que OpenClaw pueda omitir la conversión de Zod a JSON Schema en rutas de metadatos:

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

Para Plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin: refleja el JSON Schema generado en `openclaw.plugin.json#channelConfigs` para que el esquema de configuración, la configuración y las superficies de UI puedan inspeccionar `channels.<id>` sin cargar código de runtime.

## Asistentes de configuración

Los Plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en el `ChannelPlugin`:

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

`ChannelSetupWizard` también admite `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulta `src/setup-core.ts` del Plugin de Discord para ver un ejemplo incluido completo.

<AccordionGroup>
  <Accordion title="Indicaciones allowFrom compartidas">
    Para indicaciones de listas de permitidos de DM que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
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

    `plugin-sdk/channel-setup` también expone los constructores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de esa superficie de instalación opcional.

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras de configuración reales. Reutiliza un único mensaje de instalación obligatoria en `validateInput`, `applyAccountConfig` y `finalize`, y agrega un enlace a la documentación cuando `docsPath` está definido.

  </Accordion>
  <Accordion title="Ayudantes de configuración respaldados por binarios">
    Para las IU de configuración respaldadas por binarios, prefiere los ayudantes delegados compartidos en lugar de copiar la misma integración de binario/estado en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, sugerencias, puntuaciones y detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/clawhub) y luego instala:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete simples se instalan desde npm durante la transición de lanzamiento, salvo que el nombre coincida con un id de plugin incluido u oficial, en cuyo caso OpenClaw usa esa copia local/oficial en su lugar. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` para una selección determinista de origen — consulta [Administrar plugins](/es/plugins/manage-plugins).

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    Usa npm cuando un paquete aún no se haya movido a ClawHub, o cuando necesites una
    ruta de instalación npm directa durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins en el repositorio:** colócalos bajo el árbol de espacio de trabajo de plugins incluidos; se descubren automáticamente durante la compilación.

<Info>
Para instalaciones con origen en npm, `openclaw plugins install` instala el paquete en un proyecto por plugin bajo `~/.openclaw/npm/projects` con los scripts de ciclo de vida deshabilitados (`--ignore-scripts`). Mantén los árboles de dependencias de plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala dependencias de plugins. Los flujos de instalación de npm/git/ClawHub son responsables de la convergencia de dependencias; los plugins locales ya deben tener sus dependencias instaladas.
</Note>

Los metadatos de paquetes incluidos son explícitos, no se infieren del JavaScript compilado durante el inicio del gateway. Las dependencias de runtime pertenecen al paquete de plugin que las posee; el inicio de OpenClaw empaquetado nunca repara ni replica dependencias de plugins.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins) — guía de inicio paso a paso
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
