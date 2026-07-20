---
read_when:
    - Está desarrollando un plugin de OpenClaw
    - Necesita publicar un esquema de configuración de Plugin o depurar errores de validación del Plugin
summary: Requisitos del manifiesto del Plugin y del esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-07-20T00:54:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7eb8ad70b4f2d5bb94f45f06bb1a9c5ece6be299c0057511cb80c5a70875563f
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página trata sobre el **manifiesto nativo de Plugin de OpenClaw**, `openclaw.plugin.json`. Para conocer los diseños de paquetes compatibles (Codex, Claude, Cursor), consulte [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquetes compatibles utilizan en su lugar sus propios archivos de manifiesto:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente esos diseños, pero no los valida con el esquema `openclaw.plugin.json` que aparece a continuación. Para un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de LSP de Claude y los paquetes de hooks compatibles, cuando el diseño coincide con las expectativas del entorno de ejecución de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar el código del Plugin**. Un manifiesto ausente o no válido bloquea la validación de la configuración y se trata como un error del Plugin.

Consulte [Plugins](/es/tools/plugin) para ver la guía completa del sistema de Plugins y [Modelo de capacidades](/es/plugins/architecture#public-capability-model) para conocer el modelo nativo de capacidades y las directrices actuales de compatibilidad externa.

## Qué hace este archivo

`openclaw.plugin.json` contiene metadatos que OpenClaw lee **antes de cargar el código del Plugin**. Todo su contenido debe poder inspeccionarse con un coste lo bastante bajo como para no tener que iniciar el entorno de ejecución del Plugin.

**Se utiliza para:**

- identidad del Plugin, validación de la configuración e indicaciones para la interfaz de configuración
- metadatos de autenticación, incorporación y configuración (alias, activación automática, variables de entorno del proveedor y opciones de autenticación)
- indicaciones de activación para las superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de control de calidad que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal que se combinan en las superficies de catálogo y validación

**No se utiliza para:** registrar el comportamiento en tiempo de ejecución, declarar puntos de entrada de código ni definir metadatos de instalación de npm. Estos pertenecen al código del Plugin y a `package.json`.

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
  "description": "Plugin de proveedor de OpenRouter",
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
| `configSchema`                       | Sí      | `object`                     | Esquema JSON insertado directamente para la configuración de este plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | No       | `string[]`                   | Ids de plugins que también deben estar instalados para que este plugin tenga efecto. El descubrimiento permite cargar el plugin, pero muestra una advertencia cuando falta algún plugin obligatorio.                                                                                                               |
| `enabledByDefault`                   | No       | `true`                       | Marca un plugin incluido como habilitado de forma predeterminada. Omítalo o establezca cualquier valor distinto de `true` para dejar el plugin deshabilitado de forma predeterminada.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | No       | `string[]`                   | Marca un plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js indicadas, por ejemplo, `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                                                                                                   |
| `legacyPluginIds`                    | No       | `string[]`                   | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No       | `string[]`                   | Ids de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                                                                                                                                            |
| `kind`                               | No       | `PluginKind \| PluginKind[]` | Declara uno o más tipos exclusivos de plugins (`"memory"`, `"context-engine"`) utilizados por `plugins.slots.*`. Un plugin que posee ambos espacios declara ambos tipos en una sola matriz.                                                                                                    |
| `channels`                           | No       | `string[]`                   | Ids de canales que pertenecen a este plugin. Se utilizan para el descubrimiento y la validación de la configuración.                                                                                                                                                                                                |
| `providers`                          | No       | `string[]`                   | Ids de proveedores que pertenecen a este plugin.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | No       | `string`                     | Ruta del módulo ligero del catálogo de proveedores, relativa a la raíz del plugin, para los metadatos del catálogo de proveedores limitados al manifiesto que pueden cargarse sin activar el entorno de ejecución completo del plugin.                                                                                        |
| `modelSupport`                       | No       | `object`                     | Metadatos abreviados de familias de modelos que pertenecen al manifiesto y se utilizan para cargar automáticamente el plugin antes del entorno de ejecución.                                                                                                                                                                                |
| `modelCatalog`                       | No       | `object`                     | Metadatos declarativos del catálogo de modelos para los proveedores que pertenecen a este plugin. Este es el contrato del plano de control para futuros listados de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el entorno de ejecución del plugin.                                                |
| `modelPricing`                       | No       | `object`                     | Política de consulta de precios externos que pertenece al proveedor. Utilícela para excluir a los proveedores locales o autoalojados de los catálogos remotos de precios o asignar referencias de proveedores a ids de catálogos de OpenRouter/LiteLLM sin codificar de forma rígida los ids de proveedores en el núcleo.                                                    |
| `modelIdNormalization`               | No       | `object`                     | Limpieza de alias o prefijos de ids de modelos que pertenece al proveedor y debe ejecutarse antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                                                  |
| `providerEndpoints`                  | No       | `object[]`                   | Metadatos de host o baseUrl de puntos de conexión que pertenecen al manifiesto para rutas de proveedores que el núcleo debe clasificar antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                   |
| `providerRequest`                    | No       | `object`                     | Metadatos ligeros sobre la familia del proveedor y la compatibilidad de solicitudes que utiliza la política genérica de solicitudes antes de que se cargue el entorno de ejecución del proveedor.                                                                                                                                                     |
| `secretProviderIntegrations`         | No       | `Record<string, object>`     | Preajustes declarativos de proveedores de ejecución SecretRef que las superficies de configuración o instalación pueden ofrecer sin codificar de forma rígida en el núcleo integraciones específicas de proveedores.                                                                                                                            |
| `cliBackends`                        | No       | `string[]`                   | Ids de backends de inferencia de la CLI que pertenecen a este plugin. Se utilizan para la activación automática durante el inicio a partir de referencias de configuración explícitas.                                                                                                                                                                |
| `syntheticAuthRefs`                  | No       | `string[]`                   | Referencias de proveedores o backends de la CLI cuyo enlace de autenticación sintética perteneciente al plugin debe sondearse durante el descubrimiento inicial de modelos antes de que se cargue el entorno de ejecución.                                                                                                                                     |
| `nonSecretAuthMarkers`               | No       | `string[]`                   | Valores de marcador de posición de claves de API que pertenecen a plugins incluidos y representan un estado de credenciales locales, OAuth o del entorno que no es secreto.                                                                                                                                                       |
| `commandAliases`                     | No       | `object[]`                   | Nombres de comandos que pertenecen a este plugin y deben generar diagnósticos de configuración y de la CLI que tengan en cuenta el plugin antes de que se cargue el entorno de ejecución.                                                                                                                                                       |
| `providerUsageAuthEnvVars`           | No       | `Record<string, string[]>`   | Credenciales de proveedores solo para uso o facturación. OpenClaw utiliza estos nombres para el descubrimiento del uso y la eliminación de secretos, pero nunca para la autenticación de inferencia.                                                                                                                                  |
| `providerAuthAliases`                | No       | `Record<string, string>`     | Ids de proveedores que deben reutilizar otro id de proveedor para la búsqueda de autenticación, por ejemplo, un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                                                                                                                 |
| `providerAuthChoices`                | No       | `object[]`                   | Metadatos ligeros de selección de autenticación para los selectores de incorporación, la resolución del proveedor preferido y la vinculación sencilla de indicadores de la CLI.                                                                                                                                                              |
| `activation`                         | No       | `object`                     | Metadatos ligeros del planificador de activación para la carga durante el inicio y la carga activada por proveedores, comandos, canales, rutas y capacidades. Solo son metadatos; el entorno de ejecución del plugin sigue siendo responsable del comportamiento real.                                                                                              |
| `setup`                              | No       | `object`                     | Descriptores ligeros de configuración e incorporación que el descubrimiento y las superficies de configuración pueden inspeccionar sin cargar el entorno de ejecución del plugin.                                                                                                                                                           |
| `qaRunners`                          | No       | `object[]`                   | Descriptores ligeros del ejecutor de control de calidad utilizados por el host `openclaw qa` compartido antes de que se cargue el entorno de ejecución del plugin.                                                                                                                                                                             |
| `contracts`                          | No       | `object`                     | Instantánea estática de la propiedad de capacidades para enlaces de autenticación externos, incrustaciones, voz, transcripción en tiempo real, voz en tiempo real, comprensión de contenido multimedia, generación de imágenes, vídeos y música, obtención web, búsqueda web, proveedores de trabajadores, extracción de documentos y contenido web, y propiedad de herramientas. |
| `configContracts`                    | No       | `object`                     | Comportamiento de configuración que pertenece al manifiesto y que consumen los auxiliares genéricos del núcleo: detección de indicadores peligrosos, destinos de migración de SecretRef y acotación de rutas de configuración heredadas. Consulte la [referencia de configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Valores predeterminados ligeros de comprensión de contenido multimedia para los ids de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos básicos de autenticación para la generación de imágenes correspondientes a los identificadores de proveedor declarados en `contracts.imageGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de la URL base.                                                                                                         |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos básicos de autenticación para la generación de vídeos correspondientes a los identificadores de proveedor declarados en `contracts.videoGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de la URL base.                                                                                                         |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos básicos de autenticación para la generación de música correspondientes a los identificadores de proveedor declarados en `contracts.musicGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de la URL base.                                                                                                         |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos básicos de disponibilidad para las herramientas propiedad del plugin declaradas en `contracts.tools`. Se usan cuando una herramienta no debe cargar el entorno de ejecución salvo que existan pruebas de configuración, entorno o autenticación.                                                                                                  |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración del canal propiedad del manifiesto que se integran en las superficies de detección y validación antes de cargar el entorno de ejecución.                                                                                                                                                                 |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se deben cargar, relativos a la raíz del plugin.                                                                                                                                                                                                                    |
| `name`                               | No       | `string`                     | Nombre legible del plugin.                                                                                                                                                                                                                                                |
| `description`                        | No       | `string`                     | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | No       | `object`                     | Indicaciones de presentación opcionales para las superficies del catálogo de plugins. Estos metadatos no instalan ni habilitan un plugin, ni le otorgan confianza.                                                                                                                                               |
| `icon`                               | No       | `string`                     | URL HTTPS de la imagen para las tarjetas del mercado o catálogo. ClawHub acepta cualquier URL `https://` válida y utiliza el icono predeterminado del plugin cuando se omite o no es válida.                                                                                                         |
| `version`                            | No       | `string`                     | Versión informativa del plugin.                                                                                                                                                                                                                                              |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de la interfaz de usuario, textos de marcador de posición e indicaciones de confidencialidad para los campos de configuración.                                                                                                                                                                                                          |

## referencia del catálogo

`catalog` proporciona indicaciones opcionales de visualización para los exploradores de plugins. Los hosts pueden ignorar estas indicaciones. Nunca instalan ni habilitan el plugin y no cambian su comportamiento en tiempo de ejecución ni su nivel de confianza.

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
| `featured` | `boolean` | Indica si las superficies del catálogo deben destacar este plugin.                       |
| `order`    | `number`  | Indicación de visualización ascendente entre los plugins seleccionados; los valores inferiores aparecen antes. |

## referencia de metadatos del proveedor de generación

Los campos de metadatos del proveedor de generación describen señales estáticas de autenticación para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de que se cargue el tiempo de ejecución del proveedor, de modo que las herramientas del núcleo puedan determinar si un proveedor de generación está disponible sin importar todos los plugins de proveedores.

Use estos campos únicamente para datos declarativos cuya obtención sea económica. El transporte, las transformaciones de solicitudes, la actualización de tokens, la validación de credenciales y el comportamiento efectivo de generación permanecen en el tiempo de ejecución del plugin.

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
| `aliases`              | No       | `string[]` | Identificadores de proveedor adicionales que deben contar como alias estáticos de autenticación para el proveedor de generación.                                                       |
| `authProviders`        | No       | `string[]` | Identificadores de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                                      |
| `configSignals`        | No       | `object[]` | Señales de disponibilidad económicas basadas únicamente en la configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno.                 |
| `authSignals`          | No       | `object[]` | Señales explícitas de autenticación. Cuando están presentes, sustituyen el conjunto predeterminado de señales procedente del identificador del proveedor, `aliases` y `authProviders`.                     |
| `referenceAudioInputs` | No       | `boolean`  | Solo para generación de vídeo. Establézcalo en `true` cuando el proveedor acepte recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Qué significa                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí      | `string`   | Ruta con puntos al objeto de configuración propiedad del plugin que se debe inspeccionar, por ejemplo, `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | No       | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Use esta opción para configuraciones específicas de una capacidad, como `image`, `video` o `music`.   |
| `overlayMapPath` | No       | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse individualmente al objeto raíz. Use esta opción para mapas de cuentas con nombre, como `accounts`, donde cualquier cuenta configurada debe ser válida. |
| `required`       | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y las matrices tampoco deben estar vacíos.                                                  |
| `requiredAny`    | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                    |
| `mode`           | No       | `object`   | Condición opcional de modo de cadena dentro de la configuración efectiva. Úsela cuando la disponibilidad basada únicamente en la configuración se aplique solo a un modo.                                                                  |

Cada condición `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.                          |
| `default`    | No       | `string`   | Valor del modo que se debe usar cuando la configuración omite la ruta.                                  |
| `allowed`    | No       | `string[]` | Si está presente, la señal solo se cumple cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No       | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.       |

Cada entrada `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string` | Identificador del proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Condición opcional que hace que la señal solo cuente cuando el proveedor configurado al que se hace referencia usa una URL base permitida. Use esta opción cuando un alias de autenticación solo sea válido para determinadas API. |

Cada condición `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string`   | Identificador de configuración del proveedor cuyo `baseUrl` se debe comprobar.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL base que se debe suponer cuando la configuración del proveedor omite `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sí      | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## referencia de metadatos de herramientas

`toolMetadata` usa las mismas estructuras `configSignals` y `authSignals` que los metadatos del proveedor de generación, organizadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara indicios de disponibilidad cuya obtención es económica, de modo que OpenClaw pueda evitar importar el tiempo de ejecución de un plugin únicamente para que su fábrica de herramientas devuelva `null`.

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

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de la herramienta coincide con la política. Para las herramientas de rutas críticas cuya fábrica depende de la autenticación o la configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el tiempo de ejecución para consultarlo.

## referencia de providerAuthChoices

Cada entrada `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw lee esta información antes de que se cargue el tiempo de ejecución del proveedor. Las listas de configuración de proveedores usan estas opciones del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Qué significa                                                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí      | `string`                                                              | Id. del proveedor al que pertenece esta opción.                                                                       |
| `method`              | Sí      | `string`                                                              | Id. del método de autenticación al que se debe dirigir.                                                                            |
| `choiceId`            | Sí      | `string`                                                              | Id. estable de la opción de autenticación utilizado por los flujos de incorporación y de la CLI.                                                   |
| `choiceLabel`         | No       | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                                         |
| `choiceHint`          | No       | `string`                                                              | Texto de ayuda breve para el selector.                                                                         |
| `icon`                | No       | URL HTTPS                                                             | Imagen mostrada junto a esta opción en los clientes de incorporación compatibles.                                         |
| `website`             | No       | URL HTTPS                                                             | Página del producto, de inicio de sesión o de instalación que muestran los clientes de incorporación compatibles.                             |
| `assistantPriority`   | No       | `number`                                                              | Los valores más bajos aparecen antes en los selectores interactivos controlados por el asistente.                                        |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                                        | Oculta la opción en los selectores del asistente, pero permite seleccionarla manualmente mediante la CLI.                         |
| `deprecatedChoiceIds` | No       | `string[]`                                                            | Id. de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                                  |
| `groupId`             | No       | `string`                                                              | Id. de grupo opcional para agrupar opciones relacionadas.                                                           |
| `groupLabel`          | No       | `string`                                                              | Etiqueta visible para el usuario de ese grupo.                                                                         |
| `groupHint`           | No       | `string`                                                              | Texto de ayuda breve para el grupo.                                                                          |
| `onboardingFeatured`  | No       | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "More...". |
| `optionKey`           | No       | `string`                                                              | Clave de opción interna para flujos de autenticación sencillos con una sola marca.                                                       |
| `cliFlag`             | No       | `string`                                                              | Nombre de la marca de la CLI, como `--openrouter-api-key`.                                                            |
| `cliOption`           | No       | `string`                                                              | Forma completa de la opción de la CLI, como `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | No       | `string`                                                              | Descripción utilizada en la ayuda de la CLI.                                                                             |
| `appGuidedSecret`     | No       | `boolean`                                                             | Un secreto pegado junto con los valores predeterminados del proveedor basta para la configuración guiada por la aplicación.                              |
| `appGuidedDiscovery`  | No       | `boolean`                                                             | El método de autenticación de ejecución correspondiente controla la detección local de solo lectura mediante `appGuidedSetup`.                 |
| `appGuidedAuth`       | No       | `"oauth"` \| `"device-code"`                                          | Inicio de sesión interactivo controlado por el proveedor que los clientes de configuración nativos pueden representar de forma genérica.                        |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superficies de incorporación en las que debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`.  |

Cuando `appGuidedDiscovery` es verdadero, el método de autenticación del proveedor correspondiente debe exponer
`appGuidedSetup.detect` y `appGuidedSetup.prepare`. La detección debe ser
de solo lectura: sin iniciar sesión, obtener modelos, descargar ni escribir en la configuración. La preparación vuelve a comprobar
el modelo exacto seleccionado y devuelve una propuesta de configuración; OpenClaw prueba esa
propuesta en vivo de forma aislada y la confirma únicamente después de que la prueba resulte satisfactoria.

## Referencia de commandAliases

Utilice `commandAliases` cuando un plugin controle un nombre de comando de ejecución que los usuarios puedan incluir por error en `plugins.allow` o intentar ejecutar como comando raíz de la CLI. OpenClaw utiliza estos metadatos para realizar diagnósticos sin importar el código de ejecución del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                           |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sí      | `string`          | Nombre del comando que pertenece a este plugin.                               |
| `kind`       | No       | `"runtime-slash"` | Marca el alias como comando de barra diagonal del chat en lugar de como comando raíz de la CLI. |
| `cliCommand` | No       | `string`          | Comando raíz de la CLI relacionado que se debe sugerir para las operaciones de la CLI, si existe.  |

## Referencia de activation

Utilice `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control deben incluirlo en un plan de activación/carga.

Este bloque contiene metadatos del planificador, no es una API del ciclo de vida. No registra comportamientos de ejecución, no reemplaza `register(...)` ni garantiza que el código del plugin ya se haya ejecutado. El planificador de activación utiliza estos campos para limitar los plugins candidatos antes de recurrir a los metadatos de propiedad existentes del manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los enlaces.

Utilice preferentemente los metadatos más específicos que ya describan la propiedad. Utilice `providers`, `channels`, `commandAliases`, los descriptores de configuración o `contracts` cuando esos campos expresen la relación. Utilice `activation` para las indicaciones adicionales del planificador que no puedan representarse mediante esos campos de propiedad. Utilice `cliBackends` de nivel superior para los alias de ejecución de la CLI, como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` se utiliza únicamente para los identificadores de entornos de agente integrados que aún no tengan un campo de propiedad.

Cada plugin debe establecer `activation.onStartup` deliberadamente. Establézcalo en `true` solo cuando el plugin deba ejecutarse durante el inicio del Gateway. Establézcalo en `false` cuando el plugin esté inactivo durante el inicio y deba cargarse únicamente mediante activadores más específicos. Omitir `onStartup` ya no carga implícitamente el plugin durante el inicio; utilice metadatos de activación explícitos para el inicio, el canal, la configuración, el entorno del agente, la memoria u otros activadores de activación más específicos.

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

| Campo              | Obligatorio | Tipo                                                 | Qué significa                                                                                                                                                                               |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No       | `boolean`                                            | Activación explícita durante el inicio del Gateway. Cada plugin debe establecerla. `true` importa el plugin durante el inicio; `false` mantiene su carga diferida durante el inicio, salvo que otro activador coincidente requiera cargarlo. |
| `onProviders`      | No       | `string[]`                                           | Id. de proveedores que deben incluir este plugin en los planes de activación/carga.                                                                                                                      |
| `onAgentHarnesses` | No       | `string[]`                                           | Id. de ejecución de entornos de agente integrados que deben incluir este plugin en los planes de activación/carga. Utilice `cliBackends` de nivel superior para los alias del backend de la CLI.                                           |
| `onCommands`       | No       | `string[]`                                           | Id. de comandos que deben incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onChannels`       | No       | `string[]`                                           | Id. de canales que deben incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onRoutes`         | No       | `string[]`                                           | Tipos de ruta que deben incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onConfigPaths`    | No       | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este plugin en los planes de inicio/carga cuando la ruta esté presente y no se haya deshabilitado explícitamente.                                                      |
| `onCapabilities`   | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones generales de capacidades utilizadas por la planificación de activación del plano de control. Utilice preferentemente campos más específicos cuando sea posible.                                                                                     |

Consumidores activos actuales:

- La planificación del inicio del Gateway usa `activation.onStartup` para la importación explícita durante el inicio.
- La planificación de la CLI activada por comandos recurre a los valores heredados `commandAliases[].cliCommand` o `commandAliases[].name`.
- La planificación del inicio del entorno de ejecución del agente usa `activation.onAgentHarnesses` para los arneses integrados y `cliBackends[]` de nivel superior para los alias del entorno de ejecución de la CLI.
- La planificación de configuración/canal activada por canales recurre a la propiedad heredada `channels[]` cuando faltan metadatos explícitos de activación del canal.
- La planificación de plugins durante el inicio usa `activation.onConfigPaths` para las superficies de configuración raíz no relacionadas con canales, como el bloque `browser` del plugin de navegador incluido.
- La planificación de configuración/entorno de ejecución activada por proveedores recurre a la propiedad heredada `providers[]` y a la propiedad de nivel superior `cliBackends[]` cuando faltan metadatos explícitos de activación del proveedor.

Los diagnósticos del planificador pueden distinguir las indicaciones explícitas de activación del mecanismo alternativo basado en la propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que `activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el planificador usó en su lugar la propiedad `commandAliases`. Estas etiquetas de motivo son para los diagnósticos y las pruebas del host; los autores de plugins deben seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Use `qaRunners` cuando un plugin aporte uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantenga estos metadatos ligeros y estáticos; el entorno
de ejecución del plugin sigue siendo responsable del registro real en la CLI mediante una superficie
ligera `runtime-api.ts` que exporta valores `qaRunnerCliRegistrations` coincidentes. Un valor
opcional `adapterFactory` expone el transporte a escenarios de control de calidad compartidos sin
cambiar el ejecutor del comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecutar el carril de control de calidad en vivo de Matrix respaldado por Docker contra un servidor doméstico desechable"
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

Use `setup` cuando las superficies de configuración e incorporación necesiten metadatos ligeros propiedad del plugin antes de que se cargue el entorno de ejecución.

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

El valor `cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de la CLI. `setup.cliBackends` es la superficie de descriptores específica de la configuración para los flujos de configuración/plano de control que deben limitarse a metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda basada primero en descriptores para el descubrimiento de la configuración. Si el descriptor solo limita el plugin candidato y la configuración aún necesita hooks de entorno de ejecución más completos durante la configuración, establezca `requiresRuntime: true` y mantenga `setup-api` como ruta de ejecución alternativa.

OpenClaw incluye `setup.providers[].envVars` en las búsquedas genéricas de autenticación de proveedores y variables de entorno. Coloque allí los metadatos de entorno de configuración y estado.

Use `providerUsageAuthEnvVars` cuando una credencial de facturación o de nivel organizativo deba activar `resolveUsageAuth` sin convertirse en una credencial de inferencia. Estos nombres se incorporan al bloqueo de dotenv del espacio de trabajo, la eliminación en procesos secundarios de ACP, el filtrado de secretos del sandbox y la depuración general de secretos. El entorno de ejecución del proveedor sigue leyendo y clasificando el valor dentro de `resolveUsageAuth`.

OpenClaw también puede derivar opciones de configuración sencillas de `setup.providers[].authMethods` cuando no hay ninguna entrada de configuración disponible o cuando `setup.requiresRuntime: false` declara que el entorno de ejecución de configuración es innecesario. Las entradas explícitas `providerAuthChoices` siguen siendo preferibles para etiquetas personalizadas, flags de la CLI, el ámbito de incorporación y los metadatos del asistente.

Establezca `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la superficie de configuración. OpenClaw trata un valor explícito `false` como un contrato basado únicamente en descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si un plugin basado únicamente en descriptores sigue incluyendo una de esas entradas del entorno de ejecución de configuración, OpenClaw informa de un diagnóstico adicional y continúa ignorándola. Omitir `requiresRuntime` mantiene el comportamiento alternativo heredado para que no se interrumpan los plugins existentes que añadieron descriptores sin el flag.

Dado que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados `setup.providers[].id` y `setup.cliBackends[]` deben ser únicos entre los plugins descubiertos. En caso de propiedad ambigua, se produce un fallo seguro en lugar de elegir un ganador según el orden de descubrimiento.

Cuando se ejecuta el entorno de ejecución de configuración, los diagnósticos del registro de configuración informan de discrepancias en los descriptores si `setup-api` registra un proveedor o backend de la CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro correspondiente en el entorno de ejecución. Estos diagnósticos son adicionales y no rechazan los plugins heredados.

### Referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Significado                                                                                    |
| -------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`           | Sí      | `string`   | Identificador del proveedor expuesto durante la configuración o la incorporación. Mantenga los identificadores normalizados globalmente únicos.             |
| `authMethods`  | No       | `string[]` | Identificadores de métodos de configuración/autenticación que admite este proveedor sin cargar el entorno de ejecución completo.                       |
| `envVars`      | No       | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el entorno de ejecución del plugin.               |
| `authEvidence` | No       | `object[]` | Comprobaciones ligeras de pruebas de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` sirve para marcadores de credenciales locales propiedad del proveedor que pueden verificarse sin cargar código del entorno de ejecución. Estas comprobaciones deben ser ligeras y locales: sin llamadas de red, lecturas de llaveros ni gestores de secretos, comandos de shell ni sondeos de la API del proveedor.

Entradas de pruebas admitidas:

| Campo              | Obligatorio | Tipo       | Significado                                                                                                  |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sí      | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No       | `string`   | Variable de entorno que contiene una ruta explícita a un archivo de credenciales.                                                           |
| `fallbackPaths`    | No       | `string[]` | Rutas de archivos de credenciales locales que se comprueban cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No       | `string[]` | Al menos una de las variables de entorno enumeradas debe contener un valor para que la prueba sea válida.                                    |
| `requiresAllEnv`   | No       | `string[]` | Todas las variables de entorno enumeradas deben contener un valor para que la prueba sea válida.                                           |
| `credentialMarker` | Sí      | `string`   | Marcador no secreto devuelto cuando la prueba está presente.                                                       |
| `source`           | No       | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                                               |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Significado                                                                                       |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descriptores de configuración del proveedor expuestos durante la configuración y la incorporación.                                     |
| `cliBackends`      | No       | `string[]` | Identificadores de backend durante la configuración usados para la búsqueda de configuración basada primero en descriptores. Mantenga los identificadores normalizados globalmente únicos. |
| `configMigrations` | No       | `string[]` | Identificadores de migración de configuración propiedad de la superficie de configuración de este plugin.                                          |
| `requiresRuntime`  | No       | `boolean`  | Indica si la configuración aún necesita ejecutar `setup-api` después de la búsqueda mediante descriptores.                            |

## Referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas indicaciones de renderizado. Las claves pueden usar puntos para los campos de configuración anidados, pero ningún segmento de la ruta puede ser `__proto__`, `constructor` ni `prototype`; la configuración rechaza esos nombres.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave de API",
      "help": "Se usa para las solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada indicación de campo puede incluir:

| Campo         | Tipo       | Significado                           |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario.                |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas opcionales de la interfaz de usuario.                       |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o confidencial. |
| `placeholder` | `string`   | Texto de marcador de posición para las entradas del formulario.       |

## Referencia de contracts

Use `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda leer sin importar el entorno de ejecución del plugin.

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
| `trustedToolPolicies`            | `string[]` | Identificadores de políticas locales de confianza previas a las herramientas que puede registrar un plugin instalado. Los plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Identificadores de proveedores cuyo hook de perfil de autenticación externa pertenece a este plugin.                                                                      |
| `embeddingProviders`             | `string[]` | Identificadores de proveedores generales de embeddings que pertenecen a este plugin para el uso reutilizable de embeddings vectoriales, incluida la memoria.                                 |
| `speechProviders`                | `string[]` | Identificadores de proveedores de voz que pertenecen a este plugin.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Identificadores de proveedores de transcripción en tiempo real que pertenecen a este plugin.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Identificadores de proveedores de voz en tiempo real que pertenecen a este plugin.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Identificadores obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este plugin.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Identificadores de proveedores de comprensión de contenido multimedia que pertenecen a este plugin.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Identificadores de proveedores de fuentes de transcripciones que pertenecen a este plugin.                                                                                     |
| `documentExtractors`             | `string[]` | Identificadores de proveedores de extracción de documentos (por ejemplo, PDF) que pertenecen a este plugin.                                                                  |
| `imageGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de imágenes que pertenecen a este plugin.                                                                                      |
| `videoGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de vídeo que pertenecen a este plugin.                                                                                      |
| `musicGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de música que pertenecen a este plugin.                                                                                      |
| `webContentExtractors`           | `string[]` | Identificadores de proveedores de extracción de contenido de páginas web que pertenecen a este plugin.                                                                           |
| `webFetchProviders`              | `string[]` | Identificadores de proveedores de obtención web que pertenecen a este plugin.                                                                                             |
| `webSearchProviders`             | `string[]` | Identificadores de proveedores de búsqueda web que pertenecen a este plugin.                                                                                            |
| `workerProviders`                | `string[]` | Identificadores de proveedores de trabajadores en la nube que pertenecen a este plugin para el aprovisionamiento y el ciclo de vida de los arrendamientos respaldados por perfiles.                                      |
| `usageProviders`                 | `string[]` | Identificadores de proveedores cuyos hooks de autenticación de uso y de instantáneas de uso pertenecen a este plugin.                                                             |
| `migrationProviders`             | `string[]` | Identificadores de proveedores de importación que pertenecen a este plugin para `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Autorización reservada para rutas HTTP autenticadas de plugins que despachan métodos del Gateway dentro del proceso.                                  |
| `tools`                          | `string[]` | Nombres de herramientas de agente que pertenecen a este plugin.                                                                                                   |

`contracts.embeddedExtensionFactories` se conserva para las fábricas de extensiones incluidas que solo funcionan con el servidor de aplicaciones de Codex. En su lugar, las transformaciones incluidas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)`. Los plugins instalados pueden usar el mismo punto de integración de middleware solo cuando esté habilitado explícitamente y únicamente para los entornos de ejecución que declaren en `contracts.agentToolResultMiddleware`.

Los plugins instalados que necesiten el nivel de políticas previas a las herramientas considerado de confianza por el host deben declarar en `contracts.trustedToolPolicies` cada identificador local registrado y estar habilitados explícitamente. Los plugins incluidos conservan la ruta de políticas de confianza existente, pero los plugins instalados con identificadores de políticas no declarados se rechazan antes del registro. Los identificadores de políticas están limitados al ámbito del plugin que los registra, por lo que dos plugins pueden declarar y registrar `workflow-budget`; un mismo plugin no puede registrar dos veces el mismo identificador local.

Los registros `api.registerTool(...)` del entorno de ejecución deben coincidir con `contracts.tools`. El descubrimiento de herramientas usa esta lista para cargar únicamente los entornos de ejecución de plugins que pueden ser propietarios de las herramientas solicitadas.

Los plugins de proveedores que implementen `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los plugins de proveedores que implementen tanto `resolveUsageAuth` como `fetchUsageSnapshot` deben declarar en `contracts.usageProviders` cada identificador de proveedor descubierto automáticamente. El descubrimiento de uso lee este contrato antes de cargar el código del entorno de ejecución y, a continuación, verifica ambos hooks después de cargar únicamente los propietarios declarados.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` por cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Use el contrato general para la generación reutilizable de vectores, incluidos los proveedores consumidos por la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta específica de memoria y se conserva únicamente mientras los proveedores existentes migran al punto de integración genérico de proveedores de embeddings.

Los proveedores de trabajadores deben declarar en `contracts.workerProviders` cada identificador `api.registerWorkerProvider(...)`. El núcleo conserva la intención duradera antes de llamar a `provision`; los proveedores validan su configuración antes de la asignación externa, y las llamadas repetidas con el mismo identificador de operación deben adoptar el mismo arrendamiento. El núcleo también conserva esa instantánea de la configuración validada y la pasa con `leaseId` a `inspect({ leaseId, profile })` y `destroy({ leaseId, profile })`, incluso después de que se modifique o elimine el perfil indicado. La destrucción es idempotente, la inspección devuelve la unión cerrada de estados `active` / `destroyed` / `unknown`, y el material de la clave privada SSH solo se referencia mediante `SecretRef`. Los endpoints SSH aprovisionados también deben incluir una `hostKey` pública procedente de una salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario, para que el núcleo pueda fijar el host antes de conectarse. Los proveedores que generen referencias de identidad dinámicas pueden implementar la función autoritativa `resolveSshIdentity({ leaseId, profile, keyRef })`; los proveedores que no la implementen usan el solucionador genérico de secretos del núcleo. Una respuesta autoritativa `unknown` deja huérfano un registro local activo; después de una solicitud de destrucción conservada, confirma el desmantelamiento.

`contracts.gatewayMethodDispatch` acepta actualmente `"authenticated-request"`. Es una barrera de higiene de API para rutas HTTP nativas de plugins que despachan intencionadamente métodos del plano de control del Gateway dentro del proceso, no un entorno aislado contra plugins nativos maliciosos. Úsela únicamente para superficies incluidas o de operadores sometidas a una revisión rigurosa que ya requieran autenticación HTTP del Gateway. Una ruta autorizada sigue siendo accesible mientras la admisión de trabajo raíz del Gateway está cerrada solo cuando también declara `auth: "gateway"` y el `gatewayRuntimeScopeSurface: "trusted-operator"` específico de la ruta; las rutas hermanas normales del mismo plugin permanecen detrás del límite de admisión. Esto permite que el estado de suspensión y la reanudación sigan siendo accesibles sin conceder a todo el plugin una omisión de la admisión. Mantenga acotados el análisis y la conformación de respuestas fuera del despacho; el trabajo sustantivo o con mutaciones debe pasar por el despacho de métodos del Gateway, que es responsable de aplicar la admisión y el ámbito.

## Referencia de configContracts

Use `configContracts` para el comportamiento de configuración propiedad del manifiesto que necesiten los asistentes genéricos del núcleo sin importar el entorno de ejecución del plugin: detección de indicadores peligrosos, destinos de migración de SecretRef y restricción de rutas de configuración antiguas.

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
| `compatibilityMigrationPaths` | No       | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad de este plugin durante la configuración. Permite que las lecturas genéricas de la configuración en tiempo de ejecución omitan todas las superficies de configuración de plugins cuando la configuración nunca hace referencia al plugin.                 |
| `compatibilityRuntimePaths`   | No       | `string[]` | Rutas de compatibilidad relativas a la raíz que este plugin puede atender durante la ejecución antes de que el código del plugin se active por completo. Úselas para superficies antiguas que deban restringir los conjuntos de candidatos incluidos sin importar todos los entornos de ejecución de plugins compatibles. |
| `dangerousFlags`              | No       | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando estén habilitados. Véase a continuación.                                                                                                                                   |
| `secretInputs`                | No       | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` para la migración de SecretRef, la auditoría, la materialización al iniciar y el aislamiento opcional del propietario en tiempo de ejecución. Véase a continuación.                                                                             |

Cada entrada `dangerousFlags` admite:

| Campo    | Obligatorio | Tipo                                  | Qué significa                                                                                                       |
| -------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sí      | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapas o matrices. |
| `equals` | Sí      | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                            |

`secretInputs` admite:

| Campo                   | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No       | `boolean`  | Anula la habilitación predeterminada del plugin incluido al decidir si esta superficie SecretRef está activa. Se utiliza cuando el plugin está incluido, pero la superficie debe permanecer inactiva hasta que se habilite explícitamente en la configuración.                                                                                                                                            |
| `paths`                 | Sí      | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`), `expected` opcional (actualmente solo `"string"`) y `ownerKind` opcional (actualmente solo `"route"`). Un propietario declarado aísla únicamente esa ruta coincidente exacta cuando falla la resolución; su id. de propietario es la ruta de configuración completa. |

## Referencia de mediaUnderstandingProviderMetadata

Se utiliza `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tiene modelos predeterminados, prioridad de respaldo para autenticación automática o compatibilidad nativa con documentos que los auxiliares genéricos del núcleo necesitan antes de que se cargue el entorno de ejecución. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

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
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados de modelos por capacidad utilizados cuando la configuración no especifica un modelo.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan primero para el respaldo automático de proveedores basado en credenciales.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documentos nativas admitidas por el proveedor.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sustituciones de modelos por tipo de documento. Se establece `image: false` para deshabilitar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Se utiliza `channelConfigs` cuando un plugin de canal necesita metadatos de configuración de bajo coste antes de que se cargue el entorno de ejecución. La detección de configuración o estado del canal de solo lectura puede utilizar estos metadatos directamente para canales externos configurados cuando no haya disponible una entrada de configuración inicial o cuando `setup.requiresRuntime: false` declare innecesario el entorno de ejecución de configuración inicial.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando las instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué plugin es propietario de ese canal configurado antes de que se ejecute el código del entorno de ejecución del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaren `channels[]` también deben declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el plugin, pero el esquema de configuración de la ruta en frío, la configuración inicial y las superficies de la interfaz de control no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el entorno de ejecución del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos de `auto` para las comprobaciones de configuración de comandos que se ejecutan antes de cargar el entorno de ejecución del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands`, junto con los demás metadatos del catálogo de canales propiedad del paquete.

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
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Es obligatorio para cada entrada de configuración de canal declarada.         |
| `uiHints`     | `Record<string, object>` | Etiquetas, marcadores de posición e indicaciones de información confidencial opcionales para esa sección de configuración del canal.          |
| `label`       | `string`                 | Etiqueta del canal integrada en las superficies de selección e inspección cuando los metadatos del entorno de ejecución no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos para comandos nativos y Skills nativas en las comprobaciones de configuración previas al entorno de ejecución.       |
| `preferOver`  | `string[]`               | Id. de plugins heredados o de menor prioridad que este canal debe superar en las superficies de selección.    |

### Sustitución de otro plugin de canal

Se utiliza `preferOver` cuando el plugin es el propietario preferido de un id. de canal que también puede proporcionar otro plugin. Los casos habituales son un id. de plugin renombrado, un plugin independiente que sustituye a uno incluido o una bifurcación mantenida que conserva el mismo id. de canal para mantener la compatibilidad de configuración.

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

Cuando se configura `channels.chat`, OpenClaw tiene en cuenta tanto el id. del canal como el id. del plugin preferido. Si el plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración efectiva del entorno de ejecución para que un solo plugin sea propietario del canal y sus herramientas. La selección explícita del usuario sigue teniendo prioridad: si el usuario habilita explícitamente ambos plugins (mediante `plugins.allow` o una configuración `plugins.entries` sustancial), OpenClaw conserva esa elección e informa de diagnósticos de canales o herramientas duplicados en lugar de cambiar silenciosamente el conjunto de plugins solicitado.

Se debe limitar `preferOver` a los id. de plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general y no cambia el nombre de las claves de configuración del usuario.

## Referencia de modelSupport

Se utiliza `modelSupport` cuando OpenClaw debe deducir el plugin del proveedor a partir de id. abreviados de modelos como `gpt-5.6-sol` o `claude-sonnet-4.6` antes de cargar el entorno de ejecución del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas de `provider/model` utilizan los metadatos del manifiesto `providers` propietario
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si coinciden un plugin no incluido y uno incluido, tiene prioridad el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados mediante `startsWith` con id. abreviados de modelos.                 |
| `modelPatterns` | `string[]` | Expresiones de origen regulares comparadas con id. abreviados de modelos después de eliminar el sufijo del perfil. |

Las entradas `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contengan repeticiones anidadas (por ejemplo, `(a+)+$`). Los patrones que no superan la comprobación de seguridad se omiten silenciosamente, al igual que las expresiones regulares sintácticamente no válidas. Los patrones deben ser sencillos y evitar cuantificadores anidados.

## Referencia de modelCatalog

Se utiliza `modelCatalog` cuando OpenClaw debe conocer los metadatos de modelos del proveedor antes de cargar el entorno de ejecución del plugin. Esta es la fuente propiedad del manifiesto para filas fijas del catálogo, alias de proveedores, reglas de supresión y modo de detección. La actualización en tiempo de ejecución sigue perteneciendo al código del entorno de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo se requiere el entorno de ejecución.

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

| Campo            | Tipo                                                     | Qué significa                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas del catálogo para los identificadores de proveedor que pertenecen a este plugin. Las claves también deben aparecer en `providers` de nivel superior.       |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedores que deben resolverse como un proveedor propio para la planificación del catálogo o de la supresión.              |
| `suppressions`   | `object[]`                                               | Filas de modelos de otra fuente que este plugin suprime por un motivo específico del proveedor.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica si el catálogo del proveedor puede leerse desde los metadatos del manifiesto, actualizarse en la caché o requiere el entorno de ejecución. |
| `runtimeAugment` | `boolean`                                                | Establézcalo en `true` solo cuando el entorno de ejecución del proveedor deba añadir filas al catálogo después de planificar el manifiesto o la configuración.       |

`aliases` participa en la búsqueda de pertenencia del proveedor para la planificación del catálogo de modelos. Los destinos de los alias deben ser proveedores de nivel superior pertenecientes al mismo plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar las sustituciones de API o URL base del alias sin cargar el entorno de ejecución del proveedor. Los alias no amplían los listados de catálogos sin filtrar; las listas generales solo emiten las filas del proveedor canónico propietario.

`suppressions` sustituye el antiguo enlace `suppressBuiltInModel` del entorno de ejecución del proveedor. Las entradas de supresión solo se respetan cuando el proveedor pertenece al plugin o se declara como una clave `modelCatalog.aliases` cuyo destino es un proveedor propio. Los enlaces de supresión del entorno de ejecución ya no se invocan durante la resolución de modelos.

Campos del proveedor:

| Campo                 | Tipo                     | Qué significa                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base predeterminada opcional para los modelos de este catálogo de proveedor.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos de este catálogo de proveedor.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Identificador opcional del modelo pequeño recomendado por el proveedor para tareas breves de utilidad interna (títulos, narración del progreso). Se usa cuando `agents.defaults.utilityModel` no está definido y este proveedor sirve el modelo principal del agente. |
| `models`              | `object[]`               | Filas de modelos obligatorias. Se ignoran las filas sin `id`.                                                                                                                                                            |

Campos del modelo:

| Campo              | Tipo                                                           | Qué significa                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Identificador del modelo local al proveedor, sin el prefijo `provider/`.                    |
| `name`             | `string`                                                       | Nombre para mostrar opcional.                                                      |
| `api`              | `ModelApi`                                                     | Sustitución opcional de la API por modelo.                                            |
| `baseUrl`          | `string`                                                       | Sustitución opcional de la URL base por modelo.                                       |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Los demás valores se descartan silenciosamente.            |
| `reasoning`        | `boolean`                                                      | Indica si el modelo ofrece comportamiento de razonamiento.                               |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens`    | `number`                                                       | Límite efectivo opcional del contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Máximo de tokens de salida cuando se conoce.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sustituciones opcionales del identificador o los parámetros del modelo por nivel de razonamiento.                    |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`           | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de la configuración de modelos de OpenClaw.  |
| `mediaInput`       | `object`                                                       | Configuración de entrada opcional por modalidad, actualmente solo para imágenes.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprima solo cuando la fila no deba aparecer en absoluto.          |
| `statusReason`     | `string`                                                       | Motivo opcional que se muestra con un estado de no disponibilidad.                            |
| `replaces`         | `string[]`                                                     | Identificadores antiguos de modelos locales al proveedor que este modelo sustituye.                       |
| `replacedBy`       | `string`                                                       | Identificador de sustitución del modelo local al proveedor para las filas obsoletas.                    |
| `tags`             | `string[]`                                                     | Etiquetas estables utilizadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identificador del proveedor de la fila de origen que se suprimirá. Debe pertenecer a este plugin o declararse como un alias propio. |
| `model`                    | `string`   | Identificador del modelo local al proveedor que se suprimirá.                                                                      |
| `reason`                   | `string`   | Mensaje opcional que se muestra cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de la URL base del proveedor necesarios para que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores `api` exactos de la configuración del proveedor necesarios para que se aplique la supresión.              |

No coloque datos exclusivos del entorno de ejecución en `modelCatalog`. Use `static` solo cuando las filas del manifiesto estén lo suficientemente completas como para que las listas filtradas por proveedor y las superficies de selección omitan la detección del registro o del entorno de ejecución. Use `refreshable` cuando las filas del manifiesto sean semillas o complementos útiles que puedan incluirse en las listas, pero una actualización o caché pueda añadir más filas posteriormente; las filas actualizables no son autoritativas por sí solas. Use `runtime` cuando OpenClaw deba cargar el entorno de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Use `modelIdNormalization` para la normalización sencilla de identificadores de modelos pertenecientes al proveedor que debe realizarse antes de cargar su entorno de ejecución. Esto mantiene los alias, como los nombres cortos de modelos, los identificadores antiguos locales al proveedor y las reglas de prefijos de proxy, en el manifiesto del plugin propietario, en lugar de en las tablas principales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de identificadores de modelos que no distinguen entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminarán antes de buscar el alias, útiles para la duplicación antigua de proveedor/modelo.     |
| `prefixWhenBare`                     | `string`                | Prefijo que se añadirá cuando el identificador normalizado del modelo aún no contenga `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para identificadores sin prefijo después de buscar el alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Use `providerEndpoints` para la clasificación de puntos de conexión que la política genérica de solicitudes debe conocer antes de cargar el entorno de ejecución del proveedor. El núcleo sigue siendo responsable del significado de cada `endpointClass`; los manifiestos de los plugins son responsables de los metadatos del host y de la URL base.

Los plugins de proveedores externalizados oficialmente se excluyen de la distribución principal, por lo que
sus manifiestos no están visibles hasta que se instalan. Sus `providerEndpoints` también deben
reflejarse en `scripts/lib/official-external-provider-catalog.json` para que
la clasificación de puntos de conexión siga funcionando sin el plugin; una prueba de contrato
garantiza la correspondencia.

Campos de los puntos de conexión:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint principal conocida, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Use el prefijo `.` para que la coincidencia se limite a sufijos de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                             |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex.                 |

## Referencia de providerRequest

Use `providerRequest` para metadatos de compatibilidad de solicitudes de bajo coste que necesita la política genérica de solicitudes sin cargar el entorno de ejecución del proveedor. Mantenga la reescritura de cargas útiles específica del comportamiento en los hooks del entorno de ejecución del proveedor o en los asistentes compartidos de la familia de proveedores.

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
| `family`              | `string`     | Etiqueta de la familia del proveedor utilizada por las decisiones genéricas de compatibilidad de solicitudes y los diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de la familia del proveedor para asistentes compartidos de solicitudes.              |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completado compatibles con OpenAI, actualmente `supportsStreamingUsage`.       |

## Referencia de secretProviderIntegrations

Use `secretProviderIntegrations` cuando un plugin pueda publicar un preajuste reutilizable de proveedor de ejecución SecretRef. OpenClaw lee estos metadatos antes de que se cargue el entorno de ejecución del plugin, almacena la propiedad del plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución real de secretos al entorno de ejecución de SecretRef. Los preajustes solo se exponen para plugins incluidos y plugins instalados que se detectan en las raíces administradas de instalación de plugins, como las instalaciones desde git y ClawHub.

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

La clave del mapa es el id. de integración. Si se omite `providerAlias`, OpenClaw usa el id. de integración como alias del proveedor SecretRef. Los alias de proveedores deben coincidir con el patrón normal de alias de proveedores SecretRef, por ejemplo, `team-secrets` o `onepassword-work`.

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

Durante el inicio o la recarga, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del plugin, comprobando que el plugin propietario esté instalado y activo, y materializando el comando de ejecución a partir del manifiesto. Al desactivar o eliminar el plugin, se revoca el proveedor para las SecretRefs activas. Los operadores que deseen una configuración de ejecución independiente aún pueden escribir directamente proveedores manuales `command`/`args`.

Actualmente solo se admiten preajustes `source: "exec"`. `command` debe ser `${node}` y `args[0]` debe ser un script de resolución `./` relativo a la raíz del plugin. OpenClaw lo materializa durante el inicio o la recarga con el ejecutable actual de Node y la ruta absoluta del script dentro del plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de preajustes del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar directamente proveedores manuales de ejecución independientes.

OpenClaw obtiene `trustedDirs` para los preajustes del manifiesto a partir de la raíz del plugin y, para los preajustes `${node}`, del directorio actual del ejecutable de Node. Se ignoran los `trustedDirs` definidos en el manifiesto. Otras opciones del proveedor de ejecución, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, se transfieren a la configuración normal del proveedor de ejecución SecretRef.

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
| `external`   | `boolean`         | Establezca `false` para proveedores locales o autoalojados que nunca deben obtener precios de OpenRouter ni LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id. del proveedor del catálogo externo cuando difiere del id. del proveedor de OpenClaw, por ejemplo, `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los ids. de modelo que contienen barras como referencias anidadas de proveedor/modelo, lo que resulta útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales del id. de modelo del catálogo externo. `version-dots` prueba ids. de versión con puntos, como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw contiene metadatos de vista previa propiedad de OpenClaw para proveedores cuyos plugins quizá aún no estén instalados. No forma parte del manifiesto de un plugin. Los manifiestos de plugins siguen siendo la autoridad sobre los plugins instalados. El Índice de proveedores es el contrato de respaldo interno que consumirán las futuras superficies de proveedores instalables y selectores de modelos previos a la instalación cuando no haya instalado un plugin del proveedor.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del plugin instalado.
3. Caché del catálogo de modelos procedente de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks del entorno de ejecución ni datos de modelos activos específicos de una cuenta. Sus catálogos de vista previa utilizan la misma forma de fila de proveedor `modelCatalog` que los manifiestos de plugins, pero deben limitarse a metadatos de presentación estables, salvo que los campos del adaptador del entorno de ejecución, como `api`, `baseUrl`, los precios o los indicadores de compatibilidad, se mantengan alineados intencionadamente con el manifiesto del plugin instalado. Los proveedores con detección activa mediante `/models` deben escribir filas actualizadas a través de la ruta explícita de la caché del catálogo de modelos, en lugar de hacer que el listado normal o la incorporación llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden incluir metadatos de plugins instalables para proveedores cuyo plugin se haya trasladado fuera del núcleo o que aún no esté instalado por otro motivo. Estos metadatos reflejan el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación de npm, la integridad esperada y las etiquetas simples de opciones de autenticación son suficientes para mostrar una opción de configuración instalable. Una vez instalado el plugin, su manifiesto tiene prioridad y la entrada del Índice de proveedores se ignora para ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves de capacidades heredadas del nivel superior del manifiesto a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas claves (ni ninguna otra lista de capacidades) se lee ya como campo de nivel superior del manifiesto; la carga normal de manifiestos solo las reconoce dentro de `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                   | Se usa para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detección, validación de la configuración, metadatos de opciones de autenticación y sugerencias de interfaz que deben existir antes de ejecutar el código del plugin                         |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` utilizado para puntos de entrada, restricciones de instalación, configuración o metadatos del catálogo |

En caso de duda sobre dónde deben estar unos metadatos, aplique esta regla:

- si OpenClaw debe conocerlos antes de cargar el código del plugin, colóquelos en `openclaw.plugin.json`
- si se refieren al empaquetado, los archivos de entrada o el comportamiento de instalación de npm, colóquelos en `package.json`

### Campos de package.json que afectan a la detección

Algunos metadatos del plugin previos al entorno de ejecución se encuentran intencionadamente en `package.json`, dentro del bloque `openclaw`, en lugar de `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugins de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` junto con los campos `package.json#openclaw` admitidos que se indican a continuación.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada nativos del plugin. Deben permanecer dentro del directorio del paquete del plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada compilados del entorno de ejecución JavaScript para los paquetes instalados. Deben permanecer dentro del directorio del paquete del plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero exclusivo para la configuración, utilizado durante la incorporación, el inicio diferido del canal y la detección de SecretRef y del estado del canal en modo de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada compilado de configuración JavaScript para los paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del plugin.                         |
| `openclaw.channel`                                                                         | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                 |
| `openclaw.channel.approvalFlags`                                                           | Indicadores de comportamiento de aprobación cerrada disponibles antes de cargar el entorno de ejecución. `native` significa que el canal controla la interfaz de aprobación nativa y la resolución en el mismo turno.                                           |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de valores predeterminados automáticos para comandos nativos y Skills nativas, utilizados por las superficies de configuración, auditoría y lista de comandos antes de cargar el entorno de ejecución del canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador de estado configurado que pueden responder «¿ya existe una configuración basada únicamente en variables de entorno?» sin cargar todo el entorno de ejecución del canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder «¿ya hay alguna sesión iniciada?» sin cargar todo el entorno de ejecución del canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación y actualización para plugins incluidos y publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host OpenClaw, mediante un límite inferior semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo de la API de plugins de OpenClaw requerido por este paquete, mediante un límite inferior semver como `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad de distribución de npm esperada, como `sha512-...`; los flujos de instalación y actualización verifican con ella el artefacto obtenido.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta limitada de recuperación mediante reinstalación de un plugin incluido cuando la configuración no es válida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando las restricciones de plataforma de su archivo de bloqueo coinciden con el host actual.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies del canal del entorno de ejecución de configuración se carguen antes de escuchar y, después, pospone el plugin completo del canal configurado hasta la activación posterior al inicio de la escucha.                                                 |

Los metadatos del manifiesto determinan qué opciones de proveedor, canal y configuración aparecen durante la incorporación antes de cargar el entorno de ejecución. `package.json#openclaw.install` indica a la incorporación cómo obtener o habilitar ese plugin cuando se elige una de esas opciones. No traslade las indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de plugins no incluidos. Los valores no válidos se rechazan; los valores válidos pero más recientes hacen que los hosts antiguos omitan los plugins externos. Se presupone que los plugins de origen incluidos comparten la versión del checkout del host.

`openclaw.install.requiredPlatformPackages` está destinado a paquetes npm que exponen los binarios nativos necesarios mediante alias opcionales específicos de la plataforma. Indique el nombre simple del paquete npm para cada alias de plataforma compatible. Durante la instalación mediante npm, OpenClaw solo verifica el alias declarado cuyas restricciones del archivo de bloqueo coinciden con el host actual. Si npm informa de que la operación se realizó correctamente, pero omite ese alias, OpenClaw vuelve a intentarlo una vez con una caché nueva y revierte la instalación si el alias sigue sin aparecer.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no incluidos. Utilícelo para definir el límite inferior de la API del SDK o del entorno de ejecución de plugins de OpenClaw con el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de plugin necesita una API más reciente, pero conserva una indicación de instalación inferior para otros flujos. De forma predeterminada, la sincronización oficial de versiones de OpenClaw eleva los límites inferiores de la API de los plugins oficiales existentes a la versión de OpenClaw, pero las versiones exclusivas de plugins pueden conservar un límite inferior cuando el paquete admite intencionadamente hosts antiguos. No utilice únicamente la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` sigue siendo un metadato del paquete npm; OpenClaw utiliza el contrato `openclaw.compat.pluginApi` para tomar decisiones de compatibilidad de instalación.

Los metadatos oficiales de instalación bajo demanda deben utilizar `clawhubSpec` cuando el plugin se publique en ClawHub; la incorporación lo considera la fuente remota preferida y registra los datos del artefacto de ClawHub tras la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad para los paquetes que todavía no se han trasladado a ClawHub.

La fijación exacta de versiones de npm ya reside en `npmSpec`, por ejemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales de catálogos externos deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen de forma segura si el artefacto de npm obtenido deja de coincidir con la versión fijada. La incorporación interactiva sigue ofreciendo especificaciones de npm de registros de confianza, incluidos nombres simples de paquetes y etiquetas de distribución, por compatibilidad. Los diagnósticos del catálogo pueden distinguir entre fuentes exactas, variables, fijadas por integridad, sin integridad, con un nombre de paquete que no coincide, con una opción predeterminada no válida. También advierten cuando `expectedIntegrity` está presente, pero no hay ninguna fuente npm válida que pueda fijar. Cuando `expectedIntegrity` está presente, los flujos de instalación y actualización lo aplican; cuando se omite, la resolución del registro se guarda sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando los análisis de estado, lista de canales o SecretRef necesiten identificar las cuentas configuradas sin cargar todo el entorno de ejecución. La entrada de configuración debe exponer los metadatos del canal, además de adaptadores seguros para la configuración, el estado y los secretos; mantenga los clientes de red, los procesos de escucha del Gateway y los entornos de ejecución de transporte en el punto de entrada principal de la extensión.

Los campos de los puntos de entrada del entorno de ejecución no anulan las comprobaciones de límites del paquete para los campos de los puntos de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que se pueda cargar una ruta `openclaw.extensions` que se salga de esos límites.

`openclaw.install.allowInvalidConfigRecovery` tiene un alcance deliberadamente limitado. No permite instalar cualquier configuración dañada. Actualmente, solo permite que los flujos de instalación se recuperen de determinados fallos obsoletos de actualización de plugins incluidos, como la ausencia de una ruta de plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y remiten a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un pequeño módulo comprobador:

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

Utilícelo cuando la configuración, el diagnóstico, el estado o los flujos de presencia de solo lectura necesiten una comprobación sencilla de sí o no sobre la autenticación antes de que se cargue el plugin completo del canal. El estado de autenticación persistido no es el estado configurado del canal: no utilice estos metadatos para habilitar plugins automáticamente, reparar dependencias del entorno de ejecución ni decidir si debe cargarse el entorno de ejecución de un canal. La exportación de destino debe ser una función pequeña que solo lea el estado persistido; no la encamine a través del barrel completo del entorno de ejecución del canal.

`openclaw.channel.configuredState` permite comprobaciones económicas de la configuración. Prefiera metadatos declarativos de entorno cuando las variables de entorno sean suficientes:

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

Utilice `env.allOf` cuando todas las variables enumeradas sean obligatorias y `env.anyOf` cuando baste con cualquier variable que no esté vacía. Si una comprobación pequeña ajena al entorno de ejecución necesita más que metadatos de entorno, utilice `specifier` junto con `exportName`, como se muestra para `persistedAuthState`; cuando `env` está presente, OpenClaw lo utiliza sin cargar ese módulo. Si la comprobación necesita la resolución completa de la configuración o el entorno de ejecución real del canal, mantenga esa lógica en el hook `config.hasConfiguredState` del plugin.

## Precedencia de detección (identificadores de plugin duplicados)

OpenClaw detecta plugins en tres raíces, que se comprueban en este orden: los plugins incluidos distribuidos con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), además de cualquier entrada explícita de `plugins.load.paths`.

Si dos elementos detectados comparten el mismo `id`, solo se conserva el manifiesto con la **precedencia más alta**; los duplicados con menor precedencia se descartan en lugar de cargarse junto a él. Precedencia, de mayor a menor:

1. **Seleccionado mediante la configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el seguimiento de instalaciones de OpenClaw reconoce para ese mismo identificador, incluso cuando este también pertenece a un plugin incluido
3. **Incluido** — plugins distribuidos con OpenClaw
4. **Espacio de trabajo** — plugins detectados en relación con el espacio de trabajo actual
5. Cualquier otro candidato detectado

Implicaciones:

- Una copia bifurcada o desactualizada de un plugin incluido que se encuentre sin seguimiento en el espacio de trabajo o en la raíz global no prevalecerá sobre la compilación incluida.
- Para sustituir un plugin incluido, ejecute `openclaw plugin install` para ese id, de modo que la instalación global con seguimiento tenga precedencia sobre la copia incluida, o fije una ruta específica mediante `plugins.entries.<id>` para que prevalezca por la precedencia seleccionada en la configuración.
- Los duplicados descartados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- En los diagnósticos, las sustituciones de duplicados seleccionadas mediante la configuración se describen como sustituciones explícitas, pero siguen generando una advertencia para mantener visibles las bifurcaciones desactualizadas y las sustituciones accidentales.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un JSON Schema**, aunque no acepte ninguna configuración.
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

## Comportamiento de la validación

- Las claves `channels.*` desconocidas son **errores**, a menos que el id del canal esté declarado en el manifiesto de un plugin. Si el mismo id también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin al que se hace referencia pero que no se puede detectar actualmente), OpenClaw lo rebaja a una **advertencia**.
- Las referencias de `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` a ids de plugins desconocidos son **advertencias** ("se ignoró una entrada de configuración desactualizada"), no errores, para que las actualizaciones y los plugins eliminados o renombrados no impidan el inicio del gateway.
- Una referencia de `plugins.slots.memory` a un id de plugin desconocido es un **error**, excepto en el caso del plugin externo oficial `memory-lancedb` conocido, que genera una advertencia.
- Si un plugin está instalado, pero su manifiesto o esquema falta o contiene errores, la validación falla y Doctor informa del error del plugin.
- Si existe configuración para un plugin, pero este está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor y en los registros.

Consulte la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo se usa para la detección y la validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se admiten comentarios, comas finales y claves sin comillas, siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evite usar claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- `providerCatalogEntry` debe ser ligero y no debe importar grandes partes del código del entorno de ejecución; utilícelo para metadatos estáticos del catálogo de proveedores o descriptores de detección específicos, no para la ejecución durante las solicitudes.
- Los tipos exclusivos de plugins se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valor predeterminado: `memory-core`) y `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado: `legacy`).
- Declare el tipo exclusivo de plugin en este manifiesto. El `OpenClawPluginDefinition.kind` del punto de entrada del entorno de ejecución está obsoleto y se mantiene únicamente como alternativa de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno de `setup.providers[].envVars` son únicamente declarativos. El estado, la auditoría, la validación de entrega de cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de considerar configurada una variable de entorno.
- Para consultar los metadatos del asistente del entorno de ejecución que requieren código del proveedor, consulte los [hooks del entorno de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si el plugin depende de módulos nativos, documente los pasos de compilación y cualquier requisito de la lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
