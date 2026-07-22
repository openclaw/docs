---
read_when:
    - Está creando un plugin de OpenClaw
    - Necesita publicar un esquema de configuración de un plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del Plugin y del esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-07-22T10:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ddbd7e69e8988c8833b3f3c37b3c23683cccb03549b0175a55a1a27bc6787a5
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página trata sobre el **manifiesto nativo de Plugin de OpenClaw**, `openclaw.plugin.json`. Para conocer los diseños de paquetes compatibles (Codex, Claude, Cursor), consulte [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquetes compatibles utilizan sus propios archivos de manifiesto:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente esos diseños, pero no los valida con el esquema `openclaw.plugin.json` que aparece a continuación. Para un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de LSP de Claude y los paquetes de hooks compatibles, cuando el diseño coincide con las expectativas del entorno de ejecución de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar el código del Plugin**. Si el manifiesto falta o no es válido, se bloquea la validación de la configuración y se considera un error del Plugin.

Consulte [Plugins](/es/tools/plugin) para ver la guía completa del sistema de Plugins y [Modelo de capacidades](/es/plugins/architecture#public-capability-model) para conocer el modelo nativo de capacidades y las directrices actuales de compatibilidad externa.

## Función de este archivo

`openclaw.plugin.json` contiene metadatos que OpenClaw lee **antes de cargar el código del Plugin**. Todo su contenido debe poder inspeccionarse con un coste lo bastante bajo como para no tener que iniciar el entorno de ejecución del Plugin.

**Se utiliza para:**

- identidad del Plugin, validación de la configuración y sugerencias para la interfaz de configuración
- metadatos de autenticación, incorporación y configuración (alias, activación automática, variables de entorno del proveedor y opciones de autenticación)
- indicaciones de activación para las superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- enlaces de datos y verbos de acción de los widgets del panel
- metadatos del ejecutor de control de calidad que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal que se combinan en las superficies de catálogo y validación

**No se utiliza para:** registrar el comportamiento en tiempo de ejecución, declarar puntos de entrada de código ni especificar metadatos de instalación de npm. Estos elementos pertenecen al código del Plugin y a `package.json`.

## Ejemplo mínimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Ejemplo completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin del proveedor OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Clave de API de OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Clave de API de OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Clave de API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referencia de campos de nivel superior

| Campo                                | Obligatorio | Tipo                         | Qué significa                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí      | `string`                     | Id canónico del plugin. Este es el id utilizado en `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Sí      | `object`                     | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | No       | `string[]`                   | Ids de plugins que también deben estar instalados para que este plugin tenga efecto. El descubrimiento permite cargar el plugin, pero advierte cuando falta algún plugin obligatorio.                                                                                                               |
| `enabledByDefault`                   | No       | `true`                       | Marca un plugin incluido como habilitado de forma predeterminada. Omítalo o establezca cualquier valor distinto de `true` para dejar el plugin deshabilitado de forma predeterminada.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | No       | `string[]`                   | Marca un plugin incluido como habilitado de forma predeterminada solo en las plataformas de Node.js enumeradas, por ejemplo, `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                                                                                                   |
| `legacyPluginIds`                    | No       | `string[]`                   | Ids heredados que se normalizan a este id canónico de plugin.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No       | `string[]`                   | Ids de proveedores que deben habilitar automáticamente este plugin cuando se mencionen en referencias de autenticación, configuración o modelos.                                                                                                                                                                            |
| `kind`                               | No       | `PluginKind \| PluginKind[]` | Declara uno o más tipos exclusivos de plugin (`"memory"`, `"context-engine"`) utilizados por `plugins.slots.*`. Un plugin que posee ambos espacios declara ambos tipos en una sola matriz.                                                                                                    |
| `channels`                           | No       | `string[]`                   | Ids de canales pertenecientes a este plugin. Se utilizan para el descubrimiento y la validación de la configuración.                                                                                                                                                                                                |
| `providers`                          | No       | `string[]`                   | Ids de proveedores pertenecientes a este plugin.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | No       | `string`                     | Ruta del módulo ligero del catálogo de proveedores, relativa a la raíz del plugin, para los metadatos del catálogo de proveedores limitados al manifiesto que pueden cargarse sin activar todo el entorno de ejecución del plugin.                                                                                        |
| `modelSupport`                       | No       | `object`                     | Metadatos abreviados de familias de modelos pertenecientes al manifiesto, utilizados para cargar automáticamente el plugin antes del entorno de ejecución.                                                                                                                                                                                |
| `modelCatalog`                       | No       | `object`                     | Metadatos declarativos del catálogo de modelos para los proveedores pertenecientes a este plugin. Este es el contrato del plano de control para futuras listas de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el entorno de ejecución del plugin.                                                |
| `modelPricing`                       | No       | `object`                     | Política de consulta de precios externos perteneciente al proveedor. Utilícela para excluir a los proveedores locales o autoalojados de los catálogos de precios remotos o asignar referencias de proveedores a ids de catálogos de OpenRouter/LiteLLM sin codificar de forma rígida los ids de proveedores en el núcleo.                                                    |
| `modelIdNormalization`               | No       | `object`                     | Limpieza de alias o prefijos de ids de modelos perteneciente al proveedor que debe ejecutarse antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                                                  |
| `providerEndpoints`                  | No       | `object[]`                   | Metadatos de host/baseUrl del endpoint pertenecientes al manifiesto para las rutas de proveedores que el núcleo debe clasificar antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                   |
| `providerRequest`                    | No       | `object`                     | Metadatos ligeros de familia de proveedores y compatibilidad de solicitudes utilizados por la política genérica de solicitudes antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                     |
| `secretProviderIntegrations`         | No       | `Record<string, object>`     | Preajustes declarativos de proveedores de ejecución SecretRef que las superficies de configuración o instalación pueden ofrecer sin codificar de forma rígida integraciones específicas del proveedor en el núcleo.                                                                                                                            |
| `cliBackends`                        | No       | `string[]`                   | Ids de backends de inferencia de la CLI pertenecientes a este plugin. Se utilizan para la activación automática al iniciar a partir de referencias de configuración explícitas.                                                                                                                                                                |
| `syntheticAuthRefs`                  | No       | `string[]`                   | Referencias de proveedores o backends de la CLI cuyo hook de autenticación sintética perteneciente al plugin debe comprobarse durante el descubrimiento de modelos en frío antes de que se cargue el entorno de ejecución.                                                                                                                                     |
| `nonSecretAuthMarkers`               | No       | `string[]`                   | Valores de clave de API de marcador de posición pertenecientes a plugins incluidos que representan un estado de credenciales locales no secretas, de OAuth o del entorno.                                                                                                                                                       |
| `commandAliases`                     | No       | `object[]`                   | Nombres de comandos pertenecientes a este plugin que deben generar diagnósticos de configuración y de la CLI específicos del plugin antes de que se cargue el entorno de ejecución.                                                                                                                                                       |
| `providerUsageAuthEnvVars`           | No       | `Record<string, string[]>`   | Credenciales de proveedores únicamente para uso y facturación. OpenClaw utiliza estos nombres para el descubrimiento del uso y la eliminación de secretos, pero nunca para la autenticación de inferencia.                                                                                                                                  |
| `providerAuthAliases`                | No       | `Record<string, string>`     | Ids de proveedores que deben reutilizar otro id de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                                                                                                                 |
| `providerAuthChoices`                | No       | `object[]`                   | Metadatos ligeros de opciones de autenticación para los selectores de incorporación, la resolución del proveedor preferido y la conexión sencilla de indicadores de la CLI.                                                                                                                                                              |
| `activation`                         | No       | `object`                     | Metadatos ligeros del planificador de activación para la carga activada por el inicio, el proveedor, el comando, el canal, la ruta y la capacidad. Solo son metadatos; el entorno de ejecución del plugin sigue siendo responsable del comportamiento real.                                                                                              |
| `setup`                              | No       | `object`                     | Descriptores ligeros de configuración e incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el entorno de ejecución del plugin.                                                                                                                                                           |
| `qaRunners`                          | No       | `object[]`                   | Descriptores ligeros de ejecutores de control de calidad utilizados por el host compartido `openclaw qa` antes de que se cargue el entorno de ejecución del plugin.                                                                                                                                                                             |
| `dashboard`                          | No       | `object`                     | Enlaces de datos y verbos de acción de los widgets del panel. Cada entrada se valida con un método de Gateway registrado por este plugin con el ámbito de lectura o escritura requerido. Consulte la [referencia del panel](#dashboard-reference).                                                        |
| `contracts`                          | No       | `object`                     | Instantánea estática de la propiedad de capacidades para hooks de autenticación externos, incrustaciones, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, vídeos y música, obtención web, búsqueda web, proveedores de workers, extracción de documentos y contenido web, y propiedad de herramientas. |
| `configContracts`                    | No       | `object`                     | Comportamiento de configuración perteneciente al manifiesto que consumen los ayudantes genéricos del núcleo: detección de indicadores peligrosos, destinos de migración de SecretRef y restricción de rutas de configuración heredadas. Consulte la [referencia de configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Valores predeterminados económicos para la comprensión de contenido multimedia correspondientes a los identificadores de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de imágenes correspondientes a los identificadores de proveedores declarados en `contracts.imageGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                                                                                                         |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de vídeos correspondientes a los identificadores de proveedores declarados en `contracts.videoGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                                                                                                         |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de música correspondientes a los identificadores de proveedores declarados en `contracts.musicGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                                                                                                         |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos económicos de disponibilidad para las herramientas propiedad del plugin declaradas en `contracts.tools`. Úselos cuando una herramienta no deba cargar el entorno de ejecución a menos que existan pruebas de configuración, entorno o autenticación.                                                                                                  |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración de canales propiedad del manifiesto que se combinan en las superficies de detección y validación antes de que se cargue el entorno de ejecución.                                                                                                                                                                 |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                                                                                                    |
| `name`                               | No       | `string`                     | Nombre del plugin legible para las personas.                                                                                                                                                                                                                                                |
| `description`                        | No       | `string`                     | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | No       | `object`                     | Indicaciones opcionales de presentación para las superficies del catálogo de plugins. Estos metadatos no instalan ni habilitan un plugin, ni le conceden confianza.                                                                                                                                               |
| `icon`                               | No       | `string`                     | URL HTTPS de la imagen para las tarjetas del mercado o catálogo. ClawHub acepta cualquier URL `https://` válida y utiliza el icono predeterminado del plugin cuando se omite o no es válida.                                                                                                         |
| `version`                            | No       | `string`                     | Versión informativa del plugin.                                                                                                                                                                                                                                              |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de la interfaz de usuario, textos de marcador de posición e indicaciones de confidencialidad para los campos de configuración.                                                                                                                                                                                                          |

## referencia del panel

`dashboard` permite que un plugin habilitado exponga RPC existentes del Gateway a widgets del panel autorizados sin añadir políticas de plugins al núcleo. Los enlaces de datos deben especificar un método que el mismo plugin registre con `operator.read`; los verbos de acción deben especificar un método que registre con `operator.write`. Una discrepancia provoca el rechazo del plugin durante el registro.

```json
{
  "dashboard": {
    "dataBindings": [
      {
        "id": "items.list",
        "method": "example.items.list",
        "description": "Enumerar elementos de ejemplo."
      }
    ],
    "actionVerbs": [
      {
        "id": "refresh",
        "method": "example.items.refresh",
        "description": "Actualizar elementos de ejemplo.",
        "paramShape": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "force": { "type": "boolean" }
          }
        }
      }
    ]
  }
}
```

Los identificadores del manifiesto son locales al plugin. Las autorizaciones de widgets usan `<plugin-id>.<id>`, como `example.items.list` y `example.refresh`. Para que el espacio de nombres de autorizaciones persistentes no sea ambiguo, OpenClaw escapa `%` y `.` en el segmento del identificador del plugin como `%25` y `%2E`; los identificadores de plugins ordinarios conservan la forma natural. `paramShape` es un esquema JSON opcional que se aplica al objeto de parámetros de la acción antes de que OpenClaw invoque el RPC del plugin.

## referencia del catálogo

`catalog` proporciona indicaciones de visualización opcionales a los exploradores de plugins. Los hosts pueden ignorar estas indicaciones. Nunca instalan ni habilitan el plugin, ni cambian su comportamiento en tiempo de ejecución o su nivel de confianza.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | Qué significa                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Si las superficies del catálogo deben destacar este plugin.                       |
| `order`    | `number`  | Indicación de visualización ascendente entre los plugins seleccionados; los valores inferiores aparecen antes. |

## referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales de autenticación estáticas para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de que se cargue el entorno de ejecución del proveedor para que las herramientas del núcleo puedan determinar si un proveedor de generación está disponible sin importar todos los plugins de proveedores.

Estos campos deben usarse únicamente para datos declarativos que sean económicos de evaluar. El transporte, las transformaciones de solicitudes, la renovación de tokens, la validación de credenciales y el comportamiento de generación real permanecen en el entorno de ejecución del plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Cada entrada de metadatos admite:

| Campo                  | Obligatorio | Tipo       | Qué significa                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No       | `string[]` | Identificadores de proveedores adicionales que deben contar como alias de autenticación estáticos para el proveedor de generación.                                                       |
| `authProviders`        | No       | `string[]` | Identificadores de proveedores cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                                      |
| `configSignals`        | No       | `object[]` | Señales de disponibilidad económicas y basadas únicamente en la configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno.                 |
| `authSignals`          | No       | `object[]` | Señales de autenticación explícitas. Cuando están presentes, sustituyen el conjunto de señales predeterminado procedente del identificador del proveedor, `aliases` y `authProviders`.                     |
| `referenceAudioInputs` | No       | `boolean`  | Solo para generación de vídeo. Se establece en `true` cuando el proveedor acepta recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de audio de referencia. |

Cada entrada `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Qué significa                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí      | `string`   | Ruta con puntos al objeto de configuración propiedad del plugin que se inspeccionará, por ejemplo, `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | No       | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Se usa para configuraciones específicas de una capacidad, como `image`, `video` o `music`.   |
| `overlayMapPath` | No       | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse individualmente al objeto raíz. Se usa para mapas de cuentas con nombre, como `accounts`, donde cualquier cuenta configurada debe cumplir los requisitos. |
| `required`       | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y las matrices tampoco deben estar vacíos.                                                  |
| `requiredAny`    | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                    |
| `mode`           | No       | `object`   | Restricción opcional de modo de cadena dentro de la configuración efectiva. Se usa cuando la disponibilidad basada únicamente en la configuración se aplica solo a un modo.                                                                  |

Cada restricción `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.                          |
| `default`    | No       | `string`   | Valor del modo que se usará cuando la configuración omita la ruta.                                  |
| `allowed`    | No       | `string[]` | Si está presente, la señal se acepta solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No       | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.       |

Cada entrada `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string` | Identificador del proveedor que se comprobará en los perfiles de autenticación configurados.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Restricción opcional que hace que la señal cuente solo cuando el proveedor configurado al que se hace referencia usa una URL base permitida. Se usa cuando un alias de autenticación solo es válido para determinadas API. |

Cada restricción `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string`   | Identificador de configuración del proveedor cuyo `baseUrl` debe comprobarse.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL base que se supondrá cuando la configuración del proveedor omita `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sí      | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## referencia de metadatos de herramientas

`toolMetadata` usa las mismas estructuras `configSignals` y `authSignals` que los metadatos de proveedores de generación, con el nombre de la herramienta como clave. `contracts.tools` declara la propiedad. `toolMetadata` declara pruebas de disponibilidad económicas para que OpenClaw pueda evitar importar el entorno de ejecución de un plugin únicamente para que su fábrica de herramientas devuelva `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Las entradas `toolMetadata` también aceptan `optional` (marca la herramienta como no obligatoria para la activación del plugin) y `replaySafe` (marca la ejecución de la herramienta como segura para repetirla después de un turno incompleto del modelo), además de los campos compartidos `configSignals`/`authSignals` anteriores.

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de la herramienta coincide con la política. Para las herramientas de rutas críticas cuya fábrica depende de la autenticación o la configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para consultarlo.

## referencia de providerAuthChoices

Cada entrada `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw la lee antes de que se cargue el entorno de ejecución del proveedor. Las listas de configuración de proveedores usan estas opciones del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Significado                                                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | Id. del proveedor al que pertenece esta opción.                                                         |
| `method`              | Sí          | `string`                                                              | Id. del método de autenticación al que se delega.                                                       |
| `choiceId`            | Sí          | `string`                                                              | Id. estable de la opción de autenticación utilizado por los flujos de incorporación y de la CLI.        |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                    |
| `choiceHint`          | No          | `string`                                                              | Breve texto de ayuda para el selector.                                                                  |
| `icon`                | No          | URL HTTPS                                                             | Imagen que se muestra junto a esta opción en los clientes de incorporación compatibles.                 |
| `website`             | No          | URL HTTPS                                                             | Página del producto, de inicio de sesión o de instalación que muestran los clientes de incorporación compatibles. |
| `assistantPriority`   | No          | `number`                                                              | Los valores inferiores se ordenan antes en los selectores interactivos controlados por el asistente.    |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la opción de los selectores del asistente, pero permite seleccionarla manualmente en la CLI.     |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | Id. de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                 |
| `groupId`             | No          | `string`                                                              | Id. de grupo opcional para agrupar opciones relacionadas.                                               |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario correspondiente a ese grupo.                                           |
| `groupHint`           | No          | `string`                                                              | Breve texto de ayuda para el grupo.                                                                     |
| `onboardingFeatured`  | No          | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "Más...". |
| `optionKey`           | No          | `string`                                                              | Clave de opción interna para flujos de autenticación sencillos con una sola marca.                       |
| `cliFlag`             | No          | `string`                                                              | Nombre de la opción de la CLI, como `--openrouter-api-key`.                                                 |
| `cliOption`           | No          | `string`                                                              | Forma completa de la opción de la CLI, como `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | No          | `string`                                                              | Descripción utilizada en la ayuda de la CLI.                                                            |
| `appGuidedSecret`     | No          | `boolean`                                                             | Un secreto pegado junto con los valores predeterminados del proveedor basta para la configuración guiada por la aplicación. |
| `appGuidedDiscovery`  | No          | `boolean`                                                             | El método de autenticación en tiempo de ejecución correspondiente se encarga de la detección local de solo lectura mediante `appGuidedSetup`. |
| `appGuidedAuth`       | No          | `"oauth"` \| `"device-code"`                                          | Inicio de sesión interactivo propiedad del proveedor que los clientes de configuración nativos pueden representar de forma genérica. |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superficies de incorporación en las que debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

Cuando `appGuidedDiscovery` es verdadero, el método de autenticación del proveedor correspondiente debe exponer
`appGuidedSetup.detect` y `appGuidedSetup.prepare`. La detección debe ser
de solo lectura: no debe iniciar sesión, obtener modelos, descargar ni escribir la configuración. La preparación vuelve a comprobar
el modelo exacto seleccionado y devuelve una propuesta de configuración; OpenClaw prueba en vivo esa
propuesta de forma aislada y solo la confirma tras completarse correctamente.

## Referencia de commandAliases

Utilice `commandAliases` cuando un plugin sea propietario de un nombre de comando en tiempo de ejecución que los usuarios puedan incluir por error en `plugins.allow` o intentar ejecutar como comando raíz de la CLI. OpenClaw utiliza estos metadatos para los diagnósticos sin importar el código en tiempo de ejecución del plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Campo        | Obligatorio | Tipo              | Significado                                                           |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este plugin.                        |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando de barra diagonal del chat en lugar de un comando raíz de la CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de la CLI relacionado que se debe sugerir para las operaciones de la CLI, si existe. |

## Referencia de activación

Utilice `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control deben incluirlo en un plan de activación/carga.

Este bloque contiene metadatos del planificador, no es una API de ciclo de vida. No registra comportamiento en tiempo de ejecución, no sustituye a `register(...)` ni garantiza que el código del plugin ya se haya ejecutado. El planificador de activación utiliza estos campos para reducir el conjunto de plugins candidatos antes de recurrir a los metadatos de propiedad existentes en el manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks.

Prefiera los metadatos más específicos que ya describan la propiedad. Utilice `providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts` cuando esos campos expresen la relación. Utilice `activation` para indicaciones adicionales del planificador que no puedan representarse mediante esos campos de propiedad. Utilice `cliBackends` de nivel superior para alias de tiempo de ejecución de la CLI como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` solo se utiliza para los id. de harness de agente integrados que aún no tengan un campo de propiedad.

Cada plugin debe establecer `activation.onStartup` de forma intencionada. Establézcalo en `true` únicamente cuando el plugin deba ejecutarse durante el inicio del Gateway. Establézcalo en `false` cuando el plugin esté inactivo durante el inicio y solo deba cargarse mediante activadores más específicos. Omitir `onStartup` ya no carga implícitamente el plugin durante el inicio; utilice metadatos de activación explícitos para el inicio, el canal, la configuración, el harness del agente, la memoria u otros activadores de activación más específicos.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo              | Obligatorio | Tipo                                                 | Significado                                                                                                                                                                               |
| ------------------ | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No          | `boolean`                                            | Activación explícita durante el inicio del Gateway. Cada plugin debe establecerla. `true` importa el plugin durante el inicio; `false` mantiene su carga diferida durante el inicio, salvo que otro activador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Id. de proveedores que deben incluir este plugin en los planes de activación/carga.                                                                                                       |
| `onAgentHarnesses` | No          | `string[]`                                           | Id. de tiempo de ejecución de harnesses de agentes integrados que deben incluir este plugin en los planes de activación/carga. Utilice `cliBackends` de nivel superior para los alias de backend de la CLI. |
| `onCommands`       | No          | `string[]`                                           | Id. de comandos que deben incluir este plugin en los planes de activación/carga.                                                                                                          |
| `onChannels`       | No          | `string[]`                                           | Id. de canales que deben incluir este plugin en los planes de activación/carga.                                                                                                           |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deben incluir este plugin en los planes de activación/carga.                                                                                                           |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este plugin en los planes de inicio/carga cuando la ruta esté presente y no se haya desactivado explícitamente.               |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones generales de capacidades utilizadas por la planificación de activación del plano de control. Prefiera campos más específicos cuando sea posible.                              |

Consumidores activos actuales:

- La planificación del inicio del Gateway usa `activation.onStartup` para la importación explícita durante el inicio.
- La planificación de la CLI activada por comandos recurre a los valores heredados `commandAliases[].cliCommand` o `commandAliases[].name`.
- La planificación del inicio del entorno de ejecución del agente usa `activation.onAgentHarnesses` para arneses integrados y `cliBackends[]` de nivel superior para los alias del entorno de ejecución de la CLI.
- La planificación de la configuración o del canal activada por canales recurre a la propiedad heredada `channels[]` cuando faltan metadatos explícitos de activación del canal.
- La planificación de Plugins durante el inicio usa `activation.onConfigPaths` para superficies de configuración raíz no relacionadas con canales, como el bloque `browser` del Plugin de navegador incluido.
- La planificación de la configuración o del entorno de ejecución activada por proveedores recurre a la propiedad heredada `providers[]` y a la propiedad de nivel superior `cliBackends[]` cuando faltan metadatos explícitos de activación del proveedor.

Los diagnósticos del planificador pueden distinguir las indicaciones de activación explícitas del recurso alternativo basado en la propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que `activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el planificador usó en su lugar la propiedad `commandAliases`. Estas etiquetas de motivo se destinan a los diagnósticos del host y a las pruebas; los autores de Plugins deben seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Use `qaRunners` cuando un Plugin aporte uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantenga estos metadatos simples y estáticos; el entorno
de ejecución del Plugin sigue siendo responsable del registro real en la CLI mediante una superficie ligera
`runtime-api.ts` que exporta valores `qaRunnerCliRegistrations` coincidentes. Un
`adapterFactory` opcional expone el transporte a escenarios de control de calidad compartidos sin
cambiar el ejecutor del comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta el carril de control de calidad en vivo de Matrix respaldado por Docker contra un servidor doméstico desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Significado                                                      |
| ------------- | ----------- | -------- | ---------------------------------------------------------------- |
| `commandName` | Sí      | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo, `matrix`.    |
| `description` | No       | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando provisional. |

El identificador `adapterFactory` debe coincidir con `commandName`. No exporte registros
para comandos ausentes del manifiesto.

## Referencia de setup

Use `setup` cuando las superficies de configuración e incorporación necesiten metadatos simples propiedad del Plugin antes de que se cargue el entorno de ejecución.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "credenciales locales de openai"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

El valor `cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de la CLI. `setup.cliBackends` es la superficie de descriptores específica de la configuración para los flujos del plano de control y de configuración que deben basarse únicamente en metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda basada primero en descriptores para el descubrimiento de la configuración. Si el descriptor solo limita el Plugin candidato y la configuración aún necesita enlaces más completos del entorno de ejecución durante la configuración, establezca `requiresRuntime: true` y conserve `setup-api` como ruta de ejecución alternativa.

OpenClaw incluye `setup.providers[].envVars` en las búsquedas genéricas de autenticación de proveedores y variables de entorno. Coloque allí los metadatos de entorno de configuración y estado.

Use `providerUsageAuthEnvVars` cuando una credencial de facturación o de nivel de organización deba activar `resolveUsageAuth` sin convertirse en una credencial de inferencia. Estos nombres se incorporan al bloqueo de dotenv del espacio de trabajo, la eliminación en procesos secundarios de ACP, el filtrado de secretos del entorno aislado y la depuración general de secretos. El entorno de ejecución del proveedor sigue leyendo y clasificando el valor dentro de `resolveUsageAuth`.

OpenClaw también puede derivar opciones de configuración sencillas de `setup.providers[].authMethods` cuando no hay disponible ninguna entrada de configuración o cuando `setup.requiresRuntime: false` declara que el entorno de ejecución de configuración es innecesario. Las entradas explícitas `providerAuthChoices` siguen teniendo prioridad para etiquetas personalizadas, indicadores de la CLI, ámbito de incorporación y metadatos del asistente.

Establezca `requiresRuntime: false` únicamente cuando esos descriptores sean suficientes para la superficie de configuración. OpenClaw trata `false` explícito como un contrato basado únicamente en descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si un Plugin basado únicamente en descriptores sigue incluyendo una de esas entradas del entorno de ejecución de configuración, OpenClaw informa de un diagnóstico adicional y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento alternativo heredado para no interrumpir los Plugins existentes que añadieron descriptores sin el indicador.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del Plugin, los valores normalizados `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los Plugins descubiertos. La propiedad ambigua provoca un fallo cerrado en lugar de elegir un ganador según el orden de descubrimiento.

Cuando el entorno de ejecución de configuración se ejecuta, los diagnósticos del registro de configuración informan de divergencias respecto de los descriptores si `setup-api` registra un proveedor o backend de la CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro correspondiente en el entorno de ejecución. Estos diagnósticos son adicionales y no rechazan los Plugins heredados.

### Referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Significado                                                                                    |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`           | Sí      | `string`   | Identificador del proveedor expuesto durante la configuración o la incorporación. Mantenga los identificadores normalizados globalmente únicos.             |
| `authMethods`  | No       | `string[]` | Identificadores de métodos de configuración o autenticación que admite este proveedor sin cargar el entorno de ejecución completo.                       |
| `envVars`      | No       | `string[]` | Variables de entorno que las superficies genéricas de configuración y estado pueden comprobar antes de cargar el entorno de ejecución del Plugin.               |
| `authEvidence` | No       | `object[]` | Comprobaciones simples de pruebas de autenticación locales para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` se destina a marcadores de credenciales locales propiedad del proveedor que pueden verificarse sin cargar código del entorno de ejecución. Estas comprobaciones deben seguir siendo simples y locales: sin llamadas de red, lecturas de llaveros o gestores de secretos, comandos del shell ni sondeos de la API del proveedor.

Entradas de pruebas admitidas:

| Campo              | Obligatorio | Tipo       | Significado                                                                                                  |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sí      | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No       | `string`   | Variable de entorno que contiene una ruta explícita al archivo de credenciales.                                                           |
| `fallbackPaths`    | No       | `string[]` | Rutas de archivos de credenciales locales comprobadas cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No       | `string[]` | Al menos una de las variables de entorno enumeradas debe tener un valor no vacío para que la prueba sea válida.                                    |
| `requiresAllEnv`   | No       | `string[]` | Todas las variables de entorno enumeradas deben tener valores no vacíos para que la prueba sea válida.                                           |
| `credentialMarker` | Sí      | `string`   | Marcador no secreto devuelto cuando la prueba está presente.                                                       |
| `source`           | No       | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación o estado.                                                               |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Significado                                                                                       |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación.                                     |
| `cliBackends`      | No       | `string[]` | Identificadores de backend usados durante la configuración para la búsqueda basada primero en descriptores. Mantenga los identificadores normalizados globalmente únicos. |
| `configMigrations` | No       | `string[]` | Identificadores de migraciones de configuración propiedad de la superficie de configuración de este Plugin.                                          |
| `requiresRuntime`  | No       | `boolean`  | Indica si la configuración aún necesita ejecutar `setup-api` después de la búsqueda de descriptores.                            |

## Referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas indicaciones de representación. Las claves pueden usar puntos para campos de configuración anidados, pero ningún segmento de la ruta puede ser `__proto__`, `constructor` ni `prototype`; la configuración rechaza esos nombres.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave de API",
      "help": "Se usa para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada indicación de campo puede incluir:

| Campo          | Tipo             | Significado                                                                                                     |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`         | Etiqueta del campo visible para el usuario.                                                                                          |
| `help`         | `string`         | Texto de ayuda breve.                                                                                                |
| `tags`         | `string[]`       | Etiquetas opcionales de la interfaz de usuario.                                                                                                 |
| `advanced`     | `boolean`        | Marca el campo como avanzado.                                                                                      |
| `sensitive`    | `boolean`        | Marca el campo como secreto o confidencial.                                                                           |
| `placeholder`  | `string`         | Texto de marcador de posición para las entradas de formularios.                                                                                 |
| `presentation` | `"phone-number"` | Formato telefónico localizado solo para visualización de valores internacionales analizables (`+...`); los valores sin procesar no se modifican. |

## Referencia de contracts

Use `contracts` únicamente para metadatos estáticos de propiedad de capacidades que OpenClaw pueda leer sin importar el entorno de ejecución del Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista es opcional:

| Campo                            | Tipo       | Qué significa                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identificadores de fábricas de extensiones del servidor de aplicaciones de Codex, actualmente `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | Identificadores de entornos de ejecución para los que este plugin puede registrar middleware de resultados de herramientas.                                                                     |
| `trustedToolPolicies`            | `string[]` | Identificadores locales del plugin de políticas de confianza previas a las herramientas que puede registrar un plugin instalado. Los plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Identificadores de proveedores cuyo enlace de perfil de autenticación externa pertenece a este plugin.                                                                      |
| `embeddingProviders`             | `string[]` | Identificadores de proveedores generales de embeddings que pertenecen a este plugin para el uso reutilizable de embeddings vectoriales, incluida la memoria.                                 |
| `speechProviders`                | `string[]` | Identificadores de proveedores de voz que pertenecen a este plugin.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Identificadores de proveedores de transcripción en tiempo real que pertenecen a este plugin.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Identificadores de proveedores de voz en tiempo real que pertenecen a este plugin.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Identificadores obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este plugin.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Identificadores de proveedores de comprensión multimedia que pertenecen a este plugin.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Identificadores de proveedores de fuentes de transcripciones que pertenecen a este plugin.                                                                                     |
| `documentExtractors`             | `string[]` | Identificadores de proveedores de extracción de documentos (por ejemplo, PDF) que pertenecen a este plugin.                                                                  |
| `imageGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de imágenes que pertenecen a este plugin.                                                                                      |
| `videoGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de vídeo que pertenecen a este plugin.                                                                                      |
| `musicGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de música que pertenecen a este plugin.                                                                                      |
| `webContentExtractors`           | `string[]` | Identificadores de proveedores de extracción de contenido de páginas web que pertenecen a este plugin.                                                                           |
| `webFetchProviders`              | `string[]` | Identificadores de proveedores de obtención web que pertenecen a este plugin.                                                                                             |
| `webSearchProviders`             | `string[]` | Identificadores de proveedores de búsqueda web que pertenecen a este plugin.                                                                                            |
| `workerProviders`                | `string[]` | Identificadores de proveedores de trabajadores en la nube que pertenecen a este plugin para el aprovisionamiento y el ciclo de vida de arrendamientos respaldados por perfiles.                                      |
| `usageProviders`                 | `string[]` | Identificadores de proveedores cuyos enlaces de autenticación de uso e instantáneas de uso pertenecen a este plugin.                                                             |
| `migrationProviders`             | `string[]` | Identificadores de proveedores de importación que pertenecen a este plugin para `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Permiso reservado para rutas HTTP autenticadas de plugins que despachan métodos del Gateway dentro del proceso.                                  |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este plugin.                                                                                                   |

`contracts.embeddedExtensionFactories` se conserva para las fábricas de extensiones incluidas exclusivas del servidor de aplicaciones de Codex. En su lugar, las transformaciones incluidas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)`. Los plugins instalados pueden usar el mismo punto de integración de middleware únicamente cuando esté habilitado explícitamente y solo para los entornos de ejecución que declaren en `contracts.agentToolResultMiddleware`.

Los plugins instalados que necesiten el nivel de políticas de confianza del host previas a las herramientas deben declarar cada identificador local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente. Los plugins incluidos conservan la ruta existente de políticas de confianza, pero los plugins instalados con identificadores de políticas no declarados se rechazan antes del registro. Los identificadores de políticas están limitados al ámbito del plugin que los registra, por lo que dos plugins pueden declarar y registrar `workflow-budget`; un solo plugin no puede registrar dos veces el mismo identificador local.

Los registros del entorno de ejecución `api.registerTool(...)` deben coincidir con `contracts.tools`. El descubrimiento de herramientas utiliza esta lista para cargar únicamente los entornos de ejecución de plugins que pueden ser propietarios de las herramientas solicitadas.

Los plugins de proveedores que implementen `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los enlaces de autenticación externa no declarados se ignoran.

Los plugins de proveedores que implementen tanto `resolveUsageAuth` como `fetchUsageSnapshot` deben declarar cada identificador de proveedor descubierto automáticamente en `contracts.usageProviders`. El descubrimiento de uso lee este contrato antes de cargar el código del entorno de ejecución y, a continuación, verifica ambos enlaces después de cargar únicamente los propietarios declarados.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` para cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Utilice el contrato general para la generación reutilizable de vectores, incluidos los proveedores que consume la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta específica de memoria y se mantiene únicamente mientras los proveedores existentes migran al punto de integración genérico de proveedores de embeddings.

Los proveedores de trabajadores deben declarar cada identificador `api.registerWorkerProvider(...)` en `contracts.workerProviders`. El núcleo conserva la intención duradera antes de llamar a `provision`; los proveedores validan su configuración antes de la asignación externa, y las llamadas repetidas con el mismo identificador de operación deben adoptar el mismo arrendamiento. El núcleo también conserva esa instantánea de la configuración validada y la pasa con `leaseId` a `inspect({ leaseId, profile })` y `destroy({ leaseId, profile })`, incluso después de que el perfil especificado se modifique o elimine. La destrucción es idempotente, la inspección devuelve la unión cerrada de estados `active` / `destroyed` / `unknown`, y el material de claves privadas SSH se referencia únicamente mediante `SecretRef`. Los puntos de conexión SSH aprovisionados también deben incluir un `hostKey` público procedente de la salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario, para que el núcleo pueda fijar el host antes de conectarse. Los proveedores que generen referencias de identidad dinámicas pueden implementar el `resolveSshIdentity({ leaseId, profile, keyRef })` autoritativo; los proveedores que no lo tengan utilizan el solucionador de secretos genérico del núcleo. Un `unknown` autoritativo deja huérfano un registro local activo; después de una solicitud de destrucción conservada, confirma el desmantelamiento.

`contracts.gatewayMethodDispatch` acepta actualmente `"authenticated-request"`. Es una barrera de higiene de API para rutas HTTP nativas de plugins que despachan intencionadamente métodos del plano de control del Gateway dentro del proceso, no un entorno aislado contra plugins nativos maliciosos. Utilícelo únicamente para superficies incluidas o de operadores sometidas a una revisión rigurosa que ya requieran autenticación HTTP del Gateway. Una ruta con este permiso sigue siendo accesible mientras la admisión de trabajo raíz del Gateway está cerrada solo cuando también declara `auth: "gateway"` y el `gatewayRuntimeScopeSurface: "trusted-operator"` específico de la ruta; las rutas hermanas ordinarias del mismo plugin permanecen tras el límite de admisión. Esto mantiene accesibles el estado de suspensión y la reanudación sin conceder a todo el plugin una omisión de la admisión. Mantenga acotados el análisis y la conformación de respuestas fuera del despacho; el trabajo sustancial o con mutaciones debe pasar por el despacho de métodos del Gateway, que controla la admisión y la aplicación del ámbito.

## Referencia de configContracts

Utilice `configContracts` para el comportamiento de configuración propiedad del manifiesto que necesitan los auxiliares genéricos del núcleo sin importar el entorno de ejecución del plugin: detección de indicadores peligrosos, destinos de migración de SecretRef y restricción de rutas de configuración heredadas.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "routes.*.secret",
          "expected": "string",
          "ownerKind": "route"
        }
      ]
    }
  }
}
```

| Campo                         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                                          |
| ----------------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No       | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad de este plugin durante la configuración. Permite que las lecturas genéricas de configuración en tiempo de ejecución omitan todas las superficies de configuración de plugins cuando la configuración nunca hace referencia al plugin.                 |
| `compatibilityRuntimePaths`   | No       | `string[]` | Rutas de compatibilidad relativas a la raíz que este plugin puede atender durante la ejecución antes de que el código del plugin se active por completo. Utilícelo para superficies heredadas que deban restringir los conjuntos de candidatos incluidos sin importar todos los entornos de ejecución de plugins compatibles. |
| `dangerousFlags`              | No       | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando estén habilitados. Véase más adelante.                                                                                                                                   |
| `secretInputs`                | No       | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` para la migración de SecretRef, la auditoría, la materialización durante el inicio y el aislamiento opcional del propietario en tiempo de ejecución. Véase más adelante.                                                                             |

Cada entrada `dangerousFlags` admite:

| Campo    | Obligatorio | Tipo                                  | Qué significa                                                                                                       |
| -------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sí      | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapas/matrices. |
| `equals` | Sí      | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                            |

`secretInputs` admite:

| Campo                   | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No       | `boolean`  | Anula la habilitación predeterminada del plugin incluido al decidir si esta superficie SecretRef está activa. Se utiliza cuando el plugin está incluido, pero la superficie debe permanecer inactiva hasta que se habilite explícitamente en la configuración.                                                                                                                                            |
| `paths`                 | Sí      | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`), `expected` opcional (actualmente solo `"string"`) y `ownerKind` opcional (actualmente solo `"route"`). Un propietario declarado aísla únicamente esa ruta coincidente exacta cuando falla la resolución; su id de propietario es la ruta de configuración completa. |

## Referencia de mediaUnderstandingProviderMetadata

Utilice `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tenga modelos predeterminados, prioridad de respaldo de autenticación automática o compatibilidad nativa con documentos que los auxiliares genéricos del núcleo necesiten antes de cargar el entorno de ejecución. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Cada entrada de proveedor puede incluir:

| Campo                  | Tipo                                                             | Qué significa                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Capacidades multimedia expuestas por este proveedor.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados de capacidad a modelo utilizados cuando la configuración no especifica un modelo.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan antes para el respaldo automático de proveedores basado en credenciales.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documentos nativas admitidas por el proveedor.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sustituciones de modelos por tipo de documento. Establezca `image: false` para deshabilitar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Utilice `channelConfigs` cuando un plugin de canal necesite metadatos de configuración de bajo coste antes de cargar el entorno de ejecución. La detección de configuración/estado del canal de solo lectura puede utilizar estos metadatos directamente para canales externos configurados cuando no haya ninguna entrada de configuración disponible o cuando `setup.requiresRuntime: false` declare que el entorno de ejecución de configuración es innecesario.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando las instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué plugin posee ese canal configurado antes de que se ejecute el código del entorno de ejecución del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaren `channels[]` también deben declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el plugin, pero el esquema de configuración de la ruta fría, la configuración y las superficies de la interfaz de control no pueden conocer la forma de las opciones propiedad del canal ni las indicaciones de interfaz destinadas únicamente a la visualización hasta que se ejecute el entorno de ejecución del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos de `auto` para las comprobaciones de configuración de comandos que se ejecutan antes de cargar el entorno de ejecución del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con los demás metadatos del catálogo de canales propiedad de su paquete.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL del servidor doméstico",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexión al servidor doméstico de Matrix",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo         | Tipo                     | Qué significa                                                                                                    |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada.                                |
| `uiHints`     | `Record<string, object>` | Etiquetas, marcadores de posición, sensibilidad e indicaciones opcionales de presentación destinadas únicamente a la visualización para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal combinada en las superficies de selección e inspección cuando los metadatos del entorno de ejecución no están listos.                        |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                                                      |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos para comandos y Skills nativos en las comprobaciones de configuración previas al entorno de ejecución.                              |
| `preferOver`  | `string[]`               | Id. de plugins heredados o de menor prioridad que este canal debe superar en las superficies de selección.                           |

### Sustitución de otro plugin de canal

Utilice `preferOver` cuando su plugin sea el propietario preferido de un id. de canal que también pueda proporcionar otro plugin. Los casos habituales son un id. de plugin renombrado, un plugin independiente que sustituye a uno incluido o una bifurcación mantenida que conserva el mismo id. de canal por compatibilidad de configuración.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Cuando se configura `channels.chat`, OpenClaw tiene en cuenta tanto el id. del canal como el id. del plugin preferido. Si el plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración efectiva del entorno de ejecución para que un único plugin sea propietario del canal y sus herramientas. La selección explícita del usuario sigue prevaleciendo: si el usuario habilita explícitamente ambos plugins (mediante `plugins.allow` o una configuración `plugins.entries` sustancial), OpenClaw conserva esa elección e informa de diagnósticos de duplicación de canales/herramientas en lugar de cambiar silenciosamente el conjunto de plugins solicitado.

Limite `preferOver` a los id. de plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general ni cambia el nombre de las claves de configuración del usuario.

## Referencia de modelSupport

Utilice `modelSupport` cuando OpenClaw deba inferir el plugin de proveedor a partir de id. abreviados de modelos como `gpt-5.6-sol` o `claude-sonnet-4.6` antes de cargar el entorno de ejecución del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas a `provider/model` utilizan los metadatos del manifiesto `providers` propietario
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si coinciden un plugin no incluido y uno incluido, prevalece el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos que se comparan mediante `startsWith` con los id. abreviados de modelos.                 |
| `modelPatterns` | `string[]` | Fuentes de expresiones regulares comparadas con los id. abreviados de modelos tras eliminar el sufijo del perfil. |

Las entradas `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contienen repeticiones anidadas (por ejemplo, `(a+)+$`). Los patrones que no superan la comprobación de seguridad se omiten silenciosamente, al igual que las expresiones regulares sintácticamente no válidas. Mantenga los patrones simples y evite los cuantificadores anidados.

## Referencia de modelCatalog

Utilice `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de cargar el entorno de ejecución del plugin. Esta es la fuente propiedad del manifiesto para filas fijas del catálogo, alias de proveedores, reglas de supresión y modo de detección. La actualización durante la ejecución sigue perteneciendo al código del entorno de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo se requiere el entorno de ejecución.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campos de nivel superior:

| Campo            | Tipo                                                     | Significado                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas del catálogo para los identificadores de proveedor propiedad de este plugin. Las claves también deben aparecer en `providers` de nivel superior.       |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedores que deben resolverse a un proveedor propio para la planificación del catálogo o de supresiones.              |
| `suppressions`   | `object[]`                                               | Filas de modelos de otra fuente que este plugin suprime por un motivo específico del proveedor.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica si el catálogo del proveedor puede leerse desde los metadatos del manifiesto, actualizarse en la caché o requiere el entorno de ejecución. |
| `runtimeAugment` | `boolean`                                                | Se establece en `true` únicamente cuando el entorno de ejecución del proveedor debe añadir filas al catálogo después de planificar el manifiesto o la configuración.       |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación del catálogo de modelos. Los destinos de los alias deben ser proveedores de nivel superior propiedad del mismo plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar las anulaciones de API y URL base del alias sin cargar el entorno de ejecución del proveedor. Los alias no amplían los listados del catálogo sin filtrar; las listas generales solo emiten las filas del proveedor canónico propietario.

`suppressions` sustituye el antiguo enlace `suppressBuiltInModel` del entorno de ejecución del proveedor. Las entradas de supresión solo se respetan cuando el proveedor es propiedad del plugin o se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los enlaces de supresión del entorno de ejecución ya no se invocan durante la resolución del modelo.

Campos del proveedor:

| Campo                 | Tipo                     | Significado                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base predeterminada opcional para los modelos de este catálogo de proveedor.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos de este catálogo de proveedor.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Identificador opcional de un modelo pequeño recomendado por el proveedor para tareas de utilidad internas breves (títulos, narración del progreso). Se usa cuando `agents.defaults.utilityModel` no está definido y este proveedor sirve el modelo principal del agente. |
| `models`              | `object[]`               | Filas de modelos obligatorias. Se ignoran las filas que no tengan un `id`.                                                                                                                                                            |

Campos del modelo:

| Campo              | Tipo                                                           | Significado                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Identificador de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`             | `string`                                                       | Nombre para mostrar opcional.                                                      |
| `api`              | `ModelApi`                                                     | Anulación opcional de la API por modelo.                                            |
| `baseUrl`          | `string`                                                       | Anulación opcional de la URL base por modelo.                                       |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Los demás valores se descartan silenciosamente.            |
| `reasoning`        | `boolean`                                                      | Indica si el modelo ofrece comportamiento de razonamiento.                               |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens`    | `number`                                                       | Límite de contexto efectivo opcional del entorno de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Máximo de tokens de salida cuando se conoce.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Anulaciones opcionales del identificador del modelo o de los parámetros para cada nivel de razonamiento.                    |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`           | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de la configuración de modelos de OpenClaw.  |
| `mediaInput`       | `object`                                                       | Configuración de entrada opcional por modalidad, actualmente solo para imágenes.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprima únicamente cuando la fila no deba aparecer en absoluto.          |
| `statusReason`     | `string`                                                       | Motivo opcional que se muestra con un estado de no disponibilidad.                            |
| `replaces`         | `string[]`                                                     | Identificadores de modelos locales del proveedor más antiguos a los que este modelo sustituye.                       |
| `replacedBy`       | `string`                                                       | Identificador del modelo local del proveedor que sustituye a las filas obsoletas.                    |
| `tags`             | `string[]`                                                     | Etiquetas estables usadas por los selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Significado                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identificador del proveedor de la fila ascendente que se debe suprimir. Debe ser propiedad de este plugin o estar declarado como un alias propio. |
| `model`                    | `string`   | Identificador del modelo local del proveedor que se debe suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional que se muestra cuando se solicita directamente la fila suprimida.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de la URL base del proveedor necesarios para aplicar la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos `api` de la configuración del proveedor necesarios para aplicar la supresión.              |

No coloque datos exclusivos del entorno de ejecución en `modelCatalog`. Use `static` únicamente cuando las filas del manifiesto sean lo bastante completas como para que las listas filtradas por proveedor y las superficies de selección puedan omitir la detección del registro o del entorno de ejecución. Use `refreshable` cuando las filas del manifiesto sean semillas o complementos útiles que se puedan listar, pero una actualización o caché pueda añadir más filas posteriormente; las filas actualizables no son autoritativas por sí mismas. Use `runtime` cuando OpenClaw deba cargar el entorno de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Use `modelIdNormalization` para la normalización sencilla de identificadores de modelos propiedad del proveedor que debe realizarse antes de cargar el entorno de ejecución del proveedor. Esto mantiene los alias, como los nombres cortos de modelos, los identificadores locales heredados del proveedor y las reglas de prefijos de proxy, en el manifiesto del plugin propietario en lugar de en las tablas principales de selección de modelos.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Campos del proveedor:

| Campo                                | Tipo                    | Qué significa                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exactos de identificadores de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefijos que se deben eliminar antes de buscar el alias, útiles para la duplicación heredada de proveedor/modelo.     |
| `prefixWhenBare`                     | `string`                | Prefijo que se debe añadir cuando el identificador de modelo normalizado aún no contiene `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijos para identificadores simples después de buscar el alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Use `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes debe conocer antes de que se cargue el entorno de ejecución del proveedor. El núcleo sigue definiendo el significado de cada `endpointClass`; los manifiestos de los plugins definen los metadatos del host y de la URL base.

Los plugins de proveedores externalizados oficialmente se excluyen de la distribución del núcleo, por lo que
sus manifiestos no son visibles hasta que se instalan. Sus `providerEndpoints` también deben
reflejarse en `scripts/lib/official-external-provider-catalog.json` para que
la clasificación de endpoints siga funcionando sin el plugin; una prueba de contrato
garantiza que se mantenga esta correspondencia.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase conocida de endpoint del núcleo, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Añada el prefijo `.` para hacer coincidir únicamente sufijos de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                             |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se debe eliminar de los hosts coincidentes para obtener el prefijo de región de Google Vertex.                 |

## Referencia de providerRequest

Use `providerRequest` para los metadatos económicos de compatibilidad de solicitudes que necesita la política genérica de solicitudes sin cargar el entorno de ejecución del proveedor. Mantenga la reescritura de cargas útiles específica del comportamiento en los hooks del entorno de ejecución del proveedor o en los ayudantes compartidos de la familia de proveedores.

```json
{
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Campos del proveedor:

| Campo                 | Tipo         | Qué significa                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etiqueta de familia del proveedor que se utiliza en las decisiones genéricas de compatibilidad de solicitudes y en los diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de la familia del proveedor para ayudantes de solicitudes compartidos.              |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completado compatibles con OpenAI; actualmente, `supportsStreamingUsage`.       |

## Referencia de secretProviderIntegrations

Use `secretProviderIntegrations` cuando un plugin pueda publicar un preajuste reutilizable de proveedor exec de SecretRef. OpenClaw lee estos metadatos antes de cargar el entorno de ejecución del plugin, almacena la propiedad del plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución real de secretos al entorno de ejecución de SecretRef. Los preajustes solo se exponen para los plugins incluidos y los plugins instalados detectados en las raíces administradas de instalación de plugins, como las instalaciones desde git y ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

La clave del mapa es el identificador de la integración. Si se omite `providerAlias`, OpenClaw utiliza el identificador de la integración como alias del proveedor de SecretRef. Los alias de proveedores deben coincidir con el patrón normal de alias de proveedores de SecretRef, por ejemplo, `team-secrets` o `onepassword-work`.

Cuando un operador selecciona el preajuste, OpenClaw escribe una referencia de proveedor como esta:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Al iniciar o recargar, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del plugin, comprobando que el plugin propietario esté instalado y activo, y materializando el comando exec a partir del manifiesto. Deshabilitar o eliminar el plugin revoca el proveedor para las referencias de SecretRef activas. Los operadores que quieran una configuración exec independiente aún pueden escribir directamente proveedores manuales `command`/`args`.

Actualmente solo se admiten preajustes `source: "exec"`. `command` debe ser `${node}`, y `args[0]` debe ser un script de resolución `./` relativo a la raíz del plugin. OpenClaw lo materializa al iniciar o recargar usando el ejecutable actual de Node y la ruta absoluta del script dentro del plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de preajustes del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar directamente proveedores exec manuales independientes.

OpenClaw deriva `trustedDirs` para los preajustes del manifiesto a partir de la raíz del plugin y, en el caso de los preajustes `${node}`, del directorio del ejecutable actual de Node. Los `trustedDirs` definidos en el manifiesto se ignoran. Otras opciones del proveedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, se transfieren a la configuración normal del proveedor exec de SecretRef.

## Referencia de modelPricing

Use `modelPricing` cuando un proveedor necesite controlar el comportamiento de precios del plano de control antes de que se cargue el entorno de ejecución. La caché de precios del Gateway lee estos metadatos sin importar el código del entorno de ejecución del proveedor.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Campos del proveedor:

| Campo        | Tipo              | Qué significa                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Establezca `false` para los proveedores locales o autoalojados que nunca deben obtener precios de OpenRouter ni de LiteLLM. |
| `openRouter` | `false \| object` | Asignación para la consulta de precios de OpenRouter. `false` deshabilita la consulta de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación para la consulta de precios de LiteLLM. `false` deshabilita la consulta de LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identificador del proveedor del catálogo externo cuando difiere del identificador del proveedor de OpenClaw, por ejemplo, `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los identificadores de modelo que contienen barras como referencias anidadas de proveedor/modelo, lo que resulta útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de identificadores de modelo del catálogo externo. `version-dots` prueba identificadores de versión con puntos, como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw contiene metadatos preliminares gestionados por OpenClaw para proveedores cuyos plugins quizá todavía no estén instalados. No forma parte del manifiesto de un plugin. Los manifiestos de los plugins siguen siendo la fuente de autoridad para los plugins instalados. El Índice de proveedores es el contrato interno de respaldo que usarán las futuras interfaces de proveedores instalables y de selección de modelos previa a la instalación cuando un plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. Manifiesto `modelCatalog` del plugin instalado.
3. Caché del catálogo de modelos procedente de una actualización explícita.
4. Filas preliminares del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estados de activación, hooks del entorno de ejecución ni datos de modelos específicos de cuentas activas. Sus catálogos preliminares utilizan la misma forma de fila de proveedor `modelCatalog` que los manifiestos de plugins, pero deben limitarse a metadatos de presentación estables, salvo que los campos del adaptador del entorno de ejecución, como `api`, `baseUrl`, los precios o los indicadores de compatibilidad, se mantengan alineados intencionadamente con el manifiesto del plugin instalado. Los proveedores con detección activa mediante `/models` deben escribir las filas actualizadas mediante la ruta explícita de la caché del catálogo de modelos, en lugar de hacer que el listado normal o la incorporación llamen a las API de los proveedores.

Las entradas del Índice de proveedores también pueden incluir metadatos de plugins instalables para proveedores cuyo plugin se haya extraído del núcleo o todavía no esté instalado por cualquier otro motivo. Estos metadatos siguen el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación de npm, la integridad esperada y las etiquetas sencillas de opciones de autenticación bastan para mostrar una opción de configuración instalable. Una vez instalado el plugin, prevalece su manifiesto y se ignora la entrada del Índice de proveedores correspondiente a ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves de capacidades heredadas del nivel superior del manifiesto a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas claves —ni ninguna otra lista de capacidades— se lee ya como campo del nivel superior del manifiesto; la carga normal del manifiesto solo las reconoce dentro de `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                   | Uso                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detección, validación de la configuración, metadatos de opciones de autenticación e indicaciones de la interfaz que deben existir antes de ejecutar el código del plugin                         |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` utilizado para puntos de entrada, restricciones de instalación, configuración o metadatos del catálogo |

Si no se sabe con certeza dónde corresponde un metadato, use esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del plugin, colóquelo en `openclaw.plugin.json`
- si se refiere al empaquetado, los archivos de entrada o el comportamiento de instalación de npm, colóquelo en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugins previos a la ejecución residen intencionadamente en `package.json`, dentro del bloque `openclaw`, en lugar de `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugins de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` junto con los campos `package.json#openclaw` compatibles que se indican a continuación.

Ejemplos importantes:

| Campo                                                                                      | Significado                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara los puntos de entrada de plugins nativos. Deben permanecer dentro del directorio del paquete del plugin.                                                                                                        |
| `openclaw.runtimeExtensions`                                                               | Declara los puntos de entrada del entorno de ejecución JavaScript compilado para los paquetes instalados. Deben permanecer dentro del directorio del paquete del plugin.                                                                      |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero exclusivo para la configuración, utilizado durante la incorporación, el inicio diferido de canales y el descubrimiento de estados de canal de solo lectura o SecretRef. Debe permanecer dentro del directorio del paquete del plugin.      |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para los paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del plugin.                              |
| `openclaw.channel`                                                                         | Metadatos económicos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                      |
| `openclaw.channel.approvalFlags`                                                           | Indicadores de comportamiento de aprobación cerrada disponibles antes de cargar el entorno de ejecución. `native` significa que el canal controla la interfaz de aprobación nativa y la resolución en el mismo turno.                                                |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de valores predeterminados automáticos de comandos y Skills nativos que utilizan las superficies de configuración, auditoría y lista de comandos antes de cargar el entorno de ejecución del canal.                                               |
| `openclaw.channel.cliAddOptions`                                                           | Opciones `openclaw channels add` controladas por el plugin. Cada entrada declara `flags`, `description`, `defaultValue` opcional y `valueType` opcional (`int` o `list`) para la coerción genérica de entradas. |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador del estado configurado que pueden responder «¿ya existe una configuración basada únicamente en el entorno?» sin cargar el entorno de ejecución completo del canal.                                              |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder «¿ya hay alguna sesión iniciada?» sin cargar el entorno de ejecución completo del canal.                                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación y actualización para plugins incluidos y publicados externamente.                                                                                                                        |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                       |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host OpenClaw, mediante un límite inferior de semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                  |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo de la API de plugins de OpenClaw que requiere este paquete, mediante un límite inferior de semver como `>=2026.5.27`.                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad de distribución de npm esperada, como `sha512-...`; los flujos de instalación y actualización verifican con ella el artefacto obtenido.                                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta limitada de recuperación mediante reinstalación de un plugin incluido cuando la configuración no es válida.                                                                                                            |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando sus restricciones de plataforma del archivo de bloqueo coincidan con el host actual.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies de canal del entorno de ejecución de configuración se carguen antes de la escucha y, después, pospone el plugin de canal configurado completo hasta la activación posterior a la escucha.                                                      |

Los metadatos del manifiesto determinan qué opciones de proveedor, canal y configuración aparecen durante la incorporación antes de cargar el entorno de ejecución. `package.json#openclaw.install` indica al proceso de incorporación cómo obtener o habilitar ese plugin cuando se elige una de esas opciones. No mueva las indicaciones de instalación a `openclaw.plugin.json`.

Para `openclaw.channel.cliAddOptions`, utilice la sintaxis de opciones largas de Commander, como `--initial-sync-limit <n>`. Establezca `valueType: "int"` para analizar un entero no negativo o `valueType: "list"` para dividir entradas delimitadas por comas, puntos y comas o saltos de línea en cadenas antes de que el adaptador de configuración del plugin las reciba. Omita `valueType` para pasar sin cambios el valor analizado por Commander.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de plugins no incluidas. Los valores no válidos se rechazan; los valores válidos pero más recientes hacen que los plugins externos se omitan en hosts antiguos. Se presupone que los plugins de fuente incluidos tienen la misma versión que el checkout del host.

`openclaw.install.requiredPlatformPackages` está destinado a paquetes npm que exponen los binarios nativos necesarios mediante alias opcionales específicos de cada plataforma. Indique el nombre básico del paquete npm para cada alias de plataforma compatible. Durante la instalación de npm, OpenClaw solo verifica el alias declarado cuyas restricciones del archivo de bloqueo coinciden con el host actual. Si npm informa de que la operación se completó correctamente, pero omite ese alias, OpenClaw vuelve a intentarlo una vez con una caché nueva y revierte la instalación si el alias sigue ausente.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no incluidas. Utilícelo para indicar el límite inferior de la API del SDK o del entorno de ejecución de plugins de OpenClaw con el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de plugin necesita una API más reciente, pero conserva una indicación de instalación inferior para otros flujos. De forma predeterminada, la sincronización oficial de versiones de OpenClaw eleva los límites inferiores existentes de la API de los plugins oficiales a la versión de OpenClaw, pero las versiones exclusivas de plugins pueden conservar un límite inferior cuando el paquete admite intencionadamente hosts antiguos. No utilice únicamente la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` sigue siendo un metadato del paquete npm; OpenClaw utiliza el contrato `openclaw.compat.pluginApi` para tomar decisiones sobre la compatibilidad de la instalación.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el plugin se publica en ClawHub; el proceso de incorporación lo considera la fuente remota preferida y registra los datos del artefacto de ClawHub tras la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad para los paquetes que todavía no se han trasladado a ClawHub.

La fijación exacta de versiones de npm ya reside en `npmSpec`, por ejemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo deben asociar las especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen de forma cerrada si el artefacto de npm obtenido deja de coincidir con la versión fijada. Para mantener la compatibilidad, el proceso de incorporación interactivo sigue ofreciendo especificaciones de npm de registros de confianza, incluidos nombres de paquetes básicos y etiquetas de distribución. Los diagnósticos del catálogo pueden distinguir entre fuentes exactas, flotantes, fijadas por integridad, sin integridad, con discrepancias en el nombre del paquete y de elección predeterminada no válida. También advierten cuando `expectedIntegrity` está presente, pero no hay ninguna fuente de npm válida que pueda fijar. Cuando `expectedIntegrity` está presente, los flujos de instalación y actualización lo aplican; cuando se omite, la resolución del registro se almacena sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando los análisis de estado, lista de canales o SecretRef necesiten identificar las cuentas configuradas sin cargar el entorno de ejecución completo. La entrada de configuración debe exponer los metadatos del canal, además de los adaptadores de configuración, estado y secretos seguros para la configuración; mantenga los clientes de red, los escuchadores del Gateway y los entornos de ejecución de transporte en el punto de entrada principal de la extensión.

Los campos de puntos de entrada del entorno de ejecución no anulan las comprobaciones de límites del paquete aplicadas a los campos de puntos de entrada del código fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable una ruta `openclaw.extensions` que escape del paquete.

`openclaw.install.allowInvalidConfigRecovery` tiene un alcance intencionadamente limitado. No permite instalar configuraciones dañadas arbitrarias. Actualmente solo permite que los flujos de instalación se recuperen de determinados errores de actualización obsoletos de plugins incluidos, como una ruta ausente de un plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y remiten a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es un metadato de paquete para un pequeño módulo comprobador:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Utilícelo cuando los flujos de configuración, doctor, estado o presencia de solo lectura necesiten una comprobación sencilla de sí o no sobre la autenticación antes de cargar el plugin de canal completo. El estado de autenticación persistido no es el estado configurado del canal: no utilice estos metadatos para habilitar plugins automáticamente, reparar dependencias del entorno de ejecución ni decidir si debe cargarse el entorno de ejecución de un canal. La exportación de destino debe ser una función pequeña que solo lea el estado persistido; no la encamine a través del barrel completo del entorno de ejecución del canal.

`openclaw.channel.configuredState` permite realizar comprobaciones económicas de la configuración. Prefiera los metadatos declarativos del entorno cuando las variables de entorno sean suficientes:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Utilice `env.allOf` cuando se requieran todas las variables indicadas y `env.anyOf` cuando baste con cualquier variable que no esté vacía. Si una comprobación pequeña ajena al entorno de ejecución necesita más que metadatos del entorno, utilice `specifier` junto con `exportName`, como se muestra para `persistedAuthState`; cuando `env` está presente, OpenClaw lo utiliza sin cargar ese módulo. Si la comprobación necesita la resolución completa de la configuración o el entorno de ejecución real del canal, mantenga esa lógica en el hook `config.hasConfiguredState` del plugin.

## Precedencia del descubrimiento (identificadores de plugin duplicados)

OpenClaw detecta plugins desde tres raíces, comprobadas en este orden: los plugins incluidos que se distribuyen con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), además de cualquier entrada explícita de `plugins.load.paths`.

Si dos elementos detectados comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él. Precedencia, de mayor a menor:

1. **Seleccionado mediante configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el seguimiento de instalaciones de OpenClaw reconoce para ese mismo id, incluso cuando el id también pertenece a un plugin incluido
3. **Incluido** — plugins distribuidos con OpenClaw
4. **Espacio de trabajo** — plugins detectados en relación con el espacio de trabajo actual
5. Cualquier otro candidato detectado

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido que se encuentre sin rastrear en el espacio de trabajo o en la raíz global no sustituirá la compilación incluida.
- Para sustituir un plugin incluido, ejecute `openclaw plugin install` para ese id de modo que la instalación global rastreada tenga precedencia sobre la copia incluida, o fije una ruta específica mediante `plugins.entries.<id>` para que prevalezca por la precedencia de selección mediante configuración.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las sustituciones de duplicados seleccionadas mediante configuración se describen como sustituciones explícitas en los diagnósticos, pero aun así generan una advertencia para que las bifurcaciones obsoletas y las sustituciones accidentales sigan siendo visibles.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un JSON Schema**, incluso si no acepta ninguna configuración.
- Se admite un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer o escribir la configuración, no durante la ejecución.
- Al ampliar o bifurcar un plugin incluido con nuevas claves de configuración, actualice al mismo tiempo el `openclaw.plugin.json` `configSchema` de ese plugin. Los esquemas de los plugins incluidos son estrictos, por lo que añadir `plugins.entries.<id>.config.myNewKey` a la configuración del usuario sin añadir `myNewKey` a `configSchema.properties` se rechazará antes de que se cargue el entorno de ejecución del plugin.

Ejemplo de ampliación del esquema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Comportamiento de validación

- Las claves desconocidas de `channels.*` son **errores**, salvo que el id del canal esté declarado por el manifiesto de un plugin. Si el mismo id también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin al que se hace referencia, pero que no puede detectarse en ese momento), OpenClaw lo rebaja a una **advertencia**.
- Las referencias de `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` a ids de plugins desconocidos son **advertencias** ("se ignoró una entrada de configuración obsoleta"), no errores, para que las actualizaciones y los plugins eliminados o renombrados no impidan el inicio del Gateway.
- Una referencia de `plugins.slots.memory` a un id de plugin desconocido es un **error**, excepto en el caso del plugin externo oficial conocido `memory-lancedb`, que genera una advertencia.
- Si un plugin está instalado, pero su manifiesto o esquema falta o no es válido, la validación falla y Doctor informa del error del plugin.
- Si existe una configuración del plugin, pero el plugin está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor y en los registros.

Consulte la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo se utiliza para la detección y la validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se admiten comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evite las claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesite.
- `providerCatalogEntry` debe ser ligero y no debería importar grandes cantidades de código del entorno de ejecución; utilícelo para metadatos estáticos del catálogo de proveedores o descriptores de detección específicos, no para la ejecución durante las solicitudes.
- Los tipos exclusivos de plugins se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valor predeterminado: `memory-core`), `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado: `legacy`).
- Declare el tipo exclusivo de plugin en este manifiesto. El `OpenClawPluginDefinition.kind` del punto de entrada del entorno de ejecución está obsoleto y se conserva únicamente como mecanismo de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno de `setup.providers[].envVars` son únicamente declarativos. El estado, la auditoría, la validación de entrega de Cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de considerar configurada una variable de entorno.
- Para consultar metadatos del asistente del entorno de ejecución que requieran código del proveedor, consulte los [hooks del entorno de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si el plugin depende de módulos nativos, documente los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Contenido relacionado

<CardGroup cols={3}>
  <Card title="Creación de plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con plugins.
  </Card>
  <Card title="Arquitectura de plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Descripción general del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de plugins e importaciones de subrutas.
  </Card>
</CardGroup>
