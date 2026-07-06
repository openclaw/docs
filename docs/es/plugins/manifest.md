---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Plugin manifest + requisitos del esquema JSON (validación estricta de configuración)
title: Manifest de Plugin
x-i18n:
    generated_at: "2026-07-06T21:51:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 317fa77e9e760777a64daa183c72118b78a75a786ca1ca5f8a3fbf289cadff02
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página cubre el **manifiesto de Plugin nativo de OpenClaw**, `openclaw.plugin.json`. Para diseños de paquete compatibles (Codex, Claude, Cursor), consulta [paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan sus propios archivos de manifiesto en su lugar:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente esos diseños, pero no los valida contra el esquema `openclaw.plugin.json` que aparece abajo. Para un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de Claude `settings.json`, los valores predeterminados de LSP de Claude y los paquetes de hooks compatibles, cuando el diseño coincide con las expectativas de tiempo de ejecución de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar código del Plugin**. Un manifiesto ausente o no válido bloquea la validación de la configuración y se trata como un error del Plugin.

Consulta [Plugins](/es/tools/plugin) para la guía completa del sistema de Plugins, y [modelo de capacidades](/es/plugins/architecture#public-capability-model) para el modelo de capacidades nativo y la orientación actual de compatibilidad externa.

## Qué hace este archivo

`openclaw.plugin.json` son metadatos que OpenClaw lee **antes de cargar el código de tu Plugin**. Todo lo que contiene debe ser lo bastante barato de inspeccionar sin arrancar el tiempo de ejecución del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones para la interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal, fusionados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento en tiempo de ejecución, declarar puntos de entrada de código ni metadatos de instalación de npm. Eso corresponde al código de tu Plugin y a `package.json`.

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

| Campo                                | Obligatorio | Tipo                         | Qué significa                                                                                                                                                                                                                                           |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                     | Id canónico de Plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                                                   |
| `configSchema`                       | Sí          | `object`                     | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                                                              |
| `requiresPlugins`                    | No          | `string[]`                   | Ids de Plugin que también deben estar instalados para que este Plugin tenga efecto. El descubrimiento mantiene el Plugin cargable, pero advierte cuando falta algún Plugin requerido.                                                                    |
| `enabledByDefault`                   | No          | `true`                       | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor que no sea `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                                                    |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                   | Marca un Plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js indicadas, por ejemplo `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                              |
| `legacyPluginIds`                    | No          | `string[]`                   | Ids heredados que se normalizan a este id canónico de Plugin.                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                   | Ids de proveedor que deben habilitar automáticamente este Plugin cuando las referencias de autenticación, configuración o modelo los mencionen.                                                                                                          |
| `kind`                               | No          | `PluginKind \| PluginKind[]` | Declara uno o más tipos de Plugin exclusivos (`"memory"`, `"context-engine"`) usados por `plugins.slots.*`. Un Plugin que posee ambos slots declara ambos tipos en un array.                                                                            |
| `channels`                           | No          | `string[]`                   | Ids de canal propiedad de este Plugin. Se usa para el descubrimiento y la validación de configuración.                                                                                                                                                   |
| `providers`                          | No          | `string[]`                   | Ids de proveedor propiedad de este Plugin.                                                                                                                                                                                                              |
| `providerCatalogEntry`               | No          | `string`                     | Ruta ligera del módulo de catálogo de proveedores, relativa a la raíz del Plugin, para metadatos de catálogo de proveedores con alcance de manifiesto que pueden cargarse sin activar todo el entorno de ejecución del Plugin.                           |
| `modelSupport`                       | No          | `object`                     | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para cargar automáticamente el Plugin antes del entorno de ejecución.                                                                                                         |
| `modelCatalog`                       | No          | `object`                     | Metadatos declarativos de catálogo de modelos para proveedores propiedad de este Plugin. Este es el contrato del plano de control para futuros listados de solo lectura, incorporación, selectores de modelo, alias y supresión sin cargar el entorno de ejecución del Plugin. |
| `modelPricing`                       | No          | `object`                     | Política de consulta de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o mapear referencias de proveedor a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedor en core. |
| `modelIdNormalization`               | No          | `object`                     | Limpieza de alias/prefijos de id de modelo propiedad del proveedor que debe ejecutarse antes de cargar el entorno de ejecución del proveedor.                                                                                                            |
| `providerEndpoints`                  | No          | `object[]`                   | Metadatos host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que core debe clasificar antes de cargar el entorno de ejecución del proveedor.                                                                                    |
| `providerRequest`                    | No          | `object`                     | Metadatos ligeros de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de cargar el entorno de ejecución del proveedor.                                                                          |
| `secretProviderIntegrations`         | No          | `Record<string, object>`     | Preajustes declarativos de proveedor exec de SecretRef que las superficies de setup o instalación pueden ofrecer sin codificar integraciones específicas de proveedor en core.                                                                           |
| `cliBackends`                        | No          | `string[]`                   | Ids de backend de inferencia de CLI propiedad de este Plugin. Se usa para la activación automática al inicio desde referencias de configuración explícitas.                                                                                              |
| `syntheticAuthRefs`                  | No          | `string[]`                   | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debe sondearse durante el descubrimiento de modelos en frío antes de cargar el entorno de ejecución.                                                 |
| `nonSecretAuthMarkers`               | No          | `string[]`                   | Valores de clave de API de marcador de posición propiedad del Plugin incluido que representan estado de credenciales locales, OAuth o ambientales no secretas.                                                                                          |
| `commandAliases`                     | No          | `object[]`                   | Nombres de comando propiedad de este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de cargar el entorno de ejecución.                                                                                       |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`   | Metadatos de entorno de compatibilidad obsoletos para la consulta de autenticación/estado de proveedores. Prefiere `setup.providers[].envVars` para nuevos Plugins; OpenClaw sigue leyendo esto durante la ventana de obsolescencia.                    |
| `providerUsageAuthEnvVars`           | No          | `Record<string, string[]>`   | Credenciales de proveedor solo para uso/facturación. OpenClaw usa estos nombres para el descubrimiento de uso y la depuración de secretos, pero nunca para autenticación de inferencia.                                                                  |
| `providerAuthAliases`                | No          | `Record<string, string>`     | Ids de proveedor que deben reutilizar otro id de proveedor para la consulta de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                                  |
| `channelEnvVars`                     | No          | `Record<string, string[]>`   | Metadatos ligeros de entorno de canal que OpenClaw puede inspeccionar sin cargar código de Plugin. Usa esto para superficies de configuración o autenticación de canal impulsadas por entorno que los helpers genéricos de inicio/configuración deben ver. |
| `providerAuthChoices`                | No          | `object[]`                   | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI.                                                                                                    |
| `activation`                         | No          | `object`                     | Metadatos ligeros del planificador de activación para carga activada por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el entorno de ejecución del Plugin sigue siendo dueño del comportamiento real.                             |
| `setup`                              | No          | `object`                     | Descriptores ligeros de setup/incorporación que el descubrimiento y las superficies de setup pueden inspeccionar sin cargar el entorno de ejecución del Plugin.                                                                                          |
| `qaRunners`                          | No          | `object[]`                   | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de cargar el entorno de ejecución del Plugin.                                                                                                                |
| `contracts`                          | No          | `object`                     | Instantánea estática de propiedad de capacidades para hooks de autenticación externos, embeddings, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes/video/música, web fetch, web search, extracción de contenido de documentos/web y propiedad de herramientas. |
| `configContracts`                    | No          | `object`                     | Comportamiento de configuración propiedad del manifiesto consumido por helpers genéricos de core: detección de flags peligrosos, destinos de migración de SecretRef y restricción de rutas de configuración heredadas. Consulta la [referencia de configContracts](#configcontracts-reference). |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`     | Valores predeterminados ligeros de comprensión de medios para ids de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                                                    |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación ligeros para los ids de proveedor declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.                                                                                       |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación ligeros para los ids de proveedor declarados en `contracts.videoGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.                                                                                       |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación ligeros para los ids de proveedor declarados en `contracts.musicGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.                                                                                       |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos de disponibilidad ligeros para herramientas propiedad del Plugin declaradas en `contracts.tools`. Úsalo cuando una herramienta no deba cargar el tiempo de ejecución salvo que existan evidencias de configuración, entorno o autenticación.                                                                                |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración de canal propiedad del manifiesto, fusionados en las superficies de descubrimiento y validación antes de que se cargue el tiempo de ejecución.                                                                                                                                               |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se cargarán, relativos a la raíz del Plugin.                                                                                                                                                                                                  |
| `name`                               | No       | `string`                     | Nombre del Plugin legible por humanos.                                                                                                                                                                                                                              |
| `description`                        | No       | `string`                     | Resumen breve mostrado en las superficies del Plugin.                                                                                                                                                                                                                  |
| `icon`                               | No       | `string`                     | URL de imagen HTTPS para tarjetas de marketplace/catálogo. ClawHub acepta cualquier URL `https://` válida y recurre al icono predeterminado del Plugin cuando se omite o no es válida.                                                                                       |
| `version`                            | No       | `string`                     | Versión informativa del Plugin.                                                                                                                                                                                                                            |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de interfaz de usuario, marcadores de posición e indicaciones de sensibilidad para campos de configuración.                                                                                                                                                                                        |

## Referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales de autenticación estáticas para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de cargar el runtime del proveedor para que las herramientas del núcleo puedan decidir si un proveedor de generación está disponible sin importar cada plugin de proveedor.

Usa estos campos solo para datos declarativos y baratos. El transporte, las transformaciones de solicitudes, la actualización de tokens, la validación de credenciales y el comportamiento real de generación permanecen en el runtime del plugin.

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
| ---------------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No          | `string[]` | Ids de proveedor adicionales que deben contar como alias de autenticación estática para el proveedor de generación.                                  |
| `authProviders`        | No          | `string[]` | Ids de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                     |
| `configSignals`        | No          | `object[]` | Señales de disponibilidad baratas basadas solo en configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`          | No          | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id del proveedor, `aliases` y `authProviders`. |
| `referenceAudioInputs` | No          | `boolean`  | Solo para generación de video. Establécelo en `true` cuando el proveedor acepte recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada de `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Qué significa                                                                                                                                                                             |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí          | `string`   | Ruta con puntos al objeto de configuración propiedad del plugin que se debe inspeccionar, por ejemplo `plugins.entries.example.config`.                                                    |
| `overlayPath`    | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Úsala para configuración específica de capacidad como `image`, `video` o `music`. |
| `overlayMapPath` | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse cada uno al objeto raíz. Úsala para mapas de cuentas con nombre como `accounts`, donde cualquier cuenta configurada debe cumplir los requisitos. |
| `required`       | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arrays no deben estar vacíos.                  |
| `requiredAny`    | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                   |
| `mode`           | No          | `object`   | Guardia opcional de modo de cadena dentro de la configuración efectiva. Úsala cuando la disponibilidad solo por configuración se aplica solo a un modo.                                  |

Cada guardia de `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`. |
| `default`    | No          | `string`   | Valor de modo que se debe usar cuando la configuración omite la ruta.              |
| `allowed`    | No          | `string[]` | Si está presente, la señal pasa solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.  |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Id de proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                           |
| `providerBaseUrl` | No          | `object` | Guardia opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Úsala cuando un alias de autenticación solo es válido para ciertas API. |

Cada guardia de `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Id de configuración de proveedor cuyo `baseUrl` debe comprobarse.                                                                                    |
| `defaultBaseUrl`  | No          | `string`   | URL base que se debe asumir cuando la configuración del proveedor omite `baseUrl`.                                                                    |
| `allowedBaseUrls` | Sí          | `string[]` | URLs base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que los metadatos de proveedores de generación, indexadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara evidencia de disponibilidad barata para que OpenClaw pueda evitar importar el runtime de un plugin solo para que su fábrica de herramientas devuelva `null`.

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

Las entradas de `toolMetadata` también aceptan `optional` (marca la herramienta como no obligatoria para la activación del plugin) y `replaySafe` (marca la ejecución de la herramienta como segura para repetir después de un turno de modelo incompleto), además de los campos compartidos `configSignals`/`authSignals` anteriores.

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de la herramienta coincide con la política. Para herramientas de rutas críticas cuya fábrica depende de autenticación/configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el runtime para preguntar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw lee esto antes de cargar el runtime del proveedor. Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración derivadas de descriptores y metadatos del catálogo de instalación sin cargar el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Qué significa                                                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | Id del proveedor al que pertenece esta opción.                                                            |
| `method`              | Sí          | `string`                                                              | Id del método de autenticación al que se debe despachar.                                                   |
| `choiceId`            | Sí          | `string`                                                              | Id estable de opción de autenticación usado por los flujos de incorporación y CLI.                         |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                              |
| `choiceHint`          | No          | `string`                                                              | Texto breve de ayuda para el selector.                                                                    |
| `assistantPriority`   | No          | `number`                                                              | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.        |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la opción de los selectores del asistente, pero permite la selección manual en la CLI.              |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | Ids de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                   |
| `groupId`             | No          | `string`                                                              | Id de grupo opcional para agrupar opciones relacionadas.                                                   |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario para ese grupo.                                                          |
| `groupHint`           | No          | `string`                                                              | Texto breve de ayuda para el grupo.                                                                       |
| `onboardingFeatured`  | No          | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "Más...". |
| `optionKey`           | No          | `string`                                                              | Clave interna de opción para flujos de autenticación simples de una sola marca.                            |
| `cliFlag`             | No          | `string`                                                              | Nombre de la marca de CLI, como `--openrouter-api-key`.                                                   |
| `cliOption`           | No          | `string`                                                              | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | No          | `string`                                                              | Descripción usada en la ayuda de la CLI.                                                                  |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un Plugin posee un nombre de comando de runtime que los usuarios podrían poner por error en `plugins.allow` o intentar ejecutar como comando raíz de CLI. OpenClaw usa estos metadatos para diagnósticos sin importar código de runtime del Plugin.

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
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este Plugin.                          |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como comando slash de chat en lugar de comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe uno. |

## Referencia de activation

Usa `activation` cuando el Plugin puede declarar de forma económica qué eventos del plano de control deben incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra comportamiento de runtime, no reemplaza `register(...)` y no promete que el código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para reducir los Plugins candidatos antes de recurrir a metadatos existentes de propiedad del manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y hooks.

Prefiere los metadatos más estrechos que ya describan la propiedad. Usa `providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts` cuando esos campos expresen la relación. Usa `activation` para pistas adicionales del planificador que no puedan representarse con esos campos de propiedad. Usa `cliBackends` de nivel superior para alias de runtime de CLI como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para ids de arneses de agente integrados que todavía no tienen un campo de propiedad.

Cada Plugin debe definir `activation.onStartup` intencionalmente. Establécelo en `true` solo cuando el Plugin deba ejecutarse durante el inicio del Gateway. Establécelo en `false` cuando el Plugin esté inerte al inicio y deba cargarse solo desde disparadores más estrechos. Omitir `onStartup` ya no carga implícitamente el Plugin al inicio; usa metadatos de activación explícitos para inicio, canal, configuración, arnés de agente, memoria u otros disparadores de activación más estrechos.

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
| `onStartup`        | No          | `boolean`                                            | Activación explícita en el inicio del Gateway. Cada Plugin debe definir esto. `true` importa el Plugin durante el inicio; `false` lo mantiene diferido al inicio salvo que otro disparador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Ids de proveedores que deben incluir este Plugin en planes de activación/carga.                                                                                                             |
| `onAgentHarnesses` | No          | `string[]`                                           | Ids de runtime de arneses de agente integrados que deben incluir este Plugin en planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI.              |
| `onCommands`       | No          | `string[]`                                           | Ids de comandos que deben incluir este Plugin en planes de activación/carga.                                                                                                                |
| `onChannels`       | No          | `string[]`                                           | Ids de canales que deben incluir este Plugin en planes de activación/carga.                                                                                                                 |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deben incluir este Plugin en planes de activación/carga.                                                                                                                 |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este Plugin en planes de inicio/carga cuando la ruta esté presente y no esté deshabilitada explícitamente.                    |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más estrechos cuando sea posible.                                               |

Consumidores activos actuales:

- La planificación de inicio del Gateway usa `activation.onStartup` para la importación explícita al inicio.
- La planificación de CLI disparada por comandos recurre a `commandAliases[].cliCommand` o `commandAliases[].name` heredados.
- La planificación de inicio del runtime de agente usa `activation.onAgentHarnesses` para arneses integrados y `cliBackends[]` de nivel superior para alias de runtime de CLI.
- La planificación de configuración/canal disparada por canal recurre a la propiedad heredada `channels[]` cuando faltan metadatos explícitos de activación de canal.
- La planificación de Plugins de inicio usa `activation.onConfigPaths` para superficies de configuración raíz que no son canales, como el bloque `browser` del Plugin de navegador incluido.
- La planificación de configuración/runtime disparada por proveedor recurre a la propiedad heredada `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor.

Los diagnósticos del planificador pueden distinguir las pistas de activación explícitas de la reserva de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que `activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el planificador usó la propiedad de `commandAliases` en su lugar. Estas etiquetas de motivo son para diagnósticos del host y pruebas; los autores de Plugins deben seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Usa `qaRunners` cuando un Plugin aporta uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el runtime
del Plugin sigue siendo propietario del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations` coincidentes. Un
`adapterFactory` opcional expone el transporte a escenarios de QA compartidos sin
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

| Campo         | Obligatorio | Tipo     | Qué significa                                                      |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.       |
| `description` | No          | `string` | Texto de ayuda de reserva usado cuando el host compartido necesita un comando stub. |

El id de `adapterFactory` debe coincidir con `commandName`. No exportes registros
para comandos ausentes del manifiesto.

## Referencia de setup

Usa `setup` cuando las superficies de configuración inicial e incorporación necesiten metadatos baratos propiedad del plugin antes de que se cargue el tiempo de ejecución.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de CLI. `setup.cliBackends` es la superficie descriptora específica de configuración inicial para flujos de plano de control/configuración inicial que deben permanecer solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie de búsqueda preferida basada primero en descriptores para el descubrimiento de configuración inicial. Si el descriptor solo acota el plugin candidato y la configuración inicial todavía necesita hooks de tiempo de configuración inicial más completos, establece `requiresRuntime: true` y conserva `setup-api` como la ruta de ejecución alternativa.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y variables de entorno. `providerAuthEnvVars` sigue admitido mediante un adaptador de compatibilidad durante la ventana de desuso, pero los plugins no empaquetados que aún lo usan reciben un diagnóstico de manifiesto. Los plugins nuevos deben colocar los metadatos de entorno de configuración inicial/estado en `setup.providers[].envVars`.

Usa `providerUsageAuthEnvVars` cuando una credencial de facturación o de nivel de organización deba activar `resolveUsageAuth` sin convertirse en una credencial de inferencia. Estos nombres se incorporan al bloqueo de dotenv del espacio de trabajo, la eliminación en procesos secundarios ACP, el filtrado de secretos del sandbox y la depuración amplia de secretos. El tiempo de ejecución del proveedor todavía lee y clasifica el valor dentro de `resolveUsageAuth`.

OpenClaw también puede derivar opciones simples de configuración inicial desde `setup.providers[].authMethods` cuando no hay una entrada de configuración inicial disponible, o cuando `setup.requiresRuntime: false` declara que el tiempo de ejecución de configuración inicial no es necesario. Las entradas explícitas de `providerAuthChoices` siguen siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de incorporación y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la superficie de configuración inicial. OpenClaw trata el `false` explícito como un contrato solo de descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración inicial. Si un plugin solo de descriptores aún distribuye una de esas entradas de tiempo de ejecución de configuración inicial, OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento alternativo heredado para que los plugins existentes que agregaron descriptores sin el flag no se rompan.

Como la búsqueda de configuración inicial puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

Cuando el tiempo de ejecución de configuración inicial sí se ejecuta, los diagnósticos del registro de configuración inicial informan desviación de descriptores si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro de tiempo de ejecución correspondiente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### Referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí          | `string`   | Id de proveedor expuesto durante la configuración inicial o incorporación. Mantén los ids normalizados globalmente únicos. |
| `authMethods`  | No          | `string[]` | Ids de métodos de configuración inicial/autenticación que este proveedor admite sin cargar el tiempo de ejecución completo. |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración inicial/estado pueden comprobar antes de que se cargue el tiempo de ejecución del plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones baratas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que se pueden verificar sin cargar código de tiempo de ejecución. Estas comprobaciones deben seguir siendo baratas y locales: sin llamadas de red, sin lecturas de keychain o gestores de secretos, sin comandos de shell y sin sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita de archivo de credenciales. |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivo de credenciales comprobadas cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una variable de entorno listada debe no estar vacía para que la evidencia sea válida. |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida. |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente. |
| `source`           | No          | `string`   | Etiqueta de fuente visible para el usuario en la salida de autenticación/estado. |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración inicial de proveedor expuestos durante la configuración inicial y la incorporación. |
| `cliBackends`      | No          | `string[]` | Ids de backend en tiempo de configuración inicial usados para búsqueda de configuración inicial basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración inicial de este plugin. |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración inicial todavía necesita ejecución de `setup-api` después de la búsqueda por descriptor. |

## Referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas sugerencias de renderizado.

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

Cada sugerencia de campo puede incluir:

| Campo         | Tipo       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda. |
| `tags`        | `string[]` | Etiquetas de UI opcionales. |
| `advanced`    | `boolean`  | Marca el campo como avanzado. |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de marcador de posición para entradas de formulario. |

## Referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede leer sin importar el tiempo de ejecución del plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de factory de extensión del servidor de aplicaciones de Codex, actualmente `codex-app-server`.                                   |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime para los que este Plugin puede registrar middleware de resultado de herramienta.                                      |
| `trustedToolPolicies`            | `string[]` | Ids de políticas locales de confianza previas a herramientas que un Plugin instalado puede registrar. Los Plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Ids de proveedores cuyo hook de perfil de autenticación externa pertenece a este Plugin.                                             |
| `embeddingProviders`             | `string[]` | Ids de proveedores generales de embeddings que pertenecen a este Plugin para uso reutilizable de embeddings vectoriales, incluida la memoria. |
| `speechProviders`                | `string[]` | Ids de proveedores de voz que pertenecen a este Plugin.                                                                              |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real que pertenecen a este Plugin.                                                     |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real que pertenecen a este Plugin.                                                               |
| `memoryEmbeddingProviders`       | `string[]` | Ids obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este Plugin.                                      |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de comprensión multimedia que pertenecen a este Plugin.                                                           |
| `transcriptSourceProviders`      | `string[]` | Ids de proveedores de fuente de transcripción que pertenecen a este Plugin.                                                          |
| `documentExtractors`             | `string[]` | Ids de proveedores de extracción de documentos (por ejemplo, PDF) que pertenecen a este Plugin.                                      |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes que pertenecen a este Plugin.                                                           |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video que pertenecen a este Plugin.                                                              |
| `musicGenerationProviders`       | `string[]` | Ids de proveedores de generación de música que pertenecen a este Plugin.                                                             |
| `webContentExtractors`           | `string[]` | Ids de proveedores de extracción de contenido de páginas web que pertenecen a este Plugin.                                           |
| `webFetchProviders`              | `string[]` | Ids de proveedores de obtención web que pertenecen a este Plugin.                                                                    |
| `webSearchProviders`             | `string[]` | Ids de proveedores de búsqueda web que pertenecen a este Plugin.                                                                     |
| `usageProviders`                 | `string[]` | Ids de proveedores cuyos hooks de autenticación de uso e instantánea de uso pertenecen a este Plugin.                                |
| `migrationProviders`             | `string[]` | Ids de proveedores de importación que pertenecen a este Plugin para `openclaw migrate`.                                              |
| `gatewayMethodDispatch`          | `string[]` | Derecho reservado para rutas HTTP autenticadas de Plugin que despachan métodos de Gateway dentro del proceso.                        |
| `tools`                          | `string[]` | Nombres de herramientas de agente que pertenecen a este Plugin.                                                                      |

`contracts.embeddedExtensionFactories` se conserva para factories de extensiones incluidas exclusivas del servidor de aplicaciones de Codex. Las transformaciones incluidas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)` en su lugar. Los Plugins instalados pueden usar la misma unión de middleware solo cuando esté habilitada explícitamente y solo para los runtimes que declaren en `contracts.agentToolResultMiddleware`.

Los Plugins instalados que necesitan el nivel de política previa a herramientas de confianza del host deben declarar cada id local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente. Los Plugins incluidos conservan la ruta de políticas de confianza existente, pero los Plugins instalados con ids de política no declarados se rechazan antes del registro. Los ids de política tienen alcance al Plugin que los registra, por lo que dos Plugins pueden declarar y registrar `workflow-budget`; un solo Plugin no puede registrar el mismo id local dos veces.

Los registros de runtime `api.registerTool(...)` deben coincidir con `contracts.tools`. El descubrimiento de herramientas usa esta lista para cargar solo los runtimes de Plugin que pueden poseer las herramientas solicitadas.

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los Plugins de proveedor que implementan tanto `resolveUsageAuth` como `fetchUsageSnapshot` deben declarar cada id de proveedor descubierto automáticamente en `contracts.usageProviders`. El descubrimiento de uso lee este contrato antes de cargar código de runtime y luego verifica ambos hooks después de cargar solo los propietarios declarados.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` para cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Usa el contrato general para generación reutilizable de vectores, incluidos los proveedores consumidos por la búsqueda de memoria. `contracts.memoryEmbeddingProviders` es compatibilidad obsoleta específica de memoria y permanece solo mientras los proveedores existentes migran a la unión genérica de proveedor de embeddings.

`contracts.gatewayMethodDispatch` actualmente acepta `"authenticated-request"`. Es una barrera de higiene de API para rutas HTTP nativas de Plugin que despachan intencionalmente métodos del plano de control de Gateway dentro del proceso, no un sandbox contra Plugins nativos maliciosos. Úsalo solo para superficies incluidas/de operador revisadas estrictamente que ya requieren autenticación HTTP de Gateway.

## Referencia de configContracts

Usa `configContracts` para el comportamiento de configuración propiedad del manifiesto que los helpers genéricos del núcleo necesitan sin importar el runtime del Plugin: detección de flags peligrosos, destinos de migración de SecretRef y acotación de rutas de configuración heredadas.

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

| Campo                         | Requerido | Tipo       | Qué significa                                                                                                                                                                                                                          |
| ----------------------------- | --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No        | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad en tiempo de configuración de este Plugin. Permite que las lecturas genéricas de configuración de runtime omitan todas las superficies de configuración de Plugin cuando la configuración nunca referencia el Plugin. |
| `compatibilityRuntimePaths`   | No        | `string[]` | Rutas de compatibilidad relativas a la raíz que este Plugin puede atender durante el runtime antes de que el código del Plugin se active por completo. Usa esto para superficies heredadas que deben acotar los conjuntos de candidatos incluidos sin importar cada runtime de Plugin compatible. |
| `dangerousFlags`              | No        | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando estén habilitados. Consulta abajo.                                                                                                     |
| `secretInputs`                | No        | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` que el registro de destinos de migración/auditoría de SecretRef debe tratar como cadenas con forma de secreto. Consulta abajo.                                             |

Cada entrada de `dangerousFlags` admite:

| Campo    | Requerido | Tipo                                  | Qué significa                                                                                                       |
| -------- | --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sí        | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapa/array. |
| `equals` | Sí        | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                 |

`secretInputs` admite:

| Campo                   | Requerido | Tipo       | Qué significa                                                                                                                                                                                                   |
| ----------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No        | `boolean`  | Sobrescribe la habilitación predeterminada del Plugin incluido al decidir si esta superficie de SecretRef está activa. Usa esto cuando el Plugin está incluido pero la superficie debe permanecer inactiva hasta que se habilite explícitamente en la configuración. |
| `paths`                 | Sí        | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`) y `expected` opcional (actualmente solo `"string"`).     |

## Referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tiene modelos predeterminados, prioridad de fallback de autenticación automática o compatibilidad nativa con documentos que los helpers genéricos del núcleo necesitan antes de cargar el runtime. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

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
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo.           |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan antes para el respaldo automático de proveedores basado en credenciales.       |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documentos nativas admitidas por el proveedor.                                                       |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sobrescrituras de modelo por tipo de documento. Establece `image: false` para desactivar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un Plugin de canal necesita metadatos de configuración ligeros antes de que se cargue el runtime. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos directamente para canales externos configurados cuando no hay una entrada de configuración disponible, o cuando `setup.requiresRuntime: false` declara que el runtime de configuración no es necesario.

`channelConfigs` es metadatos del manifiesto del Plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué Plugin posee ese canal configurado antes de que se ejecute el código de runtime del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaran `channels[]` también deberían declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el Plugin, pero el esquema de configuración de ruta fría, la configuración inicial y las superficies de Control UI no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el runtime del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración de comandos que se ejecutan antes de que se cargue el runtime del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con sus otros metadatos de catálogo de canal propiedad del paquete.

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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI/marcadores de posición/indicaciones sensibles opcionales para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta de canal fusionada en el selector y las superficies de inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Comandos nativos estáticos y valores predeterminados automáticos de Skill nativa para comprobaciones de configuración previas al runtime. |
| `preferOver`  | `string[]`               | Ids de Plugins heredados o de menor prioridad a los que este canal debería superar en las superficies de selección. |

### Reemplazar otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido de un id de canal que otro Plugin también puede proporcionar. Los casos habituales son un id de Plugin renombrado, un Plugin independiente que sustituye a un Plugin incluido, o una bifurcación mantenida que conserva el mismo id de canal para compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el id de canal como el id de Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo desactiva en la configuración efectiva de runtime para que un Plugin posea el canal y sus herramientas. La selección explícita del usuario sigue ganando: si el usuario habilita explícitamente ambos Plugins (mediante `plugins.allow` o una configuración material de `plugins.entries`), OpenClaw conserva esa elección e informa diagnósticos de canal/herramienta duplicados en lugar de cambiar silenciosamente el conjunto de Plugins solicitado.

Mantén `preferOver` limitado a ids de Plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin proveedor a partir de ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el runtime del Plugin.

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
- `modelPatterns` prevalece sobre `modelPrefixes`
- si un Plugin no incluido y un Plugin incluido coinciden, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra ids de modelo abreviados.           |
| `modelPatterns` | `string[]` | Fuentes de regex comparadas contra ids de modelo abreviados después de eliminar el sufijo del perfil. |

Las entradas de `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contienen repetición anidada (por ejemplo `(a+)+$`). Los patrones que fallan la comprobación de seguridad se omiten silenciosamente, igual que una regex sintácticamente inválida. Mantén los patrones simples y evita cuantificadores anidados.

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer metadatos de modelos de proveedor antes de cargar el runtime del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo fijas, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización de runtime sigue perteneciendo al código de runtime del proveedor, pero el manifiesto indica al núcleo cuándo se requiere runtime.

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

| Campo            | Tipo                                                     | Qué significa                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas de catálogo para ids de proveedores propiedad de este Plugin. Las claves también deberían aparecer en `providers` de nivel superior. |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedor que deberían resolverse a un proveedor propio para la planificación de catálogo o supresión. |
| `suppressions`   | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por una razón específica del proveedor.              |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, actualizarse en caché o requiere runtime. |
| `runtimeAugment` | `boolean`                                                | Establece en `true` solo cuando el runtime del proveedor debe anexar filas de catálogo después de la planificación de manifiesto/configuración. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación del catálogo de modelos. Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar sobrescrituras de API/URL base del alias sin cargar el runtime del proveedor. Los alias no expanden los listados de catálogo sin filtrar; las listas amplias emiten solo las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook `suppressBuiltInModel` del runtime del proveedor. Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o está declarado como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión de runtime ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor. |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor. |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin un `id` se ignoran.   |

Campos del modelo:

| Campo              | Tipo                                                           | Qué significa                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Id de modelo local del proveedor, sin el prefijo `provider/`.              |
| `name`             | `string`                                                       | Nombre de visualización opcional.                                           |
| `api`              | `ModelApi`                                                     | Sustitución opcional de API por modelo.                                     |
| `baseUrl`          | `string`                                                       | Sustitución opcional de URL base por modelo.                                |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Otros valores se descartan silenciosamente. |
| `reasoning`        | `boolean`                                                      | Indica si el modelo expone comportamiento de razonamiento.                  |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                   |
| `contextTokens`    | `number`                                                       | Límite efectivo opcional del contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Tokens máximos de salida cuando se conocen.                                 |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sustituciones opcionales de id de modelo o parámetros por nivel de pensamiento. |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`           | `object`                                                       | Marcas de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuración de entrada opcional por modalidad, actualmente solo imagen.   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprimir solo cuando la fila no deba aparecer en absoluto. |
| `statusReason`     | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                       |
| `replaces`         | `string[]`                                                     | Ids de modelo locales del proveedor anteriores a los que este modelo reemplaza. |
| `replacedBy`       | `string`                                                       | Id de modelo local del proveedor de reemplazo para filas obsoletas.         |
| `tags`             | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                         |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id del proveedor para la fila ascendente que se va a suprimir. Debe pertenecer a este Plugin o declararse como alias propio. |
| `model`                    | `string`   | Id de modelo local del proveedor que se va a suprimir.                                                    |
| `reason`                   | `string`   | Mensaje opcional que se muestra cuando la fila suprimida se solicita directamente.                        |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efectivos del proveedor requeridos para que se aplique la supresión. |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración del proveedor requeridos para que se aplique la supresión. |

No pongas datos solo de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor y de selector omitan el descubrimiento de registro/tiempo de ejecución. Usa `refreshable` cuando las filas del manifiesto sean semillas o complementos listables útiles, pero una actualización/caché pueda agregar más filas más adelante; las filas actualizables no son autoritativas por sí mismas. Usa `runtime` cuando OpenClaw deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza barata de ids de modelo propiedad del proveedor que debe ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres cortos de modelo, ids heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del Plugin propietario, en lugar de en tablas centrales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de ids de modelo sin distinguir mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de buscar alias; útil para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se agrega cuando el id de modelo normalizado aún no contiene `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para ids simples después de buscar alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo propietario del significado de cada `endpointClass`; los manifiestos de Plugin son propietarios de los metadatos de host y URL base.

Los Plugins de proveedor externalizados oficialmente se excluyen de la distribución del núcleo, por lo que sus manifiestos son invisibles hasta que se instalan. Sus `providerEndpoints` también deben duplicarse en `scripts/lib/official-external-provider-catalog.json` para que la clasificación de endpoints siga funcionando sin el Plugin; una prueba de contrato exige el duplicado.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint conocida del núcleo, como `openrouter`, `moonshot-native` o `google-vertex`. |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                 |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Anteponer `.` para coincidencia solo por sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                   |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex. |

## Referencia de providerRequest

Usa `providerRequest` para metadatos baratos de compatibilidad de solicitudes que la política genérica de solicitudes necesita sin cargar el tiempo de ejecución del proveedor. Mantén la reescritura de cargas útiles específica del comportamiento en hooks del tiempo de ejecución del proveedor o en ayudantes compartidos de familias de proveedores.

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
| `family`              | `string`     | Etiqueta de familia de proveedor usada por decisiones genéricas de compatibilidad de solicitudes y diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de familia de proveedor para ayudantes compartidos de solicitudes. |
| `openAICompletions`   | `object`     | Marcas de solicitud de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de secretProviderIntegrations

Usa `secretProviderIntegrations` cuando un Plugin pueda publicar un preajuste reutilizable de proveedor exec de SecretRef. OpenClaw lee estos metadatos antes de que se cargue el tiempo de ejecución del Plugin, almacena la propiedad del Plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución real del secreto al tiempo de ejecución de SecretRef. Los preajustes se exponen solo para Plugins incluidos e instalados descubiertos desde las raíces administradas de instalación de Plugins, como instalaciones de git y ClawHub.

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

La clave del mapa es el id de integración. Si se omite `providerAlias`, OpenClaw usa el id de integración como alias de proveedor de SecretRef. Los alias de proveedor deben coincidir con el patrón normal de alias de proveedor de SecretRef, por ejemplo `team-secrets` o `onepassword-work`.

Cuando un operador selecciona el preajuste, OpenClaw escribe una referencia de proveedor como:

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

Al iniciar/recargar, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del Plugin, comprobando que el Plugin propietario esté instalado y activo, y materializando el comando exec desde el manifiesto. Deshabilitar o eliminar el Plugin revoca el proveedor para SecretRefs activos. Los operadores que quieran una configuración exec independiente aún pueden escribir proveedores manuales de `command`/`args` directamente.

Actualmente solo se admiten preajustes `source: "exec"`. `command` debe ser `${node}` y `args[0]` debe ser un script resolutor relativo a la raíz del Plugin con `./`. OpenClaw lo materializa al iniciar/recargar al ejecutable actual de Node y a la ruta absoluta del script dentro del Plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de preajuste del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar proveedores exec manuales independientes directamente.

OpenClaw deriva `trustedDirs` para los preajustes de manifiesto desde la raíz del plugin y, para los preajustes `${node}`, desde el directorio del ejecutable actual de Node. Los `trustedDirs` definidos por el manifiesto se ignoran. Otras opciones del proveedor de ejecución, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, pasan a la configuración normal del proveedor de ejecución SecretRef.

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesita comportamiento de precios del plano de control antes de que se cargue el runtime. La caché de precios del Gateway lee estos metadatos sin importar código de runtime del proveedor.

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

Campos de proveedor:

| Campo        | Tipo              | Qué significa                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Establece `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter ni LiteLLM. |
| `openRouter` | `false \| object` | Mapeo de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Mapeo de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id. de proveedor del catálogo externo cuando difiere del id. de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los ids. de modelo que contienen barras como referencias anidadas proveedor/modelo, útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id. de modelo del catálogo externo. `version-dots` prueba ids. de versión con puntos, como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw son metadatos de vista previa propiedad de OpenClaw para proveedores cuyos plugins quizá aún no estén instalados. No forma parte de un manifiesto de plugin. Los manifiestos de plugin siguen siendo la autoridad de los plugins instalados. El Índice de proveedores es el contrato interno de reserva que consumirán las superficies futuras de proveedores instalables y selector de modelos previo a la instalación cuando un plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. Manifiesto de plugin instalado `modelCatalog`.
3. Caché de catálogo de modelos desde una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de runtime ni datos de modelos en vivo específicos de una cuenta. Sus catálogos de vista previa usan la misma forma de fila de proveedor `modelCatalog` que los manifiestos de plugin, pero deben limitarse a metadatos de visualización estables, salvo que campos del adaptador de runtime como `api`, `baseUrl`, precios o flags de compatibilidad se mantengan intencionalmente alineados con el manifiesto del plugin instalado. Los proveedores con descubrimiento en vivo de `/models` deben escribir filas actualizadas mediante la ruta explícita de caché de catálogo de modelos, en lugar de hacer que el listado normal o el onboarding llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de plugin instalable para proveedores cuyo plugin se haya movido fuera del núcleo o que aún no esté instalado por otro motivo. Estos metadatos reflejan el patrón del catálogo de canales: nombre de paquete, especificación de instalación de npm, integridad esperada y etiquetas simples de elección de autenticación son suficientes para mostrar una opción de configuración instalable. Una vez instalado el plugin, su manifiesto gana y la entrada del Índice de proveedores se ignora para ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves de capacidad heredadas de manifiesto de nivel superior a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas claves (ni ninguna otra lista de capacidades) se lee ya como campo de manifiesto de nivel superior; la carga normal de manifiestos solo las reconoce bajo `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                   | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación e indicaciones de UI que deben existir antes de que se ejecute el código del plugin                         |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, bloqueo de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar código del plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugin previos al runtime viven intencionalmente en `package.json` bajo el bloque `openclaw`, en lugar de `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugin de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` más los campos compatibles de `package.json#openclaw` indicados a continuación.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada de plugin nativo. Deben permanecer dentro del directorio del paquete del plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo para configuración, usado durante el onboarding, el inicio diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del plugin.                         |
| `openclaw.channel`                                                                         | Metadatos simples de catálogo de canal, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de skill nativa, usados por superficies de configuración, auditoría y lista de comandos antes de que se cargue el runtime del canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros de comprobador de estado configurado que pueden responder "¿ya existe una configuración solo con variables de entorno?" sin cargar el runtime completo del canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros de comprobador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación/actualización para plugins empaquetados y publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host de OpenClaw, usando un piso semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Rango mínimo de API de plugin de OpenClaw requerido por este paquete, usando un piso semver como `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad esperada de dist de npm, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta estrecha de recuperación por reinstalación de plugin empaquetado cuando la configuración no es válida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando sus restricciones de plataforma del lockfile coinciden con el host actual.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite cargar superficies de canal de runtime de configuración antes de escuchar y luego difiere el plugin de canal configurado completo hasta la activación posterior a la escucha.                                                 |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en el onboarding antes de que se cargue el runtime. `package.json#openclaw.install` indica al onboarding cómo obtener o habilitar ese plugin cuando el usuario elige una de esas opciones. No muevas indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de plugin no empaquetadas. Los valores no válidos se rechazan; los valores más nuevos pero válidos omiten plugins externos en hosts más antiguos. Se asume que los plugins fuente empaquetados tienen la misma versión que el checkout del host.

`openclaw.install.requiredPlatformPackages` es para paquetes npm que exponen binarios nativos requeridos mediante alias opcionales específicos de plataforma. Lista el nombre de paquete npm simple para cada alias de plataforma compatible. Durante la instalación de npm, OpenClaw verifica solo el alias declarado cuyas restricciones del lockfile coinciden con el host actual. Si npm informa éxito pero omite ese alias, OpenClaw reintenta una vez con una caché nueva y revierte la instalación si el alias sigue faltando.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no incluidos. Úsalo para el piso de API del SDK/runtime de plugins de OpenClaw contra el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de Plugin necesita una API más nueva pero aún mantiene una sugerencia de instalación inferior para otros flujos. La sincronización de versiones oficiales de OpenClaw incrementa de forma predeterminada los pisos de API de los plugins oficiales existentes a la versión de OpenClaw, pero las versiones solo de plugins pueden mantener un piso inferior cuando el paquete admite intencionalmente hosts más antiguos. No uses solo la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` sigue siendo metadatos de paquete npm; OpenClaw usa el contrato `openclaw.compat.pluginApi` para las decisiones de compatibilidad de instalación.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el Plugin se publica en ClawHub; el onboarding lo trata como la fuente remota preferida y registra datos del artefacto de ClawHub después de la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad para los paquetes que aún no se han movido a ClawHub.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas del catálogo externo oficial deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen de forma cerrada si el artefacto npm obtenido ya no coincide con la versión fijada. El onboarding interactivo sigue ofreciendo especificaciones npm de registros de confianza, incluidos nombres de paquetes sin versión y dist-tags, por compatibilidad. Los diagnósticos de catálogo pueden distinguir fuentes exactas, flotantes, fijadas por integridad, sin integridad, con discrepancia de nombre de paquete y de elección predeterminada no válida. También advierten cuando `expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar. Cuando `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican; cuando se omite, la resolución del registro se registra sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales o los escaneos de SecretRef necesitan identificar cuentas configuradas sin cargar todo el runtime. La entrada de configuración debe exponer metadatos del canal más adaptadores de configuración, estado y secretos seguros para configuración; mantén los clientes de red, listeners de Gateway y runtimes de transporte en el punto de entrada principal de la extensión.

Los campos del punto de entrada de runtime no anulan las comprobaciones de límite de paquete para los campos del punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una ruta de escape `openclaw.extensions` sea cargable.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente estrecho. No hace instalables configuraciones arbitrariamente rotas. Hoy solo permite que los flujos de instalación se recuperen de fallos específicos obsoletos de actualización de plugins incluidos, como una ruta faltante de Plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un módulo comprobador muy pequeño:

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

Úsalo cuando la configuración, doctor, estado o flujos de presencia de solo lectura necesiten una comprobación barata de autenticación sí/no antes de cargar todo el Plugin de canal. El estado de autenticación persistente no es estado de canal configurado: no uses estos metadatos para habilitar automáticamente plugins, reparar dependencias de runtime ni decidir si debe cargarse un runtime de canal. La exportación de destino debe ser una función pequeña que lea solo estado persistente; no la enrutes a través del barrel completo del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de configuración solo por env:

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

Úsalo cuando un canal pueda responder el estado configurado desde env u otras entradas pequeñas que no sean de runtime. Si la comprobación necesita la resolución completa de configuración o el runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre plugins desde tres raíces, comprobadas en este orden: plugins incluidos enviados con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), más cualquier entrada explícita `plugins.load.paths`.

Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él. Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un Plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el rastreo de instalaciones de OpenClaw reconoce para ese mismo id, incluso cuando el id también pertenece a un Plugin incluido
3. **Incluido** — plugins enviados con OpenClaw
4. **Espacio de trabajo** — plugins descubiertos en relación con el espacio de trabajo actual
5. Cualquier otro candidato descubierto

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin incluido ubicada sin rastreo en el espacio de trabajo o la raíz global no ocultará la compilación incluida.
- Para anular un Plugin incluido, ejecuta `openclaw plugin install` para ese id para que la instalación global rastreada supere a la copia incluida, o fija una ruta específica mediante `plugins.entries.<id>` para que gane por precedencia seleccionada por configuración.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las anulaciones duplicadas seleccionadas por configuración se redactan como anulaciones explícitas en los diagnósticos, pero aun así advierten para que las bifurcaciones obsoletas y los ocultamientos accidentales sigan siendo visibles.

## Requisitos de JSON Schema

- **Todo Plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de configuración, no en runtime.
- Al extender o bifurcar un Plugin incluido con nuevas claves de configuración, actualiza al mismo tiempo el `configSchema` de `openclaw.plugin.json` de ese Plugin. Los esquemas de plugins incluidos son estrictos, por lo que agregar `plugins.entries.<id>.config.myNewKey` en la configuración del usuario sin agregar `myNewKey` a `configSchema.properties` se rechazará antes de que cargue el runtime del Plugin.

Ejemplo de extensión de esquema:

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

- Las claves `channels.*` desconocidas son **errores**, a menos que el id del canal esté declarado por un manifiesto de Plugin. Si el mismo id también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un Plugin referenciado pero no descubrible actualmente), OpenClaw reduce esto a una **advertencia** en su lugar.
- `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` que referencian ids de Plugin desconocidos son **advertencias** ("entrada de configuración obsoleta ignorada"), no errores, para que las actualizaciones y los plugins eliminados/renombrados no bloqueen el inicio del Gateway.
- `plugins.slots.memory` que referencia un id de Plugin desconocido es un **error**, excepto para el Plugin externo oficial conocido `memory-lancedb`, que advierte en su lugar.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o faltante, la validación falla y Doctor informa el error del Plugin.
- Si existe configuración de Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor + logs.

Consulta la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime aún carga el módulo del Plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se parsean con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse todos cuando un Plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debe importar código de runtime amplio; úsalo para metadatos estáticos de catálogo de proveedor o descriptores de descubrimiento estrechos, no para ejecución en tiempo de solicitud.
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (predeterminado `memory-core`), `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Declara el tipo exclusivo de Plugin en este manifiesto. `OpenClawPluginDefinition.kind` de entrada de runtime está obsoleto y permanece solo como alternativa de compatibilidad para plugins más antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto y `channelEnvVars`) son solo declarativos. El estado, auditoría, validación de entrega cron y otras superficies de solo lectura siguen aplicando la confianza del Plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieren código de proveedor, consulta [hooks de runtime de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de allowlist del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Building plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con plugins.
  </Card>
  <Card title="Plugin architecture" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="SDK overview" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones de subrutas.
  </Card>
</CardGroup>
