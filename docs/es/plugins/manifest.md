---
read_when:
    - Estás creando un plugin de OpenClaw
    - Debe enviar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto del Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-05-11T20:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto de Plugin nativo de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee metadatos del paquete más las raíces de Skills declaradas,
raíces de comandos de Claude, valores predeterminados de `settings.json` del paquete de Claude,
valores predeterminados de LSP del paquete de Claude y paquetes de hooks compatibles cuando el diseño coincide
con las expectativas del runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos faltantes o no válidos se tratan como
errores de Plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar tu
código del Plugin**. Todo lo siguiente debe ser lo suficientemente barato de inspeccionar sin arrancar
el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración y sugerencias de interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor, opciones de autenticación)
- sugerencias de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento en runtime, declarar entrypoints de código
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
| `id`                                 | Sí          | `string`                         | Identificador canónico del Plugin. Es el identificador usado en `plugins.entries.<id>`.                                                                                                                                             |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin incluido como habilitado de forma predeterminada. Omítalo, o establezca cualquier valor que no sea `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                             |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                       | Marca un Plugin incluido como habilitado de forma predeterminada solo en las plataformas de Node.js indicadas, por ejemplo `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                      |
| `legacyPluginIds`                    | No          | `string[]`                       | Identificadores heredados que se normalizan a este identificador canónico del Plugin.                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | Identificadores de proveedor que deben habilitar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                    |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | No          | `string[]`                       | Identificadores de canal propiedad de este Plugin. Se usa para descubrimiento y validación de configuración.                                                                                                                        |
| `providers`                          | No          | `string[]`                       | Identificadores de proveedor propiedad de este Plugin.                                                                                                                                                                              |
| `providerCatalogEntry`               | No          | `string`                         | Ruta ligera del módulo del catálogo de proveedores, relativa a la raíz del Plugin, para metadatos del catálogo de proveedores con ámbito de manifiesto que pueden cargarse sin activar todo el runtime del Plugin.                  |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto, usados para cargar automáticamente el Plugin antes del runtime.                                                                                                |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este Plugin. Este es el contrato de plano de control para el futuro listado de solo lectura, onboarding, selectores de modelos, alias y supresión sin cargar el runtime del Plugin. |
| `modelPricing`                       | No          | `object`                         | Política de búsqueda de precios externos propiedad del proveedor. Úsela para excluir proveedores locales/autohospedados de catálogos de precios remotos o asignar referencias de proveedor a identificadores de catálogo de OpenRouter/LiteLLM sin codificar identificadores de proveedor en el núcleo. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de identificadores de modelo propiedad del proveedor que debe ejecutarse antes de que cargue el runtime del proveedor.                                                                                   |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el núcleo debe clasificar antes de que cargue el runtime del proveedor.                                                                 |
| `providerRequest`                    | No          | `object`                         | Metadatos económicos de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que cargue el runtime del proveedor.                                                           |
| `cliBackends`                        | No          | `string[]`                       | Identificadores de backend de inferencia de CLI propiedad de este Plugin. Se usan para la autoactivación al inicio desde referencias de configuración explícitas.                                                                    |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debe sondearse durante el descubrimiento de modelos en frío antes de que cargue el runtime.                                    |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad del Plugin incluido que representan estado de credenciales locales, OAuth o ambientales no secretas.                                                                      |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de que cargue el runtime.                                                                          |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para búsqueda de autenticación/estado del proveedor. Prefiera `setup.providers[].envVars` para nuevos Plugins; OpenClaw aún lee esto durante la ventana de obsolescencia.          |
| `providerAuthAliases`                | No          | `Record<string, string>`         | Identificadores de proveedor que deben reutilizar otro identificador de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de codificación que comparte la clave de API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos económicos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úselos para configuración de canal controlada por entorno o superficies de autenticación que los helpers genéricos de inicio/configuración deben ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos económicos de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado simple de flags de CLI.                                                                                |
| `activation`                         | No          | `object`                         | Metadatos económicos del planificador de activación para inicio, proveedor, comando, canal, ruta y carga activada por capacidades. Solo metadatos; el runtime del Plugin sigue siendo propietario del comportamiento real.          |
| `setup`                              | No          | `object`                         | Descriptores económicos de configuración/onboarding que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                     |
| `qaRunners`                          | No          | `object[]`                       | Descriptores económicos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del Plugin.                                                                                                 |
| `contracts`                          | No          | `object`                         | Instantánea estática de propiedad de capacidades para hooks de autenticación externos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, obtención web, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados económicos de comprensión de medios para identificadores de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                 |
| `imageGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de imágenes para identificadores de proveedor declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de URL base. |
| `videoGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de video para identificadores de proveedor declarados en `contracts.videoGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de URL base.  |
| `musicGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de música para identificadores de proveedor declarados en `contracts.musicGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y guardas de URL base. |
| `toolMetadata`                       | No          | `Record<string, object>`         | Metadatos económicos de disponibilidad para herramientas propiedad del Plugin declaradas en `contracts.tools`. Úselos cuando una herramienta no deba cargar el runtime salvo que existan evidencias de configuración, entorno o autenticación. |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en las superficies de descubrimiento y validación antes de que cargue el runtime.                                                                            |
| `skills`                             | No          | `string[]`                       | Directorios de Skill que cargar, relativos a la raíz del Plugin.                                                                                                                                                                    |
| `name`                               | No       | `string`                         | Nombre del Plugin legible para humanos.                                                                                                                                                                                            |
| `description`                        | No       | `string`                         | Resumen breve mostrado en las superficies de Plugin.                                                                                                                                                                               |
| `version`                            | No       | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                    |
| `uiHints`                            | No       | `Record<string, object>`         | Etiquetas de la interfaz de usuario, marcadores de posición e indicaciones de sensibilidad para campos de configuración.                                                                                                           |

## Referencia de metadatos del proveedor de generación

Los campos de metadatos del proveedor de generación describen señales de autenticación estáticas para
proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente.
OpenClaw lee estos campos antes de que se cargue el entorno de ejecución del proveedor para que las herramientas del núcleo puedan
decidir si un proveedor de generación está disponible sin importar cada
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

| Campo           | Obligatorio | Tipo       | Qué significa                                                                                                                       |
| --------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No          | `string[]` | Ids de proveedor adicionales que deben contar como alias de autenticación estáticos para el proveedor de generación.                                       |
| `authProviders` | No          | `string[]` | Ids de proveedor cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                      |
| `configSignals` | No          | `object[]` | Señales de disponibilidad baratas basadas solo en configuración para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`   | No          | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id del proveedor, `aliases` y `authProviders`.     |

Cada entrada de `configSignals` admite:

| Campo         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                           |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sí          | `string`   | Ruta de punto al objeto de configuración propiedad del Plugin que se debe inspeccionar, por ejemplo `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | No          | `string`   | Ruta de punto dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Usa esto para configuración específica de capacidad, como `image`, `video` o `music`. |
| `required`    | No          | `string[]` | Rutas de punto dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos no deben estar vacíos.                                                |
| `requiredAny` | No          | `string[]` | Rutas de punto dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                  |
| `mode`        | No          | `object`   | Guarda opcional de modo de cadena dentro de la configuración efectiva. Usa esto cuando la disponibilidad basada solo en configuración se aplica solo a un modo.                                                                |

Cada guarda de `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No          | `string`   | Ruta de punto dentro de la configuración efectiva. De forma predeterminada es `mode`.                          |
| `default`    | No          | `string`   | Valor de modo que se usa cuando la configuración omite la ruta.                                  |
| `allowed`    | No          | `string[]` | Si está presente, la señal pasa solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No          | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.       |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string` | Id de proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                                                             |
| `providerBaseUrl` | No          | `object` | Guarda opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Usa esto cuando un alias de autenticación solo es válido para ciertas API. |

Cada guarda de `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí          | `string`   | Id de configuración del proveedor cuyo `baseUrl` debe comprobarse.                                                                                                |
| `defaultBaseUrl`  | No          | `string`   | URL base que se debe asumir cuando la configuración del proveedor omite `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sí          | `string[]` | URL base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que
los metadatos del proveedor de generación, indexadas por nombre de herramienta. `contracts.tools` declara
propiedad. `toolMetadata` declara evidencia de disponibilidad barata para que OpenClaw pueda
evitar importar un entorno de ejecución de Plugin solo para que su fábrica de herramientas devuelva `null`.

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

Si una herramienta no tiene `toolMetadata`, OpenClaw conserva el comportamiento existente y
carga el Plugin propietario cuando el contrato de herramienta coincide con la política. Para herramientas de rutas críticas
cuya fábrica depende de autenticación/configuración, los autores de Plugins deben declarar
`toolMetadata` en lugar de hacer que el núcleo importe el entorno de ejecución para preguntar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el entorno de ejecución del proveedor.
Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración derivadas del descriptor
y metadatos del catálogo de instalación sin cargar el entorno de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | Id del proveedor al que pertenece esta opción.                                                                      |
| `method`              | Sí          | `string`                                        | Id del método de autenticación al que se debe despachar.                                                                           |
| `choiceId`            | Sí          | `string`                                        | Id estable de opción de autenticación usado por los flujos de incorporación y CLI.                                                  |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                                        |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                        |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos guiados por el asistente.                                       |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente mientras sigue permitiendo la selección manual por CLI.                        |
| `deprecatedChoiceIds` | No          | `string[]`                                      | Ids de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                                 |
| `groupId`             | No          | `string`                                        | Id de grupo opcional para agrupar opciones relacionadas.                                                          |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario para ese grupo.                                                                        |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                         |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos de autenticación simples de una sola bandera.                                                      |
| `cliFlag`             | No          | `string`                                        | Nombre de bandera de CLI, como `--openrouter-api-key`.                                                           |
| `cliOption`           | No          | `string`                                        | Forma completa de opción de CLI, como `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                            |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un plugin posee un nombre de comando en tiempo de ejecución que los usuarios podrían
poner por error en `plugins.allow` o intentar ejecutar como comando CLI raíz. OpenClaw
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
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este plugin.                          |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No          | `string`          | Comando CLI raíz relacionado que se sugiere para operaciones de CLI, si existe.  |

## referencia de activation

Usa `activation` cuando el plugin puede declarar de forma económica qué eventos del plano de control
deberían incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento en tiempo de ejecución, no sustituye a `register(...)` y no promete que
el código del plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los plugins candidatos antes de recurrir a los metadatos de propiedad existentes del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más acotados que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de setup o `contracts`
cuando esos campos expresen la relación. Usa `activation` para indicaciones adicionales del planificador
que no se puedan representar mediante esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de tiempo de ejecución de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
ids de harnesses de agente incrustados que aún no tengan un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento en tiempo de ejecución y no
sustituye a `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/plugin.
Los consumidores actuales lo usan como una indicación de acotación antes de una carga de plugins más amplia, por lo que
la ausencia de metadatos de activación no relacionados con el arranque normalmente solo afecta al rendimiento; no
debería cambiar la corrección mientras sigan existiendo los fallbacks de propiedad del manifiesto.

Cada plugin debería establecer `activation.onStartup` de forma intencional. Establécelo en `true`
solo cuando el plugin deba ejecutarse durante el arranque del Gateway. Establécelo en `false` cuando
el plugin esté inerte al arrancar y deba cargarse solo desde activadores más acotados.
Omitir `onStartup` ya no carga implícitamente el plugin al arrancar; usa metadatos de
activación explícitos para activadores de arranque, canal, configuración, harness de agente, memoria u
otros activadores de activación más acotados.

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
| `onStartup`        | No          | `boolean`                                            | Activación explícita al arrancar el Gateway. Cada plugin debería establecerlo. `true` importa el plugin durante el arranque; `false` lo mantiene diferido al arranque salvo que otro activador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Ids de proveedores que deberían incluir este plugin en planes de activación/carga.                                                                                                         |
| `onAgentHarnesses` | No          | `string[]`                                           | Ids de tiempo de ejecución de harnesses de agente incrustados que deberían incluir este plugin en planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI. |
| `onCommands`       | No          | `string[]`                                           | Ids de comandos que deberían incluir este plugin en planes de activación/carga.                                                                                                            |
| `onChannels`       | No          | `string[]`                                           | Ids de canales que deberían incluir este plugin en planes de activación/carga.                                                                                                             |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deberían incluir este plugin en planes de activación/carga.                                                                                                             |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deberían incluir este plugin en planes de arranque/carga cuando la ruta esté presente y no esté deshabilitada explícitamente.                                                      |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más acotados cuando sea posible.                                                                                     |

Consumidores activos actuales:

- La planificación de arranque del Gateway usa `activation.onStartup` para una importación
  explícita al arranque
- La planificación de CLI activada por comandos recurre a los campos heredados
  `commandAliases[].cliCommand` o `commandAliases[].name`
- La planificación de arranque del tiempo de ejecución del agente usa `activation.onAgentHarnesses` para
  harnesses incrustados y `cliBackends[]` de nivel superior para alias de tiempo de ejecución de CLI
- La planificación de setup/canal activada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- La planificación de plugins al arranque usa `activation.onConfigPaths` para superficies de configuración
  raíz que no son de canal, como el bloque `browser` del plugin de navegador incluido
- La planificación de setup/tiempo de ejecución activada por proveedor recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de
  activación de proveedor

Los diagnósticos del planificador pueden distinguir indicaciones de activación explícitas del fallback de
propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó en su lugar la propiedad de `commandAliases`. Estas etiquetas de motivo son para
diagnósticos y pruebas del host; los autores de plugins deberían seguir declarando los metadatos
que mejor describan la propiedad.

## referencia de qaRunners

Usa `qaRunners` cuando un plugin contribuye uno o más runners de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el tiempo de ejecución
del plugin sigue siendo responsable del registro real de CLI mediante una superficie ligera
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
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.       |
| `description` | No          | `string` | Texto de ayuda de fallback usado cuando el host compartido necesita un comando stub. |

## referencia de setup

Usa `setup` cuando las superficies de setup y onboarding necesitan metadatos económicos propiedad del plugin
antes de que se cargue el tiempo de ejecución.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia de CLI.
`setup.cliBackends` es la superficie de descriptor específica de setup para
flujos de plano de control/setup que deberían permanecer solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda
basada primero en descriptores para el descubrimiento de setup. Si el descriptor solo
reduce el plugin candidato y el setup aún necesita hooks de tiempo de setup más completos,
establece `requiresRuntime: true` y mantén `setup-api` como
ruta de ejecución de fallback.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y
variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
durante la ventana de obsolescencia, pero los plugins no incluidos que aún lo usan
reciben un diagnóstico de manifiesto. Los plugins nuevos deberían poner los metadatos de entorno de setup/estado
en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de setup desde `setup.providers[].authMethods`
cuando no hay una entrada de setup disponible, o cuando `setup.requiresRuntime: false`
declara que el tiempo de ejecución de setup no es necesario. Las entradas explícitas `providerAuthChoices` siguen
siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de onboarding y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la
superficie de setup. OpenClaw trata el `false` explícito como un contrato solo de descriptores
y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de setup. Si
un plugin solo de descriptores aún incluye una de esas entradas de tiempo de ejecución de setup,
OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir
`requiresRuntime` mantiene el comportamiento de fallback heredado para que los plugins existentes que agregaron
descriptores sin el flag no se rompan.

Como la búsqueda de setup puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de
`setup.providers[].id` y `setup.cliBackends[]` deben permanecer únicos entre los
plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

Cuando el tiempo de ejecución de setup sí se ejecuta, los diagnósticos del registro de setup informan desviación de descriptores
si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto
no declaran, o si un descriptor no tiene registro de tiempo de ejecución
coincidente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí          | `string`   | Id de proveedor expuesto durante setup u onboarding. Mantén los ids normalizados globalmente únicos. |
| `authMethods`  | No          | `string[]` | Ids de métodos de setup/autenticación que este proveedor admite sin cargar el tiempo de ejecución completo. |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de setup/estado pueden comprobar antes de que cargue el tiempo de ejecución del plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones económicas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que se pueden
verificar sin cargar código de tiempo de ejecución. Estas comprobaciones deben seguir siendo baratas y locales:
sin llamadas de red, sin lecturas de llavero ni de gestores de secretos, sin comandos de shell y sin
sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                            |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita de archivo de credenciales.                                |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacía. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una de las variables de entorno listadas debe no estar vacía para que la evidencia sea válida.        |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida.                |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario para la salida de autenticación/estado.                            |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                         |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación.   |
| `cliBackends`      | No          | `string[]` | Ids de backends en tiempo de configuración usados para la búsqueda de configuración descriptor-first. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de setup de este plugin.                  |
| `requiresRuntime`  | No          | `boolean`  | Si setup todavía necesita la ejecución de `setup-api` después de la búsqueda de descriptores.          |

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

| Campo         | Tipo       | Qué significa                              |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas de UI opcionales.                |
| `advanced`    | `boolean`  | Marca el campo como avanzado.              |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.    |
| `placeholder` | `string`   | Texto de marcador para entradas de formulario. |

## Referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el tiempo de ejecución del plugin.

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
| `agentToolResultMiddleware`      | `string[]` | Ids de tiempo de ejecución para los que un plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedores cuyo hook de perfil de autenticación externa es propiedad de este plugin. |
| `speechProviders`                | `string[]` | Ids de proveedores de voz propiedad de este plugin.                   |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real propiedad de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real propiedad de este plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedores de embeddings de memoria propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de comprensión de medios propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video propiedad de este plugin.   |
| `webFetchProviders`              | `string[]` | Ids de proveedores de web-fetch propiedad de este plugin.             |
| `webSearchProviders`             | `string[]` | Ids de proveedores de web-search propiedad de este plugin.            |
| `migrationProviders`             | `string[]` | Ids de proveedores de importación propiedad de este plugin para `openclaw migrate`. |
| `tools`                          | `string[]` | Nombres de herramientas de agente propiedad de este plugin.           |

`contracts.embeddedExtensionFactories` se conserva para fábricas de extensiones incluidas
solo del servidor de aplicaciones de Codex. Las transformaciones incluidas de resultados de herramientas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los plugins externos no pueden
registrar middleware de resultados de herramientas porque la costura puede reescribir salidas de herramientas
de alta confianza antes de que el modelo las vea.

Los registros de tiempo de ejecución `api.registerTool(...)` deben coincidir con `contracts.tools`.
La detección de herramientas usa esta lista para cargar solo los tiempos de ejecución de plugins que pueden ser propietarios de las
herramientas solicitadas.

Los plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los plugins sin la declaración todavía se ejecutan
mediante una alternativa de compatibilidad obsoleta, pero esa alternativa es más lenta y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas de CLI independientes usan este contrato de manifiesto
para cargar solo el plugin propietario antes de que el tiempo de ejecución completo del Gateway haya
registrado proveedores.

## Referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tenga
modelos predeterminados, prioridad de alternativa de autenticación automática o compatibilidad nativa con documentos que
los ayudantes genéricos del núcleo necesiten antes de que se cargue el tiempo de ejecución. Las claves también deben declararse en
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de medios expuestas por este proveedor.                          |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para la alternativa automática de proveedor basada en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documento nativas admitidas por el proveedor.                     |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un plugin de canal necesite metadatos de configuración baratos antes de que
se cargue el tiempo de ejecución. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no hay ninguna entrada de setup disponible, o
cuando `setup.requiresRuntime: false` declara que el tiempo de ejecución de setup no es necesario.

`channelConfigs` son metadatos de manifiesto del plugin, no una nueva sección de configuración de usuario
de nivel superior. Los usuarios todavía configuran instancias de canal en `channels.<channel-id>`.
OpenClaw lee los metadatos del manifiesto para decidir qué plugin es propietario de ese canal
configurado antes de que se ejecute el código de tiempo de ejecución del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaran `channels[]` también deben declarar entradas
`channelConfigs` coincidentes. Sin ellas, OpenClaw todavía puede cargar el plugin, pero
las superficies de esquema de configuración de ruta fría, setup y UI de Control no pueden conocer la
forma de las opciones propiedad del canal hasta que se ejecute el tiempo de ejecución del plugin.

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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada.         |
| `uiHints`     | `Record<string, object>` | Etiquetas/marcadores de posición/indicaciones de sensibilidad opcionales de la interfaz para esa sección de configuración de canal.          |
| `label`       | `string`                 | Etiqueta del canal combinada en las superficies de selector e inspección cuando los metadatos de runtime aún no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al runtime.       |
| `preferOver`  | `string[]`               | Ids de plugins heredados o de menor prioridad que este canal debe superar en las superficies de selección.    |

### Reemplazo de otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido para un id de canal que
otro Plugin también puede proporcionar. Los casos comunes son un id de Plugin renombrado, un
Plugin independiente que sustituye a un Plugin incluido, o una bifurcación mantenida que
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
el id de Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque
está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la
configuración efectiva de runtime para que un Plugin sea propietario del canal y sus herramientas. La selección explícita del usuario
sigue prevaleciendo: si el usuario habilita explícitamente ambos plugins, OpenClaw
conserva esa elección y reporta diagnósticos de canales/herramientas duplicados en lugar de
cambiar silenciosamente el conjunto de plugins solicitado.

Mantén `preferOver` limitado a ids de plugins que realmente puedan proporcionar el mismo canal.
No es un campo de prioridad general y no renombra las claves de configuración del usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que cargue el runtime
del Plugin.

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
- si un Plugin no incluido y un Plugin incluido coinciden, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos que se comparan con `startsWith` contra ids de modelo abreviados.                 |
| `modelPatterns` | `string[]` | Fuentes regex comparadas contra ids de modelo abreviados tras eliminar el sufijo de perfil. |

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de
cargar el runtime del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo
fijas, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización en runtime
sigue perteneciendo al código de runtime del proveedor, pero el manifiesto indica al núcleo cuándo se requiere el runtime.

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
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por una razón específica del proveedor.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse de metadatos del manifiesto, actualizarse en caché o requiere runtime. |

`aliases` participa en la búsqueda de propiedad de proveedor para la planificación de catálogos de modelos.
Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una
lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y
aplicar sobrescrituras de API/URL base del alias sin cargar el runtime del proveedor.
Los alias no expanden los listados de catálogo sin filtrar; las listas amplias emiten solo
las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook de runtime de proveedor `suppressBuiltInModel`.
Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o
se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión
de runtime ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor.    |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.      |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin un `id` se ignoran.            |

Campos del modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`          | `string`                                                       | Nombre de visualización opcional.                                                      |
| `api`           | `ModelApi`                                                     | Sobrescritura opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Sobrescritura opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                               |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                               |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto en runtime cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de salida cuando se conoce.                                           |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores opcionales de compatibilidad que coinciden con la compatibilidad de configuración de modelos de OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprime solo cuando la fila no debe aparecer en absoluto.          |
| `statusReason`  | `string`                                                       | Razón opcional mostrada con estado no disponible.                            |
| `replaces`      | `string[]`                                                     | Ids de modelo locales del proveedor más antiguos que este modelo reemplaza.                       |
| `replacedBy`    | `string`                                                       | Id de modelo local del proveedor de reemplazo para filas obsoletas.                    |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id de proveedor para la fila ascendente que se va a suprimir. Debe ser propiedad de este Plugin o declararse como un alias propio. |
| `model`                    | `string`   | Id de modelo local del proveedor que se va a suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efectivos del proveedor requeridos antes de que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración de proveedor requeridos antes de que se aplique la supresión.              |

No pongas datos exclusivos de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las
filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor y de selector omitan el
descubrimiento del registro/tiempo de ejecución. Usa `refreshable` cuando las filas del manifiesto sean semillas
listables útiles o complementos, pero una actualización/caché pueda agregar más filas más adelante;
las filas actualizables no son autoritativas por sí solas. Usa `runtime` cuando OpenClaw
deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza económica de id de modelo propiedad del proveedor que debe
ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres de modelo
cortos, id heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto
del Plugin propietario, en lugar de en tablas centrales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de id de modelo que no distinguen mayúsculas/minúsculas. Los valores se devuelven como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se deben quitar antes de la búsqueda de alias, útiles para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se debe agregar cuando el id de modelo normalizado aún no contiene `/`.      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para id sin prefijo después de la búsqueda de alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes
debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo propietario del significado de cada
`endpointClass`; los manifiestos de Plugin son propietarios de los metadatos de host y URL base.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                 |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint conocida por el núcleo, como `openrouter`, `moonshot-native` o `google-vertex`. |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Anteponer `.` para coincidencia solo de sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                  |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                 |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se debe quitar de los hosts coincidentes para exponer el prefijo de región de Google Vertex. |

## Referencia de providerRequest

Usa `providerRequest` para metadatos económicos de compatibilidad de solicitudes que la política
genérica de solicitudes necesita sin cargar el tiempo de ejecución del proveedor. Mantén la reescritura de cargas
específica del comportamiento en hooks del tiempo de ejecución del proveedor o en helpers compartidos de familia de proveedores.

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
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de familia de proveedor para helpers compartidos de solicitudes. |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesita comportamiento de precios del plano de control antes de que
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

| Campo        | Tipo              | Qué significa                                                                                     |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Define `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter ni LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda en OpenRouter para este proveedor. |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda en LiteLLM para este proveedor. |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                       |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de proveedor del catálogo externo cuando difiere del id de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata id de modelo que contienen barra como referencias anidadas proveedor/modelo, útil para proveedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id de modelo del catálogo externo. `version-dots` prueba id de versión con puntos como `claude-opus-4.6`. |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw son metadatos de vista previa propiedad de OpenClaw para proveedores
cuyos plugins quizá aún no estén instalados. No forma parte de un manifiesto de Plugin.
Los manifiestos de Plugin siguen siendo la autoridad de plugins instalados. El Índice de proveedores es
el contrato interno de reserva que las futuras superficies de proveedores instalables y de selector de modelos
previas a la instalación consumirán cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración de usuario.
2. `modelCatalog` del manifiesto del Plugin instalado.
3. Caché del catálogo de modelos procedente de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de tiempo de ejecución ni
datos de modelos en vivo específicos de una cuenta. Sus catálogos de vista previa usan la misma forma de fila
de proveedor de `modelCatalog` que los manifiestos de Plugin, pero deben limitarse
a metadatos de visualización estables salvo que campos del adaptador de tiempo de ejecución como `api`,
`baseUrl`, precios o indicadores de compatibilidad se mantengan alineados intencionalmente con
el manifiesto del Plugin instalado. Los proveedores con descubrimiento en vivo de `/models` deben
escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos, en lugar de
hacer que la lista normal o el onboarding llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores
cuyo Plugin se haya movido fuera del núcleo o que aún no esté instalado. Estos
metadatos reflejan el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación de npm,
la integridad esperada y las etiquetas económicas de elección de autenticación bastan para mostrar una
opción de configuración instalable. Una vez instalado el Plugin, su manifiesto gana y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidad heredadas de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad de
capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Úsalo para                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación e indicaciones de UI que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, control de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde un fragmento de metadatos, usa esta regla:

- si OpenClaw debe conocerlo antes de cargar código del Plugin, ponlo en `openclaw.plugin.json`
- si se trata de empaquetado, archivos de entrada o comportamiento de instalación de npm, ponlo en `package.json`

### Campos de package.json que afectan el descubrimiento

Algunos metadatos de Plugin previos al tiempo de ejecución viven intencionalmente en `package.json` bajo el
bloque `openclaw` en lugar de en `openclaw.plugin.json`.
`openclaw.bundle` y `openclaw.bundle.json` no son contratos de Plugin de OpenClaw;
los plugins nativos deben usar `openclaw.plugin.json` más los campos compatibles de
`package.json#openclaw` a continuación.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada nativos de Plugin. Debe permanecer dentro del directorio del paquete del Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo de configuración usado durante la incorporación, el inicio diferido de canales y la detección de estado de canal de solo lectura/SecretRef. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del Plugin.                         |
| `openclaw.channel`                                                                         | Metadatos económicos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comando nativo y valores predeterminados automáticos de Skills nativas usados por las superficies de configuración, auditoría y lista de comandos antes de que se cargue el runtime del canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por env?" sin cargar todo el runtime del canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder "¿hay algo ya con sesión iniciada?" sin cargar todo el runtime del canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Pistas de instalación/actualización para plugins incluidos y publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host de OpenClaw, usando un límite inferior semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad dist esperada de npm, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta estrecha de recuperación mediante reinstalación de Plugin incluido cuando la configuración no es válida.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies de canal solo de configuración se carguen antes del Plugin de canal completo durante el inicio.                                                                                                 |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en la
incorporación antes de que se cargue el runtime. `package.json#openclaw.install` indica a la
incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las pistas de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos para fuentes de Plugin no incluidas. Los valores no válidos se rechazan;
los valores más recientes pero válidos omiten plugins externos en hosts antiguos. Se asume que los
plugins de origen incluidos están versionados conjuntamente con el checkout del host.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el Plugin se
publique en ClawHub; la incorporación lo trata como la fuente remota preferida y
registra los datos del artefacto de ClawHub después de la instalación. `npmSpec` sigue siendo la alternativa
de compatibilidad para paquetes que aún no se han movido a ClawHub.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
cerrados si el artefacto npm obtenido ya no coincide con la versión fijada.
La incorporación interactiva aún ofrece especificaciones npm de registros de confianza, incluidos nombres
de paquete desnudos y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir fuentes exactas, flotantes, fijadas por integridad, sin integridad, con discrepancia de nombre
de paquete y de opción predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización lo aplican; cuando se omite, la resolución del registro se
registra sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando las búsquedas de estado, lista de canales
o SecretRef necesiten identificar cuentas configuradas sin cargar todo el
runtime. La entrada de configuración debe exponer metadatos de canal más adaptadores de configuración,
estado y secretos seguros para configuración; mantén los clientes de red, los listeners de Gateway y los
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límite de paquete para los campos
de punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una
ruta `openclaw.extensions` que escape sea cargable.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente estrecho. No
hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos obsoletos de actualización de Plugin incluido, como una
ruta de Plugin incluido faltante o una entrada `channels.<id>` obsoleta para ese mismo
Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un pequeño módulo
comprobador:

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
económica de autenticación sí/no antes de que se cargue el Plugin de canal completo. El estado de autenticación persistida
no es estado de canal configurado: no uses estos metadatos para habilitar plugins automáticamente,
reparar dependencias de runtime ni decidir si debe cargarse un runtime de canal.
La exportación de destino debe ser una función pequeña que solo lea estado persistido; no la
encamines a través del barrel completo del runtime de canal.

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

Úsalo cuando un canal pueda responder el estado configurado desde env u otras entradas pequeñas
no de runtime. Si la comprobación necesita resolución completa de configuración o el verdadero
runtime de canal, mantén esa lógica en el hook `config.hasConfiguredState`
del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, workspace, rutas seleccionadas explícitamente por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins enviados con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins descubiertos en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin incluido ubicada en el workspace no ensombrecerá la compilación incluida.
- Para sobrescribir realmente un Plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del workspace.
- Los descartes duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las sobrescrituras duplicadas seleccionadas por configuración se redactan como sobrescrituras explícitas en los diagnósticos, pero aun así advierten para que las bifurcaciones obsoletas y los ensombrecimientos accidentales sigan visibles.

## Requisitos de JSON Schema

- **Todo Plugin debe distribuir un JSON Schema**, incluso si no acepta configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de configuración, no en runtime.
- Al extender o bifurcar un Plugin incluido con nuevas claves de configuración, actualiza también el `configSchema` de `openclaw.plugin.json` de ese Plugin. Los esquemas de plugins incluidos son estrictos, por lo que añadir `plugins.entries.<id>.config.myNewKey` en la configuración de usuario sin añadir `myNewKey` a `configSchema.properties` se rechazará antes de que se cargue el runtime del Plugin.

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
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de Plugin **descubribles**. Los ids desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del Plugin.
- Si existe configuración de Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + logs.

Consulta la [referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto es solo para descubrimiento y validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- `providerCatalogEntry` debe mantenerse ligero y no debería importar código amplio del entorno de ejecución; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento acotados, no para ejecución en tiempo de solicitud. `providerDiscoveryEntry` es la grafía heredada y sigue funcionando para plugins existentes.
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valor predeterminado `legacy`).
- Declara el tipo exclusivo de plugin en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de ejecución está obsoleto y permanece solo como alternativa de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el elemento obsoleto `providerAuthEnvVars` y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega de cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de configuración en ejecución que requieren código del proveedor, consulta [hooks de ejecución de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm + `pnpm rebuild <package>`).

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
