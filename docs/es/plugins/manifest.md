---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración del Plugin o depurar errores de validación del Plugin
summary: Manifiesto del Plugin + requisitos del esquema JSON (validación estricta de configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-04-24T05:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de bundle compatibles, consulta [Plugin bundles](/es/plugins/bundles).

Los formatos de bundle compatibles usan archivos de manifiesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes Claude
  sin manifiesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de bundle, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee metadatos del bundle más raíces
de Skill declaradas, raíces de comandos Claude, valores predeterminados de `settings.json` del bundle Claude,
valores predeterminados de LSP del bundle Claude y paquetes de hooks compatibles cuando el diseño coincide
con las expectativas del tiempo de ejecución de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del Plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del Plugin**. Los manifiestos faltantes o no válidos se tratan como
errores del Plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de Plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativas y la guía actual de compatibilidad externa:
[Capability model](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar el
código de tu Plugin**. Todo lo que aparece abajo debe ser lo bastante barato como para inspeccionarlo sin iniciar el tiempo de ejecución del Plugin.

**Úsalo para:**

- identidad del Plugin, validación de configuración e indicaciones de UI de configuración
- metadatos de autenticación, incorporación y configuración (alias, activación automática, variables de entorno del proveedor, opciones de autenticación)
- indicaciones de activación para superficies del plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en el catálogo y las superficies de validación

**No lo uses para:** registrar comportamiento en tiempo de ejecución, declarar puntos de entrada de código,
o metadatos de instalación npm. Eso pertenece al código de tu Plugin y a `package.json`.

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

| Campo | Obligatorio | Tipo | Qué significa |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` | Sí | `string` | Id canónico del Plugin. Es el id usado en `plugins.entries.<id>`. |
| `configSchema` | Sí | `object` | Esquema JSON en línea para la configuración de este Plugin. |
| `enabledByDefault` | No | `true` | Marca un Plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el Plugin deshabilitado por defecto. |
| `legacyPluginIds` | No | `string[]` | Ids heredados que se normalizan a este id canónico del Plugin. |
| `autoEnableWhenConfiguredProviders` | No | `string[]` | Ids de proveedor que deberían activar automáticamente este Plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen. |
| `kind` | No | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de Plugin usado por `plugins.slots.*`. |
| `channels` | No | `string[]` | Ids de canales propiedad de este Plugin. Se usan para descubrimiento y validación de configuración. |
| `providers` | No | `string[]` | Ids de proveedores propiedad de este Plugin. |
| `providerDiscoveryEntry` | No | `string` | Ruta ligera del módulo de descubrimiento de proveedores, relativa a la raíz del Plugin, para metadatos del catálogo de proveedores con alcance del manifiesto que puedan cargarse sin activar el tiempo de ejecución completo del Plugin. |
| `modelSupport` | No | `object` | Metadatos abreviados de familias de modelos propiedad del manifiesto usados para cargar automáticamente el Plugin antes del tiempo de ejecución. |
| `providerEndpoints` | No | `object[]` | Metadatos de hosts/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el núcleo debe clasificar antes de que se cargue el tiempo de ejecución del proveedor. |
| `cliBackends` | No | `string[]` | Ids de backends de inferencia CLI propiedad de este Plugin. Se usan para activación automática al inicio a partir de referencias explícitas de configuración. |
| `syntheticAuthRefs` | No | `string[]` | Referencias de proveedor o backend CLI cuyo hook sintético de autenticación propiedad del Plugin debe sondearse durante el descubrimiento en frío de modelos antes de que se cargue el tiempo de ejecución. |
| `nonSecretAuthMarkers` | No | `string[]` | Valores de clave API de marcador de posición propiedad de Plugins incluidos que representan estado de credenciales local, OAuth o ambiental no secreto. |
| `commandAliases` | No | `object[]` | Nombres de comandos propiedad de este Plugin que deben producir diagnósticos de configuración y CLI conscientes del Plugin antes de que se cargue el tiempo de ejecución. |
| `providerAuthEnvVars` | No | `Record<string, string[]>` | Metadatos baratos de variables de entorno de autenticación del proveedor que OpenClaw puede inspeccionar sin cargar código del Plugin. |
| `providerAuthAliases` | No | `Record<string, string>` | Ids de proveedores que deberían reutilizar otro id de proveedor para la búsqueda de autenticación, por ejemplo, un proveedor de programación que comparte la clave API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars` | No | `Record<string, string[]>` | Metadatos baratos de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del Plugin. Úsalo para superficies de configuración o autenticación de canales basadas en variables de entorno que los helpers genéricos de inicio/configuración deban ver. |
| `providerAuthChoices` | No | `object[]` | Metadatos baratos de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI. |
| `activation` | No | `object` | Metadatos baratos del planificador de activación para carga activada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el tiempo de ejecución del Plugin sigue siendo propietario del comportamiento real. |
| `setup` | No | `object` | Descriptores baratos de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el tiempo de ejecución del Plugin. |
| `qaRunners` | No | `object[]` | Descriptores baratos de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el tiempo de ejecución del Plugin. |
| `contracts` | No | `object` | Instantánea estática de capacidades incluidas para hooks de autenticación externa, voz, transcripción en tiempo real, voz en tiempo real, comprensión de contenido multimedia, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No | `Record<string, object>` | Valores predeterminados baratos de comprensión de contenido multimedia para ids de proveedor declarados en `contracts.mediaUnderstandingProviders`. |
| `channelConfigs` | No | `Record<string, object>` | Metadatos de configuración de canal propiedad del manifiesto fusionados en las superficies de descubrimiento y validación antes de que se cargue el tiempo de ejecución. |
| `skills` | No | `string[]` | Directorios de Skills que cargar, relativos a la raíz del Plugin. |
| `name` | No | `string` | Nombre legible del Plugin. |
| `description` | No | `string` | Resumen corto mostrado en las superficies del Plugin. |
| `version` | No | `string` | Versión informativa del Plugin. |
| `uiHints` | No | `Record<string, object>` | Etiquetas de UI, marcadores de posición e indicaciones de sensibilidad para campos de configuración. |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el tiempo de ejecución del proveedor.

| Campo | Obligatorio | Tipo | Qué significa |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | Sí | `string` | Id del proveedor al que pertenece esta opción. |
| `method` | Sí | `string` | Id del método de autenticación al que se enviará. |
| `choiceId` | Sí | `string` | Id estable de opción de autenticación usado por los flujos de incorporación y CLI. |
| `choiceLabel` | No | `string` | Etiqueta visible para el usuario. Si se omite, OpenClaw recurre a `choiceId`. |
| `choiceHint` | No | `string` | Texto de ayuda breve para el selector. |
| `assistantPriority` | No | `number` | Los valores más bajos se ordenan antes en selectores interactivos guiados por el asistente. |
| `assistantVisibility` | No | `"visible"` \| `"manual-only"` | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual por CLI. |
| `deprecatedChoiceIds` | No | `string[]` | Ids heredados de opciones que deberían redirigir a los usuarios a esta opción de reemplazo. |
| `groupId` | No | `string` | Id opcional de grupo para agrupar opciones relacionadas. |
| `groupLabel` | No | `string` | Etiqueta visible para el usuario de ese grupo. |
| `groupHint` | No | `string` | Texto de ayuda breve para el grupo. |
| `optionKey` | No | `string` | Clave de opción interna para flujos de autenticación simples de una sola bandera. |
| `cliFlag` | No | `string` | Nombre de la bandera CLI, como `--openrouter-api-key`. |
| `cliOption` | No | `string` | Forma completa de la opción CLI, como `--openrouter-api-key <key>`. |
| `cliDescription` | No | `string` | Descripción usada en la ayuda de CLI. |
| `onboardingScopes` | No | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un Plugin sea propietario de un nombre de comando en tiempo de ejecución que los usuarios puedan
poner por error en `plugins.allow` o intentar ejecutar como un comando CLI raíz. OpenClaw
usa estos metadatos para diagnósticos sin importar código del tiempo de ejecución del Plugin.

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

| Campo | Obligatorio | Tipo | Qué significa |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | Sí | `string` | Nombre del comando que pertenece a este Plugin. |
| `kind` | No | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No | `string` | Comando CLI raíz relacionado que se puede sugerir para operaciones CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el Plugin pueda declarar de forma barata qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque es metadato del planificador, no una API de ciclo de vida. No registra
comportamiento en tiempo de ejecución, no reemplaza `register(...)` y no promete que
el código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los Plugins candidatos antes de recurrir a metadatos existentes de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks.

Prefiere los metadatos más estrechos que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de setup o `contracts`
cuando esos campos expresen la relación. Usa `activation` para pistas extra del planificador
que no puedan representarse mediante esos campos de propiedad.

Este bloque es solo metadato. No registra comportamiento en tiempo de ejecución y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/Plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga más amplia de Plugins, por lo que la falta de metadatos de activación normalmente solo cuesta rendimiento; no debería
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

| Campo | Obligatorio | Tipo | Qué significa |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders` | No | `string[]` | Ids de proveedor que deben incluir este Plugin en planes de activación/carga. |
| `onCommands` | No | `string[]` | Ids de comando que deben incluir este Plugin en planes de activación/carga. |
| `onChannels` | No | `string[]` | Ids de canal que deben incluir este Plugin en planes de activación/carga. |
| `onRoutes` | No | `string[]` | Tipos de ruta que deben incluir este Plugin en planes de activación/carga. |
| `onCapabilities` | No | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más estrechos cuando sea posible. |

Consumidores activos actuales:

- la planificación de CLI activada por comando recurre al heredado
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canales activada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- la planificación de setup/tiempo de ejecución activada por proveedor recurre al heredado
  `providers[]` y a la propiedad de nivel superior `cliBackends[]` cuando faltan
  metadatos explícitos de activación de proveedor

Los diagnósticos del planificador pueden distinguir entre pistas explícitas de activación y fallback de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
coincidió `activation.onCommands`, mientras que `manifest-command-alias` significa que el
planificador usó en su lugar la propiedad `commandAliases`. Estas etiquetas de razón son para diagnósticos y pruebas del host; los autores de Plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un Plugin aporte uno o más ejecutores de transporte bajo la
raíz compartida `openclaw qa`. Mantén estos metadatos baratos y estáticos; el tiempo de ejecución del Plugin
sigue siendo propietario del registro real de CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la vía viva de Matrix con respaldo Docker contra un homeserver desechable"
    }
  ]
}
```

| Campo | Obligatorio | Tipo | Qué significa |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`. |
| `description` | No | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando stub. |

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos baratos propiedad del Plugin
antes de que se cargue el tiempo de ejecución.

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

`cliBackends` de nivel superior sigue siendo válido y sigue describiendo
backends de inferencia CLI. `setup.cliBackends` es la superficie de descriptor específica de setup para
flujos de setup/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda
primero por descriptor para el descubrimiento de setup. Si el descriptor solo reduce el Plugin candidato y setup todavía necesita hooks de tiempo de ejecución más ricos durante el setup, establece `requiresRuntime: true` y conserva `setup-api` como
ruta de ejecución de fallback.

Debido a que la búsqueda de setup puede ejecutar código `setup-api` propiedad del Plugin, los
valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos en todos los
Plugins descubiertos. La propiedad ambigua falla en modo cerrado en lugar de elegir un
ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo | Obligatorio | Tipo | Qué significa |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | Sí | `string` | Id del proveedor expuesto durante setup o incorporación. Mantén ids normalizados globalmente únicos. |
| `authMethods` | No | `string[]` | Ids de métodos de setup/autenticación que este proveedor admite sin cargar el tiempo de ejecución completo. |
| `envVars` | No | `string[]` | Variables de entorno que las superficies genéricas de setup/estado pueden comprobar antes de que se cargue el tiempo de ejecución del Plugin. |

### Campos de `setup`

| Campo | Obligatorio | Tipo | Qué significa |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | No | `object[]` | Descriptores de setup de proveedor expuestos durante setup e incorporación. |
| `cliBackends` | No | `string[]` | Ids de backend en tiempo de setup usados para búsqueda de setup primero por descriptor. Mantén ids normalizados globalmente únicos. |
| `configMigrations` | No | `string[]` | Ids de migración de configuración propiedad de la superficie de setup de este Plugin. |
| `requiresRuntime` | No | `boolean` | Si setup sigue necesitando ejecución de `setup-api` después de la búsqueda por descriptor. |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

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

Cada pista de campo puede incluir:

| Campo | Tipo | Qué significa |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | Etiqueta del campo visible para el usuario. |
| `help` | `string` | Texto breve de ayuda. |
| `tags` | `string[]` | Etiquetas opcionales de UI. |
| `advanced` | `boolean` | Marca el campo como avanzado. |
| `sensitive` | `boolean` | Marca el campo como secreto o sensible. |
| `placeholder` | `string` | Texto de marcador de posición para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el tiempo de ejecución del Plugin.

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

| Campo | Tipo | Qué significa |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | Ids de tiempo de ejecución integrado para los que un Plugin incluido puede registrar factorías. |
| `externalAuthProviders` | `string[]` | Ids de proveedor cuyo hook de perfil de autenticación externa pertenece a este Plugin. |
| `speechProviders` | `string[]` | Ids de proveedor de voz propiedad de este Plugin. |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedor de transcripción en tiempo real propiedad de este Plugin. |
| `realtimeVoiceProviders` | `string[]` | Ids de proveedor de voz en tiempo real propiedad de este Plugin. |
| `memoryEmbeddingProviders` | `string[]` | Ids de proveedor de embeddings de memoria propiedad de este Plugin. |
| `mediaUnderstandingProviders` | `string[]` | Ids de proveedor de comprensión de contenido multimedia propiedad de este Plugin. |
| `imageGenerationProviders` | `string[]` | Ids de proveedor de generación de imágenes propiedad de este Plugin. |
| `videoGenerationProviders` | `string[]` | Ids de proveedor de generación de video propiedad de este Plugin. |
| `webFetchProviders` | `string[]` | Ids de proveedor de web-fetch propiedad de este Plugin. |
| `webSearchProviders` | `string[]` | Ids de proveedor de búsqueda web propiedad de este Plugin. |
| `tools` | `string[]` | Nombres de herramientas del agente propiedad de este Plugin para comprobaciones de contratos incluidos. |

Los Plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los Plugins sin esta declaración siguen ejecutándose
mediante un fallback de compatibilidad obsoleto, pero ese fallback es más lento y
se eliminará después del periodo de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas CLI independientes usan este contrato del manifiesto para cargar solo el Plugin propietario antes de que el tiempo de ejecución completo de Gateway haya registrado proveedores.

## Referencia de `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de contenido multimedia tiene
modelos predeterminados, prioridad de fallback automática por autenticación o compatibilidad nativa con documentos que
los helpers genéricos del núcleo necesiten antes de que se cargue el tiempo de ejecución. Las claves también deben declararse en
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

| Campo | Tipo | Qué significa |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | Capacidades multimedia expuestas por este proveedor. |
| `defaultModels` | `Record<string, string>` | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority` | `Record<string, number>` | Los números más bajos se ordenan antes para el fallback automático de proveedor basado en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]` | Entradas de documento nativas compatibles con el proveedor. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos baratos de configuración antes de que
se cargue el tiempo de ejecución.

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
          "label": "URL de Homeserver",
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

| Campo | Tipo | Qué significa |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints` | `Record<string, object>` | Etiquetas de UI opcionales/marcadores de posición/pistas de sensibilidad para esa sección de configuración del canal. |
| `label` | `string` | Etiqueta del canal fusionada en superficies de selector e inspección cuando los metadatos de tiempo de ejecución aún no están listos. |
| `description` | `string` | Descripción breve del canal para superficies de inspección y catálogo. |
| `preferOver` | `string[]` | Ids de Plugins heredados o de menor prioridad que este canal debe superar en superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de
ids abreviados de modelos como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el tiempo de ejecución del Plugin.

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
- `modelPatterns` prevalece sobre `modelPrefixes`
- si coinciden un Plugin no incluido y un Plugin incluido, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo | Tipo | Qué significa |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos que se comparan con `startsWith` contra ids abreviados de modelos. |
| `modelPatterns` | `string[]` | Orígenes regex comparados contra ids abreviados de modelos tras eliminar el sufijo del perfil. |

Las claves heredadas de capacidad de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga
normal del manifiesto ya no trata esos campos de nivel superior como
propiedad de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo | Úsalo para |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicaciones de UI que deben existir antes de que se ejecute el código del Plugin |
| `package.json` | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, restricción de instalación, setup o metadatos de catálogo |

Si no estás seguro de dónde debe ir una parte de los metadatos, usa esta regla:

- si OpenClaw debe conocerlos antes de cargar el código del Plugin, colócalos en `openclaw.plugin.json`
- si se trata de empaquetado, archivos de entrada o comportamiento de instalación npm, colócalos en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de Plugin previos al tiempo de ejecución viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo | Qué significa |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | Declara puntos de entrada nativos del Plugin. Deben permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeExtensions` | Declara puntos de entrada de tiempo de ejecución JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.setupEntry` | Punto de entrada ligero solo para setup usado durante la incorporación, inicio diferido de canales y descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.runtimeSetupEntry` | Declara el punto de entrada de setup JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del Plugin. |
| `openclaw.channel` | Metadatos baratos de catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección. |
| `openclaw.channel.configuredState` | Metadatos ligeros del comprobador de estado configurado que pueden responder “¿ya existe la configuración solo con entorno?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.channel.persistedAuthState` | Metadatos ligeros del comprobador de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | Pistas de instalación/actualización para Plugins incluidos y publicados externamente. |
| `openclaw.install.defaultChoice` | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles. |
| `openclaw.install.minHostVersion` | Versión mínima compatible del host de OpenClaw, usando un límite semver como `>=2026.3.22`. |
| `openclaw.install.expectedIntegrity` | Cadena esperada de integridad del dist de npm como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella. |
| `openclaw.install.allowInvalidConfigRecovery` | Permite una ruta estrecha de recuperación de reinstalación de Plugin incluido cuando la configuración no es válida. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de setup se carguen antes que el Plugin de canal completo durante el inicio. |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/setup aparecen en la
incorporación antes de que se cargue el tiempo de ejecución. `package.json#openclaw.install` indica a
la incorporación cómo obtener o habilitar ese Plugin cuando el usuario elige una de esas
opciones. No muevas las pistas de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro del manifiesto. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
Plugin en hosts más antiguos.

La fijación exacta de la versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combínalo con
`expectedIntegrity` cuando quieras que los flujos de actualización fallen en modo cerrado si el artefacto
npm obtenido ya no coincide con la versión fijada. La incorporación interactiva
ofrece especificaciones npm del registro de confianza, incluidos nombres de paquete simples y dist-tags.
Cuando `expectedIntegrity` está presente, los flujos de instalación/actualización la aplican; cuando se
omite, la resolución del registro se registra sin una fijación de integridad.

Los Plugins de canal deben proporcionar `openclaw.setupEntry` cuando las superficies de estado, lista de canales
o escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar el tiempo de ejecución completo.
La entrada de setup debe exponer metadatos de canal más adaptadores seguros para setup de configuración,
estado y secretos; mantén los clientes de red, listeners de gateway y tiempos de ejecución
de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de tiempo de ejecución no anulan las comprobaciones de límites del paquete para los campos
de punto de entrada fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable
una ruta de escape de `openclaw.extensions`.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente estrecho. No
hace que configuraciones arbitrariamente rotas sean instalables. Hoy solo permite que los flujos de instalación se recuperen de fallos específicos obsoletos de actualización de Plugins incluidos, como una
ruta faltante de Plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo
Plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un pequeño módulo
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

Úsalo cuando los flujos de setup, doctor o estado configurado necesiten una sonda barata de autenticación sí/no
antes de que se cargue el Plugin de canal completo. La exportación objetivo debe ser una pequeña
función que lea solo el estado persistido; no la enrutes a través del barrel completo del tiempo de ejecución
del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de estado configurado
solo por entorno:

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
no relacionadas con el tiempo de ejecución. Si la comprobación necesita resolución completa de configuración o el
tiempo de ejecución real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del Plugin.

## Precedencia de descubrimiento (ids de Plugin duplicados)

OpenClaw descubre Plugins desde varias raíces (incluidos, instalación global, espacio de trabajo, rutas seleccionadas explícitamente por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — Plugins distribuidos con OpenClaw
3. **Instalación global** — Plugins instalados en la raíz global de Plugins de OpenClaw
4. **Espacio de trabajo** — Plugins descubiertos relativos al espacio de trabajo actual

Implicaciones:

- Una copia bifurcada o desactualizada de un Plugin incluido situada en el espacio de trabajo no sustituirá a la compilación incluida.
- Para sustituir realmente un Plugin incluido por uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del espacio de trabajo.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.

## Requisitos del esquema JSON

- **Todo Plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en tiempo de ejecución.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el id de canal esté declarado por
  un manifiesto de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben referirse a ids de Plugin **detectables**. Los ids desconocidos son **errores**.
- Si un Plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa del error del Plugin.
- Si existe configuración del Plugin pero el Plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los Plugins nativos de OpenClaw**, incluidas las cargas del sistema de archivos local. El tiempo de ejecución sigue cargando el módulo del Plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, así que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un Plugin no los necesite.
- `providerDiscoveryEntry` debe seguir siendo ligero y no debe importar código amplio de tiempo de ejecución; úsalo para metadatos estáticos del catálogo de proveedores o descriptores estrechos de descubrimiento, no para ejecución en tiempo de solicitud.
- Los tipos exclusivos de Plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Los metadatos de variables de entorno (`providerAuthEnvVars`, `channelEnvVars`) son solo declarativos. Estado, auditoría, validación de entrega de Cron y otras superficies de solo lectura siguen aplicando la confianza del Plugin y la política efectiva de activación antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de tiempo de ejecución que requieran código del proveedor, consulta [Provider runtime hooks](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu Plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista permitida del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Crear plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con Plugins.
  </Card>
  <Card title="Arquitectura de Plugins" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="Resumen del SDK" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones por subruta.
  </Card>
</CardGroup>
