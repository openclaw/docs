---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de un Plugin o depurar errores de validación de plugins
summary: Requisitos del manifiesto del Plugin y del esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-07-11T23:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página trata sobre el **manifiesto nativo de Plugin de OpenClaw**, `openclaw.plugin.json`. Para conocer las estructuras de paquetes compatibles (Codex, Claude, Cursor), consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquetes compatibles utilizan sus propios archivos de manifiesto:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json`, o la estructura predeterminada de componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente estas estructuras, pero no las valida con el esquema de `openclaw.plugin.json` que aparece a continuación. En un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de LSP de Claude y los paquetes de hooks compatibles, cuando la estructura coincide con las expectativas de ejecución de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar el código del Plugin**. Si el manifiesto falta o no es válido, se bloquea la validación de la configuración y se considera un error del Plugin.

Consulta [Plugins](/es/tools/plugin) para obtener la guía completa del sistema de Plugins y [Modelo de capacidades](/es/plugins/architecture#public-capability-model) para conocer el modelo nativo de capacidades y las directrices actuales de compatibilidad externa.

## Qué hace este archivo

`openclaw.plugin.json` contiene metadatos que OpenClaw lee **antes de cargar el código de tu Plugin**. Todo su contenido debe poder inspeccionarse con un coste lo bastante bajo como para no tener que iniciar el entorno de ejecución del Plugin.

**Úsalo para:**

- la identidad del Plugin, la validación de la configuración y las indicaciones de la interfaz de configuración
- los metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor y opciones de autenticación)
- las indicaciones de activación para las superficies del plano de control
- la asignación abreviada de familias de modelos
- las instantáneas estáticas de propiedad de capacidades (`contracts`)
- los metadatos del ejecutor de control de calidad que puede inspeccionar el host compartido de `openclaw qa`
- los metadatos de configuración específicos del canal que se combinan en las superficies de catálogo y validación

**No lo uses para:** registrar comportamiento en tiempo de ejecución, declarar puntos de entrada de código ni definir metadatos de instalación de npm. Estos corresponden al código de tu Plugin y a `package.json`.

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
  "description": "OpenRouter provider plugin",
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

| Campo                                | Obligatorio | Tipo                         | Qué significa                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Sí          | `string`                     | Id canónico del plugin. Es el id utilizado en `plugins.entries.<id>`.                                                                                                                                                                                                                             |
| `configSchema`                       | Sí          | `object`                     | Esquema JSON insertado para la configuración de este plugin.                                                                                                                                                                                                                                     |
| `requiresPlugins`                    | No          | `string[]`                   | Ids de plugins que también deben estar instalados para que este plugin tenga efecto. La detección permite cargar el plugin, pero muestra una advertencia cuando falta algún plugin obligatorio.                                                                                                  |
| `enabledByDefault`                   | No          | `true`                       | Marca un plugin incluido como activado de forma predeterminada. Omítalo o establezca cualquier valor distinto de `true` para dejar el plugin desactivado de forma predeterminada.                                                                                                                |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                   | Marca un plugin incluido como activado de forma predeterminada solo en las plataformas de Node.js enumeradas, por ejemplo, `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                                                                    |
| `legacyPluginIds`                    | No          | `string[]`                   | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                   | Ids de proveedores que deben activar automáticamente este plugin cuando se mencionen en referencias de autenticación, configuración o modelos.                                                                                                                                                 |
| `kind`                               | No          | `PluginKind \| PluginKind[]` | Declara uno o varios tipos exclusivos de plugin (`"memory"`, `"context-engine"`) utilizados por `plugins.slots.*`. Un plugin que controla ambas ranuras declara ambos tipos en una sola matriz.                                                                                                  |
| `channels`                           | No          | `string[]`                   | Ids de canales controlados por este plugin. Se utilizan para la detección y la validación de la configuración.                                                                                                                                                                                    |
| `providers`                          | No          | `string[]`                   | Ids de proveedores controlados por este plugin.                                                                                                                                                                                                                                                  |
| `providerCatalogEntry`               | No          | `string`                     | Ruta del módulo ligero del catálogo de proveedores, relativa a la raíz del plugin, para los metadatos del catálogo de proveedores limitados al manifiesto que pueden cargarse sin activar todo el entorno de ejecución del plugin.                                                               |
| `modelSupport`                       | No          | `object`                     | Metadatos abreviados de familias de modelos controlados por el manifiesto que se utilizan para cargar automáticamente el plugin antes del entorno de ejecución.                                                                                                                                  |
| `modelCatalog`                       | No          | `object`                     | Metadatos declarativos del catálogo de modelos para los proveedores controlados por este plugin. Este es el contrato del plano de control para futuras operaciones de listado de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el entorno de ejecución del plugin. |
| `modelPricing`                       | No          | `object`                     | Política de consulta de precios externos controlada por el proveedor. Utilícela para excluir a los proveedores locales o autoalojados de los catálogos de precios remotos, o para asignar referencias de proveedores a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedores en el núcleo. |
| `modelIdNormalization`               | No          | `object`                     | Limpieza de alias y prefijos de ids de modelos controlada por el proveedor que debe ejecutarse antes de cargar el entorno de ejecución del proveedor.                                                                                                                                           |
| `providerEndpoints`                  | No          | `object[]`                   | Metadatos de host y `baseUrl` de puntos de conexión controlados por el manifiesto para rutas de proveedores que el núcleo debe clasificar antes de cargar el entorno de ejecución del proveedor.                                                                                                |
| `providerRequest`                    | No          | `object`                     | Metadatos ligeros de familias de proveedores y compatibilidad de solicitudes utilizados por la política genérica de solicitudes antes de cargar el entorno de ejecución del proveedor.                                                                                                        |
| `secretProviderIntegrations`         | No          | `Record<string, object>`     | Ajustes predefinidos declarativos de proveedores de ejecución SecretRef que las superficies de configuración inicial o instalación pueden ofrecer sin codificar integraciones específicas de proveedores en el núcleo.                                                                          |
| `cliBackends`                        | No          | `string[]`                   | Ids de motores de inferencia de la CLI controlados por este plugin. Se utilizan para la activación automática al iniciar a partir de referencias de configuración explícitas.                                                                                                                   |
| `syntheticAuthRefs`                  | No          | `string[]`                   | Referencias de proveedores o motores de la CLI cuyo enlace de autenticación sintética, controlado por el plugin, debe examinarse durante la detección inicial de modelos antes de cargar el entorno de ejecución.                                                                                |
| `nonSecretAuthMarkers`               | No          | `string[]`                   | Valores de marcador de posición de claves de API, controlados por el plugin incluido, que representan un estado de credenciales local, de OAuth, del entorno o no secreto.                                                                                                                      |
| `commandAliases`                     | No          | `object[]`                   | Nombres de comandos controlados por este plugin que deben generar diagnósticos de configuración y de la CLI compatibles con el plugin antes de cargar el entorno de ejecución.                                                                                                                  |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`   | Metadatos de entorno de compatibilidad obsoletos para consultar la autenticación o el estado del proveedor. Para plugins nuevos, prefiera `setup.providers[].envVars`; OpenClaw continúa leyéndolos durante el período de obsolescencia.                                                          |
| `providerUsageAuthEnvVars`           | No          | `Record<string, string[]>`   | Credenciales del proveedor exclusivamente para uso y facturación. OpenClaw utiliza estos nombres para detectar el uso y depurar secretos, pero nunca para la autenticación de inferencia.                                                                                                      |
| `providerAuthAliases`                | No          | `Record<string, string>`     | Ids de proveedores que deben reutilizar otro id de proveedor para consultar la autenticación; por ejemplo, un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                                                                        |
| `channelEnvVars`                     | No          | `Record<string, string[]>`   | Metadatos ligeros de entorno del canal que OpenClaw puede inspeccionar sin cargar el código del plugin. Utilícelos para la configuración de canales basada en el entorno o para superficies de autenticación que deban ser visibles para los asistentes genéricos de inicio y configuración.       |
| `providerAuthChoices`                | No          | `object[]`                   | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución del proveedor preferido y conexión sencilla de indicadores de la CLI.                                                                                                                             |
| `activation`                         | No          | `object`                     | Metadatos ligeros del planificador de activación para la carga desencadenada por inicio, proveedor, comando, canal, ruta y capacidad. Solo son metadatos; el entorno de ejecución del plugin sigue controlando el comportamiento real.                                                           |
| `setup`                              | No          | `object`                     | Descriptores ligeros de configuración inicial e incorporación que las superficies de detección y configuración pueden inspeccionar sin cargar el entorno de ejecución del plugin.                                                                                                             |
| `qaRunners`                          | No          | `object[]`                   | Descriptores ligeros de ejecutores de control de calidad utilizados por el host compartido `openclaw qa` antes de cargar el entorno de ejecución del plugin.                                                                                                                                   |
| `contracts`                          | No          | `object`                     | Instantánea estática del control de capacidades para enlaces de autenticación externos, incrustaciones, voz, transcripción en tiempo real, voz en tiempo real, comprensión de contenido multimedia, generación de imágenes, vídeo y música, obtención web, búsqueda web, proveedores de trabajadores, extracción de documentos y contenido web, y control de herramientas. |
| `configContracts`                    | No          | `object`                     | Comportamiento de configuración controlado por el manifiesto y utilizado por asistentes genéricos del núcleo: detección de indicadores peligrosos, destinos de migración de SecretRef y restricción de rutas de configuración heredadas. Consulte la [referencia de configContracts](#configcontracts-reference). |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Valores predeterminados económicos para la comprensión de contenido multimedia de los identificadores de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de imágenes de los identificadores de proveedor declarados en `contracts.imageGenerationProviders`, incluidos los alias de autenticación administrados por el proveedor y las protecciones de URL base.              |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de vídeo de los identificadores de proveedor declarados en `contracts.videoGenerationProviders`, incluidos los alias de autenticación administrados por el proveedor y las protecciones de URL base.                 |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos económicos de autenticación para la generación de música de los identificadores de proveedor declarados en `contracts.musicGenerationProviders`, incluidos los alias de autenticación administrados por el proveedor y las protecciones de URL base.                |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos económicos de disponibilidad para las herramientas administradas por el plugin declaradas en `contracts.tools`. Úselos cuando una herramienta no deba cargar el entorno de ejecución salvo que existan indicios de configuración, entorno o autenticación.          |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración de canales administrados por el manifiesto, combinados en las superficies de detección y validación antes de cargar el entorno de ejecución.                                                                                                     |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                                                                                      |
| `name`                               | No       | `string`                     | Nombre del plugin legible para las personas.                                                                                                                                                                                                                                |
| `description`                        | No       | `string`                     | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                                                                                 |
| `catalog`                            | No       | `object`                     | Indicaciones opcionales de presentación para las superficies del catálogo de plugins. Estos metadatos no instalan, habilitan ni conceden confianza a un plugin.                                                                                                            |
| `icon`                               | No       | `string`                     | URL HTTPS de la imagen para las tarjetas del mercado o catálogo. ClawHub acepta cualquier URL `https://` válida y utiliza el icono predeterminado del plugin cuando se omite o no es válida.                                                                                  |
| `version`                            | No       | `string`                     | Versión informativa del plugin.                                                                                                                                                                                                                                             |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de la interfaz de usuario, marcadores de posición e indicaciones de sensibilidad para los campos de configuración.                                                                                                                                                |

## referencia de `catalog`

`catalog` proporciona indicaciones opcionales de visualización para los exploradores de plugins. Los hosts pueden ignorar estas indicaciones. Nunca instalan ni habilitan el plugin, y no cambian su comportamiento en tiempo de ejecución ni su nivel de confianza.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | Significado                                                                         |
| ---------- | --------- | ----------------------------------------------------------------------------------- |
| `featured` | `boolean` | Indica si las superficies del catálogo deben destacar este plugin.                  |
| `order`    | `number`  | Indicación de orden ascendente entre plugins seleccionados; los valores menores aparecen antes. |

## referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales estáticas de autenticación para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de cargar el entorno de ejecución del proveedor, de modo que las herramientas del núcleo puedan decidir si un proveedor de generación está disponible sin importar todos los plugins de proveedores.

Use estos campos únicamente para datos declarativos que sean económicos de evaluar. El transporte, las transformaciones de solicitudes, la renovación de tokens, la validación de credenciales y el comportamiento real de generación permanecen en el entorno de ejecución del plugin.

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

| Campo                  | Obligatorio | Tipo       | Significado                                                                                                                                                             |
| ---------------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No          | `string[]` | Identificadores adicionales de proveedores que deben contar como alias estáticos de autenticación para el proveedor de generación.                                      |
| `authProviders`        | No          | `string[]` | Identificadores de proveedores cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                          |
| `configSignals`        | No          | `object[]` | Señales económicas de disponibilidad basadas solo en la configuración para proveedores locales o autohospedados configurables sin perfiles de autenticación ni variables de entorno. |
| `authSignals`          | No          | `object[]` | Señales explícitas de autenticación. Cuando están presentes, sustituyen el conjunto predeterminado de señales del identificador del proveedor, `aliases` y `authProviders`. |
| `referenceAudioInputs` | No          | `boolean`  | Solo para generación de vídeo. Establézcalo en `true` cuando el proveedor acepte recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada de `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Significado                                                                                                                                                                                                         |
| ---------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí          | `string`   | Ruta con puntos al objeto de configuración propiedad del plugin que se inspeccionará, por ejemplo, `plugins.entries.example.config`.                                                                                |
| `overlayPath`    | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Úsela para configuraciones específicas de capacidades como `image`, `video` o `music`.       |
| `overlayMapPath` | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse individualmente al objeto raíz. Úsela para mapas de cuentas con nombre, como `accounts`, donde cualquier cuenta configurada debe ser válida. |
| `required`       | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos tampoco deben estar vacíos.                                    |
| `requiredAny`    | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                            |
| `mode`           | No          | `object`   | Restricción opcional del modo de cadena dentro de la configuración efectiva. Úsela cuando la disponibilidad basada solo en la configuración se aplique únicamente a un modo.                                       |

Cada restricción `mode` admite:

| Campo        | Obligatorio | Tipo       | Significado                                                                                           |
| ------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.               |
| `default`    | No          | `string`   | Valor de modo que se usará cuando la configuración omita la ruta.                                     |
| `allowed`    | No          | `string[]` | Si está presente, la señal solo es válida cuando el modo efectivo es uno de estos valores.            |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.                     |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Significado                                                                                                                                                                                    |
| ----------------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Identificador del proveedor que se comprobará en los perfiles de autenticación configurados.                                                                                                   |
| `providerBaseUrl` | No          | `object` | Restricción opcional que hace que la señal cuente solo cuando el proveedor configurado al que se hace referencia utiliza una URL base permitida. Úsela cuando un alias de autenticación solo sea válido para determinadas API. |

Cada restricción `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Significado                                                                                                                                                                   |
| ----------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Identificador de configuración del proveedor cuyo `baseUrl` debe comprobarse.                                                                                                 |
| `defaultBaseUrl`  | No          | `string`   | URL base que se asumirá cuando la configuración del proveedor omita `baseUrl`.                                                                                                |
| `allowedBaseUrls` | Sí          | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados.    |

## referencia de metadatos de herramientas

`toolMetadata` utiliza las mismas estructuras de `configSignals` y `authSignals` que los metadatos de proveedores de generación, indexadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara evidencias de disponibilidad económicas de evaluar para que OpenClaw pueda evitar importar el entorno de ejecución de un plugin solo para que su fábrica de herramientas devuelva `null`.

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

Las entradas de `toolMetadata` también aceptan `optional` (marca la herramienta como no obligatoria para activar el plugin) y `replaySafe` (marca la ejecución de la herramienta como segura para repetirla después de un turno incompleto del modelo), además de los campos compartidos `configSignals`/`authSignals` anteriores.

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de la herramienta coincide con la política. Para las herramientas de rutas críticas cuya fábrica dependa de la autenticación o la configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para consultarlo.

## referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw la lee antes de cargar el entorno de ejecución del proveedor. Las listas de configuración de proveedores utilizan estas opciones del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Qué significa                                                                                                                                                                               |
| --------------------- | ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | Id. del proveedor al que pertenece esta opción.                                                                                                                                             |
| `method`              | Sí          | `string`                                                              | Id. del método de autenticación al que se delegará.                                                                                                                                         |
| `choiceId`            | Sí          | `string`                                                              | Id. estable de la opción de autenticación que utilizan los flujos de incorporación y de la CLI.                                                                                            |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw utiliza `choiceId` como alternativa.                                                                                                |
| `choiceHint`          | No          | `string`                                                              | Texto breve de ayuda para el selector.                                                                                                                                                      |
| `assistantPriority`   | No          | `number`                                                              | Los valores más bajos aparecen primero en los selectores interactivos controlados por el asistente.                                                                                        |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la opción de los selectores del asistente, pero permite seleccionarla manualmente mediante la CLI.                                                                                  |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | Id. de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                                                                                                   |
| `groupId`             | No          | `string`                                                              | Id. de grupo opcional para agrupar opciones relacionadas.                                                                                                                                  |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario de ese grupo.                                                                                                                                              |
| `groupHint`           | No          | `string`                                                              | Texto breve de ayuda para el grupo.                                                                                                                                                         |
| `onboardingFeatured`  | No          | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "Más...".                                                                          |
| `optionKey`           | No          | `string`                                                              | Clave de opción interna para flujos de autenticación sencillos con una sola marca.                                                                                                         |
| `cliFlag`             | No          | `string`                                                              | Nombre de la marca de la CLI, como `--openrouter-api-key`.                                                                                                                                  |
| `cliOption`           | No          | `string`                                                              | Forma completa de la opción de la CLI, como `--openrouter-api-key <key>`.                                                                                                                   |
| `cliDescription`      | No          | `string`                                                              | Descripción utilizada en la ayuda de la CLI.                                                                                                                                                |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superficies de incorporación en las que debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`.                                                           |

## Referencia de commandAliases

Use `commandAliases` cuando un plugin posea un nombre de comando en tiempo de ejecución que los usuarios puedan colocar por error en `plugins.allow` o intentar ejecutar como comando raíz de la CLI. OpenClaw utiliza estos metadatos para realizar diagnósticos sin importar el código de tiempo de ejecución del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                                                   |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                                                 |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando de barra del chat, en lugar de como un comando raíz de la CLI.   |
| `cliCommand` | No          | `string`          | Comando raíz relacionado de la CLI que se sugerirá para las operaciones de la CLI, si existe.  |

## Referencia de activation

Use `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control deben incluirlo en un plan de activación o carga.

Este bloque contiene metadatos del planificador, no es una API de ciclo de vida. No registra comportamiento en tiempo de ejecución, no sustituye a `register(...)` ni garantiza que el código del plugin ya se haya ejecutado. El planificador de activación utiliza estos campos para reducir el conjunto de plugins candidatos antes de recurrir a los metadatos existentes de propiedad del manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks.

Prefiera los metadatos más específicos que ya describan la propiedad. Use `providers`, `channels`, `commandAliases`, los descriptores de configuración o `contracts` cuando esos campos expresen la relación. Use `activation` para indicaciones adicionales del planificador que no puedan representarse mediante esos campos de propiedad. Use `cliBackends` en el nivel superior para alias del tiempo de ejecución de la CLI como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` solo se utiliza para los id. de arneses de agentes integrados que aún no tengan un campo de propiedad.

Cada plugin debe establecer `activation.onStartup` de forma intencionada. Establézcalo en `true` solo cuando el plugin deba ejecutarse durante el inicio del Gateway. Establézcalo en `false` cuando el plugin esté inactivo al iniciarse y solo deba cargarse mediante activadores más específicos. Omitir `onStartup` ya no hace que el plugin se cargue implícitamente durante el inicio; use metadatos de activación explícitos para el inicio, el canal, la configuración, el arnés de agente, la memoria u otros activadores de activación más específicos.

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

| Campo              | Obligatorio | Tipo                                                 | Qué significa                                                                                                                                                                                                                                               |
| ------------------ | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No          | `boolean`                                            | Activación explícita al iniciar el Gateway. Cada plugin debe establecerla. `true` importa el plugin durante el inicio; `false` mantiene su carga diferida durante el inicio, salvo que otro activador coincidente requiera cargarlo.                          |
| `onProviders`      | No          | `string[]`                                           | Id. de proveedores que deben incluir este plugin en los planes de activación o carga.                                                                                                                                                                      |
| `onAgentHarnesses` | No          | `string[]`                                           | Id. de tiempo de ejecución de arneses de agentes integrados que deben incluir este plugin en los planes de activación o carga. Use `cliBackends` en el nivel superior para los alias de backends de la CLI.                                                 |
| `onCommands`       | No          | `string[]`                                           | Id. de comandos que deben incluir este plugin en los planes de activación o carga.                                                                                                                                                                         |
| `onChannels`       | No          | `string[]`                                           | Id. de canales que deben incluir este plugin en los planes de activación o carga.                                                                                                                                                                          |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deben incluir este plugin en los planes de activación o carga.                                                                                                                                                                          |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este plugin en los planes de inicio o carga cuando la ruta esté presente y no se haya desactivado explícitamente.                                                                             |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones generales de capacidades utilizadas por la planificación de activación del plano de control. Prefiera campos más específicos cuando sea posible.                                                                                             |

Consumidores activos actuales:

- La planificación del inicio del Gateway utiliza `activation.onStartup` para la importación explícita durante el inicio.
- La planificación de la CLI activada por comandos recurre a los valores heredados `commandAliases[].cliCommand` o `commandAliases[].name`.
- La planificación del inicio del tiempo de ejecución de agentes utiliza `activation.onAgentHarnesses` para los arneses integrados y `cliBackends[]` en el nivel superior para los alias del tiempo de ejecución de la CLI.
- La planificación de configuración o canales activada por canales recurre a la propiedad heredada de `channels[]` cuando faltan metadatos explícitos de activación de canales.
- La planificación de plugins durante el inicio utiliza `activation.onConfigPaths` para superficies de configuración raíz que no sean de canales, como el bloque `browser` del plugin de navegador incluido.
- La planificación de configuración o tiempo de ejecución activada por proveedores recurre a la propiedad heredada de `providers[]` y `cliBackends[]` en el nivel superior cuando faltan metadatos explícitos de activación de proveedores.

Los diagnósticos del planificador pueden distinguir las indicaciones explícitas de activación de la alternativa basada en la propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que coincidió `activation.onCommands`, mientras que `manifest-command-alias` significa que el planificador utilizó en su lugar la propiedad de `commandAliases`. Estas etiquetas de motivo se usan en los diagnósticos y las pruebas del host; los autores de plugins deben seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Use `qaRunners` cuando un plugin aporte uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantenga estos metadatos ligeros y estáticos; el tiempo
de ejecución del plugin sigue siendo responsable del registro real en la CLI mediante una superficie ligera
`runtime-api.ts` que exporta los valores `qaRunnerCliRegistrations` correspondientes. Una
`adapterFactory` opcional expone el transporte a escenarios compartidos de control de calidad sin
cambiar el ejecutor del comando registrado.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Qué significa                                                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo, `matrix`.                                     |
| `description` | No          | `string` | Texto de ayuda alternativo que se utiliza cuando el host compartido necesita un comando simulado. |

El id de `adapterFactory` debe coincidir con `commandName`. No exporte registros
para comandos ausentes del manifiesto.

## referencia de setup

Use `setup` cuando las superficies de configuración e incorporación necesiten metadatos económicos, propiedad del plugin, antes de que se cargue el entorno de ejecución.

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
            "source": "openai local credentials"
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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de la CLI. `setup.cliBackends` es la superficie de descriptores específica de setup para los flujos del plano de control y de configuración que deben limitarse a metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de consulta basada primero en descriptores para el descubrimiento de la configuración. Si el descriptor solo reduce el plugin candidato y la configuración aún necesita hooks de entorno de ejecución más completos durante la configuración, establezca `requiresRuntime: true` y mantenga `setup-api` como ruta de ejecución alternativa.

OpenClaw también incluye `setup.providers[].envVars` en las consultas genéricas de autenticación del proveedor y de variables de entorno. `providerAuthEnvVars` continúa siendo compatible mediante un adaptador de compatibilidad durante el período de obsolescencia, pero los plugins no incluidos que aún lo utilizan reciben un diagnóstico del manifiesto. Los plugins nuevos deben incluir los metadatos de variables de entorno de configuración y estado en `setup.providers[].envVars`.

Use `providerUsageAuthEnvVars` cuando una credencial de facturación o de nivel organizativo deba activar `resolveUsageAuth` sin convertirse en una credencial de inferencia. Estos nombres se incorporan al bloqueo de dotenv del espacio de trabajo, la eliminación en procesos secundarios de ACP, el filtrado de secretos del sandbox y la depuración general de secretos. El entorno de ejecución del proveedor sigue leyendo y clasificando el valor dentro de `resolveUsageAuth`.

OpenClaw también puede derivar opciones de configuración sencillas de `setup.providers[].authMethods` cuando no hay ninguna entrada de configuración disponible o cuando `setup.requiresRuntime: false` declara innecesario el entorno de ejecución de la configuración. Las entradas explícitas de `providerAuthChoices` siguen teniendo preferencia para etiquetas personalizadas, flags de la CLI, el ámbito de incorporación y los metadatos del asistente.

Establezca `requiresRuntime: false` únicamente cuando esos descriptores sean suficientes para la superficie de configuración. OpenClaw trata el valor `false` explícito como un contrato basado solo en descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para consultar la configuración. Si un plugin basado solo en descriptores aún incluye una de esas entradas de entorno de ejecución de la configuración, OpenClaw informa de un diagnóstico adicional y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento alternativo heredado para no romper los plugins existentes que añadieron descriptores sin el flag.

Dado que la consulta de configuración puede ejecutar código de `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben ser únicos entre los plugins descubiertos. Ante una propiedad ambigua, el proceso falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

Cuando se ejecuta el entorno de ejecución de la configuración, los diagnósticos del registro de configuración informan de divergencias de los descriptores si `setup-api` registra un proveedor o backend de la CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene ningún registro correspondiente en el entorno de ejecución. Estos diagnósticos son adicionales y no rechazan los plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Significado                                                                                               |
| -------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `id`           | Sí          | `string`   | Id del proveedor expuesto durante la configuración o incorporación. Mantenga los ids normalizados globalmente únicos. |
| `authMethods`  | No          | `string[]` | Ids de métodos de configuración/autenticación que admite este proveedor sin cargar el entorno de ejecución completo. |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de cargar el entorno de ejecución del plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones locales económicas de evidencias de autenticación para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` sirve para los marcadores locales de credenciales propiedad del proveedor que pueden verificarse sin cargar código del entorno de ejecución. Estas comprobaciones deben seguir siendo económicas y locales: sin llamadas de red, lecturas del llavero o del gestor de secretos, comandos de shell ni sondeos de la API del proveedor.

Entradas de evidencia compatibles:

| Campo              | Obligatorio | Tipo       | Significado                                                                                                          |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente, `local-file-with-env`.                                                                                  |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita a un archivo de credenciales.                                    |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una de las variables de entorno enumeradas debe tener un valor no vacío para que la evidencia sea válida.  |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno enumeradas deben tener un valor no vacío para que la evidencia sea válida.           |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto que se devuelve cuando la evidencia está presente.                                               |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                     |

### campos de setup

| Campo              | Obligatorio | Tipo       | Significado                                                                                               |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación.       |
| `cliBackends`      | No          | `string[]` | Ids de backend durante la configuración utilizados para la consulta de configuración basada primero en descriptores. Mantenga los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este plugin.             |
| `requiresRuntime`  | No          | `boolean`  | Indica si la configuración aún necesita ejecutar `setup-api` después de consultar los descriptores.        |

## referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas indicaciones de renderizado. Las claves pueden usar puntos para los campos de configuración anidados, pero ningún segmento de la ruta puede ser `__proto__`, `constructor` ni `prototype`; la configuración rechaza esos nombres.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada indicación de campo puede incluir:

| Campo         | Tipo       | Significado                                      |
| ------------- | ---------- | ------------------------------------------------ |
| `label`       | `string`   | Etiqueta del campo visible para el usuario.      |
| `help`        | `string`   | Texto breve de ayuda.                            |
| `tags`        | `string[]` | Etiquetas opcionales de la interfaz de usuario.  |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                    |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.          |
| `placeholder` | `string`   | Texto de marcador para las entradas de formulario. |

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

| Campo                            | Tipo       | Qué significa                                                                                                                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identificadores de fábricas de extensiones del servidor de aplicaciones Codex, actualmente `codex-app-server`.                                                    |
| `agentToolResultMiddleware`      | `string[]` | Identificadores de entornos de ejecución para los que este Plugin puede registrar middleware de resultados de herramientas.                                      |
| `trustedToolPolicies`            | `string[]` | Identificadores locales de políticas de confianza previas a las herramientas que puede registrar un Plugin instalado. Los Plugins integrados pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Identificadores de proveedores cuyo hook de perfiles de autenticación externa pertenece a este Plugin.                                                           |
| `embeddingProviders`             | `string[]` | Identificadores de proveedores generales de embeddings que pertenecen a este Plugin para el uso reutilizable de embeddings vectoriales, incluida la memoria.      |
| `speechProviders`                | `string[]` | Identificadores de proveedores de voz que pertenecen a este Plugin.                                                                                              |
| `realtimeTranscriptionProviders` | `string[]` | Identificadores de proveedores de transcripción en tiempo real que pertenecen a este Plugin.                                                                     |
| `realtimeVoiceProviders`         | `string[]` | Identificadores de proveedores de voz en tiempo real que pertenecen a este Plugin.                                                                                |
| `memoryEmbeddingProviders`       | `string[]` | Identificadores obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este Plugin.                                                       |
| `mediaUnderstandingProviders`    | `string[]` | Identificadores de proveedores de comprensión multimedia que pertenecen a este Plugin.                                                                           |
| `transcriptSourceProviders`      | `string[]` | Identificadores de proveedores de fuentes de transcripciones que pertenecen a este Plugin.                                                                       |
| `documentExtractors`             | `string[]` | Identificadores de proveedores de extracción de documentos (por ejemplo, PDF) que pertenecen a este Plugin.                                                       |
| `imageGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de imágenes que pertenecen a este Plugin.                                                                           |
| `videoGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de vídeo que pertenecen a este Plugin.                                                                               |
| `musicGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de música que pertenecen a este Plugin.                                                                              |
| `webContentExtractors`           | `string[]` | Identificadores de proveedores de extracción de contenido de páginas web que pertenecen a este Plugin.                                                            |
| `webFetchProviders`              | `string[]` | Identificadores de proveedores de obtención web que pertenecen a este Plugin.                                                                                     |
| `webSearchProviders`             | `string[]` | Identificadores de proveedores de búsqueda web que pertenecen a este Plugin.                                                                                      |
| `workerProviders`                | `string[]` | Identificadores de proveedores de trabajadores en la nube que pertenecen a este Plugin para el aprovisionamiento y el ciclo de vida de concesiones respaldado por perfiles. |
| `usageProviders`                 | `string[]` | Identificadores de proveedores cuyos hooks de autenticación de uso y de instantáneas de uso pertenecen a este Plugin.                                             |
| `migrationProviders`             | `string[]` | Identificadores de proveedores de importación que pertenecen a este Plugin para `openclaw migrate`.                                                               |
| `gatewayMethodDispatch`          | `string[]` | Permiso reservado para rutas HTTP autenticadas del Plugin que despachan métodos del Gateway dentro del proceso.                                                   |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este Plugin.                                                                                                 |

`contracts.embeddedExtensionFactories` se conserva para las fábricas de extensiones integradas exclusivas del servidor de aplicaciones Codex. En su lugar, las transformaciones integradas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)`. Los Plugins instalados pueden usar el mismo punto de integración de middleware solo cuando esté habilitado explícitamente y únicamente para los entornos de ejecución que declaren en `contracts.agentToolResultMiddleware`.

Los Plugins instalados que necesiten el nivel de políticas de confianza previas a las herramientas del host deben declarar cada identificador local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente. Los Plugins integrados conservan la ruta existente de políticas de confianza, pero los Plugins instalados con identificadores de políticas no declarados se rechazan antes del registro. Los identificadores de políticas están limitados al ámbito del Plugin que los registra, por lo que dos Plugins pueden declarar y registrar `workflow-budget`; un mismo Plugin no puede registrar dos veces el mismo identificador local.

Los registros de `api.registerTool(...)` en tiempo de ejecución deben coincidir con `contracts.tools`. La detección de herramientas usa esta lista para cargar únicamente los entornos de ejecución de Plugins que pueden ser propietarios de las herramientas solicitadas.

Los Plugins de proveedores que implementen `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los Plugins de proveedores que implementen tanto `resolveUsageAuth` como `fetchUsageSnapshot` deben declarar en `contracts.usageProviders` cada identificador de proveedor detectado automáticamente. La detección de uso lee este contrato antes de cargar el código de tiempo de ejecución y, después de cargar únicamente los propietarios declarados, verifica ambos hooks.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` para cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Use el contrato general para la generación reutilizable de vectores, incluidos los proveedores que consume la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta específica de memoria y se conserva únicamente mientras los proveedores existentes migran al punto de integración genérico de proveedores de embeddings.

Los proveedores de trabajadores deben declarar en `contracts.workerProviders` cada identificador de `api.registerWorkerProvider(...)`. El núcleo conserva la intención duradera antes de llamar a `provision`; los proveedores validan su configuración antes de la asignación externa, y las llamadas repetidas con el mismo identificador de operación deben adoptar la misma concesión. El núcleo también conserva esa instantánea de configuración validada y la pasa junto con `leaseId` a `inspect({ leaseId, profile })` y `destroy({ leaseId, profile })`, incluso después de cambiar o eliminar el perfil especificado. La destrucción es idempotente, la inspección devuelve la unión cerrada de estados `active` / `destroyed` / `unknown`, y el material de las claves privadas SSH solo se referencia mediante `SecretRef`. Los extremos SSH aprovisionados también deben incluir un `hostKey` público procedente de una salida de aprovisionamiento de confianza con el formato exacto `algorithm base64`, sin nombre de host ni comentario, para que el núcleo pueda fijar la identidad del host antes de conectarse. Los proveedores que generen referencias de identidad dinámicas pueden implementar el método autoritativo `resolveSshIdentity({ leaseId, profile, keyRef })`; los proveedores que no lo tengan usan el solucionador genérico de secretos del núcleo. Un resultado autoritativo `unknown` deja huérfano un registro local activo; después de una solicitud de destrucción conservada, confirma el desmantelamiento.

`contracts.gatewayMethodDispatch` acepta actualmente `"authenticated-request"`. Es una barrera de higiene de la API para rutas HTTP nativas de Plugins que despachan deliberadamente métodos del plano de control del Gateway dentro del proceso, no un entorno aislado contra Plugins nativos maliciosos. Úselo solo para superficies integradas o de operadores sometidas a una revisión estricta que ya requieran autenticación HTTP del Gateway. Una ruta autorizada continúa accesible mientras la admisión de trabajo raíz del Gateway está cerrada solo cuando también declara `auth: "gateway"` y el valor específico de la ruta `gatewayRuntimeScopeSurface: "trusted-operator"`; las rutas hermanas ordinarias del mismo Plugin permanecen detrás del límite de admisión. Esto mantiene accesibles el estado de suspensión y la reanudación sin conceder a todo el Plugin una omisión de la admisión. Mantenga acotados fuera del despacho el análisis y la conformación de respuestas; el trabajo sustancial o que modifique datos debe pasar por el despacho de métodos del Gateway, que es responsable de aplicar la admisión y el ámbito.

## Referencia de configContracts

Use `configContracts` para el comportamiento de configuración propiedad del manifiesto que necesiten los asistentes genéricos del núcleo sin importar el entorno de ejecución del Plugin: detección de indicadores peligrosos, destinos de migración de SecretRef y delimitación de rutas de configuración heredadas.

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

| Campo                         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `compatibilityMigrationPaths` | No          | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad de este Plugin durante la configuración. Permite que las lecturas genéricas de configuración en tiempo de ejecución omitan todas las superficies de configuración del Plugin cuando la configuración nunca hace referencia a él. |
| `compatibilityRuntimePaths`   | No          | `string[]` | Rutas de compatibilidad relativas a la raíz que este Plugin puede atender durante la ejecución antes de que su código se active por completo. Úselo para superficies heredadas que deban reducir los conjuntos de candidatos integrados sin importar el entorno de ejecución de cada Plugin compatible. |
| `dangerousFlags`              | No          | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando estén habilitados. Consulte a continuación.                                                                                                                         |
| `secretInputs`                | No          | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` que el registro de destinos de migración y auditoría de SecretRef debe tratar como cadenas con formato de secreto. Consulte a continuación.                                                               |

Cada entrada de `dangerousFlags` admite:

| Campo    | Obligatorio | Tipo                                  | Qué significa                                                                                                                                                |
| -------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `path`   | Sí          | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapas o matrices.                  |
| `equals` | Sí          | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                                                         |

`secretInputs` admite:

| Campo                   | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                 |
| ----------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No          | `boolean`  | Sobrescribe la habilitación predeterminada del plugin incluido al decidir si esta superficie SecretRef está activa. Úselo cuando el plugin esté incluido, pero la superficie deba permanecer inactiva hasta que se habilite explícitamente en la configuración. |
| `paths`                 | Sí          | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`) y `expected` opcional (actualmente solo `"string"`). |

## Referencia de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tenga modelos predeterminados, prioridad de respaldo de autenticación automática o compatibilidad nativa con documentos que los auxiliares genéricos del núcleo necesiten antes de que se cargue el entorno de ejecución. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

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

| Campo                  | Tipo                                                             | Qué significa                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Capacidades multimedia expuestas por este proveedor.                                                                             |
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados que asignan capacidades a modelos y se usan cuando la configuración no especifica un modelo.             |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan primero para el respaldo automático de proveedores basado en credenciales.                      |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documentos nativas compatibles con el proveedor.                                                                     |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sobrescrituras de modelos por tipo de documento. Establezca `image: false` para deshabilitar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Use `channelConfigs` cuando un plugin de canal necesite metadatos de configuración de bajo coste antes de que se cargue el entorno de ejecución. La detección de configuración/estado del canal de solo lectura puede usar estos metadatos directamente para canales externos configurados cuando no haya una entrada de configuración disponible o cuando `setup.requiresRuntime: false` declare innecesario el entorno de ejecución de configuración.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué plugin posee ese canal configurado antes de que se ejecute el código del entorno de ejecución del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaren `channels[]` también deben declarar entradas `channelConfigs` correspondientes. Sin ellas, OpenClaw aún puede cargar el plugin, pero las superficies de esquema de configuración en ruta fría, configuración y Control UI no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el entorno de ejecución del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración de comandos que se ejecutan antes de cargar el entorno de ejecución del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands`, junto con sus demás metadatos del catálogo de canales propiedad del paquete.

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

| Campo         | Tipo                     | Qué significa                                                                                                                           |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada.                                    |
| `uiHints`     | `Record<string, object>` | Etiquetas, marcadores de posición e indicaciones de contenido sensible opcionales para esa sección de configuración del canal.           |
| `label`       | `string`                 | Etiqueta del canal que se incorpora a las superficies de selección e inspección cuando los metadatos del entorno de ejecución no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                                                               |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos para comandos nativos y Skills nativas en comprobaciones de configuración previas al entorno de ejecución. |
| `preferOver`  | `string[]`               | Identificadores de plugins heredados o de menor prioridad que este canal debe superar en las superficies de selección.                    |

### Sustitución de otro plugin de canal

Use `preferOver` cuando su plugin sea el propietario preferido de un identificador de canal que también pueda proporcionar otro plugin. Los casos habituales son un identificador de plugin renombrado, un plugin independiente que sustituye a uno incluido o una bifurcación mantenida que conserva el mismo identificador de canal por compatibilidad de configuración.

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

Cuando se configura `channels.chat`, OpenClaw tiene en cuenta tanto el identificador del canal como el identificador del plugin preferido. Si el plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración efectiva del entorno de ejecución para que un único plugin sea propietario del canal y de sus herramientas. La selección explícita del usuario sigue prevaleciendo: si el usuario habilita explícitamente ambos plugins (mediante `plugins.allow` o una configuración sustancial de `plugins.entries`), OpenClaw conserva esa elección e informa de diagnósticos de canales/herramientas duplicados en lugar de cambiar silenciosamente el conjunto de plugins solicitado.

Limite `preferOver` a identificadores de plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general ni cambia el nombre de las claves de configuración del usuario.

## Referencia de modelSupport

Use `modelSupport` cuando OpenClaw deba inferir su plugin de proveedor a partir de identificadores abreviados de modelos como `gpt-5.6-sol` o `claude-sonnet-4.6` antes de que se cargue el entorno de ejecución del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifiesto de `providers` del propietario
- `modelPatterns` tiene precedencia sobre `modelPrefixes`
- si coinciden un plugin no incluido y uno incluido, prevalece el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                                             |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados mediante `startsWith` con los identificadores abreviados de modelos.                   |
| `modelPatterns` | `string[]` | Fuentes de expresiones regulares comparadas con los identificadores abreviados de modelos tras eliminar el sufijo del perfil. |

Las entradas de `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contengan repeticiones anidadas (por ejemplo, `(a+)+$`). Los patrones que no superan la comprobación de seguridad se omiten silenciosamente, al igual que las expresiones regulares sintácticamente no válidas. Mantenga los patrones simples y evite los cuantificadores anidados.

## Referencia de modelCatalog

Use `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de cargar el entorno de ejecución del plugin. Esta es la fuente propiedad del manifiesto para filas fijas del catálogo, alias de proveedores, reglas de supresión y modo de detección. La actualización en tiempo de ejecución sigue correspondiendo al código del entorno de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo se requiere dicho entorno.

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

| Campo            | Tipo                                                     | Qué significa                                                                                                                     |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas del catálogo para los identificadores de proveedores que pertenecen a este plugin. Las claves también deben aparecer en `providers` de nivel superior. |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedores que deben resolverse a un proveedor propio para planificar el catálogo o las supresiones.                    |
| `suppressions`   | `object[]`                                               | Filas de modelos de otra fuente que este plugin suprime por un motivo específico del proveedor.                                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica si el catálogo del proveedor puede leerse desde los metadatos del manifiesto, actualizarse en la caché o requiere el entorno de ejecución. |
| `runtimeAugment` | `boolean`                                                | Se establece en `true` solo cuando el entorno de ejecución del proveedor debe añadir filas al catálogo tras planificar el manifiesto o la configuración. |

`aliases` participa en la búsqueda de pertenencia de proveedores para planificar el catálogo de modelos. Los destinos de los alias deben ser proveedores de nivel superior que pertenezcan al mismo plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar las sustituciones de la API o de la URL base del alias sin cargar el entorno de ejecución del proveedor. Los alias no amplían los listados de catálogo sin filtrar; las listas generales solo incluyen las filas del proveedor canónico propietario.

`suppressions` sustituye al antiguo enlace `suppressBuiltInModel` del entorno de ejecución del proveedor. Las entradas de supresión solo se respetan cuando el proveedor pertenece al plugin o está declarado como una clave de `modelCatalog.aliases` cuyo destino es un proveedor propio. Los enlaces de supresión del entorno de ejecución ya no se invocan durante la resolución de modelos.

Campos del proveedor:

| Campo                 | Tipo                     | Qué significa                                                                                                                                                                                                                       |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL base predeterminada opcional para los modelos de este catálogo de proveedor.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos de este catálogo de proveedor.                                                                                                                                            |
| `headers`             | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.                                                                                                                                                       |
| `defaultUtilityModel` | `string`                 | Identificador opcional de un modelo pequeño recomendado por el proveedor para tareas internas breves (títulos, narración del progreso). Se usa cuando `agents.defaults.utilityModel` no está definido y este proveedor sirve el modelo principal del agente. |
| `models`              | `object[]`               | Filas de modelos obligatorias. Se ignoran las filas sin `id`.                                                                                                                                                                       |

Campos del modelo:

| Campo              | Tipo                                                           | Qué significa                                                                                 |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Identificador de modelo local del proveedor, sin el prefijo `provider/`.                      |
| `name`             | `string`                                                       | Nombre para mostrar opcional.                                                                 |
| `api`              | `ModelApi`                                                     | Sustitución opcional de la API por modelo.                                                     |
| `baseUrl`          | `string`                                                       | Sustitución opcional de la URL base por modelo.                                                |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                                   |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Los demás valores se descartan silenciosamente.              |
| `reasoning`        | `boolean`                                                      | Indica si el modelo ofrece comportamiento de razonamiento.                                     |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                                       |
| `contextTokens`    | `number`                                                       | Límite efectivo opcional del contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Máximo de tokens de salida cuando se conoce.                                                    |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sustituciones opcionales del identificador de modelo o de parámetros por nivel de pensamiento. |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional.                 |
| `compat`           | `object`                                                       | Indicadores opcionales de compatibilidad que coinciden con la compatibilidad de configuración de modelos de OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuración opcional de entrada por modalidad, actualmente solo para imágenes.               |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprima la fila solo cuando no deba aparecer en absoluto.                   |
| `statusReason`     | `string`                                                       | Motivo opcional que se muestra cuando el estado no es disponible.                               |
| `replaces`         | `string[]`                                                     | Identificadores anteriores de modelos locales del proveedor a los que este modelo sustituye.   |
| `replacedBy`       | `string`                                                       | Identificador local del proveedor del modelo de sustitución para filas obsoletas.               |
| `tags`             | `string[]`                                                     | Etiquetas estables usadas por los selectores y filtros.                                         |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                                                       |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identificador del proveedor de la fila de origen que se suprimirá. Debe pertenecer a este plugin o estar declarado como alias propio. |
| `model`                    | `string`   | Identificador local del proveedor del modelo que se suprimirá.                                                                       |
| `reason`                   | `string`   | Mensaje opcional que se muestra cuando se solicita directamente la fila suprimida.                                                    |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de la URL base del proveedor que se requieren para que se aplique la supresión.                    |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de la configuración del proveedor que se requieren para que se aplique la supresión.      |

No coloque datos exclusivos del entorno de ejecución en `modelCatalog`. Use `static` solo cuando las filas del manifiesto sean lo bastante completas como para que las listas filtradas por proveedor y las superficies de selección omitan el descubrimiento del registro o del entorno de ejecución. Use `refreshable` cuando las filas del manifiesto sean semillas o complementos enumerables útiles, pero una actualización o caché pueda añadir más filas posteriormente; las filas actualizables no son autoritativas por sí solas. Use `runtime` cuando OpenClaw deba cargar el entorno de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Use `modelIdNormalization` para la normalización sencilla, controlada por el proveedor, de identificadores de modelos que debe realizarse antes de cargar el entorno de ejecución del proveedor. Esto mantiene los alias, como los nombres abreviados de modelos, los identificadores locales heredados del proveedor y las reglas de prefijos de proxy, en el manifiesto del plugin propietario en lugar de en las tablas principales de selección de modelos.

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

| Campo                                | Tipo                    | Qué significa                                                                                          |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Alias exactos de identificadores de modelos que no distinguen mayúsculas de minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de buscar alias; resulta útil para duplicaciones heredadas de proveedor y modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se añade cuando el identificador de modelo normalizado aún no contiene `/`.                |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para identificadores simples tras buscar alias, definidas mediante `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Use `providerEndpoints` para la clasificación de puntos de conexión que la política genérica de solicitudes debe conocer antes de cargar el entorno de ejecución del proveedor. El núcleo sigue controlando el significado de cada `endpointClass`; los manifiestos de plugins controlan los metadatos del host y de la URL base.

Los plugins de proveedores externalizados oficialmente están excluidos de la distribución del núcleo, por lo que
sus manifiestos no son visibles hasta que se instalan. Sus valores de `providerEndpoints` también deben
replicarse en `scripts/lib/official-external-provider-catalog.json` para que
la clasificación de puntos de conexión siga funcionando sin el plugin; una prueba de contrato
garantiza que la réplica esté sincronizada.

Campos del punto de conexión:

| Campo                          | Tipo       | Qué significa                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase conocida de endpoint del núcleo, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                        |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Anteponer `.` para que coincida solo el sufijo del dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                           |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                         |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex.   |

## Referencia de providerRequest

Usa `providerRequest` para metadatos ligeros de compatibilidad de solicitudes que necesita la política genérica de solicitudes sin cargar el entorno de ejecución del proveedor. Mantén la reescritura de cargas útiles específica del comportamiento en los hooks del entorno de ejecución del proveedor o en los auxiliares compartidos de la familia de proveedores.

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
| `family`              | `string`     | Etiqueta de familia del proveedor usada por las decisiones genéricas de compatibilidad de solicitudes y los diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Categoría opcional de compatibilidad de la familia del proveedor para auxiliares compartidos de solicitudes. |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de finalización compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de secretProviderIntegrations

Usa `secretProviderIntegrations` cuando un plugin pueda publicar una configuración predefinida reutilizable de proveedor exec de SecretRef. OpenClaw lee estos metadatos antes de cargar el entorno de ejecución del plugin, guarda la propiedad del plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución efectiva de secretos al entorno de ejecución de SecretRef. Las configuraciones predefinidas solo se exponen para plugins incluidos y plugins instalados detectados en las raíces administradas de instalación de plugins, como las instalaciones desde git y ClawHub.

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

La clave del mapa es el id. de la integración. Si se omite `providerAlias`, OpenClaw usa el id. de la integración como alias del proveedor SecretRef. Los alias de proveedor deben coincidir con el patrón normal de alias de proveedor SecretRef, por ejemplo, `team-secrets` u `onepassword-work`.

Cuando un operador selecciona la configuración predefinida, OpenClaw escribe una referencia de proveedor como esta:

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

Al iniciar o recargar, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del plugin, comprobando que el plugin propietario esté instalado y activo, y materializando el comando exec a partir del manifiesto. Deshabilitar o eliminar el plugin revoca el proveedor para las SecretRefs activas. Los operadores que quieran una configuración exec independiente aún pueden escribir directamente proveedores manuales con `command`/`args`.

Actualmente solo se admiten configuraciones predefinidas con `source: "exec"`. `command` debe ser `${node}` y `args[0]` debe ser un script de resolución con ruta relativa a la raíz del plugin que comience por `./`. Al iniciar o recargar, OpenClaw lo materializa como el ejecutable actual de Node y la ruta absoluta del script dentro del plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de configuraciones predefinidas del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar directamente proveedores exec manuales independientes.

OpenClaw deriva `trustedDirs` para las configuraciones predefinidas del manifiesto a partir de la raíz del plugin y, para las configuraciones predefinidas `${node}`, del directorio del ejecutable actual de Node. Se ignoran los valores `trustedDirs` definidos en el manifiesto. Otras opciones del proveedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, se transfieren a la configuración normal del proveedor exec de SecretRef.

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesite controlar el comportamiento de precios del plano de control antes de que se cargue el entorno de ejecución. La caché de precios del Gateway lee estos metadatos sin importar el código del entorno de ejecución del proveedor.

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
| `external`   | `boolean`         | Establecer en `false` para proveedores locales o autoalojados que nunca deben obtener precios de OpenRouter ni LiteLLM. |
| `openRouter` | `false \| object` | Asignación para consultar precios en OpenRouter. `false` deshabilita la consulta de OpenRouter para este proveedor. |
| `liteLLM`    | `false \| object` | Asignación para consultar precios en LiteLLM. `false` deshabilita la consulta de LiteLLM para este proveedor. |

Campos de la fuente:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id. del proveedor en el catálogo externo cuando difiere del id. del proveedor de OpenClaw; por ejemplo, `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los id. de modelo que contienen barras como referencias anidadas de proveedor/modelo, lo que resulta útil para proveedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales del id. de modelo en el catálogo externo. `version-dots` prueba id. de versión con puntos, como `claude-opus-4.6`. |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw contiene metadatos de vista previa propiedad de OpenClaw para proveedores cuyos plugins quizá aún no estén instalados. No forma parte del manifiesto de un plugin. Los manifiestos de plugins siguen siendo la fuente de autoridad para los plugins instalados. El Índice de proveedores es el contrato interno de respaldo que consumirán las futuras interfaces de proveedores instalables y de selección de modelos previa a la instalación cuando no esté instalado el plugin de un proveedor.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del plugin instalado.
3. Caché del catálogo de modelos procedente de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado de habilitación, hooks del entorno de ejecución ni datos de modelos específicos de cuentas activas. Sus catálogos de vista previa usan la misma estructura de fila de proveedor de `modelCatalog` que los manifiestos de plugins, pero deben limitarse a metadatos de presentación estables, salvo que los campos del adaptador del entorno de ejecución, como `api`, `baseUrl`, precios o indicadores de compatibilidad, se mantengan intencionadamente alineados con el manifiesto del plugin instalado. Los proveedores que permiten la detección en vivo mediante `/models` deben escribir las filas actualizadas a través de la ruta explícita de caché del catálogo de modelos, en lugar de hacer que el listado normal o la incorporación llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden incluir metadatos de plugins instalables para proveedores cuyo plugin se haya trasladado fuera del núcleo o aún no esté instalado por otro motivo. Estos metadatos reflejan el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación de npm, la integridad esperada y etiquetas sencillas de opciones de autenticación son suficientes para mostrar una opción de configuración instalable. Una vez instalado el plugin, prevalece su manifiesto y se ignora la entrada del Índice de proveedores correspondiente a ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves heredadas de capacidades del manifiesto de nivel superior a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas claves, ni ninguna otra lista de capacidades, se lee ya como campo de nivel superior del manifiesto; la carga normal del manifiesto solo las reconoce bajo `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Para qué se usa                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detección, validación de configuración, metadatos de opciones de autenticación e indicaciones de la interfaz que deben existir antes de ejecutar el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, control de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde un metadato, usa esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del plugin, colócalo en `openclaw.plugin.json`
- si se refiere al empaquetado, los archivos de entrada o el comportamiento de instalación de npm, colócalo en `package.json`

### Campos de package.json que afectan a la detección

Algunos metadatos del plugin anteriores al entorno de ejecución se encuentran intencionadamente en `package.json`, dentro del bloque `openclaw`, en lugar de `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugins de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` junto con los campos compatibles de `package.json#openclaw` que se indican a continuación.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara puntos de entrada nativos del Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada compilados del entorno de ejecución de JavaScript para los paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                                      |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero y exclusivo para la configuración, utilizado durante la incorporación, el inicio diferido del canal y el estado del canal de solo lectura o el descubrimiento de SecretRef. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración de JavaScript compilado para los paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del Plugin.         |
| `openclaw.channel`                                                                         | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas que utilizan las superficies de configuración, auditoría y listas de comandos antes de cargar el entorno de ejecución del canal. |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador del estado configurado que pueden responder «¿ya existe una configuración basada únicamente en el entorno?» sin cargar el entorno de ejecución completo del canal.          |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder «¿ya hay alguna sesión iniciada?» sin cargar el entorno de ejecución completo del canal.                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación y actualización para plugins incluidos y publicados externamente.                                                                                                                |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                          |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host de OpenClaw, mediante un límite inferior de semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                |
| `openclaw.compat.pluginApi`                                                                | Intervalo mínimo de la API de plugins de OpenClaw requerido por este paquete, mediante un límite inferior de semver como `>=2026.5.27`.                                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Cadena esperada de integridad de la distribución de npm, como `sha512-...`; los flujos de instalación y actualización verifican con ella el artefacto obtenido.                                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta limitada de recuperación mediante reinstalación de un Plugin incluido cuando la configuración no es válida.                                                                                  |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando las restricciones de plataforma de su archivo de bloqueo coincidan con el host actual.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite cargar las superficies de canal del entorno de configuración antes de comenzar a escuchar y, después, difiere el Plugin de canal configurado completo hasta la activación posterior al inicio de la escucha. |

Los metadatos del manifiesto determinan qué opciones de proveedor, canal y configuración aparecen durante la incorporación antes de cargar el entorno de ejecución. `package.json#openclaw.install` indica al proceso de incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas opciones. No traslade las indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de plugins no incluidos. Los valores no válidos se rechazan; los valores válidos pero más recientes hacen que los plugins externos se omitan en hosts más antiguos. Se presupone que los plugins incluidos desde el código fuente comparten versión con el checkout del host.

`openclaw.install.requiredPlatformPackages` está destinado a paquetes npm que exponen binarios nativos obligatorios mediante alias opcionales específicos de cada plataforma. Enumere el nombre básico del paquete npm para cada alias de plataforma compatible. Durante la instalación con npm, OpenClaw verifica únicamente el alias declarado cuyas restricciones del archivo de bloqueo coinciden con el host actual. Si npm informa de que la operación se realizó correctamente pero omite ese alias, OpenClaw vuelve a intentarlo una vez con una caché nueva y revierte la instalación si el alias sigue ausente.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no incluidos. Úselo para indicar el límite inferior de la API del SDK o del entorno de ejecución de plugins de OpenClaw con el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de Plugin necesita una API más reciente, pero mantiene una indicación de instalación inferior para otros flujos. De forma predeterminada, la sincronización oficial de versiones de OpenClaw eleva los límites inferiores existentes de la API de los plugins oficiales a la versión de OpenClaw, pero las versiones que solo afectan a plugins pueden conservar un límite inferior cuando el paquete admite intencionadamente hosts más antiguos. No utilice únicamente la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` continúa siendo un metadato del paquete npm; OpenClaw utiliza el contrato `openclaw.compat.pluginApi` para tomar decisiones sobre la compatibilidad de la instalación.

Los metadatos oficiales de instalación bajo demanda deben utilizar `clawhubSpec` cuando el Plugin esté publicado en ClawHub; el proceso de incorporación lo considera la fuente remota preferida y registra los datos del artefacto de ClawHub después de la instalación. `npmSpec` continúa siendo la alternativa de compatibilidad para los paquetes que aún no se han trasladado a ClawHub.

La fijación de una versión exacta de npm ya reside en `npmSpec`, por ejemplo, `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen de forma segura si el artefacto npm obtenido deja de coincidir con la versión fijada. La incorporación interactiva continúa ofreciendo especificaciones npm de registros de confianza, incluidos nombres de paquetes sin versión y etiquetas de distribución, por compatibilidad. Los diagnósticos del catálogo pueden distinguir entre fuentes exactas, variables, fijadas por integridad, sin integridad, con discrepancia en el nombre del paquete y con una opción predeterminada no válida. También advierten cuando existe `expectedIntegrity`, pero no hay ninguna fuente npm válida que pueda fijar. Cuando existe `expectedIntegrity`, los flujos de instalación y actualización lo aplican; cuando se omite, la resolución del registro se guarda sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando los análisis de estado, lista de canales o SecretRef necesiten identificar cuentas configuradas sin cargar el entorno de ejecución completo. El punto de entrada de configuración debe exponer los metadatos del canal, además de adaptadores de configuración, estado y secretos seguros para la configuración; mantenga los clientes de red, los procesos de escucha del Gateway y los entornos de ejecución del transporte en el punto de entrada principal de la extensión.

Los campos de puntos de entrada del entorno de ejecución no anulan las comprobaciones de límites del paquete correspondientes a los campos de puntos de entrada del código fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que sea cargable una ruta de `openclaw.extensions` que salga del paquete.

`openclaw.install.allowInvalidConfigRecovery` tiene un alcance intencionadamente limitado. No permite instalar configuraciones arbitrariamente dañadas. Actualmente, solo permite que los flujos de instalación se recuperen de determinados fallos obsoletos de actualización de plugins incluidos, como la ausencia de la ruta de un Plugin incluido o una entrada obsoleta `channels.<id>` correspondiente a ese mismo Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y remiten a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es un metadato de paquete para un módulo comprobador mínimo:

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

Úselo cuando los flujos de configuración, Doctor, estado o presencia de solo lectura necesiten una comprobación rápida de autenticación de tipo sí/no antes de que se cargue el Plugin de canal completo. El estado de autenticación persistido no es el estado configurado del canal: no utilice estos metadatos para habilitar plugins automáticamente, reparar dependencias del entorno de ejecución ni decidir si debe cargarse el entorno de ejecución de un canal. La exportación de destino debe ser una función pequeña que solo lea el estado persistido; no la dirija a través del barrel del entorno de ejecución completo del canal.

`openclaw.channel.configuredState` sigue la misma estructura para comprobaciones rápidas de configuración basadas únicamente en el entorno:

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

Úselo cuando un canal pueda determinar el estado configurado a partir del entorno o de otras entradas mínimas ajenas al entorno de ejecución. Si la comprobación requiere la resolución completa de la configuración o el entorno de ejecución real del canal, mantenga esa lógica en el hook `config.hasConfiguredState` del Plugin.

## Precedencia del descubrimiento (identificadores de Plugin duplicados)

OpenClaw descubre plugins en tres raíces, que se comprueban en este orden: los plugins incluidos que se distribuyen con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), además de cualquier entrada explícita de `plugins.load.paths`.

Si dos elementos descubiertos comparten el mismo `id`, solo se conserva el manifiesto con **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él. La precedencia, de mayor a menor, es la siguiente:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un Plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el seguimiento de instalaciones de OpenClaw reconoce para ese mismo identificador, incluso cuando el identificador también pertenece a un Plugin incluido
3. **Incluido** — plugins distribuidos con OpenClaw
4. **Espacio de trabajo** — plugins descubiertos en relación con el espacio de trabajo actual
5. Cualquier otro candidato descubierto

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin incluido que se encuentre sin seguimiento en el espacio de trabajo o en la raíz global no sustituirá a la compilación incluida.
- Para sustituir un Plugin incluido, ejecute `openclaw plugin install` para ese identificador, de modo que la instalación global rastreada tenga prioridad sobre la copia incluida, o fije una ruta específica mediante `plugins.entries.<id>` para que prevalezca por la precedencia de selección mediante configuración.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- En los diagnósticos, las sustituciones de duplicados seleccionadas mediante configuración se describen como sustituciones explícitas, pero siguen generando una advertencia para que las bifurcaciones obsoletas y las ocultaciones accidentales permanezcan visibles.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un esquema JSON**, aunque no acepte ninguna configuración.
- Se admite un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer o escribir la configuración, no en tiempo de ejecución.
- Al ampliar o bifurcar un plugin incluido para añadir nuevas claves de configuración, actualiza al mismo tiempo el `configSchema` de `openclaw.plugin.json` de ese plugin. Los esquemas de los plugins incluidos son estrictos, por lo que añadir `plugins.entries.<id>.config.myNewKey` a la configuración del usuario sin añadir `myNewKey` a `configSchema.properties` se rechazará antes de que se cargue el entorno de ejecución del plugin.

Ejemplo de ampliación de esquema:

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

- Las claves `channels.*` desconocidas son **errores**, salvo que el identificador del canal esté declarado en el manifiesto de un plugin. Si el mismo identificador también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin al que se hace referencia, pero que no se puede detectar actualmente), OpenClaw lo reduce a una **advertencia**.
- Las referencias a identificadores de plugins desconocidos en `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` son **advertencias** («se ignoró una entrada de configuración obsoleta»), no errores, para que las actualizaciones y los plugins eliminados o renombrados no impidan el inicio del Gateway.
- Si `plugins.slots.memory` hace referencia a un identificador de plugin desconocido, se produce un **error**, excepto en el caso del plugin externo oficial conocido `memory-lancedb`, para el cual se muestra una advertencia.
- Si hay un plugin instalado, pero su manifiesto o esquema falta o está dañado, la validación falla y Doctor informa del error del plugin.
- Si existe configuración para un plugin, pero este está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor y en los registros.

Consulta la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo se utiliza para la detección y la validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se permiten comentarios, comas finales y claves sin comillas, siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita las claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debería importar grandes cantidades de código del entorno de ejecución; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de detección específicos, no para la ejecución durante las solicitudes.
- Los tipos de plugins exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valor predeterminado: `memory-core`) y `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado: `legacy`).
- Declara en este manifiesto el tipo de plugin exclusivo. `OpenClawPluginDefinition.kind` de la entrada del entorno de ejecución está obsoleto y se conserva únicamente como mecanismo de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son únicamente declarativos. El estado, la auditoría, la validación de la entrega de Cron y otras superficies de solo lectura siguen aplicando la política de confianza y activación efectiva del plugin antes de considerar configurada una variable de entorno.
- Para los metadatos del asistente en tiempo de ejecución que requieren código del proveedor, consulta los [enlaces del entorno de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm y `pnpm rebuild <package>`).

## Contenido relacionado

<CardGroup cols={3}>
  <Card title="Creación de plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con los plugins.
  </Card>
  <Card title="Arquitectura de plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Descripción general del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de plugins e importaciones de subrutas.
  </Card>
</CardGroup>
