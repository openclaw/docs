---
read_when:
    - Estás creando un plugin de backend de CLI de IA local
    - Quiere registrar un servicio de servidor para referencias de modelo como acme-cli/model
    - Necesitas asignar una CLI de terceros al ejecutor de reserva de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un Plugin que registre un motor local de CLI de IA
title: Creación de plugins de backend de CLI
x-i18n:
    generated_at: "2026-05-07T13:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend CLI permiten que OpenClaw llame a una CLI de IA local como backend de inferencia de texto. El backend aparece como un prefijo de proveedor en las refs de modelo:

```text
acme-cli/acme-large
```

Usa un backend CLI cuando la integración ascendente ya esté expuesta como un comando local, cuando la CLI controle el estado de inicio de sesión local, o cuando la CLI sea una alternativa útil si los proveedores de API no están disponibles.

<Info>
  Si el servicio ascendente expone una API de modelos HTTP normal, escribe un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins) en su lugar. Si el runtime ascendente
  controla sesiones completas de agente, eventos de herramientas, compaction o estado de
  tareas en segundo plano, usa un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Qué controla el plugin

Un plugin de backend CLI tiene tres contratos:

| Contrato             | Archivo                | Propósito                                                 |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada de paquete   | `package.json`         | Apunta OpenClaw al módulo de runtime del plugin           |
| Propiedad de manifiesto | `openclaw.plugin.json` | Declara el id del backend antes de cargar el runtime      |
| Registro de runtime  | `index.ts`             | Llama a `api.registerCliBackend(...)` con valores predeterminados del comando |

El manifiesto es metadatos de descubrimiento. No ejecuta la CLI y no registra comportamiento de runtime. El comportamiento de runtime empieza cuando la entrada del plugin llama a `api.registerCliBackend(...)`.

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

    Los paquetes publicados deben incluir archivos JavaScript de runtime compilados. Si tu entrada de origen es `./src/index.ts`, agrega `openclaw.runtimeExtensions` que apunte al par JavaScript compilado. Consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedad de runtime. Permite que OpenClaw cargue automáticamente el plugin cuando la configuración o la selección de modelo mencione `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Agrégala cuando el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend sin cargar el runtime del plugin. Usa `requiresRuntime: false` solo cuando esos descriptores estáticos basten para la configuración.

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

## Forma de la configuración

`CliBackendConfig` describe cómo OpenClaw debe iniciar y analizar la CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nombre del binario o ruta absoluta del comando              |
| `args`                                    | argv base para ejecuciones nuevas                           |
| `resumeArgs`                              | argv alternativo para sesiones reanudadas; admite `{sessionId}` |
| `output` / `resumeOutput`                 | Analizador: `json`, `jsonl` o `text`                        |
| `input`                                   | Transporte del prompt: `arg` o `stdin`                      |
| `modelArg`                                | Marca usada antes del id del modelo                         |
| `modelAliases`                            | Asigna ids de modelo de OpenClaw a ids nativos de la CLI    |
| `sessionArg` / `sessionArgs`              | Cómo pasar un id de sesión                                  |
| `sessionMode`                             | `always`, `existing` o `none`                               |
| `sessionIdFields`                         | Campos JSON que OpenClaw lee de la salida de la CLI         |
| `systemPromptArg` / `systemPromptFileArg` | Transporte del prompt del sistema                           |
| `systemPromptWhen`                        | `first`, `always` o `never`                                 |
| `imageArg` / `imageMode`                  | Compatibilidad con rutas de imagen                          |
| `serialize`                               | Mantiene ordenadas las ejecuciones del mismo backend        |
| `reliability.watchdog`                    | Ajuste de tiempo de espera sin salida                       |

Prefiere la configuración estática más pequeña que coincida con la CLI. Agrega callbacks del plugin solo para comportamientos que realmente pertenezcan al backend.

## Hooks avanzados de backend

`CliBackendPlugin` también puede definir:

| Hook                               | Uso                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | Reescribe configuración de usuario heredada tras la fusión |
| `resolveExecutionArgs(ctx)`        | Agrega marcas con alcance de solicitud, como esfuerzo de razonamiento |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación o configuración antes del inicio |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final del prompt del sistema específica de la CLI |
| `textTransforms`                   | Reemplazos bidireccionales de prompt/salida            |
| `defaultAuthProfileId`             | Prefiere un perfil de autenticación específico de OpenClaw |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan sesiones CLI almacenadas |
| `nativeToolMode`                   | Declara si la CLI tiene herramientas nativas siempre activas |
| `bundleMcp` / `bundleMcpMode`      | Opta por el puente de herramientas MCP de loopback de OpenClaw |

Mantén estos hooks bajo propiedad del proveedor. No agregues ramas específicas de CLI al núcleo cuando un hook de backend pueda expresar el comportamiento.

## Puente de herramientas MCP

Los backends CLI no reciben herramientas de OpenClaw de forma predeterminada. Si la CLI puede consumir una configuración MCP, opta por ella explícitamente:

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

Los modos de puente compatibles son:

| Modo                     | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI que aceptan un archivo de configuración MCP                  |
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración en argv          |
| `gemini-system-settings` | CLI que leen configuración MCP desde su directorio de configuración del sistema |

Activa el puente solo cuando la CLI pueda consumirlo realmente. Si la CLI tiene su propia capa de herramientas integrada que no puede desactivarse, define `nativeToolMode:
"always-on"` para que OpenClaw pueda fallar en modo cerrado cuando un llamador requiera no usar herramientas nativas.

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

Documenta la sobrescritura mínima que los usuarios probablemente necesiten. Normalmente es solo `command` cuando el binario está fuera de `PATH`.

## Verificación

Para plugins incluidos, agrega una prueba enfocada alrededor del constructor y el registro de configuración, y luego ejecuta el carril de pruebas dirigido del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifica el descubrimiento y una ejecución real de modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, agrega una prueba smoke en vivo que demuestre esas rutas con la CLI real. No dependas de la inspección estática para el comportamiento de prompts, imágenes, MCP o reanudación de sesiones.

## Lista de verificación

<Check>`package.json` tiene `openclaw.extensions` y entradas de runtime compiladas para paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos debe ver el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo id de backend que el manifiesto</Check>
<Check>Las sobrescrituras de usuario en `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>La configuración de sesión, prompt del sistema, imagen y analizador de salida coincide con el contrato real de la CLI</Check>
<Check>Las pruebas dirigidas y al menos una prueba smoke de CLI en vivo demuestran la ruta del backend</Check>

## Relacionado

- [Backends CLI](/es/gateway/cli-backends) - configuración de usuario y comportamiento de runtime
- [Crear plugins](/es/plugins/building-plugins) - conceptos básicos de paquete y manifiesto
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto de Plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés de agente](/es/plugins/sdk-agent-harness) - runtimes completos de agentes externos
