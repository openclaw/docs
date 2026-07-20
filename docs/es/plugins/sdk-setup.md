---
read_when:
    - Estás añadiendo un asistente de configuración a un plugin
    - Necesitas entender setup-entry.ts frente a index.ts
    - Está definiendo esquemas de configuración de plugins o metadatos de OpenClaw en package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración e instalación del Plugin
x-i18n:
    generated_at: "2026-07-20T00:54:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
**¿Busca una guía paso a paso?** Las guías prácticas explican el empaquetado en contexto: [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
          "label": "Mi canal",
          "blurb": "Descripción breve del canal."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin de proveedor / referencia de ClawHub">
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
  Archivos de punto de entrada (relativos a la raíz del paquete). Entradas de código fuente válidas para el desarrollo en espacios de trabajo y checkouts de Git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Equivalentes JavaScript compilados para `extensions`, preferidos cuando OpenClaw carga un paquete npm instalado. Consulte [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el orden de resolución entre código fuente y compilado.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera exclusiva para la configuración (opcional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Equivalente JavaScript compilado para `setupEntry`. Requiere que también se establezca `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Identidad de plugin de respaldo de `{ id, label }`, utilizada cuando un plugin no tiene metadatos de canal o proveedor a partir de los cuales derivar un id o una etiqueta.
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para las superficies de configuración, selección, inicio rápido y estado.
</ParamField>
<ParamField path="install" type="object">
  Indicaciones de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Indicadores de comportamiento de inicio.
</ParamField>
<ParamField path="compat" type="object">
  Intervalo de versiones de `pluginApi` compatible con este plugin. Obligatorio para publicaciones externas en ClawHub.
</ParamField>

<Note>
Los identificadores de proveedor (`providers: string[]`) son metadatos del manifiesto, no del paquete. Declárelos en `openclaw.plugin.json`, no aquí; consulte [Manifiesto del plugin](/es/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contiene metadatos de paquete ligeros para el descubrimiento de canales y las superficies de configuración antes de que se cargue el entorno de ejecución.

| Campo                                  | Tipo       | Significado                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identificador canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                        |
| `selectionLabel`                       | `string`   | Etiqueta de selección/configuración cuando deba diferir de `label`.                        |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completos.       |
| `docsPath`                             | `string`   | Ruta de documentación para los enlaces de configuración y selección.                                      |
| `docsLabel`                            | `string`   | Etiqueta alternativa utilizada para los enlaces de documentación cuando deba diferir del identificador del canal. |
| `blurb`                                | `string`   | Descripción breve para la incorporación o el catálogo.                                         |
| `order`                                | `number`   | Orden de clasificación en los catálogos de canales.                                               |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección de canales.                                   |
| `preferOver`                           | `string[]` | Identificadores de plugins o canales de menor prioridad a los que este canal debe superar.                |
| `systemImage`                          | `string`   | Nombre opcional de icono o imagen del sistema para los catálogos de la interfaz de canales.                      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en las superficies de selección.                          |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra directamente la ruta de documentación en lugar de un enlace de documentación con etiqueta en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales añadidas al texto de selección.                               |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para las decisiones de formato de salida.      |
| `exposure`                             | `object`   | Controles de visibilidad del canal para la configuración, las listas configuradas y las superficies de documentación.   |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo de configuración estándar de inicio rápido `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Exige la vinculación explícita de la cuenta incluso cuando solo existe una cuenta.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Da preferencia a la búsqueda de sesiones al resolver destinos de anuncios para este canal.       |

Ejemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Mi canal",
      "selectionLabel": "Mi canal (autoalojado)",
      "detailLabel": "Bot de mi canal",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Integración de chat autoalojada basada en Webhook.",
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

- `configured`: incluye el canal en las superficies de listas configuradas o de estilo de estado
- `setup`: incluye el canal en los selectores interactivos de configuración
- `docs`: marca el canal como público en las superficies de documentación y navegación

### `openclaw.install`

`openclaw.install` son metadatos del paquete, no del manifiesto.

| Campo                        | Tipo                                | Significado                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para la instalación, actualización y los flujos de incorporación con instalación bajo demanda. |
| `npmSpec`                    | `string`                            | Especificación npm canónica para los flujos de instalación y actualización de respaldo.                             |
| `localPath`                  | `string`                            | Ruta de desarrollo local o de instalación incluida.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias fuentes disponibles.                     |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw, `>=x.y.z` o `>=x.y.z-prerelease`.            |
| `expectedIntegrity`          | `string`                            | Cadena de integridad esperada de la distribución npm, normalmente `sha512-...`, para instalaciones fijadas.    |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de plugins incluidos se recuperen de fallos específicos causados por configuraciones obsoletas.  |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm obligatorios específicos de la plataforma que se verifican durante la instalación con npm.               |

<AccordionGroup>
  <Accordion title="Comportamiento de incorporación">
    La incorporación interactiva utiliza `openclaw.install` para las superficies de instalación bajo demanda: si el plugin expone opciones de autenticación del proveedor o metadatos de configuración o catálogo del canal antes de que se cargue el entorno de ejecución, la incorporación puede solicitar una instalación desde ClawHub, npm o una fuente local, instalar o habilitar el plugin y continuar después con el flujo seleccionado. Las opciones de ClawHub utilizan `clawhubSpec` y tienen preferencia cuando están presentes; las opciones de npm requieren metadatos de catálogo de confianza con un `npmSpec` del registro (las versiones exactas y `expectedIntegrity` son fijaciones opcionales que se aplican durante la instalación o actualización cuando están establecidos). Mantenga «qué mostrar» en `openclaw.plugin.json` y «cómo instalarlo» en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si se establece `minHostVersion`, tanto la instalación como la carga no incluida del registro de manifiestos lo aplican. Los hosts más antiguos omiten los plugins externos; las cadenas de versión no válidas se rechazan. Se presupone que los plugins de código fuente incluidos tienen la misma versión que el checkout del host.
  </Accordion>
  <Accordion title="Instalaciones npm fijadas">
    Para las instalaciones npm fijadas, mantenga la versión exacta en `npmSpec` y añada la integridad esperada del artefacto:

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
    `allowInvalidConfigRecovery` no es una omisión general de las configuraciones dañadas. Solo permite la recuperación restringida de plugins incluidos, de modo que la reinstalación o configuración pueda reparar restos conocidos de actualizaciones, como la ausencia de la ruta de un plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está dañada por motivos no relacionados, la instalación continúa fallando de forma cerrada e indica al operador que ejecute `openclaw doctor --fix`.
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

Cuando se habilita, OpenClaw carga únicamente `setupEntry` durante la fase de inicio previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el Gateway comienza a escuchar.

<Warning>
Habilite la carga diferida únicamente cuando su `setupEntry` registre todo lo que el Gateway necesita antes de empezar a escuchar (registro de canales, rutas HTTP, métodos del Gateway). Si la entrada completa posee capacidades necesarias para el inicio, mantenga el comportamiento predeterminado.
</Warning>

Si su entrada de configuración/completa registra métodos RPC del Gateway, manténgalos bajo un prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se normalizan a `operator.admin`.

## Manifiesto del plugin

Cada plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo utiliza para validar la configuración sin ejecutar código del plugin.

```json
{
  "id": "my-plugin",
  "name": "Mi plugin",
  "description": "Añade capacidades de Mi plugin a OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secreto de verificación del Webhook"
      }
    }
  }
}
```

Para los plugins de canal, añada `channels` (y los plugins de proveedor deben añadir `providers`):

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

Consulte [Manifiesto del plugin](/es/plugins/manifest) para obtener la referencia completa del esquema.

## Publicación en ClawHub

Los paquetes de Skills y plugins utilizan comandos de publicación de ClawHub distintos. Para los paquetes de plugins, utilice el comando específico para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` es un comando diferente para publicar una carpeta de Skills, no un paquete de plugin. Consulte [Publicación en ClawHub](/es/clawhub/publishing).
</Note>

## Entrada de configuración

`setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de la configuración, inspección de canales deshabilitados):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de ejecución (bibliotecas criptográficas, registros de la CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales incluidos en el espacio de trabajo que mantienen exportaciones seguras para la configuración en módulos auxiliares pueden utilizar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado del entorno de ejecución durante la configuración pueda mantenerse ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo OpenClaw utiliza setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración/incorporación.
    - El canal está habilitado, pero no está configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto del plugin de canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP necesaria antes de que el Gateway empiece a escuchar.
    - Cualquier método del Gateway necesario durante el inicio.

    Esos métodos de inicio del Gateway deben seguir evitando los espacios de nombres administrativos reservados del núcleo, como `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Qué NO debe incluir setupEntry">
    - Registros de la CLI.
    - Servicios en segundo plano.
    - Importaciones pesadas del entorno de ejecución (criptografía, SDK).
    - Métodos del Gateway que solo se necesitan después del inicio.

  </Accordion>
</AccordionGroup>

### Importaciones específicas de asistentes de configuración

Para las rutas activas exclusivas de configuración, prefiera las interfaces específicas de asistentes de configuración en lugar del conjunto más amplio `plugin-sdk/setup` cuando solo necesite una parte de la superficie de configuración:

| Ruta de importación                | Utilícela para                                                                                | Exportaciones principales                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | asistentes del entorno de ejecución durante la configuración que permanecen disponibles en `setupEntry` / inicio diferido del canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | asistentes de configuración/instalación para la CLI, archivos y documentación                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Utilice la interfaz más amplia `plugin-sdk/setup` cuando necesite el conjunto completo de herramientas compartidas de configuración, incluidos asistentes para aplicar parches a la configuración, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utilice `createSetupTranslator(...)` para el texto fijo del asistente de configuración. Utiliza el primer valor no vacío de `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` y `LANG`, en ese orden, y después recurre al inglés. Establezca `OPENCLAW_LOCALE=en` para una sustitución explícita en inglés. Mantenga el texto de configuración específico del plugin en el código propiedad del plugin y utilice claves compartidas del catálogo únicamente para etiquetas comunes de configuración, texto de estado y texto de configuración de plugins oficiales incluidos.

Los adaptadores de parches de configuración siguen siendo seguros para importar en rutas activas. La búsqueda de la superficie del contrato de promoción de cuenta única incluida es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga anticipadamente el descubrimiento de superficies de contratos incluidos antes de que el adaptador se utilice realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal pasa de una configuración de nivel superior para una sola cuenta a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado traslada los valores promocionados específicos de la cuenta a `accounts.default`.

Los canales incluidos pueden restringir o sustituir esa promoción mediante su superficie de contrato de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben trasladarse a la cuenta promocionada
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se trasladan a la cuenta promocionada; las claves compartidas de políticas/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente recibe los valores promocionados

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta de Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente, como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
</Note>

## Esquema de configuración

La configuración del plugin se valida con el esquema JSON de su manifiesto. Los usuarios configuran los plugins mediante:

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

Para la configuración específica del canal, utilice en su lugar la sección de configuración del canal:

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

Utilice `buildChannelConfigSchema` para convertir un esquema de Zod en el contenedor `ChannelConfigSchema` utilizado por los artefactos de configuración propiedad del plugin:

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

Si ya crea el contrato como esquema JSON o TypeBox, utilice el asistente directo para que OpenClaw pueda omitir la conversión de Zod a esquema JSON en las rutas de metadatos:

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

Para plugins de terceros, el contrato de ruta inactiva sigue siendo el manifiesto del plugin: replique el esquema JSON generado en `openclaw.plugin.json#channelConfigs` para que las superficies de esquema de configuración, configuración e interfaz de usuario puedan inspeccionar `channels.<id>` sin cargar código de ejecución.

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`. El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Conectado",
    unconfiguredLabel: "No configurado",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token del bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "¿Utilizar MY_CHANNEL_BOT_TOKEN del entorno?",
      keepPrompt: "¿Conservar el token actual?",
      inputPrompt: "Introduzca el token de su bot:",
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

`ChannelSetupWizard` también admite `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulte `src/setup-core.ts` del plugin de Discord para ver un ejemplo incluido completo.

<AccordionGroup>
  <Accordion title="Indicaciones compartidas de allowFrom">
    Para indicaciones de listas de permitidos de mensajes directos que solo necesiten el flujo estándar `note -> prompt -> parse -> merge -> patch`, prefiera los asistentes de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de configuración del canal">
    Para bloques de estado de configuración del canal que solo varíen en etiquetas, puntuaciones y líneas adicionales opcionales, prefiera `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada plugin.
  </Accordion>
  <Accordion title="Superficie opcional de configuración del canal">
    Para superficies opcionales de configuración que solo deban aparecer en determinados contextos, utilice `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Mi canal",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Devuelve { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` también expone los constructores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo necesita una mitad de esa superficie de instalación opcional.

    El adaptador/asistente opcional generado adopta un cierre seguro en las escrituras reales de configuración. Reutiliza un único mensaje que indica que se requiere la instalación en `validateInput`, `applyAccountConfig` y `finalize`, y añade un enlace a la documentación cuando se establece `docsPath`.

  </Accordion>
  <Accordion title="Ayudantes de configuración respaldados por binarios">
    Para las interfaces de configuración respaldadas por binarios, se recomienda usar los ayudantes compartidos con delegación en lugar de copiar la misma lógica de integración de binarios y estados en cada canal:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían en etiquetas, indicaciones, puntuaciones y detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto basadas en rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita redirigir de forma diferida a un asistente completo más pesado
    - `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita delegar una decisión de `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publicación e instalación

**Plugins externos:** publíquelos en [ClawHub](/es/clawhub) y, a continuación, instálelos:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Las especificaciones de paquete sin prefijo se instalan desde npm durante la transición del inicio, salvo que el nombre coincida con el id de un plugin incluido u oficial, en cuyo caso OpenClaw utiliza esa copia local/oficial. Use `clawhub:`, `npm:`, `git:` o `npm-pack:` para seleccionar el origen de forma determinista; consulte [Administrar plugins](/es/plugins/manage-plugins).

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Especificación de paquete npm">
    Use npm cuando un paquete aún no se haya trasladado a ClawHub o cuando se necesite una
    ruta de instalación directa desde npm durante la migración:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins del repositorio:** colóquelos en el árbol del espacio de trabajo de plugins incluidos; se detectan automáticamente durante la compilación.

<Info>
Para las instalaciones procedentes de npm, `openclaw plugins install` instala el paquete en un proyecto por plugin en `~/.openclaw/npm/projects` con los scripts del ciclo de vida deshabilitados (`--ignore-scripts`). Mantenga los árboles de dependencias de los plugins exclusivamente en JS/TS y evite paquetes que requieran compilaciones de `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala las dependencias de los plugins. Los flujos de instalación de npm/git/ClawHub se encargan de la convergencia de dependencias; los plugins locales ya deben tener instaladas sus dependencias.
</Note>

Los metadatos de los paquetes incluidos son explícitos; no se infieren a partir del JavaScript compilado durante el inicio del Gateway. Las dependencias de tiempo de ejecución deben residir en el paquete del plugin al que pertenecen; el inicio de OpenClaw empaquetado nunca repara ni replica las dependencias de los plugins.

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins) — guía de introducción paso a paso
- [Manifiesto de plugins](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
