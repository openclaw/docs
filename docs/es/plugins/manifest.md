---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Requisitos del manifiesto del Plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-04-30T05:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquete compatibles, consulta [paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
con el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados
de `settings.json` del paquete de Claude, los valores predeterminados de LSP del paquete
de Claude y los paquetes de hooks admitidos cuando el diseño coincide con
las expectativas del runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos faltantes o no válidos se tratan como
errores de Plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de Plugin: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar tu
código de Plugin**. Todo lo siguiente debe ser lo suficientemente económico de inspeccionar sin arrancar
el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones de la interfaz de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en las superficies de catálogo y validación

**No lo uses para:** registrar comportamiento de runtime, declarar puntos de entrada de código
o metadatos de instalación de npm. Eso pertenece a tu código de Plugin y a `package.json`.

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

| Campo                                | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                         | Id canónico del plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Sí          | `object`                         | JSON Schema inline para la configuración de este plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No          | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor que no sea `true`, para dejar el plugin deshabilitado de forma predeterminada.                                             |
| `legacyPluginIds`                    | No          | `string[]`                       | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | Ids de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                                           |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo de plugin exclusivo usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No          | `string[]`                       | Ids de canales propiedad de este plugin. Se usa para el descubrimiento y la validación de configuración.                                                                                                                          |
| `providers`                          | No          | `string[]`                       | Ids de proveedores propiedad de este plugin.                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | No          | `string`                         | Ruta del módulo ligero de descubrimiento de proveedores, relativa a la raíz del plugin, para metadatos de catálogo de proveedores con alcance de manifiesto que pueden cargarse sin activar todo el runtime del plugin.           |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto, usados para cargar automáticamente el plugin antes del runtime.                                                                                             |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este plugin. Este es el contrato del plano de control para futuras listas de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el runtime del plugin. |
| `modelPricing`                       | No          | `object`                         | Política de consulta de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o asignar referencias de proveedores a ids de catálogo de OpenRouter/LiteLLM sin codificar ids de proveedores en el núcleo. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de id de modelo propiedad del proveedor que debe ejecutarse antes de que se cargue el runtime del proveedor.                                                                                           |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedores que el núcleo debe clasificar antes de que se cargue el runtime del proveedor.                                                          |
| `providerRequest`                    | No          | `object`                         | Metadatos baratos de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que se cargue el runtime del proveedor.                                                         |
| `cliBackends`                        | No          | `string[]`                       | Ids de backends de inferencia de CLI propiedad de este plugin. Se usan para la activación automática al iniciar desde referencias de configuración explícitas.                                                                    |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del plugin debe sondearse durante el descubrimiento de modelos en frío antes de que se cargue el runtime.                                |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad de plugins incluidos que representan estado de credenciales no secretas locales, OAuth o ambientales.                                                                  |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el runtime.                                                                     |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para la búsqueda de autenticación/estado del proveedor. Prefiere `setup.providers[].envVars` para plugins nuevos; OpenClaw todavía lee esto durante la ventana de obsolescencia. |
| `providerAuthAliases`                | No          | `Record<string, string>`         | Ids de proveedores que deben reutilizar otro id de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de codificación que comparte la clave de API y los perfiles de autenticación del proveedor base.         |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos baratos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Usa esto para superficies de configuración de canal o autenticación basadas en entorno que los ayudantes genéricos de inicio/configuración deben ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos baratos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado sencillo de flags de CLI.                                                                           |
| `activation`                         | No          | `object`                         | Metadatos baratos del planificador de activación para carga activada por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo propietario del comportamiento real.             |
| `setup`                              | No          | `object`                         | Descriptores baratos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                                                   |
| `qaRunners`                          | No          | `object[]`                       | Descriptores baratos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del plugin.                                                                                               |
| `contracts`                          | No          | `object`                         | Instantánea estática de capacidades incluidas para hooks de autenticación externa, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, obtención web, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados baratos de comprensión de medios para ids de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                           |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canales propiedad del manifiesto, fusionados en superficies de descubrimiento y validación antes de que se cargue el runtime.                                                                       |
| `skills`                             | No          | `string[]`                       | Directorios de Skills para cargar, relativos a la raíz del plugin.                                                                                                                                                                |
| `name`                               | No          | `string`                         | Nombre del plugin legible por humanos.                                                                                                                                                                                           |
| `description`                        | No          | `string`                         | Resumen breve mostrado en superficies de plugins.                                                                                                                                                                                |
| `version`                            | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                                                  |
| `uiHints`                            | No          | `Record<string, object>`         | Etiquetas de UI, marcadores de posición e indicios de sensibilidad para campos de configuración.                                                                                                                                  |

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el runtime del proveedor.
Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración
derivadas de descriptores y metadatos del catálogo de instalación sin cargar el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                           |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se debe despachar.                                                 |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de onboarding y CLI.                          |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                            |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                  |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos guiados por el asistente.              |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero permite la selección manual en la CLI.            |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                 |
| `groupId`             | No          | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                                 |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario para ese grupo.                                                         |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                     |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos de autenticación simples con una sola marca.                         |
| `cliFlag`             | No          | `string`                                        | Nombre de marca de CLI, como `--openrouter-api-key`.                                                     |
| `cliOption`           | No          | `string`                                        | Forma completa de opción de CLI, como `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                    |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | Superficies de onboarding en las que debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un Plugin posee un nombre de comando de runtime que los usuarios podrían
poner por error en `plugins.allow` o intentar ejecutar como un comando raíz de CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar código de runtime del Plugin.

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
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este Plugin.                        |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe uno. |

## Referencia de activation

Usa `activation` cuando el Plugin puede declarar de forma económica qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque es metadato del planificador, no una API de ciclo de vida. No registra
comportamiento de runtime, no reemplaza a `register(...)` y no promete que el
código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para
acotar los plugins candidatos antes de recurrir a los metadatos existentes de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más acotados que ya describen la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de setup o `contracts`
cuando esos campos expresen la relación. Usa `activation` para pistas adicionales del planificador
que no puedan representarse mediante esos campos de propiedad.
Usa `cliBackends` de nivel superior para aliases de runtime de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
IDs de arneses de agente integrados que aún no tienen un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento de runtime y no
reemplaza a `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/Plugin.
Los consumidores actuales lo usan como una pista de acotación antes de cargar plugins de forma más amplia, por lo que
la falta de metadatos de activación normalmente solo afecta al rendimiento; no debería
cambiar la corrección mientras sigan existiendo los fallbacks heredados de propiedad del manifiesto.

Cada Plugin debe definir `activation.onStartup` intencionalmente a medida que OpenClaw se aleja
de las importaciones implícitas al inicio. Defínelo como `true` solo cuando el Plugin deba
ejecutarse durante el inicio del Gateway. Defínelo como `false` cuando el Plugin esté inerte al
inicio y deba cargarse solo desde activadores más acotados. Omitir `onStartup` mantiene
el fallback sidecar heredado e implícito al inicio, ahora obsoleto, para plugins sin
metadatos de capacidad estáticos; es posible que versiones futuras dejen de cargar esos
plugins al inicio salvo que declaren `activation.onStartup: true`. Los informes de estado y
compatibilidad de plugins advierten con `legacy-implicit-startup-sidecar` cuando un Plugin
aún depende de ese fallback.

Para pruebas de migración, define
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` para deshabilitar solo ese
fallback obsoleto. Este modo opcional no bloquea plugins explícitos con
`activation.onStartup: true` ni plugins cargados por canal, configuración,
arnés de agente, memoria u otros activadores de activación más acotados.

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

| Campo              | Obligatorio | Tipo                                                 | Qué significa                                                                                                                                                                                                                      |
| ------------------ | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No          | `boolean`                                            | Activación explícita al inicio del Gateway. Cada Plugin debe definir esto. `true` importa el Plugin durante el inicio; `false` opta por no usar el fallback sidecar implícito y obsoleto al inicio, salvo que otro activador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | IDs de proveedores que deben incluir este Plugin en los planes de activación/carga.                                                                                                                                                 |
| `onAgentHarnesses` | No          | `string[]`                                           | IDs de runtime de arneses de agente integrados que deben incluir este Plugin en los planes de activación/carga. Usa `cliBackends` de nivel superior para aliases de backend de CLI.                                               |
| `onCommands`       | No          | `string[]`                                           | IDs de comandos que deben incluir este Plugin en los planes de activación/carga.                                                                                                                                                    |
| `onChannels`       | No          | `string[]`                                           | IDs de canales que deben incluir este Plugin en los planes de activación/carga.                                                                                                                                                     |
| `onRoutes`         | No          | `string[]`                                           | Tipos de rutas que deben incluir este Plugin en los planes de activación/carga.                                                                                                                                                     |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este Plugin en los planes de inicio/carga cuando la ruta está presente y no está deshabilitada explícitamente.                                                        |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más acotados cuando sea posible.                                                                                        |

Consumidores live actuales:

- La planificación de inicio del Gateway usa `activation.onStartup` para la importación
  explícita al inicio y para optar por no usar el fallback sidecar implícito y obsoleto al inicio
- La planificación de CLI activada por comandos recurre a los valores heredados
  `commandAliases[].cliCommand` o `commandAliases[].name`
- La planificación de inicio de runtime de agente usa `activation.onAgentHarnesses` para
  arneses integrados y `cliBackends[]` de nivel superior para aliases de runtime de CLI
- La planificación de setup/canal activada por canales recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- La planificación de plugins al inicio usa `activation.onConfigPaths` para superficies raíz
  de configuración que no son de canal, como el bloque `browser` del Plugin de navegador incluido
- La planificación de setup/runtime activada por proveedores recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de
  activación de proveedor

Los diagnósticos del planificador pueden distinguir las pistas de activación explícitas del
fallback de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó la propiedad de `commandAliases` en su lugar. Estas etiquetas de motivo son para
diagnósticos y pruebas del host; los autores de plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de qaRunners

Usa `qaRunners` cuando un Plugin aporta uno o más runners de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el runtime
del Plugin sigue siendo propietario del registro real de CLI mediante una superficie ligera
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
| `description` | No          | `string` | Texto de ayuda de reserva usado cuando el host compartido necesita un comando stub. |

## referencia de setup

Usa `setup` cuando las superficies de configuración inicial e incorporación necesiten metadatos baratos propiedad del Plugin
antes de que cargue el runtime.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia de CLI. `setup.cliBackends` es la superficie descriptora específica de setup para flujos de plano de control/setup que deben permanecer solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie de búsqueda preferida, basada primero en descriptores, para el descubrimiento de setup. Si el descriptor solo reduce el Plugin candidato y setup aún necesita hooks de runtime más completos durante setup, establece `requiresRuntime: true` y mantén `setup-api` en su lugar como ruta de ejecución de reserva.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad durante el periodo de desaprobación, pero los plugins no incluidos que todavía lo usen reciben un diagnóstico de manifiesto. Los plugins nuevos deben poner metadatos de entorno de setup/estado en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de setup desde `setup.providers[].authMethods` cuando no haya una entrada de setup disponible, o cuando `setup.requiresRuntime: false` declare que el runtime de setup no es necesario. Las entradas explícitas de `providerAuthChoices` siguen siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de incorporación y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la superficie de setup. OpenClaw trata el valor explícito `false` como un contrato solo de descriptores y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de setup. Si un Plugin solo de descriptores todavía incluye una de esas entradas de runtime de setup, OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Omitir `requiresRuntime` mantiene el comportamiento heredado de reserva para que los plugins existentes que añadieron descriptores sin el flag no se rompan.

Como la búsqueda de setup puede ejecutar código `setup-api` propiedad del Plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

Cuando el runtime de setup sí se ejecuta, los diagnósticos del registro de setup informan deriva de descriptores si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto no declaran, o si un descriptor no tiene un registro de runtime correspondiente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí          | `string`   | Id de proveedor expuesto durante setup o incorporación. Mantén los ids normalizados globalmente únicos. |
| `authMethods`  | No          | `string[]` | Ids de método de setup/autenticación que este proveedor admite sin cargar el runtime completo.    |
| `envVars`      | No          | `string[]` | Variables de entorno que las superficies genéricas de setup/estado pueden comprobar antes de que cargue el runtime del Plugin. |
| `authEvidence` | No          | `object[]` | Comprobaciones baratas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que se pueden verificar sin cargar código de runtime. Estas comprobaciones deben seguir siendo baratas y locales:
sin llamadas de red, sin lecturas de llavero o gestor de secretos, sin comandos de shell y sin sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sí          | `string`   | Actualmente `local-file-with-env`.                                                                          |
| `fileEnvVar`       | No          | `string`   | Variable de entorno que contiene una ruta explícita al archivo de credenciales.                              |
| `fallbackPaths`    | No          | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacía. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No          | `string[]` | Al menos una variable de entorno listada debe no estar vacía para que la evidencia sea válida.               |
| `requiresAllEnv`   | No          | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida.              |
| `credentialMarker` | Sí          | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                              |
| `source`           | No          | `string`   | Etiqueta de origen visible para el usuario para la salida de autenticación/estado.                           |

### campos de configuración

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación. |
| `cliBackends`      | No          | `string[]` | Ids de backends usados en tiempo de configuración para la búsqueda de configuración basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este Plugin.       |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración todavía necesita la ejecución de `setup-api` después de la búsqueda de descriptores. |

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

| Campo         | Tipo       | Qué significa                          |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                  |
| `tags`        | `string[]` | Etiquetas opcionales de la IU.         |
| `advanced`    | `boolean`  | Marca el campo como avanzado.          |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de marcador para entradas de formulario. |

## referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
leer sin importar el runtime del Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de fábrica de extensiones del servidor de aplicaciones de Codex, actualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime para los que un Plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedor cuyo hook de perfil de autenticación externa es propiedad de este Plugin. |
| `speechProviders`                | `string[]` | Ids de proveedor de voz que son propiedad de este Plugin.             |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedor de transcripción en tiempo real que son propiedad de este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedor de voz en tiempo real que son propiedad de este Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedor de embeddings de memoria que son propiedad de este Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedor de comprensión multimedia que son propiedad de este Plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedor de generación de imágenes que son propiedad de este Plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedor de generación de video que son propiedad de este Plugin. |
| `webFetchProviders`              | `string[]` | Ids de proveedor de obtención web que son propiedad de este Plugin.   |
| `webSearchProviders`             | `string[]` | Ids de proveedor de búsqueda web que son propiedad de este Plugin.    |
| `migrationProviders`             | `string[]` | Ids de proveedor de importación que son propiedad de este Plugin para `openclaw migrate`. |
| `tools`                          | `string[]` | Nombres de herramientas de agente que son propiedad de este Plugin para comprobaciones de contratos incluidos. |

`contracts.embeddedExtensionFactories` se conserva para fábricas de extensiones incluidas de Codex
solo para servidor de aplicaciones. Las transformaciones incluidas de resultados de herramientas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los Plugins externos no pueden
registrar middleware de resultados de herramientas porque la unión puede reescribir la salida de herramientas de alta confianza
antes de que el modelo la vea.

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin la declaración todavía se ejecutan
mediante una alternativa de compatibilidad obsoleta, pero esa alternativa es más lenta y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas de CLI independientes usan este contrato de manifiesto
para cargar solo el Plugin propietario antes de que el runtime completo del Gateway haya
registrado los proveedores.

## referencia de mediaUnderstandingProviderMetadata

Use `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tenga
modelos predeterminados, prioridad de fallback de autoautenticación o soporte nativo de documentos que
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

| Campo                  | Tipo                                | Qué significa                                                                 |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de medios expuestas por este proveedor.                           |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para el fallback automático de proveedores basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documentos admitidas por el proveedor.                    |

## Referencia de channelConfigs

Use `channelConfigs` cuando un plugin de canal necesite metadatos de configuración baratos antes de que
se cargue el runtime. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no hay una entrada de configuración disponible, o
cuando `setup.requiresRuntime: false` declara que el runtime de configuración no es necesario.

`channelConfigs` son metadatos del manifiesto del plugin, no una nueva sección
de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal bajo `channels.<channel-id>`.
OpenClaw lee los metadatos del manifiesto para decidir qué plugin posee ese canal
configurado antes de que se ejecute el código de runtime del plugin.

Para un plugin de canal, `configSchema` y `channelConfigs` describen rutas
diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los plugins no incluidos que declaran `channels[]` también deberían declarar entradas
`channelConfigs` coincidentes. Sin ellas, OpenClaw aún puede cargar el plugin, pero
el esquema de configuración de ruta fría, la configuración y las superficies de Control UI no pueden conocer la
forma de las opciones propiedad del canal hasta que se ejecuta el runtime del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y
`nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración
de comandos que se ejecutan antes de que se cargue el runtime del canal. Los canales incluidos también pueden publicar
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
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI, placeholders e indicaciones de sensibilidad opcionales para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta de canal fusionada en superficies de selección e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                    |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al runtime. |
| `preferOver`  | `string[]`               | Ids de plugins heredados o de menor prioridad que este canal debería superar en superficies de selección. |

### Reemplazar otro plugin de canal

Use `preferOver` cuando su plugin sea el propietario preferido para un id de canal que
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
está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración
efectiva de runtime para que un plugin posea el canal y sus herramientas. La selección explícita del usuario
sigue prevaleciendo: si el usuario habilita explícitamente ambos plugins, OpenClaw
conserva esa elección e informa diagnósticos de canales/herramientas duplicados en lugar de
cambiar silenciosamente el conjunto de plugins solicitado.

Mantenga `preferOver` limitado a ids de plugins que realmente puedan proporcionar el mismo canal.
No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Use `modelSupport` cuando OpenClaw deba inferir su plugin de proveedor a partir de
ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el runtime
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
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si coinciden un plugin no incluido y un plugin incluido, gana el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a ids de modelo abreviados.         |
| `modelPatterns` | `string[]` | Fuentes regex comparadas frente a ids de modelo abreviados después de eliminar el sufijo de perfil. |

## Referencia de modelCatalog

Use `modelCatalog` cuando OpenClaw deba conocer metadatos de modelos de proveedor antes de
cargar el runtime del plugin. Esta es la fuente propiedad del manifiesto para filas fijas de catálogo,
alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización de runtime
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
| `providers`    | `Record<string, object>`                                 | Filas de catálogo para ids de proveedor propiedad de este plugin. Las claves también deberían aparecer en `providers` de nivel superior. |
| `aliases`      | `Record<string, object>`                                 | Alias de proveedor que deberían resolverse a un proveedor propio para planificación de catálogo o supresión. |
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este plugin suprime por una razón específica del proveedor.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, actualizarse en caché o requiere runtime. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación de catálogos de modelos.
Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo plugin. Cuando una
lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y
aplicar anulaciones de API/base URL del alias sin cargar el runtime del proveedor.
Los alias no expanden listados de catálogo sin filtrar; las listas amplias emiten solo las filas
del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook de runtime de proveedor `suppressBuiltInModel`.
Las entradas de supresión se respetan solo cuando el proveedor es propiedad del plugin o
se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de
supresión de runtime ya no se llaman durante la resolución de modelos.

Campos de proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor. |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Cabeceras estáticas opcionales que se aplican a este catálogo de proveedor. |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin un `id` se ignoran.   |

Campos de modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`          | `string`                                                       | Nombre de visualización opcional.                                                      |
| `api`           | `ModelApi`                                                     | Anulación opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Anulación opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                               |
| `reasoning`     | `boolean`                                                      | Indica si el modelo expone comportamiento de razonamiento.                               |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens` | `number`                                                       | Límite opcional efectivo de contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de salida cuando se conoce.                                           |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores opcionales de compatibilidad que coinciden con la compatibilidad de configuración de modelos de OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprimir solo cuando la fila no debe aparecer en absoluto.          |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                            |
| `replaces`      | `string[]`                                                     | IDs de modelos locales del proveedor antiguos a los que este modelo sustituye.                       |
| `replacedBy`    | `string`                                                       | ID de modelo local del proveedor de reemplazo para filas obsoletas.                    |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID de proveedor para la fila ascendente que se va a suprimir. Debe pertenecer a este plugin o declararse como un alias propio. |
| `model`                    | `string`   | ID de modelo local del proveedor que se va a suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts de URL base efectivos del proveedor requeridos antes de que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración del proveedor requeridos antes de que se aplique la supresión.              |

No pongas datos solo de tiempo de ejecución en `modelCatalog`. Usa `static` solo cuando las
filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor
y selector omitan el descubrimiento de registro/tiempo de ejecución. Usa `refreshable` cuando las filas
del manifiesto sean semillas o complementos listables útiles, pero una actualización/caché pueda añadir
más filas después; las filas actualizables no son autoritativas por sí solas. Usa `runtime` cuando OpenClaw
deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Usa `modelIdNormalization` para una limpieza barata de IDs de modelo propiedad del proveedor que debe
ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres
cortos de modelo, IDs heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del
Plugin propietario en lugar de en tablas centrales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de ID de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven tal como están escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefijos que se eliminan antes de la búsqueda de alias, útil para duplicación heredada de proveedor/modelo.     |
| `prefixWhenBare`                     | `string`                | Prefijo que se añade cuando el ID de modelo normalizado aún no contiene `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para ID sin prefijo después de la búsqueda de alias, indexadas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Usa `providerEndpoints` para la clasificación de endpoints que la política genérica de solicitudes
debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo dueño
del significado de cada `endpointClass`; los manifiestos de Plugin son dueños de los metadatos de host y URL base.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint del núcleo conocida, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Usa el prefijo `.` para coincidencias solo de sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                             |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se elimina de los hosts coincidentes para exponer el prefijo de región de Google Vertex.                 |

## Referencia de providerRequest

Usa `providerRequest` para metadatos baratos de compatibilidad de solicitudes que la política genérica
de solicitudes necesita sin cargar el tiempo de ejecución del proveedor. Mantén la reescritura de carga útil
específica del comportamiento en hooks de tiempo de ejecución del proveedor o helpers compartidos de familia de proveedores.

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
| `compatibilityFamily` | `"moonshot"` | Grupo opcional de compatibilidad de familia de proveedor para helpers de solicitudes compartidos.              |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`.       |

## Referencia de modelPricing

Usa `modelPricing` cuando un proveedor necesite comportamiento de precios del plano de control antes de que se cargue
el tiempo de ejecución. La caché de precios del Gateway lee estos metadatos sin importar código de tiempo de ejecución
del proveedor.

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
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` deshabilita la búsqueda en OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` deshabilita la búsqueda en LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID de proveedor de catálogo externo cuando difiere del ID de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trata los IDs de modelo que contienen barras como referencias anidadas de proveedor/modelo, útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de ID de modelo de catálogo externo. `version-dots` prueba IDs de versión con puntos como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw es metadatos de vista previa propiedad de OpenClaw para proveedores
cuyos plugins podrían no estar instalados aún. No forma parte de un manifiesto de Plugin.
Los manifiestos de Plugin siguen siendo la autoridad de plugins instalados. El Índice de proveedores es
el contrato interno de respaldo que las futuras superficies de selección de modelos de proveedor instalable
y previa a la instalación consumirán cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto de Plugin instalado.
3. Caché del catálogo de modelos de una actualización explícita.
4. Filas de vista previa del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de runtime ni
datos de modelos en vivo específicos de una cuenta. Sus catálogos de vista previa usan la misma
forma de fila de proveedor `modelCatalog` que los manifiestos de plugins, pero deben mantenerse
limitados a metadatos de visualización estables, salvo que los campos del adaptador de runtime como `api`,
`baseUrl`, precios o marcas de compatibilidad se mantengan alineados intencionadamente con
el manifiesto del plugin instalado. Los proveedores con descubrimiento `/models` en vivo deben
escribir las filas actualizadas mediante la ruta explícita de caché del catálogo de modelos en lugar de
hacer que los listados normales o la incorporación llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores
cuyo plugin se ha movido fuera del núcleo o aún no está instalado por otro motivo. Estos
metadatos reflejan el patrón del catálogo de canales: el nombre del paquete, la especificación de instalación npm,
la integridad esperada y etiquetas ligeras de elección de autenticación son suficientes para mostrar una
opción de configuración instalable. Una vez instalado el plugin, su manifiesto prevalece y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidades heredadas de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad de
capacidades.

## Manifiesto frente a package.json

Los dos archivos tienen funciones distintas:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación y sugerencias de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, gating de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde pertenece un metadato, usa esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del plugin, ponlo en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponlo en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugin previos al runtime viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugins. Debe permanecer dentro del directorio del paquete del plugin.                                                                                 |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime de JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del plugin.                                       |
| `openclaw.setupEntry`                                             | Entrypoint ligero solo de configuración usado durante la incorporación, el arranque diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el entrypoint de configuración de JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del plugin.                               |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección.                                                                         |
| `openclaw.channel.commands`                                       | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas usados por la configuración, auditoría y superficies de lista de comandos antes de que cargue el runtime del canal. |
| `openclaw.channel.configuredState`                                | Metadatos ligeros de comprobador de estado configurado que pueden responder "¿ya existe una configuración solo con env?" sin cargar el runtime completo del canal.                  |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros de comprobador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal.                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Sugerencias de instalación/actualización para plugins incluidos y publicados externamente.                                                                                           |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versión mínima admitida del host OpenClaw, usando un límite inferior semver como `>=2026.3.22`.                                                                                      |
| `openclaw.install.expectedIntegrity`                              | Cadena de integridad esperada de la distribución npm, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta estrecha de recuperación mediante reinstalación de plugin incluido cuando la configuración no es válida.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración carguen antes que el plugin completo del canal durante el arranque.                                                       |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
la incorporación antes de que cargue el runtime. `package.json#openclaw.install` indica a la
incorporación cómo obtener o habilitar ese plugin cuando el usuario elige una de esas
opciones. No muevas sugerencias de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos. Los valores no válidos se rechazan; los valores más nuevos pero válidos omiten el
plugin en hosts antiguos.

La fijación exacta de versiones npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo
deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
cerrados si el artefacto npm obtenido ya no coincide con la versión fijada.
La incorporación interactiva sigue ofreciendo especificaciones npm de registros de confianza, incluidos
nombres de paquete simples y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir fuentes exactas, flotantes, fijadas por integridad, sin integridad, con discrepancia de nombre de paquete
y de elección predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización la aplican; cuando se omite, la resolución del registro se
registra sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando los escaneos de estado, lista de canales
o SecretRef necesiten identificar cuentas configuradas sin cargar el runtime completo.
La entrada de configuración debe exponer metadatos del canal además de adaptadores de configuración,
estado y secretos seguros para configuración; mantén los clientes de red, los escuchadores de Gateway y
los runtimes de transporte en el entrypoint principal de la extensión.

Los campos de entrypoint de runtime no anulan las comprobaciones de límite de paquete para los campos de
entrypoint de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable una ruta
`openclaw.extensions` que escape.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente estrecho. No hace
instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos de actualización obsoleta de plugins incluidos, como una
ruta de plugin incluido ausente o una entrada `channels.<id>` obsoleta para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un módulo comprobador
mínimo:

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
barata de sí/no antes de que cargue el plugin completo del canal. El estado de autenticación persistida no es
estado de canal configurado: no uses estos metadatos para habilitar plugins automáticamente,
reparar dependencias de runtime ni decidir si debe cargarse un runtime de canal.
La exportación objetivo debe ser una función pequeña que solo lea estado persistido; no
la enrutes a través del barrel completo del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras de
estado configurado solo con env:

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
sin runtime. Si la comprobación necesita resolución completa de configuración o el runtime real
del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin.

## Precedencia de descubrimiento (ids de plugin duplicados)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, workspace, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins distribuidos con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins descubiertos en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido situada en el workspace no sombreará la compilación incluida.
- Para anular realmente un plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento en el workspace.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de arranque puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un JSON Schema**, aunque no acepte configuración.
- Un esquema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de leer/escribir la configuración, no en runtime.

## Comportamiento de validación

- Las claves `channels.*` desconocidas son **errores**, salvo que el id del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de plugin **detectables**. Los ids desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o un esquema dañado o ausente,
  la validación falla y Doctor informa del error del plugin.
- Si existe configuración de plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta la [referencia de configuración](/es/gateway/configuration) para ver el esquema `plugins.*` completo.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El tiempo de ejecución sigue cargando el módulo del plugin por separado; el manifiesto solo sirve para detección + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- `providerDiscoveryEntry` debe mantenerse ligero y no debe importar código amplio de tiempo de ejecución; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de detección acotados, no para ejecución en tiempo de solicitud.
- Los tipos de plugin exclusivos se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Declara el tipo de plugin exclusivo en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de tiempo de ejecución está obsoleto y se mantiene solo como compatibilidad alternativa para plugins antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de tiempo de ejecución que requieran código de proveedor, consulta [hooks de tiempo de ejecución de proveedores](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm + `pnpm rebuild <package>`).

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
