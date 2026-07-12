---
read_when:
    - Estás creando un plugin de backend local de CLI de IA
    - Quieres registrar un backend para referencias de modelos como acme-cli/model
    - Necesitas integrar una CLI de terceros en el ejecutor alternativo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend local de CLI de IA
title: Creación de plugins de backend para la CLI
x-i18n:
    generated_at: "2026-07-11T23:15:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw invoque una CLI de IA local como backend de inferencia de texto. El backend aparece como prefijo de proveedor en las referencias de modelo:

```text
acme-cli/acme-large
```

Use un backend de CLI cuando la integración ascendente ya esté disponible como comando local, cuando la CLI gestione el estado de inicio de sesión local o como alternativa cuando los proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente expone una API de modelos HTTP convencional, cree en su lugar un
  [Plugin de proveedor](/es/plugins/sdk-provider-plugins). Si el entorno de ejecución ascendente
  gestiona sesiones completas del agente, eventos de herramientas, Compaction o el estado de
  tareas en segundo plano, use un [entorno de agente](/es/plugins/sdk-agent-harness).
</Info>

## Qué gestiona el Plugin

Un Plugin de backend de CLI tiene tres contratos:

| Contrato             | Archivo                | Propósito                                                        |
| -------------------- | ---------------------- | ---------------------------------------------------------------- |
| Entrada del paquete  | `package.json`         | Indica a OpenClaw el módulo de entorno de ejecución del Plugin   |
| Propiedad del manifiesto | `openclaw.plugin.json` | Declara el identificador del backend antes de cargar el entorno de ejecución |
| Registro en tiempo de ejecución | `index.ts` | Invoca `api.registerCliBackend(...)` con los valores predeterminados del comando |

El manifiesto contiene metadatos de detección: no ejecuta la CLI ni registra el comportamiento en tiempo de ejecución. El comportamiento en tiempo de ejecución comienza cuando la entrada del Plugin invoca `api.registerCliBackend(...)`.

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

    Los paquetes publicados deben incluir archivos JavaScript compilados del entorno de ejecución. Si la entrada del código fuente es `./src/index.ts`, añada `openclaw.runtimeExtensions` con una referencia al archivo JavaScript compilado correspondiente. Consulte [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedad en tiempo de ejecución; permite que OpenClaw cargue automáticamente el Plugin cuando la configuración o la selección de modelo mencione `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Añádala cuando la detección de modelos, la incorporación o el estado deban reconocer el backend sin cargar el entorno de ejecución del Plugin. Use `requiresRuntime: false` únicamente cuando esos descriptores estáticos sean suficientes para la configuración.

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

    El identificador del backend debe coincidir con la entrada `cliBackends` del manifiesto. La `config` registrada es solo el valor predeterminado; la configuración del usuario en `agents.defaults.cliBackends.acme-cli` se combina con ella en tiempo de ejecución y tiene precedencia.

  </Step>
</Steps>

## Estructura de configuración

`CliBackendConfig` describe cómo debe iniciar OpenClaw la CLI y analizar su salida:

| Campo                                                     | Uso                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Nombre del binario o ruta absoluta del comando                                    |
| `args`                                                    | Argumentos base para ejecuciones nuevas                                           |
| `resumeArgs`                                              | Argumentos alternativos para sesiones reanudadas; admite `{sessionId}`            |
| `output` / `resumeOutput`                                 | Analizador: `json`, `jsonl` o `text`                                              |
| `jsonlDialect`                                            | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`            |
| `liveSession`                                             | Modo de proceso de CLI de larga duración (`claude-stdio`)                         |
| `input`                                                   | Transporte de la instrucción: `arg` o `stdin`                                     |
| `maxPromptArgChars`                                       | Longitud máxima de la instrucción en modo `arg` antes de recurrir a la entrada estándar |
| `env` / `clearEnv`                                        | Variables de entorno adicionales que se insertarán o nombres que se eliminarán antes del inicio |
| `modelArg`                                                | Indicador usado antes del identificador del modelo                                |
| `modelAliases`                                            | Asigna identificadores de modelos de OpenClaw a identificadores nativos de la CLI |
| `sessionArg` / `sessionArgs`                              | Cómo pasar un identificador de sesión                                             |
| `sessionMode`                                             | `always`, `existing` o `none`                                                     |
| `sessionIdFields`                                         | Campos JSON que OpenClaw lee de la salida de la CLI                               |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte de la instrucción del sistema                                          |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de sobrescritura de configuración para un archivo de instrucción del sistema (por ejemplo, `-c`) |
| `systemPromptMode`                                        | `append` o `replace`                                                              |
| `systemPromptWhen`                                        | `first`, `always` o `never`                                                       |
| `imageArg` / `imageMode`                                  | Indicador de ruta de imagen y cómo pasar varias imágenes (`repeat` o `list`)      |
| `imagePathScope`                                          | Ubicación de los archivos de imagen preparados antes de la transferencia: `temp` o `workspace` |
| `serialize`                                               | Mantiene ordenadas las ejecuciones del mismo backend                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | Habilita una reinicialización acotada desde la transcripción sin procesar antes de Compaction para restablecer sesiones de forma segura |
| `reliability.outputLimits`                                | Máximo de caracteres o líneas JSONL sin procesar que se conservan para un turno activo de la CLI (backends de sesión activa) |
| `reliability.watchdog`                                    | Ajuste del tiempo de espera sin salida, separado para ejecuciones nuevas y reanudadas |

Prefiera la configuración estática más pequeña que se ajuste a la CLI. Añada funciones de retorno del Plugin únicamente para comportamientos que realmente pertenezcan al backend.

## Enlaces avanzados del backend

`CliBackendPlugin` también puede definir:

| Enlace                             | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescribe la configuración antigua del usuario después de combinarla       |
| `resolveExecutionArgs(ctx)`        | Añade indicadores específicos de la solicitud, como el esfuerzo de razonamiento o el aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación o configuración antes del inicio   |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final de la instrucción del sistema específica de la CLI |
| `textTransforms`                   | Sustituciones bidireccionales de instrucciones y salidas                    |
| `defaultAuthProfileId`             | Prefiere un perfil de autenticación específico de OpenClaw                  |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan las sesiones de CLI almacenadas |
| `nativeToolMode`                   | Declara si las herramientas nativas están ausentes, siempre activas o pueden ser seleccionadas por el host |
| `sideQuestionToolMode`             | Declara herramientas nativas deshabilitadas para preguntas secundarias de `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Habilita el puente local loopback de herramientas MCP de OpenClaw           |
| `ownsNativeCompaction`             | El backend gestiona su propia Compaction; OpenClaw la delega                |
| `runtimeArtifact`                  | Vincula un iniciador de scripts con el árbol completo de su paquete incluido |

Mantenga estos enlaces bajo la responsabilidad del proveedor. No añada ramas específicas de la CLI al núcleo cuando un enlace del backend pueda expresar el comportamiento.

`runtimeArtifact` pertenece al Plugin y el usuario no puede sobrescribirlo. Solo se consulta cuando un turno activo de inferencia emite o revalida una autorización de configuración verificada; las ejecuciones normales de la CLI no lo requieren. Un backend sin esta declaración no puede emitir una autorización de configuración verificada de la CLI. Una declaración `bundled-package-tree` identifica al propietario exacto de `package.json` y exige que el punto de entrada del paquete sea el comando. OpenClaw calcula el hash del árbol completo y acotado del paquete instalado, incluidas las dependencias anidadas, y adopta una política de cierre seguro ante enlaces simbólicos que redirijan, iniciadores situados fuera del paquete declarado, declaraciones de dependencias externas obligatorias, árboles demasiado grandes y scripts desconocidos. Declárelo únicamente cuando ese árbol contenga la implementación completa de inferencia; las integraciones opcionales de herramientas no hacen que un grafo de implementación externo sea seguro.

Si el mismo backend también incluye un ejecutable nativo autónomo, enumere sus nombres base canónicos en `nativeExecutableNames`. Los demás comandos nativos permanecen sin verificar incluso cuando un usuario sobrescribe el comando del backend.

`ctx.executionMode` es `"agent"` para turnos normales y `"side-question"` para
llamadas efímeras de `/btw`. Úsalo cuando la CLI necesite indicadores de una
sola ejecución diferentes, como deshabilitar herramientas nativas, la
persistencia de sesión o el comportamiento de reanudación para BTW. Si un
backend normalmente tiene `nativeToolMode: "always-on"`, pero su argv de
pregunta secundaria deshabilita esas herramientas de forma fiable, establece
también `sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw adopta
una postura de denegación segura cuando BTW requiere una ejecución de la CLI
sin herramientas.

Establece `nativeToolMode: "selectable"` solo cuando `resolveExecutionArgs`
pueda deshabilitar todas las herramientas nativas del backend para una
ejecución individual. Para esas ejecuciones restringidas,
`ctx.toolAvailability.native` es una tupla vacía y
`ctx.toolAvailability.mcp` es la lista de permitidos de MCP exacta y aislada
por el host. El hook debe reemplazar los indicadores de herramientas que
entren en conflicto y devolver un argv que aplique ambos valores; OpenClaw lo
llama una vez con el argv final de inicio nuevo o reanudación y adopta una
postura de denegación segura cuando el backend no puede aplicar la
restricción. En este contexto, es seguro aprobar automáticamente los nombres
de MCP solo porque el host ya ha limitado la configuración de MCP generada a
esos servidores y herramientas.

### `ownsNativeCompaction`: excluirse de la Compaction de OpenClaw

Si tu backend ejecuta un agente que compacta su **propia** transcripción,
establece `ownsNativeCompaction: true` para que el resumidor de protección de
OpenClaw nunca se ejecute sobre sus sesiones: el ciclo de vida de Compaction
de la CLI no realiza ninguna operación y el turno continúa. `claude-cli` lo
declara porque Claude Code realiza la compactación internamente sin un endpoint
del arnés. En cambio, las sesiones con arnés nativo, como Codex, siguen
dirigiéndose a su endpoint de Compaction del arnés.

**Decláralo únicamente cuando se cumplan todas las condiciones siguientes**;
de lo contrario, una sesión aplazada que exceda el presupuesto puede seguir
excediéndolo o quedar obsoleta (OpenClaw ya no la rescata):

- el backend compacta o limita de forma fiable su propia transcripción a medida
  que se acerca al límite de su ventana;
- conserva una sesión reanudable para que el estado compactado sobreviva entre
  turnos (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de Compaction con arnés nativo; las sesiones que coinciden
  con `agentHarnessId` se dirigen en su lugar al endpoint del arnés.

## Puente de herramientas MCP

Los backends de CLI no reciben herramientas de OpenClaw de forma
predeterminada. Si la CLI puede consumir una configuración de MCP, habilítalo
explícitamente:

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
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración mediante argv     |
| `gemini-system-settings` | CLI que leen la configuración de MCP desde su directorio de ajustes del sistema |

Habilita el puente únicamente cuando la CLI pueda consumirlo realmente. Si la
CLI tiene su propia capa de herramientas integrada que no se puede
deshabilitar, establece `nativeToolMode: "always-on"` para que OpenClaw pueda
adoptar una postura de denegación segura cuando un llamador requiera que no
haya herramientas nativas. Si puede deshabilitar todas las herramientas
nativas en cada ejecución, usa `"selectable"` con el contrato de
`resolveExecutionArgs` descrito anteriormente.

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documenta la sobrescritura mínima que probablemente necesitarán los usuarios;
por lo general, solo `command` cuando el binario está fuera de `PATH`.

## Verificación

Para los plugins incluidos, añade una prueba específica del constructor y del
registro de configuración y, después, ejecuta la vía de pruebas específica del
plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifica el descubrimiento y una ejecución
real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, añade una prueba de humo en vivo que
demuestre esas rutas con la CLI real. No dependas de una inspección estática
para verificar el comportamiento de las instrucciones, las imágenes, MCP o la
reanudación de sesiones.

## Lista de comprobación

<Check>`package.json` contiene `openclaw.extensions` y entradas de entorno de ejecución compiladas para los paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y un valor deliberado de `activation.onStartup`</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos deben detectar el backend antes de iniciarlo</Check>
<Check>`api.registerCliBackend(...)` usa el mismo identificador de backend que el manifiesto</Check>
<Check>Las sobrescrituras del usuario en `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>Los ajustes de sesión, instrucciones del sistema, imágenes y analizador de salida coinciden con el contrato real de la CLI</Check>
<Check>Las pruebas específicas y al menos una prueba de humo en vivo de la CLI demuestran la ruta del backend</Check>

## Temas relacionados

- [Backends de CLI](/es/gateway/cli-backends) - configuración de usuario y comportamiento del entorno de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - fundamentos de los paquetes y manifiestos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto de plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés de agente](/es/plugins/sdk-agent-harness) - entornos de ejecución completos para agentes externos
