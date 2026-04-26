---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas incluir un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Manifiesto de Plugin + requisitos de esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugins](/es/plugins/bundles).

Los formatos de paquetes compatibles usan archivos de manifiesto distintos:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee metadatos del paquete más las
raíces de Skills declaradas, raíces de comandos de Claude, valores predeterminados `settings.json` del paquete Claude,
valores predeterminados LSP del paquete Claude y paquetes de hooks compatibles cuando el diseño coincide
con las expectativas de runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar el código del Plugin**. Los manifiestos ausentes o no válidos se tratan como
errores de Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la orientación actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar el
código de tu Plugin**. Todo lo que aparece a continuación debe ser lo bastante barato de inspeccionar sin arrancar
el runtime del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones para la UI de configuración
- metadatos de autenticación, incorporación y configuración (alias, autoenable, variables de entorno de proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos de canal fusionados en el catálogo y las superficies de validación

**No lo uses para:** registrar comportamiento de runtime, declarar puntos de entrada de código
ni metadatos de instalación npm. Eso pertenece al código de tu Plugin y a `package.json`.

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
  "description": "Plugin de proveedor OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

| Field                                | Required | Type                             | Qué significa                                                                                                                                                                                                                    |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí       | `string`                         | ID canónico del Plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                                           |
| `configSchema`                       | Sí       | `object`                         | Esquema JSON inline para la configuración de este Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No       | `true`                           | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado por defecto.                                                      |
| `legacyPluginIds`                    | No       | `string[]`                       | IDs heredados que se normalizan a este ID canónico de Plugin.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | No       | `string[]`                       | IDs de proveedor que deben auto-habilitar este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                                      |
| `kind`                               | No       | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | No       | `string[]`                       | IDs de canal propiedad de este Plugin. Se usa para descubrimiento y validación de configuración.                                                                                                                                 |
| `providers`                          | No       | `string[]`                       | IDs de proveedor propiedad de este Plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | No       | `string`                         | Ruta ligera al módulo de descubrimiento del proveedor, relativa a la raíz del Plugin, para metadatos del catálogo de proveedor con alcance de manifiesto que pueden cargarse sin activar todo el runtime del Plugin.          |
| `modelSupport`                       | No       | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto usados para cargar automáticamente el Plugin antes del runtime.                                                                                            |
| `modelCatalog`                       | No       | `object`                         | Metadatos declarativos de catálogo de modelos para proveedores propiedad de este Plugin. Este es el contrato del plano de control para futuro listado de solo lectura, incorporación, selectores de modelos, alias y supresión sin cargar el runtime del Plugin. |
| `providerEndpoints`                  | No       | `object[]`                       | Metadatos de hosts/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el core debe clasificar antes de que se cargue el runtime del proveedor.                                                           |
| `cliBackends`                        | No       | `string[]`                       | IDs de backend CLI de inferencia propiedad de este Plugin. Se usan para autoactivación en el arranque a partir de referencias explícitas de configuración.                                                                      |
| `syntheticAuthRefs`                  | No       | `string[]`                       | Referencias de proveedor o backend CLI cuyo hook sintético de autenticación propiedad del Plugin debe sondearse durante el descubrimiento en frío de modelos antes de que cargue el runtime.                                   |
| `nonSecretAuthMarkers`               | No       | `string[]`                       | Valores placeholder de clave API, propiedad de Plugins incluidos, que representan estado de credenciales no secretas locales, OAuth o del entorno.                                                                             |
| `commandAliases`                     | No       | `object[]`                       | Nombres de comandos propiedad de este Plugin que deben producir configuración y diagnósticos CLI con reconocimiento de Plugin antes de que cargue el runtime.                                                                   |
| `providerAuthEnvVars`                | No       | `Record<string, string[]>`       | Metadatos heredados de compatibilidad para búsqueda de autenticación/estado de proveedores mediante variables de entorno. Para Plugins nuevos, prefiere `setup.providers[].envVars`; OpenClaw sigue leyendo esto durante la ventana de deprecación. |
| `providerAuthAliases`                | No       | `Record<string, string>`         | IDs de proveedor que deben reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de coding que comparte la clave API base del proveedor y perfiles de autenticación.                    |
| `channelEnvVars`                     | No       | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalo para superficies de configuración o autenticación de canal impulsadas por entorno que los ayudantes genéricos de arranque/configuración deban ver. |
| `providerAuthChoices`                | No       | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y conexión simple de banderas de CLI.                                                                       |
| `activation`                         | No       | `object`                         | Metadatos ligeros del planificador de activación para carga disparada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin sigue siendo propietario del comportamiento real.                 |
| `setup`                              | No       | `object`                         | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                 |
| `qaRunners`                          | No       | `object[]`                       | Descriptores ligeros de ejecutores QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del Plugin.                                                                                                   |
| `contracts`                          | No       | `object`                         | Instantánea estática de capacidades incluidas para hooks externos de autenticación, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de música, generación de video, web fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`         | Valores predeterminados ligeros de comprensión multimedia para IDs de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                           |
| `channelConfigs`                     | No       | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en superficies de descubrimiento y validación antes de que cargue el runtime.                                                                           |
| `skills`                             | No       | `string[]`                       | Directorios de Skills que cargar, relativos a la raíz del Plugin.                                                                                                                                                                |
| `name`                               | No       | `string`                         | Nombre legible para personas del Plugin.                                                                                                                                                                                          |
| `description`                        | No       | `string`                         | Resumen corto mostrado en superficies del Plugin.                                                                                                                                                                                |
| `version`                            | No       | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                   |
| `uiHints`                            | No       | `Record<string, object>`         | Etiquetas de UI, placeholders e indicaciones de sensibilidad para campos de configuración.                                                                                                                                        |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que cargue el runtime del proveedor.
Las listas de configuración del proveedor usan estas opciones del manifiesto, opciones de
configuración derivadas del descriptor y metadatos del catálogo de instalación sin cargar el runtime del proveedor.

| Field                 | Required | Type                                            | Qué significa                                                                                          |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Sí       | `string`                                        | ID del proveedor al que pertenece esta opción.                                                         |
| `method`              | Sí       | `string`                                        | ID del método de autenticación al que se debe despachar.                                               |
| `choiceId`            | Sí       | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                    |
| `choiceLabel`         | No       | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como fallback.                 |
| `choiceHint`          | No       | `string`                                        | Texto breve de ayuda para el selector.                                                                 |
| `assistantPriority`   | No       | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos guiados por asistente.              |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Oculta la opción en selectores del asistente, pero sigue permitiendo selección manual por CLI.        |
| `deprecatedChoiceIds` | No       | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.              |
| `groupId`             | No       | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                               |
| `groupLabel`          | No       | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                         |
| `groupHint`           | No       | `string`                                        | Texto breve de ayuda para el grupo.                                                                    |
| `optionKey`           | No       | `string`                                        | Clave interna de opción para flujos simples de autenticación con una sola bandera.                     |
| `cliFlag`             | No       | `string`                                        | Nombre de la bandera de CLI, como `--openrouter-api-key`.                                              |
| `cliOption`           | No       | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | No       | `string`                                        | Descripción usada en la ayuda de CLI.                                                                  |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un Plugin es propietario de un nombre de comando de runtime que los usuarios
pueden poner por error en `plugins.allow` o intentar ejecutar como comando raíz de CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar el código de runtime del Plugin.

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

| Field        | Required | Type              | Qué significa                                                            |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Sí       | `string`          | Nombre de comando que pertenece a este Plugin.                           |
| `kind`       | No       | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No       | `string`          | Comando raíz relacionado de CLI que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el Plugin puede declarar de forma barata qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque es metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento de runtime, no reemplaza `register(...)` y no promete que el
código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los Plugins candidatos antes de recurrir a metadatos existentes de propiedad en el manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más específicos que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de setup o `contracts`
cuando esos campos expresen la relación. Usa `activation` para indicaciones extra del planificador
que no puedan representarse con esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de runtime de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
IDs integrados de agent harness que todavía no tienen un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento de runtime y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/Plugin.
Los consumidores actuales lo usan como una indicación de reducción antes de una carga más amplia de Plugins, así que
la ausencia de metadatos de activación normalmente solo cuesta rendimiento; no debería
cambiar la corrección mientras sigan existiendo los fallbacks heredados de propiedad del manifiesto.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field              | Required | Type                                                 | Qué significa                                                                                                                                     |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | No       | `string[]`                                           | IDs de proveedor que deben incluir este Plugin en planes de activación/carga.                                                                    |
| `onAgentHarnesses` | No       | `string[]`                                           | IDs de runtime de agent harness integrado que deben incluir este Plugin en planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend CLI. |
| `onCommands`       | No       | `string[]`                                           | IDs de comando que deben incluir este Plugin en planes de activación/carga.                                                                      |
| `onChannels`       | No       | `string[]`                                           | IDs de canal que deben incluir este Plugin en planes de activación/carga.                                                                        |
| `onRoutes`         | No       | `string[]`                                           | Tipos de ruta que deben incluir este Plugin en planes de activación/carga.                                                                       |
| `onCapabilities`   | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos recurre al heredado
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de arranque del runtime del agente usa `activation.onAgentHarnesses` para
  harnesses integrados y `cliBackends[]` de nivel superior para alias de runtime de CLI
- la planificación de configuración/canal activada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedor recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos
  de activación de proveedor

Los diagnósticos del planificador pueden distinguir entre indicaciones explícitas de activación y
fallback de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
coincidió `activation.onCommands`, mientras que `manifest-command-alias` significa que el
planificador usó la propiedad `commandAliases` en su lugar. Estas etiquetas de motivo son para
diagnósticos y pruebas del host; los autores de Plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un Plugin aporta uno o más transport runners bajo la raíz
compartida `openclaw qa`. Mantén estos metadatos ligeros y estáticos; el runtime del Plugin
sigue siendo propietario del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la lane QA en vivo de Matrix respaldada por Docker contra un homeserver desechable"
    }
  ]
}
```

| Field         | Required | Type     | Qué significa                                                     |
| ------------- | -------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Sí       | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.      |
| `description` | No       | `string` | Texto de ayuda de fallback usado cuando el host compartido necesita un comando stub. |

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos ligeros propiedad del Plugin
antes de que cargue el runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends CLI de inferencia.
`setup.cliBackends` es la superficie específica de descriptor de setup para
flujos de setup/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de
búsqueda basada primero en descriptor para descubrimiento de setup. Si el descriptor solo
reduce el Plugin candidato y el setup sigue necesitando hooks más ricos de runtime en tiempo de setup,
establece `requiresRuntime: true` y mantén `setup-api` como
ruta de ejecución de fallback.

OpenClaw también incluye `setup.providers[].envVars` en búsquedas genéricas de autenticación de proveedor y variables de entorno.
`providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad durante la ventana
de deprecación, pero los Plugins no incluidos que todavía lo usan reciben un diagnóstico de manifiesto. Los Plugins nuevos deben poner los metadatos de variables de entorno de setup/status
en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones simples de setup a partir de `setup.providers[].authMethods`
cuando no hay una entrada de setup disponible, o cuando `setup.requiresRuntime: false`
declara innecesario el runtime de setup. Las entradas explícitas `providerAuthChoices` siguen
siendo preferidas para etiquetas personalizadas, banderas de CLI, ámbito de incorporación y metadatos del asistente.

Establece `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la
superficie de configuración. OpenClaw trata un `false` explícito como un contrato
solo de descriptor y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si
un Plugin solo de descriptor sigue incluyendo una de esas entradas de runtime de setup,
OpenClaw informa un diagnóstico adicional y continúa ignorándolo. Omitir
`requiresRuntime` mantiene el comportamiento heredado de fallback para que los Plugins existentes que añadieron
descriptores sin la bandera no se rompan.

Como la búsqueda de setup puede ejecutar código `setup-api` propiedad del Plugin, los
valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre
los Plugins descubiertos. La propiedad ambigua falla de forma segura en lugar de elegir
un ganador según el orden de descubrimiento.

Cuando el runtime de setup sí se ejecuta, los diagnósticos del registro de setup informan de deriva
de descriptor si `setup-api` registra un proveedor o backend CLI que los descriptores del manifiesto
no declaran, o si un descriptor no tiene un registro de runtime coincidente. Estos diagnósticos son adicionales y no rechazan Plugins heredados.

### Referencia de `setup.providers`

| Field         | Required | Type       | Qué significa                                                                         |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Sí       | `string`   | ID del proveedor expuesto durante setup o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No       | `string[]` | IDs de métodos de setup/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No       | `string[]` | Variables de entorno que las superficies genéricas de setup/status pueden comprobar antes de que cargue el runtime del Plugin. |

### Campos de `setup`

| Field              | Required | Type       | Qué significa                                                                                      |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descriptores de configuración de proveedor expuestos durante setup e incorporación.                |
| `cliBackends`      | No       | `string[]` | IDs de backend en tiempo de setup usados para búsqueda de setup basada primero en descriptor. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No       | `string[]` | IDs de migración de configuración propiedad de la superficie de setup de este Plugin.              |
| `requiresRuntime`  | No       | `boolean`  | Si setup sigue necesitando ejecución de `setup-api` después de la búsqueda por descriptor.         |

## Referencia de `uiHints`

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

| Field         | Type       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                   |
| `tags`        | `string[]` | Etiquetas opcionales de UI.             |
| `advanced`    | `boolean`  | Marca el campo como avanzado.           |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto placeholder para entradas de formulario. |

## Referencia de `contracts`

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista es opcional:

| Field                            | Type       | Qué significa                                                           |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de factorías de extensiones de app-server de Codex, actualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | IDs de runtime para los que un Plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | IDs de proveedor cuyo hook de perfil de autenticación externa es propiedad de este Plugin. |
| `speechProviders`                | `string[]` | IDs de proveedores de voz propiedad de este Plugin.                     |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedores de transcripción en tiempo real propiedad de este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedores de voz en tiempo real propiedad de este Plugin.      |
| `memoryEmbeddingProviders`       | `string[]` | IDs de proveedores de embeddings de memoria propiedad de este Plugin.   |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedores de comprensión multimedia propiedad de este Plugin.   |
| `imageGenerationProviders`       | `string[]` | IDs de proveedores de generación de imágenes propiedad de este Plugin.  |
| `videoGenerationProviders`       | `string[]` | IDs de proveedores de generación de video propiedad de este Plugin.     |
| `webFetchProviders`              | `string[]` | IDs de proveedores de Web Fetch propiedad de este Plugin.               |
| `webSearchProviders`             | `string[]` | IDs de proveedores de búsqueda web propiedad de este Plugin.            |
| `tools`                          | `string[]` | Nombres de herramientas del agente propiedad de este Plugin para comprobaciones de contrato incluidas. |

`contracts.embeddedExtensionFactories` se conserva para factorías de extensiones
incluidas solo de app-server de Codex. Las transformaciones incluidas de resultados de herramientas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los Plugins externos no pueden
registrar middleware de resultados de herramientas porque la costura puede reescribir salidas de herramientas
de alta confianza antes de que el modelo las vea.

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin esta declaración siguen ejecutándose
mediante un fallback de compatibilidad obsoleto, pero ese fallback es más lento y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada ID de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas CLI independientes usan este contrato del manifiesto
para cargar solo el Plugin propietario antes de que el runtime completo del Gateway haya
registrado proveedores.

## Referencia de `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión multimedia tenga
modelos predeterminados, prioridad de fallback automática por autenticación o compatibilidad nativa de documentos
que los ayudantes genéricos del core necesiten antes de que cargue el runtime. Las claves también deben declararse en
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

| Field                  | Type                                | Qué significa                                                              |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades multimedia expuestas por este proveedor.                       |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para fallback automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documentos compatibles con el proveedor.               |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos ligeros de configuración antes de que
cargue el runtime. El descubrimiento de setup/status de canal de solo lectura puede usar estos metadatos
directamente para canales externos configurados cuando no haya una entrada de setup disponible, o
cuando `setup.requiresRuntime: false` declare innecesario el runtime de setup.

`channelConfigs` son metadatos del manifiesto del Plugin, no una nueva sección de configuración
de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`.
OpenClaw lee metadatos del manifiesto para decidir qué Plugin es propietario de ese
canal configurado antes de que se ejecute el código de runtime del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas diferentes:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaren `channels[]` también deben declarar entradas
coincidentes de `channelConfigs`. Sin ellas, OpenClaw puede seguir cargando el Plugin, pero
las superficies de esquema de configuración en ruta fría, setup y UI de Control no pueden conocer
la forma de opción propiedad del canal hasta que se ejecute el runtime del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y
`nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos `auto` para comprobaciones de configuración
de comandos que se ejecutan antes de que cargue el runtime del canal. Los canales incluidos también pueden publicar
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
          "label": "URL del homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexión al homeserver de Matrix",
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

| Field         | Type                     | Qué significa                                                                            |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/indicaciones de sensibilidad opcionales de UI para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en superficies de selector e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                  |
| `commands`    | `object`                 | Valores predeterminados estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al runtime. |
| `preferOver`  | `string[]`               | IDs heredados o de menor prioridad de Plugins a los que este canal debe superar en superficies de selección. |

### Sustituir otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido de un ID de canal que
otro Plugin también puede proporcionar. Los casos habituales son un ID de Plugin renombrado, un
Plugin independiente que sustituye a un Plugin incluido, o un fork mantenido que
conserva el mismo ID de canal por compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el ID del canal como
el ID preferido del Plugin. Si el Plugin de menor prioridad fue seleccionado solo porque
está incluido o habilitado por defecto, OpenClaw lo deshabilita en la
configuración efectiva de runtime para que un solo Plugin sea propietario del canal y sus herramientas. La selección explícita del usuario sigue teniendo prioridad: si el usuario habilita explícitamente ambos Plugins, OpenClaw
preserva esa elección e informa diagnósticos de duplicado de canal/herramienta en lugar de
cambiar silenciosamente el conjunto de Plugins solicitado.

Mantén `preferOver` limitado a IDs de Plugins que realmente puedan proporcionar el mismo canal.
No es un campo general de prioridad y no renombra claves de configuración del usuario.

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
IDs abreviados de modelo como `gpt-5.5` o `claude-sonnet-4.6` antes de que cargue el runtime del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifiesto `providers` del propietario
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si coinciden un Plugin no incluido y uno incluido, gana el no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Field           | Type       | Qué significa                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefijos emparejados con `startsWith` contra IDs abreviados de modelo.         |
| `modelPatterns` | `string[]` | Fuentes regex emparejadas contra IDs abreviados de modelo tras eliminar el sufijo del perfil. |

## Referencia de `modelCatalog`

Usa `modelCatalog` cuando OpenClaw deba conocer metadatos de modelos del proveedor antes de
cargar el runtime del Plugin. Esta es la fuente propiedad del manifiesto para filas fijas
de catálogo, alias de proveedor, reglas de supresión y modo de descubrimiento. La actualización de runtime
sigue perteneciendo al código de runtime del proveedor, pero el manifiesto le dice al core cuándo
se requiere el runtime.

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

| Field          | Type                                                     | Qué significa                                                                                              |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Filas de catálogo para IDs de proveedor propiedad de este Plugin. Las claves también deben aparecer en `providers` de nivel superior. |
| `aliases`      | `Record<string, object>`                                 | Alias de proveedor que deben resolverse a un proveedor propiedad de este Plugin para planificación de catálogo o supresión. |
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por una razón específica del proveedor.            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, refrescarse a caché o requiere runtime. |

Campos del proveedor:

| Field     | Type                     | Qué significa                                                    |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL predeterminada opcional para modelos de este catálogo de proveedor. |
| `api`     | `ModelApi`               | Adaptador API predeterminado opcional para modelos de este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor. |
| `models`  | `object[]`               | Filas de modelos obligatorias. Las filas sin `id` se ignoran.    |

Campos del modelo:

| Field           | Type                                                           | Qué significa                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID local del proveedor para el modelo, sin el prefijo `provider/`.         |
| `name`          | `string`                                                       | Nombre para mostrar opcional.                                              |
| `api`           | `ModelApi`                                                     | Sobrescritura opcional de API por modelo.                                  |
| `baseUrl`       | `string`                                                       | Sobrescritura opcional de base URL por modelo.                             |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                               |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                          |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                        |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                  |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto en runtime cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Máximo de tokens de salida cuando se conoce.                               |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores opcionales de compatibilidad que coinciden con la compatibilidad de configuración de modelo de OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado del listado. Suprime solo cuando la fila no deba aparecer en absoluto. |
| `statusReason`  | `string`                                                       | Razón opcional mostrada con estados no disponibles.                        |
| `replaces`      | `string[]`                                                     | IDs locales de modelos de proveedor más antiguos que este modelo sustituye. |
| `replacedBy`    | `string`                                                       | ID local de modelo de proveedor de reemplazo para filas obsoletas.         |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                        |

No pongas datos solo de runtime en `modelCatalog`. Si un proveedor necesita estado
de cuenta, una solicitud API o descubrimiento de proceso local para conocer el conjunto completo
de modelos, declara ese proveedor como `refreshable` o `runtime` en `discovery`.

### Índice de proveedores de OpenClaw

El Índice de proveedores de OpenClaw es metadatos preliminares propiedad de OpenClaw para proveedores
cuyos Plugins quizá todavía no estén instalados. No forma parte de un manifiesto de Plugin.
Los manifiestos de Plugins siguen siendo la autoridad de Plugins instalados. El Índice de proveedores es
el contrato interno de fallback que futuras superficies de proveedor instalable y selectores
de modelos previos a la instalación consumirán cuando un Plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del Plugin instalado.
3. Caché del catálogo de modelos a partir de actualización explícita.
4. Filas preliminares del Índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de runtime ni
datos en vivo de modelos específicos de una cuenta. Sus catálogos preliminares usan la misma
forma de fila de proveedor `modelCatalog` que los manifiestos de Plugins, pero deben limitarse
a metadatos estables de visualización salvo que campos de adaptador de runtime como `api`,
`baseUrl`, precio o indicadores de compatibilidad se mantengan intencionadamente alineados con
el manifiesto del Plugin instalado. Los proveedores con descubrimiento vivo mediante `/models` deben
escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos en lugar de
hacer que el listado normal o la incorporación llamen a APIs del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de Plugin instalable para proveedores
cuyo Plugin se ha movido fuera del core o aún no está instalado. Estos
metadatos reflejan el patrón del catálogo de canales: nombre del paquete, especificación de instalación npm,
integridad esperada y etiquetas ligeras de opciones de autenticación son suficientes para mostrar una
opción de configuración instalable. Una vez que el Plugin se instala, su manifiesto gana y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como
propiedad de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| File                   | Úsalo para                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicaciones de UI que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, control de instalación, setup o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del Plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos de Plugin previos al runtime viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de en `openclaw.plugin.json`.

Ejemplos importantes:

| Field                                                             | Qué significa                                                                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                        |
| `openclaw.runtimeExtensions`                                      | Declara puntos de entrada de runtime en JavaScript compilado para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                              |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo de setup usado durante incorporación, arranque diferido de canales y descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el punto de entrada de setup en JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                               |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección.                                                                      |
| `openclaw.channel.commands`                                       | Metadatos estáticos de valores predeterminados automáticos de comandos nativos y Skills nativas usados por superficies de configuración, auditoría y lista de comandos antes de que cargue el runtime del canal. |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por entorno?" sin cargar el runtime completo del canal.            |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del comprobador de autenticación persistida que pueden responder "¿ya hay algo conectado?" sin cargar el runtime completo del canal.                             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indicaciones de instalación/actualización para Plugins incluidos y publicados externamente.                                                                                         |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un mínimo semver como `>=2026.3.22`.                                                                                           |
| `openclaw.install.expectedIntegrity`                              | Cadena esperada de integridad de distribución npm como `sha512-...`; los flujos de instalación y actualización verifican contra ella el artefacto obtenido.                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de Plugin incluido cuando la configuración no es válida.                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superficies de canal solo de setup carguen antes que el Plugin completo del canal durante el arranque.                                                                 |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/setup aparecen en
la incorporación antes de que cargue el runtime. `package.json#openclaw.install` le dice
a la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más recientes omiten el
Plugin en hosts más antiguos.

El fijado exacto de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo
deben combinar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
de forma segura si el artefacto npm obtenido ya no coincide con la versión fijada.
La incorporación interactiva sigue ofreciendo especificaciones npm de registro confiable, incluidas
nombres simples de paquete y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir entre fuentes exactas, flotantes, fijadas por integridad, sin integridad,
con desajuste de nombre de paquete y con default-choice no válido. También avisan cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización lo aplican; cuando se omite, la resolución del registro se
registra sin un pin de integridad.

Los Plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar todo el
runtime. La entrada de setup debe exponer metadatos del canal más adaptadores seguros para setup
de configuración, estado y secretos; mantén clientes de red, listeners del gateway y
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límite del paquete para
campos de punto de entrada de código fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer
cargable una ruta `openclaw.extensions` que escape del paquete.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente limitado. No
hace instalables configuraciones arbitrarias rotas. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos de actualización de Plugins incluidos obsoletos, como una
ruta faltante de Plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo
Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos del paquete para un pequeño módulo
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

Úsalo cuando setup, doctor o los flujos de estado configurado necesiten una comprobación barata
de sí/no sobre autenticación antes de que cargue el Plugin completo del canal. La exportación de destino debe ser una pequeña
función que lea solo el estado persistido; no la enrutes a través del barrel completo
del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras
de estado configurado solo por entorno:

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

Úsalo cuando un canal pueda responder al estado configurado a partir del entorno u otras entradas
mínimas no de runtime. Si la comprobación necesita resolución completa de configuración o el
runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del Plugin.

## Precedencia de descubrimiento (IDs duplicados de Plugin)

OpenClaw descubre Plugins desde varias raíces (incluidos, instalación global, espacio de trabajo, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — Plugins distribuidos con OpenClaw
3. **Instalación global** — Plugins instalados en la raíz global de Plugins de OpenClaw
4. **Espacio de trabajo** — Plugins descubiertos relativos al espacio de trabajo actual

Implicaciones:

- Una copia forked u obsoleta de un Plugin incluido que esté en el espacio de trabajo no sobrescribirá la compilación incluida.
- Para sobrescribir realmente un Plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del espacio de trabajo.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de arranque puedan señalar la copia descartada.

## Requisitos del esquema JSON

- **Todo Plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de Plugin **descubribles**. Los IDs desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa del error del Plugin.
- Si existe configuración del Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para Plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime sigue cargando el módulo del Plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- Solo el cargador de manifiestos lee los campos documentados del manifiesto. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un Plugin no los necesita.
- `providerDiscoveryEntry` debe seguir siendo ligero y no debe importar código amplio de runtime; úsalo para metadatos estáticos del catálogo del proveedor o descriptores limitados de descubrimiento, no para ejecución en tiempo de solicitud.
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Los metadatos de variables de entorno (`setup.providers[].envVars`, `providerAuthEnvVars` obsoleto y `channelEnvVars`) son solo declarativos. Estado, auditoría, validación de entrega de Cron y otras superficies de solo lectura siguen aplicando la confianza del Plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos de asistente de runtime que requieran código del proveedor, consulta [Hooks de runtime del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista permitida del administrador de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Crear Plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con Plugins.
  </Card>
  <Card title="Arquitectura de Plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Descripción general del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugins e importaciones de subruta.
  </Card>
</CardGroup>
