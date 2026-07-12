---
read_when:
    - Estás creando un plugin de backend de CLI de IA local
    - Quieres registrar un backend para referencias de modelos como acme-cli/model
    - Debe asignar una CLI de terceros al ejecutor alternativo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend local de CLI de IA
title: Creación de plugins de backend para la CLI
x-i18n:
    generated_at: "2026-07-12T14:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw invoque una CLI de IA local como backend de inferencia
de texto. El backend aparece como prefijo de proveedor en las referencias de modelo:

```text
acme-cli/acme-large
```

Use un backend de CLI cuando la integración ascendente ya esté disponible como comando
local, cuando la CLI gestione el estado de inicio de sesión local o como alternativa cuando los
proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente ofrece una API HTTP de modelos convencional, escriba en su lugar un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins). Si el entorno de ejecución ascendente
  gestiona sesiones completas del agente, eventos de herramientas, Compaction o el estado de tareas
  en segundo plano, use un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Responsabilidades del plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato             | Archivo                | Finalidad                                                        |
| -------------------- | ---------------------- | ---------------------------------------------------------------- |
| Entrada del paquete  | `package.json`         | Indica a OpenClaw el módulo de ejecución del plugin              |
| Propiedad del manifiesto | `openclaw.plugin.json` | Declara el identificador del backend antes de cargar la ejecución |
| Registro en tiempo de ejecución | `index.ts`             | Invoca `api.registerCliBackend(...)` con los valores predeterminados del comando |

El manifiesto contiene metadatos de descubrimiento: no ejecuta la CLI ni registra
el comportamiento en tiempo de ejecución. Este comportamiento comienza cuando la entrada del plugin invoca
`api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Crear los metadatos del paquete">
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

    Los paquetes publicados deben incluir archivos JavaScript compilados para la ejecución. Si la entrada
    del código fuente es `./src/index.ts`, añada `openclaw.runtimeExtensions` apuntando al archivo
    JavaScript compilado correspondiente. Consulte [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedad en tiempo de ejecución; permite que OpenClaw cargue automáticamente el
    plugin cuando la configuración o la selección del modelo mencione `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Añádala cuando
    el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend
    sin cargar la ejecución del plugin. Use `requiresRuntime: false` solo cuando
    esos descriptores estáticos sean suficientes para la configuración.

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

    El identificador del backend debe coincidir con la entrada `cliBackends` del manifiesto. La
    `config` registrada es solo el valor predeterminado; la configuración del usuario en
    `agents.defaults.cliBackends.acme-cli` se combina sobre ella en tiempo de ejecución.

  </Step>
</Steps>

## Estructura de configuración

`CliBackendConfig` describe cómo debe OpenClaw iniciar y analizar la CLI:

| Campo                                                     | Uso                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `command`                                                 | Nombre del binario o ruta absoluta del comando                                                             |
| `args`                                                    | Argumentos base para ejecuciones nuevas                                                                    |
| `resumeArgs`                                              | Argumentos alternativos para sesiones reanudadas; admite `{sessionId}`                                     |
| `output` / `resumeOutput`                                 | Analizador: `json`, `jsonl` o `text`                                                                       |
| `jsonlDialect`                                            | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`                                     |
| `liveSession`                                             | Modo de proceso de CLI de larga duración (`claude-stdio`)                                                  |
| `input`                                                   | Transporte de la instrucción: `arg` o `stdin`                                                              |
| `maxPromptArgChars`                                       | Longitud máxima de la instrucción en el modo `arg` antes de recurrir a la entrada estándar                 |
| `env` / `clearEnv`                                        | Variables de entorno adicionales que se insertan o nombres que se eliminan antes del inicio                |
| `modelArg`                                                | Indicador utilizado antes del identificador del modelo                                                     |
| `modelAliases`                                            | Asigna identificadores de modelos de OpenClaw a identificadores nativos de la CLI                          |
| `sessionArg` / `sessionArgs`                              | Cómo pasar un identificador de sesión                                                                      |
| `sessionMode`                                             | `always`, `existing` o `none`                                                                              |
| `sessionIdFields`                                         | Campos JSON que OpenClaw lee de la salida de la CLI                                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte de la instrucción del sistema                                                                   |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de sobrescritura de configuración para un archivo de instrucciones del sistema (por ejemplo, `-c`) |
| `systemPromptMode`                                        | `append` o `replace`                                                                                       |
| `systemPromptWhen`                                        | `first`, `always` o `never`                                                                                |
| `imageArg` / `imageMode`                                  | Indicador de ruta de imagen y cómo pasar varias imágenes (`repeat` o `list`)                               |
| `imagePathScope`                                          | Dónde residen los archivos de imagen preparados antes de la transferencia: `temp` o `workspace`           |
| `serialize`                                               | Mantiene ordenadas las ejecuciones del mismo backend                                                       |
| `reseedFromRawTranscriptWhenUncompacted`                  | Habilita la reinicialización limitada desde la transcripción sin procesar antes de Compaction para restablecer sesiones de forma segura |
| `reliability.outputLimits`                                | Máximo de caracteres/líneas JSONL sin procesar conservados para un turno de CLI en vivo (backends de sesión en vivo) |
| `reliability.watchdog`                                    | Ajuste del tiempo de espera sin salida, independiente para ejecuciones nuevas y reanudadas                 |

Prefiera la configuración estática más pequeña que se ajuste a la CLI. Añada devoluciones de llamada del plugin
solo para el comportamiento que realmente corresponda al backend.

## Enlaces avanzados del backend

`CliBackendPlugin` también puede definir:

| Enlace                             | Uso                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescribe la configuración heredada del usuario después de combinarla                    |
| `resolveExecutionArgs(ctx)`        | Añade indicadores específicos de la solicitud, como el esfuerzo de razonamiento o el aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación o configuración antes del inicio                 |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final de la instrucción del sistema específica de la CLI       |
| `textTransforms`                   | Sustituciones bidireccionales de instrucciones/salida                                     |
| `defaultAuthProfileId`             | Da preferencia a un perfil de autenticación específico de OpenClaw                        |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan las sesiones de CLI almacenadas        |
| `nativeToolMode`                   | Declara si las herramientas nativas están ausentes, siempre activas o pueden seleccionarse desde el host |
| `sideQuestionToolMode`             | Declara las herramientas nativas deshabilitadas para preguntas secundarias de `/btw`      |
| `bundleMcp` / `bundleMcpMode`      | Habilita el puente de herramientas MCP de bucle invertido de OpenClaw                     |
| `ownsNativeCompaction`             | El backend gestiona su propia Compaction; OpenClaw la delega                              |
| `runtimeArtifact`                  | Vincula un iniciador de scripts a su árbol completo de paquetes incluidos                 |

Mantenga estos enlaces bajo la responsabilidad del proveedor. No añada ramas específicas de la CLI al núcleo cuando
un enlace del backend pueda expresar el comportamiento.

`runtimeArtifact` pertenece al plugin y el usuario no puede sobrescribirlo. Se consulta
solo cuando un turno de inferencia en vivo emite o revalida una autorización de configuración verificada;
las ejecuciones normales de la CLI no lo requieren. Un backend sin esta declaración no puede
emitir una autorización verificada de configuración de la CLI. Una declaración `bundled-package-tree` identifica
al propietario exacto de `package.json` y exige que el punto de entrada del paquete sea el
comando. OpenClaw calcula el hash del árbol completo y limitado del paquete instalado, incluidas
las dependencias anidadas, y aplica un cierre seguro ante enlaces simbólicos que redirigen,
iniciadores situados fuera del paquete declarado, declaraciones de dependencias externas
obligatorias, árboles sobredimensionados y scripts desconocidos. Declare esto solo cuando ese
árbol contenga la implementación completa de inferencia; las integraciones opcionales de herramientas
no hacen seguro un grafo de implementación externo.

Si el mismo backend también incluye un ejecutable nativo autocontenido, indique sus
nombres base canónicos en `nativeExecutableNames`. Los demás comandos nativos permanecen
sin verificar incluso cuando un usuario sobrescribe el comando del backend.

`ctx.executionMode` es `"agent"` para los turnos normales y `"side-question"` para
las llamadas efímeras de `/btw`. Úselo cuando la CLI necesite indicadores de ejecución única diferentes,
como deshabilitar las herramientas nativas, la persistencia de sesión o el comportamiento de reanudación para
BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"` pero sus
argumentos de pregunta secundaria deshabilitan esas herramientas de forma fiable, establezca también
`sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw aplica un cierre seguro cuando BTW
requiere una ejecución de la CLI sin herramientas.

Establezca `nativeToolMode: "selectable"` solo cuando `resolveExecutionArgs` pueda deshabilitar
todas las herramientas nativas del backend para una ejecución individual. Para esas ejecuciones restringidas,
`ctx.toolAvailability.native` es una tupla vacía y
`ctx.toolAvailability.mcp` es la lista de permitidos de MCP exacta y aislada por el host. El hook
debe sustituir los indicadores de herramientas en conflicto y devolver argumentos que apliquen ambos valores;
OpenClaw lo llama una vez con los argumentos finales de inicio nuevo o reanudación y aplica un cierre seguro cuando
el backend no puede imponer la restricción. En este contexto, los nombres de MCP se pueden
aprobar automáticamente de forma segura solo porque el host ya ha limitado la configuración
de MCP generada a esos servidores y herramientas.

### `ownsNativeCompaction`: excluirse de la Compaction de OpenClaw

Si el backend ejecuta un agente que compacta su **propia** transcripción, establezca
`ownsNativeCompaction: true` para que el resumidor de protección de OpenClaw nunca se ejecute
en sus sesiones: el ciclo de vida de Compaction de la CLI no realiza ninguna operación y el
turno continúa. `claude-cli` lo declara porque Claude Code realiza la compactación
internamente sin un endpoint del arnés. En su lugar, las sesiones de arnés nativo, como Codex,
siguen dirigiéndose a su endpoint de Compaction del arnés.

**Declárelo únicamente cuando se cumplan todas las condiciones siguientes**; de lo contrario, una sesión
aplazada que supere el presupuesto puede seguir superándolo o quedar obsoleta (OpenClaw ya no
la rescata):

- el backend compacta o limita de forma fiable su propia transcripción a medida que se acerca a su
  ventana;
- conserva una sesión reanudable para que el estado compactado persista entre turnos
  (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de Compaction de arnés nativo; las sesiones que coinciden con `agentHarnessId`
  se dirigen al endpoint del arnés en su lugar.

## Puente de herramientas MCP

Los backends de CLI no reciben herramientas de OpenClaw de forma predeterminada. Si la CLI puede consumir
una configuración de MCP, habilítela explícitamente:

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

| Modo                     | Uso                                                               |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLI que aceptan un archivo de configuración de MCP                |
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración en los argumentos |
| `gemini-system-settings` | CLI que leen la configuración de MCP desde el directorio de configuración del sistema |

Habilite el puente únicamente cuando la CLI pueda consumirlo realmente. Si la CLI tiene
su propia capa de herramientas integrada que no se puede deshabilitar, establezca `nativeToolMode:
"always-on"` para que OpenClaw pueda aplicar un cierre seguro cuando un llamador requiera que no haya herramientas
nativas. Si puede deshabilitar todas las herramientas nativas en cada ejecución, use `"selectable"` con el
contrato de `resolveExecutionArgs` anterior.

## Configuración del usuario

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documente la sobrescritura mínima que probablemente necesitarán los usuarios; normalmente, solo
`command` cuando el binario se encuentre fuera de `PATH`.

## Verificación

Para los plugins incluidos, añada una prueba específica para el constructor y el registro
de configuración y, a continuación, ejecute el conjunto de pruebas específico del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifique el descubrimiento y una ejecución real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "responde exactamente: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, añada una prueba de humo en vivo que demuestre esas
rutas con la CLI real. No confíe en la inspección estática para comprobar el comportamiento del prompt, las imágenes,
MCP o la reanudación de sesiones.

## Lista de comprobación

<Check>`package.json` tiene `openclaw.extensions` y entradas de entorno de ejecución compiladas para los paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y un valor deliberado de `activation.onStartup`</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos deben detectar el backend antes de activarlo</Check>
<Check>`api.registerCliBackend(...)` utiliza el mismo id de backend que el manifiesto</Check>
<Check>Las sobrescrituras del usuario en `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>La sesión, el prompt del sistema, las imágenes y la configuración del analizador de salida coinciden con el contrato real de la CLI</Check>
<Check>Las pruebas específicas y al menos una prueba de humo de la CLI en vivo demuestran la ruta del backend</Check>

## Temas relacionados

- [Backends de CLI](/es/gateway/cli-backends) - configuración del usuario y comportamiento del entorno de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - conceptos básicos de paquetes y manifiestos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto del plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés del agente](/es/plugins/sdk-agent-harness) - entornos de ejecución completos para agentes externos
