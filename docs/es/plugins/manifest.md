---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-07-05T11:31:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 400c67c01c551b23bd12c236b9f0d93f12316c284ff1e5f7b103bdb5abf882f2
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página cubre el **manifiesto nativo de Plugin de OpenClaw**, `openclaw.plugin.json`. Para diseños de paquetes compatibles (Codex, Claude, Cursor), consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan sus propios archivos de manifiesto en su lugar:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json`, o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw detecta automáticamente esos diseños, pero no los valida contra el esquema `openclaw.plugin.json` que aparece abajo. Para un paquete compatible, OpenClaw lee los metadatos del paquete, las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` de Claude, los valores predeterminados de LSP de Claude y los paquetes de hooks compatibles, cuando el diseño coincide con las expectativas de runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir `openclaw.plugin.json` en la **raíz del Plugin**. OpenClaw lo lee para validar la configuración **sin ejecutar código del Plugin**. Un manifiesto ausente o no válido bloquea la validación de configuración y se trata como un error del Plugin.

Consulta [Plugins](/es/tools/plugin) para la guía completa del sistema de Plugins y [Modelo de capacidades](/es/plugins/architecture#public-capability-model) para el modelo de capacidades nativo y la guía actual de compatibilidad externa.

## Qué hace este archivo

`openclaw.plugin.json` son metadatos que OpenClaw lee **antes de cargar el código de tu Plugin**. Todo lo que contiene debe ser lo bastante ligero como para inspeccionarlo sin iniciar el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones de IU de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno de proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en el catálogo y las superficies de validación

**No lo uses para:** registrar comportamiento de runtime, declarar puntos de entrada de código ni metadatos de instalación de npm. Eso corresponde al código de tu Plugin y a `package.json`.

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
| `id`                                 | Sí          | `string`                     | Id canónico del plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                                                   |
| `configSchema`                       | Sí          | `object`                     | JSON Schema en línea para la configuración de este plugin.                                                                                                                                                                                               |
| `requiresPlugins`                    | No          | `string[]`                   | Ids de plugins que también deben estar instalados para que este plugin tenga efecto. El descubrimiento mantiene el plugin cargable, pero avisa cuando falta algún plugin obligatorio.                                                                    |
| `enabledByDefault`                   | No          | `true`                       | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                                                                   |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                   | Marca un plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js indicadas, por ejemplo `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                               |
| `legacyPluginIds`                    | No          | `string[]`                   | Ids heredados que se normalizan a este id canónico de plugin.                                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                   | Ids de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las refs de modelo los mencionen.                                                                                                          |
| `kind`                               | No          | `PluginKind \| PluginKind[]` | Declara uno o más tipos exclusivos de plugin (`"memory"`, `"context-engine"`) usados por `plugins.slots.*`. Un plugin que posee ambos slots declara ambos tipos en un solo arreglo.                                                                     |
| `channels`                           | No          | `string[]`                   | Ids de canales propiedad de este plugin. Se usa para el descubrimiento y la validación de configuración.                                                                                                                                                 |
| `providers`                          | No          | `string[]`                   | Ids de proveedores propiedad de este plugin.                                                                                                                                                                                                             |
| `providerCatalogEntry`               | No          | `string`                     | Ruta del módulo ligero del catálogo de proveedores, relativa a la raíz del plugin, para metadatos del catálogo de proveedores con ámbito de manifiesto que pueden cargarse sin activar todo el runtime del plugin.                                       |
| `modelSupport`                       | No          | `object`                     | Metadatos abreviados de familias de modelos, propiedad del manifiesto, usados para cargar automáticamente el plugin antes del runtime.                                                                                                                   |
| `modelCatalog`                       | No          | `object`                     | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este plugin. Este es el contrato del plano de control para futuros listados de solo lectura, onboarding, selectores de modelos, alias y supresión sin cargar el runtime del plugin. |
| `modelPricing`                       | No          | `object`                     | Política de consulta de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o mapear refs de proveedor a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedor en core. |
| `modelIdNormalization`               | No          | `object`                     | Limpieza de alias/prefijos de id de modelo propiedad del proveedor que debe ejecutarse antes de que cargue el runtime del proveedor.                                                                                                                     |
| `providerEndpoints`                  | No          | `object[]`                   | Metadatos de host/baseUrl de endpoints, propiedad del manifiesto, para rutas de proveedor que core debe clasificar antes de que cargue el runtime del proveedor.                                                                                         |
| `providerRequest`                    | No          | `object`                     | Metadatos baratos de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que cargue el runtime del proveedor.                                                                                   |
| `secretProviderIntegrations`         | No          | `Record<string, object>`     | Preajustes declarativos de proveedores de ejecución SecretRef que las superficies de configuración o instalación pueden ofrecer sin codificar integraciones específicas de proveedor en core.                                                            |
| `cliBackends`                        | No          | `string[]`                   | Ids de backends de inferencia de CLI propiedad de este plugin. Se usan para la autoactivación al inicio desde refs de configuración explícitas.                                                                                                           |
| `syntheticAuthRefs`                  | No          | `string[]`                   | Refs de proveedores o backends de CLI cuyo hook de autenticación sintética propiedad del plugin debe sondearse durante el descubrimiento de modelos en frío antes de que cargue el runtime.                                                             |
| `nonSecretAuthMarkers`               | No          | `string[]`                   | Valores de clave de API de marcador de posición, propiedad de plugins incluidos, que representan estado de credenciales no secretas locales, OAuth o ambientales.                                                                                        |
| `commandAliases`                     | No          | `object[]`                   | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que cargue el runtime.                                                                                               |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`   | Metadatos de entorno de compatibilidad obsoletos para la consulta de autenticación/estado del proveedor. Prefiere `setup.providers[].envVars` para plugins nuevos; OpenClaw todavía lee esto durante la ventana de obsolescencia.                       |
| `providerAuthAliases`                | No          | `Record<string, string>`     | Ids de proveedores que deben reutilizar otro id de proveedor para la consulta de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                               |
| `channelEnvVars`                     | No          | `Record<string, string[]>`   | Metadatos baratos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Usa esto para superficies de configuración de canal o autenticación impulsadas por entorno que los ayudantes genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`                | No          | `object[]`                   | Metadatos baratos de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado sencillo de flags de CLI.                                                                                                    |
| `activation`                         | No          | `object`                     | Metadatos baratos del planificador de activación para carga activada por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo propietario del comportamiento real.                                   |
| `setup`                              | No          | `object`                     | Descriptores baratos de configuración/onboarding que el descubrimiento y las superficies de configuración pueden inspeccionar sin cargar el runtime del plugin.                                                                                         |
| `qaRunners`                          | No          | `object[]`                   | Descriptores baratos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del plugin.                                                                                                                         |
| `contracts`                          | No          | `object`                     | Instantánea estática de propiedad de capacidades para hooks de autenticación externa, embeddings, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes/video/música, obtención web, búsqueda web, extracción de contenido de documentos/web y propiedad de herramientas. |
| `configContracts`                    | No          | `object`                     | Comportamiento de configuración propiedad del manifiesto consumido por ayudantes genéricos de core: detección de flags peligrosos, destinos de migración SecretRef y acotación de rutas de configuración heredadas. Consulta la [referencia de configContracts](#configcontracts-reference). |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`     | Valores predeterminados baratos de comprensión de medios para ids de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `imageGenerationProviderMetadata`    | No          | `Record<string, object>`     | Metadatos baratos de autenticación de generación de imágenes para ids de proveedores declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de URL base.                                |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación económicos para generación de video de los id. de proveedor declarados en `contracts.videoGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                                                                                       |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadatos de autenticación económicos para generación de música de los id. de proveedor declarados en `contracts.musicGenerationProviders`, incluidos los alias de autenticación propiedad del proveedor y las protecciones de URL base.                                                                                       |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadatos de disponibilidad económicos para las herramientas propiedad del plugin declaradas en `contracts.tools`. Úsalos cuando una herramienta no deba cargar el runtime a menos que exista evidencia de configuración, entorno o autenticación.                                                                                |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadatos de configuración de canal propiedad del manifiesto, fusionados en las superficies de detección y validación antes de que se cargue el runtime.                                                                                                                                               |
| `skills`                             | No       | `string[]`                   | Directorios de Skills que se deben cargar, relativos a la raíz del plugin.                                                                                                                                                                                                  |
| `name`                               | No       | `string`                     | Nombre del plugin legible para humanos.                                                                                                                                                                                                                              |
| `description`                        | No       | `string`                     | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                                                                                  |
| `icon`                               | No       | `string`                     | URL de imagen HTTPS para tarjetas de marketplace/catálogo. ClawHub acepta cualquier URL `https://` válida y vuelve al icono predeterminado del plugin cuando se omite o no es válida.                                                                                       |
| `version`                            | No       | `string`                     | Versión informativa del plugin.                                                                                                                                                                                                                            |
| `uiHints`                            | No       | `Record<string, object>`     | Etiquetas de interfaz, marcadores de posición e indicaciones de sensibilidad para campos de configuración.                                                                                                                                                                                        |

## Referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales estáticas de autenticación para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de cargar el tiempo de ejecución del proveedor para que las herramientas del núcleo puedan decidir si un proveedor de generación está disponible sin importar cada Plugin de proveedor.

Usa estos campos solo para datos declarativos de bajo costo. El transporte, las transformaciones de solicitudes, la actualización de tokens, la validación de credenciales y el comportamiento real de generación permanecen en el tiempo de ejecución del Plugin.

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

| Campo                  | Obligatorio | Tipo       | Qué significa                                                                                                                                                    |
| ---------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No          | `string[]` | Ids de proveedor adicionales que deben contar como alias estáticos de autenticación para el proveedor de generación.                                              |
| `authProviders`        | No          | `string[]` | Ids de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                  |
| `configSignals`        | No          | `object[]` | Señales de disponibilidad de bajo costo basadas solo en configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`          | No          | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id del proveedor, `aliases` y `authProviders`. |
| `referenceAudioInputs` | No          | `boolean`  | Solo para generación de video. Establécelo en `true` cuando el proveedor acepta recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada de `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Qué significa                                                                                                                                                                       |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí          | `string`   | Ruta de puntos al objeto de configuración propiedad del Plugin que se debe inspeccionar, por ejemplo `plugins.entries.example.config`.                                              |
| `overlayPath`    | No          | `string`   | Ruta de puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Usa esto para configuración específica de capacidad, como `image`, `video` o `music`. |
| `overlayMapPath` | No          | `string`   | Ruta de puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse cada uno al objeto raíz. Usa esto para mapas de cuentas con nombre, como `accounts`, donde cualquier cuenta configurada debe calificar. |
| `required`       | No          | `string[]` | Rutas de puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos no deben estar vacíos.          |
| `requiredAny`    | No          | `string[]` | Rutas de puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                             |
| `mode`           | No          | `object`   | Guarda opcional de modo de cadena dentro de la configuración efectiva. Usa esto cuando la disponibilidad basada solo en configuración se aplica únicamente a un modo.               |

Cada guarda de `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                                 |
| ------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta de puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.         |
| `default`    | No          | `string`   | Valor de modo que se usa cuando la configuración omite la ruta.                                |
| `allowed`    | No          | `string[]` | Si está presente, la señal pasa solo cuando el modo efectivo es uno de estos valores.          |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.              |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                |
| ----------------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Id de proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                         |
| `providerBaseUrl` | No          | `object` | Guarda opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Usa esto cuando un alias de autenticación solo es válido para ciertas API. |

Cada guarda de `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                         |
| ----------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Id de configuración de proveedor cuyo `baseUrl` debe comprobarse.                                                                                     |
| `defaultBaseUrl`  | No          | `string`   | URL base que se asume cuando la configuración del proveedor omite `baseUrl`.                                                                          |
| `allowedBaseUrls` | Sí          | `string[]` | URLs base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que los metadatos de proveedores de generación, indexadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara evidencia de disponibilidad de bajo costo para que OpenClaw pueda evitar importar el tiempo de ejecución de un Plugin solo para que su fábrica de herramientas devuelva `null`.

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

Las entradas de `toolMetadata` también aceptan `optional` (marca la herramienta como no obligatoria para la activación del Plugin) y `replaySafe` (marca la ejecución de la herramienta como segura para repetir después de un turno incompleto del modelo), además de los campos compartidos `configSignals`/`authSignals` anteriores.

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el Plugin propietario cuando el contrato de la herramienta coincide con la política. Para herramientas de ruta crítica cuya fábrica depende de autenticación/configuración, los autores de Plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el tiempo de ejecución para consultar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw lee esto antes de cargar el tiempo de ejecución del proveedor. Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración derivadas del descriptor y metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Qué significa                                                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | ID del proveedor al que pertenece esta opción.                                                            |
| `method`              | Sí          | `string`                                                              | ID del método de autenticación al que despachar.                                                          |
| `choiceId`            | Sí          | `string`                                                              | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                        |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como alternativa.                  |
| `choiceHint`          | No          | `string`                                                              | Texto breve de ayuda para el selector.                                                                    |
| `assistantPriority`   | No          | `number`                                                              | Los valores más bajos se ordenan antes en selectores interactivos controlados por el asistente.           |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual en CLI.      |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | ID de opciones heredadas que deberían redirigir a los usuarios a esta opción de reemplazo.                |
| `groupId`             | No          | `string`                                                              | ID de grupo opcional para agrupar opciones relacionadas.                                                  |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario para ese grupo.                                                          |
| `groupHint`           | No          | `string`                                                              | Texto breve de ayuda para el grupo.                                                                       |
| `onboardingFeatured`  | No          | `boolean`                                                             | Muestra este grupo en el nivel destacado del selector interactivo de incorporación, antes de la entrada "Más...". |
| `optionKey`           | No          | `string`                                                              | Clave interna de opción para flujos de autenticación simples de una sola marca.                           |
| `cliFlag`             | No          | `string`                                                              | Nombre de marca de CLI, como `--openrouter-api-key`.                                                      |
| `cliOption`           | No          | `string`                                                              | Forma completa de opción de CLI, como `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | No          | `string`                                                              | Descripción usada en la ayuda de CLI.                                                                     |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superficies de incorporación en las que debería aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un plugin posee un nombre de comando de runtime que los usuarios podrían poner por error en `plugins.allow` o intentar ejecutar como comando CLI raíz. OpenClaw usa estos metadatos para diagnósticos sin importar código de runtime del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                         |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este plugin.                        |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No          | `string`          | Comando CLI raíz relacionado para sugerir en operaciones CLI, si existe alguno. |

## Referencia de activación

Usa `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control deberían incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra comportamiento de runtime, no reemplaza `register(...)` y no promete que el código del plugin ya se haya ejecutado. El planificador de activación usa estos campos para acotar los plugins candidatos antes de recurrir a metadatos de propiedad existentes del manifiesto, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y hooks.

Prefiere los metadatos más específicos que ya describan la propiedad. Usa `providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts` cuando esos campos expresen la relación. Usa `activation` para indicios adicionales del planificador que no puedan representarse mediante esos campos de propiedad. Usa `cliBackends` de nivel superior para alias de runtime de CLI como `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para ID de harnesses de agentes embebidos que aún no tengan un campo de propiedad.

Cada plugin debería definir `activation.onStartup` intencionalmente. Establécelo en `true` solo cuando el plugin deba ejecutarse durante el inicio de Gateway. Establécelo en `false` cuando el plugin esté inerte al inicio y deba cargarse solo a partir de disparadores más específicos. Omitir `onStartup` ya no carga implícitamente el plugin al inicio; usa metadatos de activación explícitos para disparadores de activación de inicio, canal, configuración, harness de agente, memoria u otros más específicos.

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
| `onStartup`        | No          | `boolean`                                            | Activación explícita al inicio de Gateway. Cada plugin debería definir esto. `true` importa el plugin durante el inicio; `false` lo mantiene diferido al inicio salvo que otro disparador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | ID de proveedores que deberían incluir este plugin en planes de activación/carga.                                                                                                           |
| `onAgentHarnesses` | No          | `string[]`                                           | ID de runtime de harnesses de agentes embebidos que deberían incluir este plugin en planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI.            |
| `onCommands`       | No          | `string[]`                                           | ID de comandos que deberían incluir este plugin en planes de activación/carga.                                                                                                              |
| `onChannels`       | No          | `string[]`                                           | ID de canales que deberían incluir este plugin en planes de activación/carga.                                                                                                               |
| `onRoutes`         | No          | `string[]`                                           | Tipos de ruta que deberían incluir este plugin en planes de activación/carga.                                                                                                               |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deberían incluir este plugin en planes de inicio/carga cuando la ruta esté presente y no esté explícitamente deshabilitada.                   |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicios amplios de capacidad usados por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible.                                           |

Consumidores activos actuales:

- La planificación de inicio de Gateway usa `activation.onStartup` para la importación explícita al inicio.
- La planificación de CLI activada por comandos recurre a `commandAliases[].cliCommand` o `commandAliases[].name` heredados.
- La planificación de inicio de runtime de agente usa `activation.onAgentHarnesses` para harnesses embebidos y `cliBackends[]` de nivel superior para alias de runtime de CLI.
- La planificación de configuración/canal activada por canal recurre a la propiedad heredada `channels[]` cuando faltan metadatos explícitos de activación de canal.
- La planificación de plugins al inicio usa `activation.onConfigPaths` para superficies de configuración raíz que no son canales, como el bloque `browser` del plugin de navegador incluido.
- La planificación de configuración/runtime activada por proveedor recurre a la propiedad heredada `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor.

Los diagnósticos del planificador pueden distinguir indicios de activación explícitos de la alternativa de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que `activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el planificador usó la propiedad `commandAliases` en su lugar. Estas etiquetas de motivo son para diagnósticos del host y pruebas; los autores de plugins deberían seguir declarando los metadatos que mejor describan la propiedad.

## Referencia de qaRunners

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el runtime del plugin sigue siendo dueño del registro CLI real mediante una superficie ligera `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

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

| Campo         | Obligatorio | Tipo     | Qué significa                                                        |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.         |
| `description` | No          | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando stub. |

## Referencia de configuración

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos económicos propiedad del plugin antes de que cargue el runtime.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia de CLI. `setup.cliBackends` es la superficie de descriptores específica de configuración para flujos de plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie de búsqueda preferida basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo acota el Plugin candidato y la configuración aún necesita hooks de runtime más completos en tiempo de configuración, establece `requiresRuntime: true` y conserva `setup-api` como ruta de ejecución de fallback.

OpenClaw también incluye `setup.providers[].envVars` en las búsquedas genéricas de autenticación de proveedor y variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad durante la ventana de desuso, pero los plugins no incluidos que aún lo usen reciben un diagnóstico de manifiesto. Los plugins nuevos deben colocar los metadatos de entorno de configuración/estado en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones de configuración simples desde `setup.providers[].authMethods` cuando no hay una entrada de configuración disponible, o cuando `setup.requiresRuntime: false` declara que el runtime de configuración no es necesario. Las entradas explícitas de `providerAuthChoices` siguen siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de onboarding y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la superficie de configuración. OpenClaw trata `false` explícito como un contrato solo de descriptor y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si un Plugin solo de descriptor aún distribuye una de esas entradas de runtime de configuración, OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento de fallback heredado para que los plugins existentes que agregaron descriptores sin el flag no se rompan.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del Plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los plugins descubiertos. La propiedad ambigua falla en modo cerrado en lugar de elegir un ganador según el orden de descubrimiento.

Cuando el runtime de configuración sí se ejecuta, los diagnósticos del registro de configuración informan divergencia de descriptores si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro de runtime coincidente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### Referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí          | `string`   | Id de proveedor expuesto durante la configuración u onboarding. Mantén los ids normalizados únicos globalmente. |
| `authMethods`  | No          | `string[]` | Ids de métodos de configuración/autenticación que admite este proveedor sin cargar el runtime completo. |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del Plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones locales baratas de evidencia de autenticación para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores locales de credenciales propiedad del proveedor que se pueden verificar sin cargar código de runtime. Estas comprobaciones deben seguir siendo baratas y locales: sin llamadas de red, sin lecturas del llavero o gestor de secretos, sin comandos de shell y sin sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita de archivo de credenciales.                                                           |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales comprobadas cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una variable de entorno listada debe no estar vacía antes de que la evidencia sea válida.                                    |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías antes de que la evidencia sea válida.                                           |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                       |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                                               |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y el onboarding.                                     |
| `cliBackends`      | No          | `string[]` | Ids de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los ids normalizados únicos globalmente. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este Plugin.                                          |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecución de `setup-api` después de la búsqueda por descriptor.                            |

## Referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas indicaciones de renderizado.

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

| Campo         | Tipo       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas opcionales de UI.                       |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de marcador de posición para entradas de formulario.       |

## Referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda leer sin importar el runtime del Plugin.

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
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista es opcional:

| Campo                            | Tipo       | Qué significa                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identificadores de fábricas de extensiones de app-server de Codex, actualmente `codex-app-server`.                                   |
| `agentToolResultMiddleware`      | `string[]` | Identificadores de tiempo de ejecución para los que este Plugin puede registrar middleware de resultados de herramientas.             |
| `trustedToolPolicies`            | `string[]` | Identificadores de políticas locales del Plugin confiables previas a herramientas que un Plugin instalado puede registrar. Los Plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Identificadores de proveedores cuyo hook de perfil de autenticación externa pertenece a este Plugin.                                  |
| `embeddingProviders`             | `string[]` | Identificadores de proveedores generales de embeddings que pertenecen a este Plugin para uso reutilizable de embeddings vectoriales, incluida la memoria. |
| `speechProviders`                | `string[]` | Identificadores de proveedores de voz que pertenecen a este Plugin.                                                                   |
| `realtimeTranscriptionProviders` | `string[]` | Identificadores de proveedores de transcripción en tiempo real que pertenecen a este Plugin.                                          |
| `realtimeVoiceProviders`         | `string[]` | Identificadores de proveedores de voz en tiempo real que pertenecen a este Plugin.                                                    |
| `memoryEmbeddingProviders`       | `string[]` | Identificadores obsoletos de proveedores de embeddings específicos de memoria que pertenecen a este Plugin.                           |
| `mediaUnderstandingProviders`    | `string[]` | Identificadores de proveedores de comprensión de medios que pertenecen a este Plugin.                                                  |
| `transcriptSourceProviders`      | `string[]` | Identificadores de proveedores de fuentes de transcripciones que pertenecen a este Plugin.                                            |
| `documentExtractors`             | `string[]` | Identificadores de proveedores de extractores de documentos (por ejemplo PDF) que pertenecen a este Plugin.                           |
| `imageGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de imágenes que pertenecen a este Plugin.                                                |
| `videoGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de video que pertenecen a este Plugin.                                                   |
| `musicGenerationProviders`       | `string[]` | Identificadores de proveedores de generación de música que pertenecen a este Plugin.                                                  |
| `webContentExtractors`           | `string[]` | Identificadores de proveedores de extracción de contenido de páginas web que pertenecen a este Plugin.                                |
| `webFetchProviders`              | `string[]` | Identificadores de proveedores de obtención web que pertenecen a este Plugin.                                                         |
| `webSearchProviders`             | `string[]` | Identificadores de proveedores de búsqueda web que pertenecen a este Plugin.                                                          |
| `migrationProviders`             | `string[]` | Identificadores de proveedores de importación que pertenecen a este Plugin para `openclaw migrate`.                                   |
| `gatewayMethodDispatch`          | `string[]` | Derecho reservado para rutas HTTP autenticadas de Plugins que despachan métodos de Gateway dentro del proceso.                        |
| `tools`                          | `string[]` | Nombres de herramientas de agente que pertenecen a este Plugin.                                                                       |

`contracts.embeddedExtensionFactories` se conserva para fábricas de extensiones incluidas solo para app-server de Codex. En su lugar, las transformaciones incluidas de resultados de herramientas deben declarar `contracts.agentToolResultMiddleware` y registrarse con `api.registerAgentToolResultMiddleware(...)`. Los Plugins instalados pueden usar el mismo punto de integración de middleware solo cuando está habilitado explícitamente y solo para los tiempos de ejecución que declaren en `contracts.agentToolResultMiddleware`.

Los Plugins instalados que necesiten el nivel de política previa a herramientas confiable para el host deben declarar cada identificador local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente. Los Plugins incluidos conservan la ruta de política confiable existente, pero los Plugins instalados con identificadores de política no declarados se rechazan antes del registro. Los identificadores de políticas están delimitados al Plugin que los registra, por lo que dos Plugins pueden declarar y registrar `workflow-budget`; un solo Plugin no puede registrar el mismo identificador local dos veces.

Los registros de tiempo de ejecución `api.registerTool(...)` deben coincidir con `contracts.tools`. El descubrimiento de herramientas usa esta lista para cargar solo los tiempos de ejecución de Plugins que pueden ser propietarios de las herramientas solicitadas.

Los Plugins de proveedor que implementen `resolveExternalAuthProfiles` deben declarar `contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` para cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Usa el contrato general para la generación reutilizable de vectores, incluidos los proveedores consumidos por la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es compatibilidad obsoleta específica de memoria y permanece solo mientras los proveedores existentes migran al punto de integración genérico de proveedores de embeddings.

`contracts.gatewayMethodDispatch` actualmente acepta `"authenticated-request"`. Es una puerta de higiene de API para rutas HTTP nativas de Plugins que despachan intencionalmente métodos del plano de control de Gateway dentro del proceso, no un sandbox contra Plugins nativos maliciosos. Úsalo solo para superficies incluidas/de operador revisadas estrictamente que ya requieren autenticación HTTP de Gateway.

## Referencia de configContracts

Usa `configContracts` para el comportamiento de configuración propiedad del manifiesto que los helpers genéricos del núcleo necesitan sin importar el tiempo de ejecución del Plugin: detección de flags peligrosos, destinos de migración SecretRef y acotación de rutas de configuración heredadas.

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

| Campo                         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                                          |
| ----------------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No          | `string[]` | Rutas de configuración relativas a la raíz que indican que podrían aplicarse las migraciones de compatibilidad en tiempo de configuración de este Plugin. Permite que las lecturas genéricas de configuración en tiempo de ejecución omitan todas las superficies de configuración de Plugins cuando la configuración nunca referencia el Plugin. |
| `compatibilityRuntimePaths`   | No          | `string[]` | Rutas de compatibilidad relativas a la raíz que este Plugin puede atender durante el tiempo de ejecución antes de que el código del Plugin se active por completo. Úsalo para superficies heredadas que deben acotar los conjuntos de candidatos incluidos sin importar cada tiempo de ejecución de Plugin compatible. |
| `dangerousFlags`              | No          | `object[]` | Literales de configuración que `openclaw doctor` debe marcar como inseguros o peligrosos cuando están habilitados. Ver abajo.                                                                                                           |
| `secretInputs`                | No          | `object`   | Rutas de configuración bajo `plugins.entries.<id>.config` que el registro de destinos de migración/auditoría SecretRef debe tratar como cadenas con forma de secreto. Ver abajo.                                                       |

Cada entrada de `dangerousFlags` admite:

| Campo    | Obligatorio | Tipo                                  | Qué significa                                                                                                       |
| -------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sí          | `string`                              | Ruta de configuración separada por puntos relativa a `plugins.entries.<id>.config`. Admite comodines `*` para segmentos de mapas/arreglos. |
| `equals` | Sí          | `string \| number \| boolean \| null` | Literal exacto que marca este valor de configuración como peligroso.                                                |

`secretInputs` admite:

| Campo                   | Obligatorio | Tipo       | Qué significa                                                                                                                                                                                                   |
| ----------------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No          | `boolean`  | Sobrescribe la habilitación predeterminada de Plugins incluidos al decidir si esta superficie SecretRef está activa. Usa esto cuando el Plugin está incluido pero la superficie debe permanecer inactiva hasta que se habilite explícitamente en la configuración. |
| `paths`                 | Sí          | `object[]` | Rutas de configuración con forma de secreto, cada una con `path` (separada por puntos, relativa a `plugins.entries.<id>.config`, admite comodines `*`) y `expected` opcional (actualmente solo `"string"`).       |

## Referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tiene modelos predeterminados, prioridad de respaldo de autenticación automática o soporte nativo de documentos que los helpers genéricos del núcleo necesitan antes de que se cargue el tiempo de ejecución. Las claves también deben declararse en `contracts.mediaUnderstandingProviders`.

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
| `defaultModels`        | `Record<string, string>`                                         | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Los números más bajos se ordenan antes para el fallback automático de proveedor basado en credenciales.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entradas de documento nativas admitidas por el proveedor.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sobrescrituras de modelo por tipo de documento. Establece `image: false` para desactivar la extracción basada en imágenes para ese tipo de documento. |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos de configuración baratos antes de que se cargue el runtime. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos directamente para canales externos configurados cuando no haya una entrada de configuración disponible, o cuando `setup.requiresRuntime: false` declare que el runtime de configuración no es necesario.

`channelConfigs` son metadatos del manifiesto del Plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué Plugin posee ese canal configurado antes de que se ejecute el código del runtime del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas distintas:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaren `channels[]` también deben declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw todavía puede cargar el Plugin, pero las superficies de esquema de configuración de ruta fría, configuración y Control UI no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el runtime del Plugin.

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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada.         |
| `uiHints`     | `Record<string, object>` | Etiquetas, marcadores de posición e indicaciones sensibles opcionales de UI para esa sección de configuración de canal.          |
| `label`       | `string`                 | Etiqueta de canal fusionada en las superficies de selector e inspección cuando los metadatos del runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al runtime.       |
| `preferOver`  | `string[]`               | Ids de Plugins heredados o de menor prioridad a los que este canal debe superar en las superficies de selección.    |

### Reemplazar otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido de un id de canal que otro Plugin también puede proporcionar. Casos habituales son un id de Plugin renombrado, un Plugin independiente que reemplaza a un Plugin incluido o un fork mantenido que conserva el mismo id de canal para compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el id del canal como el id del Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque está incluido o activado de forma predeterminada, OpenClaw lo desactiva en la configuración efectiva del runtime para que un Plugin posea el canal y sus herramientas. La selección explícita del usuario sigue ganando: si el usuario activa explícitamente ambos Plugins (mediante `plugins.allow` o una configuración material de `plugins.entries`), OpenClaw conserva esa elección e informa diagnósticos de canal/herramienta duplicados en lugar de cambiar silenciosamente el conjunto de Plugins solicitado.

Mantén `preferOver` limitado a ids de Plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el runtime del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las refs explícitas `provider/model` usan los metadatos del manifiesto `providers` del propietario
- `modelPatterns` prevalece sobre `modelPrefixes`
- si coinciden un Plugin no incluido y un Plugin incluido, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a ids de modelo abreviados.                 |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con ids de modelo abreviados tras eliminar el sufijo de perfil. |

Las entradas de `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza patrones que contienen repetición anidada (por ejemplo `(a+)+$`). Los patrones que no superan la comprobación de seguridad se omiten silenciosamente, igual que una regex sintácticamente inválida. Mantén los patrones simples y evita cuantificadores anidados.

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer metadatos de modelos del proveedor antes de cargar el runtime del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo fijas, alias de proveedor, reglas de supresión y modo de detección. La actualización en runtime sigue perteneciendo al código de runtime del proveedor, pero el manifiesto indica al núcleo cuándo se requiere runtime.

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
| `providers`      | `Record<string, object>`                                 | Filas de catálogo para ids de proveedor propiedad de este Plugin. Las claves también deben aparecer en `providers` de nivel superior.       |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedor que deben resolverse a un proveedor propio para planificación de catálogo o supresión.              |
| `suppressions`   | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por una razón específica del proveedor.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, actualizarse en caché o requiere runtime. |
| `runtimeAugment` | `boolean`                                                | Establece en `true` solo cuando el runtime del proveedor deba anexar filas de catálogo tras la planificación de manifiesto/configuración.       |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación de catálogo de modelos. Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar sobrescrituras de API/base URL del alias sin cargar el runtime del proveedor. Los alias no expanden listados de catálogo sin filtrar; las listas amplias emiten solo las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook de runtime de proveedor `suppressBuiltInModel`. Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión de runtime ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor.    |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.      |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin `id` se ignoran.            |

Campos del modelo:

| Campo              | Tipo                                                           | Qué significa                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Id. de modelo local del proveedor, sin el prefijo `provider/`.              |
| `name`             | `string`                                                       | Nombre para mostrar opcional.                                               |
| `api`              | `ModelApi`                                                     | Sustitución opcional de API por modelo.                                     |
| `baseUrl`          | `string`                                                       | Sustitución opcional de URL base por modelo.                                |
| `headers`          | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalidades que acepta el modelo. Otros valores se descartan silenciosamente. |
| `reasoning`        | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                         |
| `contextWindow`    | `number`                                                       | Ventana de contexto nativa del proveedor.                                   |
| `contextTokens`    | `number`                                                       | Límite efectivo opcional de contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Tokens de salida máximos cuando se conocen.                                 |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sustituciones opcionales de id. de modelo o parámetros por nivel de pensamiento. |
| `cost`             | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`           | `object`                                                       | Marcas de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw. |
| `mediaInput`       | `object`                                                       | Configuración opcional de entrada por modalidad, actualmente solo imágenes. |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprimir solo cuando la fila no debe aparecer en absoluto. |
| `statusReason`     | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                       |
| `replaces`         | `string[]`                                                     | Ids. de modelo locales del proveedor anteriores a los que este modelo reemplaza. |
| `replacedBy`       | `string`                                                       | Id. de modelo local del proveedor de reemplazo para filas obsoletas.        |
| `tags`             | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                         |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id. de proveedor de la fila ascendente que se va a suprimir. Debe ser propiedad de este plugin o declararse como un alias propio. |
| `model`                    | `string`   | Id. de modelo local del proveedor que se va a suprimir.                                                   |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                              |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de URL base del proveedor requeridos antes de que se aplique la supresión. |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración del proveedor requeridos antes de que se aplique la supresión. |

No pongas datos solo de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las filas del manifiesto estén lo bastante completas para que las superficies de lista filtrada por proveedor y de selector omitan el descubrimiento de registro/tiempo de ejecución. Usa `refreshable` cuando las filas del manifiesto sean semillas o suplementos listables útiles, pero una actualización/caché pueda agregar más filas más tarde; las filas actualizables no son autoritativas por sí mismas. Usa `runtime` cuando OpenClaw deba cargar el runtime del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza barata, propiedad del proveedor, de ids. de modelo que debe ocurrir antes de que cargue el runtime del proveedor. Esto mantiene alias como nombres cortos de modelos, ids. heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del plugin propietario en lugar de en las tablas centrales de selección de modelos.

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

Campos de proveedor:

| Campo                                | Tipo                    | Qué significa                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exactos de id. de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de la búsqueda de alias, útiles para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se añade cuando el id. de modelo normalizado aún no contiene `/`.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo de id. simple después de la búsqueda de alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política de solicitudes genérica debe conocer antes de que cargue el runtime del proveedor. Core sigue siendo propietario del significado de cada `endpointClass`; los manifiestos de plugins son propietarios de los metadatos de host y URL base.

Los plugins de proveedor externalizados oficialmente se excluyen de la distribución central, por lo que sus manifiestos son invisibles hasta que se instalan. Sus `providerEndpoints` también deben reflejarse en `scripts/lib/official-external-provider-catalog.json` para que la clasificación de endpoints siga funcionando sin el plugin; una prueba de contrato exige el reflejo.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint central conocida, como `openrouter`, `moonshot-native` o `google-vertex`.    |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                  |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Anteponer `.` para coincidencia solo con sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                    |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se quita de los hosts coincidentes para exponer el prefijo de región de Google Vertex. |

## Referencia de providerRequest

Usa `providerRequest` para metadatos baratos de compatibilidad de solicitudes que la política de solicitudes genérica necesita sin cargar el runtime del proveedor. Mantén la reescritura de cargas específica del comportamiento en hooks del runtime del proveedor o ayudantes compartidos de familia de proveedores.

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

Campos de proveedor:

| Campo                 | Tipo         | Qué significa                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etiqueta de familia de proveedor usada por decisiones y diagnósticos genéricos de compatibilidad de solicitudes. |
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de familia de proveedor para ayudantes de solicitudes compartidos. |
| `openAICompletions`   | `object`     | Marcas de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de secretProviderIntegrations

Usa `secretProviderIntegrations` cuando un plugin pueda publicar un preajuste reutilizable de proveedor exec SecretRef. OpenClaw lee estos metadatos antes de que cargue el runtime del plugin, almacena la propiedad del plugin en `secrets.providers.<alias>.pluginIntegration` y deja la resolución real de secretos al runtime de SecretRef. Los preajustes se exponen solo para plugins incluidos e instalados descubiertos desde las raíces gestionadas de instalación de plugins, como instalaciones de git y ClawHub.

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

La clave del mapa es el id. de integración. Si se omite `providerAlias`, OpenClaw usa el id. de integración como alias de proveedor SecretRef. Los alias de proveedor deben coincidir con el patrón normal de alias de proveedor SecretRef, por ejemplo `team-secrets` o `onepassword-work`.

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

Al iniciar/recargar, OpenClaw resuelve ese proveedor cargando los metadatos actuales del manifiesto del plugin, comprobando que el plugin propietario esté instalado y activo, y materializando el comando exec desde el manifiesto. Deshabilitar o eliminar el plugin revoca el proveedor para SecretRefs activos. Los operadores que quieran configuración exec independiente aún pueden escribir proveedores manuales `command`/`args` directamente.

Actualmente solo se admiten preajustes `source: "exec"`. `command` debe ser `${node}`, y `args[0]` debe ser un script resolutor relativo a la raíz del plugin con `./`. OpenClaw lo materializa al iniciar/recargar al ejecutable Node actual y a la ruta absoluta del script dentro del plugin. Las opciones de Node como `--require`, `--import`, `--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato de preajuste del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar proveedores exec manuales independientes directamente.

OpenClaw deriva `trustedDirs` para preajustes de manifiesto desde la raíz del Plugin y, para preajustes `${node}`, el directorio del ejecutable actual de Node. Los `trustedDirs` definidos en el manifiesto se ignoran. Otras opciones del proveedor exec, como `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath`, pasan a la configuración normal del proveedor exec de SecretRef.

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesita comportamiento de precios del plano de control antes de que se cargue el tiempo de ejecución. La caché de precios del Gateway lee estos metadatos sin importar código de tiempo de ejecución del proveedor.

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
| `external`   | `boolean`         | Define `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor.                 |

Campos de fuente:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id. del proveedor del catálogo externo cuando difiere del id. de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los ids. de modelo que contienen barras como refs. anidadas de proveedor/modelo, útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id. de modelo del catálogo externo. `version-dots` prueba ids. de versión con puntos como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw es metadato de vista previa propiedad de OpenClaw para proveedores cuyos Plugins quizá aún no estén instalados. No forma parte de un manifiesto de Plugin. Los manifiestos de Plugin siguen siendo la autoridad del Plugin instalado. El Índice de proveedores es el contrato interno de reserva que consumirán las futuras superficies de proveedor instalable y selector de modelos previo a la instalación cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración de usuario.
2. Manifiesto `modelCatalog` del Plugin instalado.
3. Caché de catálogo de modelos de actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de tiempo de ejecución ni datos de modelos en vivo específicos de la cuenta. Sus catálogos de vista previa usan la misma forma de fila de proveedor `modelCatalog` que los manifiestos de Plugin, pero deben limitarse a metadatos de visualización estables salvo que campos del adaptador de tiempo de ejecución como `api`, `baseUrl`, precios o banderas de compatibilidad se mantengan alineados intencionalmente con el manifiesto del Plugin instalado. Los proveedores con detección en vivo de `/models` deben escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos en lugar de hacer que el listado normal o el onboarding llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores cuyo Plugin se haya movido fuera del núcleo o que, por otro motivo, aún no esté instalado. Estos metadatos replican el patrón de catálogo de canales: nombre de paquete, especificación de instalación npm, integridad esperada y etiquetas ligeras de elección de autenticación bastan para mostrar una opción de configuración instalable. Una vez instalado el Plugin, su manifiesto gana y la entrada del Índice de proveedores se ignora para ese proveedor.

`openclaw doctor --fix` migra un conjunto pequeño y cerrado de claves de capacidad heredadas de nivel superior del manifiesto a `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` y `tools`. Ninguna de estas (ni ninguna otra lista de capacidades) se lee ya como campo de manifiesto de nivel superior; la carga normal del manifiesto solo las reconoce bajo `contracts`.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                   | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detección, validación de configuración, metadatos de elección de autenticación y pistas de UI que deben existir antes de que se ejecute el código del Plugin                         |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, bloqueo de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar código de Plugin, ponla en `openclaw.plugin.json`
- si trata de empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de package.json que afectan a la detección

Algunos metadatos de Plugin previos al tiempo de ejecución viven intencionalmente en `package.json` bajo el bloque `openclaw` en lugar de `openclaw.plugin.json`. `openclaw.bundle` y `openclaw.bundle.json` no son contratos de Plugin de OpenClaw; los Plugins nativos deben usar `openclaw.plugin.json` más los campos compatibles `package.json#openclaw` que aparecen abajo.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada de Plugin nativo. Debe permanecer dentro del directorio del paquete del Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de tiempo de ejecución JavaScript compilados para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo de configuración usado durante onboarding, inicio diferido de canal y detección de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del Plugin.                         |
| `openclaw.channel`                                                                         | Metadatos ligeros de catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comando nativo y valor predeterminado automático de habilidad nativa usados por superficies de configuración, auditoría y lista de comandos antes de que se cargue el tiempo de ejecución del canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros de comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por env?" sin cargar todo el tiempo de ejecución del canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros de comprobador de autenticación persistida que pueden responder "¿hay algo ya con sesión iniciada?" sin cargar todo el tiempo de ejecución del canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Pistas de instalación/actualización para Plugins incluidos y publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host de OpenClaw, usando un piso semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Rango mínimo de API de Plugin de OpenClaw requerido por este paquete, usando un piso semver como `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad dist de npm esperada, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta estrecha de recuperación por reinstalación de Plugin incluido cuando la configuración no es válida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando sus restricciones de plataforma del lockfile coinciden con el host actual.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies de canal de tiempo de ejecución de configuración se carguen antes de escuchar y luego difiere el Plugin de canal configurado completo hasta la activación posterior a la escucha.                                                 |

Los metadatos de manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en onboarding antes de que se cargue el tiempo de ejecución. `package.json#openclaw.install` indica a onboarding cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas opciones. No muevas pistas de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos para fuentes de Plugin no incluidas. Los valores no válidos se rechazan; los valores más nuevos pero válidos omiten Plugins externos en hosts antiguos. Se asume que los Plugins de fuente incluidos comparten versión con el checkout del host.

`openclaw.install.requiredPlatformPackages` es para paquetes npm que exponen binarios nativos requeridos mediante alias opcionales específicos de plataforma. Lista el nombre desnudo del paquete npm para cada alias de plataforma compatible. Durante la instalación npm, OpenClaw verifica solo el alias declarado cuyas restricciones de lockfile coinciden con el host actual. Si npm informa éxito pero omite ese alias, OpenClaw reintenta una vez con una caché nueva y revierte la instalación si el alias sigue faltando.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de plugins no integradas. Úsalo para el nivel mínimo de la API del SDK/runtime de plugins de OpenClaw contra el que se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un paquete de plugin necesita una API más nueva, pero aun así conserva una indicación de instalación más baja para otros flujos. La sincronización de versiones oficiales de OpenClaw incrementa de forma predeterminada los niveles mínimos existentes de la API de plugins oficiales a la versión de lanzamiento de OpenClaw, pero las versiones solo de plugins pueden mantener un nivel mínimo más bajo cuando el paquete admite intencionalmente hosts más antiguos. No uses solo la versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw` sigue siendo metadatos del paquete npm; OpenClaw usa el contrato `openclaw.compat.pluginApi` para las decisiones de compatibilidad de instalación.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el plugin se publica en ClawHub; la incorporación lo trata como la fuente remota preferida y registra los datos del artefacto de ClawHub después de la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad para paquetes que aún no se han movido a ClawHub.

La fijación exacta de versiones npm ya vive en `npmSpec`, por ejemplo `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen de forma cerrada si el artefacto npm obtenido ya no coincide con la versión fijada. La incorporación interactiva sigue ofreciendo especificaciones npm de registros de confianza, incluidos nombres de paquete sin versión y dist-tags, por compatibilidad. Los diagnósticos de catálogo pueden distinguir fuentes exactas, flotantes, fijadas por integridad, con integridad faltante, con discrepancia de nombre de paquete y de elección predeterminada no válida. También advierten cuando `expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar. Cuando `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican; cuando se omite, la resolución del registro se registra sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales o los escaneos de SecretRef necesitan identificar cuentas configuradas sin cargar el runtime completo. La entrada de configuración debe exponer metadatos del canal más adaptadores seguros para configuración de setup, estado y secretos; mantén los clientes de red, los listeners de Gateway y los runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no omiten las comprobaciones de límite de paquete para los campos de punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable una ruta de `openclaw.extensions` que escape.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación se recuperen de fallos específicos de actualización de plugins integrados obsoletos, como una ruta faltante de plugin integrado o una entrada `channels.<id>` obsoleta para ese mismo plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un módulo comprobador pequeño:

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

Úsalo cuando los flujos de setup, doctor, estado o presencia de solo lectura necesiten una comprobación barata de sí/no sobre autenticación antes de que se cargue el plugin de canal completo. El estado de autenticación persistido no es estado de canal configurado: no uses estos metadatos para activar plugins automáticamente, reparar dependencias de runtime ni decidir si un runtime de canal debe cargarse. La exportación de destino debe ser una función pequeña que solo lea estado persistido; no la enrutes a través del barrel completo del runtime de canal.

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

Úsalo cuando un canal pueda responder el estado configurado desde env u otras entradas pequeñas que no sean de runtime. Si la comprobación necesita resolución completa de configuración o el runtime de canal real, mantén esa lógica en el hook `config.hasConfiguredState` del plugin.

## Precedencia de descubrimiento (ids de plugin duplicados)

OpenClaw descubre plugins desde tres raíces, comprobadas en este orden: plugins integrados enviados con OpenClaw, la raíz de instalación global (`~/.openclaw/extensions`) y la raíz del espacio de trabajo actual (`<workspace>/.openclaw/extensions`), más cualquier entrada explícita de `plugins.load.paths`.

Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él. Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Instalación global que coincide con un registro de instalación rastreado** — un plugin instalado mediante `openclaw plugin install`/`openclaw plugin update` que el rastreo de instalaciones de OpenClaw reconoce para ese mismo id, incluso cuando el id también pertenece a un plugin integrado
3. **Integrado** — plugins enviados con OpenClaw
4. **Espacio de trabajo** — plugins descubiertos en relación con el espacio de trabajo actual
5. Cualquier otro candidato descubierto

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin integrado ubicada sin rastreo en el espacio de trabajo o en la raíz global no ocultará la compilación integrada.
- Para sobrescribir un plugin integrado, ejecuta `openclaw plugin install` para ese id para que la instalación global rastreada supere a la copia integrada, o fija una ruta específica mediante `plugins.entries.<id>` para que gane por precedencia seleccionada por configuración.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las sobrescrituras duplicadas seleccionadas por configuración se redactan como sobrescrituras explícitas en los diagnósticos, pero aun así advierten para que las bifurcaciones obsoletas y los ocultamientos accidentales sigan siendo visibles.

## Requisitos de JSON Schema

- **Todo plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer/escribir la configuración, no en runtime.
- Al extender o bifurcar un plugin integrado con nuevas claves de configuración, actualiza el `configSchema` de `openclaw.plugin.json` de ese plugin al mismo tiempo. Los esquemas de plugins integrados son estrictos, por lo que agregar `plugins.entries.<id>.config.myNewKey` en la configuración del usuario sin agregar `myNewKey` a `configSchema.properties` será rechazado antes de que se cargue el runtime del plugin.

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

- Las claves `channels.*` desconocidas son **errores**, a menos que el id de canal esté declarado por un manifiesto de plugin. Si el mismo id también aparece en `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin que está referenciado pero no es descubrible actualmente), OpenClaw lo rebaja a una **advertencia** en su lugar.
- `plugins.entries.<id>`, `plugins.allow` y `plugins.deny` que hacen referencia a ids de plugins desconocidos son **advertencias** ("entrada de configuración obsoleta ignorada"), no errores, para que las actualizaciones y los plugins eliminados/renombrados no bloqueen el inicio del gateway.
- `plugins.slots.memory` que hace referencia a un id de plugin desconocido es un **error**, salvo para el plugin externo oficial conocido `memory-lancedb`, que advierte en su lugar.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante, la validación falla y Doctor informa el error del plugin.
- Si existe configuración de plugin pero el plugin está **desactivado**, la configuración se conserva y se muestra una **advertencia** en Doctor + logs.

Consulta la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime sigue cargando el módulo del plugin por separado; el manifiesto solo sirve para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse todos cuando un plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debe importar código amplio de runtime; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento estrechos, no para ejecución en tiempo de solicitud.
- Los tipos de plugin exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (predeterminado `memory-core`), `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Declara el tipo de plugin exclusivo en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de runtime está obsoleto y permanece solo como alternativa de compatibilidad para plugins más antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto y `channelEnvVars`) son solo declarativos. Estado, auditoría, validación de entrega cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieren código de proveedor, consulta [hooks de runtime de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista permitida del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Crear plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con plugins.
  </Card>
  <Card title="Arquitectura de plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Resumen del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de plugins e importaciones de subrutas.
  </Card>
</CardGroup>
