---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas publicar un esquema de configuración de Plugin o depurar errores de validación de Plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto del Plugin
x-i18n:
    generated_at: "2026-05-02T05:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fb98614783b679d6b49d2237148765708e5c5fc2ee40162d3ddd4752f763c2
    source_path: plugins/manifest.md
    workflow: 16
---

Esta página es solo para el **manifiesto nativo de plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de plugins](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquete, pero no se validan
contra el esquema `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee metadatos del paquete más las raíces de skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete Claude,
los valores predeterminados de LSP del paquete Claude y los paquetes de hooks admitidos cuando el diseño coincide
con las expectativas del runtime de OpenClaw.

Cada plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos faltantes o no válidos se tratan como
errores de plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee **antes de cargar tu
código de plugin**. Todo lo siguiente debe ser lo suficientemente barato como para inspeccionarse sin iniciar
el runtime del plugin.

**Úsalo para:**

- identidad del plugin, validación de configuración y sugerencias de UI de configuración
- metadatos de autenticación, incorporación y configuración inicial (alias, habilitación automática, variables de entorno del proveedor, opciones de autenticación)
- sugerencias de activación para superficies de plano de control
- propiedad abreviada de familias de modelos
- instantáneas estáticas de propiedad de capacidades (`contracts`)
- metadatos del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar
- metadatos de configuración específicos del canal fusionados en superficies de catálogo y validación

**No lo uses para:** registrar comportamiento de runtime, declarar entrypoints de código
o metadatos de instalación de npm. Eso pertenece a tu código de plugin y a `package.json`.

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
| `id`                                 | Sí          | `string`                         | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Sí          | `object`                         | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                                       |
| `enabledByDefault`                   | No          | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor que no sea `true`, para dejar el plugin deshabilitado de forma predeterminada.                                             |
| `legacyPluginIds`                    | No          | `string[]`                       | ID heredados que se normalizan a este ID canónico de plugin.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | No          | `string[]`                       | ID de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelo los mencionen.                                                                              |
| `kind`                               | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No          | `string[]`                       | ID de canales propiedad de este plugin. Se usa para descubrimiento y validación de configuración.                                                                                                                                  |
| `providers`                          | No          | `string[]`                       | ID de proveedores propiedad de este plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | No          | `string`                         | Ruta de módulo ligera para descubrimiento de proveedores, relativa a la raíz del plugin, para metadatos de catálogo de proveedores con ámbito de manifiesto que se pueden cargar sin activar todo el runtime del plugin.            |
| `modelSupport`                       | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para cargar automáticamente el plugin antes del runtime.                                                                                                |
| `modelCatalog`                       | No          | `object`                         | Metadatos declarativos del catálogo de modelos para proveedores propiedad de este plugin. Este es el contrato del plano de control para futuros listados de solo lectura, onboarding, selectores de modelos, alias y supresión sin cargar el runtime del plugin. |
| `modelPricing`                       | No          | `object`                         | Política de búsqueda de precios externos propiedad del proveedor. Úsala para excluir proveedores locales/autohospedados de catálogos de precios remotos o asignar referencias de proveedores a ID de catálogos de OpenRouter/LiteLLM sin codificar ID de proveedores en el núcleo. |
| `modelIdNormalization`               | No          | `object`                         | Limpieza de alias/prefijos de ID de modelo propiedad del proveedor que debe ejecutarse antes de que cargue el runtime del proveedor.                                                                                               |
| `providerEndpoints`                  | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedores que el núcleo debe clasificar antes de que cargue el runtime del proveedor.                                                              |
| `providerRequest`                    | No          | `object`                         | Metadatos ligeros de familia de proveedor y compatibilidad de solicitudes usados por la política genérica de solicitudes antes de que cargue el runtime del proveedor.                                                            |
| `cliBackends`                        | No          | `string[]`                       | ID de backends de inferencia de CLI propiedad de este plugin. Se usa para la autoactivación durante el inicio desde referencias de configuración explícitas.                                                                       |
| `syntheticAuthRefs`                  | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del plugin debe sondearse durante el descubrimiento frío de modelos antes de que cargue el runtime.                                      |
| `nonSecretAuthMarkers`               | No          | `string[]`                       | Valores de clave de API de marcador de posición propiedad del plugin incluido que representan estado de credenciales locales, OAuth o ambientales que no son secretas.                                                            |
| `commandAliases`                     | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que cargue el runtime.                                                                         |
| `providerAuthEnvVars`                | No          | `Record<string, string[]>`       | Metadatos de entorno de compatibilidad obsoletos para la búsqueda de autenticación/estado de proveedores. Prefiere `setup.providers[].envVars` para nuevos plugins; OpenClaw todavía lee esto durante la ventana de obsolescencia. |
| `providerAuthAliases`                | No          | `Record<string, string>`         | ID de proveedores que deben reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de codificación que comparte la clave de API y los perfiles de autenticación del proveedor base.           |
| `channelEnvVars`                     | No          | `Record<string, string[]>`       | Metadatos ligeros de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Usa esto para configuración de canales basada en entorno o superficies de autenticación que los helpers genéricos de inicio/configuración deben ver. |
| `providerAuthChoices`                | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de onboarding, resolución de proveedor preferido y cableado simple de flags de CLI.                                                                                 |
| `activation`                         | No          | `object`                         | Metadatos ligeros del planificador de activación para cargas desencadenadas por inicio, proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo dueño del comportamiento real.            |
| `setup`                              | No          | `object`                         | Descriptores ligeros de configuración/onboarding que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                                                       |
| `qaRunners`                          | No          | `object[]`                       | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que cargue el runtime del plugin.                                                                                                   |
| `contracts`                          | No          | `object`                         | Instantánea estática de capacidades incluidas para hooks de autenticación externa, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, obtención web, búsqueda web y propiedad de herramientas. |
| `mediaUnderstandingProviderMetadata` | No          | `Record<string, object>`         | Valores predeterminados ligeros de comprensión de medios para ID de proveedores declarados en `contracts.mediaUnderstandingProviders`.                                                                                            |
| `channelConfigs`                     | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en superficies de descubrimiento y validación antes de que cargue el runtime.                                                                              |
| `skills`                             | No          | `string[]`                       | Directorios de Skills que cargar, relativos a la raíz del plugin.                                                                                                                                                                 |
| `name`                               | No          | `string`                         | Nombre legible por humanos del plugin.                                                                                                                                                                                            |
| `description`                        | No          | `string`                         | Resumen breve mostrado en superficies de plugins.                                                                                                                                                                                 |
| `version`                            | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                                                   |
| `uiHints`                            | No          | `Record<string, object>`         | Etiquetas de UI, marcadores de posición y sugerencias de sensibilidad para campos de configuración.                                                                                                                               |

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de onboarding o autenticación.
OpenClaw lee esto antes de que cargue el runtime del proveedor.
Las listas de configuración de proveedores usan estas opciones del manifiesto, opciones de configuración
derivadas de descriptores y metadatos del catálogo de instalación sin cargar el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                                      |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Sí          | `string`                                        | Id del proveedor al que pertenece esta opción.                                                                     |
| `method`              | Sí          | `string`                                        | Id del método de autenticación al que despachar.                                                                   |
| `choiceId`            | Sí          | `string`                                        | Id estable de la opción de autenticación usado por los flujos de incorporación y CLI.                              |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como alternativa.                           |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                             |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.                 |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente mientras sigue permitiendo la selección manual en la CLI.          |
| `deprecatedChoiceIds` | No          | `string[]`                                      | Ids de opciones heredadas que deben redirigir a los usuarios a esta opción de reemplazo.                           |
| `groupId`             | No          | `string`                                        | Id de grupo opcional para agrupar opciones relacionadas.                                                           |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                                     |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                                |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos de autenticación simples con una sola marca.                                   |
| `cliFlag`             | No          | `string`                                        | Nombre de marca de CLI, como `--openrouter-api-key`.                                                               |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                                           |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de commandAliases

Usa `commandAliases` cuando un Plugin posee un nombre de comando en tiempo de ejecución que los usuarios podrían
poner por error en `plugins.allow` o intentar ejecutar como comando raíz de la CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar código de tiempo de ejecución del Plugin.

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

| Campo        | Obligatorio | Tipo              | Qué significa                                                                 |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre de comando que pertenece a este Plugin.                                |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que sugerir para operaciones de CLI, si existe. |

## Referencia de activation

Usa `activation` cuando el Plugin pueda declarar de forma barata qué eventos del plano de control
deben incluirlo en un plan de activación/carga.

Este bloque contiene metadatos del planificador, no una API de ciclo de vida. No registra
comportamiento en tiempo de ejecución, no reemplaza `register(...)` y no promete que
el código del Plugin ya se haya ejecutado. El planificador de activación usa estos campos para
reducir los Plugins candidatos antes de recurrir a los metadatos de propiedad existentes del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y los hooks.

Prefiere los metadatos más específicos que ya describan la propiedad. Usa
`providers`, `channels`, `commandAliases`, descriptores de configuración o `contracts`
cuando esos campos expresen la relación. Usa `activation` para sugerencias adicionales del planificador
que no puedan representarse con esos campos de propiedad.
Usa `cliBackends` de nivel superior para alias de tiempo de ejecución de CLI como `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` es solo para
ids de arneses de agente integrados que aún no tienen un campo de propiedad.

Este bloque es solo metadatos. No registra comportamiento en tiempo de ejecución y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de tiempo de ejecución/Plugin.
Los consumidores actuales lo usan como una sugerencia de acotación antes de una carga más amplia de Plugins, por lo que
la falta de metadatos de activación que no sean de arranque normalmente solo afecta al rendimiento; no
debería cambiar la corrección mientras sigan existiendo las alternativas de propiedad del manifiesto.

Cada Plugin debe establecer `activation.onStartup` intencionalmente. Establécelo en `true`
solo cuando el Plugin deba ejecutarse durante el arranque del Gateway. Establécelo en `false` cuando
el Plugin esté inerte al arrancar y deba cargarse solo desde disparadores más específicos.
Omitir `onStartup` ya no carga implícitamente el Plugin al arrancar; usa metadatos de
activación explícitos para el arranque, canal, configuración, arnés de agente, memoria u
otros disparadores de activación más específicos.

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

| Campo              | Obligatorio | Tipo                                                 | Qué significa                                                                                                                                                                               |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No          | `boolean`                                            | Activación explícita durante el arranque del Gateway. Cada Plugin debe establecer esto. `true` importa el Plugin durante el arranque; `false` lo mantiene diferido en el arranque salvo que otro disparador coincidente requiera cargarlo. |
| `onProviders`      | No          | `string[]`                                           | Ids de proveedor que deben incluir este Plugin en los planes de activación/carga.                                                                                                           |
| `onAgentHarnesses` | No          | `string[]`                                           | Ids de tiempo de ejecución de arneses de agente integrados que deben incluir este Plugin en los planes de activación/carga. Usa `cliBackends` de nivel superior para alias de backend de CLI. |
| `onCommands`       | No          | `string[]`                                           | Ids de comando que deben incluir este Plugin en los planes de activación/carga.                                                                                                             |
| `onChannels`       | No          | `string[]`                                           | Ids de canal que deben incluir este Plugin en los planes de activación/carga.                                                                                                               |
| `onRoutes`         | No          | `string[]`                                           | Tipos de ruta que deben incluir este Plugin en los planes de activación/carga.                                                                                                              |
| `onConfigPaths`    | No          | `string[]`                                           | Rutas de configuración relativas a la raíz que deben incluir este Plugin en los planes de arranque/carga cuando la ruta está presente y no está explícitamente deshabilitada.               |
| `onCapabilities`   | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Sugerencias amplias de capacidad usadas por la planificación de activación del plano de control. Prefiere campos más específicos cuando sea posible.                                        |

Consumidores activos actuales:

- La planificación de arranque del Gateway usa `activation.onStartup` para la importación
  explícita al arrancar
- La planificación de CLI disparada por comandos recurre a los valores heredados
  `commandAliases[].cliCommand` o `commandAliases[].name`
- La planificación de arranque del tiempo de ejecución del agente usa `activation.onAgentHarnesses` para
  arneses integrados y `cliBackends[]` de nivel superior para alias de tiempo de ejecución de CLI
- La planificación de configuración/canal disparada por canal recurre a la propiedad heredada `channels[]`
  cuando faltan metadatos explícitos de activación de canal
- La planificación de Plugins de arranque usa `activation.onConfigPaths` para superficies de configuración raíz
  que no son de canal, como el bloque `browser` del Plugin de navegador incluido
- La planificación de configuración/tiempo de ejecución disparada por proveedor recurre a la propiedad heredada
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de
  activación de proveedor

Los diagnósticos del planificador pueden distinguir las sugerencias de activación explícitas de la
alternativa de propiedad del manifiesto. Por ejemplo, `activation-command-hint` significa que
`activation.onCommands` coincidió, mientras que `manifest-command-alias` significa que el
planificador usó en su lugar la propiedad de `commandAliases`. Estas etiquetas de motivo son para
diagnósticos del host y pruebas; los autores de Plugins deben seguir declarando los metadatos
que mejor describan la propiedad.

## Referencia de qaRunners

Usa `qaRunners` cuando un Plugin aporta uno o más ejecutores de transporte debajo
de la raíz compartida `openclaw qa`. Mantén estos metadatos baratos y estáticos; el tiempo de ejecución del Plugin
sigue siendo propietario del registro real de CLI mediante una superficie ligera
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

| Campo         | Obligatorio | Tipo     | Qué significa                                                                |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `commandName` | Sí          | `string` | Subcomando montado debajo de `openclaw qa`, por ejemplo `matrix`.             |
| `description` | No          | `string` | Texto de ayuda alternativo usado cuando el host compartido necesita un comando stub. |

## Referencia de setup

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos baratos propiedad del Plugin
antes de que se cargue el tiempo de ejecución.

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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo
backends de inferencia de CLI. `setup.cliBackends` es la superficie de descriptores específica de configuración para
flujos de plano de control/configuración que deben permanecer solo como metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie
de búsqueda preferida basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
acota el plugin candidato y la configuración aún necesita hooks de runtime más completos en tiempo de configuración,
define `requiresRuntime: true` y conserva `setup-api` como la
ruta de ejecución de reserva.

OpenClaw también incluye `setup.providers[].envVars` en las búsquedas genéricas de autenticación de proveedor y
variables de entorno. `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad durante la ventana de desuso, pero los plugins no incluidos que aún lo usan
reciben un diagnóstico de manifiesto. Los nuevos plugins deben colocar los metadatos de entorno de configuración/estado
en `setup.providers[].envVars`.

OpenClaw también puede derivar opciones de configuración simples desde `setup.providers[].authMethods`
cuando no hay una entrada de configuración disponible, o cuando `setup.requiresRuntime: false`
declara que el runtime de configuración no es necesario. Las entradas explícitas de `providerAuthChoices` siguen
siendo preferidas para etiquetas personalizadas, flags de CLI, alcance de onboarding y metadatos del asistente.

Define `requiresRuntime: false` solo cuando esos descriptores sean suficientes para la
superficie de configuración. OpenClaw trata el `false` explícito como un contrato solo de descriptor
y no ejecutará `setup-api` ni `openclaw.setupEntry` para la búsqueda de configuración. Si
un plugin solo de descriptor aún incluye una de esas entradas de runtime de configuración,
OpenClaw informa un diagnóstico aditivo y continúa ignorándola. Si se omite
`requiresRuntime`, se conserva el comportamiento heredado de reserva para que los plugins existentes que agregaron
descriptores sin el flag no se rompan.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de
`setup.providers[].id` y `setup.cliBackends[]` deben mantenerse únicos en todos los
plugins descubiertos. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

Cuando el runtime de configuración sí se ejecuta, los diagnósticos del registro de configuración informan desvíos de descriptor
si `setup-api` registra un proveedor o backend de CLI que los descriptores del manifiesto
no declaran, o si un descriptor no tiene un registro de runtime
coincidente. Estos diagnósticos son aditivos y no rechazan plugins heredados.

### Referencia de setup.providers

| Campo          | Obligatorio | Tipo       | Qué significa                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sí      | `string`   | Id de proveedor expuesto durante la configuración o el onboarding. Mantén los ids normalizados globalmente únicos.             |
| `authMethods`  | No       | `string[]` | Ids de métodos de configuración/autenticación que este proveedor admite sin cargar todo el runtime.                       |
| `envVars`      | No       | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que cargue el runtime del plugin.               |
| `authEvidence` | No       | `object[]` | Comprobaciones económicas de evidencia de autenticación local para proveedores que pueden autenticarse mediante marcadores no secretos. |

`authEvidence` es para marcadores de credenciales locales propiedad del proveedor que pueden
verificarse sin cargar código de runtime. Estas comprobaciones deben mantenerse económicas y locales:
sin llamadas de red, sin lecturas de llavero o gestor de secretos, sin comandos de shell y sin
sondeos de API del proveedor.

Entradas de evidencia admitidas:

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sí      | `string`   | Actualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No       | `string`   | Variable de entorno que contiene una ruta explícita a un archivo de credenciales.                                                           |
| `fallbackPaths`    | No       | `string[]` | Rutas locales de archivos de credenciales que se comprueban cuando `fileEnvVar` está ausente o vacía. Admite `${HOME}` y `${APPDATA}`. |
| `requiresAnyEnv`   | No       | `string[]` | Al menos una variable de entorno listada debe no estar vacía para que la evidencia sea válida.                                    |
| `requiresAllEnv`   | No       | `string[]` | Todas las variables de entorno listadas deben no estar vacías para que la evidencia sea válida.                                           |
| `credentialMarker` | Sí      | `string`   | Marcador no secreto devuelto cuando la evidencia está presente.                                                       |
| `source`           | No       | `string`   | Etiqueta de origen visible para el usuario en la salida de autenticación/estado.                                                               |

### Campos de setup

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y el onboarding.                                     |
| `cliBackends`      | No       | `string[]` | Ids de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los ids normalizados globalmente únicos. |
| `configMigrations` | No       | `string[]` | Ids de migración de configuración propiedad de la superficie de configuración de este plugin.                                          |
| `requiresRuntime`  | No       | `boolean`  | Si la configuración aún necesita ejecución de `setup-api` después de la búsqueda por descriptor.                            |

## Referencia de uiHints

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

| Campo         | Tipo       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario.                |
| `help`        | `string`   | Texto breve de ayuda.                      |
| `tags`        | `string[]` | Etiquetas de UI opcionales.                       |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de marcador de posición para entradas de formulario.       |

## Referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
leer sin importar el runtime del plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de fábrica de extensión del servidor de apps de Codex, actualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime para los que un plugin incluido puede registrar middleware de resultados de herramientas. |
| `externalAuthProviders`          | `string[]` | Ids de proveedor cuyo hook de perfil de autenticación externa posee este plugin.       |
| `speechProviders`                | `string[]` | Ids de proveedor de voz que posee este plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | Ids de proveedor de transcripción en tiempo real que posee este plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | Ids de proveedor de voz en tiempo real que posee este plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | Ids de proveedor de embeddings de memoria que posee este plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | Ids de proveedor de comprensión de medios que posee este plugin.                    |
| `imageGenerationProviders`       | `string[]` | Ids de proveedor de generación de imágenes que posee este plugin.                       |
| `videoGenerationProviders`       | `string[]` | Ids de proveedor de generación de vídeo que posee este plugin.                       |
| `webFetchProviders`              | `string[]` | Ids de proveedor de obtención web que posee este plugin.                              |
| `webSearchProviders`             | `string[]` | Ids de proveedor de búsqueda web que posee este plugin.                             |
| `migrationProviders`             | `string[]` | Ids de proveedor de importación que posee este plugin para `openclaw migrate`.          |
| `tools`                          | `string[]` | Nombres de herramientas de agente que posee este plugin para comprobaciones de contrato incluidas.        |

`contracts.embeddedExtensionFactories` se conserva para fábricas de extensiones solo del servidor de apps de Codex
incluidas. Las transformaciones de resultados de herramientas incluidas deben
declarar `contracts.agentToolResultMiddleware` y registrarse con
`api.registerAgentToolResultMiddleware(...)` en su lugar. Los plugins externos no pueden
registrar middleware de resultados de herramientas porque la interfaz puede reescribir salida de herramientas de alta confianza
antes de que el modelo la vea.

Los plugins de proveedor que implementan `resolveExternalAuthProfiles` deben declarar
`contracts.externalAuthProviders`. Los plugins sin la declaración aún se ejecutan
mediante una reserva de compatibilidad obsoleta, pero esa reserva es más lenta y
se eliminará después de la ventana de migración.

Los proveedores incluidos de embeddings de memoria deben declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expongan, incluidos
adaptadores integrados como `local`. Las rutas de CLI independientes usan este contrato de manifiesto
para cargar solo el plugin propietario antes de que todo el runtime del Gateway haya
registrado proveedores.

## Referencia de mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` cuando un proveedor de comprensión de medios tiene
modelos predeterminados, prioridad de reserva de autenticación automática o compatibilidad nativa con documentos que
los helpers genéricos del núcleo necesitan antes de que cargue el runtime. Las claves también deben declararse en
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades multimedia expuestas por este proveedor.                       |
| `defaultModels`        | `Record<string, string>`            | Valores predeterminados de capacidad a modelo usados cuando la configuración no especifica un modelo. |
| `autoPriority`         | `Record<string, number>`            | Los números más bajos se ordenan antes para la alternativa automática de proveedor basada en credenciales. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documentos nativas admitidas por el proveedor.                 |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un Plugin de canal necesite metadatos de configuración baratos antes de que se cargue el runtime. La detección de configuración/estado de canal de solo lectura puede usar estos metadatos directamente para canales externos configurados cuando no hay una entrada de configuración disponible, o cuando `setup.requiresRuntime: false` declara que el runtime de configuración no es necesario.

`channelConfigs` son metadatos del manifiesto del Plugin, no una nueva sección de configuración de usuario de nivel superior. Los usuarios siguen configurando instancias de canal en `channels.<channel-id>`. OpenClaw lee los metadatos del manifiesto para decidir qué Plugin posee ese canal configurado antes de que se ejecute el código de runtime del Plugin.

Para un Plugin de canal, `configSchema` y `channelConfigs` describen rutas distintas:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

Los Plugins no incluidos que declaren `channels[]` también deberían declarar entradas `channelConfigs` coincidentes. Sin ellas, OpenClaw todavía puede cargar el Plugin, pero el esquema de configuración de ruta fría, la configuración inicial y las superficies de Control UI no pueden conocer la forma de las opciones propiedad del canal hasta que se ejecute el runtime del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` y `nativeSkillsAutoEnabled` pueden declarar valores predeterminados estáticos de `auto` para comprobaciones de configuración de comandos que se ejecutan antes de que se cargue el runtime del canal. Los canales incluidos también pueden publicar los mismos valores predeterminados mediante `package.json#openclaw.channel.commands` junto con sus otros metadatos de catálogo de canales propiedad del paquete.

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
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI, marcadores de posición e indicaciones sensibles opcionales para esa sección de configuración de canal. |
| `label`       | `string`                 | Etiqueta de canal fusionada en las superficies de selección e inspección cuando los metadatos de runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para superficies de inspección y catálogo.                    |
| `commands`    | `object`                 | Valores predeterminados automáticos estáticos de comandos nativos y Skills nativas para comprobaciones de configuración previas al runtime. |
| `preferOver`  | `string[]`               | Ids de Plugins heredados o de menor prioridad que este canal debería superar en las superficies de selección. |

### Reemplazar otro Plugin de canal

Usa `preferOver` cuando tu Plugin sea el propietario preferido para un id de canal que otro Plugin también puede proporcionar. Los casos comunes son un id de Plugin renombrado, un Plugin independiente que sustituye a un Plugin incluido, o una bifurcación mantenida que conserva el mismo id de canal para compatibilidad de configuración.

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

Cuando `channels.chat` está configurado, OpenClaw considera tanto el id del canal como el id del Plugin preferido. Si el Plugin de menor prioridad solo se seleccionó porque está incluido o habilitado de forma predeterminada, OpenClaw lo deshabilita en la configuración efectiva de runtime para que un Plugin sea propietario del canal y sus herramientas. La selección explícita del usuario sigue prevaleciendo: si el usuario habilita explícitamente ambos Plugins, OpenClaw conserva esa elección e informa diagnósticos de canal/herramienta duplicados en lugar de cambiar silenciosamente el conjunto de Plugins solicitado.

Mantén `preferOver` limitado a ids de Plugins que realmente puedan proporcionar el mismo canal. No es un campo de prioridad general y no renombra claves de configuración de usuario.

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw deba inferir tu Plugin de proveedor a partir de ids de modelo abreviados como `gpt-5.5` o `claude-sonnet-4.6` antes de que se cargue el runtime del Plugin.

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
- `modelPatterns` prevalece sobre `modelPrefixes`
- si coinciden un Plugin no incluido y un Plugin incluido, gana el Plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a ids de modelo abreviados.         |
| `modelPatterns` | `string[]` | Fuentes de regex comparadas con ids de modelo abreviados tras eliminar el sufijo de perfil. |

## Referencia de modelCatalog

Usa `modelCatalog` cuando OpenClaw deba conocer los metadatos de modelos del proveedor antes de cargar el runtime del Plugin. Esta es la fuente propiedad del manifiesto para filas de catálogo fijas, alias de proveedor, reglas de supresión y modo de detección. La actualización de runtime sigue perteneciendo al código de runtime del proveedor, pero el manifiesto indica al núcleo cuándo se requiere runtime.

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
| `providers`    | `Record<string, object>`                                 | Filas de catálogo para ids de proveedor propiedad de este Plugin. Las claves también deberían aparecer en `providers` de nivel superior. |
| `aliases`      | `Record<string, object>`                                 | Alias de proveedor que deberían resolverse a un proveedor propio para la planificación de catálogo o supresión. |
| `suppressions` | `object[]`                                               | Filas de modelo de otra fuente que este Plugin suprime por una razón específica del proveedor.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Si el catálogo del proveedor puede leerse desde metadatos del manifiesto, actualizarse en caché o requiere runtime. |

`aliases` participa en la búsqueda de propiedad del proveedor para la planificación del catálogo de modelos. Los destinos de alias deben ser proveedores de nivel superior propiedad del mismo Plugin. Cuando una lista filtrada por proveedor usa un alias, OpenClaw puede leer el manifiesto propietario y aplicar anulaciones de API/URL base del alias sin cargar el runtime del proveedor.
Los alias no expanden los listados de catálogo sin filtrar; las listas amplias emiten solo las filas del proveedor canónico propietario.

`suppressions` reemplaza el antiguo hook de runtime de proveedor `suppressBuiltInModel`. Las entradas de supresión se respetan solo cuando el proveedor es propiedad del Plugin o se declara como una clave `modelCatalog.aliases` que apunta a un proveedor propio. Los hooks de supresión de runtime ya no se llaman durante la resolución de modelos.

Campos del proveedor:

| Campo     | Tipo                     | Qué significa                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predeterminada opcional para modelos en este catálogo de proveedor. |
| `api`     | `ModelApi`               | Adaptador de API predeterminado opcional para modelos en este catálogo de proveedor. |
| `headers` | `Record<string, string>` | Encabezados estáticos opcionales que se aplican a este catálogo de proveedor. |
| `models`  | `object[]`               | Filas de modelo obligatorias. Las filas sin un `id` se ignoran.   |

Campos del modelo:

| Campo           | Tipo                                                           | Qué significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id de modelo local del proveedor, sin el prefijo `provider/`.                    |
| `name`          | `string`                                                       | Nombre de visualización opcional.                                                      |
| `api`           | `ModelApi`                                                     | Anulación opcional de API por modelo.                                            |
| `baseUrl`       | `string`                                                       | Anulación opcional de URL base por modelo.                                       |
| `headers`       | `Record<string, string>`                                       | Encabezados estáticos opcionales por modelo.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalidades que acepta el modelo.                                               |
| `reasoning`     | `boolean`                                                      | Si el modelo expone comportamiento de razonamiento.                               |
| `contextWindow` | `number`                                                       | Ventana de contexto nativa del proveedor.                                             |
| `contextTokens` | `number`                                                       | Límite efectivo opcional de contexto en tiempo de ejecución cuando difiere de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Tokens máximos de salida cuando se conocen.                                           |
| `cost`          | `object`                                                       | Precio opcional en USD por millón de tokens, incluido `tieredPricing` opcional. |
| `compat`        | `object`                                                       | Indicadores de compatibilidad opcionales que coinciden con la compatibilidad de configuración de modelos de OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Estado de listado. Suprimir solo cuando la fila no deba aparecer en absoluto.          |
| `statusReason`  | `string`                                                       | Motivo opcional mostrado con un estado no disponible.                            |
| `replaces`      | `string[]`                                                     | Ids de modelos locales del proveedor más antiguos a los que este modelo reemplaza.                       |
| `replacedBy`    | `string`                                                       | Id de modelo local del proveedor de reemplazo para filas obsoletas.                    |
| `tags`          | `string[]`                                                     | Etiquetas estables usadas por selectores y filtros.                                    |

Campos de supresión:

| Campo                      | Tipo       | Qué significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id de proveedor para la fila ascendente que se va a suprimir. Debe ser propiedad de este plugin o declararse como alias propio. |
| `model`                    | `string`   | Id de modelo local del proveedor que se va a suprimir.                                                                      |
| `reason`                   | `string`   | Mensaje opcional mostrado cuando la fila suprimida se solicita directamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Lista opcional de hosts efectivos de URL base del proveedor requeridos antes de que se aplique la supresión.               |
| `when.providerConfigApiIn` | `string[]` | Lista opcional de valores exactos de `api` de configuración del proveedor requeridos antes de que se aplique la supresión.              |

No coloque datos exclusivos de tiempo de ejecución en `modelCatalog`. Use `static` solo cuando las
filas del manifiesto sean lo bastante completas para que las superficies de lista filtrada por proveedor y selector omitan
el descubrimiento de registro/tiempo de ejecución. Use `refreshable` cuando las filas del manifiesto sean semillas
o suplementos útiles que se pueden listar, pero una actualización/caché pueda agregar más filas más adelante;
las filas actualizables no son autoritativas por sí solas. Use `runtime` cuando OpenClaw
deba cargar el tiempo de ejecución del proveedor para conocer la lista.

## Referencia de modelIdNormalization

Use `modelIdNormalization` para una limpieza económica de ids de modelo propiedad del proveedor que debe
ocurrir antes de que se cargue el tiempo de ejecución del proveedor. Esto mantiene alias como nombres
cortos de modelo, ids heredados locales del proveedor y reglas de prefijo de proxy en el manifiesto del plugin
propietario en lugar de en tablas principales de selección de modelos.

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
| `aliases`                            | `Record<string,string>` | Alias exactos de ids de modelo sin distinción entre mayúsculas y minúsculas. Los valores se devuelven como están escritos.                  |
| `stripPrefixes`                      | `string[]`              | Prefijos que se deben eliminar antes de la búsqueda de alias, útiles para duplicación heredada de proveedor/modelo.     |
| `prefixWhenBare`                     | `string`                | Prefijo que se debe agregar cuando el id de modelo normalizado aún no contiene `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Reglas condicionales de prefijo para ids simples después de la búsqueda de alias, definidas por `modelPrefix` y `prefix`. |

## Referencia de providerEndpoints

Use `providerEndpoints` para la clasificación de endpoints que la política de solicitudes genérica
debe conocer antes de que se cargue el tiempo de ejecución del proveedor. El núcleo sigue siendo propietario del significado de cada
`endpointClass`; los manifiestos de plugin son propietarios de los metadatos de host y URL base.

Campos de endpoint:

| Campo                          | Tipo       | Qué significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Clase de endpoint conocida por el núcleo, como `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nombres de host exactos que se asignan a la clase de endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufijos de host que se asignan a la clase de endpoint. Use el prefijo `.` para coincidencia solo de sufijo de dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizadas exactas que se asignan a la clase de endpoint.                             |
| `googleVertexRegion`           | `string`   | Región estática de Google Vertex para hosts globales exactos.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufijo que se debe quitar de los hosts coincidentes para exponer el prefijo de región de Google Vertex.                 |

## Referencia de providerRequest

Use `providerRequest` para metadatos económicos de compatibilidad de solicitudes que la política
de solicitudes genérica necesita sin cargar el tiempo de ejecución del proveedor. Mantenga la reescritura de payloads
específica de comportamiento en hooks de tiempo de ejecución del proveedor o helpers compartidos de familia de proveedores.

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
| `compatibilityFamily` | `"moonshot"` | Contenedor opcional de compatibilidad de familia de proveedor para helpers compartidos de solicitudes.              |
| `openAICompletions`   | `object`     | Indicadores de solicitudes de completions compatibles con OpenAI, actualmente `supportsStreamingUsage`.       |

## Referencia de modelPricing

Use `modelPricing` cuando un proveedor necesite comportamiento de precios del plano de control antes de que
se cargue el tiempo de ejecución. La caché de precios del Gateway lee estos metadatos sin importar
código de tiempo de ejecución del proveedor.

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
| `external`   | `boolean`         | Establezca `false` para proveedores locales/autohospedados que nunca deben obtener precios de OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Asignación de búsqueda de precios de OpenRouter. `false` desactiva la búsqueda de OpenRouter para este proveedor.           |
| `liteLLM`    | `false \| object` | Asignación de búsqueda de precios de LiteLLM. `false` desactiva la búsqueda de LiteLLM para este proveedor.                 |

Campos de origen:

| Campo                      | Tipo               | Qué significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de proveedor de catálogo externo cuando difiere del id de proveedor de OpenClaw, por ejemplo `z-ai` para un proveedor `zai`. |
| `passthroughProviderModel` | `boolean`          | Trate los ids de modelo que contienen barras como referencias anidadas de proveedor/modelo, útil para proveedores proxy como OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes adicionales de ids de modelo del catálogo externo. `version-dots` prueba ids de versión con puntos como `claude-opus-4.6`.            |

### Índice de proveedores de OpenClaw

El índice de proveedores de OpenClaw son metadatos de vista previa propiedad de OpenClaw para proveedores
cuyos plugins pueden no estar instalados todavía. No forma parte de un manifiesto de plugin.
Los manifiestos de plugin siguen siendo la autoridad del plugin instalado. El índice de proveedores es
el contrato interno de respaldo que las futuras superficies de selector de modelos de proveedor instalable y preinstalación
consumirán cuando un plugin de proveedor no esté instalado.

Orden de autoridad del catálogo:

1. Configuración del usuario.
2. `modelCatalog` del manifiesto del plugin instalado.
3. Caché de catálogo de modelos de una actualización explícita.
4. Filas de vista previa del índice de proveedores de OpenClaw.

El Índice de proveedores no debe contener secretos, estado habilitado, hooks de runtime ni
datos de modelos en vivo específicos de cuentas. Sus catálogos de vista previa usan la misma
forma de fila de proveedor `modelCatalog` que los manifiestos de plugins, pero deben permanecer limitados
a metadatos de visualización estables, salvo que los campos del adaptador de runtime como `api`,
`baseUrl`, precios o marcas de compatibilidad se mantengan intencionadamente alineados con
el manifiesto del plugin instalado. Los proveedores con descubrimiento `/models` en vivo deben
escribir filas actualizadas mediante la ruta explícita de caché del catálogo de modelos en lugar de
hacer que el listado normal o el onboarding llamen a las API del proveedor.

Las entradas del Índice de proveedores también pueden llevar metadatos de plugin instalable para proveedores
cuyo plugin se haya movido fuera del núcleo o aún no esté instalado de otro modo. Estos
metadatos reflejan el patrón del catálogo de canales: nombre del paquete, especificación de instalación npm,
integridad esperada y etiquetas ligeras de elección de autenticación bastan para mostrar una
opción de configuración instalable. Una vez instalado el plugin, su manifiesto prevalece y
la entrada del Índice de proveedores se ignora para ese proveedor.

Las claves de capacidad heredadas de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
de manifiestos ya no trata esos campos de nivel superior como propiedad de
capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de elección de autenticación y sugerencias de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, bloqueo de instalación, configuración o metadatos de catálogo |

Si no tienes claro dónde corresponde una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar código del plugin, ponla en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación npm, ponla en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugin previos al runtime viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara puntos de entrada de plugins nativos. Debe permanecer dentro del directorio del paquete del plugin.                                                                          |
| `openclaw.runtimeExtensions`                                      | Declara puntos de entrada de runtime JavaScript compilados para paquetes instalados. Debe permanecer dentro del directorio del paquete del plugin.                                   |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo de configuración usado durante el onboarding, el inicio diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el punto de entrada de configuración JavaScript compilado para paquetes instalados. Requiere `setupEntry`, debe existir y debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                        |
| `openclaw.channel.commands`                                       | Metadatos estáticos de comandos nativos y valores predeterminados automáticos de Skills nativas usados por superficies de configuración, auditoría y listas de comandos antes de que cargue el runtime del canal. |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del comprobador de estado configurado que pueden responder “¿ya existe una configuración solo por env?” sin cargar todo el runtime del canal.                      |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del comprobador de autenticación persistida que pueden responder “¿hay algo con sesión iniciada?” sin cargar todo el runtime del canal.                            |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Sugerencias de instalación/actualización para plugins incluidos y publicados externamente.                                                                                           |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un piso semver como `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                         |
| `openclaw.install.expectedIntegrity`                              | Cadena de integridad npm dist esperada, como `sha512-...`; los flujos de instalación y actualización verifican el artefacto obtenido contra ella.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta estrecha de recuperación por reinstalación de plugins incluidos cuando la configuración no es válida.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes que el plugin de canal completo durante el inicio.                                                        |

Los metadatos del manifiesto deciden qué opciones de proveedor/canal/configuración aparecen en
el onboarding antes de que cargue el runtime. `package.json#openclaw.install` indica al
onboarding cómo obtener o habilitar ese plugin cuando el usuario elige una de esas
opciones. No muevas las sugerencias de instalación a `openclaw.plugin.json`.

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos para fuentes de plugins no incluidas. Los valores no válidos se rechazan;
los valores más nuevos pero válidos omiten plugins externos en hosts antiguos. Se asume que los plugins
de origen incluidos comparten versión con el checkout del host.

La fijación exacta de versión npm ya vive en `npmSpec`, por ejemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Las entradas del catálogo externo oficial
deben emparejar especificaciones exactas con `expectedIntegrity` para que los flujos de actualización fallen
de forma cerrada si el artefacto npm obtenido ya no coincide con la versión fijada.
El onboarding interactivo sigue ofreciendo especificaciones npm de registros de confianza, incluidos
nombres de paquetes sin versión y dist-tags, por compatibilidad. Los diagnósticos de catálogo pueden
distinguir fuentes exactas, flotantes, fijadas por integridad, con integridad ausente, con desajuste de nombre
de paquete y con elección predeterminada no válida. También advierten cuando
`expectedIntegrity` está presente pero no hay una fuente npm válida que pueda fijar.
Cuando `expectedIntegrity` está presente,
los flujos de instalación/actualización la aplican; cuando se omite, la resolución del registro se
registra sin una fijación de integridad.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar todo el
runtime. La entrada de configuración debe exponer metadatos del canal más adaptadores de configuración,
estado y secretos seguros para configuración; mantén los clientes de red, listeners del gateway y
runtimes de transporte en el punto de entrada principal de la extensión.

Los campos de punto de entrada de runtime no anulan las comprobaciones de límite de paquete para los campos
de punto de entrada de origen. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer cargable una
ruta `openclaw.extensions` que escape.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente estrecho. No
hace instalables configuraciones rotas arbitrarias. Hoy solo permite que los flujos de instalación
se recuperen de fallos específicos obsoletos de actualización de plugins incluidos, como una
ruta de plugin incluido ausente o una entrada `channels.<id>` obsoleta para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un pequeño módulo comprobador:

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

Úsalo cuando los flujos de configuración, doctor, estado o presencia de solo lectura necesiten una sonda barata
sí/no de autenticación antes de que cargue el plugin de canal completo. El estado de autenticación persistida no es
estado de canal configurado: no uses estos metadatos para habilitar plugins automáticamente,
reparar dependencias de runtime ni decidir si un runtime de canal debe cargarse.
La exportación de destino debe ser una función pequeña que lea solo estado persistido; no
la enrutes por el barrel del runtime de canal completo.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de configuración solo por env:

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

Úsalo cuando un canal pueda responder el estado configurado desde env u otras
entradas pequeñas no de runtime. Si la comprobación necesita resolución completa de configuración o el runtime
real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin.

## Precedencia de descubrimiento (ids de plugins duplicados)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, workspace, rutas explícitas seleccionadas por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins distribuidos con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins descubiertos en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido ubicada en el workspace no reemplazará la compilación incluida.
- Para anular realmente un plugin incluido con uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del workspace.
- Los descartes de duplicados se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Cada plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Un schema vacío es aceptable (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los schemas se validan en el momento de lectura/escritura de la configuración, no en runtime.

## Comportamiento de validación

- Las claves `channels.*` desconocidas son **errores**, a menos que el id del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a ids de plugin **detectables**. Los ids desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración de plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta la [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local. El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas, siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita claves personalizadas de nivel superior.
- `channels`, `providers`, `cliBackends` y `skills` se pueden omitir cuando un plugin no los necesita.
- `providerDiscoveryEntry` debe seguir siendo ligero y no debería importar código amplio de runtime; úsalo para metadatos estáticos del catálogo de proveedores o descriptores de descubrimiento acotados, no para ejecución en tiempo de solicitud.
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory`, `kind: "context-engine"` mediante `plugins.slots.contextEngine` (predeterminado `legacy`).
- Declara el tipo exclusivo de plugin en este manifiesto. `OpenClawPluginDefinition.kind` de la entrada de runtime está obsoleto y permanece solo como alternativa de compatibilidad para plugins más antiguos.
- Los metadatos de variables de entorno (`setup.providers[].envVars`, el obsoleto `providerAuthEnvVars` y `channelEnvVars`) son solo declarativos. El estado, la auditoría, la validación de entrega de cron y otras superficies de solo lectura siguen aplicando la confianza del plugin y la política de activación efectiva antes de tratar una variable de entorno como configurada.
- Para metadatos del asistente de runtime que requieren código de proveedor, consulta [Hooks de runtime de proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, `allow-build-scripts` de pnpm + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Building plugins" href="/es/plugins/building-plugins" icon="rocket">
    Primeros pasos con plugins.
  </Card>
  <Card title="Plugin architecture" href="/es/plugins/architecture" icon="diagram-project">
    Arquitectura interna y modelo de capacidades.
  </Card>
  <Card title="SDK overview" href="/es/plugins/sdk-overview" icon="book">
    Referencia del SDK de Plugin e importaciones de subrutas.
  </Card>
</CardGroup>
