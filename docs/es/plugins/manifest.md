---
read_when:
    - Está creando un plugin de OpenClaw
    - Necesita publicar un esquema de configuración de Plugin o depurar errores de validación del Plugin
summary: Requisitos del manifiesto del Plugin y del esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-07-12T14:42:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página describe el **manifiesto de Plugin nativo de OpenClaw**, `openclaw.plugin.json`. Para conocer los diseños de paquetes compatibles (Codex, Claude, Cursor), consulte [Paquetes de Plugins](/es/plugins/bundles).

Los formatos de paquetes compatibles utilizan en su lugar sus propios archivos de manifiesto:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente esos diseños, pero no los valida mediante el esquema de `openclaw.plugin.json` que aparece a continuación. En un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de LSP de Claude y los paquetes de hooks admitidos cuando el diseño coincide con las expectativas del entorno de ejecución de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar el código del Plugin**. Si el manifiesto falta o no es válido, se bloquea la validación de la configuración y se considera un error del Plugin.

Consulte [Plugins](/es/tools/plugin) para obtener la guía completa del sistema de Plugins y [Modelo de capacidades](/es/plugins/architecture#public-capability-model) para conocer el modelo de capacidades nativo y las directrices actuales sobre compatibilidad externa.

## Qué hace este archivo

`openclaw.plugin.json` contiene metadatos que OpenClaw lee **antes de cargar el código del Plugin**. Todo su contenido debe poder inspeccionarse con un coste suficientemente bajo sin iniciar el entorno de ejecución del Plugin.

**Úselo para:**

- identidad del Plugin, validación de la configuración y sugerencias para la interfaz de configuración
- metadatos de autenticación, incorporación y configuración (alias, activación automática, variables de entorno del proveedor y opciones de autenticación)
- sugerencias de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de control de calidad que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal que se integran en el catálogo y las superficies de validación

**No lo use para:** registrar el comportamiento del entorno de ejecución, declarar puntos de entrada de código ni especificar metadatos de instalación de npm. Estos corresponden al código del Plugin y a `package.json`.

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
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
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

| Campo                                | Obligatorio | Tipo                         | Qué significa                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                     | Id canónico del plugin. Este es el id utilizado en `plugins.entries.<id>`.                                                                                                                                                                                                                          |
| `configSchema`                       | Sí          | `object`                     | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                                                                                                        |
| `requiresPlugins`                    | No          | `string[]`                   | Ids de plugins que también deben estar instalados para que este plugin surta efecto. El descubrimiento permite cargar el plugin, pero muestra una advertencia cuando falta algún plugin requerido.                                                                                                  |
| `enabledByDefault`                   | No          | `true`                       | Marca un plugin incluido como habilitado de forma predeterminada. Omítalo o establezca cualquier valor distinto de `true` para que el plugin permanezca deshabilitado de forma predeterminada.                                                                                                      |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                   | Marca un plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js indicadas, por ejemplo, `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                                                                        |
| `legacyPluginIds`                    | No          | `string[]`                   | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                   | Ids de proveedores que deben habilitar automáticamente este plugin cuando las referencias de autenticación, configuración o modelos los mencionen.                                                                                                                                                 |
| `kind`                               | No          | `PluginKind \| PluginKind[]` | Declara uno o varios tipos de plugin exclusivos (`"memory"`, `"context-engine"`) utilizados por `plugins.slots.*`. Un plugin que posee ambos espacios declara ambos tipos en una sola matriz.                                                                                                      |
| `channels`                           | No          | `string[]`                   | Ids de canales que pertenecen a este plugin. Se utilizan para el descubrimiento y la validación de la configuración.                                                                                                                                                                               |
| `providers`                          | No          | `string[]`                   | Ids de proveedores que pertenecen a este plugin.                                                                                                                                                                                                                                                   |
| `providerCatalogEntry`               | No          | `string`                     | Ruta del módulo ligero del catálogo de proveedores, relativa a la raíz del plugin, para los metadatos del catálogo de proveedores limitados al manifiesto que pueden cargarse sin activar todo el entorno de ejecución del plugin.                                                                 |
| `modelSupport`                       | No          | `object`                     | Metadatos abreviados de familias de modelos, propiedad del manifiesto, utilizados para cargar automáticamente el plugin antes del entorno de ejecución.                                                                                                                                            |
| `modelCatalog`                       | No          | `object`                     | Metadatos declarativos del catálogo de modelos para los proveedores que pertenecen a este plugin. Este es el contrato del plano de control para futuros listados de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el entorno de ejecución del plugin.             |
| `modelPricing`                       | No          | `object`                     | Política de consulta de precios externos propiedad del proveedor. Utilícela para excluir a los proveedores locales o autoalojados de los catálogos de precios remotos o para asignar referencias de proveedores a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedores en el núcleo. |
| `modelIdNormalization`               | No          | `object`                     | Limpieza de alias o prefijos de ids de modelos, propiedad del proveedor, que debe ejecutarse antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                          |
| `providerEndpoints`                  | No          | `object[]`                   | Metadatos de host/baseUrl de puntos de conexión, propiedad del manifiesto, para rutas de proveedores que el núcleo debe clasificar antes de que se cargue el entorno de ejecución del proveedor.                                                                                                   |
| `providerRequest`                    | No          | `object`                     | Metadatos ligeros de la familia de proveedores y de compatibilidad de solicitudes utilizados por la política genérica de solicitudes antes de que se cargue el entorno de ejecución del proveedor.                                                                                                |
| `secretProviderIntegrations`         | No          | `Record<string, object>`     | Preajustes declarativos de proveedores de ejecución SecretRef que las superficies de configuración o instalación pueden ofrecer sin codificar integraciones específicas de proveedores en el núcleo.                                                                                              |
| `cliBackends`                        | No          | `string[]`                   | Ids de backends de inferencia de CLI que pertenecen a este plugin. Se utilizan para la activación automática al inicio a partir de referencias de configuración explícitas.                                                                                                                        |
| `syntheticAuthRefs`                  | No          | `string[]`                   | Referencias de proveedores o backends de CLI cuyo hook de autenticación sintética, propiedad del plugin, debe sondearse durante el descubrimiento de modelos en frío antes de que se cargue el entorno de ejecución.                                                                                |
| `nonSecretAuthMarkers`               | No          | `string[]`                   | Valores de marcador de posición de claves de API, propiedad del plugin incluido, que representan un estado de credenciales local, de OAuth o del entorno que no es secreto.                                                                                                                       |
| `commandAliases`                     | No          | `object[]`                   | Nombres de comandos que pertenecen a este plugin y que deben generar diagnósticos de configuración y de CLI compatibles con el plugin antes de que se cargue el entorno de ejecución.                                                                                                             |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`   | Metadatos de entorno de compatibilidad obsoletos para consultar la autenticación o el estado del proveedor. Para plugins nuevos, prefiera `setup.providers[].envVars`; OpenClaw todavía los lee durante el período de obsolescencia.                                                               |
| `providerUsageAuthEnvVars`           | No          | `Record<string, string[]>`   | Credenciales del proveedor únicamente para uso o facturación. OpenClaw utiliza estos nombres para detectar el uso y eliminar secretos, pero nunca para la autenticación de inferencia.                                                                                                             |
| `providerAuthAliases`                | No          | `Record<string, string>`     | Ids de proveedores que deben reutilizar otro id de proveedor para consultar la autenticación; por ejemplo, un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                                                                           |
| `channelEnvVars`                     | No          | `Record<string, string[]>`   | Metadatos ligeros de entorno del canal que OpenClaw puede inspeccionar sin cargar el código del plugin. Utilícelos para la configuración del canal controlada por el entorno o para superficies de autenticación que deban estar visibles para los auxiliares genéricos de inicio o configuración.   |
| `providerAuthChoices`                | No          | `object[]`                   | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución del proveedor preferido y vinculación sencilla de indicadores de CLI.                                                                                                                                |
| `activation`                         | No          | `object`                     | Metadatos ligeros del planificador de activación para la carga activada por el inicio, el proveedor, el comando, el canal, la ruta y la capacidad. Solo metadatos; el entorno de ejecución del plugin sigue controlando el comportamiento real.                                                     |
| `setup`                              | No          | `object`                     | Descriptores ligeros de configuración o incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el entorno de ejecución del plugin.                                                                                                                  |
| `qaRunners`                          | No          | `object[]`                   | Descriptores ligeros de ejecutores de control de calidad utilizados por el host compartido `openclaw qa` antes de que se cargue el entorno de ejecución del plugin.                                                                                                                               |
| `contracts`                          | No          | `object`                     | Instantánea estática de la propiedad de capacidades para hooks de autenticación externa, incrustaciones, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, vídeo y música, obtención web, búsqueda web, proveedores de workers, extracción de documentos o contenido web y propiedad de herramientas. |
| `configContracts`                    | No          | `object`                     | Comportamiento de configuración propiedad del manifiesto que consumen los auxiliares genéricos del núcleo: detección de indicadores peligrosos, destinos de migración de SecretRef y delimitación de rutas de configuración heredadas. Consulte la [referencia de configContracts](#configcontracts-reference).                         |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Valores predeterminados de bajo coste para la comprensión de contenido multimedia de los identificadores de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                           |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación de bajo coste para la generación de imágenes de los identificadores de proveedores declarados en `contracts.imageGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.              |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación de bajo coste para la generación de vídeo de los identificadores de proveedores declarados en `contracts.videoGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                 |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación de bajo coste para la generación de música de los identificadores de proveedores declarados en `contracts.musicGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos de disponibilidad de bajo coste para las herramientas propiedad del plugin declaradas en `contracts.tools`. Úselos cuando una herramienta no deba cargar el entorno de ejecución salvo que existan indicios de configuración, entorno o autenticación.             |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración de canales propiedad del manifiesto que se integran en las superficies de detección y validación antes de cargar el entorno de ejecución.                                                                                                       |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se deben cargar, relativos a la raíz del plugin.                                                                                                                                                                                                 |
| `name`                               | No       | `string`                     | Nombre del plugin legible para personas.                                                                                                                                                                                                                                   |
| `description`                        | No       | `string`                     | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                                                                                |
| `catalog`                            | No       | `object`                     | Indicaciones de presentación opcionales para las superficies del catálogo de plugins. Estos metadatos no instalan ni habilitan un plugin, ni le otorgan confianza.                                                                                                        |
| `icon`                               | No       | `string`                     | URL de imagen HTTPS para las tarjetas del mercado o catálogo. ClawHub acepta cualquier URL `https://` válida y utiliza el icono predeterminado del plugin cuando se omite o no es válida.                                                                                    |
| `version`                            | No       | `string`                     | Versión informativa del plugin.                                                                                                                                                                                                                                            |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de la interfaz de usuario, marcadores de posición e indicaciones de sensibilidad para los campos de configuración.                                                                                                                                               |

## referencia de catálogo

`catalog` proporciona indicaciones de visualización opcionales para los exploradores de plugins. Los hosts pueden ignorar estas indicaciones. Nunca instalan ni habilitan el plugin, y no cambian su comportamiento en tiempo de ejecución ni su nivel de confianza.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | Significado                                                                 |
| ---------- | --------- | --------------------------------------------------------------------------- |
| `featured` | `boolean` | Indica si las superficies del catálogo deben destacar este plugin.          |
| `order`    | `number`  | Indicación de orden ascendente entre los plugins seleccionados; los valores más bajos aparecen antes. |

## referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales estáticas de autenticación para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de que se cargue el entorno de ejecución del proveedor, de modo que las herramientas del núcleo puedan decidir si un proveedor de generación está disponible sin importar todos los plugins de proveedores.

Use estos campos solo para datos declarativos y fáciles de obtener. El transporte, las transformaciones de solicitudes, la actualización de tokens, la validación de credenciales y el comportamiento efectivo de generación permanecen en el entorno de ejecución del plugin.

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

| Campo                  | Obligatorio | Tipo       | Significado                                                                                                                                           |
| ---------------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No          | `string[]` | Identificadores adicionales de proveedores que deben contar como alias estáticos de autenticación para el proveedor de generación.                    |
| `authProviders`        | No          | `string[]` | Identificadores de proveedores cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.        |
| `configSignals`        | No          | `object[]` | Señales de disponibilidad basadas únicamente en la configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`          | No          | `object[]` | Señales explícitas de autenticación. Cuando están presentes, sustituyen el conjunto predeterminado de señales del identificador del proveedor, `aliases` y `authProviders`. |
| `referenceAudioInputs` | No          | `boolean`  | Solo para generación de vídeo. Establézcalo en `true` cuando el proveedor acepte recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada de `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Significado                                                                                                                                                                                |
| ---------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | Sí          | `string`   | Ruta con puntos al objeto de configuración propiedad del plugin que se debe inspeccionar, por ejemplo, `plugins.entries.example.config`.                                                   |
| `overlayPath`    | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Úsela para configuraciones específicas de una capacidad, como `image`, `video` o `music`. |
| `overlayMapPath` | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse individualmente al objeto raíz. Úsela para mapas de cuentas con nombre, como `accounts`, donde cualquier cuenta configurada debe ser válida. |
| `required`       | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos tampoco deben estar vacíos.           |
| `requiredAny`    | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva de las que al menos una debe tener un valor configurado.                                                                               |
| `mode`           | No          | `object`   | Restricción opcional de modo de cadena dentro de la configuración efectiva. Úsela cuando la disponibilidad basada únicamente en la configuración se aplique solo a un modo.                |

Cada restricción `mode` admite:

| Campo        | Obligatorio | Tipo       | Significado                                                                                     |
| ------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.         |
| `default`    | No          | `string`   | Valor de modo que se debe usar cuando la configuración omite la ruta.                            |
| `allowed`    | No          | `string[]` | Si está presente, la señal solo es válida cuando el modo efectivo es uno de estos valores.       |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.                |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Significado                                                                                                                                                                     |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Identificador del proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                |
| `providerBaseUrl` | No          | `object` | Restricción opcional que hace que la señal cuente solo cuando el proveedor configurado al que se hace referencia utiliza una URL base permitida. Úsela cuando un alias de autenticación solo sea válido para determinadas API. |

Cada restricción `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Significado                                                                                                                                             |
| ----------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Identificador de configuración del proveedor cuyo `baseUrl` debe comprobarse.                                                                           |
| `defaultBaseUrl`  | No          | `string`   | URL base que se debe suponer cuando la configuración del proveedor omite `baseUrl`.                                                                      |
| `allowedBaseUrls` | Sí          | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## referencia de metadatos de herramientas

`toolMetadata` utiliza las mismas estructuras `configSignals` y `authSignals` que los metadatos de proveedores de generación, indexadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara pruebas de disponibilidad fáciles de obtener para que OpenClaw pueda evitar importar el entorno de ejecución de un plugin solo para que su fábrica de herramientas devuelva `null`.

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

Las entradas de `toolMetadata` también aceptan `optional` (marca la herramienta como no obligatoria para la activación del plugin) y `replaySafe` (marca la ejecución de la herramienta como segura para repetirla después de un turno incompleto del modelo), además de los campos compartidos `configSignals`/`authSignals` anteriores.

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de la herramienta coincide con la política. Para las herramientas de rutas críticas cuya fábrica depende de la autenticación o la configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para consultarlo.

## referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw la lee antes de que se cargue el entorno de ejecución del proveedor. Las listas de configuración de proveedores utilizan estas opciones del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Significado                                                                                                                        |
| --------------------- | ----------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | Id. del proveedor al que pertenece esta opción.                                                                                    |
| `method`              | Sí          | `string`                                                              | Id. del método de autenticación al que se debe derivar.                                                                             |
| `choiceId`            | Sí          | `string`                                                              | Id. estable de la opción de autenticación utilizado por los flujos de incorporación y de la CLI.                                   |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                                                       |
| `choiceHint`          | No          | `string`                                                              | Texto breve de ayuda para el selector.                                                                                              |
| `assistantPriority`   | No          | `number`                                                              | Los valores más bajos aparecen primero en los selectores interactivos controlados por el asistente.                                |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la opción en los selectores del asistente, pero sigue permitiendo seleccionarla manualmente mediante la CLI.                 |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | Id. de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                                            |
| `groupId`             | No          | `string`                                                              | Id. de grupo opcional para agrupar opciones relacionadas.                                                                          |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario de ese grupo.                                                                                      |
| `groupHint`           | No          | `string`                                                              | Texto breve de ayuda para el grupo.                                                                                                 |
| `onboardingFeatured`  | No          | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "Más...".                   |
| `optionKey`           | No          | `string`                                                              | Clave de opción interna para flujos de autenticación sencillos con una sola marca.                                                  |
| `cliFlag`             | No          | `string`                                                              | Nombre de la marca de la CLI, como `--openrouter-api-key`.                                                                          |
| `cliOption`           | No          | `string`                                                              | Forma completa de la opción de la CLI, como `--openrouter-api-key <key>`.                                                           |
| `cliDescription`      | No          | `string`                                                              | Descripción utilizada en la ayuda de la CLI.                                                                                        |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superficies de incorporación en las que debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`.   |

## Referencia de commandAliases

Use `commandAliases` cuando un plugin posea un nombre de comando de tiempo de ejecución que los usuarios puedan incluir por error en `plugins.allow` o intentar ejecutar como comando raíz de la CLI. OpenClaw utiliza estos metadatos para realizar diagnósticos sin importar el código de tiempo de ejecución del plugin.

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

| Campo        | Obligatorio | Tipo              | Significado                                                                                       |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                                                   |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando de barra del chat en lugar de un comando raíz de la CLI.           |
| `cliCommand` | No          | `string`          | Comando raíz relacionado de la CLI que se debe sugerir para sus operaciones, si existe alguno.    |

## Referencia de activation

Use `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control deben incluirlo en un plan de activación/carga.

Este bloque contiene metadatos del planificador, no es una API de ciclo de vida. No registra comportamientos de tiempo de ejecución, no reemplaza a `register(...)` ni garantiza que el código del plugin ya se haya ejecutado. El planificador de activación utiliza estos campos para limitar los plugins candidatos antes de recurrir a los metadatos de propiedad existentes del manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks.

Priorice los metadatos más específicos que ya describan la propiedad. Use `providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts` cuando esos campos expresen la relación. Use `activation` para indicaciones adicionales del planificador que no puedan representarse mediante esos campos de propiedad. Use `cliBackends` de nivel superior para alias de tiempo de ejecución de la CLI como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` solo se utiliza para los id. de arneses de agente integrados que aún no tengan un campo de propiedad.

Cada plugin debe establecer `activation.onStartup` de forma intencionada. Establézcalo en `true` solo cuando el plugin deba ejecutarse durante el inicio del Gateway. Establézcalo en `false` cuando el plugin esté inactivo durante el inicio y solo deba cargarse mediante desencadenadores más específicos. Omitir `onStartup` ya no carga implícitamente el plugin durante el inicio; use metadatos de activación explícitos para los desencadenadores de activación del inicio, canal, configuración, arnés de agente, memoria u otros más específicos.

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

| Campo              | Obligatorio | Tipo                                                 | Significado                                                                                                                                                                                                            |
| ------------------ | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No          | `boolean`                                            | Activación explícita durante el inicio del Gateway. Cada plugin debe establecerla. `true` importa el plugin durante el inicio; `false` mantiene su carga diferida durante el inicio, salvo que otro desencadenador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Id. de proveedores que deben incluir este plugin en los planes de activación/carga.                                                                                                                                     |
| `onAgentHarnesses` | No          | `string[]`                                           | Id. de tiempo de ejecución de arneses de agente integrados que deben incluir este plugin en los planes de activación/carga. Use `cliBackends` de nivel superior para los alias de backends de la CLI.                    |
| `onCommands`       | No          | `string[]`                                           | Id. de comandos que deben incluir este plugin en los planes de activación/carga.                                                                                                                                         |
| `onChannels`       | No          | `string[]`                                           | Id. de canales que deben incluir este plugin en los planes de activación/carga.                                                                                                                                          |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deben incluir este plugin en los planes de activación/carga.                                                                                                                                          |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este plugin en los planes de inicio/carga cuando la ruta esté presente y no esté deshabilitada explícitamente.                                             |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones generales de capacidades utilizadas por la planificación de activación del plano de control. Priorice campos más específicos cuando sea posible.                                                           |

Consumidores activos actuales:

- La planificación del inicio del Gateway utiliza `activation.onStartup` para la importación explícita durante el inicio.
- La planificación de la CLI desencadenada por comandos recurre a `commandAliases[].cliCommand` o `commandAliases[].name` heredados.
- La planificación del inicio del tiempo de ejecución del agente utiliza `activation.onAgentHarnesses` para los arneses integrados y `cliBackends[]` de nivel superior para los alias de tiempo de ejecución de la CLI.
- La planificación de configuración/canales desencadenada por canales recurre a la propiedad heredada de `channels[]` cuando faltan metadatos explícitos de activación del canal.
- La planificación de plugins durante el inicio utiliza `activation.onConfigPaths` para superficies de configuración raíz no relacionadas con canales, como el bloque `browser` del plugin de navegador incluido.
- La planificación de configuración/tiempo de ejecución desencadenada por proveedores recurre a la propiedad heredada de `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación del proveedor.

Los diagnósticos del planificador pueden distinguir las indicaciones explícitas de activación de la alternativa basada en la propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que `activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el planificador utilizó en su lugar la propiedad de `commandAliases`. Estas etiquetas de motivo son para los diagnósticos y las pruebas del host; los autores de plugins deben seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Use `qaRunners` cuando un plugin aporte uno o varios ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantenga estos metadatos económicos y estáticos; el tiempo
de ejecución del plugin sigue siendo responsable del registro real de la CLI mediante una superficie ligera
`runtime-api.ts` que exporte `qaRunnerCliRegistrations` coincidentes. Un
`adapterFactory` opcional expone el transporte a los escenarios compartidos de control de calidad sin
cambiar el ejecutor del comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la vía de control de calidad en vivo de Matrix respaldada por Docker contra un servidor doméstico desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Significado                                                                                     |
| ------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo, `matrix`.                                   |
| `description` | No          | `string` | Texto de ayuda alternativo utilizado cuando el host compartido necesita un comando provisional. |

El id de `adapterFactory` debe coincidir con `commandName`. No exporte registros
para comandos que no estén presentes en el manifiesto.

## referencia de setup

Use `setup` cuando las superficies de configuración e incorporación necesiten metadatos económicos propiedad del plugin antes de que se cargue el entorno de ejecución.

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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de la CLI. `setup.cliBackends` es la superficie de descriptores específica de setup para los flujos de configuración y del plano de control que deben permanecer basados únicamente en metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de consulta basada primero en descriptores para el descubrimiento de la configuración. Si el descriptor solo acota el plugin candidato y la configuración aún necesita hooks más completos del entorno de ejecución durante la configuración, establezca `requiresRuntime: true` y mantenga `setup-api` como ruta de ejecución alternativa.

OpenClaw también incluye `setup.providers[].envVars` en las consultas genéricas de autenticación de proveedores y de variables de entorno. `providerAuthEnvVars` continúa admitiéndose mediante un adaptador de compatibilidad durante el período de obsolescencia, pero los plugins no incluidos que todavía lo usan reciben un diagnóstico del manifiesto. Los plugins nuevos deben colocar los metadatos de entorno de configuración y estado en `setup.providers[].envVars`.

Use `providerUsageAuthEnvVars` cuando una credencial de facturación o de nivel de organización deba activar `resolveUsageAuth` sin convertirse en una credencial de inferencia. Estos nombres se incorporan al bloqueo de dotenv del espacio de trabajo, la eliminación en procesos secundarios de ACP, el filtrado de secretos del entorno aislado y la depuración general de secretos. El entorno de ejecución del proveedor sigue leyendo y clasificando el valor dentro de `resolveUsageAuth`.

OpenClaw también puede derivar opciones de configuración sencillas de `setup.providers[].authMethods` cuando no haya una entrada de configuración disponible, o cuando `setup.requiresRuntime: false` declare innecesario el entorno de ejecución de configuración. Las entradas explícitas de `providerAuthChoices` siguen siendo preferibles para etiquetas personalizadas, opciones de la CLI, ámbito de incorporación y metadatos del asistente.

Establezca `requiresRuntime: false` únicamente cuando esos descriptores sean suficientes para la superficie de configuración. OpenClaw trata el valor explícito `false` como un contrato basado exclusivamente en descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la consulta de configuración. Si un plugin basado únicamente en descriptores sigue incluyendo una de esas entradas del entorno de ejecución de configuración, OpenClaw informa de un diagnóstico adicional y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento alternativo heredado para que no se rompan los plugins existentes que hayan añadido descriptores sin la opción.

Dado que la consulta de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben ser únicos entre los plugins descubiertos. Si la propiedad es ambigua, la operación falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

Cuando se ejecuta el entorno de configuración, los diagnósticos del registro de configuración informan de discrepancias en los descriptores si `setup-api` registra un proveedor o backend de la CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro correspondiente en el entorno de ejecución. Estos diagnósticos son adicionales y no rechazan plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Significado                                                                                                      |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`           | Sí          | `string`   | Id del proveedor expuesto durante la configuración o la incorporación. Mantenga los ids normalizados globalmente únicos. |
| `authMethods`  | No          | `string[]` | Ids de métodos de configuración o autenticación que admite este proveedor sin cargar el entorno de ejecución completo. |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración o estado pueden comprobar antes de cargar el entorno de ejecución del plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones locales económicas de evidencia de autenticación para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` sirve para marcadores de credenciales locales propiedad del proveedor que pueden verificarse sin cargar código del entorno de ejecución. Estas comprobaciones deben seguir siendo económicas y locales: sin llamadas de red, lecturas del llavero o del gestor de secretos, comandos del shell ni sondeos de la API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Significado                                                                                                    |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente, `local-file-with-env`.                                                                            |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita al archivo de credenciales.                                |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una de las variables de entorno indicadas debe tener un valor no vacío para que la evidencia sea válida. |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno indicadas deben tener un valor no vacío para que la evidencia sea válida.       |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación o estado.                             |

### campos de setup

| Campo              | Obligatorio | Tipo       | Significado                                                                                                    |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración del proveedor expuestos durante la configuración y la incorporación.            |
| `cliBackends`      | No          | `string[]` | Ids de backends usados durante la configuración para la consulta basada primero en descriptores. Mantenga los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este plugin.                 |
| `requiresRuntime`  | No          | `boolean`  | Indica si la configuración aún necesita ejecutar `setup-api` después de consultar los descriptores.           |

## referencia de uiHints

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

| Campo         | Tipo       | Significado                                      |
| ------------- | ---------- | ------------------------------------------------ |
| `label`       | `string`   | Etiqueta de campo visible para el usuario.       |
| `help`        | `string`   | Texto breve de ayuda.                            |
| `tags`        | `string[]` | Etiquetas opcionales de la interfaz de usuario.  |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                    |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.          |
| `placeholder` | `string`   | Texto de marcador para las entradas de formularios. |

## referencia de contracts

Use `contracts` únicamente para metadatos estáticos de propiedad de capacidades que OpenClaw pueda leer sin importar el entorno de ejecución del plugin.

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

| Campo                            | Tipo       | Qué significa                                                                                                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id. de fábricas de extensiones del servidor de aplicaciones de Codex, actualmente `codex-app-server`.                                                         |
| `agentToolResultMiddleware`      | `string[]` | Id. de entornos de ejecución para los que este Plugin puede registrar middleware de resultados de herramientas.                                               |
| `trustedToolPolicies`            | `string[]` | Id. de políticas locales de confianza previas a las herramientas que puede registrar un Plugin instalado. Los plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Id. de proveedores cuyo hook de perfiles de autenticación externa pertenece a este Plugin.                                                                    |
| `embeddingProviders`             | `string[]` | Id. de proveedores generales de embeddings que pertenecen a este Plugin para generar embeddings vectoriales reutilizables, incluida la memoria.                |
| `speechProviders`                | `string[]` | Id. de proveedores de voz que pertenecen a este Plugin.                                                                                                       |
| `realtimeTranscriptionProviders` | `string[]` | Id. de proveedores de transcripción en tiempo real que pertenecen a este Plugin.                                                                               |
| `realtimeVoiceProviders`         | `string[]` | Id. de proveedores de voz en tiempo real que pertenecen a este Plugin.                                                                                         |
| `memoryEmbeddingProviders`       | `string[]` | Id. obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este Plugin.                                                               |
| `mediaUnderstandingProviders`    | `string[]` | Id. de proveedores de comprensión multimedia que pertenecen a este Plugin.                                                                                     |
| `transcriptSourceProviders`      | `string[]` | Id. de proveedores de fuentes de transcripciones que pertenecen a este Plugin.                                                                                 |
| `documentExtractors`             | `string[]` | Id. de proveedores de extracción de documentos (por ejemplo, PDF) que pertenecen a este Plugin.                                                                |
| `imageGenerationProviders`       | `string[]` | Id. de proveedores de generación de imágenes que pertenecen a este Plugin.                                                                                     |
| `videoGenerationProviders`       | `string[]` | Id. de proveedores de generación de vídeo que pertenecen a este Plugin.                                                                                        |
| `musicGenerationProviders`       | `string[]` | Id. de proveedores de generación de música que pertenecen a este Plugin.                                                                                       |
| `webContentExtractors`           | `string[]` | Id. de proveedores de extracción de contenido de páginas web que pertenecen a este Plugin.                                                                     |
| `webFetchProviders`              | `string[]` | Id. de proveedores de obtención web que pertenecen a este Plugin.                                                                                              |
| `webSearchProviders`             | `string[]` | Id. de proveedores de búsqueda web que pertenecen a este Plugin.                                                                                               |
| `workerProviders`                | `string[]` | Id. de proveedores de trabajadores en la nube que pertenecen a este Plugin para el aprovisionamiento y el ciclo de vida de alquileres respaldados por perfiles. |
| `usageProviders`                 | `string[]` | Id. de proveedores cuyos hooks de autenticación de uso y de instantáneas de uso pertenecen a este Plugin.                                                      |
| `migrationProviders`             | `string[]` | Id. de proveedores de importación que pertenecen a este Plugin para `openclaw migrate`.                                                                        |
| `gatewayMethodDispatch`          | `string[]` | Permiso reservado para rutas HTTP autenticadas de plugins que despachan métodos del Gateway dentro del proceso.                                                |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este Plugin.                                                                                               |

`contracts.embeddedExtensionFactories` se conserva para las fábricas de extensiones incluidas exclusivas del servidor de aplicaciones de Codex. En su lugar, las transformaciones incluidas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)`. Los plugins instalados pueden usar el mismo punto de integración de middleware solo cuando esté habilitado explícitamente y únicamente para los entornos de ejecución que declaren en `contracts.agentToolResultMiddleware`.

Los plugins instalados que necesiten el nivel de políticas previas a las herramientas de confianza del host deben declarar cada id. local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente. Los plugins incluidos mantienen la ruta existente de políticas de confianza, pero los plugins instalados con id. de políticas no declarados se rechazan antes del registro. Los id. de políticas se limitan al ámbito del Plugin que las registra, por lo que dos plugins pueden declarar y registrar `workflow-budget`; un mismo Plugin no puede registrar dos veces el mismo id. local.

Los registros en tiempo de ejecución de `api.registerTool(...)` deben coincidir con `contracts.tools`. La detección de herramientas utiliza esta lista para cargar únicamente los entornos de ejecución de plugins que pueden ser propietarios de las herramientas solicitadas.

Los plugins de proveedores que implementen `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los plugins de proveedores que implementen tanto `resolveUsageAuth` como `fetchUsageSnapshot` deben declarar cada id. de proveedor detectado automáticamente en `contracts.usageProviders`. La detección de uso lee este contrato antes de cargar el código de tiempo de ejecución y, después de cargar únicamente los propietarios declarados, verifica ambos hooks.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` por cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Use el contrato general para la generación reutilizable de vectores, incluidos los proveedores que utiliza la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta específica de la memoria y solo se mantiene mientras los proveedores existentes migran al punto de integración genérico de proveedores de embeddings.

Los proveedores de trabajadores deben declarar en `contracts.workerProviders` cada id. de `api.registerWorkerProvider(...)`. El núcleo conserva la intención duradera antes de llamar a `provision`; los proveedores validan su configuración antes de la asignación externa, y las llamadas repetidas con el mismo id. de operación deben adoptar el mismo alquiler. El núcleo también conserva esa instantánea de la configuración validada y la pasa junto con `leaseId` a `inspect({ leaseId, profile })` y `destroy({ leaseId, profile })`, incluso después de que el perfil nombrado se modifique o elimine. La destrucción es idempotente, la inspección devuelve la unión cerrada de estados `active` / `destroyed` / `unknown`, y el material de claves privadas SSH solo se referencia mediante `SecretRef`. Los endpoints SSH aprovisionados también deben incluir un `hostKey` público procedente de resultados de aprovisionamiento de confianza con el formato exacto `algorithm base64`, sin nombre de host ni comentario, para que el núcleo pueda fijar el host antes de conectarse. Los proveedores que generen referencias dinámicas de identidad pueden implementar la función autoritativa `resolveSshIdentity({ leaseId, profile, keyRef })`; los proveedores que no la implementen utilizan el solucionador genérico de secretos del núcleo. Un estado autoritativo `unknown` deja huérfano un registro local activo; después de una solicitud de destrucción conservada, confirma el desmantelamiento.

`contracts.gatewayMethodDispatch` acepta actualmente `"authenticated-request"`. Es una barrera de higiene de API para rutas HTTP de plugins nativos que envían intencionadamente métodos del plano de control del Gateway dentro del proceso, no un entorno aislado contra plugins nativos maliciosos. Úselo únicamente para superficies integradas o de operadores sometidas a una revisión rigurosa que ya requieran autenticación HTTP del Gateway. Una ruta autorizada sigue siendo accesible mientras la admisión de trabajo raíz del Gateway está cerrada solo cuando también declara `auth: "gateway"` y el valor `gatewayRuntimeScopeSurface: "trusted-operator"` específico de la ruta; las rutas hermanas ordinarias del mismo plugin permanecen detrás del límite de admisión. Esto mantiene accesibles el estado de suspensión y la reanudación sin conceder a todo el plugin una omisión de la admisión. Mantenga acotados el análisis y la conformación de respuestas fuera del envío; el trabajo sustantivo o que modifique datos debe pasar por el envío de métodos del Gateway, que controla la admisión y la aplicación del ámbito.

## Referencia de configContracts

Use `configContracts` para el comportamiento de configuración propiedad del manifiesto que necesitan los asistentes genéricos del núcleo sin importar el entorno de ejecución del plugin: detección de indicadores peligrosos, destinos de migración de SecretRef y acotación de rutas de configuración heredadas.

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
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Campo                         | Obligatorio | Tipo       | Significado                                                                                                                                                                                                                                                          |
| ----------------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No          | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad de este plugin durante la configuración. Permite que las lecturas genéricas de configuración en tiempo de ejecución omitan todas las superficies de configuración del plugin cuando la configuración nunca hace referencia al plugin. |
| `compatibilityRuntimePaths`   | No          | `string[]` | Rutas de compatibilidad relativas a la raíz que este plugin puede atender durante el tiempo de ejecución antes de que su código se active por completo. Úselo para superficies heredadas que deban reducir los conjuntos de candidatos integrados sin importar el entorno de ejecución de todos los plugins compatibles. |
| `dangerousFlags`              | No          | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando estén habilitados. Consulte más adelante.                                                                                                                            |
| `secretInputs`                | No          | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` que el registro de destinos de migración/auditoría de SecretRef debe tratar como cadenas con forma de secreto. Consulte más adelante.                                                                       |

Cada entrada de `dangerousFlags` admite:

| Campo    | Obligatorio | Tipo                                  | Significado                                                                                                                       |
| -------- | ----------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sí          | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapas/matrices. |
| `equals` | Sí          | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                              |

`secretInputs` admite:

| Campo                   | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                 |
| ----------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No          | `boolean`  | Anula la habilitación predeterminada del Plugin incluido al decidir si esta superficie SecretRef está activa. Úselo cuando el Plugin esté incluido, pero la superficie deba permanecer inactiva hasta que se habilite explícitamente en la configuración. |
| `paths`                 | Sí          | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`) y `expected` opcional (actualmente solo `"string"`).                            |

## Referencia de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tenga modelos predeterminados, prioridad de respaldo de autenticación automática o compatibilidad nativa con documentos que los auxiliares genéricos del núcleo necesiten antes de cargar el entorno de ejecución. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Capacidades multimedia expuestas por este proveedor.                                                            |
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados de capacidad a modelo que se usan cuando la configuración no especifica un modelo.      |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan primero para el respaldo automático de proveedores basado en credenciales.     |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documentos nativas compatibles con el proveedor.                                                    |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Anulaciones de modelos por tipo de documento. Establezca `image: false` para deshabilitar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Use `channelConfigs` cuando un Plugin de canal necesite metadatos de configuración de bajo coste antes de cargar el entorno de ejecución. La detección de configuración/estado del canal de solo lectura puede usar estos metadatos directamente para canales externos configurados cuando no haya una entrada de configuración disponible o cuando `setup.requiresRuntime: false` declare que el entorno de ejecución no es necesario para la configuración.

`channelConfigs` son metadatos del manifiesto del Plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué Plugin es propietario de ese canal configurado antes de que se ejecute el código del entorno de ejecución del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaren `channels[]` también deben declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el Plugin, pero las superficies de esquema de configuración de ruta fría, configuración y Control UI no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el entorno de ejecución del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para las comprobaciones de configuración de comandos que se ejecutan antes de cargar el entorno de ejecución del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con sus demás metadatos de catálogo de canales propiedad del paquete.

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
      "description": "Conexión con el servidor doméstico de Matrix",
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

| Campo         | Tipo                     | Qué significa                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Es obligatorio para cada entrada de configuración de canal declarada. |
| `uiHints`     | `Record<string, object>` | Etiquetas, marcadores de posición e indicaciones de datos confidenciales opcionales de la interfaz para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal que se combina en las superficies de selección e inspección cuando los metadatos del entorno de ejecución no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                 |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al entorno de ejecución. |
| `preferOver`  | `string[]`               | Identificadores de Plugins heredados o de menor prioridad que este canal debe superar en las superficies de selección. |

### Sustitución de otro Plugin de canal

Use `preferOver` cuando su Plugin sea el propietario preferido de un identificador de canal que también pueda proporcionar otro Plugin. Los casos habituales son un identificador de Plugin renombrado, un Plugin independiente que sustituye a uno incluido o una bifurcación mantenida que conserva el mismo identificador de canal para mantener la compatibilidad de configuración.

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

Cuando se configura `channels.chat`, OpenClaw considera tanto el identificador del canal como el identificador del Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración efectiva del entorno de ejecución para que un único Plugin sea propietario del canal y de sus herramientas. La selección explícita del usuario sigue prevaleciendo: si el usuario habilita explícitamente ambos Plugins (mediante `plugins.allow` o una configuración sustancial de `plugins.entries`), OpenClaw conserva esa elección e informa de diagnósticos de canales/herramientas duplicados en lugar de cambiar silenciosamente el conjunto de Plugins solicitado.

Limite `preferOver` a los identificadores de Plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general y no cambia el nombre de las claves de configuración del usuario.

## Referencia de modelSupport

Use `modelSupport` cuando OpenClaw deba inferir su Plugin de proveedor a partir de identificadores abreviados de modelos como `gpt-5.6-sol` o `claude-sonnet-4.6` antes de cargar el entorno de ejecución del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifiesto `providers` propietario
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si coinciden un Plugin no incluido y uno incluido, prevalece el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados mediante `startsWith` con identificadores abreviados de modelos. |
| `modelPatterns` | `string[]` | Fuentes de expresiones regulares comparadas con identificadores abreviados de modelos después de eliminar el sufijo del perfil. |

Las entradas de `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contienen repeticiones anidadas (por ejemplo, `(a+)+$`). Los patrones que no superan la comprobación de seguridad se omiten silenciosamente, igual que las expresiones regulares sintácticamente no válidas. Mantenga los patrones simples y evite cuantificadores anidados.

## Referencia de modelCatalog

Use `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de cargar el entorno de ejecución del Plugin. Esta es la fuente propiedad del manifiesto para filas fijas del catálogo, alias de proveedores, reglas de supresión y modo de detección. La actualización en tiempo de ejecución sigue perteneciendo al código del entorno de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo es necesario dicho entorno.

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
        "reason": "no disponible en Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campos de nivel superior:

| Campo            | Tipo                                                     | Qué significa                                                                                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas del catálogo para los identificadores de proveedores que pertenecen a este plugin. Las claves también deben aparecer en `providers` en el nivel superior. |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedores que deben resolverse a un proveedor propio para la planificación del catálogo o de supresiones.      |
| `suppressions`   | `object[]`                                               | Filas de modelos de otra fuente que este plugin suprime por un motivo específico del proveedor.                           |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica si el catálogo del proveedor puede leerse desde los metadatos del manifiesto, actualizarse en la caché o requiere el entorno de ejecución. |
| `runtimeAugment` | `boolean`                                                | Se establece en `true` solo cuando el entorno de ejecución del proveedor debe añadir filas al catálogo después de planificar el manifiesto o la configuración. |

`aliases` interviene en la búsqueda de pertenencia del proveedor para planificar el catálogo de modelos. Los destinos de los alias deben ser proveedores del nivel superior que pertenezcan al mismo plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar las sobrescrituras de API o URL base del alias sin cargar el entorno de ejecución del proveedor. Los alias no amplían los listados de catálogos sin filtrar; las listas generales solo generan las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook `suppressBuiltInModel` del entorno de ejecución del proveedor. Las entradas de supresión solo se respetan cuando el proveedor pertenece al plugin o se declara como una clave de `modelCatalog.aliases` cuyo destino es un proveedor propio. Los hooks de supresión del entorno de ejecución ya no se invocan durante la resolución de modelos.

Campos del proveedor:

| Campo                 | Tipo                     | Qué significa                                                                                                                                                                                                                                      |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base predeterminada opcional para los modelos de este catálogo de proveedor.                                                                                                                                                                   |
| `api`                 | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos de este catálogo de proveedor.                                                                                                                                                           |
| `headers`             | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.                                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Identificador opcional de un modelo pequeño recomendado por el proveedor para tareas de utilidad internas breves (títulos, narración del progreso). Se usa cuando `agents.defaults.utilityModel` no está establecido y este proveedor sirve el modelo principal del agente. |
| `models`              | `object[]`               | Filas de modelos obligatorias. Se ignoran las filas sin `id`.                                                                                                                                                                                      |

Campos del modelo:

| Campo              | Tipo                                                           | Qué significa                                                                                         |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Identificador de modelo local del proveedor, sin el prefijo `provider/`.                              |
| `name`             | `string`                                                       | Nombre para mostrar opcional.                                                                         |
| `api`              | `ModelApi`                                                     | Sobrescritura de API opcional por modelo.                                                             |
| `baseUrl`          | `string`                                                       | Sobrescritura opcional de la URL base por modelo.                                                     |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Los demás valores se descartan silenciosamente.                     |
| `reasoning`        | `boolean`                                                      | Indica si el modelo ofrece comportamiento de razonamiento.                                            |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                                             |
| `contextTokens`    | `number`                                                       | Límite efectivo opcional del contexto en tiempo de ejecución cuando difiere de `contextWindow`.       |
| `maxTokens`        | `number`                                                       | Número máximo de tokens de salida, cuando se conoce.                                                  |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sobrescrituras opcionales del identificador del modelo o de parámetros por nivel de razonamiento.     |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional.                        |
| `compat`           | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuración de entrada opcional por modalidad, actualmente solo para imágenes.                      |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Se suprime solo cuando la fila no debe aparecer en absoluto.                       |
| `statusReason`     | `string`                                                       | Motivo opcional que se muestra con un estado distinto de disponible.                                  |
| `replaces`         | `string[]`                                                     | Identificadores antiguos de modelos locales del proveedor a los que este modelo sustituye.            |
| `replacedBy`       | `string`                                                       | Identificador del modelo local del proveedor que sustituye las filas obsoletas.                        |
| `tags`             | `string[]`                                                     | Etiquetas estables utilizadas por los selectores y filtros.                                           |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                                                   |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identificador del proveedor de la fila de origen que se suprimirá. Debe pertenecer a este plugin o declararse como alias propio. |
| `model`                    | `string`   | Identificador del modelo local del proveedor que se suprimirá.                                                                  |
| `reason`                   | `string`   | Mensaje opcional que se muestra cuando se solicita directamente la fila suprimida.                                               |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de la URL base del proveedor que se requieren para aplicar la supresión.                       |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores `api` exactos de la configuración del proveedor que se requieren para aplicar la supresión.            |

No incluya datos exclusivos del entorno de ejecución en `modelCatalog`. Use `static` solo cuando las filas del manifiesto sean lo bastante completas como para que las superficies de listas filtradas por proveedor y de selección puedan omitir la detección del registro o del entorno de ejecución. Use `refreshable` cuando las filas del manifiesto sean elementos iniciales o complementos útiles que puedan incluirse en listas, pero una actualización o caché pueda añadir más filas posteriormente; las filas actualizables no son autoritativas por sí solas. Use `runtime` cuando OpenClaw deba cargar el entorno de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Use `modelIdNormalization` para la normalización sencilla de identificadores de modelos propiedad del proveedor que debe realizarse antes de cargar el entorno de ejecución del proveedor. Esto mantiene en el manifiesto del plugin propietario los alias, como nombres cortos de modelos, identificadores heredados locales del proveedor y reglas de prefijos de proxy, en lugar de incluirlos en las tablas principales de selección de modelos.

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

| Campo                                | Tipo                    | Qué significa                                                                                                              |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exactos de identificadores de modelos que no distinguen entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de buscar el alias; resultan útiles para la duplicación heredada de proveedor/modelo.        |
| `prefixWhenBare`                     | `string`                | Prefijo que se añade cuando el identificador de modelo normalizado aún no contiene `/`.                                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijos para identificadores simples después de buscar el alias, definidas mediante `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Use `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes debe conocer antes de cargar el entorno de ejecución del proveedor. El núcleo sigue siendo responsable del significado de cada `endpointClass`; los manifiestos de los plugins son responsables de los metadatos del host y de la URL base.

Los plugins de proveedores externalizados oficialmente se excluyen de la distribución principal, por lo que
sus manifiestos permanecen invisibles hasta que se instalan. Sus valores de `providerEndpoints` también deben
reflejarse en `scripts/lib/official-external-provider-catalog.json` para que
la clasificación de endpoints siga funcionando sin el plugin; una prueba de contrato
hace cumplir esta correspondencia.

Campos del endpoint:

| Campo                          | Tipo       | Qué significa                                                                                                          |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase conocida de endpoint del núcleo, como `openrouter`, `moonshot-native` o `google-vertex`.                         |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                         |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Anteponer `.` para que coincida únicamente como sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                                           |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                                          |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex.                    |

## Referencia de providerRequest

Usar `providerRequest` para metadatos ligeros de compatibilidad de solicitudes que la política genérica de solicitudes necesita sin cargar el entorno de ejecución del proveedor. Mantener la reescritura de cargas útiles específica del comportamiento en los hooks del entorno de ejecución del proveedor o en los auxiliares compartidos de la familia de proveedores.

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

| Campo                 | Tipo         | Qué significa                                                                                                   |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etiqueta de familia del proveedor utilizada por las decisiones genéricas de compatibilidad de solicitudes y los diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de la familia del proveedor para auxiliares compartidos de solicitudes.       |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completado compatibles con OpenAI, actualmente `supportsStreamingUsage`.        |

## Referencia de secretProviderIntegrations

Usar `secretProviderIntegrations` cuando un plugin pueda publicar una configuración preestablecida reutilizable de proveedor de ejecución de SecretRef. OpenClaw lee estos metadatos antes de que se cargue el entorno de ejecución del plugin, almacena la propiedad del plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución real de secretos al entorno de ejecución de SecretRef. Las configuraciones preestablecidas solo se exponen para plugins incluidos y plugins instalados descubiertos desde las raíces administradas de instalación de plugins, como las instalaciones desde git y ClawHub.

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

La clave del mapa es el id. de la integración. Si se omite `providerAlias`, OpenClaw usa el id. de la integración como alias del proveedor de SecretRef. Los alias de proveedor deben coincidir con el patrón normal de alias de proveedor de SecretRef, por ejemplo `team-secrets` o `onepassword-work`.

Cuando un operador selecciona la configuración preestablecida, OpenClaw escribe una referencia de proveedor como esta:

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

Durante el inicio o la recarga, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del plugin, comprobando que el plugin propietario esté instalado y activo, y materializando el comando de ejecución a partir del manifiesto. Deshabilitar o eliminar el plugin revoca el proveedor para las SecretRefs activas. Los operadores que quieran una configuración de ejecución independiente aún pueden escribir directamente proveedores manuales con `command`/`args`.

Actualmente solo se admiten configuraciones preestablecidas con `source: "exec"`. `command` debe ser `${node}` y `args[0]` debe ser un script de resolución `./` relativo a la raíz del plugin. OpenClaw lo materializa durante el inicio o la recarga con el ejecutable de Node actual y la ruta absoluta del script dentro del plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de configuración preestablecida del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar directamente proveedores de ejecución manuales independientes.

OpenClaw deriva `trustedDirs` para las configuraciones preestablecidas del manifiesto a partir de la raíz del plugin y, para las configuraciones preestablecidas `${node}`, del directorio del ejecutable de Node actual. Los `trustedDirs` definidos en el manifiesto se ignoran. Otras opciones del proveedor de ejecución, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, se transfieren a la configuración normal del proveedor de ejecución de SecretRef.

## Referencia de modelPricing

Usar `modelPricing` cuando un proveedor necesite un comportamiento de precios del plano de control antes de que se cargue el entorno de ejecución. La caché de precios del Gateway lee estos metadatos sin importar el código del entorno de ejecución del proveedor.

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

| Campo        | Tipo              | Qué significa                                                                                                          |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Establecer en `false` para proveedores locales o autoalojados que nunca deban obtener precios de OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Asignación de consulta de precios de OpenRouter. `false` deshabilita la consulta de OpenRouter para este proveedor.    |
| `liteLLM`    | `false \| object` | Asignación de consulta de precios de LiteLLM. `false` deshabilita la consulta de LiteLLM para este proveedor.          |

Campos de la fuente:

| Campo                      | Tipo               | Qué significa                                                                                                                    |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id. del proveedor del catálogo externo cuando difiere del id. de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los id. de modelo que contienen barras como referencias anidadas de proveedor/modelo, útil para proveedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales del id. de modelo del catálogo externo. `version-dots` prueba id. de versión con puntos como `claude-opus-4.6`. |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw es un conjunto de metadatos de vista previa propiedad de OpenClaw para proveedores cuyos plugins quizá aún no estén instalados. No forma parte de un manifiesto de plugin. Los manifiestos de plugins siguen siendo la autoridad sobre los plugins instalados. El Índice de proveedores es el contrato interno de respaldo que consumirán las futuras superficies de proveedores instalables y selectores de modelos previos a la instalación cuando un plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del plugin instalado.
3. Caché del catálogo de modelos procedente de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks del entorno de ejecución ni datos activos de modelos específicos de una cuenta. Sus catálogos de vista previa usan la misma forma de fila de proveedor de `modelCatalog` que los manifiestos de plugins, pero deben limitarse a metadatos de visualización estables, salvo que los campos del adaptador del entorno de ejecución, como `api`, `baseUrl`, los precios o los indicadores de compatibilidad, se mantengan alineados intencionadamente con el manifiesto del plugin instalado. Los proveedores con descubrimiento activo mediante `/models` deben escribir las filas actualizadas a través de la ruta explícita de la caché del catálogo de modelos, en lugar de hacer que el listado normal o la incorporación llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden contener metadatos de plugins instalables para proveedores cuyo plugin haya salido del núcleo o que, por otro motivo, aún no esté instalado. Estos metadatos reflejan el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación de npm, la integridad esperada y las etiquetas ligeras de opciones de autenticación bastan para mostrar una opción de configuración instalable. Una vez instalado el plugin, su manifiesto prevalece y la entrada del Índice de proveedores se ignora para ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves heredadas de capacidades de nivel superior del manifiesto a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas claves —ni ninguna otra lista de capacidades— se lee ya como campo de nivel superior del manifiesto; la carga normal del manifiesto solo las reconoce bajo `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Utilícelo para                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de la configuración, metadatos de opciones de autenticación e indicaciones de interfaz que deben existir antes de ejecutar el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` utilizado para puntos de entrada, restricciones de instalación, configuración o metadatos del catálogo |

Si no está claro dónde debe ubicarse un metadato, aplicar esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del plugin, colocarlo en `openclaw.plugin.json`
- si está relacionado con el empaquetado, los archivos de entrada o el comportamiento de instalación de npm, colocarlo en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugins previos al entorno de ejecución residen intencionadamente en `package.json`, bajo el bloque `openclaw`, en lugar de en `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugins de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` junto con los campos admitidos de `package.json#openclaw` que se indican a continuación.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara puntos de entrada de plugins nativos. Deben permanecer dentro del directorio del paquete del plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada compilados del entorno de ejecución de JavaScript para los paquetes instalados. Deben permanecer dentro del directorio del paquete del plugin.                                      |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero exclusivo para la configuración, usado durante la incorporación, el inicio diferido de canales y la detección de SecretRef y del estado de solo lectura de los canales. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada compilado de configuración de JavaScript para los paquetes instalados. Requiere `setupEntry`, debe existir y permanecer dentro del directorio del paquete del plugin.              |
| `openclaw.channel`                                                                         | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas que usan las superficies de configuración, auditoría y lista de comandos antes de que se cargue el entorno de ejecución del canal. |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador del estado configurado que permiten responder «¿ya existe una configuración basada únicamente en variables de entorno?» sin cargar el entorno de ejecución completo del canal. |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador del estado de autenticación persistente que permiten responder «¿ya hay alguna sesión iniciada?» sin cargar el entorno de ejecución completo del canal.                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación y actualización para plugins incluidos y publicados externamente.                                                                                                                |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                          |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host de OpenClaw, mediante un límite inferior semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                  |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo de la API de plugins de OpenClaw que requiere este paquete, mediante un límite inferior semver como `>=2026.5.27`.                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad esperada de la distribución de npm, como `sha512-...`; los flujos de instalación y actualización verifican con ella el artefacto obtenido.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta limitada de recuperación mediante reinstalación de un plugin incluido cuando la configuración no es válida.                                                                                 |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando las restricciones de plataforma de su archivo de bloqueo coinciden con el host actual.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite cargar las superficies de canal del entorno de configuración antes de comenzar a escuchar y, a continuación, aplaza el plugin de canal configurado completo hasta la activación posterior al inicio de la escucha. |

Los metadatos del manifiesto determinan qué opciones de proveedor, canal y configuración aparecen durante la incorporación antes de que se cargue el entorno de ejecución. `package.json#openclaw.install` indica a la incorporación cómo obtener o habilitar ese plugin cuando se elige una de esas opciones. No traslade las indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de plugins no incluidos. Los valores no válidos se rechazan; los valores válidos pero más recientes hacen que se omitan los plugins externos en hosts antiguos. Se presupone que los plugins de código fuente incluidos tienen la misma versión que el checkout del host.

`openclaw.install.requiredPlatformPackages` sirve para paquetes npm que exponen binarios nativos obligatorios mediante alias opcionales específicos de cada plataforma. Enumere el nombre básico del paquete npm de cada alias de plataforma compatible. Durante la instalación con npm, OpenClaw verifica únicamente el alias declarado cuyas restricciones del archivo de bloqueo coinciden con el host actual. Si npm informa de que la operación se completó correctamente, pero omite ese alias, OpenClaw vuelve a intentarlo una vez con una caché nueva y revierte la instalación si el alias sigue ausente.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no incluidos. Úselo para indicar el límite inferior de la API del SDK o del entorno de ejecución de plugins de OpenClaw con el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de plugin necesita una API más reciente, pero conserva una indicación de instalación inferior para otros flujos. De forma predeterminada, la sincronización de versiones oficiales de OpenClaw eleva los límites inferiores existentes de la API de los plugins oficiales hasta la versión de OpenClaw, pero las versiones exclusivas de plugins pueden conservar un límite inferior cuando el paquete admite intencionadamente hosts antiguos. No use únicamente la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` sigue siendo metadatos del paquete npm; OpenClaw usa el contrato `openclaw.compat.pluginApi` para tomar decisiones sobre la compatibilidad de la instalación.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el plugin esté publicado en ClawHub; la incorporación considera esta la fuente remota preferida y registra los datos del artefacto de ClawHub tras la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad para los paquetes que todavía no se han trasladado a ClawHub.

La fijación exacta de versiones de npm ya reside en `npmSpec`; por ejemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización se cierren de forma segura si el artefacto de npm obtenido deja de coincidir con la versión fijada. La incorporación interactiva sigue ofreciendo especificaciones npm de registros de confianza, incluidos nombres básicos de paquetes y etiquetas de distribución, por motivos de compatibilidad. Los diagnósticos del catálogo pueden distinguir entre fuentes exactas, flotantes, fijadas por integridad, sin integridad, con discrepancias en el nombre del paquete y con una opción predeterminada no válida. También advierten cuando existe `expectedIntegrity`, pero no hay ninguna fuente npm válida que pueda fijar. Cuando existe `expectedIntegrity`, los flujos de instalación y actualización lo aplican; cuando se omite, la resolución del registro se guarda sin fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando los análisis de estado, lista de canales o SecretRef necesiten identificar cuentas configuradas sin cargar el entorno de ejecución completo. El punto de entrada de configuración debe exponer los metadatos del canal y los adaptadores seguros para la configuración, el estado y los secretos; mantenga los clientes de red, los escuchadores del Gateway y los entornos de ejecución del transporte en el punto de entrada principal de la extensión.

Los campos de puntos de entrada del entorno de ejecución no anulan las comprobaciones de límites del paquete correspondientes a los campos de puntos de entrada del código fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que se pueda cargar una ruta de `openclaw.extensions` que salga del paquete.

`openclaw.install.allowInvalidConfigRecovery` tiene un alcance deliberadamente limitado. No permite instalar configuraciones dañadas arbitrarias. Actualmente solo permite que los flujos de instalación se recuperen de determinados errores obsoletos de actualización de plugins incluidos, como la ausencia de una ruta de plugin incluido o una entrada `channels.<id>` obsoleta correspondiente a ese mismo plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y remiten a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos del paquete para un pequeño módulo comprobador:

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

Úselo cuando la configuración, Doctor, el estado o los flujos de presencia de solo lectura necesiten una comprobación rápida de autenticación de tipo sí/no antes de que se cargue el plugin de canal completo. El estado de autenticación persistente no es el estado configurado del canal: no use estos metadatos para habilitar plugins automáticamente, reparar dependencias del entorno de ejecución ni decidir si debe cargarse un entorno de ejecución de canal. La exportación de destino debe ser una función pequeña que solo lea el estado persistente; no la encamine a través del barrel completo del entorno de ejecución del canal.

`openclaw.channel.configuredState` sigue la misma estructura para comprobaciones ligeras del estado configurado basadas únicamente en variables de entorno:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Úselo cuando un canal pueda determinar el estado configurado a partir de variables de entorno u otras entradas mínimas ajenas al entorno de ejecución. Si la comprobación necesita resolver la configuración completa o usar el entorno de ejecución real del canal, mantenga esa lógica en el hook `config.hasConfiguredState` del plugin.

## Precedencia de detección (identificadores de plugins duplicados)

OpenClaw detecta plugins en tres raíces, comprobadas en este orden: los plugins incluidos distribuidos con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), además de cualquier entrada explícita de `plugins.load.paths`.

Si dos elementos detectados comparten el mismo `id`, solo se conserva el manifiesto con **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él. Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el seguimiento de instalaciones de OpenClaw reconoce para ese mismo identificador, incluso cuando este también pertenece a un plugin incluido
3. **Incluido** — plugins distribuidos con OpenClaw
4. **Espacio de trabajo** — plugins detectados en relación con el espacio de trabajo actual
5. Cualquier otro candidato detectado

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido que se encuentre sin rastrear en el espacio de trabajo o en la raíz global no sustituirá a la compilación incluida.
- Para sustituir un plugin incluido, ejecute `openclaw plugin install` para ese identificador, de modo que la instalación global rastreada tenga mayor precedencia que la copia incluida, o fije una ruta concreta mediante `plugins.entries.<id>` para que prevalezca por la precedencia de selección mediante configuración.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- En los diagnósticos, las sustituciones de duplicados seleccionadas mediante configuración se describen como sustituciones explícitas, pero aun así generan una advertencia para que las bifurcaciones obsoletas y las sustituciones accidentales sigan siendo visibles.

## Requisitos del esquema JSON

- **Todo plugin debe incluir un esquema JSON**, incluso si no acepta ninguna configuración.
- Se admite un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer o escribir la configuración, no durante la ejecución.
- Al ampliar o bifurcar un plugin incluido con nuevas claves de configuración, actualice al mismo tiempo el `configSchema` del archivo `openclaw.plugin.json` de ese plugin. Los esquemas de los plugins incluidos son estrictos, por lo que añadir `plugins.entries.<id>.config.myNewKey` a la configuración del usuario sin añadir `myNewKey` a `configSchema.properties` se rechazará antes de que se cargue el entorno de ejecución del plugin.

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

## Comportamiento de la validación

- Las claves `channels.*` desconocidas son **errores**, salvo que el identificador del canal esté declarado en el manifiesto de un plugin. Si el mismo identificador también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin al que se hace referencia, pero que actualmente no se puede detectar), OpenClaw lo rebaja a una **advertencia**.
- Las referencias a identificadores de plugins desconocidos en `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` son **advertencias** ("se ignoró una entrada de configuración obsoleta"), no errores, por lo que las actualizaciones y los plugins eliminados o renombrados no bloquean el inicio del Gateway.
- Una referencia de `plugins.slots.memory` a un identificador de plugin desconocido es un **error**, excepto en el caso del plugin externo oficial conocido `memory-lancedb`, para el que se muestra una advertencia.
- Si un plugin está instalado, pero su manifiesto o esquema no existe o está dañado, la validación falla y Doctor informa del error del plugin.
- Si existe una configuración para un plugin, pero este está **deshabilitado**, se conserva la configuración y se muestra una **advertencia** en Doctor y en los registros.

Consulte la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidos los que se cargan desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo se utiliza para la detección y la validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se admiten comentarios, comas finales y claves sin comillas, siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evite las claves personalizadas de nivel superior.
- Se pueden omitir `channels`, `providers`, `cliBackends` y `skills` si un plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debe importar grandes porciones de código del entorno de ejecución; utilícelo para metadatos estáticos del catálogo de proveedores o descriptores de detección específicos, no para la ejecución durante las solicitudes.
- Los tipos de plugins exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valor predeterminado: `memory-core`) y `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado: `legacy`).
- Declare el tipo de plugin exclusivo en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada del entorno de ejecución está obsoleto y se conserva únicamente como mecanismo de compatibilidad alternativo para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son únicamente declarativos. El estado, la auditoría, la validación de entrega de Cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de considerar que una variable de entorno está configurada.
- Para consultar los metadatos del asistente de ejecución que requieren código del proveedor, consulte los [enlaces de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si el plugin depende de módulos nativos, documente los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm + `pnpm rebuild <package>`).

## Contenido relacionado

<CardGroup cols={3}>
  <Card title="Creación de plugins" href="/es/plugins/building-plugins" icon="rocket">
    Introducción a los plugins.
  </Card>
  <Card title="Arquitectura de plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Descripción general del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de plugins e importaciones de rutas secundarias.
  </Card>
</CardGroup>
