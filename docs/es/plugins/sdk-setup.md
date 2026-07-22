---
read_when:
    - Está añadiendo un asistente de configuración a un plugin
    - Necesita comprender setup-entry.ts frente a index.ts
    - Está definiendo esquemas de configuración de plugins o metadatos de OpenClaw en package.json
sidebarTitle: Setup and config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración y ajustes del Plugin
x-i18n:
    generated_at: "2026-07-22T10:45:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ccde36b432172f17175db9e74d0e0b7adbc50b1b047e4eaa6cbde01ef31e330e
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos (`openclaw.plugin.json`), entradas de configuración inicial y esquemas de configuración.

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
La publicación externa en ClawHub requiere `compat` y `build`. Los fragmentos de publicación canónicos se encuentran en `docs/snippets/plugin-publish/`.
</Note>

### Campos de `openclaw`

<ParamField path="extensions" type="string[]">
  Archivos de punto de entrada (relativos a la raíz del paquete). Entradas de código fuente válidas para el desarrollo en espacios de trabajo y repositorios de Git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Archivos JavaScript compilados equivalentes para `extensions`, preferidos cuando OpenClaw carga un paquete npm instalado. Consulte [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) para conocer el orden de resolución del código fuente y el código compilado.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrada ligera solo para la configuración inicial (opcional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Archivo JavaScript compilado equivalente para `setupEntry`. Requiere que también se establezca `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Identidad de plugin alternativa de `{ id, label }`, utilizada cuando un plugin no tiene metadatos de canal o proveedor de los que derivar un identificador o una etiqueta.
</ParamField>
<ParamField path="channel" type="object">
  Metadatos del catálogo de canales para las superficies de configuración inicial, selección, inicio rápido y estado.
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
Los identificadores de proveedor (`providers: string[]`) son metadatos del manifiesto, no metadatos del paquete. Declárelos en `openclaw.plugin.json`, no aquí; consulte [Manifiesto del plugin](/es/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contiene metadatos ligeros del paquete para el descubrimiento de canales y las superficies de configuración inicial antes de cargar el entorno de ejecución.

| Campo                                  | Tipo       | Significado                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identificador canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                        |
| `selectionLabel`                       | `string`   | Etiqueta de selección/configuración inicial cuando deba diferir de `label`.                        |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más completos.       |
| `docsPath`                             | `string`   | Ruta de la documentación para los enlaces de configuración inicial y selección.                                      |
| `docsLabel`                            | `string`   | Etiqueta sustitutiva utilizada para los enlaces de documentación cuando deba diferir del identificador del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación o catálogo.                                         |
| `order`                                | `number`   | Orden de clasificación en los catálogos de canales.                                               |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección del canal.                                   |
| `preferOver`                           | `string[]` | Identificadores de plugins o canales de menor prioridad a los que este canal debe preceder.                |
| `systemImage`                          | `string`   | Nombre opcional de icono o imagen del sistema para los catálogos de canales de la interfaz.                      |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en las superficies de selección.                          |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra directamente la ruta de la documentación en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas breves adicionales que se agregan al texto de selección.                               |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decidir el formato de salida.      |
| `exposure`                             | `object`   | Controles de visibilidad del canal para la configuración inicial, las listas configuradas y las superficies de documentación.   |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración inicial `allowFrom` de inicio rápido.         |
| `forceAccountBinding`                  | `boolean`  | Exige la vinculación explícita de una cuenta incluso cuando solo existe una.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesiones al resolver los destinos de anuncios para este canal.       |

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

- `configured`: incluye el canal en superficies de listas configuradas o de estado
- `setup`: incluye el canal en selectores interactivos de configuración inicial
- `docs`: marca el canal como público en las superficies de documentación y navegación

### `openclaw.install`

`openclaw.install` son metadatos del paquete, no metadatos del manifiesto.

| Campo                        | Tipo                                | Significado                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Especificación canónica de ClawHub para los flujos de instalación/actualización e instalación bajo demanda durante la incorporación. |
| `npmSpec`                    | `string`                            | Especificación canónica de npm para los flujos alternativos de instalación/actualización.                             |
| `localPath`                  | `string`                            | Ruta de instalación local, de desarrollo o incluida.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Fuente de instalación preferida cuando hay varias disponibles.                     |
| `minHostVersion`             | `string`                            | Versión mínima compatible de OpenClaw, `>=x.y.z` o `>=x.y.z-prerelease`.            |
| `expectedIntegrity`          | `string`                            | Cadena de integridad esperada de la distribución de npm, normalmente `sha512-...`, para instalaciones fijadas.    |
| `allowInvalidConfigRecovery` | `boolean`                           | Permite que los flujos de reinstalación de plugins incluidos se recuperen de determinados errores de configuración obsoleta.  |
| `requiredPlatformPackages`   | `string[]`                          | Alias de npm obligatorios y específicos de la plataforma que se verifican durante la instalación de npm.               |

<AccordionGroup>
  <Accordion title="Comportamiento de incorporación">
    La incorporación interactiva utiliza `openclaw.install` para las superficies de instalación bajo demanda: si el plugin expone opciones de autenticación del proveedor o metadatos del catálogo o de configuración inicial del canal antes de cargar el entorno de ejecución, la incorporación puede solicitar una instalación desde ClawHub, npm o una fuente local, instalar o activar el plugin y, a continuación, continuar con el flujo seleccionado. Las opciones de ClawHub utilizan `clawhubSpec` y se prefieren cuando están disponibles; las opciones de npm requieren metadatos de catálogo de confianza con un `npmSpec` del registro (las versiones exactas y `expectedIntegrity` son fijaciones opcionales que se aplican durante la instalación o actualización cuando se establecen). Mantenga «qué mostrar» en `openclaw.plugin.json` y «cómo instalarlo» en `package.json`.
  </Accordion>
  <Accordion title="Aplicación de minHostVersion">
    Si se establece `minHostVersion`, se aplica tanto durante la instalación como al cargar el registro de manifiestos no incluidos. Los hosts anteriores omiten los plugins externos; las cadenas de versión no válidas se rechazan. Se presupone que los plugins de código fuente incluidos comparten versión con el repositorio del host.
  </Accordion>
  <Accordion title="Instalaciones fijadas de npm">
    Para las instalaciones fijadas de npm, mantenga la versión exacta en `npmSpec` y añada la integridad esperada del artefacto:

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
    `allowInvalidConfigRecovery` no es una omisión general para configuraciones dañadas. Solo permite una recuperación limitada de plugins incluidos, de modo que la reinstalación o configuración inicial pueda reparar residuos conocidos de actualizaciones, como la ausencia de la ruta de un plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin. Si la configuración está dañada por motivos no relacionados, la instalación continúa fallando de forma segura e indica al operador que ejecute `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Carga completa diferida

Los plugins de canal pueden habilitar la carga diferida con:

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
Habilite la carga diferida solo cuando su `setupEntry` registre todo lo que el Gateway necesita antes de empezar a escuchar (registro de canales, rutas HTTP, métodos del Gateway). Si la entrada completa posee capacidades de inicio obligatorias, mantenga el comportamiento predeterminado.
</Warning>

Si su entrada de configuración/completa registra métodos RPC del Gateway, manténgalos en un prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se normalizan a `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete. OpenClaw lo utiliza para validar la configuración sin ejecutar el código del plugin.

```json
{
  "id": "my-plugin",
  "name": "Mi plugin",
  "description": "Añade las capacidades de Mi plugin a OpenClaw",
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

Para los plugins de canal, añada `channels` (y, para los plugins de proveedor, añada `providers`):

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

Las Skills y los paquetes de plugins utilizan comandos de publicación de ClawHub distintos. Para los paquetes de plugins, utilice el comando específico para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` es un comando distinto para publicar una carpeta de Skills, no un paquete de plugin. Consulte [Publicación en ClawHub](/es/clawhub/publishing).
</Note>

## Entrada de configuración

`setup-entry.ts` es una alternativa ligera a `index.ts` que OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de la configuración, inspección de canales deshabilitados):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado del entorno de ejecución (bibliotecas criptográficas, registros de la CLI, servicios en segundo plano) durante los flujos de configuración.

Los canales incluidos en el espacio de trabajo que mantienen exportaciones seguras para la configuración en módulos auxiliares pueden utilizar `defineBundledChannelSetupEntry(...)` de `openclaw/plugin-sdk/channel-entry-contract` en lugar de `defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación `runtime` opcional para que el cableado del entorno de ejecución durante la configuración pueda seguir siendo ligero y explícito.

<AccordionGroup>
  <Accordion title="Cuándo utiliza OpenClaw setupEntry en lugar de la entrada completa">
    - El canal está deshabilitado, pero necesita superficies de configuración o incorporación.
    - El canal está habilitado, pero no está configurado.
    - La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Qué debe registrar setupEntry">
    - El objeto del plugin de canal (mediante `defineSetupPluginEntry`).
    - Cualquier ruta HTTP necesaria antes de que el Gateway empiece a escuchar.
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

### Importaciones específicas de auxiliares de configuración

Para las rutas activas exclusivas de configuración, prefiera las interfaces específicas de auxiliares de configuración en lugar del módulo general `plugin-sdk/setup` cuando solo necesite una parte de la superficie de configuración:

| Ruta de importación                | Uso                                                                                      | Exportaciones principales                                                                                                                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | auxiliares del entorno de ejecución durante la configuración que siguen disponibles en `setupEntry` / el inicio diferido del canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | auxiliares de configuración/instalación de la CLI, archivos y documentación              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Utilice la interfaz más amplia `plugin-sdk/setup` cuando necesite el conjunto completo de herramientas compartidas de configuración, incluidos los auxiliares de modificación de la configuración, como `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utilice `createSetupTranslator(...)` para el texto fijo del asistente de configuración. Usa el primer valor no vacío de `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` y `LANG`, en ese orden, y después recurre al inglés. Establezca `OPENCLAW_LOCALE=en` para una sustitución explícita en inglés. Mantenga el texto de configuración específico del plugin en código propiedad del plugin y utilice las claves del catálogo compartido solo para etiquetas de configuración comunes, texto de estado y texto de configuración de plugins oficiales incluidos.

Los adaptadores de modificación de la configuración siguen siendo seguros al importarlos en rutas activas. La búsqueda de su superficie de contrato incluida para promover configuraciones de una sola cuenta es diferida, por lo que importar `plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficies de contrato incluidas antes de que se utilice realmente el adaptador.

### Campos de entrada de configuración propiedad del canal

`ChannelSetupInput` es un contenedor genérico compartido por los invocadores de configuración y los
plugins de canal. Sus campos tipados permanentemente son `name`, `token`, `tokenFile`,
`useEnv`, `allowFrom` y `defaultTo`. Pueden seguir existiendo claves adicionales propiedad del plugin
en el objeto de entrada del entorno de ejecución, pero el tipo compartido no declara una
firma de índice. Cada plugin debe declarar y restringir sus propios campos de configuración o
validarlos con un esquema propiedad del plugin en el límite del adaptador:

```typescript
import type { ChannelSetupAdapter, ChannelSetupInput } from "openclaw/plugin-sdk/channel-setup";

type AcmeSetupInput = ChannelSetupInput & {
  workspaceId?: string;
  webhookUrl?: string;
};

export const acmeSetupAdapter: ChannelSetupAdapter = {
  applyAccountConfig: ({ cfg, input }) => {
    const setupInput = input as AcmeSetupInput;
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        acme: {
          token: setupInput.token,
          workspaceId: setupInput.workspaceId,
          webhookUrl: setupInput.webhookUrl,
        },
      },
    };
  },
};
```

Los campos específicos del canal que anteriormente se declaraban directamente en
`ChannelSetupInput` siguen tipados temporalmente para mantener la compatibilidad con código fuente externo.
Están obsoletos. Una revisión del registro realizada el 2026-07-22 sobre 426 plugins
de canal publicados y externos al árbol eliminó 21 campos sin lectores y conservó 22 con lectores
conocidos. Cada campo conservado se elimina en cuanto ningún plugin publicado lo lee;
no se requiere ningún límite de versión. Los plugins nuevos e incluidos no deben depender de este
nivel; deben declarar localmente los campos que poseen.

### Promoción de una sola cuenta propiedad del canal

Cuando un canal actualiza una configuración de nivel superior para una sola cuenta a `channels.<id>.accounts.*`, el comportamiento compartido predeterminado mueve los valores promovidos específicos de la cuenta a `accounts.default`.

Cada plugin de canal puede ampliar o restringir esa promoción mediante su adaptador de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben trasladarse a la cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas claves se trasladan a la cuenta promovida; las claves compartidas de política y entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: permite elegir qué cuenta existente recibe los valores promovidos

La presencia de `singleAccountKeysToMove` indica que el contrato de promoción está completo. Declare el campo incluso cuando sea una matriz vacía para excluirse de la promoción de claves heredadas. Los adaptadores que omiten el campo conservan un nivel de promoción anterior a la declaración, respaldado por lectores, para los plugins ya publicados. La revisión del registro del 2026-07-22 eliminó 23 claves sin dependientes publicados y conservó seis claves comunes, además de la clave exclusiva de configuración `rooms`. Cada clave conservada se elimina en cuanto sus lectores publicados migran a las declaraciones; no se requiere ningún límite de versión.

Declare `openclaw.setupFeatures.configPromotion: true` en el manifiesto del paquete del plugin cuando el doctor deba cargar estas declaraciones desde el artefacto ligero de configuración incluido. La superficie del plugin exclusiva de configuración y el plugin de canal completo deben exponer las mismas declaraciones.

Al invocar `moveSingleAccountChannelSectionToDefaultAccount(...)` con un plugin ya resuelto, pase su adaptador de configuración como `setupSurface`. Las superficies de configuración proporcionadas por el invocador tienen prioridad sobre las búsquedas cargadas e incluidas, lo que mantiene a los plugins con alcance limitado o exclusivos de configuración independientes del registro global.

<Note>
Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta de Matrix con nombre, o si `defaultAccount` apunta a una clave no canónica existente, como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`.
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

Si ya crea el contrato como esquema JSON o TypeBox, utilice el auxiliar directo para que OpenClaw pueda omitir la conversión de Zod a esquema JSON en las rutas de metadatos:

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

Para los plugins de terceros, el contrato de ruta inactiva sigue siendo el manifiesto del plugin: replique el esquema JSON generado en `openclaw.plugin.json#channelConfigs` para que las superficies de esquema de configuración, configuración e interfaz de usuario puedan inspeccionar `channels.<id>` sin cargar el código del entorno de ejecución.

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

`ChannelSetupWizard` también admite `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más. Consulte `src/setup-core.ts` del plugin de Discord para ver un ejemplo completo incluido.

<AccordionGroup>
  <Accordion title="Solicitudes allowFrom compartidas">
    Para las solicitudes de listas de permitidos de mensajes directos que solo necesiten el flujo estándar `note -> prompt -> parse -> merge -> patch`, se recomienda usar los auxiliares de configuración compartidos de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` y `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Estado estándar de configuración del canal">
    Para los bloques de estado de configuración del canal que solo varían en las etiquetas, las puntuaciones y las líneas adicionales opcionales, se recomienda usar `createStandardChannelSetupStatus(...)` de `openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en cada plugin.
  </Accordion>
  <Accordion title="Superficie opcional de configuración del canal">
    Para las superficies de configuración opcionales que solo deben aparecer en determinados contextos, use `createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` también expone los generadores de nivel inferior `createOptionalChannelSetupAdapter(...)` y `createOptionalChannelSetupWizard(...)` cuando solo se necesita una parte de esa superficie de instalación opcional.

    El adaptador y el asistente opcionales generados rechazan de forma segura las escrituras reales de configuración. Reutilizan un único mensaje que indica que se requiere la instalación en `validateInput`, `applyAccountConfig` y `finalize`, y añaden un enlace a la documentación cuando se establece `docsPath`.

  </Accordion>
  <Accordion title="Auxiliares de configuración respaldados por binarios">
    Para las interfaces de configuración respaldadas por binarios, se recomienda usar los auxiliares delegados compartidos en lugar de copiar en cada canal el mismo código de integración de binarios y estados:

    - `createDetectedBinaryStatus(...)` para bloques de estado que solo varían en las etiquetas, las indicaciones, las puntuaciones y la detección de binarios
    - `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita delegar de forma diferida en un asistente completo más pesado
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

    Las especificaciones de paquetes simples se instalan desde npm durante la transición del lanzamiento, salvo que el nombre coincida con el identificador de un plugin incluido u oficial, en cuyo caso OpenClaw utiliza en su lugar esa copia local u oficial. Use `clawhub:`, `npm:`, `git:` o `npm-pack:` para seleccionar el origen de forma determinista; consulte [Gestionar plugins](/es/plugins/manage-plugins).

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
Para las instalaciones procedentes de npm, `openclaw plugins install` instala el paquete en un proyecto por plugin bajo `~/.openclaw/npm/projects` con los scripts del ciclo de vida deshabilitados (`--ignore-scripts`). Mantenga los árboles de dependencias de los plugins exclusivamente en JS/TS y evite paquetes que requieran compilaciones `postinstall`.
</Info>

<Note>
El inicio del Gateway no instala las dependencias de los plugins. Los flujos de instalación de npm, git y ClawHub se encargan de la convergencia de dependencias; los plugins locales deben tener ya instaladas sus dependencias.
</Note>

Los metadatos de los paquetes incluidos son explícitos; no se infieren del JavaScript compilado al iniciar el Gateway. Las dependencias de ejecución pertenecen al paquete del plugin que las gestiona; el inicio de OpenClaw empaquetado nunca repara ni replica las dependencias de los plugins.

## Temas relacionados

- [Creación de plugins](/es/plugins/building-plugins) — guía de introducción paso a paso
- [Manifiesto del plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
