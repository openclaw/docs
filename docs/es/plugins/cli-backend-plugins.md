---
read_when:
    - Está creando un Plugin de backend local de IA para la CLI
    - Se desea registrar un backend para referencias de modelos como acme-cli/model
    - Necesita integrar una CLI de terceros en el ejecutor alternativo de texto de OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin que registre un backend de CLI de IA local
title: Creación de plugins de backend para la CLI
x-i18n:
    generated_at: "2026-07-22T10:40:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9bcbfb6c91e6c979715b497082cf3e360bc560a1e5dffe52edab125abe70e76d
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Los plugins de backend de CLI permiten que OpenClaw invoque una CLI de IA local como backend de inferencia de texto. El backend aparece como prefijo de proveedor en las referencias de modelo:

```text
acme-cli/acme-large
```

Use un backend de CLI cuando la integración ascendente ya esté expuesta como un comando local, cuando la CLI administre el estado de inicio de sesión local o como alternativa cuando los proveedores de API no estén disponibles.

<Info>
  Si el servicio ascendente expone una API de modelos HTTP normal, escriba en su lugar un
  [plugin de proveedor](/es/plugins/sdk-provider-plugins). Si el entorno de ejecución ascendente
  administra sesiones completas del agente, eventos de herramientas, Compaction o el estado
  de tareas en segundo plano, use un [arnés de agente](/es/plugins/sdk-agent-harness).
</Info>

## Responsabilidades del plugin

Un plugin de backend de CLI tiene tres contratos:

| Contrato             | Archivo                   | Finalidad                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada del paquete        | `package.json`         | Dirige OpenClaw al módulo de entorno de ejecución del plugin              |
| Propiedad del manifiesto   | `openclaw.plugin.json` | Declara el identificador del backend antes de cargar el entorno de ejecución              |
| Registro en tiempo de ejecución | `index.ts`             | Invoca `api.registerCliBackend(...)` con los valores predeterminados del comando |

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

    Los paquetes publicados deben incluir archivos de entorno de ejecución de JavaScript compilados. Si la entrada del código fuente es `./src/index.ts`, añada `openclaw.runtimeExtensions` que apunte al archivo JavaScript compilado correspondiente. Consulte [Puntos de entrada](/es/plugins/sdk-entrypoints).

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

    `cliBackends` es la lista de propiedades del entorno de ejecución; permite que OpenClaw cargue automáticamente el plugin cuando la selección del modelo o `agentRuntime.id` mencione `acme-cli`.

    `setup.cliBackends` es la superficie de configuración que prioriza los descriptores. Añádala cuando el descubrimiento de modelos, la incorporación o el estado deban reconocer el backend sin cargar el entorno de ejecución del plugin. Use `requiresRuntime: false` solo cuando esos descriptores estáticos sean suficientes para la configuración.

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
          args: ["chat", "--output-format", "stream-json", "--prompt", "{prompt}"],
          resumeArgs: [
            "chat",
            "--resume",
            "{sessionId}",
            "--output-format",
            "stream-json",
            "--prompt",
            "{prompt}",
          ],
          output: "jsonl",
          resumeOutput: "jsonl",
          jsonlDialect: "gemini-stream-json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            large: "acme-large-2026",
            fast: "acme-fast-2026",
          },
          sessionArgs: ["--session", "{sessionId}"],
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          imagePathScope: "workspace",
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

    El identificador del backend debe coincidir con la entrada `cliBackends` del manifiesto. El adaptador registrado constituye el código de plugin autoritativo; la configuración de OpenClaw selecciona el backend, pero no reescribe el contrato de sus comandos.

  </Step>
</Steps>

## Estructura de configuración

`CliBackendConfig` describe cómo debe OpenClaw iniciar y analizar la CLI. El ejemplo completo anterior utiliza deliberadamente los mismos campos de comando, reanudación, JSONL, alias de modelo, sesión, imagen y vigilancia que el adaptador `google-gemini-cli` incluido:

| Campo                                                     | Uso                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Nombre del binario o ruta absoluta del comando                                              |
| `args`                                                    | Argumentos base para ejecuciones nuevas                                                          |
| `resumeArgs`                                              | Argumentos alternativos para sesiones reanudadas; admite `{sessionId}`                       |
| `output` / `resumeOutput`                                 | Analizador: `json`, `jsonl` o `text`                                                |
| `jsonlDialect`                                            | Dialecto de eventos JSONL: `claude-stream-json` o `gemini-stream-json`                 |
| `liveSession`                                             | Modo de proceso de CLI de larga duración (`claude-stdio`)                                      |
| `input`                                                   | Transporte del prompt: `arg` o `stdin`                                                |
| `maxPromptArgChars`                                       | Longitud máxima del prompt para el modo `arg` antes de recurrir a la entrada estándar                     |
| `env` / `clearEnv`                                        | Variables de entorno adicionales que se insertarán o nombres que se eliminarán antes del inicio                         |
| `modelArg`                                                | Indicador utilizado antes del identificador del modelo                                                     |
| `modelAliases`                                            | Asigna los identificadores de modelos de OpenClaw a los identificadores nativos de la CLI                                          |
| `sessionArgs`                                             | Cómo pasar un identificador de sesión mediante `{sessionId}`                                      |
| `sessionMode`                                             | `always`, `existing` o `none`                                                   |
| `sessionIdFields`                                         | Campos JSON que OpenClaw lee de la salida de la CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte del prompt del sistema                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de sustitución de configuración para un archivo de prompt del sistema (por ejemplo, `-c`)             |
| `systemPromptMode`                                        | `append` o `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` o `never`                                                     |
| `imageArg` / `imageMode`                                  | Indicador de ruta de imagen y cómo pasar varias imágenes (`repeat` o `list`)              |
| `imagePathScope`                                          | Dónde se almacenan los archivos de imagen preparados antes de la entrega: `temp` o `workspace`               |
| `serialize`                                               | Mantiene ordenadas las ejecuciones del mismo backend                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | Habilita la reinicialización acotada a partir de la transcripción sin procesar antes de Compaction para restablecer sesiones de forma segura |
| `reliability.watchdog`                                    | Ajuste del tiempo de espera sin salida, por separado para ejecuciones nuevas y reanudadas                      |

Prefiera la configuración estática más pequeña que se adapte a la CLI. Añada devoluciones de llamada del plugin solo para comportamientos que realmente correspondan al backend.

## Enlaces avanzados del backend

`CliBackendPlugin` también puede definir:

| Enlace                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Normaliza el adaptador estático registrado con el contexto del entorno de ejecución                |
| `resolveExecutionArgs(ctx)`        | Añade indicadores del ámbito de la solicitud, como el esfuerzo de razonamiento o el aislamiento de preguntas secundarias |
| `prepareExecution(ctx)`            | Crea puentes temporales de autenticación, configuración o entorno antes del inicio         |
| `transformSystemPrompt(ctx)`       | Aplica una transformación final del prompt del sistema específica de la CLI                          |
| `textTransforms`                   | Sustituciones bidireccionales de prompts y salidas                                    |
| `defaultAuthProfileId`             | Da preferencia a un perfil de autenticación específico de OpenClaw                                     |
| `authEpochMode`                    | Decide cómo los cambios de autenticación invalidan las sesiones de CLI almacenadas                      |
| `nativeToolMode`                   | Declara si las herramientas nativas están ausentes, siempre activas o pueden ser seleccionadas por el host      |
| `sideQuestionToolMode`             | Declara las herramientas nativas deshabilitadas para las preguntas secundarias de `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | Habilita el puente de herramientas MCP de bucle invertido de OpenClaw                                |
| `ownsNativeCompaction`             | El backend administra su propia Compaction; OpenClaw la delega                           |
| `subscriptionAuthDispatch`         | Las ejecuciones integradas habilitadas que usan credenciales de suscripción se realizan mediante este backend |
| `runtimeArtifact`                  | Limita un iniciador de scripts a su árbol completo de paquetes incluidos                |

Mantenga estos enlaces bajo la responsabilidad del proveedor. No añada ramas específicas de la CLI al núcleo cuando un enlace del backend pueda expresar el comportamiento.

`prepareExecution(ctx)` recibe `ctx.contextTokenBudget`, el límite efectivo de tokens
seleccionado para la ejecución. Los backends que gestionan la Compaction nativa pueden asignar ese
presupuesto a su contrato de inicio específico de la CLI.

`runtimeArtifact` pertenece al plugin. Se consulta
solo cuando un turno de inferencia en vivo emite o revalida una autoridad de configuración verificada;
las ejecuciones normales de la CLI no lo requieren. Un backend sin esta declaración no puede
emitir autoridad de configuración verificada de la CLI. Una declaración `bundled-package-tree` nombra
al propietario exacto de `package.json` y exige que el punto de entrada del paquete sea el
comando. OpenClaw calcula el hash del árbol completo y acotado del paquete instalado, incluidas
las dependencias anidadas, y adopta un cierre seguro ante enlaces simbólicos de redirección,
iniciadores externos al paquete declarado, declaraciones obligatorias de dependencias
externas, árboles sobredimensionados y scripts desconocidos. Declárelo solo cuando ese
árbol contenga la implementación completa de inferencia; las integraciones de herramientas opcionales
no hacen que un grafo de implementación externo sea seguro.

Si el mismo backend también incluye un ejecutable nativo autocontenido, indique sus
nombres base canónicos en `nativeExecutableNames`. Los demás comandos nativos permanecen
sin verificar.

`ctx.executionMode` es `"agent"` para los turnos normales y `"side-question"` para
las llamadas efímeras `/btw`. Úselo cuando la CLI necesite distintas opciones de ejecución única,
como deshabilitar las herramientas nativas, la persistencia de sesión o el comportamiento de reanudación para
BTW. Si un backend normalmente tiene `nativeToolMode: "always-on"`, pero sus
argumentos de pregunta secundaria deshabilitan esas herramientas de forma fiable, establezca también
`sideQuestionToolMode: "disabled"`; de lo contrario, OpenClaw adopta un cierre seguro cuando BTW
requiere una ejecución de la CLI sin herramientas.

Establezca `nativeToolMode: "selectable"` solo cuando `resolveExecutionArgs` pueda deshabilitar
todas las herramientas nativas del backend para una ejecución individual. Para esas ejecuciones restringidas,
`ctx.toolAvailability.native` es la lista exacta de herramientas nativas del backend y
`ctx.toolAvailability.mcp` es la lista exacta de MCP permitidos y aislados por el host. El hook
debe reemplazar las opciones de herramientas que entren en conflicto, deshabilitar las superficies de personalización del backend
que puedan ejecutarse fuera de esas herramientas y devolver argumentos que apliquen ambos
valores. OpenClaw lo llama una vez con los argumentos finales de inicio nuevo o reanudación y adopta un
cierre seguro cuando el backend no puede aplicar la restricción. Los nombres de MCP en este
contexto pueden aprobarse automáticamente de forma segura solo porque el host ya ha limitado la
configuración de MCP generada a esos servidores y herramientas.

Para admitir límites de ejecución de OpenClaw, como `toolsAllow` de cron, implemente también
`resolveRuntimeToolAvailability(ctx)`. OpenClaw proporciona una lista de permitidos normalizada
y con los grupos expandidos, y siempre deshabilita las herramientas nativas del backend. Devuelva únicamente
nombres de MCP aislados por el host seleccionados de esa lista de permitidos. Devolver `null` o
`undefined` mantiene el cierre seguro del ejecutor genérico. Un backend puede omitir una herramienta
permitida que no pueda representar, pero nunca debe añadir autoridad ausente de la
lista de permitidos. Antes de emitir una concesión, el host rechaza cualquier entrada devuelta que no sea
el nombre exacto `mcp__openclaw__<tool>` de una de las herramientas permitidas.

### `ownsNativeCompaction`: exclusión de la Compaction de OpenClaw

Si el backend ejecuta un agente que compacta su **propia** transcripción, establezca
`ownsNativeCompaction: true` para que el resumidor de protección de OpenClaw nunca se ejecute
en sus sesiones: el ciclo de vida de Compaction de la CLI no realiza ninguna operación y el
turno continúa. `claude-cli` lo declara porque Claude Code compacta
internamente sin ningún endpoint del arnés. En cambio, las sesiones con arnés nativo, como Codex,
siguen dirigiéndose a su endpoint de Compaction del arnés.

**Declárelo únicamente cuando se cumpla todo lo siguiente**; de lo contrario, una sesión aplazada
que supere el presupuesto puede permanecer por encima de este o quedar obsoleta (OpenClaw ya no
la rescata):

- el backend compacta o limita de forma fiable su propia transcripción cuando se acerca a su
  ventana;
- mantiene una sesión reanudable para que el estado compactado persista entre turnos
  (por ejemplo, `--resume` / `--session-id`);
- no es una sesión de Compaction con arnés nativo: las sesiones que coinciden con `agentHarnessId`
  se dirigen en su lugar al endpoint del arnés.

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
| `codex-config-overrides` | CLI que aceptan anulaciones de configuración en los argumentos                        |
| `gemini-system-settings` | CLI que leen la configuración de MCP desde el directorio de configuración del sistema |

Habilite el puente únicamente cuando la CLI pueda consumirlo realmente. Si la CLI tiene
su propia capa de herramientas integrada que no puede deshabilitarse, establezca `nativeToolMode:
"always-on"` para que OpenClaw pueda adoptar un cierre seguro cuando una llamada exija que no haya herramientas
nativas. Si puede deshabilitar todas las herramientas nativas en cada ejecución, use `"selectable"` con el
contrato `resolveExecutionArgs` descrito anteriormente.

## Selección del backend

Los usuarios seleccionan un backend independiente mediante el prefijo de su referencia de modelo. Un backend que
declare un `modelProvider` canónico puede seleccionarse en su lugar mediante el
`agentRuntime.id` de ese modelo de proveedor. La mecánica del adaptador permanece en el plugin:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Coloque las credenciales en los perfiles de autenticación de OpenClaw o en la configuración propiedad del plugin. Asegúrese de que el
comando registrado esté en el `PATH` del servicio Gateway; las implementaciones que necesiten una
ruta o argumentos diferentes deben cambiar o envolver el registro del plugin.

## Verificación

Para los plugins incluidos, añada una prueba específica del constructor y del registro
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
rutas con la CLI real. No dependa de la inspección estática para el comportamiento de prompts, imágenes,
MCP o reanudación de sesiones.

## Lista de comprobación

<Check>`package.json` tiene `openclaw.extensions` y entradas de ejecución compiladas para los paquetes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` y `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente cuando la configuración o el descubrimiento de modelos debe detectar el backend en frío</Check>
<Check>`api.registerCliBackend(...)` usa el mismo identificador de backend que el manifiesto</Check>
<Check>El prefijo del modelo del backend o el `agentRuntime.id` con ámbito de modelo selecciona el registro</Check>
<Check>La configuración de sesión, prompt del sistema, imagen y analizador de salida coincide con el contrato real de la CLI</Check>
<Check>Las pruebas específicas y al menos una prueba de humo de la CLI en vivo demuestran la ruta del backend</Check>

## Contenido relacionado

- [Backends de CLI](/es/gateway/cli-backends) - selección y comportamiento en tiempo de ejecución
- [Creación de plugins](/es/plugins/building-plugins) - conceptos básicos de paquetes y manifiestos
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview) - referencia de la API de registro
- [Manifiesto del plugin](/es/plugins/manifest) - `cliBackends` y descriptores de configuración
- [Arnés del agente](/es/plugins/sdk-agent-harness) - entornos de ejecución completos para agentes externos
