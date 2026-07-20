---
read_when:
    - Está creando un plugin de backend local para una CLI de IA
    - Se desea registrar un backend para referencias de modelos como acme-cli/model
    - Necesita integrar una CLI de terceros en el ejecutor de respaldo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend local de CLI de IA
title: Creación de plugins de backend para la CLI
x-i18n:
    generated_at: "2026-07-20T00:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw invoque una CLI de IA local como backend de inferencia de texto. El backend aparece como prefijo de proveedor en las referencias de modelos:

```text
acme-cli/acme-large
```

Se debe usar un backend de CLI cuando la integración ascendente ya esté disponible como comando local, cuando la CLI gestione el estado de inicio de sesión local o como alternativa cuando los proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente ofrece una API de modelos HTTP normal, se debe crear en su lugar un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins). Si el entorno de ejecución ascendente
  gestiona sesiones completas de agentes, eventos de herramientas, Compaction o el estado de
  tareas en segundo plano, se debe usar un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Responsabilidades del plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato               | Archivo                | Propósito                                                       |
| ---------------------- | ---------------------- | --------------------------------------------------------------- |
| Entrada del paquete    | `package.json`     | Indica a OpenClaw el módulo de entorno de ejecución del plugin  |
| Propiedad del manifiesto | `openclaw.plugin.json`   | Declara el id del backend antes de cargar el entorno de ejecución |
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

    Los paquetes publicados deben incluir archivos de JavaScript compilados para el entorno de ejecución. Si la entrada del código fuente es `./src/index.ts`, se debe añadir `openclaw.runtimeExtensions` que apunte al archivo JavaScript compilado correspondiente. Consulte [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedad del entorno de ejecución; permite que OpenClaw cargue automáticamente el plugin cuando la configuración o la selección de modelos menciona `acme-cli/...`.

    `setup.cliBackends` es la superficie de configuración basada primero en descriptores. Se debe añadir cuando el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend sin cargar el entorno de ejecución del plugin. Se debe usar `requiresRuntime: false` solo cuando esos descriptores estáticos sean suficientes para la configuración.

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

    El id del backend debe coincidir con la entrada `cliBackends` del manifiesto. El valor `config` registrado es solo el predeterminado; la configuración del usuario en `agents.defaults.cliBackends.acme-cli` se combina con él en tiempo de ejecución.

  </Step>
</Steps>

## Forma de la configuración

`CliBackendConfig` describe cómo debe OpenClaw iniciar y analizar la CLI:

| Campo                                                     | Uso                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                       | Nombre del binario o ruta absoluta del comando                                    |
| `args`                                       | Argumentos base para ejecuciones nuevas                                           |
| `resumeArgs`                                       | Argumentos alternativos para sesiones reanudadas; admite `{sessionId}`       |
| `output` / `resumeOutput`                  | Analizador: `json`, `jsonl` o `text`           |
| `jsonlDialect`                                       | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`                |
| `liveSession`                                       | Modo de proceso de CLI de larga duración (`claude-stdio`)                     |
| `input`                                       | Transporte del prompt: `arg` o `stdin`                    |
| `maxPromptArgChars`                                       | Longitud máxima del prompt para el modo `arg` antes de usar la entrada estándar como alternativa |
| `env` / `clearEnv`                  | Variables de entorno adicionales que se insertarán o nombres que se eliminarán antes del inicio |
| `modelArg`                                       | Indicador utilizado antes del id del modelo                                       |
| `modelAliases`                                       | Asigna los id de modelos de OpenClaw a los id nativos de la CLI                   |
| `sessionArg` / `sessionArgs`                  | Cómo pasar un id de sesión                                                        |
| `sessionMode`                                       | `always`, `existing` o `none`                       |
| `sessionIdFields`                                       | Campos JSON que OpenClaw lee de la salida de la CLI                               |
| `systemPromptArg` / `systemPromptFileArg`                  | Transporte del prompt del sistema                                                 |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey`                  | Transporte de anulación de configuración para un archivo de prompt del sistema (por ejemplo, `-c`) |
| `systemPromptMode`                                       | `append` o `replace`                                           |
| `systemPromptWhen`                                       | `first`, `always` o `never`                       |
| `imageArg` / `imageMode`                  | Indicador de ruta de imagen y forma de pasar varias imágenes (`repeat` o `list`) |
| `imagePathScope`                                       | Ubicación de los archivos de imagen preparados antes de la entrega: `temp` o `workspace` |
| `serialize`                                       | Mantiene ordenadas las ejecuciones del mismo backend                              |
| `reseedFromRawTranscriptWhenUncompacted`                                       | Habilita de forma explícita una reinicialización acotada mediante la transcripción sin procesar antes de Compaction para restablecer sesiones de forma segura |
| `reliability.watchdog`                                       | Ajuste del tiempo de espera sin salida, independiente para ejecuciones nuevas y reanudadas |

Se debe preferir la configuración estática mínima que coincida con la CLI. Se deben añadir devoluciones de llamada del plugin solo para comportamientos que realmente pertenezcan al backend.

## Hooks avanzados del backend

`CliBackendPlugin` también puede definir:

| Hook                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)`                 | Reescribe la configuración heredada del usuario después de combinarla       |
| `resolveExecutionArgs(ctx)`                 | Añade indicadores específicos de la solicitud, como el esfuerzo de razonamiento o el aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`                 | Crea puentes temporales de autenticación, configuración o entorno antes del inicio |
| `transformSystemPrompt(ctx)`                 | Aplica una transformación final del prompt del sistema específica de la CLI |
| `textTransforms`                 | Sustituciones bidireccionales de prompts y salidas                           |
| `defaultAuthProfileId`                 | Da preferencia a un perfil de autenticación específico de OpenClaw          |
| `authEpochMode`                 | Decide cómo los cambios de autenticación invalidan las sesiones de CLI almacenadas |
| `nativeToolMode`                 | Declara si las herramientas nativas están ausentes, siempre activadas o son seleccionables por el host |
| `sideQuestionToolMode`                 | Declara las herramientas nativas desactivadas para las preguntas secundarias de `/btw` |
| `bundleMcp` / `bundleMcpMode` | Habilita de forma explícita el puente de herramientas MCP de bucle invertido de OpenClaw |
| `ownsNativeCompaction`                 | El backend gestiona su propia Compaction; OpenClaw la delega                 |
| `subscriptionAuthDispatch`                 | Las ejecuciones integradas habilitadas explícitamente con credenciales de suscripción se ejecutan mediante este backend |
| `runtimeArtifact`                 | Limita un iniciador de scripts al árbol completo de su paquete incluido      |

Estos hooks deben permanecer bajo la responsabilidad del proveedor. No se deben añadir ramas específicas de la CLI al núcleo cuando un hook del backend pueda expresar el comportamiento.

`prepareExecution(ctx)` recibe `ctx.contextTokenBudget`, el límite efectivo de tokens seleccionado para la ejecución. Los backends que gestionen la Compaction nativa pueden asignar ese presupuesto a su contrato de inicio específico de la CLI.

`runtimeArtifact` pertenece al plugin y el usuario no puede sobrescribirlo. Se consulta
solo cuando un turno de inferencia activo acuña o revalida una autoridad de configuración verificada;
las ejecuciones normales de la CLI no lo requieren. Un backend sin esta declaración no puede
acuñar una autoridad de configuración verificada de la CLI. Una declaración `bundled-package-tree` nombra
al propietario exacto de `package.json` y exige que el punto de entrada del paquete sea el
comando. OpenClaw calcula el hash del árbol completo y acotado del paquete instalado, incluidas
las dependencias anidadas, y adopta una política de cierre seguro ante enlaces simbólicos que redirigen,
lanzadores externos al paquete declarado, declaraciones de dependencias externas
obligatorias, árboles sobredimensionados y scripts desconocidos. Declárelo solo cuando ese
árbol contenga la implementación de inferencia completa; las integraciones opcionales de herramientas
no hacen que un grafo de implementación externo sea seguro.

Si el mismo backend también incluye un ejecutable nativo autocontenido, enumere sus
nombres base canónicos en `nativeExecutableNames`. Los demás comandos nativos permanecen
sin verificar incluso cuando un usuario sobrescribe el comando del backend.

`ctx.executionMode` es `"agent"` para los turnos normales y `"side-question"` para
las llamadas efímeras `/btw`. Úselo cuando la CLI necesite indicadores distintos para una sola ejecución,
como deshabilitar las herramientas nativas, la persistencia de sesiones o el comportamiento de reanudación para
BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"` pero sus
argumentos argv para preguntas secundarias deshabilitan esas herramientas de forma fiable, establezca también
`sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw adopta una política de cierre seguro cuando BTW
requiere una ejecución de la CLI sin herramientas.

Establezca `nativeToolMode: "selectable"` solo cuando `resolveExecutionArgs` pueda deshabilitar
todas las herramientas nativas del backend para una ejecución individual. Para esas ejecuciones restringidas,
`ctx.toolAvailability.native` es una tupla vacía y
`ctx.toolAvailability.mcp` es la lista de permitidos de MCP exacta y aislada por el host. El hook
debe sustituir los indicadores de herramientas en conflicto y devolver argumentos argv que apliquen ambos valores;
OpenClaw lo llama una vez con los argumentos argv finales, ya sean nuevos o de reanudación, y adopta una política de cierre seguro cuando
el backend no puede aplicar la restricción. En este contexto, es seguro aprobar automáticamente los nombres de MCP
solo porque el host ya ha limitado la configuración de MCP generada
a esos servidores y herramientas.

### `ownsNativeCompaction`: excluirse de la Compaction de OpenClaw

Si el backend ejecuta un agente que compacta su **propia** transcripción, establezca
`ownsNativeCompaction: true` para que el resumidor de protección de OpenClaw nunca se ejecute
sobre sus sesiones: el ciclo de vida de Compaction de la CLI no realiza ninguna operación y el
turno continúa. `claude-cli` lo declara porque Claude Code compacta
internamente sin un endpoint del arnés. En cambio, las sesiones con arnés nativo, como Codex,
siguen dirigiéndose a su endpoint de Compaction del arnés.

**Declárelo solo cuando se cumpla todo lo siguiente**; de lo contrario, una sesión aplazada
que supere el presupuesto puede seguir superándolo o quedar obsoleta (OpenClaw deja de
rescatarla):

- el backend compacta o limita de forma fiable su propia transcripción cuando se aproxima a su
  ventana;
- mantiene una sesión reanudable para que el estado compactado persista entre turnos
  (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de Compaction con arnés nativo: las sesiones que coinciden con `agentHarnessId`
  se dirigen en cambio al endpoint del arnés.

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

| Modo                     | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI que aceptan un archivo de configuración de MCP                              |
| `codex-config-overrides` | CLI que aceptan sobrescrituras de configuración en los argumentos argv                        |
| `gemini-system-settings` | CLI que leen la configuración de MCP desde su directorio de configuración del sistema |

Habilite el puente solo cuando la CLI pueda consumirlo realmente. Si la CLI tiene
su propia capa de herramientas integrada que no puede deshabilitarse, establezca `nativeToolMode:
"always-on"` para que OpenClaw pueda adoptar una política de cierre seguro cuando un llamador exija que no haya herramientas
nativas. Si puede deshabilitar todas las herramientas nativas en cada ejecución, use `"selectable"` con el
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
`command` cuando el binario está fuera de `PATH`.

## Verificación

Para los plugins incluidos, añada una prueba específica del constructor y del registro
de configuración y, después, ejecute el conjunto de pruebas específico del plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locales o instalados, verifique el descubrimiento y una ejecución real del modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "responde exactamente: backend correcto" --model acme-cli/acme-large
```

Si el backend admite imágenes o MCP, añada una prueba de humo en vivo que demuestre esas
rutas con la CLI real. No se base en una inspección estática para comprobar el comportamiento del prompt, las imágenes,
MCP o la reanudación de sesiones.

## Lista de comprobación

<Check>`package.json` tiene `openclaw.extensions` y entradas de entorno de ejecución compiladas para los paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos deben detectar el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo identificador de backend que el manifiesto</Check>
<Check>Las sobrescrituras del usuario en `agents.defaults.cliBackends.<id>` siguen teniendo prioridad</Check>
<Check>La configuración de sesión, prompt del sistema, imágenes y analizador de salida coincide con el contrato real de la CLI</Check>
<Check>Las pruebas específicas y al menos una prueba de humo en vivo de la CLI demuestran la ruta del backend</Check>

## Relacionado

- [Backends de CLI](/es/gateway/cli-backends) - configuración del usuario y comportamiento del entorno de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - fundamentos de paquetes y manifiestos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto del plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés del agente](/es/plugins/sdk-agent-harness) - entornos de ejecución completos para agentes externos
