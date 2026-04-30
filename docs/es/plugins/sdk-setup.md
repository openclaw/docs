---
read_when:
    - Estás agregando un asistente de configuración a un Plugin
    - Necesitas entender la diferencia entre setup-entry.ts e index.ts
    - Está definiendo esquemas de configuración de Plugin o metadatos openclaw de package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Instalación y configuración de Plugin
x-i18n:
    generated_at: "2026-04-30T05:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para empaquetado de plugins (`package.json` metadata), manifiestos (`openclaw.plugin.json`), entradas de configuración inicial y esquemas de configuración.

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
  Entrada ligera solo para configuración inicial (opcional).
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para las superficies de configuración inicial, selector, inicio rápido y estado.
</ParamField>
<ParamField path="providers" type="string[]">
  Ids de proveedor registrados por este plugin.
</ParamField>
<ParamField path="install" type="object">
  Indicaciones de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Marcas de comportamiento de inicio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` son metadatos de paquete ligeros para el descubrimiento de canales y las superficies de configuración inicial antes de que se cargue el entorno de ejecución.

| Campo                                  | Tipo       | Qué significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id canónico del canal.                                                        |
| `label`                                | `string`   | Etiqueta principal del canal.                                                 |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración inicial cuando debe diferir de `label`.   |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más completas. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración inicial y selección.      |
| `docsLabel`                            | `string`   | Etiqueta de anulación usada para enlaces de documentación cuando debe diferir del id del canal. |
| `blurb`                                | `string`   | Descripción breve de onboarding/catálogo.                                     |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                               |
| `aliases`                              | `string[]` | Alias adicionales de búsqueda para la selección de canales.                   |
| `preferOver`                           | `string[]` | Ids de plugins/canales de menor prioridad que este canal debe superar.        |
| `systemImage`                          | `string`   | Nombre opcional de icono/imagen del sistema para catálogos de UI de canales.  |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace de documentación con etiqueta en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales agregadas al texto de selección.                   |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración inicial, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración inicial de inicio rápido `allowFrom`. |
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
- `setup`: incluye el canal en selectores interactivos de configuración inicial/configuración
- `docs`: marca el canal como público en superficies de documentación/navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiere `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` son metadatos de paquete, no metadatos de manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.            |
| `localPath`                  | `string`             | Ruta de desarrollo local o instalación incluida.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                  |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con la forma `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | Cadena de integridad esperada de npm dist, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins incluidos se recuperen de fallos específicos por configuración obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamiento de onboarding">
    El onboarding interactivo también usa `openclaw.install` para superficies de instalación bajo demanda. Si tu plugin expone opciones de autenticación de proveedor o metadatos de configuración inicial/catálogo de canal antes de que se cargue el entorno de ejecución, el onboarding puede mostrar esa opción, pedir instalación npm o local, instalar o habilitar el plugin y luego continuar el flujo seleccionado. Las opciones de onboarding de npm requieren metadatos de catálogo de confianza con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son fijaciones opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo hacen cumplir. Mantén los metadatos de "qué mostrar" en `openclaw.plugin.json` y los metadatos de "cómo instalarlo" en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si se establece `minHostVersion`, tanto la instalación como la carga del registro de manifiestos lo hacen cumplir. Los hosts antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.
  </Accordion>
  <Accordion title="Instalaciones npm fijadas">
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
  <Accordion title="Alcance de allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es solo para recuperación estrecha de plugins incluidos, de modo que la reinstalación/configuración inicial pueda reparar restos conocidos de actualización, como una ruta faltante de plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación aún falla de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el Gateway empieza a escuchar.

<Warning>
Habilita la carga diferida solo cuando tu `setupEntry` registra todo lo que el Gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP, métodos del Gateway). Si la entrada completa posee capacidades de inicio obligatorias, mantén el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración inicial/completa registra métodos RPC del Gateway, mantenlos en un prefijo específico del plugin. Los espacios de nombres de administración centrales reservados (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven a `operator.admin`.

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

Consulta [Manifiesto del plugin](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugin, usa el comando de ClawHub específico del paquete:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
El alias de publicación heredado solo para Skills es para skills. Los paquetes de plugin siempre deben usar `clawhub package publish`.
</Note>

## Entrada de configuración inicial

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración inicial (onboarding, reparación de configuración, inspección de canal deshabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de runtime (bibliotecas criptográficas, registros de CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales empaquetados del workspace que mantienen exportaciones seguras para configuración en módulos sidecar pueden usar `defineBundledChannelSetupEntry(...)` desde `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato empaquetado también admite una exportación `runtime` opcional para que el cableado del runtime en tiempo de configuración pueda mantenerse ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw usa setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración/onboarding.
    - El canal está habilitado, pero no configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto Plugin del canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP requerida antes de que el Gateway empiece a escuchar.
    - Cualquier método del Gateway necesario durante el inicio.

    Esos métodos del Gateway de inicio aún deben evitar espacios de nombres reservados de administración del núcleo, como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de CLI.
    - Servicios en segundo plano.
    - Importaciones pesadas de runtime (criptografía, SDK).
    - Métodos del Gateway que solo son necesarios después del inicio.

  </Accordion>
</AccordionGroup>

### Importaciones acotadas de ayudantes de configuración

Para rutas activas solo de configuración, prefiere las interfaces acotadas de ayudantes de configuración sobre el paraguas más amplio `plugin-sdk/setup` cuando solo necesites una parte de la superficie de configuración:

| Ruta de importación                | Úsala para                                                                                | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de runtime en tiempo de configuración que siguen disponibles en `setupEntry` / inicio diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuenta conscientes del entorno                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ayudantes de configuración/instalación de CLI/archivo/docs                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa la interfaz más amplia `plugin-sdk/setup` cuando quieras la caja de herramientas de configuración compartida completa, incluidos ayudantes de parches de configuración como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parches de configuración siguen siendo seguros de importar en rutas activas. Su búsqueda empaquetada de superficie de contrato de promoción de cuenta única es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga de forma ansiosa el descubrimiento empaquetado de superficies de contrato antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal actualiza una configuración de nivel superior de cuenta única a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos con alcance de cuenta a `accounts.default`.

Los canales empaquetados pueden acotar o sobrescribir esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promovidos

<Note>
Matrix es el ejemplo empaquetado actual. Si ya existe exactamente una cuenta Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del Plugin se valida contra el esquema JSON del manifiesto. Los usuarios configuran Plugins mediante:

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

### Creación de esquemas de configuración de canal

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

Para Plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin: refleja el esquema JSON generado en `openclaw.plugin.json#channelConfigs` para que el esquema de configuración, la configuración y las superficies de UI puedan inspeccionar `channels.<id>` sin cargar código de runtime.

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

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulta los paquetes de Plugins empaquetados (por ejemplo, el Plugin de Discord `src/channel.setup.ts`) para ver ejemplos completos.

<AccordionGroup>
  <Accordion title="Prompts allowFrom compartidos">
    Para prompts de lista de permitidos de DM que solo necesitan el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de configuración de canal">
    Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada Plugin.
  </Accordion>
  <Accordion title="Superficie opcional de configuración de canal">
    Para superficies de configuración opcionales que solo deben aparecer en ciertos contextos, usa `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    El adaptador/asistente opcional generado falla de forma cerrada en escrituras reales de configuración. Reutiliza un mensaje de instalación requerida en `validateInput`, `applyAccountConfig` y `finalize`, y añade un enlace a la documentación cuando `docsPath` está configurado.

  </Accordion>
  <Accordion title="Ayudantes de configuración respaldados por binarios">
    Para UI de configuración respaldadas por binarios, prefiere los ayudantes delegados compartidos en lugar de copiar la misma lógica de binario/estado en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas, sugerencias, puntuaciones y detección de binario
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/es/tools/clawhub), luego instala:

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
    ruta directa de instalación de npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dentro del repositorio:** colócalos bajo el árbol del workspace de Plugins empaquetados y se descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
Para instalaciones originadas en npm, `openclaw plugins install` ejecuta `npm install --ignore-scripts` local del proyecto (sin scripts de ciclo de vida), ignorando la configuración global heredada de instalación de npm. Mantén los árboles de dependencias de Plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
Los plugins incluidos propiedad de OpenClaw son la única excepción de reparación durante el inicio: cuando una instalación empaquetada ve uno habilitado por la configuración del plugin, la configuración de canal heredada o su manifiesto incluido habilitado por defecto, el inicio instala las dependencias de tiempo de ejecución faltantes de ese plugin antes de la importación. Los operadores pueden inspeccionar o reparar esa etapa con `openclaw plugins deps`. Los plugins de terceros no deben depender de instalaciones durante el inicio; sigue usando el instalador explícito de plugins.
</Note>

Las dependencias de tiempo de ejecución incluidas a nivel de paquete son metadatos explícitos, no se infieren del JavaScript compilado durante el inicio del Gateway. Si una dependencia raíz compartida de OpenClaw debe estar disponible dentro de la réplica externa de tiempo de ejecución del plugin incluido, declárala en `openclaw.bundle.mirroredRootRuntimeDependencies` en el manifiesto del paquete raíz.

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — guía paso a paso para empezar
- [Manifiesto del Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
