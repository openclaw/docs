---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto del Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-06-27T12:14:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquete compatibles, consulta [paquetes de Plugins](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de
  componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee metadatos del paquete más las
raíces de Skills declaradas, raíces de comandos de Claude, valores predeterminados de
`settings.json` del paquete de Claude, valores predeterminados de LSP del paquete de Claude
y paquetes de hooks compatibles cuando el diseño coincide con las expectativas del
entorno de ejecución de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos ausentes o no válidos se tratan como
errores de Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` es el metadato que OpenClaw lee **antes de cargar el código de tu
Plugin**. Todo lo siguiente debe ser lo bastante barato de inspeccionar sin iniciar el
entorno de ejecución del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración y sugerencias de interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, activación automática, variables de entorno de proveedor, opciones de autenticación)
- sugerencias de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos de canal fusionados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento en tiempo de ejecución, declarar puntos de entrada de código
ni metadatos de instalación de npm. Eso pertenece al código de tu Plugin y a `package.json`.

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

| Campo                                | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                                                  |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                         | Id canónico del plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                                         |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este plugin.                                                                                                                                                                                     |
| `requiresPlugins`                    | No          | `string[]`                       | Ids de plugins que también deben estar instalados para que este plugin tenga efecto. El descubrimiento mantiene el plugin cargable, pero advierte cuando falta algún plugin requerido.                                                         |
| `enabledByDefault`                   | No          | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor que no sea `true`, para dejar el plugin deshabilitado de forma predeterminada.                                                          |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                       | Marca un plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js enumeradas, por ejemplo `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                                    |
| `legacyPluginIds`                    | No          | `string[]`                       | Ids heredados que se normalizan a este id canónico de plugin.                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | Ids de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las refs de modelos los mencionen.                                                                                              |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara una clase exclusiva de plugin usada por `plugins.slots.*`.                                                                                                                                                                             |
| `channels`                           | No          | `string[]`                       | Ids de canales propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                                                             |
| `providers`                          | No          | `string[]`                       | Ids de proveedores propiedad de este plugin.                                                                                                                                                                                                   |
| `providerCatalogEntry`               | No          | `string`                         | Ruta ligera del módulo del catálogo de proveedores, relativa a la raíz del plugin, para metadatos del catálogo de proveedores con alcance de manifiesto que pueden cargarse sin activar todo el runtime del plugin.                            |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto, usados para cargar automáticamente el plugin antes del runtime.                                                                                                          |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este plugin. Este es el contrato del plano de control para futuros listados de solo lectura, onboarding, selectores de modelos, alias y supresión sin cargar el runtime del plugin. |
| `modelPricing`                       | No          | `object`                         | Política de consulta de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o mapear refs de proveedores a ids de catálogos OpenRouter/LiteLLM sin codificar ids de proveedores en core. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de id de modelo propiedad del proveedor que debe ejecutarse antes de que se cargue el runtime del proveedor.                                                                                                        |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedores que core debe clasificar antes de que se cargue el runtime del proveedor.                                                                            |
| `providerRequest`                    | No          | `object`                         | Metadatos baratos de familia de proveedores y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que se cargue el runtime del proveedor.                                                                    |
| `secretProviderIntegrations`         | No          | `Record<string, object>`         | Preajustes declarativos de proveedores exec de SecretRef que las superficies de configuración o instalación pueden ofrecer sin codificar integraciones específicas de proveedores en core.                                                     |
| `cliBackends`                        | No          | `string[]`                       | Ids de backends de inferencia CLI propiedad de este plugin. Se usan para la autoactivación al inicio desde refs de configuración explícitas.                                                                                                   |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Refs de proveedor o backend CLI cuyo hook de autenticación sintética propiedad del plugin debe sondearse durante el descubrimiento frío de modelos antes de que se cargue el runtime.                                                          |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API marcadores de posición propiedad del plugin incluido que representan estado de credenciales locales no secretas, OAuth o ambientales.                                                                                  |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el runtime.                                                                                  |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para la consulta de autenticación/estado del proveedor. Prefiere `setup.providers[].envVars` para plugins nuevos; OpenClaw aún lee esto durante la ventana de obsolescencia.                  |
| `providerAuthAliases`                | No          | `Record<string, string>`         | Ids de proveedores que deben reutilizar otro id de proveedor para la consulta de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.                      |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos baratos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalos para configuración de canales impulsada por entorno o superficies de autenticación que los helpers genéricos de inicio/configuración deben ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos baratos de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado simple de flags CLI.                                                                                                |
| `activation`                         | No          | `object`                         | Metadatos baratos del planificador de activación para carga provocada por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo dueño del comportamiento real.                               |
| `setup`                              | No          | `object`                         | Descriptores baratos de configuración/onboarding que el descubrimiento y las superficies de configuración pueden inspeccionar sin cargar el runtime del plugin.                                                                                |
| `qaRunners`                          | No          | `object[]`                       | Descriptores baratos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del plugin.                                                                                                            |
| `contracts`                          | No          | `object`                         | Instantánea estática de propiedad de capacidades para hooks de autenticación externos, embeddings, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados baratos de comprensión de medios para ids de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                                        |
| `imageGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos baratos de autenticación de generación de imágenes para ids de proveedores declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.                       |
| `videoGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos baratos de autenticación de generación de video para ids de proveedores declarados en `contracts.videoGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.                          |
| `musicGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos baratos de autenticación de generación de música para ids de proveedores declarados en `contracts.musicGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.                         |
| `toolMetadata`                       | No       | `Record<string, object>`         | Metadatos ligeros de disponibilidad para herramientas propiedad del Plugin declaradas en `contracts.tools`. Úsalos cuando una herramienta no deba cargar el runtime salvo que existan pruebas de config, env o auth.                                                                       |
| `channelConfigs`                     | No       | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto, fusionados en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                                                                                                                      |
| `skills`                             | No       | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del Plugin.                                                                                                                                                                                         |
| `name`                               | No       | `string`                         | Nombre del Plugin legible para humanos.                                                                                                                                                                                                                     |
| `description`                        | No       | `string`                         | Resumen breve mostrado en las superficies del Plugin.                                                                                                                                                                                                         |
| `icon`                               | No       | `string`                         | URL de imagen HTTPS para tarjetas de marketplace/catálogo. ClawHub acepta cualquier URL `https://` válida y recurre al icono predeterminado del Plugin cuando se omite o no es válida.                                                                              |
| `version`                            | No       | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                                   |
| `uiHints`                            | No       | `Record<string, object>`         | Etiquetas de UI, marcadores de posición e indicaciones de sensibilidad para campos de configuración.                                                                                                                                                                               |

## Referencia de metadatos del proveedor de generación

Los campos de metadatos del proveedor de generación describen señales de autenticación estáticas para
proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente.
OpenClaw lee estos campos antes de que se cargue el entorno de ejecución del proveedor para que las herramientas principales puedan
decidir si un proveedor de generación está disponible sin importar todos los
Plugin de proveedor.

Usa estos campos solo para hechos baratos y declarativos. El transporte, las transformaciones de solicitudes,
la actualización de tokens, la validación de credenciales y el comportamiento real de generación
permanecen en el entorno de ejecución del Plugin.

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
| `aliases`              | No          | `string[]` | Ids de proveedor adicionales que deben contar como alias de autenticación estáticos para el proveedor de generación.                                 |
| `authProviders`        | No          | `string[]` | Ids de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                     |
| `configSignals`        | No          | `object[]` | Señales baratas de disponibilidad solo de configuración para proveedores locales o autoalojados que se pueden configurar sin perfiles de autenticación ni variables de entorno. |
| `authSignals`          | No          | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id del proveedor, `aliases` y `authProviders`. |
| `referenceAudioInputs` | No          | `boolean`  | Solo generación de video. Establécelo en `true` cuando el proveedor acepte recursos de audio de referencia; de lo contrario, `video_generate` oculta los parámetros de referencia de audio. |

Cada entrada de `configSignals` admite:

| Campo            | Obligatorio | Tipo       | Qué significa                                                                                                                                                                             |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sí          | `string`   | Ruta con puntos al objeto de configuración propiedad del Plugin que se debe inspeccionar, por ejemplo `plugins.entries.example.config`.                                                    |
| `overlayPath`    | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Usa esto para configuración específica de capacidades como `image`, `video` o `music`. |
| `overlayMapPath` | No          | `string`   | Ruta con puntos dentro de la configuración raíz cuyos valores de objeto deben superponerse cada uno al objeto raíz. Usa esto para mapas de cuentas con nombre como `accounts`, donde cualquier cuenta configurada debe calificar. |
| `required`       | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos no deben estar vacíos.                |
| `requiredAny`    | No          | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                   |
| `mode`           | No          | `object`   | Guardia de modo de cadena opcional dentro de la configuración efectiva. Usa esto cuando la disponibilidad solo de configuración se aplica únicamente a un modo.                           |

Cada guardia de `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`. |
| `default`    | No          | `string`   | Valor de modo que se usará cuando la configuración omita la ruta.                  |
| `allowed`    | No          | `string[]` | Si está presente, la señal pasa solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.  |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Id de proveedor que se comprobará en los perfiles de autenticación configurados.                                                                                               |
| `providerBaseUrl` | No          | `object` | Guardia opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Usa esto cuando un alias de autenticación solo es válido para ciertas API. |

Cada guardia de `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Id de configuración de proveedor cuyo `baseUrl` se debe comprobar.                                                                                   |
| `defaultBaseUrl`  | No          | `string`   | URL base que se asumirá cuando la configuración del proveedor omita `baseUrl`.                                                                       |
| `allowedBaseUrls` | Sí          | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que los
metadatos del proveedor de generación, con clave por nombre de herramienta. `contracts.tools` declara
la propiedad. `toolMetadata` declara evidencia barata de disponibilidad para que OpenClaw pueda
evitar importar el entorno de ejecución de un Plugin solo para que su fábrica de herramientas devuelva `null`.

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

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y
carga el Plugin propietario cuando el contrato de herramienta coincide con la política. Para herramientas
de ruta crítica cuya fábrica depende de autenticación/configuración, los autores de Plugin deben declarar
`toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para preguntar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el entorno de ejecución del proveedor.
Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración
derivadas de descriptores y metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                                                  | Qué significa                                                                                            |
| --------------------- | ----------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                                              | Id. del proveedor al que pertenece esta elección.                                                        |
| `method`              | Sí          | `string`                                                              | Id. del método de autenticación al que despachar.                                                        |
| `choiceId`            | Sí          | `string`                                                              | Id. estable de elección de autenticación usado por los flujos de incorporación y CLI.                    |
| `choiceLabel`         | No          | `string`                                                              | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                            |
| `choiceHint`          | No          | `string`                                                              | Texto de ayuda breve para el selector.                                                                   |
| `assistantPriority`   | No          | `number`                                                              | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.      |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                                        | Oculta la elección en los selectores del asistente, pero sigue permitiendo la selección manual por CLI.  |
| `deprecatedChoiceIds` | No          | `string[]`                                                            | Ids. de elección heredados que deben redirigir a los usuarios a esta elección de reemplazo.              |
| `groupId`             | No          | `string`                                                              | Id. de grupo opcional para agrupar elecciones relacionadas.                                              |
| `groupLabel`          | No          | `string`                                                              | Etiqueta visible para el usuario de ese grupo.                                                           |
| `groupHint`           | No          | `string`                                                              | Texto de ayuda breve para el grupo.                                                                      |
| `optionKey`           | No          | `string`                                                              | Clave de opción interna para flujos de autenticación simples de una sola marca.                          |
| `cliFlag`             | No          | `string`                                                              | Nombre de marca de CLI, como `--openrouter-api-key`.                                                     |
| `cliOption`           | No          | `string`                                                              | Forma completa de opción de CLI, como `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | No          | `string`                                                              | Descripción usada en la ayuda de CLI.                                                                    |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation" \| "music-generation">` | En qué superficies de incorporación debe aparecer esta elección. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un plugin posee un nombre de comando de tiempo de ejecución que los usuarios podrían
poner por error en `plugins.allow` o intentar ejecutar como comando raíz de CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar código de tiempo de ejecución del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                          |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este plugin.                         |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como comando de barra de chat en lugar de comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que sugerir para operaciones de CLI, si existe. |

## Referencia de activation

Usa `activation` cuando el plugin puede declarar con bajo costo qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento de tiempo de ejecución, no reemplaza `register(...)` y no promete que
el código del plugin ya se haya ejecutado. El planificador de activación usa estos campos para
acotar plugins candidatos antes de recurrir a los metadatos de propiedad existentes del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más específicos que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts`
cuando esos campos expresen la relación. Usa `activation` para sugerencias adicionales del planificador
que no puedan representarse mediante esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de tiempo de ejecución de CLI como `claude-cli`,
`my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
ids. de arnés de agente embebidos que aún no tienen un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento de tiempo de ejecución y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/plugin.
Los consumidores actuales lo usan como sugerencia de acotación antes de una carga de plugins más amplia, por lo que
la falta de metadatos de activación que no sean de arranque normalmente solo cuesta rendimiento; no
debería cambiar la corrección mientras sigan existiendo los respaldos de propiedad del manifiesto.

Cada plugin debe definir `activation.onStartup` de forma intencional. Establécelo en `true`
solo cuando el plugin deba ejecutarse durante el arranque del Gateway. Establécelo en `false` cuando
el plugin esté inerte al arrancar y deba cargarse solo por activadores más específicos.
Omitir `onStartup` ya no carga el plugin implícitamente al arrancar; usa metadatos de
activación explícitos para arranque, canal, configuración, arnés de agente, memoria u
otros activadores de activación más específicos.

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
| `onStartup`        | No          | `boolean`                                            | Activación explícita al arrancar el Gateway. Cada plugin debe definir esto. `true` importa el plugin durante el arranque; `false` lo mantiene con carga diferida al arranque salvo que otro activador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Ids. de proveedores que deben incluir este plugin en los planes de activación/carga.                                                                                                        |
| `onAgentHarnesses` | No          | `string[]`                                           | Ids. de tiempo de ejecución de arneses de agente embebidos que deben incluir este plugin en los planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI. |
| `onCommands`       | No          | `string[]`                                           | Ids. de comandos que deben incluir este plugin en los planes de activación/carga.                                                                                                           |
| `onChannels`       | No          | `string[]`                                           | Ids. de canales que deben incluir este plugin en los planes de activación/carga.                                                                                                            |
| `onRoutes`         | No          | `string[]`                                           | Tipos de ruta que deben incluir este plugin en los planes de activación/carga.                                                                                                              |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este plugin en los planes de arranque/carga cuando la ruta está presente y no está deshabilitada explícitamente.                |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Sugerencias amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible.                                        |

Consumidores activos actuales:

- La planificación de arranque del Gateway usa `activation.onStartup` para la importación
  explícita al arrancar
- La planificación de CLI activada por comandos recurre al comportamiento heredado de
  `commandAliases[].cliCommand` o `commandAliases[].name`
- La planificación de arranque de tiempo de ejecución del agente usa `activation.onAgentHarnesses` para
  arneses embebidos y `cliBackends[]` de nivel superior para alias de tiempo de ejecución de CLI
- La planificación de configuración/canal activada por canal recurre a la propiedad heredada de `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- La planificación de plugins de arranque usa `activation.onConfigPaths` para superficies de configuración
  raíz que no son de canal, como el bloque `browser` del plugin de navegador incluido
- La planificación de configuración/tiempo de ejecución activada por proveedor recurre a la propiedad heredada de
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor

Los diagnósticos del planificador pueden distinguir sugerencias de activación explícitas del respaldo de
propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó la propiedad de `commandAliases` en su lugar. Estas etiquetas de motivo son para
diagnósticos del host y pruebas; los autores de plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de qaRunners

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos baratos y estáticos; el tiempo de ejecución
del plugin sigue siendo dueño del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

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

| Campo         | Obligatorio | Tipo     | Qué significa                                                       |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.        |
| `description` | No          | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando stub. |

## referencia de setup

Usa `setup` cuando las superficies de configuración inicial y onboarding necesiten metadatos baratos propiedad del plugin
antes de que se cargue el runtime.

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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de CLI. `setup.cliBackends` es la superficie descriptora específica de setup para flujos de plano de control/setup que deben mantenerse solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie de búsqueda preferida, basada primero en descriptores, para el descubrimiento de setup. Si el descriptor solo reduce el plugin candidato y setup aún necesita hooks de runtime más completos en tiempo de setup, establece `requiresRuntime: true` y conserva `setup-api` como ruta de ejecución alternativa.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad durante la ventana de desuso, pero los plugins no agrupados que todavía lo usan reciben un diagnóstico de manifiesto. Los plugins nuevos deben colocar los metadatos de entorno de setup/estado en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de setup a partir de `setup.providers[].authMethods` cuando no hay ninguna entrada de setup disponible, o cuando `setup.requiresRuntime: false` declara que el runtime de setup no es necesario. Las entradas explícitas de `providerAuthChoices` siguen siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de onboarding y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la superficie de setup. OpenClaw trata el valor explícito `false` como un contrato solo de descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de setup. Si un plugin solo de descriptores aún distribuye una de esas entradas de runtime de setup, OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir `requiresRuntime` conserva el comportamiento alternativo legacy para que los plugins existentes que agregaron descriptores sin el flag no se rompan.

Como la búsqueda de setup puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben permanecer únicos entre los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

Cuando el runtime de setup sí se ejecuta, los diagnósticos del registro de setup informan desviación de descriptores si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene ningún registro de runtime correspondiente. Estos diagnósticos son aditivos y no rechazan plugins legacy.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                         |
| -------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `id`           | Sí          | `string`   | Id. de proveedor expuesto durante setup u onboarding. Mantén los ids normalizados únicos globalmente. |
| `authMethods`  | No          | `string[]` | Ids de métodos de setup/autenticación que este proveedor admite sin cargar el runtime completo.        |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de setup/estado pueden comprobar antes de cargar el runtime del plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones locales baratas de evidencia de autenticación para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que se pueden verificar sin cargar código de runtime. Estas comprobaciones deben seguir siendo baratas y locales:
sin llamadas de red, sin lecturas del llavero o de gestores de secretos, sin comandos de shell y sin sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                   |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                              |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita de archivo de credenciales.                                  |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales comprobadas cuando `fileEnvVar` está ausente o vacía. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una variable de entorno listada debe no estar vacía antes de que la evidencia sea válida.               |
| `requiresAllEnv`   | No          | `string[]` | Cada variable de entorno listada debe no estar vacía antes de que la evidencia sea válida.                       |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                  |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                 |

### campos de setup

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                           |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de setup de proveedores expuestos durante setup y onboarding.                              |
| `cliBackends`      | No          | `string[]` | Ids de backend en tiempo de setup usados para la búsqueda de setup basada primero en descriptores. Mantén los ids normalizados únicos globalmente. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de setup de este plugin.                   |
| `requiresRuntime`  | No          | `boolean`  | Si setup todavía necesita ejecución de `setup-api` después de la búsqueda de descriptores.              |

## referencia de uiHints

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

| Campo         | Tipo       | Qué significa                                |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario.   |
| `help`        | `string`   | Texto breve de ayuda.                        |
| `tags`        | `string[]` | Etiquetas de IU opcionales.                  |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.      |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulario. |

## referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
leer sin importar el runtime del plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de factory de extensión del servidor de aplicaciones de Codex, actualmente `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime para los que este plugin puede registrar middleware de resultados de herramientas.                                                                     |
| `trustedToolPolicies`            | `string[]` | Ids de políticas locales del plugin, confiables y previas a herramientas, que un plugin instalado puede registrar. Los plugins incluidos pueden registrar políticas sin este campo. |
| `externalAuthProviders`          | `string[]` | Ids de proveedor cuyo hook de perfil de autenticación externa pertenece a este plugin.                                                                      |
| `embeddingProviders`             | `string[]` | Ids de proveedores generales de embeddings que pertenecen a este plugin para uso reutilizable de embeddings vectoriales, incluida la memoria.                                 |
| `speechProviders`                | `string[]` | Ids de proveedores de voz que pertenecen a este plugin.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real que pertenecen a este plugin.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real que pertenecen a este plugin.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedores de embeddings específicos de memoria, obsoletos, que pertenecen a este plugin.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de comprensión multimedia que pertenecen a este plugin.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Ids de proveedores de fuente de transcripción que pertenecen a este plugin.                                                                                     |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes que pertenecen a este plugin.                                                                                      |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video que pertenecen a este plugin.                                                                                      |
| `webFetchProviders`              | `string[]` | Ids de proveedores de obtención web que pertenecen a este plugin.                                                                                             |
| `webSearchProviders`             | `string[]` | Ids de proveedores de búsqueda web que pertenecen a este plugin.                                                                                            |
| `migrationProviders`             | `string[]` | Ids de proveedores de importación que pertenecen a este plugin para `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Derecho reservado para rutas HTTP autenticadas de plugins que despachan métodos de Gateway dentro del proceso.                                  |
| `tools`                          | `string[]` | Nombres de herramientas de agente que pertenecen a este plugin.                                                                                                   |

`contracts.embeddedExtensionFactories` se conserva para factories de extensión
incluidas y exclusivas del servidor de aplicaciones de Codex. Las transformaciones
incluidas de resultados de herramientas deben declarar
`contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los plugins instalados pueden usar
la misma unión de middleware solo cuando está habilitada explícitamente y solo para los runtimes que
declaran en `contracts.agentToolResultMiddleware`.

Los plugins instalados que necesiten el nivel de política previa a herramientas confiable para el host deben declarar
cada id local registrado en `contracts.trustedToolPolicies` y estar habilitados explícitamente.
Los plugins incluidos mantienen la ruta de política confiable existente, pero los plugins
instalados con ids de política no declarados se rechazan antes del registro. Los ids de política
tienen alcance al plugin que los registra, por lo que dos plugins pueden declarar y
registrar `workflow-budget`; un solo plugin no puede registrar el mismo id local
dos veces.

Los registros de runtime `api.registerTool(...)` deben coincidir con `contracts.tools`.
La detección de herramientas usa esta lista para cargar solo los runtimes de plugin que pueden poseer las
herramientas solicitadas.

Los plugins de proveedor que implementen `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`; los hooks de autenticación externa no declarados se ignoran.

Los proveedores generales de embeddings deben declarar `contracts.embeddingProviders` para
cada adaptador registrado con `api.registerEmbeddingProvider(...)`. Usa el
contrato general para la generación reutilizable de vectores, incluidos los proveedores consumidos por
la búsqueda en memoria. `contracts.memoryEmbeddingProviders` es compatibilidad
específica de memoria obsoleta y permanece solo mientras los proveedores existentes migran
a la unión genérica de proveedores de embeddings.

`contracts.gatewayMethodDispatch` acepta actualmente
`"authenticated-request"`. Es una barrera de higiene de API para rutas HTTP
nativas de plugins que despachan intencionalmente métodos del plano de control de Gateway dentro del proceso, no
un sandbox contra plugins nativos maliciosos. Úsalo solo para superficies
incluidas/de operador revisadas con rigor que ya requieren autenticación HTTP de Gateway.

## Referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tiene
modelos predeterminados, prioridad de fallback de autenticación automática o compatibilidad nativa con documentos que
los helpers genéricos de core necesitan antes de que se cargue el runtime. Las claves también deben declararse en
`contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Cada entrada de proveedor puede incluir:

| Campo                  | Tipo                                | Qué significa                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades multimedia expuestas por este proveedor.                                 |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo.      |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para el fallback automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documentos nativos admitidas por el proveedor.                            |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un plugin de canal necesita metadatos de configuración económicos antes de que
se cargue el runtime. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no hay una entrada de configuración disponible, o
cuando `setup.requiresRuntime: false` declara que el runtime de configuración no es necesario.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección de configuración
de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`.
OpenClaw lee metadatos del manifiesto para decidir qué plugin posee ese canal
configurado antes de que se ejecute el código de runtime del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaran `channels[]` también deben declarar entradas
`channelConfigs` coincidentes. Sin ellas, OpenClaw todavía puede cargar el plugin, pero
el esquema de configuración de ruta fría, la configuración y las superficies de Control UI no pueden conocer la
forma de opciones propiedad del canal hasta que se ejecute el runtime del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y
`nativeSkillsAutoEnabled` pueden declarar valores predeterminados `auto` estáticos para comprobaciones de configuración
de comandos que se ejecutan antes de que se cargue el runtime del canal. Los canales incluidos también pueden publicar
los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con
sus otros metadatos de catálogo de canales propiedad del paquete.

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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal.         |
| `uiHints`     | `Record<string, object>` | Etiquetas, placeholders e indicaciones sensibles opcionales de UI para esa sección de configuración de canal.          |
| `label`       | `string`                 | Etiqueta del canal combinada en las superficies de selector e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comando nativo y Skill nativa para comprobaciones de configuración previas al runtime.       |
| `preferOver`  | `string[]`               | Ids de plugins heredados o de menor prioridad que este canal debe superar en superficies de selección.    |

### Reemplazar otro plugin de canal

Usa `preferOver` cuando tu plugin sea el propietario preferido para un id de canal que
otro plugin también puede proporcionar. Los casos comunes son un id de plugin renombrado, un
plugin independiente que reemplaza a un plugin incluido, o un fork mantenido que
conserva el mismo id de canal por compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el id de canal como
el id de plugin preferido. Si el plugin de menor prioridad solo se seleccionó porque
está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración de
runtime efectiva para que un plugin posea el canal y sus herramientas. La selección explícita del usuario
sigue prevaleciendo: si el usuario habilita explícitamente ambos plugins, OpenClaw
preserva esa elección e informa diagnósticos de canales/herramientas duplicados en lugar de
cambiar silenciosamente el conjunto de plugins solicitado.

Mantén `preferOver` limitado a ids de plugins que realmente puedan proporcionar el mismo canal.
No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se
cargue el tiempo de ejecución del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las refs explícitas `provider/model` usan los metadatos del manifiesto `providers` propietario
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si un Plugin no incluido en el paquete y un Plugin incluido en el paquete coinciden, gana el
  Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra ids de modelo abreviados.           |
| `modelPatterns` | `string[]` | Fuentes regex comparadas contra ids de modelo abreviados tras quitar sufijos de perfil. |

Las entradas de `modelPatterns` se compilan mediante `compileSafeRegex`, que rechaza
patrones que contienen repetición anidada (por ejemplo `(a+)+$`). Los patrones que fallan
la comprobación de seguridad se omiten silenciosamente, igual que una regex sintácticamente inválida.
Mantén los patrones simples y evita cuantificadores anidados.

## referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de
cargar el tiempo de ejecución del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo
fijas, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización en tiempo de ejecución
sigue perteneciendo al código de tiempo de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo se
requiere el tiempo de ejecución.

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

| Campo            | Tipo                                                     | Qué significa                                                                                             |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Filas de catálogo para ids de proveedor propiedad de este Plugin. Las claves también deberían aparecer en `providers` de nivel superior. |
| `aliases`        | `Record<string, object>`                                 | Alias de proveedor que deberían resolverse a un proveedor propietario para planificación de catálogo o supresión. |
| `suppressions`   | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por un motivo específico del proveedor.            |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, actualizarse en caché o requiere tiempo de ejecución. |
| `runtimeAugment` | `boolean`                                                | Configúralo como `true` solo cuando el tiempo de ejecución del proveedor deba añadir filas de catálogo tras la planificación de manifiesto/configuración. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación de catálogos de modelos.
Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una
lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y
aplicar anulaciones de API/URL base del alias sin cargar el tiempo de ejecución del proveedor.
Los alias no expanden listados de catálogo sin filtrar; las listas amplias emiten solo las
filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo punto de extensión `suppressBuiltInModel` del tiempo de ejecución del proveedor.
Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o se
declara como una clave `modelCatalog.aliases` que apunta a un proveedor propietario. Los puntos de extensión de
supresión en tiempo de ejecución ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor. |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor. |
| `models`  | `object[]`               | Filas de modelo requeridas. Las filas sin un `id` se ignoran.     |

Campos del modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local al proveedor, sin el prefijo `provider/`.                |
| `name`          | `string`                                                       | Nombre para mostrar opcional.                                               |
| `api`           | `ModelApi`                                                     | Anulación opcional de API por modelo.                                       |
| `baseUrl`       | `string`                                                       | Anulación opcional de URL base por modelo.                                  |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                           |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                         |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                   |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Tokens máximos de salida cuando se conocen.                                 |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprime solo cuando la fila no debe aparecer en absoluto. |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                       |
| `replaces`      | `string[]`                                                     | Ids de modelo locales al proveedor más antiguos que este modelo sustituye.  |
| `replacedBy`    | `string`                                                       | Id de modelo local al proveedor de reemplazo para filas obsoletas.          |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                         |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id de proveedor para la fila de origen que se va a suprimir. Debe ser propiedad de este Plugin o declararse como un alias propietario. |
| `model`                    | `string`   | Id de modelo local al proveedor que se va a suprimir.                                                     |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                              |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de URL base del proveedor requeridos antes de que se aplique la supresión. |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración de proveedor requeridos antes de que se aplique la supresión. |

No pongas datos solo de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las
filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor y selector omitan
el descubrimiento de registro/tiempo de ejecución. Usa `refreshable` cuando las filas del manifiesto sean semillas o
suplementos listables útiles pero una actualización/caché pueda añadir más filas más tarde;
las filas actualizables no son autoritativas por sí mismas. Usa `runtime` cuando OpenClaw
deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## referencia de modelIdNormalization

Usa `modelIdNormalization` para limpieza barata de ids de modelo propiedad del proveedor que debe
ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres de modelo
cortos, ids heredados locales al proveedor y reglas de prefijo de proxy en el manifiesto
del Plugin propietario en lugar de en tablas centrales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de id de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se quitarán antes de la búsqueda de alias, útiles para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se añadirá cuando el id de modelo normalizado aún no contenga `/`.            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo de id básico tras la búsqueda de alias, indexadas por `modelPrefix` y `prefix`. |

## referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes
debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo propietario del significado de cada
`endpointClass`; los manifiestos de Plugin son propietarios de los metadatos de host y URL base.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint principal conocida, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Antepon `.` para coincidencias solo con sufijos de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                             |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex.                 |

## Referencia de providerRequest

Usa `providerRequest` para metadatos económicos de compatibilidad de solicitudes que la
política genérica de solicitudes necesita sin cargar el tiempo de ejecución del proveedor. Mantén la reescritura de
cargas útiles específica del comportamiento en los ganchos del tiempo de ejecución del proveedor o en helpers compartidos de familias de proveedores.

```json
{
  "providers": ["vllm"],
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
| `family`              | `string`     | Etiqueta de familia de proveedor usada por decisiones y diagnósticos genéricos de compatibilidad de solicitudes. |
| `compatibilityFamily` | `"moonshot"` | Contenedor opcional de compatibilidad de familia de proveedores para helpers compartidos de solicitudes.              |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`.       |

## Referencia de secretProviderIntegrations

Usa `secretProviderIntegrations` cuando un Plugin pueda publicar un preajuste reutilizable
de proveedor exec de SecretRef. OpenClaw lee estos metadatos antes de que se cargue el tiempo de ejecución del Plugin,
almacena la propiedad del Plugin en `secrets.providers.<alias>.pluginIntegration` y
deja la resolución real de secretos al tiempo de ejecución de SecretRef.
Los preajustes se exponen solo para Plugins incluidos y Plugins instalados descubiertos
desde las raíces administradas de instalación de Plugins, como instalaciones desde git y ClawHub.

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

La clave del mapa es el id de integración. Si se omite `providerAlias`, OpenClaw usa
el id de integración como alias de proveedor SecretRef. Los alias de proveedor deben coincidir
con el patrón normal de alias de proveedor SecretRef, por ejemplo `team-secrets` o
`onepassword-work`.

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

Al iniciar o recargar, OpenClaw resuelve ese proveedor cargando los metadatos actuales
del manifiesto del Plugin, comprobando que el Plugin propietario esté instalado y activo, y
materializando el comando exec desde el manifiesto. Deshabilitar o eliminar el
Plugin revoca el proveedor para SecretRefs activos. Los operadores que quieran una
configuración exec independiente aún pueden escribir proveedores manuales de `command`/`args` directamente.

Actualmente solo se admiten preajustes `source: "exec"`. `command` debe ser
`${node}`, y `args[0]` debe ser un script de resolución relativo a la raíz del Plugin con prefijo `./`.
OpenClaw lo materializa al iniciar o recargar en el ejecutable actual de Node y
la ruta absoluta del script dentro del Plugin. Las opciones de Node como `--require`, `--import`,
`--loader`, `--env-file`, `--eval` y `--print` no forman parte del contrato
de preajuste del manifiesto. Los operadores que necesiten comandos que no sean de Node pueden configurar
proveedores exec manuales independientes directamente.

OpenClaw deriva `trustedDirs` para preajustes de manifiesto desde la raíz del Plugin y,
para preajustes `${node}`, desde el directorio del ejecutable actual de Node. Los
`trustedDirs` definidos por el manifiesto se ignoran. Otras opciones de proveedor exec como `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` y `allowInsecurePath` se transfieren
a la configuración normal del proveedor exec de SecretRef.

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesite comportamiento de precios del plano de control antes de que
se cargue el tiempo de ejecución. La caché de precios del Gateway lee estos metadatos sin importar
código del tiempo de ejecución del proveedor.

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
| `external`   | `boolean`         | Define `false` para proveedores locales o autoalojados que nunca deben obtener precios de OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` deshabilita la búsqueda de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` deshabilita la búsqueda de LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de proveedor del catálogo externo cuando difiere del id de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los ids de modelo que contienen barras como referencias anidadas proveedor/modelo, útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id de modelo del catálogo externo. `version-dots` prueba ids de versión con puntos como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw son metadatos de vista previa propiedad de OpenClaw para proveedores
cuyos Plugins quizá aún no estén instalados. No forma parte de un manifiesto de Plugin.
Los manifiestos de Plugin siguen siendo la autoridad del Plugin instalado. El Índice de proveedores es
el contrato interno de respaldo que las futuras superficies de selección de modelos e instalación previa
de proveedores instalables consumirán cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración de usuario.
2. `modelCatalog` del manifiesto del Plugin instalado.
3. Caché del catálogo de modelos desde una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, ganchos de tiempo de ejecución ni
datos de modelos específicos de una cuenta en vivo. Sus catálogos de vista previa usan la misma
forma de fila de proveedor `modelCatalog` que los manifiestos de Plugin, pero deben permanecer limitados
a metadatos de visualización estables salvo que campos del adaptador de tiempo de ejecución como `api`,
`baseUrl`, precios o indicadores de compatibilidad se mantengan alineados intencionalmente con
el manifiesto del Plugin instalado. Los proveedores con descubrimiento en vivo de `/models` deben
escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos en lugar de
hacer que el listado normal o el onboarding llamen a las APIs del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores
cuyo Plugin se haya movido fuera del núcleo o aún no esté instalado por otro motivo. Estos
metadatos reflejan el patrón del catálogo de canales: nombre del paquete, especificación de instalación npm,
integridad esperada y etiquetas económicas de elección de autenticación bastan para mostrar una
opción de configuración instalable. Una vez instalado el Plugin, su manifiesto prevalece y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidad de nivel superior heredadas están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad de
capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                   | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación y pistas de IU que deben existir antes de que se ejecute el código del Plugin                         |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, controles de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del Plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de package.json que afectan el descubrimiento

Algunos metadatos de Plugin previos al tiempo de ejecución viven intencionalmente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.
`openclaw.bundle` y `openclaw.bundle.json` no son contratos de Plugin de OpenClaw;
los Plugins nativos deben usar `openclaw.plugin.json` más los campos admitidos de
`package.json#openclaw` que aparecen abajo.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada de Plugin nativos. Debe permanecer dentro del directorio del paquete del Plugin.                                                                                         |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                                                  |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo para configuración usado durante la incorporación, el inicio diferido de canales y el estado de canal de solo lectura/descubrimiento de SecretRef. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del Plugin.      |
| `openclaw.channel`                                                                         | Metadatos económicos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                  |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas usados por las superficies de configuración, auditoría y listas de comandos antes de que cargue el runtime del canal. |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros de comprobación de estado configurado que pueden responder "¿ya existe una configuración solo por env?" sin cargar el runtime completo del canal.                                |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros de comprobación de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal.                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Sugerencias de instalación/actualización para plugins integrados y publicados externamente.                                                                                                        |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host OpenClaw, usando un piso semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                       |
| `openclaw.compat.pluginApi`                                                                | Rango mínimo de API de plugins de OpenClaw requerido por este paquete, usando un piso semver como `>=2026.5.27`.                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad dist de npm esperada, como `sha512-...`; los flujos de instalación y actualización verifican contra ella el artefacto obtenido.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta limitada de recuperación por reinstalación de Plugin integrado cuando la configuración no es válida.                                                                              |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de paquetes npm que deben materializarse cuando sus restricciones de plataforma del lockfile coinciden con el host actual.                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite cargar superficies de canal de runtime de configuración antes de escuchar y luego difiere el Plugin de canal configurado completo hasta la activación posterior a la escucha.               |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
la incorporación antes de que cargue el runtime. `package.json#openclaw.install` indica a
la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las sugerencias de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del
registro de manifiestos para fuentes de Plugin no integradas. Los valores no válidos se rechazan;
los valores más nuevos pero válidos omiten plugins externos en hosts antiguos. Se asume que los
plugins de fuente integrados tienen la misma versión que el checkout del host.

`openclaw.install.requiredPlatformPackages` es para paquetes npm que exponen
binarios nativos requeridos mediante alias opcionales específicos de plataforma. Lista el
nombre básico del paquete npm para cada alias de plataforma compatible. Durante la instalación npm,
OpenClaw verifica solo el alias declarado cuyas restricciones de lockfile coinciden con el
host actual. Si npm informa éxito pero omite ese alias, OpenClaw reintenta una vez
con una caché nueva y revierte la instalación si el alias sigue faltando.

`openclaw.compat.pluginApi` se aplica durante la instalación de paquetes para fuentes de
Plugin no integradas. Úsalo para el piso de API del SDK/runtime de plugins de OpenClaw contra el que
se compiló el paquete. Puede ser más estricto que `minHostVersion` cuando un
paquete de Plugin necesita una API más nueva pero mantiene una sugerencia de instalación más baja para otros
flujos. La sincronización de versiones oficiales de OpenClaw incrementa por defecto los pisos de API de plugins oficiales existentes
a la versión de lanzamiento de OpenClaw, pero los lanzamientos solo de Plugin pueden mantener un
piso más bajo cuando el paquete admite intencionalmente hosts más antiguos. No uses solo la
versión del paquete como contrato de compatibilidad. `peerDependencies.openclaw`
sigue siendo metadato de paquete npm; OpenClaw usa el contrato `openclaw.compat.pluginApi`
para decisiones de compatibilidad de instalación.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el Plugin se
publica en ClawHub; la incorporación lo trata como la fuente remota preferida y
registra datos del artefacto de ClawHub después de instalar. `npmSpec` sigue siendo la alternativa de compatibilidad
para paquetes que aún no se han movido a ClawHub.

El anclaje exacto de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales de catálogo externo
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
cerrados si el artefacto npm obtenido ya no coincide con la versión anclada.
La incorporación interactiva aún ofrece especificaciones npm de registro confiable, incluidos nombres de
paquete básicos y dist-tags, por compatibilidad. Los diagnósticos de catálogo pueden
distinguir fuentes exactas, flotantes, ancladas por integridad, sin integridad, con
discordancia de nombre de paquete y de elección predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda anclar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización lo aplican; cuando se omite, la resolución del registro se
registra sin un anclaje de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar el runtime
completo. La entrada de configuración debe exponer metadatos de canal además de adaptadores de configuración,
estado y secretos seguros para configuración; mantén los clientes de red, escuchas de Gateway y
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límites de paquete para campos de
punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una
ruta de `openclaw.extensions` que escapa sea cargable.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No hace
instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos obsoletos de actualización de plugins integrados, como una
ruta de Plugin integrado faltante o una entrada `channels.<id>` obsoleta para ese mismo
Plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un módulo comprobador
pequeño:

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

Úsalo cuando los flujos de configuración, doctor, estado o presencia de solo lectura necesiten una sonda
económica de autenticación sí/no antes de que cargue el Plugin de canal completo. El estado de autenticación persistido no es
estado de canal configurado: no uses estos metadatos para habilitar plugins automáticamente,
reparar dependencias de runtime ni decidir si debe cargar un runtime de canal.
La exportación de destino debe ser una función pequeña que solo lea estado persistido; no
la enrutes a través del barrel del runtime de canal completo.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones económicas de configuración
solo por env:

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

Úsalo cuando un canal pueda responder estado configurado desde env u otras entradas pequeñas
no de runtime. Si la comprobación necesita resolución completa de configuración o el runtime
real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre plugins desde varias raíces. Para el orden bruto de escaneo del sistema de archivos,
consulta [Orden de escaneo de Plugin](/es/gateway/configuration-reference#plugin-scan-order). Si dos descubrimientos
comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**;
los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta anclada explícitamente en `plugins.entries.<id>`
2. **Integrado** — plugins enviados con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins descubiertos en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin integrado ubicada en el workspace no sombreará la compilación integrada.
- Para reemplazar realmente un Plugin integrado con uno local, ánclalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del workspace.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Los reemplazos duplicados seleccionados por configuración se redactan como reemplazos explícitos en los diagnósticos, pero aun así advierten para que las bifurcaciones obsoletas y los sombreados accidentales sigan visibles.

## Requisitos de JSON Schema

- **Cada Plugin debe incluir un JSON Schema**, aunque no acepte configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer/escribir la configuración, no en tiempo de ejecución.
- Al extender o bifurcar un Plugin incluido con nuevas claves de configuración, actualiza el `configSchema` de `openclaw.plugin.json` de ese Plugin al mismo tiempo. Los esquemas de Plugins incluidos son estrictos, por lo que agregar `plugins.entries.<id>.config.myNewKey` en la configuración del usuario sin agregar `myNewKey` a `configSchema.properties` será rechazado antes de que se cargue el runtime del Plugin.

Extensión de esquema de ejemplo:

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

- Las claves `channels.*` desconocidas son **errores**, a menos que el id del canal esté declarado por
  el manifiesto de un Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de Plugin **detectables**. Los ids desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa el error del Plugin.
- Si existe configuración de Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta la [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para Plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime sigue cargando el módulo del Plugin por separado; el manifiesto solo sirve para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un Plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debe importar código amplio de runtime; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento acotados, no para ejecución en tiempo de solicitud.
- Los tipos de Plugin exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` a través de `plugins.slots.memory`, `kind: "context-engine"` a través de `plugins.slots.contextEngine` (valor predeterminado `legacy`).
- Declara el tipo de Plugin exclusivo en este manifiesto. `OpenClawPluginDefinition.kind` en la entrada de runtime está obsoleto y permanece solo como alternativa de compatibilidad para Plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el `providerAuthEnvVars` obsoleto y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega de cron y otras superficies de solo lectura siguen aplicando la confianza del Plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieren código de proveedor, consulta [Hooks de runtime del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Building plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con Plugins.
  </Card>
  <Card title="Plugin architecture" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="SDK overview" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones de subrutas.
  </Card>
</CardGroup>
