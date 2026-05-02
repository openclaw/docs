---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-05-02T20:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
con el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las raíces de
Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json`
del paquete de Claude, los valores predeterminados de LSP del paquete de Claude y los paquetes de hooks compatibles cuando el diseño coincide
con las expectativas del runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos ausentes o no válidos se tratan como
errores de Plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar tu
código de Plugin**. Todo lo siguiente debe ser lo bastante barato de inspeccionar sin arrancar
el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración y sugerencias para la interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, activación automática, variables de entorno del proveedor, opciones de autenticación)
- sugerencias de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento de runtime, declarar puntos de entrada de código
o metadatos de instalación de npm. Eso pertenece al código de tu Plugin y a `package.json`.

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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Campo                                | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                         | ID canónico del Plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor que no sea `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                               |
| `legacyPluginIds`                    | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de Plugin.                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | IDs de proveedores que deberían habilitar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                           |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | No          | `string[]`                       | IDs de canales propiedad de este Plugin. Se usa para descubrimiento y validación de configuración.                                                                                                                                  |
| `providers`                          | No          | `string[]`                       | IDs de proveedores propiedad de este Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | No          | `string`                         | Ruta de módulo ligera de descubrimiento de proveedores, relativa a la raíz del Plugin, para metadatos de catálogo de proveedores con alcance de manifiesto que se pueden cargar sin activar todo el runtime del Plugin.             |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto, usados para cargar automáticamente el Plugin antes del runtime.                                                                                                |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este Plugin. Este es el contrato del plano de control para futuros listados de solo lectura, onboarding, selectores de modelos, alias y supresión sin cargar el runtime del Plugin. |
| `modelPricing`                       | No          | `object`                         | Política de búsqueda de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o mapear referencias de proveedor a IDs de catálogo de OpenRouter/LiteLLM sin codificar IDs de proveedor en core. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de ID de modelo propiedad del proveedor que debe ejecutarse antes de que se cargue el runtime del proveedor.                                                                                              |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedores que core debe clasificar antes de que se cargue el runtime del proveedor.                                                                 |
| `providerRequest`                    | No          | `object`                         | Metadatos ligeros de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que se cargue el runtime del proveedor.                                                           |
| `cliBackends`                        | No          | `string[]`                       | IDs de backends de inferencia de CLI propiedad de este Plugin. Se usa para la activación automática al inicio desde referencias de configuración explícitas.                                                                         |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debería sondearse durante el descubrimiento de modelos en frío antes de que se cargue el runtime.                              |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad del Plugin incluido que representan estado de credenciales locales no secretas, OAuth o ambientales.                                                                      |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este Plugin que deberían producir diagnósticos de configuración y CLI conscientes del Plugin antes de que se cargue el runtime.                                                                     |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para búsqueda de autenticación/estado del proveedor. Prefiere `setup.providers[].envVars` para Plugins nuevos; OpenClaw todavía lee esto durante la ventana de obsolescencia.     |
| `providerAuthAliases`                | No          | `Record<string, string>`         | IDs de proveedores que deberían reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.        |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos ligeros de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalo para configuración de canales impulsada por entorno o superficies de autenticación que los helpers genéricos de inicio/configuración deberían ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado simple de flags de CLI.                                                                                   |
| `activation`                         | No          | `object`                         | Metadatos ligeros del planificador de activación para cargas activadas por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin todavía posee el comportamiento real.                         |
| `setup`                              | No          | `object`                         | Descriptores ligeros de configuración/onboarding que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                        |
| `qaRunners`                          | No          | `object[]`                       | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del Plugin.                                                                                                  |
| `contracts`                          | No          | `object`                         | Instantánea estática de propiedad de capacidades para hooks de autenticación externos, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados ligeros de comprensión multimedia para IDs de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                            |
| `imageGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos ligeros de autenticación para generación de imágenes para IDs de proveedores declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.          |
| `videoGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos ligeros de autenticación para generación de video para IDs de proveedores declarados en `contracts.videoGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.             |
| `musicGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos ligeros de autenticación para generación de música para IDs de proveedores declarados en `contracts.musicGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de base-url.             |
| `toolMetadata`                       | No          | `Record<string, object>`         | Metadatos ligeros de disponibilidad para herramientas propiedad del Plugin declaradas en `contracts.tools`. Úsalo cuando una herramienta no debería cargar el runtime salvo que exista evidencia de configuración, entorno o autenticación. |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto combinados en superficies de descubrimiento y validación antes de que se cargue el runtime.                                                                             |
| `skills`                             | No          | `string[]`                       | Directorios de Skills para cargar, relativos a la raíz del Plugin.                                                                                                                                                                  |
| `name`                               | No          | `string`                         | Nombre legible para humanos del Plugin.                                                                                                                                                                                             |
| `description`                        | No       | `string`                         | Resumen breve que se muestra en las superficies de Plugin.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | Etiquetas de interfaz de usuario, marcadores de posición e indicaciones de sensibilidad para campos de configuración.                                                                                                                                                                   |

## Referencia de metadatos de proveedor de generación

Los campos de metadatos del proveedor de generación describen señales de autenticación estáticas para los proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente. OpenClaw lee estos campos antes de cargar el entorno de ejecución del proveedor para que las herramientas del núcleo puedan decidir si un proveedor de generación está disponible sin importar todos los plugins de proveedor.

Use estos campos solo para hechos declarativos baratos. El transporte, las transformaciones de solicitudes, la actualización de tokens, la validación de credenciales y el comportamiento real de generación permanecen en el entorno de ejecución del plugin.

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

| Campo           | Obligatorio | Tipo       | Qué significa                                                                                                                       |
| --------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No          | `string[]` | Ids de proveedor adicionales que deben contar como alias de autenticación estáticos para el proveedor de generación.                                       |
| `authProviders` | No          | `string[]` | Ids de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                      |
| `configSignals` | No          | `object[]` | Señales baratas de disponibilidad solo de configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`   | No          | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id de proveedor, `aliases` y `authProviders`.     |

Cada entrada de `configSignals` admite:

| Campo         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                           |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sí          | `string`   | Ruta de puntos al objeto de configuración propiedad del plugin que se inspeccionará, por ejemplo `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | No          | `string`   | Ruta de puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Use esto para configuración específica de capacidad como `image`, `video` o `music`. |
| `required`    | No          | `string[]` | Rutas de puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos no deben estar vacíos.                                                |
| `requiredAny` | No          | `string[]` | Rutas de puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                  |
| `mode`        | No          | `object`   | Protección opcional de modo de cadena dentro de la configuración efectiva. Use esto cuando la disponibilidad solo de configuración se aplique solo a un modo.                                                                |

Cada protección de `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta de puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.                          |
| `default`    | No          | `string`   | Valor de modo que se usará cuando la configuración omita la ruta.                                  |
| `allowed`    | No          | `string[]` | Si está presente, la señal se aprueba solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.       |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Id de proveedor que se comprobará en los perfiles de autenticación configurados.                                                                                                                             |
| `providerBaseUrl` | No          | `object` | Protección opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Use esto cuando un alias de autenticación es válido solo para ciertas API. |

Cada protección de `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Id de configuración de proveedor cuyo `baseUrl` debe comprobarse.                                                                                                |
| `defaultBaseUrl`  | No          | `string`   | URL base que se asumirá cuando la configuración del proveedor omita `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sí          | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que los metadatos de proveedor de generación, indexadas por nombre de herramienta. `contracts.tools` declara la propiedad. `toolMetadata` declara evidencia barata de disponibilidad para que OpenClaw pueda evitar importar un entorno de ejecución de plugin solo para que su fábrica de herramientas devuelva `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y carga el plugin propietario cuando el contrato de herramienta coincide con la política. Para herramientas de rutas críticas cuya fábrica depende de autenticación/configuración, los autores de plugins deben declarar `toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para consultar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación. OpenClaw lee esto antes de cargar el entorno de ejecución del proveedor. Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración derivadas de descriptores y metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | Id de proveedor al que pertenece esta opción.                                                                      |
| `method`              | Sí          | `string`                                        | Id de método de autenticación al que despachar.                                                                           |
| `choiceId`            | Sí          | `string`                                        | Id estable de opción de autenticación usado por los flujos de incorporación y CLI.                                                  |
| `choiceLabel`         | No          | `string`                                        | Etiqueta orientada al usuario. Si se omite, OpenClaw recurre a `choiceId`.                                        |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                        |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos controlados por el asistente.                                       |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente mientras sigue permitiendo la selección manual en la CLI.                        |
| `deprecatedChoiceIds` | No          | `string[]`                                      | Ids de opción heredados que deben redirigir a los usuarios a esta opción de reemplazo.                                 |
| `groupId`             | No          | `string`                                        | Id de grupo opcional para agrupar opciones relacionadas.                                                          |
| `groupLabel`          | No          | `string`                                        | Etiqueta orientada al usuario para ese grupo.                                                                        |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                         |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos de autenticación simples de una sola bandera.                                                      |
| `cliFlag`             | No          | `string`                                        | Nombre de bandera de CLI, como `--openrouter-api-key`.                                                           |
| `cliOption`           | No          | `string`                                        | Forma completa de opción de CLI, como `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                            |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Use `commandAliases` cuando un plugin posee un nombre de comando en tiempo de ejecución que los usuarios podrían
poner por error en `plugins.allow` o intentar ejecutar como un comando CLI raíz. OpenClaw
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sí      | `string`          | Nombre de comando que pertenece a este plugin.                               |
| `kind`       | No       | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No       | `string`          | Comando CLI raíz relacionado que se debe sugerir para operaciones de CLI, si existe uno.  |

## referencia de activación

Usa `activation` cuando el plugin puede declarar de forma económica qué eventos del plano de control
deberían incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento en tiempo de ejecución, no reemplaza `register(...)` y no promete que
el código del plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los plugins candidatos antes de recurrir a los metadatos existentes de propiedad del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más acotados que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts`
cuando esos campos expresen la relación. Usa `activation` para pistas adicionales del planificador
que no puedan representarse mediante esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de tiempo de ejecución de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
ids de harness de agente incrustados que aún no tienen un campo de propiedad.

Este bloque solo contiene metadatos. No registra comportamiento en tiempo de ejecución y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga de plugins más amplia, por lo que
los metadatos de activación que falten fuera del inicio normalmente solo cuestan rendimiento; no
deberían cambiar la corrección mientras sigan existiendo los respaldos de propiedad del manifiesto.

Cada plugin debería establecer `activation.onStartup` intencionalmente. Establécelo en `true`
solo cuando el plugin deba ejecutarse durante el inicio del Gateway. Establécelo en `false` cuando
el plugin esté inerte al inicio y deba cargarse solo desde disparadores más acotados.
Omitir `onStartup` ya no carga implícitamente el plugin al inicio; usa metadatos de
activación explícitos para el inicio, canal, configuración, harness de agente, memoria u
otros disparadores de activación más acotados.

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
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No       | `boolean`                                            | Activación explícita al inicio del Gateway. Cada plugin debería establecer esto. `true` importa el plugin durante el inicio; `false` lo mantiene diferido al inicio salvo que otro disparador coincidente requiera cargarlo. |
| `onProviders`      | No       | `string[]`                                           | Ids de proveedor que deberían incluir este plugin en los planes de activación/carga.                                                                                                                      |
| `onAgentHarnesses` | No       | `string[]`                                           | Ids de tiempo de ejecución de harness de agente incrustados que deberían incluir este plugin en los planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI.                                           |
| `onCommands`       | No       | `string[]`                                           | Ids de comando que deberían incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onChannels`       | No       | `string[]`                                           | Ids de canal que deberían incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onRoutes`         | No       | `string[]`                                           | Tipos de ruta que deberían incluir este plugin en los planes de activación/carga.                                                                                                                       |
| `onConfigPaths`    | No       | `string[]`                                           | Rutas de configuración relativas a la raíz que deberían incluir este plugin en los planes de inicio/carga cuando la ruta esté presente y no esté deshabilitada explícitamente.                                                      |
| `onCapabilities`   | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidades usadas por la planificación de activación del plano de control. Prefiere campos más acotados cuando sea posible.                                                                                     |

Consumidores activos actuales:

- La planificación de inicio del Gateway usa `activation.onStartup` para la importación
  explícita al inicio
- La planificación de CLI activada por comandos recurre a los campos heredados
  `commandAliases[].cliCommand` o `commandAliases[].name`
- La planificación de inicio del tiempo de ejecución de agentes usa `activation.onAgentHarnesses` para
  harnesses incrustados y `cliBackends[]` de nivel superior para alias de tiempo de ejecución de CLI
- La planificación de configuración/canal activada por canal recurre a la propiedad heredada de `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- La planificación de plugins de inicio usa `activation.onConfigPaths` para superficies de configuración raíz
  que no son de canal, como el bloque `browser` del plugin de navegador incluido
- La planificación de configuración/tiempo de ejecución activada por proveedor recurre a la propiedad heredada de
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de
  activación de proveedor

Los diagnósticos del planificador pueden distinguir las pistas de activación explícitas del respaldo de
propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó la propiedad de `commandAliases` en su lugar. Estas etiquetas de motivo son para
diagnósticos del host y pruebas; los autores de plugins deberían seguir declarando los metadatos
que mejor describan la propiedad.

## referencia de qaRunners

Usa `qaRunners` cuando un plugin aporta uno o más runners de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el tiempo de ejecución
del plugin sigue siendo propietario del registro real de CLI mediante una superficie ligera
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

| Campo         | Obligatorio | Tipo     | Qué significa                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí      | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.    |
| `description` | No       | `string` | Texto de ayuda de respaldo usado cuando el host compartido necesita un comando stub. |

## referencia de setup

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos económicos
propiedad del plugin antes de que se cargue el tiempo de ejecución.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia
de CLI. `setup.cliBackends` es la superficie descriptora específica de configuración para
flujos del plano de control/configuración que deberían permanecer solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie de búsqueda
preferida con descriptores primero para el descubrimiento de configuración. Si el descriptor solo
reduce el plugin candidato y la configuración aún necesita hooks de tiempo de configuración más ricos,
establece `requiresRuntime: true` y mantén `setup-api` como la
ruta de ejecución de respaldo.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y
variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
durante la ventana de desuso, pero los plugins no incluidos que todavía lo usan
reciben un diagnóstico de manifiesto. Los plugins nuevos deberían poner los metadatos de entorno
de configuración/estado en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de configuración desde `setup.providers[].authMethods`
cuando no hay una entrada de configuración disponible, o cuando `setup.requiresRuntime: false`
declara que el tiempo de ejecución de configuración no es necesario. Las entradas explícitas de `providerAuthChoices` siguen siendo
preferidas para etiquetas personalizadas, flags de CLI, alcance de incorporación y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la
superficie de configuración. OpenClaw trata el `false` explícito como un contrato solo de descriptores
y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si
un plugin solo de descriptores aún incluye una de esas entradas de tiempo de ejecución de configuración,
OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir
`requiresRuntime` conserva el comportamiento de respaldo heredado para que los plugins existentes que agregaron
descriptores sin el flag no se rompan.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de
`setup.providers[].id` y `setup.cliBackends[]` deben mantenerse únicos entre
plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

Cuando el tiempo de ejecución de configuración se ejecuta, los diagnósticos del registro de configuración informan deriva de descriptores
si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto
no declaran, o si un descriptor no tiene un registro de tiempo de ejecución
coincidente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí      | `string`   | Id de proveedor expuesto durante la configuración o incorporación. Mantén los ids normalizados globalmente únicos.             |
| `authMethods`  | No       | `string[]` | Ids de métodos de configuración/autenticación que este proveedor admite sin cargar todo el tiempo de ejecución.                       |
| `envVars`      | No       | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que cargue el tiempo de ejecución del plugin.               |
| `authEvidence` | No       | `object[]` | Comprobaciones económicas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que se pueden
verificar sin cargar código de tiempo de ejecución. Estas comprobaciones deben seguir siendo baratas y locales:
sin llamadas de red, sin lecturas del llavero ni del gestor de secretos, sin comandos de shell y sin
sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita al archivo de credenciales.                                                           |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales comprobadas cuando `fileEnvVar` no existe o está vacía. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una variable de entorno listada debe no estar vacía para que la evidencia sea válida.                                    |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida.                                           |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                       |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                                               |

### campos de configuración

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación.                                     |
| `cliBackends`      | No          | `string[]` | Ids de backends en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este Plugin.                                          |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecutar `setup-api` después de la búsqueda de descriptores.                            |

## referencia de uiHints

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
| `label`       | `string`   | Etiqueta de campo visible para el usuario.                |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas opcionales de la interfaz de usuario.                       |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de marcador de posición para entradas de formulario.       |

## referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
leer sin importar el tiempo de ejecución del Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista es opcional:

| Campo                            | Tipo       | Qué significa                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ids de fábricas de extensiones del servidor de aplicaciones de Codex, actualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ids de tiempo de ejecución para los que un Plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedores cuyo hook de perfil de autenticación externa pertenece a este Plugin.       |
| `speechProviders`                | `string[]` | Ids de proveedores de voz propiedad de este Plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real propiedad de este Plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real propiedad de este Plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedores de embeddings de memoria propiedad de este Plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de comprensión multimedia propiedad de este Plugin.                    |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes propiedad de este Plugin.                       |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video propiedad de este Plugin.                       |
| `webFetchProviders`              | `string[]` | Ids de proveedores de obtención web propiedad de este Plugin.                              |
| `webSearchProviders`             | `string[]` | Ids de proveedores de búsqueda web propiedad de este Plugin.                             |
| `migrationProviders`             | `string[]` | Ids de proveedores de importación propiedad de este Plugin para `openclaw migrate`.          |
| `tools`                          | `string[]` | Nombres de herramientas de agente propiedad de este Plugin.                                    |

`contracts.embeddedExtensionFactories` se conserva para fábricas de extensiones solo de servidor de aplicaciones de Codex
incluidas. Las transformaciones incluidas de resultados de herramientas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los Plugins externos no pueden
registrar middleware de resultados de herramientas porque la unión puede reescribir la salida de herramientas de alta confianza
antes de que el modelo la vea.

Los registros de tiempo de ejecución `api.registerTool(...)` deben coincidir con `contracts.tools`.
El descubrimiento de herramientas usa esta lista para cargar solo los tiempos de ejecución de Plugins que pueden poseer las
herramientas solicitadas.

Los Plugins de proveedores que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin la declaración aún pasan
por una alternativa de compatibilidad obsoleta, pero esa alternativa es más lenta y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas de CLI independientes usan este contrato de manifiesto
para cargar solo el Plugin propietario antes de que el tiempo de ejecución completo del Gateway haya
registrado los proveedores.

## referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tenga
modelos predeterminados, prioridad de alternativa de autenticación automática o soporte nativo de documentos que
los ayudantes genéricos del núcleo necesitan antes de que se cargue el tiempo de ejecución. Las claves también deben declararse en
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
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para la alternativa automática de proveedor basada en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documento nativas admitidas por el proveedor.                            |

## referencia de channelConfigs

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos de configuración baratos antes de que
se cargue el tiempo de ejecución. El descubrimiento de configuración/estado de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no haya una entrada de configuración disponible, o
cuando `setup.requiresRuntime: false` declare innecesario el tiempo de ejecución de configuración.

`channelConfigs` son metadatos de manifiesto del Plugin, no una nueva sección de configuración de usuario de nivel superior.
Los usuarios siguen configurando instancias de canal bajo `channels.<channel-id>`.
OpenClaw lee metadatos de manifiesto para decidir qué Plugin posee ese canal configurado
antes de que se ejecute el código de tiempo de ejecución del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaran `channels[]` también deben declarar entradas
`channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el Plugin, pero
el esquema de configuración de ruta fría, la configuración y las superficies de Control UI no pueden conocer la
forma de las opciones propiedad del canal hasta que se ejecute el tiempo de ejecución del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y
`nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración de comandos
que se ejecutan antes de que se cargue el tiempo de ejecución del canal. Los canales incluidos también pueden publicar
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
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada.         |
| `uiHints`     | `Record<string, object>` | Etiquetas/marcadores de posición/indicaciones sensibles opcionales de la UI para esa sección de configuración de canal.          |
| `label`       | `string`                 | Etiqueta de canal fusionada en las superficies de selección e inspección cuando los metadatos en tiempo de ejecución no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Comando nativo estático y valores predeterminados automáticos de skill nativa para comprobaciones de configuración previas al tiempo de ejecución.       |
| `preferOver`  | `string[]`               | Ids de Plugin heredados o de menor prioridad que este canal debe superar en las superficies de selección.    |

### Reemplazar otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido de un id de canal que
otro Plugin también pueda proporcionar. Los casos comunes son un id de Plugin renombrado, un
Plugin independiente que sustituye a un Plugin incluido, o un fork mantenido que
mantiene el mismo id de canal por compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el id del canal como
el id del Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque
está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la
configuración efectiva de tiempo de ejecución para que un Plugin sea propietario del canal y sus herramientas. La selección explícita del usuario
sigue teniendo prioridad: si el usuario habilita explícitamente ambos Plugins, OpenClaw
conserva esa elección e informa diagnósticos de canal/herramienta duplicados en lugar de
cambiar silenciosamente el conjunto de Plugins solicitado.

Mantén `preferOver` limitado a ids de Plugin que realmente puedan proporcionar el mismo canal.
No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin proveedor a partir de
ids abreviados de modelo como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el tiempo de ejecución del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos de manifiesto `providers` propietarios
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si coinciden un Plugin no incluido y un Plugin incluido, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra ids abreviados de modelo.                 |
| `modelPatterns` | `string[]` | Fuentes de expresiones regulares comparadas contra ids abreviados de modelo tras eliminar el sufijo de perfil. |

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer metadatos de modelos del proveedor antes de
cargar el tiempo de ejecución del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo
fijas, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización en tiempo de ejecución
sigue perteneciendo al código de tiempo de ejecución del proveedor, pero el manifiesto indica al núcleo cuándo se requiere
el tiempo de ejecución.

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

| Campo          | Tipo                                                     | Qué significa                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Filas de catálogo para ids de proveedor propiedad de este Plugin. Las claves también deben aparecer en `providers` de nivel superior.       |
| `aliases`      | `Record<string, object>`                                 | Alias de proveedor que deben resolverse a un proveedor propio para planificación de catálogo o supresión.              |
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por un motivo específico del proveedor.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde los metadatos del manifiesto, actualizarse en la caché o requiere tiempo de ejecución. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación de catálogos de modelos.
Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una
lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y
aplicar sobrescrituras de API/base URL del alias sin cargar el tiempo de ejecución del proveedor.
Los alias no expanden los listados de catálogo sin filtrar; las listas amplias emiten únicamente
las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook `suppressBuiltInModel` del tiempo de ejecución del proveedor.
Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o
se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión
en tiempo de ejecución ya no se llaman durante la resolución de modelos.

Campos de proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para los modelos de este catálogo de proveedor.    |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos de este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.      |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin un `id` se ignoran.            |

Campos de modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`          | `string`                                                       | Nombre para mostrar opcional.                                                      |
| `api`           | `ModelApi`                                                     | Sobrescritura opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Sobrescritura opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                               |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                               |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Tokens máximos de salida cuando se conocen.                                           |
| `cost`          | `object`                                                       | Precios opcionales en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores opcionales de compatibilidad que coinciden con la compatibilidad de configuración de modelos de OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprime solo cuando la fila no debe aparecer en absoluto.          |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                            |
| `replaces`      | `string[]`                                                     | Ids de modelo locales del proveedor más antiguos que este modelo sustituye.                       |
| `replacedBy`    | `string`                                                       | Id de modelo local del proveedor de reemplazo para filas obsoletas.                    |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id de proveedor de la fila ascendente que se va a suprimir. Debe ser propiedad de este Plugin o declararse como un alias propio. |
| `model`                    | `string`   | Id de modelo local del proveedor que se va a suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efectiva del proveedor requeridos antes de que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración del proveedor requeridos antes de que se aplique la supresión.              |

No pongas datos solo de runtime en `modelCatalog`. Usa `static` solo cuando las filas del manifiesto
sean lo bastante completas como para que las superficies de lista filtrada por proveedor y selector omitan
el descubrimiento de registro/runtime. Usa `refreshable` cuando las filas del manifiesto sean semillas
listables útiles o complementos, pero una actualización/caché pueda agregar más filas más adelante;
las filas refreshable no son autoritativas por sí mismas. Usa `runtime` cuando OpenClaw
deba cargar el runtime del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza económica, propiedad del proveedor, de los id de modelo que debe
ocurrir antes de que cargue el runtime del proveedor. Esto mantiene alias como nombres cortos de modelos,
id heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del Plugin propietario,
en lugar de en tablas centrales de selección de modelos.

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

| Campo                                | Tipo                    | Qué significa                                                                            |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exactos de id de modelo, sin distinguir mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de buscar alias, útiles para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se agrega cuando el id de modelo normalizado aún no contiene `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para id sin prefijo después de buscar alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes
debe conocer antes de que cargue el runtime del proveedor. El núcleo sigue siendo dueño del significado de cada
`endpointClass`; los manifiestos de Plugin son dueños de los metadatos de host y URL base.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint conocida por el núcleo, como `openrouter`, `moonshot-native` o `google-vertex`. |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                  |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Usa como prefijo `.` para coincidencias solo de sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                    |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de hosts coincidentes para exponer el prefijo de región de Google Vertex. |

## Referencia de providerRequest

Usa `providerRequest` para metadatos económicos de compatibilidad de solicitudes que la política
genérica de solicitudes necesita sin cargar el runtime del proveedor. Mantén la reescritura de payloads
específica del comportamiento en hooks del runtime del proveedor o en helpers compartidos de familias de proveedores.

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

| Campo                 | Tipo         | Qué significa                                                                         |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etiqueta de familia de proveedor usada por decisiones genéricas de compatibilidad de solicitudes y diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Contenedor opcional de compatibilidad de familia de proveedor para helpers compartidos de solicitudes. |
| `openAICompletions`   | `object`     | Flags de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesite comportamiento de precios del plano de control antes de que
cargue el runtime. La caché de precios del Gateway lee estos metadatos sin importar
código de runtime del proveedor.

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
| `external`   | `boolean`         | Establece `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor. |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor. |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de proveedor del catálogo externo cuando difiere del id de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los id de modelo que contienen barras como refs anidadas de proveedor/modelo, útil para proveedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id de modelo del catálogo externo. `version-dots` prueba id de versión con puntos como `claude-opus-4.6`. |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw es metadata de vista previa propiedad de OpenClaw para proveedores
cuyos plugins quizá aún no estén instalados. No forma parte de un manifiesto de Plugin.
Los manifiestos de Plugin siguen siendo la autoridad de los plugins instalados. El Índice de proveedores es
el contrato interno de respaldo que consumirán las futuras superficies de selector de modelos de proveedores instalables y preinstalación
cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración de usuario.
2. `modelCatalog` del manifiesto del Plugin instalado.
3. Caché del catálogo de modelos de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de runtime ni
datos de modelos activos específicos de la cuenta. Sus catálogos de vista previa usan la misma
forma de fila de proveedor de `modelCatalog` que los manifiestos de Plugin, pero deben permanecer limitados
a metadatos de visualización estables, salvo que campos de adaptador de runtime como `api`,
`baseUrl`, precios o flags de compatibilidad se mantengan intencionalmente alineados con
el manifiesto del Plugin instalado. Los proveedores con descubrimiento activo de `/models` deben
escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos, en lugar de
hacer que el listado normal o el onboarding llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores
cuyo Plugin se haya movido fuera del núcleo o que, por otro motivo, aún no esté instalado. Estos
metadatos reflejan el patrón del catálogo de canales: nombre del paquete, especificación de instalación npm,
integridad esperada y etiquetas económicas de elección de autenticación son suficientes para mostrar una
opción de configuración instalable. Una vez instalado el Plugin, su manifiesto prevalece y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidad heredadas de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad de capacidad.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación y sugerencias de UI que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, control de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadata, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del Plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de package.json que afectan el descubrimiento

Algunos metadatos de Plugin previos al runtime viven intencionalmente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.
`openclaw.bundle` y `openclaw.bundle.json` no son contratos de Plugin de OpenClaw;
los plugins nativos deben usar `openclaw.plugin.json` más los campos compatibles de
`package.json#openclaw` que aparecen abajo.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declara puntos de entrada de plugin nativos. Debe permanecer dentro del directorio del paquete del plugin.                                                                                          |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de runtime de JavaScript compilados para paquetes instalados. Debe permanecer dentro del directorio del paquete del plugin.                                                |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo de configuración usado durante el onboarding, el inicio diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración de JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del plugin.  |
| `openclaw.channel`                                                                         | Metadatos baratos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                      |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas usados por la configuración, la auditoría y las superficies de lista de comandos antes de que cargue el runtime del canal. |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por entorno?" sin cargar el runtime completo del canal.                             |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal.                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicaciones de instalación/actualización para plugins incluidos y publicados externamente.                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima admitida del host de OpenClaw, usando un piso semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                       |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad esperada de dist de npm, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta estrecha de recuperación por reinstalación de plugins incluidos cuando la configuración no es válida.                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies de canal solo de configuración carguen antes que el plugin completo del canal durante el inicio.                                                                         |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
el onboarding antes de que cargue el runtime. `package.json#openclaw.install` indica al
onboarding cómo obtener o habilitar ese plugin cuando el usuario elige una de esas
opciones. No muevas las indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos para fuentes de plugin no incluidas. Los valores no válidos se rechazan;
los valores más nuevos pero válidos omiten plugins externos en hosts antiguos. Se asume que
los plugins de fuente incluidos están co-versionados con el checkout del host.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el plugin está
publicado en ClawHub; el onboarding lo trata como la fuente remota preferida y
registra hechos del artefacto de ClawHub después de la instalación. `npmSpec` sigue siendo el fallback
de compatibilidad para paquetes que aún no se han movido a ClawHub.

El fijado exacto de versión de npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
de forma cerrada si el artefacto de npm obtenido ya no coincide con la versión fijada.
El onboarding interactivo aún ofrece especificaciones de npm de registros confiables, incluidos
nombres de paquete simples y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir fuentes exactas, flotantes, fijadas por integridad, sin integridad, con
nombre de paquete no coincidente y con opción predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente de npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización la aplican; cuando se omite, la resolución del registro se
registra sin fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar el runtime
completo. La entrada de configuración debe exponer metadatos de canal más adaptadores de configuración,
estado y secretos seguros para configuración; mantén clientes de red, listeners de Gateway y
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límites de paquete para los campos
de punto de entrada de fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una
ruta escapada de `openclaw.extensions` sea cargable.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente estrecho. No hace
instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos de actualización de plugins incluidos obsoletos, como una
ruta faltante de plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un módulo comprobador
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

Úsalo cuando los flujos de configuración, doctor, estado o presencia de solo lectura necesiten una sonda barata
de autenticación sí/no antes de que cargue el plugin completo del canal. El estado de autenticación persistido no es
estado configurado del canal: no uses estos metadatos para habilitar plugins automáticamente,
reparar dependencias de runtime o decidir si debe cargar un runtime de canal.
La exportación objetivo debe ser una función pequeña que solo lea estado persistido; no
la enrutes por el barrel completo del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de configuración
solo por entorno:

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

Úsalo cuando un canal pueda responder el estado configurado desde el entorno u otras entradas
pequeñas que no sean de runtime. Si la comprobación necesita la resolución completa de configuración o el runtime
real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin.

## Precedencia de descubrimiento (ids de plugin duplicados)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, espacio de trabajo, rutas seleccionadas explícitamente por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins distribuidos con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Espacio de trabajo** — plugins descubiertos en relación con el espacio de trabajo actual

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido ubicada en el espacio de trabajo no sustituirá a la compilación incluida.
- Para sobrescribir realmente un plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en vez de depender del descubrimiento del espacio de trabajo.
- Los descartes duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las sustituciones duplicadas seleccionadas por configuración se redactan como sustituciones explícitas en los diagnósticos, pero siguen advirtiendo para que las bifurcaciones obsoletas y las sombras accidentales permanezcan visibles.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en runtime.
- Al extender o bifurcar un plugin incluido con nuevas claves de configuración, actualiza al mismo tiempo el `configSchema` de `openclaw.plugin.json` de ese plugin. Los esquemas de plugins incluidos son estrictos, por lo que agregar `plugins.entries.<id>.config.myNewKey` en la configuración del usuario sin agregar `myNewKey` a `configSchema.properties` se rechazará antes de que cargue el runtime del plugin.

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

- Las claves `channels.*` desconocidas son **errores**, a menos que el id de canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben referenciar ids de plugin **descubribles**. Los ids desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración de plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + logs.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime aún carga el módulo del plugin por separado; el manifiesto solo se usa para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita las claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- `providerDiscoveryEntry` debe mantenerse ligero y no debería importar código amplio de runtime; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento limitados, no para la ejecución en tiempo de solicitud.
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado `legacy`).
- Declara el tipo exclusivo de plugin en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de runtime está obsoleto y permanece solo como alternativa de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega de cron y otras superficies de solo lectura siguen aplicando la política de confianza del plugin y de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieran código de proveedor, consulta [Hooks de runtime del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
