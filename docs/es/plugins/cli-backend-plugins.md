---
read_when:
    - Estás creando un plugin de backend de CLI de IA local
    - Quieres registrar un backend para referencias de modelo como acme-cli/model
    - Necesitas asignar una CLI de terceros al ejecutor de respaldo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend local de CLI de IA
title: Crear plugins de backend de CLI
x-i18n:
    generated_at: "2026-07-05T11:30:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97540f49e64df176c5bbfa596ba40acbf6418ad97ee55a5a79e257db68e49c7b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw llame a una CLI de IA local como
backend de inferencia de texto. El backend aparece como prefijo de proveedor en
las referencias de modelo:

```text
acme-cli/acme-large
```

Usa un backend de CLI cuando la integración ascendente ya esté expuesta como un
comando local, cuando la CLI sea propietaria del estado de inicio de sesión
local, o como alternativa cuando los proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente expone una API de modelos HTTP normal, escribe un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins) en su lugar. Si el runtime
  ascendente es propietario de sesiones completas de agente, eventos de herramientas, Compaction o estado de
  tareas en segundo plano, usa un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Qué controla el plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato              | Archivo                | Propósito                                                 |
| --------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada del paquete   | `package.json`         | Apunta OpenClaw al módulo de runtime del plugin           |
| Propiedad del manifiesto | `openclaw.plugin.json` | Declara el id del backend antes de que cargue el runtime  |
| Registro en runtime   | `index.ts`             | Llama a `api.registerCliBackend(...)` con valores predeterminados del comando |

El manifiesto es metadato de descubrimiento: no ejecuta la CLI ni registra
comportamiento de runtime. El comportamiento de runtime comienza cuando la entrada del plugin llama a
`api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Create package metadata">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Los paquetes publicados deben incluir archivos de runtime JavaScript compilados. Si tu entrada fuente
    es `./src/index.ts`, agrega `openclaw.runtimeExtensions` apuntando al
    par JavaScript compilado. Consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` es la lista de propiedad de runtime; permite que OpenClaw cargue automáticamente el
    plugin cuando la configuración o la selección de modelo menciona `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Agrégala cuando
    el descubrimiento de modelos, el onboarding o el estado deban reconocer el backend
    sin cargar el runtime del plugin. Usa `requiresRuntime: false` solo cuando
    esos descriptores estáticos sean suficientes para la configuración.

  </Step>

  <Step title="Register the backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    El id del backend debe coincidir con la entrada `cliBackends` del manifiesto. La
    `config` registrada es solo el valor predeterminado; la configuración del usuario bajo
    `agents.defaults.cliBackends.acme-cli` se fusiona sobre ella en runtime.

  </Step>
</Steps>

## Forma de configuración

`CliBackendConfig` describe cómo OpenClaw debe iniciar y analizar la CLI:

| Campo                                                     | Uso                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Nombre del binario o ruta absoluta del comando                                    |
| `args`                                                    | argv base para ejecuciones nuevas                                                 |
| `resumeArgs`                                              | argv alternativo para sesiones reanudadas; admite `{sessionId}`                   |
| `output` / `resumeOutput`                                 | Analizador: `json`, `jsonl` o `text`                                              |
| `jsonlDialect`                                            | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`            |
| `liveSession`                                             | Modo de proceso CLI de larga duración (`claude-stdio`)                            |
| `input`                                                   | Transporte del prompt: `arg` o `stdin`                                            |
| `maxPromptArgChars`                                       | Longitud máxima del prompt para modo `arg` antes de volver a stdin                |
| `env` / `clearEnv`                                        | Variables de entorno adicionales que inyectar, o nombres que quitar antes del inicio |
| `modelArg`                                                | Flag usado antes del id del modelo                                                |
| `modelAliases`                                            | Mapea ids de modelos de OpenClaw a ids nativos de la CLI                          |
| `sessionArg` / `sessionArgs`                              | Cómo pasar un id de sesión                                                        |
| `sessionMode`                                             | `always`, `existing` o `none`                                                     |
| `sessionIdFields`                                         | Campos JSON que OpenClaw lee de la salida de la CLI                               |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte del prompt de sistema                                                  |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de anulación de configuración para un archivo de prompt de sistema (por ejemplo `-c`) |
| `systemPromptMode`                                        | `append` o `replace`                                                              |
| `systemPromptWhen`                                        | `first`, `always` o `never`                                                       |
| `imageArg` / `imageMode`                                  | Flag de ruta de imagen y cómo pasar varias imágenes (`repeat` o `list`)           |
| `imagePathScope`                                          | Dónde viven los archivos de imagen preparados antes de la entrega: `temp` o `workspace` |
| `serialize`                                               | Mantiene ordenadas las ejecuciones del mismo backend                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | Opta por una resiembra acotada desde la transcripción sin procesar antes de Compaction para reinicios de sesión seguros |
| `reliability.outputLimits`                                | Máx. de caracteres/líneas JSONL sin procesar retenidos para un turno de CLI en vivo (backends de sesión en vivo) |
| `reliability.watchdog`                                    | Ajuste del tiempo de espera sin salida, separado para ejecuciones nuevas frente a reanudadas |

Prefiere la configuración estática más pequeña que coincida con la CLI. Agrega callbacks del plugin
solo para comportamiento que realmente pertenezca al backend.

## Hooks avanzados de backend

`CliBackendPlugin` también puede definir:

| Hook                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescribe la configuración de usuario heredada después de la fusión          |
| `resolveExecutionArgs(ctx)`        | Agrega flags con alcance de solicitud, como esfuerzo de razonamiento o aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación o configuración antes del inicio    |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final del prompt de sistema específica de la CLI   |
| `textTransforms`                   | Reemplazos bidireccionales de prompt/salida                                  |
| `defaultAuthProfileId`             | Prefiere un perfil de autenticación específico de OpenClaw                   |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan las sesiones CLI almacenadas |
| `nativeToolMode`                   | Declara si la CLI tiene herramientas nativas siempre activas                 |
| `sideQuestionToolMode`             | Declara herramientas nativas deshabilitadas para preguntas secundarias `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Opta por el puente de herramientas MCP de local loopback de OpenClaw         |
| `ownsNativeCompaction`             | El backend controla su propia Compaction - OpenClaw difiere                 |

Mantén estos hooks bajo propiedad del proveedor. No agregues ramas específicas de CLI al núcleo cuando
un hook de backend pueda expresar el comportamiento.

`ctx.executionMode` es `"agent"` para turnos normales y `"side-question"` para
llamadas efímeras `/btw`. Úsalo cuando la CLI necesite flags de un solo uso diferentes,
como deshabilitar herramientas nativas, persistencia de sesión o comportamiento de reanudación para
BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"` pero su
argv de pregunta secundaria deshabilita esas herramientas de forma fiable, establece también
`sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw falla cerrado cuando BTW
requiere una ejecución CLI sin herramientas.

### `ownsNativeCompaction`: exclusión de OpenClaw Compaction

Si tu backend ejecuta un agente que compacta su **propia** transcripción, establece
`ownsNativeCompaction: true` para que el resumidor de salvaguarda de OpenClaw nunca se ejecute
contra sus sesiones - el ciclo de vida de Compaction de la CLI devuelve una no-op y el
turno continúa. `claude-cli` lo declara porque Claude Code compacta
internamente sin endpoint de arnés. Las sesiones con arnés nativo, como Codex,
siguen enrutándose a su endpoint de Compaction de arnés en su lugar.

**Decláralo solo cuando se cumpla todo lo siguiente**, o una sesión diferida
por encima del presupuesto puede permanecer por encima del presupuesto o quedar obsoleta (OpenClaw ya no
la rescata):

- el backend compacta de forma fiable o limita su propia transcripción cuando se acerca a su
  ventana;
- persiste una sesión reanudable para que el estado compactado sobreviva entre turnos
  (por ejemplo `--resume` / `--session-id`);
- no es una sesión de compactación de arnés nativo: las sesiones que coinciden con `agentHarnessId`
  se enrutan al endpoint del arnés en su lugar.

## Puente de herramientas MCP

Los backends de CLI no reciben herramientas de OpenClaw de forma predeterminada. Si la CLI puede consumir
una configuración MCP, actívala explícitamente:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Modos de puente compatibles:

| Modo                     | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI que aceptan un archivo de configuración MCP                  |
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración en argv          |
| `gemini-system-settings` | CLI que leen ajustes MCP desde su directorio de ajustes del sistema |

Activa el puente solo cuando la CLI pueda consumirlo realmente. Si la CLI tiene
su propia capa de herramientas integrada que no se puede desactivar, configura `nativeToolMode:
"always-on"` para que OpenClaw pueda fallar de forma cerrada cuando un llamador requiera que no haya
herramientas nativas.

## Configuración de usuario

Los usuarios pueden sobrescribir cualquier valor predeterminado del backend:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documenta la sobrescritura mínima que los usuarios probablemente necesitarán: normalmente solo
`command` cuando el binario está fuera de `PATH`.

## Verificación

Para plugins incluidos, añade una prueba enfocada alrededor del builder y el registro
de configuración, y luego ejecuta el carril de pruebas dirigido del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifica el descubrimiento y una ejecución real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, añade una prueba de humo en vivo que demuestre esas
rutas con la CLI real. No dependas de la inspección estática para el comportamiento de prompts, imágenes,
MCP o reanudación de sesión.

## Lista de comprobación

<Check>`package.json` tiene `openclaw.extensions` y entradas de runtime compiladas para paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos deben ver el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo id de backend que el manifiesto</Check>
<Check>Las sobrescrituras de usuario bajo `agents.defaults.cliBackends.<id>` siguen prevaleciendo</Check>
<Check>Los ajustes de sesión, prompt del sistema, imagen y parser de salida coinciden con el contrato real de la CLI</Check>
<Check>Las pruebas dirigidas y al menos una prueba de humo de CLI en vivo demuestran la ruta del backend</Check>

## Relacionado

- [Backends de CLI](/es/gateway/cli-backends) - configuración de usuario y comportamiento en runtime
- [Creación de plugins](/es/plugins/building-plugins) - conceptos básicos de paquetes y manifiestos
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview) - referencia de API de registro
- [Manifiesto de Plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés de agente](/es/plugins/sdk-agent-harness) - runtimes completos de agentes externos
