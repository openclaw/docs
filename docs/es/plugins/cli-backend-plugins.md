---
read_when:
    - Está creando un Plugin de backend de CLI de IA local
    - Quiere registrar un backend para referencias de modelos como acme-cli/model
    - Necesita integrar una CLI de terceros en el ejecutor alternativo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend local de CLI de IA
title: Creación de plugins de backend para la CLI
x-i18n:
    generated_at: "2026-07-19T02:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5bce682ad5ea64c11e4447f51c0f6cb083a0f6f4b88864792b82d8ef89fa64f
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw invoque una CLI de IA local como backend de inferencia de texto. El backend aparece como un prefijo de proveedor en las referencias de modelos:

```text
acme-cli/acme-large
```

Use un backend de CLI cuando la integración ascendente ya se exponga como un comando local, cuando la CLI gestione el estado de inicio de sesión local o como alternativa cuando los proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente expone una API de modelos HTTP normal, escriba en su lugar un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins). Si el entorno de ejecución ascendente
  gestiona sesiones completas de agentes, eventos de herramientas, Compaction o el estado de
  tareas en segundo plano, use un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Responsabilidades del plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato             | Archivo                | Propósito                                                        |
| -------------------- | ---------------------- | ---------------------------------------------------------------- |
| Entrada del paquete  | `package.json`     | Dirige OpenClaw al módulo de entorno de ejecución del plugin     |
| Propiedad del manifiesto | `openclaw.plugin.json` | Declara el id del backend antes de cargar el entorno de ejecución |
| Registro en tiempo de ejecución | `index.ts` | Invoca `api.registerCliBackend(...)` con los valores predeterminados del comando |

El manifiesto contiene metadatos de descubrimiento: no ejecuta la CLI ni registra el comportamiento en tiempo de ejecución. El comportamiento en tiempo de ejecución comienza cuando la entrada del plugin invoca `api.registerCliBackend(...)`.

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

    Los paquetes publicados deben incluir archivos JavaScript compilados para el entorno de ejecución. Si la entrada de origen es `./src/index.ts`, añada `openclaw.runtimeExtensions` que apunte al archivo JavaScript compilado correspondiente. Consulte [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedad del entorno de ejecución; permite que OpenClaw cargue automáticamente el plugin cuando la configuración o la selección del modelo mencione `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Añádala cuando el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend sin cargar el entorno de ejecución del plugin. Use `requiresRuntime: false` únicamente cuando esos descriptores estáticos sean suficientes para la configuración.

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

    El id del backend debe coincidir con la entrada `cliBackends` del manifiesto. La configuración `config` registrada es solo el valor predeterminado; la configuración del usuario en `agents.defaults.cliBackends.acme-cli` se combina con ella en tiempo de ejecución.

  </Step>
</Steps>

## Forma de la configuración

`CliBackendConfig` describe cómo debe OpenClaw iniciar y analizar la CLI:

| Campo                                                     | Uso                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                        | Nombre del binario o ruta absoluta del comando                                    |
| `args`                                        | Argumentos base para ejecuciones nuevas                                           |
| `resumeArgs`                                        | Argumentos alternativos para sesiones reanudadas; admite `{sessionId}`       |
| `output` / `resumeOutput`                   | Analizador: `json`, `jsonl` o `text`           |
| `jsonlDialect`                                        | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`                |
| `liveSession`                                        | Modo de proceso de CLI de larga duración (`claude-stdio`)                     |
| `input`                                        | Transporte de la indicación: `arg` o `stdin`             |
| `maxPromptArgChars`                                        | Longitud máxima de la indicación para el modo `arg` antes de recurrir a la entrada estándar |
| `env` / `clearEnv`                   | Variables de entorno adicionales que se insertarán o nombres que se eliminarán antes del inicio |
| `modelArg`                                        | Opción utilizada antes del id del modelo                                          |
| `modelAliases`                                        | Asigna los ids de modelo de OpenClaw a ids nativos de la CLI                      |
| `sessionArg` / `sessionArgs`                   | Cómo pasar un id de sesión                                                        |
| `sessionMode`                                        | `always`, `existing` o `none`                       |
| `sessionIdFields`                                        | Campos JSON que OpenClaw lee de la salida de la CLI                               |
| `systemPromptArg` / `systemPromptFileArg`                   | Transporte de la indicación del sistema                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey`                   | Transporte de reemplazo de configuración para un archivo de indicación del sistema (por ejemplo, `-c`) |
| `systemPromptMode`                                        | `append` o `replace`                                           |
| `systemPromptWhen`                                        | `first`, `always` o `never`                       |
| `imageArg` / `imageMode`                   | Opción de ruta de imagen y cómo pasar varias imágenes (`repeat` o `list`) |
| `imagePathScope`                                        | Dónde se almacenan los archivos de imagen preparados antes de la entrega: `temp` o `workspace` |
| `serialize`                                        | Mantiene ordenadas las ejecuciones del mismo backend                              |
| `reseedFromRawTranscriptWhenUncompacted`                                        | Habilita explícitamente la reinicialización acotada mediante la transcripción sin procesar antes de Compaction para restablecer sesiones de forma segura |
| `reliability.outputLimits`                                        | Máximo de caracteres/líneas JSONL sin procesar que se conservan para un turno activo de la CLI (backends de sesiones activas) |
| `reliability.watchdog`                                        | Ajuste del tiempo de espera sin salida, por separado para ejecuciones nuevas y reanudadas |

Prefiera la configuración estática más pequeña que se ajuste a la CLI. Añada devoluciones de llamada del plugin únicamente para el comportamiento que realmente pertenezca al backend.

## Enlaces avanzados del backend

`CliBackendPlugin` también puede definir:

| Enlace                             | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)`                 | Reescribe la configuración de usuario heredada después de combinarla        |
| `resolveExecutionArgs(ctx)`                 | Añade opciones específicas de la solicitud, como el esfuerzo de razonamiento o el aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`                 | Crea puentes temporales de autenticación, configuración o entorno antes del inicio |
| `transformSystemPrompt(ctx)`                 | Aplica una transformación final de la indicación del sistema específica de la CLI |
| `textTransforms`                 | Sustituciones bidireccionales de indicaciones y salidas                      |
| `defaultAuthProfileId`                 | Da preferencia a un perfil de autenticación específico de OpenClaw           |
| `authEpochMode`                 | Decide cómo los cambios de autenticación invalidan las sesiones de CLI almacenadas |
| `nativeToolMode`                 | Declara si las herramientas nativas están ausentes, siempre activas o pueden seleccionarse desde el host |
| `sideQuestionToolMode`                 | Declara las herramientas nativas deshabilitadas para las preguntas secundarias de `/btw` |
| `bundleMcp` / `bundleMcpMode` | Habilita explícitamente el puente de herramientas MCP de bucle invertido de OpenClaw |
| `ownsNativeCompaction`                 | El backend gestiona su propia Compaction; OpenClaw la delega                 |
| `subscriptionAuthDispatch`                 | Las ejecuciones integradas habilitadas explícitamente con credenciales de suscripción se realizan mediante este backend |
| `runtimeArtifact`                 | Vincula un iniciador de scripts a todo el árbol de su paquete incluido       |

Mantenga estos enlaces bajo la responsabilidad del proveedor. No añada ramas específicas de la CLI al núcleo cuando un enlace del backend pueda expresar el comportamiento.

`prepareExecution(ctx)` recibe `ctx.contextTokenBudget`, el límite efectivo de tokens seleccionado para la ejecución. Los backends que gestionan la Compaction nativa pueden asignar ese presupuesto a su contrato de inicio específico de la CLI.

`runtimeArtifact` pertenece al plugin y el usuario no puede sobrescribirlo. Se consulta
solo cuando un turno de inferencia en vivo emite o revalida una autorización de configuración verificada;
las ejecuciones normales de la CLI no lo requieren. Un backend sin esta declaración no puede
emitir una autorización de configuración verificada de la CLI. Una declaración `bundled-package-tree` nombra
al propietario exacto de `package.json` y requiere que el punto de entrada del paquete sea el
comando. OpenClaw calcula el hash del árbol completo y acotado del paquete instalado, incluidas
las dependencias anidadas, y aplica un cierre seguro ante enlaces simbólicos que redirigen,
lanzadores fuera del paquete declarado, declaraciones de dependencias externas
obligatorias, árboles sobredimensionados y scripts desconocidos. Declárelo solo cuando ese
árbol contenga la implementación de inferencia completa; las integraciones opcionales de herramientas
no hacen que un grafo de implementación externo sea seguro.

Si el mismo backend también distribuye un ejecutable nativo autocontenido, enumere sus
nombres base canónicos en `nativeExecutableNames`. Los demás comandos nativos permanecen
sin verificar incluso cuando un usuario sobrescribe el comando del backend.

`ctx.executionMode` es `"agent"` para los turnos normales y `"side-question"` para
las llamadas efímeras `/btw`. Úselo cuando la CLI necesite indicadores de ejecución única diferentes,
como desactivar las herramientas nativas, la persistencia de sesiones o el comportamiento de reanudación para
BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"`, pero sus
argumentos argv para preguntas secundarias desactivan esas herramientas de forma fiable, establezca también
`sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw aplica un cierre seguro cuando BTW
requiere una ejecución de la CLI sin herramientas.

Establezca `nativeToolMode: "selectable"` solo cuando `resolveExecutionArgs` pueda desactivar
todas las herramientas nativas del backend para una ejecución individual. Para esas ejecuciones restringidas,
`ctx.toolAvailability.native` es una tupla vacía y
`ctx.toolAvailability.mcp` es la lista de permitidos MCP exacta y aislada por el host. El hook
debe reemplazar los indicadores de herramientas en conflicto y devolver argumentos argv que apliquen ambos valores;
OpenClaw lo llama una vez con los argumentos argv finales de inicio o reanudación y aplica un cierre seguro cuando
el backend no puede imponer la restricción. Los nombres MCP en este contexto son seguros
para aprobarse automáticamente solo porque el host ya ha limitado la configuración MCP
generada a esos servidores y herramientas.

### `ownsNativeCompaction`: exclusión de la Compaction de OpenClaw

Si el backend ejecuta un agente que compacta su **propia** transcripción, establezca
`ownsNativeCompaction: true` para que el resumidor de protección de OpenClaw nunca se ejecute
sobre sus sesiones: el ciclo de vida de Compaction de la CLI no realiza ninguna operación y el
turno continúa. `claude-cli` lo declara porque Claude Code realiza la Compaction
internamente sin un endpoint del arnés. En cambio, las sesiones de arnés nativo, como Codex,
siguen dirigiéndose a su endpoint de Compaction del arnés.

**Declárelo únicamente cuando se cumplan todas las condiciones siguientes**; de lo contrario, una sesión aplazada
que supere el presupuesto puede continuar por encima del presupuesto o quedar obsoleta (OpenClaw ya no
la rescata):

- el backend compacta o limita de forma fiable su propia transcripción cuando se aproxima a su
  ventana;
- conserva una sesión reanudable para que el estado compactado persista entre turnos
  (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de Compaction de arnés nativo; las sesiones que coincidan con `agentHarnessId`
  se dirigen en su lugar al endpoint del arnés.

## Puente de herramientas MCP

Los backends de CLI no reciben herramientas de OpenClaw de forma predeterminada. Si la CLI puede consumir
una configuración MCP, habilítela explícitamente:

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
| `claude-config-file`     | CLI que aceptan un archivo de configuración MCP                   |
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración en argv           |
| `gemini-system-settings` | CLI que leen la configuración MCP desde su directorio de configuración del sistema |

Habilite el puente solo cuando la CLI pueda consumirlo realmente. Si la CLI tiene
su propia capa integrada de herramientas que no puede desactivarse, establezca `nativeToolMode:
"always-on"` para que OpenClaw pueda aplicar un cierre seguro cuando un invocador requiera que no haya herramientas
nativas. Si puede desactivar todas las herramientas nativas en cada ejecución, use `"selectable"` con el
contrato `resolveExecutionArgs` anterior.

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

Documente la sobrescritura mínima que probablemente necesiten los usuarios, normalmente solo
`command` cuando el binario esté fuera de `PATH`.

## Verificación

Para los plugins incluidos, añada una prueba específica en torno al constructor y al registro
de configuración; después, ejecute el conjunto de pruebas específico del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifique el descubrimiento y una ejecución real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, añada una prueba de humo en vivo que demuestre esas
rutas con la CLI real. No dependa de una inspección estática para el prompt, las imágenes,
MCP ni el comportamiento de reanudación de sesiones.

## Lista de comprobación

<Check>`package.json` tiene `openclaw.extensions` y entradas de tiempo de ejecución compiladas para los paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos debe detectar el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo identificador de backend que el manifiesto</Check>
<Check>Las sobrescrituras del usuario en `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>La configuración de sesión, prompt del sistema, imágenes y analizador de salida coincide con el contrato real de la CLI</Check>
<Check>Las pruebas específicas y al menos una prueba de humo en vivo de la CLI demuestran la ruta del backend</Check>

## Contenido relacionado

- [Backends de CLI](/es/gateway/cli-backends) - configuración del usuario y comportamiento en tiempo de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - fundamentos de paquetes y manifiestos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto del plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés del agente](/es/plugins/sdk-agent-harness) - tiempos de ejecución completos de agentes externos
