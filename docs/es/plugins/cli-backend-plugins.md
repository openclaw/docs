---
read_when:
    - Estás creando un plugin de backend de CLI de IA local
    - Quieres registrar un backend para referencias de modelo como acme-cli/model
    - Necesitas asignar una CLI de terceros al ejecutor de respaldo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend de CLI de IA local
title: Creación de plugins de backend de CLI
x-i18n:
    generated_at: "2026-06-27T12:08:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw llame a una CLI de IA local como backend de inferencia de texto. El backend aparece como prefijo de proveedor en las referencias de modelo:

```text
acme-cli/acme-large
```

Usa un backend de CLI cuando la integración ascendente ya se expone como un comando local, cuando la CLI posee el estado de inicio de sesión local o cuando la CLI es una alternativa útil si los proveedores de API no están disponibles.

<Info>
  Si el servicio ascendente expone una API de modelo HTTP normal, escribe un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins) en su lugar. Si el runtime ascendente posee sesiones completas de agente, eventos de herramientas, compaction o estado de tareas en segundo plano, usa un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Qué posee el plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato             | Archivo                | Propósito                                                 |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada del paquete  | `package.json`         | Apunta OpenClaw al módulo de runtime del plugin           |
| Propiedad del manifiesto | `openclaw.plugin.json` | Declara el id del backend antes de cargar el runtime      |
| Registro de runtime  | `index.ts`             | Llama a `api.registerCliBackend(...)` con valores predeterminados de comando |

El manifiesto es metadato de descubrimiento. No ejecuta la CLI y no registra comportamiento de runtime. El comportamiento de runtime empieza cuando la entrada del plugin llama a `api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Crear metadatos del paquete">
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

    Los paquetes publicados deben incluir archivos de runtime JavaScript compilados. Si tu entrada de fuente es `./src/index.ts`, agrega `openclaw.runtimeExtensions` que apunte al par JavaScript compilado. Consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declarar la propiedad del backend">
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

    `cliBackends` es la lista de propiedad de runtime. Permite que OpenClaw cargue automáticamente el plugin cuando la configuración o la selección de modelo menciona `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Agrégala cuando el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend sin cargar el runtime del plugin. Usa `requiresRuntime: false` solo cuando esos descriptores estáticos sean suficientes para la configuración.

  </Step>

  <Step title="Registrar el backend">
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

    El id del backend debe coincidir con la entrada `cliBackends` del manifiesto. La `config` registrada es solo el valor predeterminado; la configuración de usuario en `agents.defaults.cliBackends.acme-cli` se fusiona sobre ella en runtime.

  </Step>
</Steps>

## Forma de configuración

`CliBackendConfig` describe cómo OpenClaw debe iniciar y analizar la CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nombre del binario o ruta absoluta del comando              |
| `args`                                    | argv base para ejecuciones nuevas                           |
| `resumeArgs`                              | argv alternativo para sesiones reanudadas; admite `{sessionId}` |
| `output` / `resumeOutput`                 | Analizador: `json`, `jsonl` o `text`                        |
| `input`                                   | Transporte del prompt: `arg` o `stdin`                      |
| `modelArg`                                | Flag usado antes del id del modelo                          |
| `modelAliases`                            | Asigna ids de modelo de OpenClaw a ids nativos de la CLI    |
| `sessionArg` / `sessionArgs`              | Cómo pasar un id de sesión                                  |
| `sessionMode`                             | `always`, `existing` o `none`                               |
| `sessionIdFields`                         | Campos JSON que OpenClaw lee de la salida de la CLI         |
| `systemPromptArg` / `systemPromptFileArg` | Transporte del prompt del sistema                           |
| `systemPromptWhen`                        | `first`, `always` o `never`                                 |
| `imageArg` / `imageMode`                  | Compatibilidad con rutas de imagen                          |
| `serialize`                               | Mantiene ordenadas las ejecuciones del mismo backend        |
| `reliability.watchdog`                    | Ajuste del tiempo de espera sin salida                      |

Prefiere la configuración estática más pequeña que coincida con la CLI. Agrega callbacks de plugin solo para el comportamiento que realmente pertenezca al backend.

## Hooks avanzados de backend

`CliBackendPlugin` también puede definir:

| Hook                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescribe la configuración de usuario heredada después de la fusión         |
| `resolveExecutionArgs(ctx)`        | Agrega flags con alcance de solicitud, como esfuerzo de razonamiento o aislamiento de preguntas laterales |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación o configuración antes del inicio   |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final del prompt del sistema específica de la CLI |
| `textTransforms`                   | Reemplazos bidireccionales de prompt/salida                                 |
| `defaultAuthProfileId`             | Prefiere un perfil de autenticación de OpenClaw específico                  |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan sesiones de CLI almacenadas |
| `nativeToolMode`                   | Declara si la CLI tiene herramientas nativas siempre activas                |
| `sideQuestionToolMode`             | Declara herramientas nativas deshabilitadas para preguntas laterales de `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Opta por usar el puente de herramientas MCP de loopback de OpenClaw         |
| `ownsNativeCompaction`             | El backend posee su propia Compaction - OpenClaw la difiere                 |

Mantén estos hooks en propiedad del proveedor. No agregues ramas específicas de CLI al núcleo cuando un hook de backend pueda expresar el comportamiento.

`ctx.executionMode` es `"agent"` para turnos normales y `"side-question"` para llamadas efímeras de `/btw`. Úsalo cuando la CLI necesite flags de una sola ejecución distintos, como deshabilitar herramientas nativas, persistencia de sesión o comportamiento de reanudación para BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"` pero su argv de pregunta lateral deshabilita esas herramientas de forma confiable, también establece `sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw falla de forma cerrada cuando BTW requiere una ejecución de CLI sin herramientas.

### `ownsNativeCompaction`: optar por no usar la Compaction de OpenClaw

Si tu backend ejecuta un agente que compacta su **propia** transcripción, establece `ownsNativeCompaction: true` para que el resumidor de salvaguarda de OpenClaw nunca se ejecute contra sus sesiones: el ciclo de vida de compaction de la CLI devuelve una no operación y el turno continúa. `claude-cli` lo declara porque Claude Code compacta internamente sin endpoint de arnés. Las sesiones de arnés nativo como Codex siguen enrutándose a su endpoint de compaction de arnés en su lugar.

**Decláralo solo cuando se cumpla todo lo siguiente**, o una sesión diferida por exceder el presupuesto puede permanecer por encima del presupuesto o quedar obsoleta (OpenClaw ya no la rescata):

- el backend compacta o limita de forma confiable su propia transcripción cuando se acerca a su ventana;
- persiste una sesión reanudable para que el estado compactado sobreviva entre turnos
  (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de compaction de arnés nativo; las sesiones que coinciden con `agentHarnessId` se enrutan al endpoint del arnés en su lugar.

## Puente de herramientas MCP

Los backends de CLI no reciben herramientas de OpenClaw de forma predeterminada. Si la CLI puede consumir una configuración MCP, opta por habilitarla explícitamente:

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

Los modos de puente admitidos son:

| Modo                     | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI que aceptan un archivo de configuración MCP                  |
| `codex-config-overrides` | CLI que aceptan anulaciones de configuración en argv             |
| `gemini-system-settings` | CLI que leen la configuración MCP desde su directorio de configuración del sistema |

Habilita el puente solo cuando la CLI pueda consumirlo realmente. Si la CLI tiene su propia capa de herramientas integrada que no se puede deshabilitar, establece `nativeToolMode:
"always-on"` para que OpenClaw pueda fallar de forma cerrada cuando un llamador requiera no usar herramientas nativas.

## Configuración de usuario

Los usuarios pueden anular cualquier valor predeterminado del backend:

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

Documenta la anulación mínima que probablemente necesiten los usuarios. Normalmente es solo `command` cuando el binario está fuera de `PATH`.

## Verificación

Para plugins incluidos, agrega una prueba enfocada en el builder y el registro de
setup, y luego ejecuta la lane de pruebas dirigida del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifica el descubrimiento y una ejecución real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, agrega una prueba de humo en vivo que demuestre esas rutas
con la CLI real. No dependas de la inspección estática para el comportamiento de prompts, imágenes, MCP o
reanudación de sesión.

## Lista de verificación

<Check>`package.json` tiene `openclaw.extensions` y entradas de runtime compiladas para paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando el descubrimiento de setup/modelo debe ver el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo id de backend que el manifiesto</Check>
<Check>Las anulaciones del usuario bajo `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>La sesión, el prompt del sistema, la imagen y la configuración del analizador de salida coinciden con el contrato real de la CLI</Check>
<Check>Las pruebas dirigidas y al menos una prueba de humo de CLI en vivo demuestran la ruta del backend</Check>

## Relacionado

- [Backends de CLI](/es/gateway/cli-backends) - configuración de usuario y comportamiento de runtime
- [Creación de plugins](/es/plugins/building-plugins) - conceptos básicos de paquetes y manifiestos
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto de Plugin](/es/plugins/manifest) - `cliBackends` y descriptores de setup
- [Arnés de agente](/es/plugins/sdk-agent-harness) - runtimes completos de agentes externos
