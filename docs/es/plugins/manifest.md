---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Manifiesto de Plugin + requisitos del esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-23T05:17:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da8ce35aca4c12bf49a4c3e352fb7fc2b5768cb34157a00dabd247fe60b4f04
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto de Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de bundles compatibles, consulta [Bundles de Plugin](/es/plugins/bundles).

Los formatos de bundle compatibles usan archivos de manifiesto diferentes:

- Bundle de Codex: `.codex-plugin/plugin.json`
- Bundle de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado del componente Claude
  sin manifiesto
- Bundle de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de bundle, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee los metadatos del bundle más las
raíces de Skills declaradas, raíces de comandos de Claude, valores predeterminados de `settings.json` del bundle de Claude,
valores predeterminados de LSP del bundle de Claude y paquetes de hooks compatibles cuando el diseño coincide con
las expectativas del runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar el código del Plugin**. Los manifiestos faltantes o inválidos se tratan como
errores del Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` es el metadato que OpenClaw lee antes de cargar el
código de tu Plugin.

Úsalo para:

- identidad del Plugin
- validación de configuración
- metadatos de autenticación e incorporación que deban estar disponibles sin iniciar el runtime del Plugin
- pistas de activación baratas que las superficies del plano de control puedan inspeccionar antes de que cargue el runtime
- descriptores de configuración baratos que las superficies de configuración/incorporación puedan inspeccionar antes de que cargue el runtime
- metadatos de alias y autoactivación que deban resolverse antes de que cargue el runtime del Plugin
- metadatos abreviados de propiedad de familias de modelos que deban activar automáticamente el
  Plugin antes de que cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad incluido y
  la cobertura de contratos
- metadatos baratos del ejecutor de QA que el host compartido `openclaw qa` pueda inspeccionar
  antes de que cargue el runtime del Plugin
- metadatos de configuración específicos del canal que deban combinarse en las superficies de catálogo y validación sin cargar el runtime
- pistas de interfaz de usuario para la configuración

No lo uses para:

- registrar comportamiento en runtime
- declarar puntos de entrada de código
- metadatos de instalación de npm

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

| Campo                                | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                 |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sí          | `string`                         | ID canónico del Plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                       | Sí          | `object`                         | JSON Schema en línea para la configuración de este Plugin.                                                                                                                                                    |
| `enabledByDefault`                   | No          | `true`                           | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado de forma predeterminada.                    |
| `legacyPluginIds`                    | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de Plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | IDs de proveedor que deben habilitar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                       |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`.                                                                                                                                              |
| `channels`                           | No          | `string[]`                       | IDs de canal propiedad de este Plugin. Se usan para descubrimiento y validación de configuración.                                                                                                             |
| `providers`                          | No          | `string[]`                       | IDs de proveedor propiedad de este Plugin.                                                                                                                                                                    |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para cargar automáticamente el Plugin antes del runtime.                                                                          |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos propiedad del manifiesto de host/baseUrl de endpoint para rutas de proveedor que el núcleo debe clasificar antes de que cargue el runtime del proveedor.                                          |
| `cliBackends`                        | No          | `string[]`                       | IDs de backend de inferencia CLI propiedad de este Plugin. Se usan para autoactivación al inicio a partir de referencias explícitas de configuración.                                                        |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del Plugin debe sondearse durante el descubrimiento en frío de modelos antes de que cargue el runtime.            |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad de Plugin incluido que representan un estado de credenciales local, OAuth o ambiental no secreto.                                                  |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de que cargue el runtime.                                                   |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos baratos de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del Plugin.                                                                                    |
| `providerAuthAliases`                | No          | `Record<string, string>`         | IDs de proveedor que deben reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de programación que comparte la clave de API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos baratos de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Usa esto para superficies de configuración o autenticación de canales basadas en env que los ayudantes genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos baratos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y conexión simple de banderas de CLI.                                                   |
| `activation`                         | No          | `object`                         | Pistas baratas de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del Plugin sigue siendo propietario del comportamiento real.             |
| `setup`                              | No          | `object`                         | Descriptores baratos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del Plugin.                                             |
| `qaRunners`                          | No          | `object[]`                       | Descriptores baratos del ejecutor de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del Plugin.                                                                             |
| `contracts`                          | No          | `object`                         | Instantánea estática de capacidades incluidas para voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados baratos de comprensión de medios para IDs de proveedor declarados en `contracts.mediaUnderstandingProviders`.                                                                       |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto combinados en las superficies de descubrimiento y validación antes de que cargue el runtime.                                                   |
| `skills`                             | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del Plugin.                                                                                                                                       |
| `name`                               | No          | `string`                         | Nombre legible del Plugin.                                                                                                                                                                                    |
| `description`                        | No          | `string`                         | Resumen breve mostrado en las superficies del Plugin.                                                                                                                                                         |
| `version`                            | No          | `string`                         | Versión informativa del Plugin.                                                                                                                                                                               |
| `uiHints`                            | No          | `Record<string, object>`         | Etiquetas de interfaz de usuario, placeholders y pistas de sensibilidad para campos de configuración.                                                                                                        |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                        |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se enviará.                                                     |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                   |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como respaldo.                |
| `choiceHint`          | No          | `string`                                        | Texto corto de ayuda para el selector.                                                                |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.  |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en los selectores del asistente, pero sigue permitiendo la selección manual por CLI. |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.             |
| `groupId`             | No          | `string`                                        | ID opcional de grupo para agrupar opciones relacionadas.                                              |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                        |
| `groupHint`           | No          | `string`                                        | Texto corto de ayuda para el grupo.                                                                   |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola bandera.                    |
| `cliFlag`             | No          | `string`                                        | Nombre de la bandera de CLI, como `--openrouter-api-key`.                                             |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                              |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un Plugin sea propietario de un nombre de comando en runtime que los usuarios puedan
poner por error en `plugins.allow` o intentar ejecutar como un comando raíz de CLI. OpenClaw
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                                  |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------ |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este Plugin.                                |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado para sugerir en operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el Plugin pueda declarar de forma económica qué eventos del plano de control
deben activarlo más adelante.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un Plugin aporte uno o más runners de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos baratos y estáticos; el runtime del Plugin
sigue siendo propietario del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta el carril de QA en vivo de Matrix respaldado por Docker contra un homeserver desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Qué significa                                                      |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.       |
| `description` | No          | `string` | Texto de ayuda de respaldo usado cuando el host compartido necesita un comando stub. |

Este bloque es solo metadatos. No registra comportamiento en runtime y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/Plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga más amplia de Plugins, por lo que
la ausencia de metadatos de activación normalmente solo cuesta rendimiento; no debería
cambiar la corrección mientras sigan existiendo respaldos heredados de propiedad en el manifiesto.

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

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                       |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | No          | `string[]`                                           | IDs de proveedor que deben activar este Plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | IDs de comando que deben activar este Plugin.                       |
| `onChannels`     | No          | `string[]`                                           | IDs de canal que deben activar este Plugin.                         |
| `onRoutes`       | No          | `string[]`                                           | Tipos de ruta que deben activar este Plugin.                        |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos usa como respaldo
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canal activada por canal usa como respaldo la propiedad heredada
  `channels[]` cuando faltan metadatos explícitos de activación del canal
- la planificación de configuración/runtime activada por proveedor usa como respaldo la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación del proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos baratos propiedad del Plugin
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
flujos del plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la
superficie preferida de búsqueda basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
reduce el Plugin candidato y la configuración sigue necesitando hooks de runtime más ricos en tiempo de configuración,
establece `requiresRuntime: true` y mantén `setup-api` como
ruta de ejecución de respaldo.

Debido a que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del Plugin, los valores normalizados
`setup.providers[].id` y `setup.cliBackends[]` deben mantenerse únicos entre los
Plugins descubiertos. La propiedad ambigua falla de forma segura en lugar de elegir un
ganador por orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                         |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Sí          | `string`   | ID del proveedor expuesto durante la configuración o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que cargue el runtime del Plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                         |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.     |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para la búsqueda basada primero en descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este Plugin.         |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración sigue necesitando ejecución de `setup-api` después de la búsqueda por descriptor. |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave de API",
      "help": "Usada para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada pista de campo puede incluir:

| Campo         | Tipo       | Qué significa                                |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario.  |
| `help`        | `string`   | Texto corto de ayuda.                        |
| `tags`        | `string[]` | Etiquetas opcionales de interfaz de usuario. |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.      |
| `placeholder` | `string`   | Texto placeholder para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el runtime del Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Campo                            | Tipo       | Qué significa                                                          |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs de runtime incrustado para los que un Plugin incluido puede registrar factories. |
| `speechProviders`                | `string[]` | IDs de proveedor de voz que pertenecen a este Plugin.                  |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedor de transcripción en tiempo real que pertenecen a este Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedor de voz en tiempo real que pertenecen a este Plugin.   |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedor de comprensión de medios que pertenecen a este Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedor de generación de imágenes que pertenecen a este Plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedor de generación de video que pertenecen a este Plugin.  |
| `webFetchProviders`              | `string[]` | IDs de proveedor de web-fetch que pertenecen a este Plugin.            |
| `webSearchProviders`             | `string[]` | IDs de proveedor de búsqueda web que pertenecen a este Plugin.         |
| `tools`                          | `string[]` | Nombres de herramientas de agente que pertenecen a este Plugin para verificaciones de contrato incluidas. |

## Referencia de `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tenga
modelos predeterminados, prioridad de respaldo de autenticación automática o compatibilidad nativa con documentos que los ayudantes genéricos del núcleo
necesiten antes de que cargue el runtime. Las claves también deben declararse en
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
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para el respaldo automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documento nativas compatibles con el proveedor.                   |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos de configuración baratos antes de que
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

| Campo         | Tipo                     | Qué significa                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/pistas de sensibilidad opcionales de interfaz de usuario para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta de canal combinada en las superficies de selección e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción corta del canal para las superficies de inspección y catálogo.                    |
| `preferOver`  | `string[]`               | IDs de Plugin heredados o de menor prioridad que este canal debe superar en las superficies de selección. |

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

- las referencias explícitas `provider/model` usan los metadatos de manifiesto `providers` del propietario
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si coinciden un Plugin no incluido y un Plugin incluido, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a IDs abreviados de modelo.          |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con IDs abreviados de modelo después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidad de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como
propiedad de capacidad.

## Manifiesto frente a package.json

Los dos archivos sirven para trabajos diferentes:

| Archivo                | Úsalo para                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y pistas de interfaz de usuario que deben existir antes de que se ejecute el código del Plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, compuerta de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde pertenece un dato de metadatos, usa esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del Plugin, colócalo en `openclaw.plugin.json`
- si se trata de empaquetado, archivos de entrada o comportamiento de instalación de npm, colócalo en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de Plugin previos al runtime viven intencionalmente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos de Plugin. Deben permanecer dentro del directorio del paquete del Plugin.                                                                          |
| `openclaw.runtimeExtensions`                                      | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin.                                 |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo de configuración usado durante incorporación, inicio diferido de canales y descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin.                           |
| `openclaw.channel`                                                | Metadatos baratos del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                      |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del verificador de estado configurado que pueden responder “¿ya existe configuración solo por env?” sin cargar el runtime completo del canal.                     |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del verificador de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el runtime completo del canal.                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Pistas de instalación/actualización para Plugins incluidos y publicados externamente.                                                                                                |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                   |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un umbral semver como `>=2026.3.22`.                                                                                            |
| `openclaw.install.expectedIntegrity`                              | Cadena de integridad esperada de npm dist como `sha512-...`; los flujos de instalación y actualización verifican el artefacto descargado contra ella.                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta estrecha de recuperación por reinstalación de Plugin incluido cuando la configuración es inválida.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes que el Plugin completo del canal durante el inicio.                                                     |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
la incorporación antes de que cargue el runtime. `package.json#openclaw.install` le dice a
la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las pistas de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del
registro de manifiestos. Los valores inválidos se rechazan; los valores válidos pero más nuevos omiten el
Plugin en hosts más antiguos.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combínalo con
`expectedIntegrity` cuando quieras que los flujos de actualización fallen de forma segura si el
artefacto npm obtenido ya no coincide con la versión fijada. La incorporación interactiva solo
ofrece opciones de instalación npm a partir de metadatos de catálogo de confianza cuando `npmSpec` es una
versión exacta y `expectedIntegrity` está presente; de lo contrario, recurre a una
fuente local o a omitirla.

Los Plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar el
runtime completo. La entrada de configuración debe exponer metadatos de canal más adaptadores seguros para configuración,
estado y secretos; mantén los clientes de red, listeners de Gateway y runtimes de transporte en el punto de entrada principal de la extensión.

Los campos del punto de entrada de runtime no reemplazan las comprobaciones de límite de paquete para los campos
del punto de entrada de código fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer que una
ruta de escape de `openclaw.extensions` sea cargable.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente estrecho. No
hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos heredados de actualización de Plugins incluidos, como una
ruta faltante de Plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo
Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una sonda barata
de autenticación sí/no antes de que cargue el Plugin completo del canal. La exportación de destino debe ser una
función pequeña que lea solo el estado persistido; no la enrutes a través del barrel de runtime completo del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas
de estado configurado solo por env:

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

Úsalo cuando un canal pueda responder al estado configurado desde env u otras entradas pequeñas
que no sean de runtime. Si la comprobación necesita resolución completa de configuración o el runtime real
del canal, mantén esa lógica en el hook del Plugin `config.hasConfiguredState`.

## Precedencia de descubrimiento (IDs de Plugin duplicados)

OpenClaw descubre Plugins desde varias raíces (incluidos, instalación global, espacio de trabajo, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — Plugins distribuidos con OpenClaw
3. **Instalación global** — Plugins instalados en la raíz global de Plugins de OpenClaw
4. **Espacio de trabajo** — Plugins descubiertos en relación con el espacio de trabajo actual

Implicaciones:

- Una copia bifurcada u obsoleta de un Plugin incluido que esté en el espacio de trabajo no sustituirá a la compilación incluida.
- Para reemplazar realmente un Plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del espacio de trabajo.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Todo Plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas de `channels.*` son **errores**, a menos que el ID de canal esté declarado por
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de Plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa el error del Plugin.
- Si existe configuración del Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los Plugins nativos de OpenClaw**, incluidas las cargas locales desde el sistema de archivos.
- El runtime sigue cargando el módulo del Plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee campos documentados del manifiesto. Evita agregar
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta barata de metadatos para sondas de autenticación, validación
  de marcadores de env y superficies similares de autenticación de proveedor que no deben iniciar el runtime del Plugin
  solo para inspeccionar nombres de env.
- `providerAuthAliases` permite que variantes de proveedor reutilicen las
  variables de entorno de autenticación, perfiles de autenticación, autenticación respaldada por configuración y opción de incorporación de clave de API
  de otro proveedor sin codificar de forma rígida esa relación en el núcleo.
- `providerEndpoints` permite que los Plugins de proveedor sean propietarios de metadatos simples
  de coincidencia de host/baseUrl de endpoint. Úsalo solo para clases de endpoint que el núcleo ya admita;
  el Plugin sigue siendo propietario del comportamiento en runtime.
- `syntheticAuthRefs` es la ruta barata de metadatos para hooks sintéticos de autenticación
  propiedad del proveedor que deben ser visibles para el descubrimiento en frío de modelos antes de que exista el
  registro de runtime. Enumera solo las referencias cuyo proveedor o backend de CLI en runtime realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` es la ruta barata de metadatos para claves de API de marcador de posición
  propiedad de Plugins incluidos, como marcadores de credenciales locales, OAuth o ambientales.
  El núcleo los trata como no secretos para la visualización de autenticación y las auditorías de secretos sin
  codificar de forma rígida el proveedor propietario.
- `channelEnvVars` es la ruta barata de metadatos para respaldo de shell-env, prompts de configuración
  y superficies similares de canal que no deben iniciar el runtime del Plugin
  solo para inspeccionar nombres de env. Los nombres de env son metadatos, no activación por
  sí mismos: el estado, la auditoría, la validación de entrega por Cron y otras superficies de solo lectura
  siguen aplicando la confianza del Plugin y la política de activación efectiva antes de
  tratar una variable de entorno como un canal configurado.
- `providerAuthChoices` es la ruta barata de metadatos para selectores de opciones de autenticación,
  resolución de `--auth-choice`, mapeo de proveedor preferido y registro simple de banderas CLI de incorporación
  antes de que cargue el runtime del proveedor. Para metadatos del asistente de runtime
  que requieren código de proveedor, consulta
  [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` se pueden omitir cuando un
  Plugin no los necesite.
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins) — primeros pasos con Plugins
- [Arquitectura de Plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
