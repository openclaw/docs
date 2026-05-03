---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto de Plugin nativo de OpenClaw**.

Para diseños de paquetes compatibles, consulta [paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin un manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de
`settings.json` del paquete de Claude, los valores predeterminados de LSP del paquete de Claude
y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del
runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos faltantes o no válidos se tratan como
errores de Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar tu
código del Plugin**. Todo lo siguiente debe ser lo bastante ligero para inspeccionarse sin iniciar
el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración y sugerencias de interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal combinados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento de runtime, declarar puntos de entrada de código
o metadatos de instalación de npm. Eso corresponde a tu código del Plugin y a `package.json`.

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
| `id`                                 | Sí          | `string`                         | Id canónico del Plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                              |
| `enabledByDefaultOnPlatforms`        | No          | `string[]`                       | Marca un Plugin incluido como habilitado de forma predeterminada solo en las plataformas Node.js indicadas, por ejemplo `["darwin"]`. La configuración explícita sigue teniendo prioridad.                                         |
| `legacyPluginIds`                    | No          | `string[]`                       | Ids heredados que se normalizan a este id canónico del Plugin.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | Ids de proveedores que deberían habilitar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                           |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | No          | `string[]`                       | Ids de canales propiedad de este Plugin. Se usa para descubrimiento y validación de configuración.                                                                                                                                  |
| `providers`                          | No          | `string[]`                       | Ids de proveedores propiedad de este Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | No          | `string`                         | Ruta ligera del módulo de descubrimiento de proveedores, relativa a la raíz del Plugin, para metadatos de catálogo de proveedores con ámbito de manifiesto que pueden cargarse sin activar todo el runtime del Plugin.              |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto usados para cargar automáticamente el Plugin antes del runtime.                                                                                                |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este Plugin. Este es el contrato del plano de control para futuras listas de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el runtime del Plugin. |
| `modelPricing`                       | No          | `object`                         | Política de búsqueda de precios externa propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o mapear referencias de proveedor a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedor en el núcleo. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de id de modelo propiedad del proveedor que debe ejecutarse antes de cargar el runtime del proveedor.                                                                                                    |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el núcleo debe clasificar antes de cargar el runtime del proveedor.                                                                     |
| `providerRequest`                    | No          | `object`                         | Metadatos económicos de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de cargar el runtime del proveedor.                                                               |
| `cliBackends`                        | No          | `string[]`                       | Ids de backends de inferencia de CLI propiedad de este Plugin. Se usa para la autoactivación en el inicio desde referencias explícitas de configuración.                                                                            |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debe sondearse durante el descubrimiento de modelos en frío antes de cargar el runtime.                                        |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad del Plugin incluido que representan estado de credenciales locales, OAuth o ambientales no secretas.                                                                     |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este Plugin que deberían producir diagnósticos de configuración y CLI conscientes del Plugin antes de cargar el runtime.                                                                           |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para búsqueda de autenticación/estado de proveedores. Prefiere `setup.providers[].envVars` para Plugins nuevos; OpenClaw aún lo lee durante la ventana de obsolescencia.          |
| `providerAuthAliases`                | No          | `Record<string, string>`         | Ids de proveedores que deberían reutilizar otro id de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base.       |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos económicos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalos para configuración de canales impulsada por entorno o superficies de autenticación que deberían ver los helpers genéricos de inicio/configuración. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos económicos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI.                                                                            |
| `activation`                         | No          | `object`                         | Metadatos económicos del planificador de activación para cargas disparadas por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin sigue siendo propietario del comportamiento real.        |
| `setup`                              | No          | `object`                         | Descriptores económicos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                 |
| `qaRunners`                          | No          | `object[]`                       | Descriptores económicos de ejecutores de QA usados por el host compartido `openclaw qa` antes de cargar el runtime del Plugin.                                                                                                     |
| `contracts`                          | No          | `object`                         | Instantánea estática de propiedad de capacidades para hooks de autenticación externa, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, obtención web, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados económicos de comprensión de medios para ids de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                          |
| `imageGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de imágenes para ids de proveedores declarados en `contracts.imageGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.   |
| `videoGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de video para ids de proveedores declarados en `contracts.videoGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.      |
| `musicGenerationProviderMetadata`    | No          | `Record<string, object>`         | Metadatos económicos de autenticación de generación de música para ids de proveedores declarados en `contracts.musicGenerationProviders`, incluidos alias de autenticación propiedad del proveedor y protecciones de URL base.     |
| `toolMetadata`                       | No          | `Record<string, object>`         | Metadatos económicos de disponibilidad para herramientas propiedad del Plugin declaradas en `contracts.tools`. Úsalos cuando una herramienta no debería cargar el runtime salvo que exista evidencia de configuración, entorno o autenticación. |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en las superficies de descubrimiento y validación antes de cargar el runtime.                                                                                |
| `skills`                             | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del Plugin.                                                                                                                                                              |
| `name`                               | No       | `string`                         | Nombre de Plugin legible para humanos.                                                                                                                                                                                              |
| `description`                        | No       | `string`                         | Resumen breve mostrado en las superficies del Plugin.                                                                                                                                                                               |
| `version`                            | No       | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | No       | `Record<string, object>`         | Etiquetas de interfaz de usuario, marcadores de posición y sugerencias de sensibilidad para campos de configuración.                                                                                                                |

## Referencia de metadatos de proveedores de generación

Los campos de metadatos de proveedores de generación describen señales de autenticación estáticas para
proveedores declarados en la lista `contracts.*GenerationProviders` correspondiente.
OpenClaw lee estos campos antes de que se cargue el runtime del proveedor para que las herramientas del núcleo puedan
decidir si un proveedor de generación está disponible sin importar cada
Plugin de proveedor.

Usa estos campos solo para hechos declarativos y baratos. El transporte, las transformaciones de solicitudes,
la renovación de tokens, la validación de credenciales y el comportamiento real de generación
permanecen en el runtime del Plugin.

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
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No       | `string[]` | Ids de proveedores adicionales que deben contar como alias de autenticación estáticos para el proveedor de generación.                                       |
| `authProviders` | No       | `string[]` | Ids de proveedores cuyos perfiles de autenticación configurados deben contar como autenticación para este proveedor de generación.                                      |
| `configSignals` | No       | `object[]` | Señales de disponibilidad baratas, solo de configuración, para proveedores locales o autoalojados que pueden configurarse sin perfiles de autenticación ni variables de entorno. |
| `authSignals`   | No       | `object[]` | Señales de autenticación explícitas. Cuando están presentes, reemplazan el conjunto de señales predeterminado del id del proveedor, `aliases` y `authProviders`.     |

Cada entrada de `configSignals` admite:

| Campo         | Obligatorio | Tipo       | Qué significa                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sí      | `string`   | Ruta con puntos al objeto de configuración propiedad del Plugin que se debe inspeccionar, por ejemplo `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | No       | `string`   | Ruta con puntos dentro de la configuración raíz cuyo objeto debe superponerse al objeto raíz antes de evaluar la señal. Usa esto para configuración específica de una capacidad, como `image`, `video` o `music`. |
| `required`    | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva que deben tener valores configurados. Las cadenas no deben estar vacías; los objetos y arreglos no deben estar vacíos.                                                |
| `requiredAny` | No       | `string[]` | Rutas con puntos dentro de la configuración efectiva donde al menos una debe tener un valor configurado.                                                                                                  |
| `mode`        | No       | `object`   | Guarda opcional de modo de cadena dentro de la configuración efectiva. Usa esto cuando la disponibilidad solo por configuración aplica únicamente a un modo.                                                                |

Cada guarda `mode` admite:

| Campo        | Obligatorio | Tipo       | Qué significa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Ruta con puntos dentro de la configuración efectiva. El valor predeterminado es `mode`.                          |
| `default`    | No       | `string`   | Valor de modo que se usa cuando la configuración omite la ruta.                                  |
| `allowed`    | No       | `string[]` | Si está presente, la señal pasa solo cuando el modo efectivo es uno de estos valores. |
| `disallowed` | No       | `string[]` | Si está presente, la señal falla cuando el modo efectivo es uno de estos valores.       |

Cada entrada de `authSignals` admite:

| Campo             | Obligatorio | Tipo     | Qué significa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string` | Id del proveedor que se debe comprobar en los perfiles de autenticación configurados.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Guarda opcional que hace que la señal cuente solo cuando el proveedor configurado referenciado usa una URL base permitida. Usa esto cuando un alias de autenticación solo es válido para ciertas API. |

Cada guarda `providerBaseUrl` admite:

| Campo             | Obligatorio | Tipo       | Qué significa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sí      | `string`   | Id de configuración del proveedor cuyo `baseUrl` se debe comprobar.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL base que se debe asumir cuando la configuración del proveedor omite `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sí      | `string[]` | URLs base permitidas para esta señal de autenticación. La señal se ignora cuando la URL base configurada o predeterminada no coincide con uno de estos valores normalizados. |

## Referencia de metadatos de herramientas

`toolMetadata` usa las mismas formas de `configSignals` y `authSignals` que los
metadatos de proveedores de generación, indexadas por nombre de herramienta. `contracts.tools` declara
la propiedad. `toolMetadata` declara evidencia barata de disponibilidad para que OpenClaw pueda
evitar importar un runtime de Plugin solo para que su fábrica de herramientas devuelva `null`.

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
carga el Plugin propietario cuando el contrato de la herramienta coincide con la política. Para herramientas de ruta crítica
cuya fábrica depende de autenticación/configuración, los autores de plugins deben declarar
`toolMetadata` en lugar de hacer que el núcleo importe el runtime para preguntar.

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el runtime del proveedor.
Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración
derivadas de descriptores y metadatos del catálogo de instalación sin cargar el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí      | `string`                                        | Id del proveedor al que pertenece esta opción.                                                                      |
| `method`              | Sí      | `string`                                        | Id del método de autenticación al que despachar.                                                                           |
| `choiceId`            | Sí      | `string`                                        | Id estable de opción de autenticación usado por flujos de incorporación y CLI.                                                  |
| `choiceLabel`         | No       | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                                        |
| `choiceHint`          | No       | `string`                                        | Texto breve de ayuda para el selector.                                                                        |
| `assistantPriority`   | No       | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos impulsados por el asistente.                                       |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual por CLI.                        |
| `deprecatedChoiceIds` | No       | `string[]`                                      | Ids de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                                 |
| `groupId`             | No       | `string`                                        | Id de grupo opcional para agrupar opciones relacionadas.                                                          |
| `groupLabel`          | No       | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                                        |
| `groupHint`           | No       | `string`                                        | Texto breve de ayuda para el grupo.                                                                         |
| `optionKey`           | No       | `string`                                        | Clave de opción interna para flujos de autenticación simples de una sola marca.                                                      |
| `cliFlag`             | No       | `string`                                        | Nombre de la marca CLI, como `--openrouter-api-key`.                                                           |
| `cliOption`           | No       | `string`                                        | Forma completa de la opción CLI, como `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No       | `string`                                        | Descripción usada en la ayuda de CLI.                                                                            |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

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
| `kind`       | No          | `"runtime-slash"` | Marca el alias como comando slash de chat en lugar de comando CLI raíz. |
| `cliCommand` | No          | `string`          | Comando CLI raíz relacionado que se sugiere para operaciones de CLI, si existe alguno.  |

## referencia de activation

Usa `activation` cuando el plugin puede declarar de forma económica qué eventos del plano de control
deberían incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento en tiempo de ejecución, no sustituye a `register(...)` y no promete que
el código del plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los plugins candidatos antes de recurrir a metadatos existentes de propiedad del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más específicos que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de setup o `contracts`
cuando esos campos expresen la relación. Usa `activation` para indicios adicionales del planificador
que no puedan representarse con esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de tiempo de ejecución de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
ids de arneses de agente integrados que aún no tengan un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento en tiempo de ejecución y no
sustituye a `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/plugin.
Los consumidores actuales lo usan como indicio de reducción antes de una carga de plugins más amplia, por lo que
la falta de metadatos de activación que no sean de arranque normalmente solo afecta al rendimiento; no
debería cambiar la corrección mientras sigan existiendo las alternativas de propiedad del manifiesto.

Cada plugin debería definir `activation.onStartup` de forma intencionada. Establécelo en `true`
solo cuando el plugin deba ejecutarse durante el arranque del Gateway. Establécelo en `false` cuando
el plugin esté inerte al arrancar y deba cargarse solo desde disparadores más específicos.
Omitir `onStartup` ya no carga implícitamente el plugin al arrancar; usa metadatos
de activación explícitos para arranque, canal, configuración, arnés de agente, memoria u
otros disparadores de activación más específicos.

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
| `onStartup`        | No          | `boolean`                                            | Activación explícita al arrancar el Gateway. Cada plugin debería definir esto. `true` importa el plugin durante el arranque; `false` lo mantiene diferido al arranque salvo que otro disparador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Ids de proveedores que deberían incluir este plugin en planes de activación/carga.                                                                                                                      |
| `onAgentHarnesses` | No          | `string[]`                                           | Ids de tiempo de ejecución de arneses de agente integrados que deberían incluir este plugin en planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI.                                           |
| `onCommands`       | No          | `string[]`                                           | Ids de comandos que deberían incluir este plugin en planes de activación/carga.                                                                                                                       |
| `onChannels`       | No          | `string[]`                                           | Ids de canales que deberían incluir este plugin en planes de activación/carga.                                                                                                                       |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deberían incluir este plugin en planes de activación/carga.                                                                                                                       |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deberían incluir este plugin en planes de arranque/carga cuando la ruta esté presente y no esté deshabilitada explícitamente.                                                      |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicios amplios de capacidad usados por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible.                                                                                     |

Consumidores activos actuales:

- La planificación de arranque del Gateway usa `activation.onStartup` para la importación
  explícita al arrancar
- la planificación de CLI disparada por comandos recurre al legado
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de arranque del tiempo de ejecución de agente usa `activation.onAgentHarnesses` para
  arneses integrados y `cliBackends[]` de nivel superior para alias de tiempo de ejecución de CLI
- la planificación de setup/canal disparada por canal recurre a la propiedad heredada de `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de plugins de arranque usa `activation.onConfigPaths` para superficies de configuración raíz
  que no son de canal, como el bloque `browser` del plugin de navegador incluido
- la planificación de setup/tiempo de ejecución disparada por proveedor recurre a la propiedad heredada de
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de
  activación de proveedor

Los diagnósticos del planificador pueden distinguir indicios de activación explícitos de alternativas de
propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó la propiedad de `commandAliases` en su lugar. Estas etiquetas de razón son para
diagnósticos del host y pruebas; los autores de plugins deberían seguir declarando los metadatos
que mejor describan la propiedad.

## referencia de qaRunners

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo
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
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.       |
| `description` | No          | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando auxiliar. |

## referencia de setup

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos económicos
propiedad del plugin antes de que cargue el tiempo de ejecución.

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
de CLI. `setup.cliBackends` es la superficie de descriptor específica de setup para
flujos de plano de control/setup que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida
de búsqueda con descriptores primero para el descubrimiento de setup. Si el descriptor solo
reduce el plugin candidato y setup aún necesita hooks de tiempo de setup más ricos,
establece `requiresRuntime: true` y mantén `setup-api` como
ruta de ejecución alternativa.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y
variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
durante la ventana de obsolescencia, pero los plugins no incluidos que aún lo usen
reciben un diagnóstico de manifiesto. Los plugins nuevos deberían poner los metadatos de entorno de setup/estado
en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de setup desde `setup.providers[].authMethods`
cuando no hay una entrada de setup disponible, o cuando `setup.requiresRuntime: false`
declara que el tiempo de ejecución de setup no es necesario. Las entradas explícitas de `providerAuthChoices` siguen
siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de incorporación y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la
superficie de setup. OpenClaw trata `false` explícito como un contrato solo de descriptores
y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de setup. Si
un plugin solo de descriptores aún incluye una de esas entradas de tiempo de ejecución de setup,
OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir
`requiresRuntime` conserva el comportamiento alternativo heredado para que los plugins existentes que añadieron
descriptores sin el flag no se rompan.

Como la búsqueda de setup puede ejecutar código `setup-api` propiedad del plugin, los valores
normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben permanecer únicos entre
los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

Cuando el tiempo de ejecución de setup sí se ejecuta, los diagnósticos del registro de setup informan desviación de descriptores
si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto
no declaran, o si un descriptor no tiene registro de tiempo de ejecución
coincidente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí          | `string`   | Id de proveedor expuesto durante setup o incorporación. Mantén los ids normalizados globalmente únicos.             |
| `authMethods`  | No          | `string[]` | Ids de métodos de setup/autenticación que este proveedor admite sin cargar el tiempo de ejecución completo.                       |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de setup/estado pueden comprobar antes de que cargue el tiempo de ejecución del plugin.               |
| `authEvidence` | No          | `object[]` | Comprobaciones económicas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` sirve para marcadores locales de credenciales propiedad del proveedor que se pueden
verificar sin cargar código de runtime. Estas comprobaciones deben seguir siendo baratas y locales:
sin llamadas de red, sin lecturas de llavero o gestor de secretos, sin comandos de shell y sin
sondeos de API del proveedor.

Entradas de evidencia compatibles:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                             |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita al archivo de credenciales.                                |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacío. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una de las variables de entorno listadas debe no estar vacía para que la evidencia sea válida.        |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida.                |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto que se devuelve cuando la evidencia está presente.                                         |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                              |

### campos de configuración

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y el onboarding.     |
| `cliBackends`      | No          | `string[]` | Ids de backends en tiempo de configuración usados para la búsqueda de configuración basada en descriptor. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este plugin.        |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecutar `setup-api` después de la búsqueda por descriptor.         |

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

| Campo         | Tipo       | Qué significa                              |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Etiqueta del campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas de UI opcionales.                |
| `advanced`    | `boolean`  | Marca el campo como avanzado.              |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.    |
| `placeholder` | `string`   | Texto de marcador para entradas de formulario. |

## referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el runtime del plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de factories de extensiones de servidor de app Codex, actualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime para los que un plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedores cuyo hook de perfil de autenticación externa pertenece a este plugin. |
| `speechProviders`                | `string[]` | Ids de proveedores de voz propiedad de este plugin.                   |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real propiedad de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real propiedad de este plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedores de embeddings de memoria propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de comprensión multimedia propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video propiedad de este plugin.   |
| `webFetchProviders`              | `string[]` | Ids de proveedores de obtención web propiedad de este plugin.         |
| `webSearchProviders`             | `string[]` | Ids de proveedores de búsqueda web propiedad de este plugin.          |
| `migrationProviders`             | `string[]` | Ids de proveedores de importación propiedad de este plugin para `openclaw migrate`. |
| `tools`                          | `string[]` | Nombres de herramientas de agente propiedad de este plugin.           |

`contracts.embeddedExtensionFactories` se conserva para factories de extensiones incluidas
solo para el servidor de app Codex. Las transformaciones incluidas de resultados de herramientas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los plugins externos no pueden
registrar middleware de resultados de herramientas porque el seam puede reescribir salidas de herramientas
de alta confianza antes de que el modelo las vea.

Los registros de runtime `api.registerTool(...)` deben coincidir con `contracts.tools`.
El descubrimiento de herramientas usa esta lista para cargar solo los runtimes de plugin que pueden poseer las
herramientas solicitadas.

Los plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los plugins sin la declaración aún se ejecutan
mediante un fallback de compatibilidad obsoleto, pero ese fallback es más lento y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas de CLI independientes usan este contrato de manifiesto
para cargar solo el plugin propietario antes de que el runtime completo del Gateway haya
registrado proveedores.

## referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tiene
modelos predeterminados, prioridad de fallback de autenticación automática o compatibilidad nativa con documentos que
los helpers genéricos del núcleo necesitan antes de que se cargue el runtime. Las claves también deben declararse en
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades multimedia expuestas por este proveedor.                         |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para el fallback automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documentos nativas compatibles con el proveedor.                  |

## referencia de channelConfigs

Usa `channelConfigs` cuando un plugin de canal necesita metadatos de configuración baratos antes de que
se cargue el runtime. El descubrimiento de configuración/estado de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no hay una entrada de configuración disponible, o
cuando `setup.requiresRuntime: false` declara innecesario el runtime de configuración.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección de configuración de usuario
de nivel superior. Los usuarios siguen configurando instancias de canal bajo `channels.<channel-id>`.
OpenClaw lee metadatos del manifiesto para decidir qué plugin posee ese canal configurado
antes de que se ejecute el código de runtime del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaran `channels[]` también deben declarar entradas
`channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el plugin, pero
las superficies de esquema de configuración en ruta fría, configuración y Control UI no pueden conocer la
forma de las opciones propiedad del canal hasta que se ejecute el runtime del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y
`nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración de comandos
que se ejecutan antes de que se cargue el runtime del canal. Los canales incluidos también pueden publicar
los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con
sus otros metadatos de catálogo de canal propiedad del paquete.

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
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Requerido para cada entrada declarada de configuración de canal.         |
| `uiHints`     | `Record<string, object>` | Etiquetas/marcadores de posición/indicaciones sensibles de UI opcionales para esa sección de configuración de canal.          |
| `label`       | `string`                 | Etiqueta de canal combinada en las superficies de selector e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                               |
| `commands`    | `object`                 | Comando nativo estático y valores predeterminados automáticos de skill nativa para comprobaciones de configuración previas al runtime.       |
| `preferOver`  | `string[]`               | IDs de plugin heredados o de menor prioridad que este canal debe superar en las superficies de selección.    |

### Reemplazar otro plugin de canal

Usa `preferOver` cuando tu plugin sea el propietario preferido para un ID de canal que
otro plugin también puede proporcionar. Los casos comunes son un ID de plugin renombrado, un
plugin independiente que reemplaza a un plugin incluido, o un fork mantenido que
conserva el mismo ID de canal para compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el ID de canal como
el ID de plugin preferido. Si el plugin de menor prioridad solo se seleccionó porque
está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la
configuración efectiva de runtime para que un solo plugin posea el canal y sus herramientas. La selección explícita del usuario
sigue teniendo prioridad: si el usuario habilita explícitamente ambos plugins, OpenClaw
conserva esa elección e informa diagnósticos de canal/herramienta duplicados en lugar de
cambiar silenciosamente el conjunto de plugins solicitado.

Mantén `preferOver` limitado a IDs de plugin que realmente puedan proporcionar el mismo canal.
No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin proveedor a partir de
IDs de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el runtime
del plugin.

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
- si un plugin no incluido y un plugin incluido coinciden, gana el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a IDs de modelo abreviados.                 |
| `modelPatterns` | `string[]` | Fuentes de regex comparadas con IDs de modelo abreviados después de quitar el sufijo de perfil. |

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de
cargar el runtime del plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo
fijas, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización de runtime
sigue perteneciendo al código de runtime del proveedor, pero el manifiesto indica al núcleo cuándo se requiere
runtime.

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
| `providers`    | `Record<string, object>`                                 | Filas de catálogo para IDs de proveedor propiedad de este plugin. Las claves también deberían aparecer en `providers` de nivel superior.       |
| `aliases`      | `Record<string, object>`                                 | Alias de proveedor que deberían resolverse a un proveedor propio para la planificación de catálogo o supresión.              |
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este plugin suprime por un motivo específico del proveedor.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos de manifiesto, actualizarse en caché o requiere runtime. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación de catálogos de modelos.
Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo plugin. Cuando una
lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y
aplicar anulaciones de API/URL base del alias sin cargar el runtime del proveedor.
Los alias no expanden listados de catálogo sin filtro; las listas amplias emiten solo
las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook `suppressBuiltInModel` de runtime del proveedor.
Las entradas de supresión solo se respetan cuando el proveedor es propiedad del plugin o
se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión de runtime
ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para los modelos en este catálogo de proveedor.    |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para los modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor.      |
| `models`  | `object[]`               | Filas de modelo requeridas. Las filas sin `id` se ignoran.            |

Campos del modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`          | `string`                                                       | Nombre visible opcional.                                                      |
| `api`           | `ModelApi`                                                     | Anulación opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Anulación opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                               |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                               |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto de runtime cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Tokens máximos de salida cuando se conocen.                                           |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprime solo cuando la fila no debe aparecer en absoluto.          |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado con estado no disponible.                            |
| `replaces`      | `string[]`                                                     | IDs de modelo locales del proveedor antiguos a los que este modelo reemplaza.                       |
| `replacedBy`    | `string`                                                       | ID de modelo local del proveedor de reemplazo para filas obsoletas.                    |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID de proveedor para la fila ascendente que se va a suprimir. Debe ser propiedad de este plugin o declararse como alias propio. |
| `model`                    | `string`   | ID de modelo local del proveedor que se va a suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de URL base del proveedor requeridos antes de que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos `api` de configuración del proveedor requeridos antes de que se aplique la supresión.              |

No pongas datos exclusivos de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor y selector omitan la detección de registro/tiempo de ejecución. Usa `refreshable` cuando las filas del manifiesto sean semillas o suplementos listables útiles, pero una actualización/caché pueda añadir más filas después; las filas actualizables no son autoritativas por sí solas. Usa `runtime` cuando OpenClaw deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza barata de ids de modelo propiedad del proveedor que debe ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres cortos de modelo, ids heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del plugin propietario en lugar de en tablas centrales de selección de modelo.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de ids de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos. |
| `stripPrefixes`                      | `string[]`              | Prefijos que se deben quitar antes de buscar alias, útil para duplicación heredada de proveedor/modelo. |
| `prefixWhenBare`                     | `string`                | Prefijo que se añade cuando el id de modelo normalizado aún no contiene `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo de id sin prefijo después de buscar alias, con claves `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo propietario del significado de cada `endpointClass`; los manifiestos de plugin son propietarios de los metadatos de host y URL base.

Campos del endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint central conocida, como `openrouter`, `moonshot-native` o `google-vertex`.    |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                  |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Añade el prefijo `.` para coincidencia solo de sufijo de dominio. |
| `baseUrls`                     | `string[]` | URLs base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                  |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se quita de los hosts coincidentes para exponer el prefijo de región de Google Vertex. |

## Referencia de providerRequest

Usa `providerRequest` para metadatos baratos de compatibilidad de solicitudes que la política genérica de solicitudes necesita sin cargar el tiempo de ejecución del proveedor. Mantén la reescritura de payloads específica del comportamiento en hooks de tiempo de ejecución del proveedor o en helpers compartidos de familias de proveedores.

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
| `family`              | `string`     | Etiqueta de familia de proveedor usada por decisiones genéricas de compatibilidad de solicitudes y diagnósticos. |
| `compatibilityFamily` | `"moonshot"` | Contenedor opcional de compatibilidad de familia de proveedor para helpers compartidos de solicitudes. |
| `openAICompletions`   | `object`     | Flags de solicitud de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`. |

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesite comportamiento de precios del plano de control antes de que se cargue el tiempo de ejecución. La caché de precios del Gateway lee estos metadatos sin importar código de tiempo de ejecución del proveedor.

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
| `external`   | `boolean`         | Define `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter ni LiteLLM. |
| `openRouter` | `false \| object` | Mapeo de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor. |
| `liteLLM`    | `false \| object` | Mapeo de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor. |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de proveedor de catálogo externo cuando difiere del id de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los ids de modelo que contienen barras como referencias anidadas proveedor/modelo, útil para proveedores proxy como OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de id de modelo de catálogo externo. `version-dots` prueba ids de versión con puntos como `claude-opus-4.6`. |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw son metadatos de vista previa propiedad de OpenClaw para proveedores cuyos plugins quizá aún no estén instalados. No forma parte de un manifiesto de plugin. Los manifiestos de plugin siguen siendo la autoridad del plugin instalado. El Índice de proveedores es el contrato interno de respaldo que consumirán las futuras superficies de selector de modelos de proveedor instalable y preinstalación cuando un plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del plugin instalado.
3. Caché de catálogo de modelos de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de tiempo de ejecución ni datos de modelos en vivo específicos de la cuenta. Sus catálogos de vista previa usan la misma forma de fila de proveedor de `modelCatalog` que los manifiestos de plugin, pero deben limitarse a metadatos de visualización estables salvo que campos del adaptador de tiempo de ejecución como `api`, `baseUrl`, precios o flags de compatibilidad se mantengan alineados intencionadamente con el manifiesto del plugin instalado. Los proveedores con detección en vivo de `/models` deben escribir filas actualizadas mediante la ruta explícita de caché de catálogo de modelos en lugar de hacer que el listado normal o la incorporación llamen a APIs del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de plugin instalable para proveedores cuyo plugin se haya movido fuera del núcleo o que aún no esté instalado por otro motivo. Estos metadatos reflejan el patrón del catálogo de canales: nombre del paquete, especificación de instalación npm, integridad esperada y etiquetas baratas de elección de autenticación bastan para mostrar una opción de configuración instalable. Una vez instalado el plugin, su manifiesto gana y la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidad heredadas de nivel superior están obsoletas. Usa `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal del manifiesto ya no trata esos campos de nivel superior como propiedad de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen trabajos distintos:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detección, validación de configuración, metadatos de elección de autenticación y pistas de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, puertas de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de package.json que afectan a la detección

Algunos metadatos de plugin previos al tiempo de ejecución viven intencionadamente en `package.json` bajo el bloque `openclaw` en lugar de en `openclaw.plugin.json`.
`openclaw.bundle` y `openclaw.bundle.json` no son contratos de plugin de OpenClaw; los plugins nativos deben usar `openclaw.plugin.json` más los campos admitidos de `package.json#openclaw` que aparecen abajo.

Ejemplos importantes:

| Campo                                                                                      | Qué significa                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declara puntos de entrada nativos de Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto de entrada ligero solo de configuración usado durante la incorporación, el inicio diferido de canales y el estado de canal de solo lectura/detección de SecretRef. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del Plugin.                         |
| `openclaw.channel`                                                                         | Metadatos económicos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadatos estáticos de comando nativo y valores predeterminados automáticos de skill nativa usados por las superficies de configuración, auditoría y lista de comandos antes de que se cargue el runtime del canal.                                          |
| `openclaw.channel.configuredState`                                                         | Metadatos ligeros del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por env?" sin cargar todo el runtime del canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadatos ligeros del comprobador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar todo el runtime del canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Sugerencias de instalación/actualización para plugins incluidos y publicados externamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versión mínima compatible del host OpenClaw, usando un límite inferior semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | Cadena de integridad esperada de npm dist, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Permite una ruta estrecha de recuperación por reinstalación de plugins incluidos cuando la configuración no es válida.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permite que las superficies de canal solo de configuración se carguen antes del Plugin de canal completo durante el inicio.                                                                                                 |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
la incorporación antes de que se cargue el runtime. `package.json#openclaw.install` indica a
la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las sugerencias de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de
manifiestos para fuentes de Plugin no incluidas. Los valores no válidos se rechazan;
los valores más nuevos pero válidos omiten plugins externos en hosts antiguos. Se asume que los plugins
de origen incluidos tienen la misma versión que el checkout del host.

Los metadatos oficiales de instalación bajo demanda deben usar `clawhubSpec` cuando el Plugin se
publique en ClawHub; la incorporación lo trata como la fuente remota preferida y
registra datos del artefacto de ClawHub después de la instalación. `npmSpec` sigue siendo la alternativa de compatibilidad
para paquetes que aún no se han movido a ClawHub.

La fijación exacta de versiones npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales de catálogo externo
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
de forma cerrada si el artefacto npm obtenido ya no coincide con la versión fijada.
La incorporación interactiva todavía ofrece especificaciones npm de registros de confianza, incluidos nombres
de paquete simples y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir fuentes exactas, flotantes, fijadas por integridad, sin integridad, con
desajuste de nombre de paquete y de elección predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización la aplican; cuando se omite, la resolución del registro se
registra sin fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar todo el
runtime. La entrada de configuración debe exponer metadatos de canal más adaptadores de configuración,
estado y secretos seguros para configuración; mantén los clientes de red, listeners de Gateway y
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límites de paquete para los campos
de punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable
una ruta `openclaw.extensions` que se escape.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente estrecho. No
hace que configuraciones arbitrariamente rotas sean instalables. Hoy solo permite a los flujos de instalación
recuperarse de fallos específicos obsoletos de actualización de Plugin incluido, como una
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

Úsalo cuando los flujos de configuración, doctor, estado o presencia de solo lectura necesiten una sonda de autenticación
económica de sí/no antes de que se cargue el Plugin de canal completo. El estado de autenticación persistida no es
estado de canal configurado: no uses estos metadatos para habilitar automáticamente plugins,
reparar dependencias de runtime ni decidir si debe cargarse un runtime de canal.
La exportación de destino debe ser una función pequeña que lea solo estado persistido; no la
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

Úsalo cuando un canal pueda responder el estado configurado a partir de env u otras entradas pequeñas
sin runtime. Si la comprobación necesita resolución completa de configuración o el runtime de canal
real, mantén esa lógica en el hook `config.hasConfiguredState` del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, workspace, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins distribuidos con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins descubiertos en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin incluido situada en el workspace no ensombrecerá la compilación incluida.
- Para anular realmente un Plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del workspace.
- Los descartes duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.
- Las anulaciones duplicadas seleccionadas por configuración se redactan como anulaciones explícitas en los diagnósticos, pero siguen avisando para que las bifurcaciones obsoletas y los ensombrecimientos accidentales permanezcan visibles.

## Requisitos de JSON Schema

- **Cada Plugin debe distribuir un JSON Schema**, incluso si no acepta configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan al leer/escribir configuración, no en runtime.
- Al extender o bifurcar un Plugin incluido con nuevas claves de configuración, actualiza el `configSchema` de `openclaw.plugin.json` de ese Plugin al mismo tiempo. Los esquemas de plugins incluidos son estrictos, por lo que añadir `plugins.entries.<id>.config.myNewKey` en la configuración de usuario sin añadir `myNewKey` a `configSchema.properties` se rechazará antes de que se cargue el runtime del Plugin.

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
  deben referenciar ids de Plugin **detectables**. Los ids desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del Plugin.
- Si existe configuración de Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + logs.

Consulta [Referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El entorno de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo sirve para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` se pueden omitir cuando un plugin no las necesita.
- `providerDiscoveryEntry` debe mantenerse ligero y no debería importar código amplio de entorno de ejecución; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento específicos, no para ejecución en tiempo de solicitud.
- Los tipos de plugin exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Declara el tipo de plugin exclusivo en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de entorno de ejecución está obsoleto y permanece solo como respaldo de compatibilidad para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega Cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de entorno de ejecución que requieren código de proveedor, consulta [hooks de entorno de ejecución del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Crear plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con plugins.
  </Card>
  <Card title="Arquitectura de Plugin" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Resumen del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones de subrutas.
  </Card>
</CardGroup>
