---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de bundles compatibles, consulta [Plugin bundles](/es/plugins/bundles).

Los formatos de bundle compatibles usan archivos de manifiesto diferentes:

- Bundle de Codex: `.codex-plugin/plugin.json`
- Bundle de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Bundle de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de bundle, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee los metadatos del bundle más las
raíces declaradas de Skills, raíces de comandos de Claude, valores predeterminados de `settings.json` del bundle de Claude,
valores predeterminados de LSP del bundle de Claude y paquetes de hooks compatibles cuando el diseño coincide con las expectativas de runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos faltantes o no válidos se tratan como
errores del Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la orientación actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar el
código de tu Plugin**. Todo lo que aparece a continuación debe ser lo bastante económico de inspeccionar sin arrancar el runtime del
Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones de IU para la configuración
- metadatos de autenticación, onboarding y configuración (alias, autoactivación, variables de entorno del proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en el catálogo y en las superficies de validación

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
      "choiceLabel": "Clave API de OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Clave API de OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
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
| `id`                                 | Sí          | `string`                         | Id canónico del Plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Sí          | `object`                         | Esquema JSON en línea para la configuración de este Plugin.                                                                                                                                                                       |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin integrado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                         |
| `legacyPluginIds`                    | No          | `string[]`                       | Ids heredados que se normalizan a este id canónico de Plugin.                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | Ids de proveedor que deben activar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionan.                                                                              |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No          | `string[]`                       | Ids de canal controlados por este Plugin. Se usan para descubrimiento y validación de configuración.                                                                                                                              |
| `providers`                          | No          | `string[]`                       | Ids de proveedor controlados por este Plugin.                                                                                                                                                                                     |
| `providerDiscoveryEntry`             | No          | `string`                         | Ruta ligera del módulo de descubrimiento de proveedores, relativa a la raíz del Plugin, para metadatos de catálogo de proveedores con alcance de manifiesto que puedan cargarse sin activar el runtime completo del Plugin.      |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familias de modelos controlados por el manifiesto, usados para cargar automáticamente el Plugin antes del runtime.                                                                                        |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints controlados por el manifiesto para rutas de proveedores que el núcleo debe clasificar antes de que cargue el runtime del proveedor.                                                        |
| `cliBackends`                        | No          | `string[]`                       | Ids de backend de inferencia por CLI controlados por este Plugin. Se usan para activación automática al inicio a partir de referencias explícitas de configuración.                                                               |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética controlado por el Plugin debe sondearse durante el descubrimiento en frío de modelos antes de que cargue el runtime.                              |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de marcador de clave API controlados por Plugins integrados que representan estado de credenciales locales, OAuth o ambientales que no son secretos.                                                                       |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comando controlados por este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de que cargue el runtime.                                                                      |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de autenticación del proveedor que OpenClaw puede inspeccionar sin cargar código del Plugin.                                                                                            |
| `providerAuthAliases`                | No          | `Record<string, string>`         | Ids de proveedor que deben reutilizar otro id de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de coding que comparte la clave API y los perfiles de autenticación del proveedor base.                    |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalo para superficies de configuración o autenticación de canal impulsadas por variables de entorno que deban ver los asistentes genéricos de inicio/configuración. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado simple de indicadores de CLI.                                                                          |
| `activation`                         | No          | `object`                         | Metadatos ligeros del planificador de activación para carga disparada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin sigue controlando el comportamiento real.                           |
| `setup`                              | No          | `object`                         | Descriptores ligeros de configuración/onboarding que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                       |
| `qaRunners`                          | No          | `object[]`                       | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del Plugin.                                                                                                   |
| `contracts`                          | No          | `object`                         | Instantánea estática de capacidades integradas para hooks externos de autenticación, voz, transcripción en tiempo real, voz en tiempo real, entendimiento de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados ligeros de entendimiento de medios para ids de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                            |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal controlados por el manifiesto fusionados en las superficies de descubrimiento y validación antes de que cargue el runtime.                                                                     |
| `skills`                             | No          | `string[]`                       | Directorios de Skills que cargar, relativos a la raíz del Plugin.                                                                                                                                                                 |
| `name`                               | No          | `string`                         | Nombre legible del Plugin.                                                                                                                                                                                                        |
| `description`                        | No          | `string`                         | Resumen corto mostrado en superficies del Plugin.                                                                                                                                                                                 |
| `version`                            | No          | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                   |
| `uiHints`                            | No          | `Record<string, object>`         | Etiquetas de IU, placeholders e indicaciones de sensibilidad para campos de configuración.                                                                                                                                        |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de onboarding o autenticación.
OpenClaw la lee antes de que cargue el runtime del proveedor.

| Campo                | Obligatorio | Tipo                                            | Qué significa                                                                                         |
| -------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`           | Sí          | `string`                                        | Id del proveedor al que pertenece esta opción.                                                        |
| `method`             | Sí          | `string`                                        | Id del método de autenticación al que se debe despachar.                                              |
| `choiceId`           | Sí          | `string`                                        | Id estable de opción de autenticación usado por los flujos de onboarding y CLI.                       |
| `choiceLabel`        | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como respaldo.                |
| `choiceHint`         | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                |
| `assistantPriority`  | No          | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos guiados por asistente.             |
| `assistantVisibility`| No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en selectores del asistente mientras sigue permitiendo la selección manual por CLI. |
| `deprecatedChoiceIds`| No          | `string[]`                                      | Ids heredados de opción que deben redirigir al usuario a esta opción de reemplazo.                    |
| `groupId`            | No          | `string`                                        | Id opcional de grupo para agrupar opciones relacionadas.                                              |
| `groupLabel`         | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                        |
| `groupHint`          | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                   |
| `optionKey`          | No          | `string`                                        | Clave interna de opción para flujos de autenticación simples de un solo indicador.                    |
| `cliFlag`            | No          | `string`                                        | Nombre del indicador de CLI, como `--openrouter-api-key`.                                             |
| `cliOption`          | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                |
| `cliDescription`     | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                 |
| `onboardingScopes`   | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de onboarding debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un Plugin controle un nombre de comando de runtime que los usuarios puedan
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                             |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este Plugin.                           |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando de barra de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz relacionado de CLI que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el Plugin puede declarar de forma económica qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque es metadato del planificador, no una API de ciclo de vida. No registra
comportamiento de runtime, no reemplaza `register(...)` y no promete que el
código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los Plugins candidatos antes de recurrir a metadatos existentes de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere el metadato más específico que ya describa la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts`
cuando esos campos expresen la relación. Usa `activation` para indicaciones adicionales del planificador
que no puedan representarse mediante esos campos de propiedad.

Este bloque es solo metadatos. No registra comportamiento de runtime y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/Plugin.
Los consumidores actuales lo usan como indicación de reducción antes de una carga más amplia de Plugins, por lo que
la ausencia de metadatos de activación normalmente solo cuesta rendimiento; no debería
cambiar la corrección mientras sigan existiendo los respaldos heredados de propiedad del manifiesto.

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

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                                                           |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | No          | `string[]`                                           | Ids de proveedor que deben incluir este Plugin en planes de activación/carga.                           |
| `onCommands`     | No          | `string[]`                                           | Ids de comando que deben incluir este Plugin en planes de activación/carga.                             |
| `onChannels`     | No          | `string[]`                                           | Ids de canal que deben incluir este Plugin en planes de activación/carga.                               |
| `onRoutes`       | No          | `string[]`                                           | Tipos de ruta que deben incluir este Plugin en planes de activación/carga.                              |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicaciones amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos recurre al heredado
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canal activada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedor recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor

Los diagnósticos del planificador pueden distinguir entre indicaciones explícitas de activación y
respaldo de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
coincidió `activation.onCommands`, mientras que `manifest-command-alias` significa que el
planificador usó en su lugar la propiedad de `commandAliases`. Estas etiquetas de motivo son para
diagnósticos y pruebas del host; los autores de Plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un Plugin aporta uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el runtime del Plugin
sigue controlando el registro real de CLI a través de una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la vía de QA en vivo de Matrix respaldada por Docker contra un homeserver desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Qué significa                                                          |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.           |
| `description` | No          | `string` | Texto de ayuda de respaldo usado cuando el host compartido necesita un comando stub. |

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración y onboarding necesitan metadatos ligeros controlados por el Plugin
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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo
backends de inferencia por CLI. `setup.cliBackends` es la superficie descriptora específica de configuración para
flujos de configuración/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida
de búsqueda basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
reduce el Plugin candidato y la configuración aún necesita hooks de runtime más ricos en tiempo de configuración, establece `requiresRuntime: true` y mantén `setup-api` como la
ruta de ejecución de respaldo.

Debido a que la búsqueda de configuración puede ejecutar código `setup-api` controlado por el Plugin, los
valores normalizados `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los Plugins detectados. La propiedad ambigua falla en cerrado en lugar de elegir un
ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                          |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Sí          | `string`   | Id del proveedor expuesto durante la configuración o el onboarding. Mantén los ids normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | Ids de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que cargue el runtime del Plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                          |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y el onboarding.         |
| `cliBackends`      | No          | `string[]` | Ids de backend en tiempo de configuración usados para búsqueda basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | Ids de migración de configuración controlados por la superficie de configuración de este Plugin.       |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecución de `setup-api` después de la búsqueda por descriptor.      |

## Referencia de `uiHints`

`uiHints` es un mapa desde nombres de campos de configuración hasta pequeñas indicaciones de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
      "help": "Usada para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada indicación de campo puede incluir:

| Campo         | Tipo       | Qué significa                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                    |
| `tags`        | `string[]` | Etiquetas de IU opcionales.              |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.  |
| `placeholder` | `string`   | Texto placeholder para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el runtime del Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Campo                            | Tipo       | Qué significa                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ids de runtime integrado para los que un Plugin integrado puede registrar fábricas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedor cuyo hook de perfil de autenticación externa controla este Plugin. |
| `speechProviders`                | `string[]` | Ids de proveedor de voz que controla este Plugin.                   |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedor de transcripción en tiempo real que controla este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedor de voz en tiempo real que controla este Plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedor de embeddings de memoria que controla este Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedor de entendimiento de medios que controla este Plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedor de generación de imágenes que controla este Plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedor de generación de video que controla este Plugin.   |
| `webFetchProviders`              | `string[]` | Ids de proveedor de web-fetch que controla este Plugin.             |
| `webSearchProviders`             | `string[]` | Ids de proveedor de búsqueda web que controla este Plugin.          |
| `tools`                          | `string[]` | Nombres de herramientas de agente que controla este Plugin para comprobaciones de contrato integradas. |

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin esa declaración siguen ejecutándose
mediante un respaldo de compatibilidad obsoleto, pero ese respaldo es más lento y
se eliminará tras la ventana de migración.

Los proveedores integrados de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas CLI independientes usan este contrato del
manifiesto para cargar solo el Plugin propietario antes de que el runtime completo de Gateway haya
registrado proveedores.

## Referencia de `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de entendimiento de medios tiene
modelos predeterminados, prioridad de respaldo de autoautenticación o compatibilidad nativa con documentos que los asistentes genéricos del núcleo necesitan antes de que cargue el runtime. Las claves también deben declararse en
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
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para el respaldo automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documento nativas compatibles con el proveedor.                  |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un Plugin de canal necesita metadatos de configuración ligeros antes
de que cargue el runtime.

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
      "description": "Conexión con homeserver de Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo         | Tipo                     | Qué significa                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/indicaciones de sensibilidad de IU opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en superficies de selector e inspección cuando los metadatos del runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                        |
| `preferOver`  | `string[]`               | Ids heredados o de menor prioridad de Plugins que este canal debe superar en superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
ids abreviados de modelo como `gpt-5.5` o `claude-sonnet-4.6` antes de que cargue el runtime del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos de manifiesto `providers` del propietario
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si coinciden un Plugin no integrado y uno integrado, gana el Plugin no integrado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a ids abreviados de modelo.          |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con ids abreviados de modelo después de eliminar el sufijo de perfil. |

Las claves heredadas de capacidad de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como
propiedad de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Úsalo para                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicaciones de IU que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, restricción de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del Plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos del Plugin previos al runtime viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                           |
| `openclaw.runtimeExtensions`                                      | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                                    |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo para configuración usado durante onboarding, arranque diferido de canales y estado de canal de solo lectura/descubrimiento de SecretRef. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el punto de entrada JavaScript compilado de configuración para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                              |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                         |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del verificador de estado configurado que pueden responder “¿ya existe configuración solo por variables de entorno?” sin cargar el runtime completo del canal.        |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del verificador de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el runtime completo del canal.                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indicaciones de instalación/actualización para Plugins integrados y publicados externamente.                                                                                            |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                      |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un mínimo semver como `>=2026.3.22`.                                                                                                |
| `openclaw.install.expectedIntegrity`                              | Cadena de integridad esperada de npm como `sha512-...`; los flujos de instalación y actualización verifican el artefacto descargado contra ella.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de Plugin integrado cuando la configuración es inválida.                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes que el Plugin completo del canal durante el arranque.                                                       |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en el
onboarding antes de que cargue el runtime. `package.json#openclaw.install` le dice al
onboarding cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las indicaciones de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del
registro de manifiestos. Los valores no válidos se rechazan; los valores más nuevos pero válidos omiten el
Plugin en hosts más antiguos.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas oficiales del catálogo externo
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen en cerrado si el artefacto npm descargado ya no coincide con la versión fijada.
El onboarding interactivo sigue ofreciendo especificaciones npm de registros confiables, incluidos
nombres de paquete sin versión y dist-tags, por compatibilidad. Los diagnósticos del catálogo pueden
distinguir entre fuentes exactas, flotantes, fijadas por integridad y sin integridad.
Cuando `expectedIntegrity` está presente, los flujos de instalación/actualización la aplican; cuando
se omite, la resolución del registro se registra sin fijación de integridad.

Los Plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los análisis de SecretRef necesiten identificar cuentas configuradas sin cargar el
runtime completo. La entrada de configuración debe exponer metadatos del canal además de adaptadores seguros para configuración,
estado y secretos; mantén los clientes de red, listeners de Gateway y runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no reemplazan las comprobaciones de límites de paquete para
los campos de punto de entrada fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una
ruta escapada en `openclaw.extensions` se pueda cargar.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente limitado. No
hace instalables configuraciones arbitrariamente rotas. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos obsoletos de actualización de Plugins integrados, como una
ruta faltante del Plugin integrado o una entrada `channels.<id>` obsoleta para ese mismo
Plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un pequeño módulo
verificador:

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

Úsalo cuando la configuración, Doctor o los flujos de estado configurado necesiten un sondeo barato de sí/no sobre autenticación
antes de que cargue el Plugin completo del canal. La exportación de destino debe ser una pequeña
función que solo lea estado persistido; no la enrutes a través del barrel completo
del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de
configuración solo por variables de entorno:

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

Úsalo cuando un canal pueda responder el estado configurado a partir de variables de entorno u otras entradas
mínimas que no dependan del runtime. Si la comprobación necesita resolución completa de configuración o el
runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre Plugins desde varias raíces (integrados, instalación global, espacio de trabajo, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Integrado** — Plugins distribuidos con OpenClaw
3. **Instalación global** — Plugins instalados en la raíz global de Plugins de OpenClaw
4. **Espacio de trabajo** — Plugins descubiertos en relación con el espacio de trabajo actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin integrado que esté en el espacio de trabajo no sustituirá a la compilación integrada.
- Para realmente sobrescribir un Plugin integrado con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del espacio de trabajo.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de arranque puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Cada Plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el id del canal esté declarado por
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de Plugin **detectables**. Los ids desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa el error del Plugin.
- Si existe configuración del Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta la [referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para Plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime sigue cargando el módulo del Plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un Plugin no los necesita.
- `providerDiscoveryEntry` debe seguir siendo ligero y no debe importar código amplio de runtime; úsalo para metadatos estáticos del catálogo de proveedores o descriptores acotados de descubrimiento, no para ejecución en tiempo de solicitud.
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Los metadatos de variables de entorno (`providerAuthEnvVars`, `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega de Cron y otras superficies de solo lectura siguen aplicando la política de confianza del Plugin y de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieren código de proveedor, consulta [Hooks de runtime del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de allowlist del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Creación de Plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con Plugins.
  </Card>
  <Card title="Arquitectura de Plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Descripción general del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones por subruta.
  </Card>
</CardGroup>
