---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas entregar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del Plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto del Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Plugin bundles](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto distintos:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude sin un manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan contra el esquema de `openclaw.plugin.json` descrito aquí.

Para los paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete de Claude, los valores predeterminados de LSP del paquete de Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la **raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración **sin ejecutar código del plugin**. Los manifiestos faltantes o no válidos se tratan como errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de la configuración
- metadatos de autenticación e incorporación que deben estar disponibles sin iniciar el runtime del plugin
- pistas de activación ligeras que las superficies del plano de control pueden inspeccionar antes de que se cargue el runtime
- descriptores de configuración ligeros que las superficies de configuración/incorporación pueden inspeccionar antes de que se cargue el runtime
- metadatos de alias y autoactivación que deben resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familias de modelos que deben autoactivar el plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad empaquetado y la cobertura de contratos
- metadatos ligeros del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar antes de que se cargue el runtime del plugin
- metadatos de configuración específicos del canal que deben fusionarse en las superficies de catálogo y validación sin cargar el runtime
- pistas de IU para la configuración

No lo uses para:

- registrar comportamiento en runtime
- declarar puntos de entrada del código
- metadatos de instalación de npm

Eso pertenece al código de tu plugin y a `package.json`.

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

| Campo                               | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sí          | `string`                         | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                        |
| `configSchema`                      | Sí          | `object`                         | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                  |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin empaquetado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                 |
| `legacyPluginIds`                   | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de plugin.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | IDs de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                   |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No          | `string[]`                       | IDs de canales propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                          |
| `providers`                         | No          | `string[]`                       | IDs de proveedores propiedad de este plugin.                                                                                                                                                                 |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familias de modelos, propiedad del manifiesto, usados para cargar automáticamente el plugin antes del runtime.                                                                      |
| `providerEndpoints`                 | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints, propiedad del manifiesto, para rutas de proveedores que el núcleo debe clasificar antes de que se cargue el runtime del proveedor.                                  |
| `cliBackends`                       | No          | `string[]`                       | IDs de backends de inferencia de CLI propiedad de este plugin. Se usan para la autoactivación al inicio a partir de referencias explícitas de configuración.                                                |
| `syntheticAuthRefs`                 | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética, propiedad del plugin, debe sondearse durante el descubrimiento en frío de modelos antes de que se cargue el runtime.       |
| `nonSecretAuthMarkers`              | No          | `string[]`                       | Valores de marcador de clave API, propiedad del plugin empaquetado, que representan un estado de credenciales no secretas local, OAuth o ambiental.                                                         |
| `commandAliases`                    | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben generar diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el runtime.                                                |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno para autenticación del proveedor que OpenClaw puede inspeccionar sin cargar el código del plugin.                                                                 |
| `providerAuthAliases`               | No          | `Record<string, string>`         | IDs de proveedores que deben reutilizar otro ID de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de código que comparte la clave API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                    | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar el código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en env que los helpers genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y conexión simple de flags de CLI.                                                       |
| `activation`                        | No          | `object`                         | Pistas ligeras de activación para carga disparada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo propietario del comportamiento real.                 |
| `setup`                             | No          | `object`                         | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                             |
| `qaRunners`                         | No          | `object[]`                       | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del plugin.                                                                         |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades empaquetadas para propiedad de speech, transcripción en tiempo real, voz en tiempo real, media-understanding, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal, propiedad del manifiesto, fusionados en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                             |
| `skills`                            | No          | `string[]`                       | Directorios de Skills que se deben cargar, relativos a la raíz del plugin.                                                                                                                                   |
| `name`                              | No          | `string`                         | Nombre legible del plugin.                                                                                                                                                                                   |
| `description`                       | No          | `string`                         | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                  |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                              |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de IU, marcadores de posición y pistas de sensibilidad para campos de configuración.                                                                                                               |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                             |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                            |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se debe despachar.                                                  |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                        |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como valor de reserva.            |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                    |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en selectores interactivos guiados por el asistente.              |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual por CLI.    |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.                 |
| `groupId`             | No          | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                                  |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                            |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                       |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola flag.                           |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                    |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                                  |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin es propietario de un nombre de comando en runtime que los usuarios podrían poner por error en `plugins.allow` o intentar ejecutar como un comando raíz de CLI. OpenClaw usa estos metadatos para diagnósticos sin importar el código del runtime del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                              |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                            |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin puede declarar de forma ligera qué eventos del plano de control deben activarlo más adelante.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo la raíz compartida `openclaw qa`. Mantén estos metadatos ligeros y estáticos; el runtime del plugin sigue siendo propietario del registro real de CLI a través de una superficie ligera `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

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

| Campo         | Obligatorio | Tipo     | Qué significa                                                     |
| ------------- | ----------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.      |
| `description` | No          | `string` | Texto de ayuda de reserva usado cuando el host compartido necesita un comando stub. |

Este bloque es solo metadatos. No registra comportamiento en runtime y no reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga más amplia del plugin, por lo que la falta de metadatos de activación normalmente solo afecta al rendimiento; no debería cambiar la corrección mientras sigan existiendo los mecanismos heredados de propiedad del manifiesto.

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

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                        |
| ---------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | No          | `string[]`                                           | IDs de proveedores que deben activar este plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | IDs de comandos que deben activar este plugin.                       |
| `onChannels`     | No          | `string[]`                                           | IDs de canales que deben activar este plugin.                        |
| `onRoutes`       | No          | `string[]`                                           | Tipos de rutas que deben activar este plugin.                        |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos recurre al comportamiento heredado de `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canal activada por canales recurre a la propiedad heredada de `channels[]` cuando faltan metadatos explícitos de activación de canales
- la planificación de configuración/runtime activada por proveedores recurre a la propiedad heredada de `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedores

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos ligeros propiedad del plugin antes de que se cargue el runtime.

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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia de CLI. `setup.cliBackends` es la superficie descriptora específica de configuración para flujos de plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda orientada primero por descriptores para el descubrimiento de configuración. Si el descriptor solo reduce el plugin candidato y la configuración aún necesita hooks de runtime más ricos en tiempo de configuración, establece `requiresRuntime: true` y mantén `setup-api` como ruta de ejecución de reserva.

Dado que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                              |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Sí          | `string`   | ID del proveedor expuesto durante la configuración o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                           |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.      |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para la búsqueda de configuración orientada por descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este plugin.          |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita ejecución de `setup-api` después de la búsqueda por descriptores.    |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
      "help": "Se usa para las solicitudes a OpenRouter",
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
| `help`        | `string`   | Texto breve de ayuda.                        |
| `tags`        | `string[]` | Etiquetas opcionales de IU.                  |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.      |
| `placeholder` | `string`   | Texto de marcador de posición para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede leer sin importar el runtime del plugin.

```json
{
  "contracts": {
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

| Campo                            | Tipo       | Qué significa                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de proveedores de speech propiedad de este plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedores de transcripción en tiempo real propiedad de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedores de voz en tiempo real propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedores de media-understanding propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedores de generación de imágenes propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedores de generación de video propiedad de este plugin. |
| `webFetchProviders`              | `string[]` | IDs de proveedores de web-fetch propiedad de este plugin.         |
| `webSearchProviders`             | `string[]` | IDs de proveedores de búsqueda web propiedad de este plugin.      |
| `tools`                          | `string[]` | Nombres de herramientas del agente propiedad de este plugin para comprobaciones de contrato empaquetadas. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesita metadatos ligeros de configuración antes de que se cargue el runtime.

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

| Campo         | Tipo                     | Qué significa                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas de IU, marcadores de posición o pistas de sensibilidad opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en las superficies de selección e inspección cuando los metadatos de runtime aún no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                     |
| `preferOver`  | `string[]`               | IDs de plugins heredados o de menor prioridad a los que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de IDs abreviados de modelos como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

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
- si coinciden un plugin no empaquetado y un plugin empaquetado, gana el plugin no empaquetado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a IDs abreviados de modelos.           |
| `modelPatterns` | `string[]` | Orígenes de regex comparados con IDs abreviados de modelos después de quitar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal del manifiesto ya no trata esos campos de nivel superior como propiedad de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Úsalo para                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y pistas de IU que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si se trata de empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos del plugin previos al runtime viven intencionalmente en `package.json` bajo el bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del plugin.                                                                                               |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo para configuración usado durante la incorporación y el arranque diferido del canal.                           |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección.                              |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del verificador de estado configurado que pueden responder “¿ya existe configuración solo por env?” sin cargar el runtime completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del verificador de autenticación persistida que pueden responder “¿ya hay algo autenticado?” sin cargar el runtime completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Pistas de instalación/actualización para plugins empaquetados y publicados externamente.                                                   |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                         |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un límite inferior semver como `>=2026.3.22`.                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de plugin empaquetado cuando la configuración no es válida.                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes que el plugin completo del canal durante el inicio.            |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el plugin en hosts antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación se recuperen de fallos concretos y obsoletos de actualización de plugins empaquetados, como una ruta faltante del plugin empaquetado o una entrada obsoleta `channels.<id>` para ese mismo plugin empaquetado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un pequeño módulo verificador:

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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una comprobación ligera de autenticación sí/no antes de que se cargue el plugin completo del canal. La exportación de destino debe ser una función pequeña que solo lea el estado persistido; no la enrutes a través del barrel completo del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras de estado configurado solo por env:

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

Úsalo cuando un canal pueda responder el estado configurado a partir de env u otras entradas pequeñas que no sean de runtime. Si la comprobación necesita la resolución completa de la configuración o el runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del plugin.

## Requisitos del esquema JSON

- **Todo plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*` deben hacer referencia a IDs de plugin **descubribles**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante, la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor y en los logs.

Consulta la [Referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita añadir aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta de metadatos ligera para sondeos de autenticación, validación de marcadores de env y superficies similares de autenticación del proveedor que no deberían iniciar el runtime del plugin solo para inspeccionar nombres de env.
- `providerAuthAliases` permite que las variantes de proveedores reutilicen las variables de entorno de autenticación, los perfiles de autenticación, la autenticación basada en configuración y la opción de incorporación de clave API de otro proveedor sin codificar esa relación en el núcleo.
- `providerEndpoints` permite que los plugins de proveedores sean propietarios de metadatos simples de coincidencia de host/baseUrl de endpoints. Úsalo solo para clases de endpoint que el núcleo ya admita; el plugin sigue siendo propietario del comportamiento en runtime.
- `syntheticAuthRefs` es la ruta de metadatos ligera para hooks de autenticación sintética propiedad del proveedor que deben ser visibles para el descubrimiento en frío de modelos antes de que exista el registro de runtime. Enumera solo referencias cuyo proveedor o backend de CLI en runtime implemente realmente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` es la ruta de metadatos ligera para claves API de marcador de posición propiedad de plugins empaquetados, como marcadores de credenciales locales, OAuth o ambientales. El núcleo los trata como no secretos para la visualización de autenticación y auditorías de secretos sin codificar el proveedor propietario.
- `channelEnvVars` es la ruta de metadatos ligera para fallback de env del shell, prompts de configuración y superficies similares de canal que no deberían iniciar el runtime del plugin solo para inspeccionar nombres de env.
- `providerAuthChoices` es la ruta de metadatos ligera para selectores de opciones de autenticación, resolución de `--auth-choice`, asignación de proveedor preferido y registro simple de flags de CLI de incorporación antes de que se cargue el runtime del proveedor. Para metadatos del asistente de runtime que requieren código del proveedor, consulta [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesita.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permisos del administrador de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de Plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
