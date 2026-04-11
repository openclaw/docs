---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas entregar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto del plugin
x-i18n:
    generated_at: "2026-04-11T15:15:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42d454b560a8f6bf714c5d782f34216be1216d83d0a319d08d7349332c91a9e4
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto del plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de plugins de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de plugins](/es/plugins/bundles).

Los formatos de paquetes compatibles usan archivos de manifiesto distintos:

- Paquete de Codex: `.codex-plugin/plugin.json`
- Paquete de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude sin manifiesto
- Paquete de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para los paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete junto con las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete de Claude,
los valores predeterminados de LSP del paquete de Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del runtime de
OpenClaw.

Cada plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos faltantes o inválidos se tratan como
errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de la configuración
- metadatos de autenticación e incorporación que deban estar disponibles sin iniciar el runtime del plugin
- pistas de activación de bajo costo que las superficies del plano de control puedan inspeccionar antes de que se cargue el runtime
- descriptores de configuración de bajo costo que las superficies de configuración/incorporación puedan inspeccionar antes de que se cargue el runtime
- metadatos de alias y habilitación automática que deban resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familias de modelos que deban activar automáticamente el plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad de plugins incluidos y la cobertura de contratos
- metadatos de configuración específicos del canal que deban combinarse en las superficies de catálogo y validación sin cargar el runtime
- pistas de UI para la configuración

No lo uses para:

- registrar comportamiento en runtime
- declarar entrypoints de código
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

| Campo                               | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                 |
| ----------------------------------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Sí          | `string`                         | Id canónico del plugin. Este es el id usado en `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                      | Sí          | `object`                         | Esquema JSON inline para la configuración de este plugin.                                                                                                                                                      |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                      |
| `legacyPluginIds`                   | No          | `string[]`                       | Ids heredados que se normalizan a este id canónico del plugin.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | Ids de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                     |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo de plugin exclusivo usado por `plugins.slots.*`.                                                                                                                                              |
| `channels`                          | No          | `string[]`                       | Ids de canales propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                          |
| `providers`                         | No          | `string[]`                       | Ids de proveedores propiedad de este plugin.                                                                                                                                                                   |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto usados para cargar automáticamente el plugin antes del runtime.                                                                          |
| `cliBackends`                       | No          | `string[]`                       | Ids de backends de inferencia de CLI propiedad de este plugin. Se usan para la activación automática al inicio a partir de referencias explícitas de configuración.                                         |
| `commandAliases`                    | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y de CLI conscientes del plugin antes de que se cargue el runtime.                                             |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de autenticación del proveedor que OpenClaw puede inspeccionar sin cargar código del plugin.                                                                        |
| `providerAuthAliases`               | No          | `Record<string, string>`         | Ids de proveedores que deben reutilizar otro id de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de programación que comparte la clave API base del proveedor y los perfiles de autenticación. |
| `channelEnvVars`                    | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno del canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalo para superficies de configuración o autenticación del canal basadas en variables de entorno que los helpers genéricos de inicio/configuración deban ver. |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedores preferidos y cableado simple de flags de CLI.                                                     |
| `activation`                        | No          | `object`                         | Pistas ligeras de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo el responsable del comportamiento real.          |
| `setup`                             | No          | `object`                         | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                               |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades incluidas para speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, búsqueda web y propiedad de herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto que se combinan en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                           |
| `skills`                            | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                        |
| `name`                              | No          | `string`                         | Nombre legible del plugin.                                                                                                                                                                                     |
| `description`                       | No          | `string`                         | Resumen corto que se muestra en las superficies del plugin.                                                                                                                                                    |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                                |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de UI, placeholders y pistas de sensibilidad para los campos de configuración.                                                                                                                       |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | Id del proveedor al que pertenece esta opción.                                                             |
| `method`              | Sí          | `string`                                        | Id del método de autenticación al que se debe dirigir.                                                     |
| `choiceId`            | Sí          | `string`                                        | Id estable de opción de autenticación usado por los flujos de incorporación y CLI.                         |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como alternativa.                  |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                     |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.       |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en los selectores del asistente, pero sigue permitiendo la selección manual desde CLI.   |
| `deprecatedChoiceIds` | No          | `string[]`                                      | Ids heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.                  |
| `groupId`             | No          | `string`                                        | Id opcional de grupo para agrupar opciones relacionadas.                                                   |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                             |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                        |
| `optionKey`           | No          | `string`                                        | Clave interna de opción para flujos simples de autenticación con una sola flag.                            |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                     |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                      |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin es propietario de un nombre de comando de runtime que los usuarios pueden
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                             |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                           |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin puede declarar de forma ligera qué eventos del plano de control
deben activarlo más adelante.

Este bloque es solo metadatos. No registra comportamiento en runtime, y no
reemplaza `register(...)`, `setupEntry` ni otros entrypoints de runtime/plugin.

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
| `onProviders`    | No          | `string[]`                                           | Ids de proveedores que deben activar este plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | Ids de comandos que deben activar este plugin.                     |
| `onChannels`     | No          | `string[]`                                           | Ids de canales que deben activar este plugin.                      |
| `onRoutes`       | No          | `string[]`                                           | Tipos de rutas que deben activar este plugin.                      |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas generales de capacidades usadas por la planificación de activación del plano de control. |

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos ligeros propiedad del plugin
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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo
backends de inferencia de CLI. `setup.cliBackends` es la superficie descriptiva específica de configuración para
flujos de plano de control/configuración que deben seguir siendo solo metadatos.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sí          | `string`   | Id del proveedor expuesto durante la configuración o incorporación.                  |
| `authMethods` | No          | `string[]` | Ids de métodos de configuración/autenticación que este proveedor admite sin cargar todo el runtime. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                 |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedores expuestos durante la configuración y la incorporación. |
| `cliBackends`      | No          | `string[]` | Ids de backends disponibles en tiempo de configuración sin activación completa del runtime. |
| `configMigrations` | No          | `string[]` | Ids de migraciones de configuración propiedad de la superficie de configuración de este plugin. |
| `requiresRuntime`  | No          | `boolean`  | Indica si la configuración aún necesita ejecutar el runtime del plugin después de consultar el descriptor. |

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

| Campo         | Tipo       | Qué significa                               |
| ------------- | ---------- | ------------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                       |
| `tags`        | `string[]` | Etiquetas opcionales de UI.                 |
| `advanced`    | `boolean`  | Marca el campo como avanzado.               |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.     |
| `placeholder` | `string`   | Texto de placeholder para entradas de formularios. |

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

| Campo                            | Tipo       | Qué significa                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ids de proveedores de speech propiedad de este plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedores de transcripción en tiempo real propiedad de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedores de voz en tiempo real propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedores de media-understanding propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de proveedores de generación de imágenes propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | Ids de proveedores de generación de video propiedad de este plugin. |
| `webFetchProviders`              | `string[]` | Ids de proveedores de web-fetch propiedad de este plugin.         |
| `webSearchProviders`             | `string[]` | Ids de proveedores de búsqueda web propiedad de este plugin.      |
| `tools`                          | `string[]` | Nombres de herramientas del agente propiedad de este plugin para comprobaciones de contratos incluidos. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesita metadatos de configuración ligeros antes de que se
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

| Campo         | Tipo                     | Qué significa                                                                                |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI/placeholders/pistas de sensibilidad opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal combinada en las superficies de selección e inspección cuando los metadatos del runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                  |
| `preferOver`  | `string[]`               | Ids heredados o de menor prioridad a los que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de
ids abreviados de modelos como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

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
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si un plugin no incluido y uno incluido coinciden, gana el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos que se comparan con `startsWith` contra ids abreviados de modelos.      |
| `modelPatterns` | `string[]` | Fuentes regex que se comparan con ids abreviados de modelos después de quitar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` a `contracts`; la
carga normal del manifiesto ya no trata esos campos de nivel superior como propiedad
de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Úsalo para                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y pistas de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos del plugin previos al runtime viven intencionalmente en `package.json` dentro del
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos del plugin.                                                                                                        |
| `openclaw.setupEntry`                                             | Entrypoint ligero solo para configuración usado durante la incorporación y el inicio diferido de canales.                                     |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                              |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del verificador de estado configurado que pueden responder "¿ya existe una configuración solo con variables de entorno?" sin cargar el runtime completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del verificador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Pistas de instalación/actualización para plugins incluidos y publicados externamente.                                                         |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                            |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un límite inferior de semver como `>=2026.3.22`.                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta de recuperación de reinstalación limitada para plugins incluidos cuando la configuración es inválida.                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies del canal solo de configuración se carguen antes que el plugin completo del canal durante el inicio.             |

`openclaw.install.minHostVersion` se aplica durante la instalación y la
carga del registro del manifiesto. Los valores inválidos se rechazan; los valores más nuevos pero válidos omiten el
plugin en hosts más antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No
hace instalables configuraciones rotas arbitrarias. Actualmente solo permite a los flujos de instalación
recuperarse de fallos específicos de actualización de plugins incluidos obsoletos, como una
ruta faltante de plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos del paquete para un pequeño
módulo verificador:

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
comprobación barata de autenticación sí/no antes de que se cargue el plugin completo del canal. La exportación de destino debe ser una pequeña
función que solo lea el estado persistido; no la enrutes a través del barrel completo del runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras
de estado configurado solo con variables de entorno:

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

Úsalo cuando un canal pueda responder el estado configurado a partir de variables de entorno u otras pequeñas
entradas ajenas al runtime. Si la comprobación necesita resolución completa de la configuración o el
runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin.

## Requisitos del esquema JSON

- **Cada plugin debe incluir un esquema JSON**, aunque no acepte configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas en `channels.*` son **errores**, a menos que el id del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de plugin **detectables**. Los ids desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + logs.

Consulta la [Referencia de configuración](/es/gateway/configuration) para el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador del manifiesto solo lee los campos documentados del manifiesto. Evita agregar
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta ligera de metadatos para sondas de autenticación, validación de marcadores de variables de entorno
  y superficies similares de autenticación de proveedores que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que variantes de proveedores reutilicen la autenticación de otro proveedor
  en variables de entorno, perfiles de autenticación, autenticación basada en configuración y opción de incorporación
  con clave API sin codificar esa relación en el core.
- `channelEnvVars` es la ruta ligera de metadatos para fallback de variables de entorno del shell, prompts de configuración
  y superficies similares de canal que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta ligera de metadatos para selectores de opciones de autenticación,
  resolución de `--auth-choice`, mapeo de proveedores preferidos y registro simple de flags de CLI de incorporación
  antes de que se cargue el runtime del proveedor. Para metadatos del asistente en runtime
  que requieran código del proveedor, consulta
  [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona con `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona con `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un
  plugin no los necesite.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista permitida del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de plugins
