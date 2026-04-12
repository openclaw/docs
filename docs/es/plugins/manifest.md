---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas entregar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Manifest de Plugin y requisitos de JSON schema (validación estricta de configuración)
title: Manifest de Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest de Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifest nativo de Plugin de OpenClaw**.

Para layouts de bundles compatibles, consulta [Bundles de Plugin](/es/plugins/bundles).

Los formatos de bundle compatibles usan archivos de manifest diferentes:

- Bundle de Codex: `.codex-plugin/plugin.json`
- Bundle de Claude: `.claude-plugin/plugin.json` o el layout predeterminado de componentes de Claude
  sin un manifest
- Bundle de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos layouts de bundle, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee los metadatos del bundle más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del bundle de Claude,
los valores predeterminados de LSP del bundle de Claude y los paquetes de hooks compatibles cuando el layout coincide
con las expectativas de runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifest para validar la configuración
**sin ejecutar código del plugin**. Los manifests faltantes o no válidos se tratan como
errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de configuración
- metadatos de autenticación e incorporación que deben estar disponibles sin iniciar el
  runtime del plugin
- indicios de activación económicos que las superficies del plano de control pueden inspeccionar antes de que se cargue el runtime
- descriptores de configuración económicos que las superficies de configuración/incorporación pueden inspeccionar antes de que se cargue el
  runtime
- metadatos de alias y autoactivación que deben resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familias de modelos que deben autoactivar el
  plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para cableado de compatibilidad incluido y cobertura de contratos
- metadatos de configuración específicos del canal que deben fusionarse en las superficies de catálogo y validación sin cargar el runtime
- indicios de UI para configuración

No lo uses para:

- registrar comportamiento de runtime
- declarar entrypoints de código
- metadatos de instalación de npm

Esas cosas pertenecen al código de tu plugin y a `package.json`.

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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | Id canónico del plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                      |
| `configSchema`                      | Yes      | `object`                         | JSON Schema en línea para la configuración de este plugin.                                                                                                                                                   |
| `enabledByDefault`                  | No       | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                    |
| `legacyPluginIds`                   | No       | `string[]`                       | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                               |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | Ids de proveedor que deben autoactivar este plugin cuando la autenticación, configuración o referencias a modelos los mencionen.                                                                            |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No       | `string[]`                       | Ids de canal propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                           |
| `providers`                         | No       | `string[]`                       | Ids de proveedor propiedad de este plugin.                                                                                                                                                                   |
| `modelSupport`                      | No       | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifest usados para autocargar el plugin antes del runtime.                                                                                      |
| `cliBackends`                       | No       | `string[]`                       | Ids de backend de inferencia de CLI propiedad de este plugin. Se usan para autoactivación al inicio a partir de referencias explícitas de configuración.                                                   |
| `commandAliases`                    | No       | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el runtime.                                              |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | Metadatos económicos de variables de entorno para autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del plugin.                                                                  |
| `providerAuthAliases`               | No       | `Record<string, string>`         | Ids de proveedor que deben reutilizar otro id de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de coding que comparte la clave de API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                    | No       | `Record<string, string[]>`       | Metadatos económicos de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que los ayudantes genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`               | No       | `object[]`                       | Metadatos económicos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI.                                                   |
| `activation`                        | No       | `object`                         | Indicios económicos de activación para carga disparada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo dueño del comportamiento real.                 |
| `setup`                             | No       | `object`                         | Descriptores económicos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                          |
| `contracts`                         | No       | `object`                         | Instantánea estática de capacidades incluidas para speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, búsqueda web y propiedad de herramientas. |
| `channelConfigs`                    | No       | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifest fusionados en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                                 |
| `skills`                            | No       | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                      |
| `name`                              | No       | `string`                         | Nombre legible del plugin.                                                                                                                                                                                   |
| `description`                       | No       | `string`                         | Resumen breve mostrado en las superficies del plugin.                                                                                                                                                        |
| `version`                           | No       | `string`                         | Versión informativa del plugin.                                                                                                                                                                              |
| `uiHints`                           | No       | `Record<string, object>`         | Etiquetas de UI, placeholders e indicios de sensibilidad para campos de configuración.                                                                                                                       |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el runtime del proveedor.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | Id del proveedor al que pertenece esta opción.                                                           |
| `method`              | Yes      | `string`                                        | Id del método de autenticación al que se enviará.                                                        |
| `choiceId`            | Yes      | `string`                                        | Id estable de opción de autenticación usado por los flujos de incorporación y CLI.                      |
| `choiceLabel`         | No       | `string`                                        | Etiqueta orientada al usuario. Si se omite, OpenClaw usa `choiceId` como fallback.                      |
| `choiceHint`          | No       | `string`                                        | Texto breve de ayuda para el selector.                                                                   |
| `assistantPriority`   | No       | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos guiados por el asistente.         |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual en CLI.    |
| `deprecatedChoiceIds` | No       | `string[]`                                      | Ids heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.                |
| `groupId`             | No       | `string`                                        | Id de grupo opcional para agrupar opciones relacionadas.                                                 |
| `groupLabel`          | No       | `string`                                        | Etiqueta orientada al usuario para ese grupo.                                                            |
| `groupHint`           | No       | `string`                                        | Texto breve de ayuda para el grupo.                                                                      |
| `optionKey`           | No       | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola flag.                          |
| `cliFlag`             | No       | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                   |
| `cliOption`           | No       | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | No       | `string`                                        | Descripción usada en la ayuda de CLI.                                                                    |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin sea propietario de un nombre de comando de runtime que los usuarios puedan
poner por error en `plugins.allow` o intentar ejecutar como un comando raíz de CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar código de runtime del plugin.

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

| Field        | Required | Type              | What it means                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Yes      | `string`          | Nombre de comando que pertenece a este plugin.                          |
| `kind`       | No       | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No       | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin pueda declarar de forma económica qué eventos del plano de control
deben activarlo más adelante.

Este bloque es solo metadatos. No registra comportamiento de runtime, y no
reemplaza `register(...)`, `setupEntry` ni otros entrypoints de runtime/plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga más amplia de plugins, por lo que
la falta de metadatos de activación normalmente solo afecta al rendimiento; no debería
cambiar la corrección mientras sigan existiendo los fallbacks heredados de propiedad del manifest.

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

| Field            | Required | Type                                                 | What it means                                                     |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | No       | `string[]`                                           | Ids de proveedor que deben activar este plugin cuando se soliciten. |
| `onCommands`     | No       | `string[]`                                           | Ids de comando que deben activar este plugin.                     |
| `onChannels`     | No       | `string[]`                                           | Ids de canal que deben activar este plugin.                       |
| `onRoutes`       | No       | `string[]`                                           | Tipos de ruta que deben activar este plugin.                      |
| `onCapabilities` | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidades usadas por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos usa como fallback
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canales activada por canales usa como fallback la propiedad heredada
  `channels[]` cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedores usa como fallback la propiedad heredada
  `providers[]` y la propiedad de nivel superior `cliBackends[]` cuando faltan metadatos explícitos
  de activación de proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos propiedad del plugin de forma económica
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

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo los backends de inferencia de CLI.
`setup.cliBackends` es la superficie de descriptor específica de configuración para
flujos del plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida
basada primero en descriptores para la búsqueda de configuración. Si el descriptor solo
reduce el plugin candidato y la configuración aún necesita hooks más ricos en tiempo de configuración del runtime,
establece `requiresRuntime: true` y mantén `setup-api` como la
ruta de ejecución de fallback.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin,
los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos
entre los plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir
un ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Field         | Required | Type       | What it means                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Yes      | `string`   | Id del proveedor expuesto durante la configuración o incorporación. Mantén los ids normalizados globalmente únicos. |
| `authMethods` | No       | `string[]` | Ids de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No       | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Field              | Required | Type       | What it means                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.   |
| `cliBackends`      | No       | `string[]` | Ids de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No       | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este plugin.       |
| `requiresRuntime`  | No       | `boolean`  | Si la configuración aún necesita ejecutar `setup-api` después de la búsqueda de descriptores.      |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

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

Cada pista de campo puede incluir:

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta del campo orientada al usuario. |
| `help`        | `string`   | Texto breve de ayuda.                   |
| `tags`        | `string[]` | Etiquetas opcionales de UI.             |
| `advanced`    | `boolean`  | Marca el campo como avanzado.           |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulario. |

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

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ids de proveedor de speech que pertenecen a este plugin.       |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedor de transcripción en tiempo real que pertenecen a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedor de voz en tiempo real que pertenecen a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedor de comprensión multimedia que pertenecen a este plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedor de generación de imágenes que pertenecen a este plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedor de generación de video que pertenecen a este plugin. |
| `webFetchProviders`              | `string[]` | Ids de proveedor de web-fetch que pertenecen a este plugin.    |
| `webSearchProviders`             | `string[]` | Ids de proveedor de búsqueda web que pertenecen a este plugin. |
| `tools`                          | `string[]` | Nombres de herramientas del agente que pertenecen a este plugin para comprobaciones de contratos incluidos. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesite metadatos de configuración económicos antes de que se cargue el runtime.

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
      "description": "Conexión al homeserver de Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/indicaciones de sensibilidad de UI opcionales para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en superficies de selector e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                    |
| `preferOver`  | `string[]`               | Ids de plugin heredados o de menor prioridad que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de
ids abreviados de modelo como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifest `providers` propietario
- `modelPatterns` tiene prioridad sobre `modelPrefixes`
- si coinciden un plugin no incluido y uno incluido, gana el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra ids abreviados de modelo.           |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con ids abreviados de modelo después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal del
manifest ya no trata esos campos de nivel superior como
propiedad de capacidades.

## Manifest frente a package.json

Los dos archivos cumplen funciones distintas:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicaciones de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos del plugin previos al runtime viven intencionalmente en `package.json` bajo el bloque
`openclaw` en lugar de en `openclaw.plugin.json`.

Ejemplos importantes:

| Field                                                             | What it means                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos del plugin.                                                                                                      |
| `openclaw.setupEntry`                                             | Entrypoint ligero solo de configuración usado durante la incorporación y el inicio diferido del canal.                                      |
| `openclaw.channel`                                                | Metadatos económicos de catálogo de canal como etiquetas, rutas de documentación, alias y texto de selección.                               |
| `openclaw.channel.configuredState`                                | Metadatos económicos del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por entorno?" sin cargar el runtime completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos económicos del comprobador de autenticación persistida que pueden responder "¿ya hay algo autenticado?" sin cargar el runtime completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indicaciones de instalación/actualización para plugins incluidos y publicados externamente.                                                  |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                          |
| `openclaw.install.minHostVersion`                                 | Versión mínima admitida del host OpenClaw, usando un mínimo semver como `>=2026.3.22`.                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de plugin incluido cuando la configuración no es válida.                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies del canal solo de configuración se carguen antes que el plugin de canal completo durante el inicio.            |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del
registro de manifests. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
plugin en hosts más antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No
hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos obsoletos de actualización de plugins incluidos, como una
ruta faltante de plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de package para un módulo comprobador pequeño:

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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una
sonda económica de autenticación sí/no antes de que se cargue el plugin completo del canal. La exportación objetivo debe ser una función pequeña
que lea solo el estado persistido; no la enrutes a través del barrel completo del runtime del
canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones económicas
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

Úsalo cuando un canal pueda responder el estado configurado desde variables de entorno u otras entradas pequeñas
que no sean de runtime. Si la comprobación necesita resolución completa de configuración o el
runtime real del canal, mantén esa lógica en el hook del plugin `config.hasConfiguredState`.

## Requisitos de JSON Schema

- **Todo plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el id del canal esté declarado por
  el manifest de un plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de plugin **detectables**. Los ids desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifest o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración de plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor y en los logs.

Consulta la [referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifest es **obligatorio para los Plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifest es solo para
  descubrimiento + validación.
- Los manifests nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas, siempre que el valor final siga siendo un objeto.
- Solo los campos del manifest documentados son leídos por el cargador de manifests. Evita agregar
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta de metadatos económica para sondeos de autenticación, validación de marcadores de entorno
  y superficies similares de autenticación de proveedor que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que variantes de proveedor reutilicen las variables de entorno de autenticación
  de otro proveedor, perfiles de autenticación, autenticación respaldada por configuración y la opción
  de incorporación mediante clave de API sin codificar esa relación en el core.
- `channelEnvVars` es la ruta de metadatos económica para fallback de variables de entorno del shell, prompts de configuración
  y superficies similares de canal que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta de metadatos económica para selectores de opciones de autenticación,
  resolución de `--auth-choice`, asignación de proveedor preferido y registro simple de flags de CLI de incorporación
  antes de que se cargue el runtime del proveedor. Para metadatos de asistente de runtime
  que requieren código del proveedor, consulta
  [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona con `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona con `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un
  plugin no los necesite.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de plugins](/es/plugins/architecture) — arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
