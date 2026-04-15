---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas entregar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del Plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-04-15T05:11:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto del Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño de componente predeterminado de Claude
  sin un manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete de Claude,
los valores predeterminados de LSP del paquete de Claude, y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del runtime de
OpenClaw.

Cada Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos ausentes o no válidos se tratan como
errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de configuración
- metadatos de autenticación e incorporación que deben estar disponibles sin iniciar el
  runtime del plugin
- pistas de activación económicas que las superficies del plano de control pueden inspeccionar antes de que se cargue el runtime
- descriptores de configuración económicos que las superficies de configuración/incorporación pueden inspeccionar antes de
  que se cargue el runtime
- metadatos de alias y autoactivación que deben resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familias de modelos que deben autoactivar el
  plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad agrupada y
  la cobertura de contratos
- metadatos económicos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
  antes de que se cargue el runtime del plugin
- metadatos de configuración específicos del canal que deben fusionarse en las superficies de catálogo y validación
  sin cargar el runtime
- pistas de UI de configuración

No lo uses para:

- registrar comportamiento en runtime
- declarar entrypoints de código
- metadatos de instalación de npm

Esos pertenecen al código de tu plugin y a `package.json`.

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
  "cliBackends": ["openrouter-cli"],
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

| Campo                               | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                        |
| ----------------------------------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Sí          | `string`                         | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                              |
| `configSchema`                      | Sí          | `object`                         | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                          |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin agrupado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                             |
| `legacyPluginIds`                   | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico del plugin.                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | IDs de proveedores que deben autohabilitar este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                                         |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                     |
| `channels`                          | No          | `string[]`                       | IDs de canales propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                                 |
| `providers`                         | No          | `string[]`                       | IDs de proveedores propiedad de este plugin.                                                                                                                                                                         |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familias de modelos administrados por el manifiesto usados para autocargar el plugin antes del runtime.                                                                                     |
| `cliBackends`                       | No          | `string[]`                       | IDs de backends de inferencia de CLI propiedad de este plugin. Se usan para la autoactivación al inicio desde referencias de configuración explícitas.                                                             |
| `commandAliases`                    | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el runtime.                                                       |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos económicos de variables de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del plugin.                                                                            |
| `providerAuthAliases`               | No          | `Record<string, string>`         | IDs de proveedores que deben reutilizar otro ID de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de código que comparte la clave API del proveedor base y los perfiles de autenticación. |
| `channelEnvVars`                    | No          | `Record<string, string[]>`       | Metadatos económicos de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que los ayudantes genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos económicos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado sencillo de flags de CLI.                                                         |
| `activation`                        | No          | `object`                         | Pistas de activación económicas para carga activada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo responsable del comportamiento real.                       |
| `setup`                             | No          | `object`                         | Descriptores económicos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                                  |
| `qaRunners`                         | No          | `object[]`                       | Descriptores económicos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del plugin.                                                                              |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades agrupadas para voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal administrados por el manifiesto que se fusionan en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                           |
| `skills`                            | No          | `string[]`                       | Directorios de Skills para cargar, relativos a la raíz del plugin.                                                                                                                                                  |
| `name`                              | No          | `string`                         | Nombre legible del plugin.                                                                                                                                                                                           |
| `description`                       | No          | `string`                         | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                          |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                                      |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de UI, placeholders y pistas de sensibilidad para campos de configuración.                                                                                                                                 |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                          |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se debe enviar.                                                   |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                      |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como alternativa.               |
| `choiceHint`          | No          | `string`                                        | Texto de ayuda breve para el selector.                                                                  |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos guiados por el asistente.        |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual en CLI.   |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.               |
| `groupId`             | No          | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                                |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                          |
| `groupHint`           | No          | `string`                                        | Texto de ayuda breve para el grupo.                                                                     |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola flag.                         |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                  |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                  |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                   |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin posee un nombre de comando en runtime que los usuarios pueden
poner por error en `plugins.allow` o intentar ejecutar como un comando CLI raíz. OpenClaw
usa estos metadatos para diagnósticos sin importar código del runtime del plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                               |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                             |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No          | `string`          | Comando CLI raíz relacionado que se puede sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin puede declarar de forma económica qué eventos del plano de control
deben activarlo más adelante.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo la
raíz compartida `openclaw qa`. Mantén estos metadatos económicos y estáticos; el runtime
del plugin sigue siendo responsable del registro real de CLI a través de una superficie ligera
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

| Campo         | Obligatorio | Tipo     | Qué significa                                                     |
| ------------- | ----------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.      |
| `description` | No          | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando provisional. |

Este bloque es solo metadatos. No registra comportamiento en runtime, y no
reemplaza `register(...)`, `setupEntry` ni otros entrypoints de runtime/plugin.
Los consumidores actuales lo usan como una pista de acotación antes de una carga más amplia del plugin, por lo que
la ausencia de metadatos de activación normalmente solo afecta al rendimiento; no debería
cambiar la corrección mientras sigan existiendo los mecanismos alternativos heredados de propiedad en el manifiesto.

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

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                      |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | No          | `string[]`                                           | IDs de proveedores que deben activar este plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | IDs de comandos que deben activar este plugin.                     |
| `onChannels`     | No          | `string[]`                                           | IDs de canales que deben activar este plugin.                      |
| `onRoutes`       | No          | `string[]`                                           | Tipos de rutas que deben activar este plugin.                      |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidades usadas por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos recurre a los mecanismos heredados
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canales activada por canales recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedores recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación
  de proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos económicos propiedad del plugin
antes de que se cargue el runtime.

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
flujos de configuración/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie
preferida de búsqueda basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
reduce el plugin candidato y la configuración aún necesita hooks de runtime más completos en tiempo de configuración,
establece `requiresRuntime: true` y mantén `setup-api` como la
ruta de ejecución alternativa.

Debido a que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin,
los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre
los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                                 |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------- |
| `id`          | Sí          | `string`   | ID del proveedor expuesto durante la configuración o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar todo el runtime. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                          |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.      |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este plugin.          |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración todavía necesita la ejecución de `setup-api` después de la búsqueda por descriptor. |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
      "help": "Se usa para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada pista de campo puede incluir:

| Campo         | Tipo       | Qué significa                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto de ayuda breve.                    |
| `tags`        | `string[]` | Etiquetas de UI opcionales.              |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.  |
| `placeholder` | `string`   | Texto placeholder para entradas de formularios. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
leer sin importar el runtime del plugin.

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

| Campo                            | Tipo       | Qué significa                                                |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `speechProviders`                | `string[]` | IDs de proveedores de voz que pertenecen a este plugin.      |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedores de transcripción en tiempo real que pertenecen a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedores de voz en tiempo real que pertenecen a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedores de comprensión de medios que pertenecen a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedores de generación de imágenes que pertenecen a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedores de generación de video que pertenecen a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de proveedores de web-fetch que pertenecen a este plugin. |
| `webSearchProviders`             | `string[]` | IDs de proveedores de búsqueda web que pertenecen a este plugin. |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este plugin para comprobaciones de contratos agrupados. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesita metadatos de configuración económicos antes
de que se cargue el runtime.

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
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI/placeholders/pistas de sensibilidad opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en las superficies de selector e inspección cuando los metadatos del runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                     |
| `preferOver`  | `string[]`               | IDs de plugins heredados o de menor prioridad a los que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw debe inferir tu plugin de proveedor a partir de
IDs abreviados de modelos como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

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
- si coinciden un plugin no agrupado y un plugin agrupado, gana el plugin no agrupado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra IDs abreviados de modelos.           |
| `modelPatterns` | `string[]` | Orígenes regex comparados contra IDs abreviados de modelos después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad
de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y pistas de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar código del plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, ponla en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos del plugin previos al runtime viven intencionalmente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos del plugin.                                                                                                      |
| `openclaw.setupEntry`                                             | Entrypoint ligero solo de configuración usado durante la incorporación y el inicio diferido del canal.                                      |
| `openclaw.channel`                                                | Metadatos económicos del catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección.                            |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del comprobador de estado configurado que pueden responder “¿ya existe una configuración solo por env?” sin cargar todo el runtime del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del comprobador de autenticación persistida que pueden responder “¿ya hay algo autenticado?” sin cargar todo el runtime del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Pistas de instalación/actualización para plugins agrupados y publicados externamente.                                                       |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                          |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un límite inferior semver como `>=2026.3.22`.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación de reinstalación de plugins agrupados cuando la configuración no es válida.                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies del canal solo de configuración se carguen antes que el plugin completo del canal durante el inicio.            |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
plugin en hosts más antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No
hace instalables configuraciones rotas arbitrarias. Actualmente solo permite que los flujos de instalación
se recuperen de fallos específicos de actualización de plugins agrupados obsoletos, como una
ruta faltante del plugin agrupado o una entrada obsoleta `channels.<id>` para ese mismo
plugin agrupado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una sonda económica
de autenticación sí/no antes de que se cargue el plugin completo del canal. La exportación de destino debe ser una pequeña
función que solo lea el estado persistido; no la enrutes a través del barrel completo
del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones económicas
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
ajenas al runtime. Si la comprobación necesita resolución completa de configuración o el runtime real
del canal, mantén esa lógica en el hook `config.hasConfiguredState` del plugin.

## Requisitos del esquema JSON

- **Cada plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de leer/escribir la configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, y `plugins.slots.*`
  deben hacer referencia a IDs de plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + logs.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los Plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas, siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos del manifiesto documentados. Evita agregar
  claves personalizadas de nivel superior aquí.
- `providerAuthEnvVars` es la ruta de metadatos económica para sondeos de autenticación, validación
  de marcadores de variables de entorno y superficies similares de autenticación de proveedor que no deben iniciar el
  runtime del plugin solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que las variantes de proveedor reutilicen las
  variables de entorno de autenticación de otro proveedor, los perfiles de autenticación, la autenticación respaldada por configuración y la
  opción de incorporación de clave API sin codificar rígidamente esa relación en el core.
- `channelEnvVars` es la ruta de metadatos económica para el fallback de variables de entorno del shell, los prompts
  de configuración y superficies similares de canal que no deben iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta de metadatos económica para selectores de opciones de autenticación,
  resolución de `--auth-choice`, asignación de proveedor preferido y registro sencillo de flags de CLI
  de incorporación antes de que se cargue el runtime del proveedor. Para metadatos del asistente de runtime
  que requieran código del proveedor, consulta
  [Hooks de runtime de proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends`, y `skills` pueden omitirse cuando un
  plugin no los necesite.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de Plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
