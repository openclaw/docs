---
read_when:
    - Estás añadiendo un asistente de configuración a un Plugin
    - Necesitas comprender setup-entry.ts frente a index.ts
    - Estás definiendo esquemas de configuración de plugins o metadatos de OpenClaw en package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración del Plugin y ajustes
x-i18n:
    generated_at: "2026-07-11T23:26:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
**¿Busca una guía paso a paso?** Las guías prácticas explican el empaquetado en contexto: [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y [plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Su `package.json` necesita un campo `openclaw` que indique al sistema de plugins qué proporciona su plugin:

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
  <Tab title="Plugin de proveedor / base de referencia de ClawHub">
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
La publicación externa en ClawHub requiere `compat` y `build`. Los fragmentos canónicos de publicación se encuentran en `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete). Entradas de código fuente válidas para el desarrollo en el espacio de trabajo y mediante un checkout de git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Archivos JavaScript compilados equivalentes a `extensions`, preferidos cuando OpenClaw carga un paquete npm instalado. Consulte [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el orden de resolución entre código fuente y código compilado.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera exclusiva para la configuración (opcional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Archivo JavaScript compilado equivalente a `setupEntry`. Requiere que también se defina `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Identidad alternativa del plugin `{ id, label }`, utilizada cuando un plugin no tiene metadatos de canal o proveedor de los que derivar un identificador o una etiqueta.
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para las interfaces de configuración, selección, inicio rápido y estado.
</ParamField>
<ParamField path="install" type="object">
  Indicaciones de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Indicadores del comportamiento de inicio.
</ParamField>
<ParamField path="compat" type="object">
  Intervalo de versiones de `pluginApi` compatible con este plugin. Obligatorio para publicaciones externas en ClawHub.
</ParamField>

<Note>
Los identificadores de proveedor (`providers: string[]`) son metadatos del manifiesto, no del paquete. Declárelos en `openclaw.plugin.json`, no aquí; consulte [Manifiesto del plugin](/es/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contiene metadatos ligeros del paquete para el descubrimiento de canales y las interfaces de configuración antes de cargar el entorno de ejecución.

| Campo                                  | Tipo       | Significado                                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Identificador canónico del canal.                                              |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta del selector o de configuración cuando deba diferir de `label`.       |
| `detailLabel`                          | `string`   | Etiqueta secundaria detallada para catálogos de canales e interfaces de estado más completos. |
| `docsPath`                             | `string`   | Ruta de la documentación para los enlaces de configuración y selección.        |
| `docsLabel`                            | `string`   | Etiqueta alternativa para los enlaces de documentación cuando deba diferir del identificador del canal. |
| `blurb`                                | `string`   | Descripción breve para la incorporación o el catálogo.                         |
| `order`                                | `number`   | Orden de clasificación en los catálogos de canales.                            |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para seleccionar el canal.                       |
| `preferOver`                           | `string[]` | Identificadores de plugins o canales de menor prioridad que este canal debe superar. |
| `systemImage`                          | `string`   | Nombre opcional del icono o imagen del sistema para los catálogos de canales de la interfaz. |
| `selectionDocsPrefix`                  | `string`   | Texto prefijado a los enlaces de documentación en las interfaces de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra directamente la ruta de la documentación en lugar de un enlace con etiqueta en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales que se agregan al texto de selección.               |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decidir el formato de salida. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para la configuración, las listas de canales configurados y las interfaces de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración rápida de `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Exige la vinculación explícita de una cuenta incluso cuando solo existe una.   |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prioriza la búsqueda de sesiones al resolver los destinos de anuncios de este canal. |

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

- `configured`: incluye el canal en interfaces de listado de canales configurados o de estado
- `setup`: incluye el canal en los selectores interactivos de configuración
- `docs`: marca el canal como público en las interfaces de documentación y navegación

<Note>
`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Se recomienda `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` contiene metadatos del paquete, no del manifiesto.

| Campo                        | Tipo                                | Significado                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para los flujos de instalación, actualización e instalación bajo demanda durante la incorporación. |
| `npmSpec`                    | `string`                            | Especificación canónica de npm para los flujos alternativos de instalación y actualización. |
| `localPath`                  | `string`                            | Ruta de desarrollo local o de instalación incluida.                              |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias disponibles.                   |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw: `>=x.y.z` o `>=x.y.z-prerelease`.         |
| `expectedIntegrity`          | `string`                            | Cadena de integridad esperada de la distribución npm, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de plugins incluidos se recuperen de errores específicos causados por configuraciones obsoletas. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm obligatorios específicos de la plataforma que se verifican durante la instalación con npm. |

<AccordionGroup>
  <Accordion title="Comportamiento de la incorporación">
    La incorporación interactiva utiliza `openclaw.install` para las interfaces de instalación bajo demanda: si su plugin expone opciones de autenticación de proveedores o metadatos de configuración o catálogo de canales antes de cargar el entorno de ejecución, la incorporación puede solicitar una instalación desde ClawHub, npm o una fuente local, instalar o habilitar el plugin y continuar después con el flujo seleccionado. Las opciones de ClawHub usan `clawhubSpec` y se prefieren cuando están presentes; las opciones de npm requieren metadatos de catálogo de confianza con un `npmSpec` del registro (las versiones exactas y `expectedIntegrity` son fijaciones opcionales que se aplican durante la instalación o actualización cuando están definidas). Mantenga «qué mostrar» en `openclaw.plugin.json` y «cómo instalarlo» en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si se define `minHostVersion`, se aplica tanto durante la instalación como al cargar registros de manifiestos no incluidos. Los hosts más antiguos omiten los plugins externos; se rechazan las cadenas de versión no válidas. Se presupone que los plugins de código fuente incluidos tienen la misma versión que el checkout del host.
  </Accordion>
  <Accordion title="Instalaciones de npm fijadas">
    Para las instalaciones de npm fijadas, mantenga la versión exacta en `npmSpec` y añada la integridad esperada del artefacto:

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
  <Accordion title="Ámbito de allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` no es una forma general de eludir configuraciones dañadas. Solo permite la recuperación limitada de plugins incluidos, de modo que la reinstalación o configuración pueda reparar residuos conocidos de actualizaciones, como una ruta ausente de un plugin incluido o una entrada `channels.<id>` obsoleta correspondiente a ese mismo plugin. Si la configuración está dañada por motivos no relacionados, la instalación continúa fallando de forma segura e indica al operador que ejecute `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Carga completa diferida

Los plugins de canal pueden optar por la carga diferida mediante:

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

Cuando está habilitada, OpenClaw carga únicamente `setupEntry` durante la fase de inicio previa a la escucha, incluso para los canales ya configurados. La entrada completa se carga después de que el Gateway comienza a escuchar.

<Warning>
Habilite la carga diferida únicamente cuando `setupEntry` registre todo lo que el Gateway necesita antes de comenzar a escuchar (registro del canal, rutas HTTP y métodos del Gateway). Si la entrada completa contiene capacidades de inicio obligatorias, mantenga el comportamiento predeterminado.
</Warning>

Si la entrada de configuración o la entrada completa registra métodos RPC del Gateway, manténgalos bajo un prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se normalizan como `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un archivo `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo utiliza para validar la configuración sin ejecutar el código del plugin.

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

Para los plugins de canal, añade `channels` (y, para los plugins de proveedor, añade `providers`):

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

Consulta [Manifiesto del plugin](/es/plugins/manifest) para obtener la referencia completa del esquema.

## Publicación en ClawHub

Los paquetes de Skills y plugins utilizan comandos de publicación de ClawHub distintos. Para los paquetes de plugins, utiliza el comando específico para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` es un comando diferente para publicar una carpeta de Skills, no un paquete de plugin. Consulta [Publicación en ClawHub](/es/clawhub/publishing).
</Note>

## Entrada de configuración

`setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita las superficies de configuración inicial (incorporación, reparación de la configuración e inspección de canales deshabilitados):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado en tiempo de ejecución (bibliotecas criptográficas, registros de la CLI y servicios en segundo plano) durante los flujos de configuración inicial.

Los canales incluidos en el espacio de trabajo que mantienen exportaciones seguras para la configuración inicial en módulos auxiliares pueden utilizar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato para componentes incluidos también admite una exportación opcional `runtime`, de modo que la conexión del entorno de ejecución durante la configuración inicial pueda mantenerse ligera y explícita.

<AccordionGroup>
  <Accordion title="Cuándo utiliza OpenClaw setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración inicial o incorporación.
    - El canal está habilitado, pero no está configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto del plugin de canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP necesaria antes de que el Gateway comience a escuchar.
    - Cualquier método del Gateway necesario durante el inicio.

    Esos métodos del Gateway utilizados durante el inicio deben seguir evitando los espacios de nombres administrativos reservados del núcleo, como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de la CLI.
    - Servicios en segundo plano.
    - Importaciones pesadas del entorno de ejecución (criptografía, SDK).
    - Métodos del Gateway que solo se necesitan después del inicio.

  </Accordion>
</AccordionGroup>

### Importaciones específicas de ayudantes de configuración inicial

Para las rutas críticas exclusivas de configuración inicial, cuando solo necesites una parte de la superficie de configuración, prefiere los puntos de acceso específicos a los ayudantes de configuración en lugar del módulo general `plugin-sdk/setup`:

| Ruta de importación                 | Utilízala para                                                                                          | Exportaciones principales                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | ayudantes del entorno de ejecución durante la configuración disponibles en `setupEntry` o el inicio diferido del canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | alias de compatibilidad obsoleto; utiliza `plugin-sdk/setup-runtime`                                    | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                  |
| `plugin-sdk/setup-tools`            | ayudantes de configuración, instalación, CLI, archivos y documentación                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                          |

Utiliza el punto de acceso general `plugin-sdk/setup` cuando quieras el conjunto completo de herramientas compartidas de configuración inicial, incluidos los ayudantes para modificar la configuración, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utiliza `createSetupTranslator(...)` para el texto fijo del asistente de configuración. Sigue la configuración regional del asistente de la CLI (`OPENCLAW_LOCALE` y, después, las variables de configuración regional del sistema) y utiliza el inglés como alternativa. Mantén el texto de configuración específico del plugin en el código propiedad del plugin y utiliza las claves del catálogo compartido solo para las etiquetas comunes de configuración, el texto de estado y el texto de configuración de los plugins oficiales incluidos.

Los adaptadores de modificación de la configuración siguen siendo seguros para las rutas críticas al importarlos. La búsqueda de la superficie del contrato para la promoción de cuentas únicas incluidas es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga anticipadamente el descubrimiento de superficies de contrato incluidas antes de que se utilice realmente el adaptador.

### Promoción de cuentas únicas propiedad del canal

Cuando un canal migra de una configuración de cuenta única de nivel superior a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado mueve los valores promocionados específicos de la cuenta a `accounts.default`.

Los canales incluidos pueden restringir o sustituir esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben trasladarse a la cuenta promocionada
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se trasladan a la cuenta promocionada; las claves compartidas de políticas y entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promocionados

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta de Matrix con nombre, o si `defaultAccount` apunta a una clave existente no canónica como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del plugin se valida con el esquema JSON del manifiesto. Los usuarios configuran los plugins mediante:

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

El plugin recibe esta configuración como `api.pluginConfig` durante el registro.

Para la configuración específica del canal, utiliza en su lugar la sección de configuración del canal:

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

### Creación de esquemas de configuración de canales

Utiliza `buildChannelConfigSchema` para convertir un esquema de Zod en el contenedor `ChannelConfigSchema` que emplean los artefactos de configuración propiedad del plugin:

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

Si ya defines el contrato como esquema JSON o TypeBox, utiliza el ayudante directo para que OpenClaw pueda omitir la conversión de Zod a esquema JSON en las rutas de metadatos:

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

Para los plugins de terceros, el contrato de la ruta no crítica sigue siendo el manifiesto del plugin: refleja el esquema JSON generado en `openclaw.plugin.json#channelConfigs` para que las superficies de esquema de configuración, configuración inicial e interfaz de usuario puedan inspeccionar `channels.<id>` sin cargar código del entorno de ejecución.

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes interactivos de configuración para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

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

`ChannelSetupWizard` también admite `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más opciones. Consulta `src/setup-core.ts` del plugin de Discord para ver un ejemplo completo incluido.

<AccordionGroup>
  <Accordion title="Indicaciones compartidas de allowFrom">
    Para las indicaciones de listas de permitidos de mensajes directos que solo necesiten el flujo estándar `nota -> indicación -> análisis -> combinación -> modificación`, prefiere los ayudantes de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de configuración del canal">
    Para los bloques de estado de configuración del canal que solo varían en las etiquetas, las puntuaciones y las líneas adicionales opcionales, prefiere `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada plugin.
  </Accordion>
  <Accordion title="Superficie opcional de configuración del canal">
    Para las superficies opcionales de configuración que solo deben aparecer en determinados contextos, utiliza `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` también expone los constructores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesitas una de las dos partes de esa superficie de instalación opcional.

    El adaptador/asistente opcional generado falla de forma segura en escrituras reales de configuración. Reutiliza un único mensaje de instalación obligatoria en `validateInput`, `applyAccountConfig` y `finalize`, y añade un enlace a la documentación cuando se establece `docsPath`.

  </Accordion>
  <Accordion title="Ayudantes de configuración respaldados por binarios">
    Para las interfaces de configuración respaldadas por binarios, se recomienda usar los ayudantes delegados compartidos en lugar de copiar la misma lógica de integración de binarios y estados en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían en etiquetas, indicaciones, puntuaciones y detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto basadas en rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita remitir de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publíquelos en [ClawHub](/es/clawhub) y, después, instálelos:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete simples se instalan desde npm durante la transición del lanzamiento, salvo que el nombre coincida con el identificador de un Plugin incluido u oficial, en cuyo caso OpenClaw utiliza esa copia local u oficial. Use `clawhub:`, `npm:`, `git:` o `npm-pack:` para seleccionar la fuente de forma determinista; consulte [Gestionar Plugins](/es/plugins/manage-plugins).

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    Use npm cuando un paquete aún no se haya trasladado a ClawHub o cuando necesite una
    ruta de instalación directa desde npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins del repositorio:** colóquelos en el árbol del espacio de trabajo de Plugins incluidos; se detectan automáticamente durante la compilación.

<Info>
En las instalaciones procedentes de npm, `openclaw plugins install` instala el paquete en un proyecto por Plugin dentro de `~/.openclaw/npm/projects`, con los scripts del ciclo de vida deshabilitados (`--ignore-scripts`). Mantenga los árboles de dependencias de los Plugins exclusivamente en JS/TS y evite paquetes que requieran compilaciones mediante `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala las dependencias de los Plugins. Los flujos de instalación de npm, git y ClawHub se encargan de la convergencia de dependencias; los Plugins locales deben tener sus dependencias ya instaladas.
</Note>

Los metadatos de los paquetes incluidos son explícitos; no se infieren del JavaScript compilado durante el inicio del Gateway. Las dependencias de ejecución deben pertenecer al paquete del Plugin que las gestiona; el inicio de OpenClaw empaquetado nunca repara ni replica las dependencias de los Plugins.

## Contenido relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — guía de introducción paso a paso
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
