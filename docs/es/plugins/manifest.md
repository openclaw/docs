---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Manifiesto de Plugin + requisitos de JSON schema (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-23T14:04:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto de Plugin (openclaw.plugin.json)

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de bundle compatibles, consulta [Bundles de Plugin](/es/plugins/bundles).

Los formatos de bundle compatibles usan archivos de manifiesto diferentes:

- Bundle de Codex: `.codex-plugin/plugin.json`
- Bundle de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado del componente de Claude
  sin manifiesto
- Bundle de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de bundle, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee los metadatos del bundle más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del bundle de Claude,
los valores predeterminados de LSP del bundle de Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del runtime de OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos ausentes o no válidos se tratan como
errores del Plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativas y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu Plugin.

Úsalo para:

- identidad del Plugin
- validación de configuración
- metadatos de autenticación e incorporación que deban estar disponibles sin iniciar el runtime del Plugin
- indicios baratos de activación que las superficies del plano de control puedan inspeccionar antes de que cargue el runtime
- descriptores baratos de configuración que las superficies de configuración/incorporación puedan inspeccionar antes de que cargue el runtime
- metadatos de alias y autoactivación que deban resolverse antes de que cargue el runtime del Plugin
- metadatos abreviados de propiedad de familia de modelos que deban autoactivar el
  Plugin antes de que cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para cableado de compatibilidad integrado y
  cobertura de contratos
- metadatos baratos del ejecutor de QA que el host compartido `openclaw qa` pueda inspeccionar
  antes de que cargue el runtime del Plugin
- metadatos de configuración específicos del canal que deban fusionarse en superficies de catálogo y validación
  sin cargar el runtime
- indicios de UI de configuración

No lo uses para:

- registrar comportamiento en runtime
- declarar puntos de entrada de código
- metadatos de instalación npm

Eso pertenece al código de tu Plugin y a `package.json`.

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

| Campo                                | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                         | ID canónico del Plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                                           |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin integrado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado de forma predeterminada.                                        |
| `legacyPluginIds`                    | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de Plugin.                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | IDs de proveedor que deben autohabilitar este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                                       |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No          | `string[]`                       | IDs de canal propiedad de este Plugin. Se usan para descubrimiento y validación de configuración.                                                                                                                                |
| `providers`                          | No          | `string[]`                       | IDs de proveedor propiedad de este Plugin.                                                                                                                                                                                        |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para autocargar el Plugin antes del runtime.                                                                                                         |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el núcleo debe clasificar antes de que cargue el runtime del proveedor.                                                              |
| `cliBackends`                        | No          | `string[]`                       | IDs de backend de inferencia de CLI propiedad de este Plugin. Se usan para autoactivación en el inicio a partir de referencias explícitas de configuración.                                                                      |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debe sondearse durante el descubrimiento en frío de modelos antes de que cargue el runtime.                                  |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de marcador de posición de clave de API propiedad de Plugins integrados que representan estado de credenciales no secretas locales, OAuth o del entorno.                                                                 |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de que cargue el runtime.                                                                       |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos baratos de variables de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del Plugin.                                                                                            |
| `providerAuthAliases`                | No          | `Record<string, string>`         | IDs de proveedor que deben reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de código que comparte la clave de API del proveedor base y los perfiles de autenticación.             |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos baratos de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que los ayudantes genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos baratos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y enlace simple de indicadores de CLI.                                                                         |
| `activation`                         | No          | `object`                         | Indicios baratos de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin sigue siendo propietario del comportamiento real.                               |
| `setup`                              | No          | `object`                         | Descriptores baratos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                                                  |
| `qaRunners`                          | No          | `object[]`                       | Descriptores baratos del ejecutor de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del Plugin.                                                                                                  |
| `contracts`                          | No          | `object`                         | Instantánea estática de capacidades integradas para hooks de autenticación externa, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados baratos de comprensión de medios para IDs de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                                            |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en superficies de descubrimiento y validación antes de que cargue el runtime.                                                                            |
| `skills`                             | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del Plugin.                                                                                                                                                            |
| `name`                               | No          | `string`                         | Nombre legible por humanos del Plugin.                                                                                                                                                                                            |
| `description`                        | No          | `string`                         | Resumen corto mostrado en las superficies del Plugin.                                                                                                                                                                             |
| `version`                            | No          | `string`                         | Versión informativa del Plugin.                                                                                                                                                                                                   |
| `uiHints`                            | No          | `Record<string, object>`         | Etiquetas de UI, placeholders e indicios de sensibilidad para campos de configuración.                                                                                                                                            |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                          |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se enviará.                                                       |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                     |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`.                          |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                  |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos impulsados por el asistente.     |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en los selectores del asistente, pero sigue permitiendo la selección manual desde la CLI. |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.               |
| `groupId`             | No          | `string`                                        | ID opcional de grupo para agrupar opciones relacionadas.                                                |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                          |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                     |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con un solo indicador.                     |
| `cliFlag`             | No          | `string`                                        | Nombre del indicador de CLI, como `--openrouter-api-key`.                                               |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                  |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                                |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un Plugin es propietario de un nombre de comando en runtime que los usuarios pueden
poner por error en `plugins.allow` o intentar ejecutar como comando raíz de CLI. OpenClaw
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                          |
| ------------ | ----------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este Plugin.                         |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se puede sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el Plugin puede declarar de forma barata qué eventos del plano de control
deben activarlo más tarde.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un Plugin aporta uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos baratos y estáticos; el
runtime del Plugin sigue siendo propietario del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la ruta de QA en vivo de Matrix respaldada por Docker contra un homeserver desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Qué significa                                                    |
| ------------- | ----------- | -------- | ---------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.     |
| `description` | No          | `string` | Texto alternativo de ayuda usado cuando el host compartido necesita un comando auxiliar. |

Este bloque es solo metadatos. No registra comportamiento en runtime ni
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/Plugin.
Los consumidores actuales lo usan como un indicio de reducción antes de una carga de Plugin más amplia, por lo que
la falta de metadatos de activación normalmente solo cuesta rendimiento; no debería
cambiar la corrección mientras sigan existiendo alternativas heredadas de propiedad del manifiesto.

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

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | No          | `string[]`                                           | IDs de proveedor que deben activar este Plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | IDs de comando que deben activar este Plugin.                     |
| `onChannels`     | No          | `string[]`                                           | IDs de canal que deben activar este Plugin.                       |
| `onRoutes`       | No          | `string[]`                                           | Tipos de ruta que deben activar este Plugin.                      |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicios amplios de capacidad usados por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos recurre al heredado
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canal activada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedor recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación
  de proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos baratos propiedad del Plugin
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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo
backends de inferencia de CLI. `setup.cliBackends` es la superficie de descriptor específica de configuración para
flujos de plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida
de búsqueda basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
reduce el Plugin candidato y la configuración aún necesita hooks de runtime más ricos en tiempo de configuración,
establece `requiresRuntime: true` y conserva `setup-api` como ruta alternativa de ejecución.

Dado que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del Plugin, los valores normalizados
de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los Plugins descubiertos.
La propiedad ambigua falla en modo cerrado en lugar de elegir un ganador por orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sí          | `string`   | ID del proveedor expuesto durante la configuración o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que cargue el runtime del Plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.   |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para búsqueda de configuración basada primero en descriptor. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este Plugin.       |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecutar `setup-api` después de la búsqueda de descriptor.         |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeños indicios de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave de API",
      "help": "Se usa para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada indicio de campo puede incluir:

| Campo         | Tipo       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta visible para el usuario.       |
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
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| Campo                            | Tipo       | Qué significa                                                   |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de runtime integrado para los que un Plugin integrado puede registrar fábricas. |
| `externalAuthProviders`          | `string[]` | IDs de proveedor cuyo hook de perfil de autenticación externa pertenece a este Plugin. |
| `speechProviders`                | `string[]` | IDs de proveedor de voz que pertenecen a este Plugin.           |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedor de transcripción en tiempo real que pertenecen a este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedor de voz en tiempo real que pertenecen a este Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedor de comprensión de medios que pertenecen a este Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedor de generación de imágenes que pertenecen a este Plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedor de generación de video que pertenecen a este Plugin. |
| `webFetchProviders`              | `string[]` | IDs de proveedor de web-fetch que pertenecen a este Plugin.     |
| `webSearchProviders`             | `string[]` | IDs de proveedor de búsqueda web que pertenecen a este Plugin.  |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este Plugin para comprobaciones de contratos integrados. |

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin esta declaración siguen ejecutándose
mediante una alternativa de compatibilidad obsoleta, pero esa alternativa es más lenta y
se eliminará tras la ventana de migración.

## Referencia de `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tenga
modelos predeterminados, prioridad de alternativa de autenticación automática o compatibilidad nativa con documentos que
los ayudantes genéricos del núcleo necesiten antes de que cargue el runtime. Las claves también deben declararse en
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

| Campo                  | Tipo                                | Qué significa                                                              |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de medios expuestas por este proveedor.                        |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para la alternativa automática de proveedor basada en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documentos nativas admitidas por el proveedor.                 |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un Plugin de canal necesita metadatos baratos de configuración antes de que
cargue el runtime.

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo         | Tipo                     | Qué significa                                                                           |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/indicadores de sensibilidad opcionales de UI para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta de canal fusionada en superficies de selección e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción corta del canal para superficies de inspección y catálogo.                  |
| `preferOver`  | `string[]`               | IDs de Plugin heredados o de menor prioridad que este canal debe superar en superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
IDs abreviados de modelo como `gpt-5.4` o `claude-sonnet-4.6` antes de que cargue el runtime del Plugin.

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
- si coinciden un Plugin no integrado y uno integrado, gana el Plugin no integrado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifique un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                 |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos que se comparan con `startsWith` frente a IDs abreviados de modelo.  |
| `modelPatterns` | `string[]` | Orígenes regex que se comparan con IDs abreviados de modelo después de eliminar el sufijo de perfil. |

Las claves heredadas de capacidad de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` a `contracts`; la carga normal de
manifiestos ya no trata esos campos de nivel superior como propiedad
de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Úsalo para                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicios de UI que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, restricciones de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del Plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de Plugin previos al runtime viven intencionadamente en `package.json` bajo el bloque
`openclaw` en lugar de en `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                     |
| `openclaw.runtimeExtensions`                                      | Declara puntos de entrada de runtime de JavaScript compilado para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                            |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo para configuración usado durante la incorporación, el inicio diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el punto de entrada de configuración de JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                    |
| `openclaw.channel`                                                | Metadatos baratos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                  |
| `openclaw.channel.configuredState`                                | Metadatos ligeros de comprobación de estado configurado que pueden responder “¿ya existe una configuración solo con variables de entorno?” sin cargar el runtime completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros de comprobación de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el runtime completo del canal.                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indicios de instalación/actualización para Plugins integrados y publicados externamente.                                                                                          |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                               |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host de OpenClaw, usando un mínimo semver como `>=2026.3.22`.                                                                                      |
| `openclaw.install.expectedIntegrity`                              | Cadena de integridad esperada de dist de npm, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido frente a ella.                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de Plugin integrado cuando la configuración no es válida.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes del Plugin de canal completo durante el arranque.                                                    |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
la incorporación antes de que cargue el runtime. `package.json#openclaw.install` indica a
la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas los indicios de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y durante la carga del
registro de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
Plugin en hosts más antiguos.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combínalo con
`expectedIntegrity` cuando quieras que los flujos de actualización fallen en modo cerrado si el
artefacto npm obtenido ya no coincide con la versión fijada. La incorporación interactiva
ofrece especificaciones npm confiables del registro, incluidos nombres de paquete sin calificar y dist-tags.
Cuando `expectedIntegrity` está presente, los flujos de instalación/actualización la aplican; cuando se
omite, la resolución del registro se registra sin fijación de integridad.

Los Plugins de canal deben proporcionar `openclaw.setupEntry` cuando status, la lista de canales
o los análisis de SecretRef necesiten identificar cuentas configuradas sin cargar el runtime completo.
El punto de entrada de configuración debe exponer metadatos del canal más adaptadores seguros de configuración,
estado y secretos; mantén los clientes de red, listeners del Gateway y runtimes de transporte
en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límites del paquete para
los campos de punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer
cargable una ruta `openclaw.extensions` que escape.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente limitado. No
hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación se recuperen de fallos específicos y obsoletos de actualización de Plugin integrado, como una
ruta faltante de Plugin integrado o una entrada obsoleta `channels.<id>` para ese mismo
Plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un módulo comprobador diminuto:

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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una sonda barata
de sí/no de autenticación antes de que cargue el Plugin de canal completo. La exportación de destino debe ser una pequeña
función que lea solo el estado persistido; no la enrutes a través del barrel completo
del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de
estado configurado solo con variables de entorno:

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

Úsalo cuando un canal pueda responder el estado configurado a partir de variables de entorno u otras
entradas mínimas no de runtime. Si la comprobación necesita resolución completa de configuración o el
runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del Plugin.

## Precedencia de descubrimiento (IDs de Plugin duplicados)

OpenClaw descubre Plugins desde varias raíces (integrados, instalación global, espacio de trabajo, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Integrado** — Plugins incluidos con OpenClaw
3. **Instalación global** — Plugins instalados en la raíz global de Plugins de OpenClaw
4. **Espacio de trabajo** — Plugins descubiertos en relación con el espacio de trabajo actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin integrado situada en el espacio de trabajo no eclipsará la compilación integrada.
- Para sobrescribir realmente un Plugin integrado con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del espacio de trabajo.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de arranque puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Todo Plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de Plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa del error del Plugin.
- Si existe configuración del Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los Plugins nativos de OpenClaw**, incluidas las cargas locales desde el sistema de archivos.
- El runtime sigue cargando el módulo del Plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita añadir
  claves personalizadas de nivel superior aquí.
- `providerAuthEnvVars` es la ruta barata de metadatos para sondas de autenticación, validación
  de marcadores de entorno y superficies similares de autenticación de proveedor que no deberían iniciar el runtime del Plugin solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que variantes de proveedor reutilicen las variables de entorno de autenticación,
  los perfiles de autenticación, la autenticación respaldada por configuración y la opción de incorporación de clave de API
  de otro proveedor sin codificar esa relación en el núcleo.
- `providerEndpoints` permite que los Plugins de proveedor posean metadatos simples de coincidencia
  de host/baseUrl de endpoint. Úsalo solo para clases de endpoint que el núcleo ya admita;
  el Plugin sigue siendo propietario del comportamiento en runtime.
- `syntheticAuthRefs` es la ruta barata de metadatos para hooks de autenticación sintética propiedad del proveedor
  que deben ser visibles para el descubrimiento en frío de modelos antes de que exista el registro de runtime.
  Enumera solo referencias cuyo proveedor o backend de CLI en runtime implemente realmente
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` es la ruta barata de metadatos para claves de API de marcador de posición
  propiedad de Plugins integrados, como marcadores de credenciales locales, OAuth o del entorno.
  El núcleo los trata como no secretos para la visualización de autenticación y las auditorías de secretos sin
  codificar el proveedor propietario.
- `channelEnvVars` es la ruta barata de metadatos para la alternativa de variables de entorno del shell, los avisos de configuración
  y superficies similares de canal que no deberían iniciar el runtime del Plugin
  solo para inspeccionar nombres de variables de entorno. Los nombres de variables de entorno son metadatos, no activación por
  sí mismos: status, audit, validación de entrega de Cron y otras superficies de solo lectura
  siguen aplicando la confianza del Plugin y la política de activación efectiva antes de
  tratar una variable de entorno como un canal configurado.
- `providerAuthChoices` es la ruta barata de metadatos para selectores de opciones de autenticación,
  resolución de `--auth-choice`, mapeo de proveedor preferido y registro simple
  de indicadores de CLI de incorporación antes de que cargue el runtime del proveedor. Para metadatos
  del asistente en runtime que requieran código del proveedor, consulta
  [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un
  Plugin no los necesita.
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins) — primeros pasos con Plugins
- [Arquitectura de Plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
